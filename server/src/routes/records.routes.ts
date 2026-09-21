import { Router } from 'express';
import { db } from '../db/connection.js';

export const recordsRouter = Router();

interface PrescriptionRow {
  id: string;
  patient_id: string | null;
  doctor_id: string | null;
  consultation_id: string | null;
  patient_name: string | null;
  ci: string | null;
  date: string;
  time: string;
  notes: string | null;
  status: string;
}

interface PrescriptionMedRow {
  name: string;
  dose: string | null;
  frequency: string | null;
  duration: string | null;
}

function patientNameOf(patientId: string | null): string {
  if (!patientId) return '';
  const row = db.prepare('SELECT name FROM patients WHERE id = ?').get(patientId) as { name: string } | undefined;
  return row?.name ?? '';
}

function doctorNameOf(doctorId: string | null): string {
  if (!doctorId) return '';
  const row = db.prepare('SELECT name FROM doctors WHERE id = ?').get(doctorId) as { name: string } | undefined;
  return row?.name ?? '';
}

function toPrescription(r: PrescriptionRow): Record<string, unknown> {
  const meds = db.prepare('SELECT name, dose, frequency, duration FROM prescription_medications WHERE prescription_id = ? ORDER BY id').all(r.id) as PrescriptionMedRow[];
  return {
    id: r.id,
    consultationId: r.consultation_id ?? undefined,
    patientId: r.patient_id ?? '',
    patientName: r.patient_name ?? patientNameOf(r.patient_id),
    ci: r.ci ?? '',
    doctorName: doctorNameOf(r.doctor_id),
    date: r.date,
    time: r.time,
    meds: meds.map((m) => ({ name: m.name, dose: m.dose ?? '', frequency: m.frequency ?? '', duration: m.duration ?? '' })),
    notes: r.notes ?? '',
    status: r.status,
  };
}

recordsRouter.get('/prescriptions', (req, res) => {
  const { patientId, consultationId } = req.query;
  let rows: PrescriptionRow[];
  if (patientId) {
    rows = db.prepare('SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY date DESC, time DESC').all(String(patientId)) as PrescriptionRow[];
  } else if (consultationId) {
    rows = db.prepare('SELECT * FROM prescriptions WHERE consultation_id = ? ORDER BY date DESC, time DESC').all(String(consultationId)) as PrescriptionRow[];
  } else {
    rows = db.prepare('SELECT * FROM prescriptions ORDER BY date DESC, time DESC').all() as PrescriptionRow[];
  }
  res.json({ prescriptions: rows.map(toPrescription) });
});

recordsRouter.post('/prescriptions', (req, res) => {
  const body = req.body ?? {};
  const { patientId, consultationId, date, time, meds, notes, status, ci } = body;
  if (!patientId || !date || !time || !Array.isArray(meds)) {
    res.status(400).json({ error: 'patientId, date, time y meds son requeridos' });
    return;
  }
  const id = 'RX-' + new Date().getTime();
  const patientName = patientNameOf(String(patientId));
  db.prepare(`
    INSERT INTO prescriptions (id, patient_id, doctor_id, consultation_id, patient_name, ci, date, time, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    String(patientId),
    req.auth?.doctorId ?? null,
    consultationId ? String(consultationId) : null,
    patientName,
    ci ? String(ci) : null,
    String(date),
    String(time),
    notes ? String(notes) : null,
    String(status ?? 'Vigente en Farmacia'),
  );
  const insertMed = db.prepare('INSERT INTO prescription_medications (prescription_id, name, dose, frequency, duration) VALUES (?, ?, ?, ?, ?)');
  for (const m of meds) {
    insertMed.run(id, String(m.name ?? ''), m.dose ?? null, m.frequency ?? null, m.duration ?? null);
  }
  const row = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(id) as PrescriptionRow;
  res.status(201).json({ prescription: toPrescription(row) });
});

interface ExamOrderRow {
  id: string;
  consultation_id: string;
  patient_id: string;
  doctor_id: string | null;
  patient_name: string;
  doctor_name: string;
  date: string;
  time: string;
  priority: string;
  notes: string | null;
  status: string;
}

interface ExamOrderItemRow {
  exam_id: string;
  name: string;
  category: string;
  fasting: number;
  preparation: string | null;
}

function toExamOrder(r: ExamOrderRow): Record<string, unknown> {
  const items = db.prepare('SELECT exam_id, name, category, fasting, preparation FROM exam_order_items WHERE order_id = ? ORDER BY id').all(r.id) as ExamOrderItemRow[];
  return {
    id: r.id,
    consultationId: r.consultation_id,
    patientId: r.patient_id,
    patientName: r.patient_name,
    doctorName: r.doctor_name || doctorNameOf(r.doctor_id),
    date: r.date,
    time: r.time,
    priority: r.priority,
    notes: r.notes ?? '',
    items: items.map((i) => ({ examId: i.exam_id, name: i.name, category: i.category, fasting: Boolean(i.fasting), preparation: i.preparation ?? '' })),
    status: r.status,
  };
}

recordsRouter.get('/exam-orders', (req, res) => {
  const { patientId, consultationId } = req.query;
  let rows: ExamOrderRow[];
  if (patientId) {
    rows = db.prepare('SELECT * FROM exam_orders WHERE patient_id = ? ORDER BY date DESC, time DESC').all(String(patientId)) as ExamOrderRow[];
  } else if (consultationId) {
    rows = db.prepare('SELECT * FROM exam_orders WHERE consultation_id = ? ORDER BY date DESC, time DESC').all(String(consultationId)) as ExamOrderRow[];
  } else {
    rows = db.prepare('SELECT * FROM exam_orders ORDER BY date DESC, time DESC').all() as ExamOrderRow[];
  }
  res.json({ examOrders: rows.map(toExamOrder) });
});

recordsRouter.post('/exam-orders', (req, res) => {
  const body = req.body ?? {};
  const { consultationId, patientId, date, time, priority, notes, items } = body;
  if (!consultationId || !patientId || !date || !time || !Array.isArray(items)) {
    res.status(400).json({ error: 'consultationId, patientId, date, time e items son requeridos' });
    return;
  }
  const id = 'ORD-' + new Date().getTime();
  db.prepare(`
    INSERT INTO exam_orders (id, consultation_id, patient_id, doctor_id, patient_name, doctor_name, date, time, priority, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    String(consultationId),
    String(patientId),
    req.auth?.doctorId ?? null,
    patientNameOf(String(patientId)),
    doctorNameOf(req.auth?.doctorId ?? null),
    String(date),
    String(time),
    String(priority ?? 'rutina'),
    notes ? String(notes) : null,
    String(body.status ?? 'pending'),
  );
  const insertItem = db.prepare('INSERT INTO exam_order_items (order_id, exam_id, name, category, fasting, preparation) VALUES (?, ?, ?, ?, ?, ?)');
  for (const it of items) {
    insertItem.run(id, String(it.examId ?? ''), String(it.name ?? ''), String(it.category ?? 'laboratorio'), it.fasting ? 1 : 0, it.preparation ?? null);
  }
  const row = db.prepare('SELECT * FROM exam_orders WHERE id = ?').get(id) as ExamOrderRow;
  res.status(201).json({ examOrder: toExamOrder(row) });
});