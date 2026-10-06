import { Router } from 'express';
import { db } from '../db/connection.js';
import {
  DAY_NAMES,
  dayNameToNumber,
  getDaySchedules,
  getWorkingDays,
  outsideHorizon,
  toggleWorkingDay,
  setWorkingDays,
  setDaySchedule,
} from '../services/schedule.js';

export const configRouter = Router();

/** Minutos desde medianoche, para comparar horas sin depender del texto. */
function minutesOf(hhmm: string): number {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : Number.NaN;
}

configRouter.get('/working-days', (_req, res) => {
  res.json({ workingDays: getWorkingDays() });
});

configRouter.post('/working-days/toggle', (req, res) => {
  const date = req.body?.date as string | undefined;
  if (!date) {
    res.status(400).json({ error: 'El parámetro date es requerido' });
    return;
  }
  // Esta ruta tambien escribe un dia, asi que tambien consulta el horizonte.
  // Antes solo lo hacia la ruta de disponibilidad, y por API se aceptaba una
  // fecha de tres meses vista que la pantalla ya no dejaba marcar.
  const outside = outsideHorizon(date);
  if (outside) {
    res.status(400).json({ error: outside });
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
  // Se revisa todo antes de escribir nada: setWorkingDays borra la tabla
  // entera, asi que un dia fuera del horizonte que se colara en el arreglo
  // dejaria los dias validos tambien en el aire.
  for (const d of days) {
    const outside = outsideHorizon(String(d?.date ?? ''));
    if (outside) {
      res.status(400).json({ error: `${outside} (recibe: ${String(d?.date ?? '')})` });
      return;
    }
  }
  setWorkingDays(days);
  res.json({ workingDays: getWorkingDays() });
});

configRouter.get('/schedules', (req, res) => {
  const doctorId = req.query.doctorId ? String(req.query.doctorId) : null;
  res.json({ doctorId, schedule: getDaySchedules(doctorId) });
});

const TIME_HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

configRouter.put('/schedules', (req, res) => {
  const doctorId = (req.body?.doctorId as string | undefined) ?? null;
  const schedule = req.body?.schedule as
    | Array<{
        dayOfWeek?: number;
        day?: string;
        enabled?: boolean;
        startTime?: string;
        endTime?: string;
        totalCapacity?: number;
      }>
    | undefined;

  if (!Array.isArray(schedule)) {
    res.status(400).json({ error: 'Se espera un arreglo de jornadas' });
    return;
  }

  for (const s of schedule) {
    // Se acepta dayOfWeek (1 = lunes ... 7 = domingo) o el nombre del dia.
    const dayOfWeek =
      typeof s.dayOfWeek === 'number' ? s.dayOfWeek : dayNameToNumber(String(s.day ?? ''));
    if (!dayOfWeek || dayOfWeek < 1 || dayOfWeek > 7) {
      res.status(400).json({ error: `Dia de la semana invalido: ${s.dayOfWeek ?? s.day}` });
      return;
    }
    const startTime = String(s.startTime ?? '');
    const endTime = String(s.endTime ?? '');
    if (startTime && !TIME_HHMM.test(startTime)) {
      res.status(400).json({ error: `Hora de inicio invalida: ${startTime} (se espera HH:MM)` });
      return;
    }
    if (endTime && !TIME_HHMM.test(endTime)) {
      res.status(400).json({ error: `Hora de fin invalida: ${endTime} (se espera HH:MM)` });
      return;
    }
    // Comparar en minutos y no como texto: con HH:MM de 24 horas el orden
    // alfabetico coincide con el cronologico, pero comparar strings depende de
    // ese detalle y no de la regla de negocio.
    if (startTime && endTime && minutesOf(startTime) >= minutesOf(endTime)) {
      res.status(400).json({ error: 'La hora de fin debe ser posterior a la de inicio' });
      return;
    }
    // Un dia habilitado sin horas es un estado que el sistema no puede
    // representar: whyBlocked lo daria por disponible y getAvailableSlots
    // devolveria cero horarios, asi que se ve agendable y no hay nada que
    // elegir. Se rechaza en la puerta en vez de fallar en silencio mas adelante.
    if (s.enabled && !(startTime && endTime)) {
      res.status(400).json({
        error: `El dia ${DAY_NAMES[dayOfWeek]} esta habilitado pero no tiene hora de inicio y de fin`,
      });
      return;
    }
    setDaySchedule(
      doctorId,
      dayOfWeek,
      Boolean(s.enabled),
      startTime,
      endTime,
      Number(s.totalCapacity ?? 0),
    );
  }
  res.json({ doctorId, schedule: getDaySchedules(doctorId) });
});

configRouter.get('/consultation-types', (_req, res) => {
  const rows = db
    .prepare(
      'SELECT id, title, duration_minutes, price, note, suggested FROM consultation_types ORDER BY suggested DESC, title',
    )
    .all() as Array<{
    id: string;
    title: string;
    duration_minutes: number;
    price: string;
    note: string | null;
    suggested: number;
  }>;
  res.json({
    consultationTypes: rows.map((r) => ({
      id: r.id,
      title: r.title,
      durationMinutes: r.duration_minutes,
      price: r.price,
      note: r.note ?? '',
      suggested: r.suggested === 1,
    })),
  });
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

/**
 * Elimina un bloqueo. Antes el boton de la interfaz solo lo sacaba de memoria,
 * asi que se perdia al recargar y en realidad nunca se liberaba el horario.
 */
configRouter.delete('/absences/:id', (req, res) => {
  const id = String(req.params.id);
  const row = db.prepare('SELECT id FROM absences WHERE id = ?').get(id);
  if (!row) {
    res.status(404).json({ error: 'El bloqueo no existe' });
    return;
  }
  db.prepare('DELETE FROM absences WHERE id = ?').run(id);
  res.json({ ok: true, id });
});

interface OrganizationRow {
  id: string;
  name: string;
  rut: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  slogan: string | null;
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
      slogan: row.slogan ?? '',
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
    slogan?: string;
    footerText?: string;
    signatureName?: string;
  };
  if (!org?.name) {
    res.status(400).json({ error: 'El nombre de la organización es requerido' });
    return;
  }
  const id = org.id ?? 'ORG-001';
  db.prepare(`
    INSERT INTO organization_settings (id, name, rut, address, phone, email, slogan, footer_text, signature_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      rut = excluded.rut,
      address = excluded.address,
      phone = excluded.phone,
      email = excluded.email,
      slogan = excluded.slogan,
      footer_text = excluded.footer_text,
      signature_name = excluded.signature_name
  `).run(id, org.name, org.rut, org.address ?? '', org.phone ?? '', org.email ?? '', org.slogan ?? '', org.footerText ?? '', org.signatureName ?? '');
  const row = db.prepare('SELECT * FROM organization_settings WHERE id = ?').get(id) as OrganizationRow;
  res.json({
    organization: {
      id: row.id,
      name: row.name,
      rut: row.rut,
      address: row.address ?? '',
      phone: row.phone ?? '',
      email: row.email ?? '',
      slogan: row.slogan ?? '',
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

/**
 * El CHECK de la tabla es ('admin','doctor'). Antes un PUT sin role caia en
 * el default 'medico' y devolvia 500 por violar esa restriccion; ahora se
 * reporta como lo que es, un error del cliente.
 */
function parseRole(value: unknown): 'admin' | 'doctor' | null {
  return value === 'admin' || value === 'doctor' ? value : null;
}

configRouter.post('/users', (req, res) => {
  const body = req.body ?? {};
  const role = parseRole(body.role);
  if (!body.name || !body.email || !role) {
    res.status(400).json({ error: 'name, email y role son requeridos; role debe ser admin o doctor' });
    return;
  }
  const id = body.id ?? 'USR-' + Date.now().toString().slice(-6);
  db.prepare('INSERT INTO catalog_users (id, name, email, role, doctor_id, active) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, String(body.name), String(body.email), role, body.doctorId ?? null, body.active === false ? 0 : 1);
  res.status(201).json({ user: { id, name: body.name, email: body.email, role, doctorId: body.doctorId ?? undefined, active: body.active !== false } });
});

configRouter.put('/users/:id', (req, res) => {
  const body = req.body ?? {};
  const role = parseRole(body.role);
  if (!role) {
    res.status(400).json({ error: 'role es requerido y debe ser admin o doctor' });
    return;
  }
  db.prepare('UPDATE catalog_users SET name = ?, email = ?, role = ?, doctor_id = ?, active = ? WHERE id = ?')
    .run(String(body.name ?? ''), String(body.email ?? ''), role, body.doctorId ?? null, body.active === false ? 0 : 1, req.params.id);
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