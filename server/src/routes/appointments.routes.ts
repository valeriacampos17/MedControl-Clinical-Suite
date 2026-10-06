import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { classifyTriage } from '../services/triage.js';
import { assertBookable, normalizeTime } from '../services/availability.js';
import type { AppointmentItem, TriageVitals } from '../types.js';

export const appointmentsRouter = Router();

interface AppointmentRow {
  id: string;
  date: string;
  time: string;
  duration_minutes: number;
  patient_id: string;
  doctor_id: string;
  reason: string;
  status: string;
  consultation_type_id: string | null;
  relative_time: string | null;
}

interface TriageVitalsRow {
  systolic: number;
  diastolic: number;
  pulse: number;
  temperature: number;
  spo2: number;
}

function toAppointment(r: AppointmentRow): AppointmentItem {
  const vitalsRow = db.prepare('SELECT systolic, diastolic, pulse, temperature, spo2 FROM triage_vitals WHERE appointment_id = ?').get(r.id) as TriageVitalsRow | undefined;
  return {
    id: r.id,
    date: r.date,
    time: r.time,
    durationMinutes: r.duration_minutes,
    patientId: r.patient_id ?? '',
    doctorId: r.doctor_id ?? '',
    reason: r.reason,
    status: r.status as AppointmentItem['status'],
    relativeTime: r.relative_time ?? undefined,
    vitals: vitalsRow
      ? {
          bp: `${vitalsRow.systolic}/${vitalsRow.diastolic}`,
          pulse: vitalsRow.pulse,
          temp: vitalsRow.temperature,
          spo2: vitalsRow.spo2,
        }
      : undefined,
  };
}

appointmentsRouter.get('/', (req, res) => {
  const { date, doctorId } = req.query;
  let rows: AppointmentRow[];
  if (date && doctorId) {
    rows = db.prepare('SELECT * FROM appointments WHERE date = ? AND doctor_id = ? ORDER BY time').all(String(date), String(doctorId)) as AppointmentRow[];
  } else if (date) {
    rows = db.prepare('SELECT * FROM appointments WHERE date = ? ORDER BY time').all(String(date)) as AppointmentRow[];
  } else {
    rows = db.prepare('SELECT * FROM appointments ORDER BY date, time').all() as AppointmentRow[];
  }
  res.json({ appointments: rows.map(toAppointment) });
});

const appointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
  // Acepta HH:MM y tambien 'h:mm AM/PM'; se guarda siempre en 24 horas.
  time: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  reason: z.string().min(1),
  consultationTypeId: z.enum(['primera', 'control', 'sobrecupo', 'examenes']).optional(),
});

appointmentsRouter.post('/', (req, res) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join('; ') });
    return;
  }
  const data = parsed.data;
  const time = normalizeTime(data.time);
  if (!time) {
    res.status(400).json({ error: `El horario "${data.time}" no es valido` });
    return;
  }

  // Sin db.transaction(): en una replica embebida de libsql la escritura se
  // delega al primario, el COMMIT falla y el error original queda tapado por el
  // ROLLBACK. La validacion y el INSERT son sincronicos, sin un await en el
  // medio, asi que ninguna otra peticion se cuela entre los dos en este proceso.
  const verdict = assertBookable({
    doctorId: data.doctorId,
    date: data.date,
    time,
    durationMinutes: data.durationMinutes,
  });
  if (!verdict.ok) {
    res.status(409).json({ error: verdict.message, reason: verdict.reason });
    return;
  }

  const createdId = 'APT-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  db.prepare(`
    INSERT INTO appointments (id, date, time, duration_minutes, patient_id, doctor_id, reason, status, consultation_type_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(createdId, data.date, time, data.durationMinutes, data.patientId, data.doctorId, data.reason, data.consultationTypeId ?? null);

  const row = db.prepare('SELECT * FROM appointments WHERE id = ?').get(createdId) as AppointmentRow;
  res.status(201).json({ appointment: toAppointment(row) });
});

appointmentsRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id) as AppointmentRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Cita no encontrada' });
    return;
  }
  res.json({ appointment: toAppointment(row) });
});

const statusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'checked-in', 'in-triage', 'triaged', 'in-progress', 'completed', 'break', 'no-show']),
});

appointmentsRouter.patch('/:id/status', (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join('; ') });
    return;
  }
  const existing = db.prepare('SELECT id FROM appointments WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Cita no encontrada' });
    return;
  }
  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(parsed.data.status, req.params.id);
  const row = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id) as AppointmentRow;
  res.json({ appointment: toAppointment(row) });
});

appointmentsRouter.patch('/:id/start-triage', (req, res) => {
  const existing = db.prepare('SELECT id FROM appointments WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Cita no encontrada' });
    return;
  }
  db.prepare("UPDATE appointments SET status = 'in-triage' WHERE id = ?").run(req.params.id);
  const row = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id) as AppointmentRow;
  res.json({ appointment: toAppointment(row) });
});

const triageSchema = z.object({
  systolic: z.number().nullable(),
  diastolic: z.number().nullable(),
  pulse: z.number().nullable(),
  temp: z.number().nullable(),
  spo2: z.number().nullable(),
  weight: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  notes: z.string().optional(),
});

appointmentsRouter.patch('/:id/complete-triage', (req, res) => {
  const parsed = triageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join('; ') });
    return;
  }
  const existing = db.prepare('SELECT id FROM appointments WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Cita no encontrada' });
    return;
  }
  const v = parsed.data as TriageVitals;
  const result = classifyTriage(v);
  const systolic = v.systolic ?? 0;
  const diastolic = v.diastolic ?? 0;
  const pulse = v.pulse ?? 0;
  const temp = v.temp ?? 0;
  const spo2 = v.spo2 ?? 0;
  db.prepare(`
    INSERT INTO triage_vitals (appointment_id, systolic, diastolic, pulse, temperature, spo2, weight, height, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(appointment_id) DO UPDATE SET
      systolic = excluded.systolic,
      diastolic = excluded.diastolic,
      pulse = excluded.pulse,
      temperature = excluded.temperature,
      spo2 = excluded.spo2,
      weight = excluded.weight,
      height = excluded.height,
      notes = excluded.notes
  `).run(req.params.id, systolic, diastolic, pulse, temp, spo2, v.weight ?? null, v.height ?? null, v.notes ?? null);
  db.prepare("UPDATE appointments SET status = 'triaged' WHERE id = ?").run(req.params.id);
  const row = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id) as AppointmentRow;
  res.json({ appointment: toAppointment(row), triage: result });
});

const rescheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
  time: z.string().min(1),
});

appointmentsRouter.patch('/:id/reschedule', (req, res) => {
  const parsed = rescheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join('; ') });
    return;
  }
  const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id) as
    | AppointmentRow
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Cita no encontrada' });
    return;
  }
  const time = normalizeTime(parsed.data.time);
  if (!time) {
    res.status(400).json({ error: `El horario "${parsed.data.time}" no es valido` });
    return;
  }
  // Se excluye la propia cita del chequeo de solapes, asi puede moverla de hora.
  const verdict = assertBookable({
    doctorId: existing.doctor_id,
    date: parsed.data.date,
    time,
    durationMinutes: existing.duration_minutes,
    ignoreAppointmentId: existing.id,
  });
  if (!verdict.ok) {
    res.status(409).json({ error: verdict.message, reason: verdict.reason });
    return;
  }
  db.prepare('UPDATE appointments SET date = ?, time = ? WHERE id = ?').run(parsed.data.date, time, req.params.id);
  const row = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id) as AppointmentRow;
  res.json({ appointment: toAppointment(row) });
});

appointmentsRouter.patch('/:id/cancel-triage', (req, res) => {
  const existing = db.prepare('SELECT id FROM appointments WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Cita no encontrada' });
    return;
  }
  db.prepare("UPDATE appointments SET status = 'checked-in' WHERE id = ?").run(req.params.id);
  const row = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id) as AppointmentRow;
  res.json({ appointment: toAppointment(row) });
});