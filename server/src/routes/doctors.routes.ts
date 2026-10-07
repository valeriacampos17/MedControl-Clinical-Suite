import { Router } from 'express';
import { db } from '../db/connection.js';
import type { Doctor } from '../types.js';

export const doctorsRouter = Router();

interface DoctorRow {
  id: string;
  name: string;
  short_name: string | null;
  specialty: string;
  active_today: number;
  avatar_url: string | null;
}

doctorsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM doctors ORDER BY id').all() as DoctorRow[];
  res.json({
    doctors: rows.map((d) => ({
      id: d.id,
      name: d.name,
      shortName: d.short_name ?? '',
      specialty: d.specialty,
      activeToday: Boolean(d.active_today),
      avatarUrl: d.avatar_url ?? '',
    })),
  });
});

doctorsRouter.post('/', (req, res) => {
  const body = req.body ?? {};
  const name = String(body.name ?? '').trim();
  if (!name) {
    res.status(400).json({ error: 'name es requerido' });
    return;
  }
  const specialty = String(body.specialty ?? '').trim() || 'Medicina General';
  const shortName = String(body.shortName ?? '').trim() || name;
  const id = body.id ? String(body.id) : 'doc-' + Date.now().toString().slice(-6);
  db.prepare('INSERT INTO doctors (id, name, short_name, specialty, active_today, avatar_url) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, shortName, specialty, body.active === false ? 0 : 1, body.avatarUrl ?? null);
  res.status(201).json({
    doctor: { id, name, shortName, specialty, activeToday: body.active !== false, avatarUrl: body.avatarUrl ?? '' },
  });
});

doctorsRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id) as DoctorRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Médico no encontrado' });
    return;
  }
  const doctor: Doctor = { id: row.id, name: row.name, specialty: row.specialty };
  res.json({ doctor });
});

doctorsRouter.put('/:id', (req, res) => {
  const body = req.body ?? {};
  const name = String(body.name ?? '').trim();
  if (!name) {
    res.status(400).json({ error: 'name es requerido' });
    return;
  }
  const result = db.prepare(`
    UPDATE doctors SET name = ?, short_name = ?, specialty = ?, active_today = ?, avatar_url = ? WHERE id = ?
  `).run(
    name,
    String(body.shortName ?? '').trim() || name,
    String(body.specialty ?? '').trim() || 'Medicina General',
    body.active === false ? 0 : 1,
    body.avatarUrl ?? null,
    req.params.id,
  );
  if (result.changes === 0) {
    res.status(404).json({ error: 'Médico no encontrado' });
    return;
  }
  res.json({ ok: true });
});

doctorsRouter.delete('/:id', (req, res) => {
  const id = req.params.id;
  // Borrar un médico que ya atendio deja citas historicas sin su responsable.
  if (db.prepare('SELECT 1 AS ok FROM appointments WHERE doctor_id = ? LIMIT 1').get(id)) {
    res.status(409).json({ error: 'El médico tiene citas registradas y no se puede eliminar' });
    return;
  }
  db.prepare('DELETE FROM day_schedules WHERE doctor_id = ?').run(id);
  db.prepare('DELETE FROM doctor_working_dates WHERE doctor_id = ?').run(id);
  db.prepare('DELETE FROM doctors WHERE id = ?').run(id);
  res.json({ ok: true });
});