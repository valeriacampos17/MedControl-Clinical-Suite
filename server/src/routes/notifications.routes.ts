import { Router } from 'express';
import { db } from '../db/connection.js';

export const notificationsRouter = Router();

type NotificationLevel = 'critical' | 'info' | 'success';

interface NotificationRow {
  id: string;
  title: string;
  description: string | null;
  time: string;
  level: string;
  icon: string | null;
  action: string | null;
  route: string | null;
  patient_id: string | null;
  appointment_id: string | null;
  is_read: number;
}

function toDto(n: NotificationRow) {
  return {
    id: n.id,
    title: n.title,
    description: n.description ?? '',
    time: n.time,
    level: n.level as NotificationLevel,
    icon: n.icon ?? 'notifications',
    action: n.action ?? 'Ver Detalle',
    route: n.route ?? undefined,
    patientId: n.patient_id ?? undefined,
    appointmentId: n.appointment_id ?? undefined,
    isRead: Boolean(n.is_read),
  };
}

notificationsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM alerts_notifications ORDER BY time DESC').all() as NotificationRow[];
  res.json({ notifications: rows.map(toDto) });
});

notificationsRouter.post('/', (req, res) => {
  const body = req.body ?? {};
  const title = String(body.title ?? '').trim();
  if (!title) {
    res.status(400).json({ error: 'title es requerido' });
    return;
  }
  const id = body.id ? String(body.id) : 'NT-' + Date.now().toString().slice(-6);
  const level: NotificationLevel = ['critical', 'info', 'success'].includes(body.level) ? body.level : 'info';
  const time = body.time ? String(body.time) : new Date().toISOString();
  db.prepare(`
    INSERT INTO alerts_notifications (id, title, description, time, level, icon, action, route, patient_id, appointment_id, is_read)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    title,
    body.description ?? null,
    time,
    level,
    body.icon ?? null,
    body.action ?? null,
    body.route ?? null,
    body.patientId ?? null,
    body.appointmentId ?? null,
    body.isRead ? 1 : 0,
  );
  const row = db.prepare('SELECT * FROM alerts_notifications WHERE id = ?').get(id) as NotificationRow;
  res.status(201).json({ notification: toDto(row) });
});

notificationsRouter.patch('/read-all', (_req, res) => {
  db.prepare('UPDATE alerts_notifications SET is_read = 1').run();
  res.json({ ok: true });
});

notificationsRouter.patch('/:id/read', (req, res) => {
  const result = db.prepare('UPDATE alerts_notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Notificación no encontrada' });
    return;
  }
  res.json({ ok: true });
});

notificationsRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM alerts_notifications WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
