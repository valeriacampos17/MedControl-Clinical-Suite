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

doctorsRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id) as DoctorRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Médico no encontrado' });
    return;
  }
  const doctor: Doctor = { id: row.id, name: row.name, specialty: row.specialty };
  res.json({ doctor });
});