import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';

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
  const id = 'CONS-' + new Date().getTime();
  const doctorId = (req.auth?.doctorId) ?? null;
  db.prepare(`
    INSERT INTO consultations (id, patient_id, doctor_id, date, time, type, chief_complaint, history_of_present_illness, physical_exam, vitals, diagnosis_code, diagnosis_description, treatment_plan, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.patientId,
    doctorId,
    data.date,
    data.time,
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