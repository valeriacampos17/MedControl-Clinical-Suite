import { Router } from 'express';
import { db } from '../db/connection.js';
import { getDaySchedules, getWorkingDays, getBusinessDays, toggleWorkingDay, setWorkingDays, setDaySchedule } from '../services/schedule.js';

export const configRouter = Router();

configRouter.get('/working-days', (_req, res) => {
  res.json({ workingDays: getWorkingDays() });
});

configRouter.get('/working-days/business-days', (req, res) => {
  const from = String(req.query.from ?? '');
  const count = Number(req.query.count ?? 10);
  if (!from) {
    res.status(400).json({ error: 'El parámetro from es requerido' });
    return;
  }
  res.json({ days: getBusinessDays(from, count) });
});

configRouter.post('/working-days/toggle', (req, res) => {
  const date = req.body?.date as string | undefined;
  if (!date) {
    res.status(400).json({ error: 'El parámetro date es requerido' });
    return;
  }
  toggleWorkingDay(date);
  res.json({ workingDays: getWorkingDays() });
});

configRouter.put('/working-days', (req, res) => {
  const days = req.body?.days as Array<{ date: string; note?: string }> | undefined;
  if (!Array.isArray(days)) {
    res.status(400).json({ error: 'Se espera un arreglo de días hábiles' });
    return;
  }
  setWorkingDays(days);
  res.json({ workingDays: getWorkingDays() });
});

configRouter.get('/schedules', (_req, res) => {
  res.json({ schedule: getDaySchedules() });
});

const dayScheduleSchema = {
  day: 'Lunes',
  enabled: true,
  startTime: '08:00',
  endTime: '16:00',
  totalCapacity: 20,
};

configRouter.put('/schedules', (req, res) => {
  const schedule = req.body?.schedule as Array<typeof dayScheduleSchema> | undefined;
  if (!Array.isArray(schedule)) {
    res.status(400).json({ error: 'Se espera un arreglo de jornadas' });
    return;
  }
  for (const s of schedule) {
    setDaySchedule(s.day, Boolean(s.enabled), s.startTime, s.endTime, Number(s.totalCapacity));
  }
  res.json({ schedule: getDaySchedules() });
});

configRouter.get('/absences', (_req, res) => {
  const rows = db.prepare('SELECT * FROM absences ORDER BY start_date').all() as Array<{
    id: string;
    doctor_id: string | null;
    reason: string;
    location: string | null;
    type: string;
    start_date: string;
    end_date: string;
    affected_note: string | null;
    collision_status: string | null;
    validation_status: string | null;
    icon_name: string | null;
  }>;
  res.json({
    absences: rows.map((a) => ({
      id: a.id,
      doctorId: a.doctor_id ?? undefined,
      reason: a.reason,
      location: a.location ?? '',
      type: a.type,
      period: `${formatDate(a.start_date)} - ${formatDate(a.end_date)}`,
      affectedNote: a.affected_note ?? '',
      collisionStatus: a.collision_status ?? '',
      validationStatus: a.validation_status ?? '',
      iconName: a.icon_name ?? 'event_busy',
    })),
  });
});

interface OrganizationRow {
  id: string;
  name: string;
  rut: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  footer_text: string | null;
  signature_name: string | null;
}

configRouter.get('/organization', (_req, res) => {
  const row = db.prepare('SELECT * FROM organization_settings LIMIT 1').get() as OrganizationRow;
  res.json({
    organization: {
      id: row.id,
      name: row.name,
      rut: row.rut,
      address: row.address ?? '',
      phone: row.phone ?? '',
      email: row.email ?? '',
      footerText: row.footer_text ?? '',
      signatureName: row.signature_name ?? '',
    },
  });
});

configRouter.put('/organization', (req, res) => {
  const org = req.body?.organization as {
    id?: string;
    name: string;
    rut: string;
    address?: string;
    phone?: string;
    email?: string;
    footerText?: string;
    signatureName?: string;
  };
  if (!org?.name) {
    res.status(400).json({ error: 'El nombre de la organización es requerido' });
    return;
  }
  const id = org.id ?? 'ORG-001';
  db.prepare(`
    INSERT INTO organization_settings (id, name, rut, address, phone, email, footer_text, signature_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      rut = excluded.rut,
      address = excluded.address,
      phone = excluded.phone,
      email = excluded.email,
      footer_text = excluded.footer_text,
      signature_name = excluded.signature_name
  `).run(id, org.name, org.rut, org.address ?? '', org.phone ?? '', org.email ?? '', org.footerText ?? '', org.signatureName ?? '');
  const row = db.prepare('SELECT * FROM organization_settings WHERE id = ?').get(id) as OrganizationRow;
  res.json({
    organization: {
      id: row.id,
      name: row.name,
      rut: row.rut,
      address: row.address ?? '',
      phone: row.phone ?? '',
      email: row.email ?? '',
      footerText: row.footer_text ?? '',
      signatureName: row.signature_name ?? '',
    },
  });
});

configRouter.get('/alert-rules', (_req, res) => {
  const rows = db.prepare('SELECT * FROM alert_rules ORDER BY id').all() as Array<{
    id: string;
    name: string;
    description: string | null;
    category: string;
    severity: string;
    icon: string | null;
    action_label: string;
    route: string | null;
    active: number;
  }>;
  res.json({
    alertRules: rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? '',
      category: r.category,
      severity: r.severity,
      icon: r.icon ?? 'info',
      actionLabel: r.action_label,
      route: r.route ?? undefined,
      active: Boolean(r.active),
    })),
  });
});

configRouter.post('/alert-rules', (req, res) => {
  const body = req.body ?? {};
  if (!body.name) {
    res.status(400).json({ error: 'El nombre es requerido' });
    return;
  }
  const id = body.id ?? 'AR-' + Date.now().toString().slice(-6);
  db.prepare(`
    INSERT INTO alert_rules (id, name, description, category, severity, icon, action_label, route, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    String(body.name),
    body.description ?? null,
    String(body.category ?? 'Sistema'),
    String(body.severity ?? 'info'),
    body.icon ?? 'info',
    String(body.actionLabel ?? 'Ver'),
    body.route ?? null,
    body.active === false ? 0 : 1,
  );
  res.status(201).json({ alertRule: { id, name: body.name, description: body.description ?? '', category: body.category ?? 'Sistema', severity: body.severity ?? 'info', icon: body.icon ?? 'info', actionLabel: body.actionLabel ?? 'Ver', route: body.route ?? undefined, active: body.active !== false } });
});

configRouter.put('/alert-rules/:id', (req, res) => {
  const body = req.body ?? {};
  db.prepare(`
    UPDATE alert_rules SET name = ?, description = ?, category = ?, severity = ?, icon = ?, action_label = ?, route = ?, active = ? WHERE id = ?
  `).run(
    String(body.name ?? ''),
    body.description ?? null,
    String(body.category ?? 'Sistema'),
    String(body.severity ?? 'info'),
    body.icon ?? 'info',
    String(body.actionLabel ?? 'Ver'),
    body.route ?? null,
    body.active === false ? 0 : 1,
    req.params.id,
  );
  res.json({ ok: true });
});

configRouter.delete('/alert-rules/:id', (req, res) => {
  db.prepare('DELETE FROM alert_rules WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

configRouter.post('/users', (req, res) => {
  const body = req.body ?? {};
  if (!body.name || !body.email || !body.role) {
    res.status(400).json({ error: 'name, email y role son requeridos' });
    return;
  }
  const id = body.id ?? 'USR-' + Date.now().toString().slice(-6);
  db.prepare('INSERT INTO catalog_users (id, name, email, role, doctor_id, active) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, String(body.name), String(body.email), String(body.role), body.doctorId ?? null, body.active === false ? 0 : 1);
  res.status(201).json({ user: { id, name: body.name, email: body.email, role: body.role, doctorId: body.doctorId ?? undefined, active: body.active !== false } });
});

configRouter.put('/users/:id', (req, res) => {
  const body = req.body ?? {};
  db.prepare('UPDATE catalog_users SET name = ?, email = ?, role = ?, doctor_id = ?, active = ? WHERE id = ?')
    .run(String(body.name ?? ''), String(body.email ?? ''), String(body.role ?? 'medico'), body.doctorId ?? null, body.active === false ? 0 : 1, req.params.id);
  res.json({ ok: true });
});

configRouter.delete('/users/:id', (req, res) => {
  db.prepare('DELETE FROM catalog_users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

configRouter.get('/users', (_req, res) => {
  const rows = db.prepare('SELECT * FROM catalog_users ORDER BY id').all() as Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    doctor_id: string | null;
    active: number;
  }>;
  res.json({
    users: rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      doctorId: u.doctor_id ?? undefined,
      active: Boolean(u.active),
    })),
  });
});

function formatDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d} ${months[Number(m) - 1]} ${y}`;
  }
  return dateStr;
}