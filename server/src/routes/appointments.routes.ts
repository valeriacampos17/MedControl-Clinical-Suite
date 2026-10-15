import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { classifyTriage } from '../services/triage.js';
import { assertBookable, normalizeTime } from '../services/availability.js';
import type { AppointmentItem, TriageVitals } from '../types.js';

export const appointmentsRouter = Router();

function triageEnabled(): boolean {
  const row = db.prepare('SELECT triage_enabled FROM organization_settings LIMIT 1').get() as { triage_enabled: number } | undefined;
  return !row || row.triage_enabled !== 0;
}

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

const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'checked-in', 'in-triage', 'triaged', 'in-progress', 'completed', 'no-show'] as const;

const historyQuerySchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateFrom debe ser YYYY-MM-DD').optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateTo debe ser YYYY-MM-DD').optional(),
  doctorId: z.string().min(1).optional(),
  patientId: z.string().min(1).optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// Historial completo con filtros de rango/doctor/paciente/estado y stats agregadas
// (pre-LIMIT, para que los KPIs del frontend no dependan de la pagina cargada).
// Excluye 'break': los bloqueos de disponibilidad no son citas.
appointmentsRouter.get('/history', (req, res) => {
  const parsed = historyQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join('; ') });
    return;
  }
  const { dateFrom, dateTo, doctorId, patientId, limit, offset } = parsed.data;

  const clauses: string[] = ["status != 'break'"];
  const params: (string | number)[] = [];
  if (dateFrom) {
    clauses.push('date >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    clauses.push('date <= ?');
    params.push(dateTo);
  }
  if (doctorId) {
    clauses.push('doctor_id = ?');
    params.push(doctorId);
  }
  if (patientId) {
    clauses.push('patient_id = ?');
    params.push(patientId);
  }
  if (parsed.data.status) {
    const statuses = parsed.data.status.split(',').map((s) => s.trim()).filter(Boolean);
    const invalid = statuses.filter((s) => !(APPOINTMENT_STATUSES as readonly string[]).includes(s));
    if (invalid.length > 0) {
      res.status(400).json({ error: `Estados invalidos: ${invalid.join(', ')}` });
      return;
    }
    if (statuses.length === 0) {
      res.json({ appointments: [], total: 0, stats: { total: 0, completed: 0, notFinished: 0, noShow: 0, attendancePct: null } });
      return;
    }
    clauses.push(`status IN (${statuses.map(() => '?').join(', ')})`);
    params.push(...statuses);
  }

  const where = `WHERE ${clauses.join(' AND ')}`;
  const rows = db.prepare(`SELECT * FROM appointments ${where} ORDER BY date DESC, time DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as AppointmentRow[];
  const agg = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'completed') AS completed,
      SUM(status = 'no-show') AS noShow,
      SUM(status IN ('pending', 'confirmed', 'checked-in', 'in-triage', 'triaged', 'in-progress')) AS notFinished
    FROM appointments ${where}
  `).get(...params) as { total: number; completed: number | null; noShow: number | null; notFinished: number | null };

  const total = agg.total ?? 0;
  const completed = agg.completed ?? 0;
  const noShow = agg.noShow ?? 0;
  const notFinished = agg.notFinished ?? 0;
  const attended = completed + noShow;

  res.json({
    appointments: rows.map(toAppointment),
    total,
    stats: {
      total,
      completed,
      notFinished,
      noShow,
      attendancePct: attended > 0 ? Math.round((completed / attended) * 1000) / 10 : null,
    },
  });
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
  if (!triageEnabled()) {
    res.status(400).json({ error: 'El módulo de triaje está deshabilitado en la configuración de la organización' });
    return;
  }
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
  if (!triageEnabled()) {
    res.status(400).json({ error: 'El módulo de triaje está deshabilitado en la configuración de la organización' });
    return;
  }
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