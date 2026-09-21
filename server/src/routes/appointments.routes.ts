import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { classifyTriage } from '../services/triage.js';
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
  date: z.string().min(1),
  time: z.string().min(1),
});

appointmentsRouter.patch('/:id/reschedule', (req, res) => {
  const parsed = rescheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join('; ') });
    return;
  }
  const existing = db.prepare('SELECT id FROM appointments WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Cita no encontrada' });
    return;
  }
  db.prepare('UPDATE appointments SET date = ?, time = ? WHERE id = ?').run(parsed.data.date, parsed.data.time, req.params.id);
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