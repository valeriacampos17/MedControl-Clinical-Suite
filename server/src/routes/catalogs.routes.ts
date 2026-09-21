import { Router } from 'express';
import { db } from '../db/connection.js';
import { classifyTriage } from '../services/triage.js';

export const catalogsRouter = Router();

function categoryOf(value: unknown): string {
  const s = String(value);
  return ['laboratorio', 'imagen', 'funcional', 'procedimiento'].includes(s) ? s : 'laboratorio';
}

catalogsRouter.post('/exams', (req, res) => {
  const body = req.body ?? {};
  if (!body.name) {
    res.status(400).json({ error: 'El nombre del examen es requerido' });
    return;
  }
  const id = body.id ?? 'EX-' + Date.now().toString().slice(-6);
  db.prepare('INSERT INTO exam_templates (id, name, category, fasting, preparation, active) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, String(body.name), categoryOf(body.category), body.fasting ? 1 : 0, body.preparation ?? null, body.active === false ? 0 : 1);
  const row = db.prepare('SELECT id, name, category, fasting, preparation, active FROM exam_templates WHERE id = ?').get(id) as { id: string; name: string; category: string; fasting: number; preparation: string | null; active: number };
  res.status(201).json({
    exam: {
      id: row.id,
      name: row.name,
      category: row.category,
      fasting: Boolean(row.fasting),
      preparation: row.preparation ?? '',
      active: Boolean(row.active),
    },
  });
});

catalogsRouter.put('/exams/:id', (req, res) => {
  const body = req.body ?? {};
  const existing = db.prepare('SELECT id FROM exam_templates WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Examen no encontrado' });
    return;
  }
  db.prepare('UPDATE exam_templates SET name = ?, category = ?, fasting = ?, preparation = ?, active = ? WHERE id = ?')
    .run(String(body.name ?? ''), categoryOf(body.category), body.fasting ? 1 : 0, body.preparation ?? null, body.active === false ? 0 : 1, req.params.id);
  const row = db.prepare('SELECT id, name, category, fasting, preparation, active FROM exam_templates WHERE id = ?').get(req.params.id) as { id: string; name: string; category: string; fasting: number; preparation: string | null; active: number };
  res.json({
    exam: {
      id: row.id,
      name: row.name,
      category: row.category,
      fasting: Boolean(row.fasting),
      preparation: row.preparation ?? '',
      active: Boolean(row.active),
    },
  });
});

catalogsRouter.delete('/exams/:id', (req, res) => {
  db.prepare('DELETE FROM exam_templates WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

catalogsRouter.post('/medications', (req, res) => {
  const body = req.body ?? {};
  if (!body.name) {
    res.status(400).json({ error: 'El nombre del medicamento es requerido' });
    return;
  }
  const id = body.id ?? 'MED-' + Date.now().toString().slice(-6);
  db.prepare('INSERT INTO medications (id, name, presentation, pharmaceutical_form, route, default_frequency, requires_prescription, controlled, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, String(body.name), String(body.presentation ?? ''), String(body.pharmaceuticalForm ?? 'tableta'), String(body.route ?? 'oral'), String(body.defaultFrequency ?? ''), body.requiresPrescription ? 1 : 0, body.controlled ? 1 : 0, body.active === false ? 0 : 1);
  const row = db.prepare('SELECT id, name, presentation, pharmaceutical_form, route, default_frequency, requires_prescription, controlled, active FROM medications WHERE id = ?').get(id);
  res.status(201).json({ medication: row });
});

catalogsRouter.put('/medications/:id', (req, res) => {
  const body = req.body ?? {};
  const existing = db.prepare('SELECT id FROM medications WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Medicamento no encontrado' });
    return;
  }
  db.prepare('UPDATE medications SET name = ?, presentation = ?, pharmaceutical_form = ?, route = ?, default_frequency = ?, requires_prescription = ?, controlled = ?, active = ? WHERE id = ?')
    .run(String(body.name ?? ''), String(body.presentation ?? ''), String(body.pharmaceuticalForm ?? 'tableta'), String(body.route ?? 'oral'), String(body.defaultFrequency ?? ''), body.requiresPrescription ? 1 : 0, body.controlled ? 1 : 0, body.active === false ? 0 : 1, req.params.id);
  const row = db.prepare('SELECT id, name, presentation, pharmaceutical_form, route, default_frequency, requires_prescription, controlled, active FROM medications WHERE id = ?').get(req.params.id);
  res.json({ medication: row });
});

catalogsRouter.delete('/medications/:id', (req, res) => {
  db.prepare('DELETE FROM medications WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

catalogsRouter.post('/diagnoses', (req, res) => {
  const body = req.body ?? {};
  if (!body.code || !body.description) {
    res.status(400).json({ error: 'Código y descripción son requeridos' });
    return;
  }
  const code = String(body.code).toUpperCase().trim();
  db.prepare('INSERT OR REPLACE INTO diagnosis_codes (code, label) VALUES (?, ?)').run(code, String(body.description));
  res.status(201).json({ diagnosis: { id: 'DG-' + Date.now().toString().slice(-6), code, description: String(body.description), active: true } });
});

catalogsRouter.put('/diagnoses/:code', (req, res) => {
  const body = req.body ?? {};
  db.prepare('UPDATE diagnosis_codes SET label = ? WHERE code = ?').run(String(body.description ?? ''), req.params.code);
  res.json({ ok: true });
});

catalogsRouter.delete('/diagnoses/:code', (req, res) => {
  db.prepare('DELETE FROM diagnosis_codes WHERE code = ?').run(req.params.code);
  res.json({ ok: true });
});

catalogsRouter.post('/triage/levels', (req, res) => {
  const body = req.body ?? {};
  const id = body.id ?? 'TL-' + Date.now().toString().slice(-6);
  db.prepare('INSERT INTO triage_levels (id, code, name, max_wait_minutes, description, color, active, ord) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, String(body.code ?? 'verde'), String(body.name ?? ''), Number(body.maxWaitMinutes ?? 120), body.description ?? null, String(body.color ?? '#2e7d32'), body.active === false ? 0 : 1, Number(body.order ?? 1));
  const row = db.prepare('SELECT * FROM triage_levels WHERE id = ?').get(id);
  res.status(201).json({ triageLevel: row });
});

catalogsRouter.put('/triage/levels/:id', (req, res) => {
  const body = req.body ?? {};
  const existing = db.prepare('SELECT id FROM triage_levels WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Nivel de triaje no encontrado' });
    return;
  }
  db.prepare('UPDATE triage_levels SET code = ?, name = ?, max_wait_minutes = ?, description = ?, color = ?, active = ?, ord = ? WHERE id = ?')
    .run(String(body.code ?? 'verde'), String(body.name ?? ''), Number(body.maxWaitMinutes ?? 120), body.description ?? null, String(body.color ?? '#2e7d32'), body.active === false ? 0 : 1, Number(body.order ?? 1), req.params.id);
  const row = db.prepare('SELECT * FROM triage_levels WHERE id = ?').get(req.params.id);
  res.json({ triageLevel: row });
});

catalogsRouter.post('/triage/rules', (req, res) => {
  const body = req.body ?? {};
  const id = body.id ?? 'TR-' + Date.now().toString().slice(-6);
  db.prepare('INSERT INTO triage_auto_rules (id, level_code, field, min_value, max_value) VALUES (?, ?, ?, ?, ?)')
    .run(id, String(body.levelCode ?? 'verde'), String(body.field ?? 'spo2'), body.min ?? null, body.max ?? null);
  res.status(201).json({ triageRule: { id, levelCode: body.levelCode, field: body.field, min: body.min ?? null, max: body.max ?? null } });
});

catalogsRouter.put('/triage/rules/:id', (req, res) => {
  const body = req.body ?? {};
  db.prepare('UPDATE triage_auto_rules SET level_code = ?, field = ?, min_value = ?, max_value = ? WHERE id = ?')
    .run(String(body.levelCode ?? 'verde'), String(body.field ?? 'spo2'), body.min ?? null, body.max ?? null, req.params.id);
  res.json({ ok: true });
});

catalogsRouter.delete('/triage/rules/:id', (req, res) => {
  db.prepare('DELETE FROM triage_auto_rules WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

catalogsRouter.get('/exams', (_req, res) => {
  const rows = db.prepare('SELECT id, name, category, fasting, preparation, active FROM exam_templates ORDER BY id').all();
  res.json({ exams: rows });
});

catalogsRouter.get('/medications', (_req, res) => {
  const rows = db.prepare(`
    SELECT id, name, presentation, pharmaceutical_form, route,
           default_frequency, requires_prescription, controlled, active
    FROM medications WHERE active = 1 ORDER BY name
  `).all() as Array<{
    id: string;
    name: string;
    presentation: string;
    pharmaceutical_form: string;
    route: string;
    default_frequency: string;
    requires_prescription: number;
    controlled: number;
    active: number;
  }>;
  res.json({
    medications: rows.map((m) => ({
      id: m.id,
      name: m.name,
      presentation: m.presentation,
      pharmaceuticalForm: m.pharmaceutical_form,
      route: m.route,
      defaultFrequency: m.default_frequency,
      requiresPrescription: Boolean(m.requires_prescription),
      controlled: Boolean(m.controlled),
      active: Boolean(m.active),
    })),
  });
});

catalogsRouter.get('/diagnoses', (_req, res) => {
  const rows = db.prepare('SELECT code, label AS description FROM diagnosis_codes ORDER BY code').all() as Array<{ code: string; description: string }>;
  res.json({
    diagnoses: rows.map((r, i) => ({
      id: `DG-${String(i + 1).padStart(3, '0')}`,
      code: r.code,
      description: r.description,
      active: true,
    })),
  });
});

catalogsRouter.get('/triage/levels', (_req, res) => {
  const rows = db.prepare(`
    SELECT id, code, name, max_wait_minutes, description, color, active, ord
    FROM triage_levels ORDER BY ord DESC
  `).all() as Array<{
    id: string;
    code: string;
    name: string;
    max_wait_minutes: number;
    description: string | null;
    color: string;
    active: number;
    ord: number;
  }>;
  res.json({
    triageLevels: rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      maxWaitMinutes: r.max_wait_minutes,
      description: r.description ?? '',
      color: r.color,
      active: Boolean(r.active),
      order: r.ord,
    })),
  });
});

catalogsRouter.get('/triage/rules', (_req, res) => {
  const rows = db.prepare(`
    SELECT id, level_code AS levelCode, field, min_value AS min, max_value AS max
    FROM triage_auto_rules ORDER BY id
  `).all();
  res.json({ triageRules: rows });
});

catalogsRouter.post('/triage/classify', (req, res) => {
  const body = req.body ?? {};
  const vitals = {
    systolic: body.systolic ?? null,
    diastolic: body.diastolic ?? null,
    pulse: body.pulse ?? null,
    temp: body.temp ?? null,
    spo2: body.spo2 ?? null,
    weight: body.weight ?? null,
    height: body.height ?? null,
    notes: body.notes ?? '',
  };
  const result = classifyTriage(vitals);
  res.json({ triage: result });
});

catalogsRouter.get('/consultation-types', (_req, res) => {
  const rows = db.prepare(`
    SELECT id, title, duration_minutes AS durationMinutes, price, note, suggested
    FROM consultation_types ORDER BY suggested DESC, id
  `).all();
  res.json({ consultationTypes: rows });
});