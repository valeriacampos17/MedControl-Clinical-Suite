import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { toIsoDate, toIsoTime } from '../services/dates.js';

export const consultationsRouter = Router();

interface ConsultationRow {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  date: string;
  time: string;
  type: string;
  chief_complaint: string | null;
  history_of_present_illness: string | null;
  physical_exam: string | null;
  vitals: string | null;
  diagnosis_code: string | null;
  diagnosis_description: string | null;
  treatment_plan: string | null;
  notes: string | null;
  status: string;
}

interface PhotoRow {
  id: string;
  consultation_id: string;
  patient_id: string;
  data_url: string;
  caption: string | null;
  taken_at: string;
}

function toPhoto(r: PhotoRow) {
  return {
    id: r.id,
    consultationId: r.consultation_id,
    patientId: r.patient_id,
    dataUrl: r.data_url,
    caption: r.caption ?? '',
    takenAt: r.taken_at,
  };
}

consultationsRouter.get('/', (req, res) => {
  const { patientId } = req.query;
  const patients = new Map(
    (db.prepare('SELECT id, name FROM patients').all() as Array<{ id: string; name: string }>).map((p) => [p.id, p.name]),
  );
  const doctors = new Map(
    (db.prepare('SELECT id, name FROM doctors').all() as Array<{ id: string; name: string }>).map((d) => [d.id, d.name]),
  );
  const sql = patientId
    ? db.prepare('SELECT * FROM consultations WHERE patient_id = ? ORDER BY date DESC, time DESC')
    : db.prepare('SELECT * FROM consultations ORDER BY date DESC, time DESC');
  const rows = (patientId ? sql.all(String(patientId)) : sql.all()) as ConsultationRow[];
  res.json({
    consultations: rows.map((r) => ({
      id: r.id,
      patientId: r.patient_id,
      patientName: patients.get(r.patient_id) ?? '',
      doctorName: (r.doctor_id && doctors.get(r.doctor_id)) ?? '',
      date: r.date,
      time: r.time,
      type: r.type,
      chiefComplaint: r.chief_complaint ?? '',
      historyOfPresentIllness: r.history_of_present_illness ?? '',
      physicalExam: r.physical_exam ?? '',
      vitals: JSON.parse(r.vitals || '{}'),
      diagnosisCode: r.diagnosis_code ?? '',
      diagnosisDescription: r.diagnosis_description ?? '',
      treatmentPlan: r.treatment_plan ?? '',
      notes: r.notes ?? '',
      status: r.status,
    })),
  });
});

const consultationSchema = z.object({
  patientId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  type: z.string().min(1),
  chiefComplaint: z.string().optional(),
  historyOfPresentIllness: z.string().optional(),
  physicalExam: z.string().optional(),
  vitals: z.any().optional(),
  diagnosisCode: z.string().optional(),
  diagnosisDescription: z.string().optional(),
  treatmentPlan: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'completed']).optional(),
});

consultationsRouter.post('/', (req, res) => {
  const parsed = consultationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join('; ') });
    return;
  }
  const data = parsed.data;
  const patient = db.prepare('SELECT id FROM patients WHERE id = ?').get(data.patientId);
  if (!patient) {
    res.status(404).json({ error: 'Paciente no encontrado' });
    return;
  }
  const date = toIsoDate(data.date);
  const time = toIsoTime(data.time);
  if (!date || !time) {
    res.status(400).json({ error: `La fecha (${data.date}) o la hora (${data.time}) no tienen un formato valido` });
    return;
  }
  const id = 'CONS-' + new Date().getTime();
  const doctorId = (req.auth?.doctorId) ?? null;
  db.prepare(`
    INSERT INTO consultations (id, patient_id, doctor_id, date, time, type, chief_complaint, history_of_present_illness, physical_exam, vitals, diagnosis_code, diagnosis_description, treatment_plan, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.patientId,
    doctorId,
    date,
    time,
    data.type,
    data.chiefComplaint ?? null,
    data.historyOfPresentIllness ?? null,
    data.physicalExam ?? null,
    data.vitals ? JSON.stringify(data.vitals) : null,
    data.diagnosisCode ?? null,
    data.diagnosisDescription ?? null,
    data.treatmentPlan ?? null,
    data.notes ?? null,
    data.status ?? 'completed',
  );
  const row = db.prepare('SELECT * FROM consultations WHERE id = ?').get(id) as ConsultationRow;
  res.status(201).json({ consultation: row });
});

consultationsRouter.get('/:id/photos', (req, res) => {
  const consultation = db.prepare('SELECT id FROM consultations WHERE id = ?').get(req.params.id);
  if (!consultation) {
    res.status(404).json({ error: 'Consulta no encontrada' });
    return;
  }
  const rows = db
    .prepare('SELECT * FROM consultation_photos WHERE consultation_id = ? ORDER BY ord, taken_at')
    .all(req.params.id) as PhotoRow[];
  res.json({ photos: rows.map(toPhoto) });
});

const consultationPhotoSchema = z.object({
  dataUrl: z.string().min(1),
  caption: z.string().optional(),
});

consultationsRouter.post('/:id/photos', (req, res) => {
  const parsed = consultationPhotoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join('; ') });
    return;
  }
  const consultation = db
    .prepare('SELECT id, patient_id FROM consultations WHERE id = ?')
    .get(req.params.id) as { id: string; patient_id: string } | undefined;
  if (!consultation) {
    res.status(404).json({ error: 'Consulta no encontrada' });
    return;
  }
  const max = db
    .prepare('SELECT MAX(ord) AS m FROM consultation_photos WHERE consultation_id = ?')
    .get(req.params.id) as { m: number | null };
  const id = 'CPH-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  db.prepare(`
    INSERT INTO consultation_photos (id, consultation_id, patient_id, data_url, caption, ord)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    consultation.id,
    consultation.patient_id,
    parsed.data.dataUrl,
    parsed.data.caption ?? null,
    (max.m ?? -1) + 1,
  );
  const row = db.prepare('SELECT * FROM consultation_photos WHERE id = ?').get(id) as PhotoRow;
  res.status(201).json({ photo: toPhoto(row) });
});

consultationsRouter.delete('/:id/photos/:photoId', (req, res) => {
  const result = db
    .prepare('DELETE FROM consultation_photos WHERE id = ? AND consultation_id = ?')
    .run(req.params.photoId, req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Foto no encontrada' });
    return;
  }
  res.json({ ok: true });
});