import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import type { Patient } from '../types.js';

export const patientsRouter = Router();

interface PatientRow {
  id: string;
  ci: string;
  name: string;
  age: number | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  insurance: string | null;
  blood_type: string | null;
  allergies: string;
  chronic_conditions: string;
  consent_signed: number;
}

function toPatient(r: PatientRow): Patient {
  return {
    id: r.id,
    ci: r.ci,
    name: r.name,
    age: r.age ?? 0,
    birthDate: r.birth_date ?? '',
    phone: r.phone ?? '',
    email: r.email ?? '',
    address: r.address ?? '',
    insurance: r.insurance ?? '',
    bloodType: r.blood_type ?? '',
    allergies: JSON.parse(r.allergies || '[]') as string[],
    chronicConditions: JSON.parse(r.chronic_conditions || '[]') as string[],
    consentSigned: Boolean(r.consent_signed),
  };
}

patientsRouter.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM patients ORDER BY id').all() as PatientRow[];
  res.json({ patients: rows.map(toPatient) });
});

patientsRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id) as PatientRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Paciente no encontrado' });
    return;
  }
  res.json({ patient: toPatient(row) });
});

const patientSchema = z.object({
  ci: z.string().min(1),
  name: z.string().min(1),
  age: z.number().int().nonnegative().optional(),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  insurance: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  consentSigned: z.boolean().optional(),
});

patientsRouter.post('/', (req, res) => {
  const parsed = patientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join('; ') });
    return;
  }
  const data = parsed.data;
  const max = db.prepare("SELECT MAX(CAST(REPLACE(id, 'MED-', '') AS INTEGER)) AS m FROM patients").get() as { m: number | null };
  const next = (max.m ?? 0) + 1;
  const id = 'MED-' + String(next).padStart(4, '0');
  const ci = data.ci.includes('-') ? data.ci : data.ci;
  db.prepare(`
    INSERT INTO patients (id, ci, name, age, birth_date, phone, email, address, insurance, blood_type, allergies, chronic_conditions, consent_signed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    ci,
    data.name,
    data.age ?? null,
    data.birthDate ?? null,
    data.phone ?? null,
    data.email ?? null,
    data.address ?? null,
    data.insurance ?? null,
    data.bloodType ?? null,
    JSON.stringify(data.allergies ?? []),
    JSON.stringify(data.chronicConditions ?? []),
    data.consentSigned ? 1 : 0,
  );
  const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(id) as PatientRow;
  res.status(201).json({ patient: toPatient(row) });
});

patientsRouter.get('/:id/consultations', (req, res) => {
  const rows = db.prepare('SELECT * FROM consultations WHERE patient_id = ? ORDER BY date DESC, time DESC').all(req.params.id) as Array<{
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
  }>;
  const doctors = new Map(
    (db.prepare('SELECT id, name FROM doctors').all() as Array<{ id: string; name: string }>).map((d) => [d.id, d.name]),
  );
  const patients = new Map(
    (db.prepare('SELECT id, name FROM patients').all() as Array<{ id: string; name: string }>).map((p) => [p.id, p.name]),
  );
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