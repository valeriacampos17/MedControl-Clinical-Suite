import { db } from '../db/connection.js';
import type { WorkingDay } from '../types.js';

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * dia de la semana con la convencion de la base: 1 = lunes ... 7 = domingo.
 * getDay() de JavaScript devuelve 0 = domingo, asi que hay que rotar.
 */
export function isoDayOfWeek(dateStr: string): number {
  return ((new Date(`${dateStr}T00:00:00`).getDay() + 6) % 7) + 1;
}

/** Tope de dias que se pueden recorrer al buscar dias habiles. */
const MAX_SCAN_DAYS = 400;

// ------------------------------------------------- dias que labora el medico --

export interface DoctorWorkingDate {
  date: string;
  note: string | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Dias marcados de un medico en un rango, para pintar el calendario. */
export function getDoctorWorkingDates(doctorId: string, from?: string, to?: string): DoctorWorkingDate[] {
  if (!doctorId) return [];
  const clauses = ['doctor_id = ?'];
  const params: unknown[] = [doctorId];
  if (from && ISO_DATE.test(from)) {
    clauses.push('date >= ?');
    params.push(from);
  }
  if (to && ISO_DATE.test(to)) {
    clauses.push('date <= ?');
    params.push(to);
  }
  return db
    .prepare(
      `SELECT date, note FROM doctor_working_dates
        WHERE ${clauses.join(' AND ')}
        ORDER BY date`,
    )
    .all(...params) as DoctorWorkingDate[];
}

export function isDoctorWorkingDate(doctorId: string, date: string): boolean {
  if (!doctorId) return false;
  return !!db
    .prepare('SELECT 1 FROM doctor_working_dates WHERE doctor_id = ? AND date = ?')
    .get(doctorId, date);
}

export function markDoctorWorkingDate(doctorId: string, date: string, note: string | null = null): void {
  if (!doctorId || !ISO_DATE.test(date)) return;
  db.prepare(
    `INSERT INTO doctor_working_dates (doctor_id, date, note) VALUES (?, ?, ?)
     ON CONFLICT (doctor_id, date) DO UPDATE SET note = COALESCE(excluded.note, doctor_working_dates.note)`,
  ).run(doctorId, date, note);
}

export function unmarkDoctorWorkingDate(doctorId: string, date: string): void {
  if (!doctorId || !ISO_DATE.test(date)) return;
  db.prepare('DELETE FROM doctor_working_dates WHERE doctor_id = ? AND date = ?').run(doctorId, date);
}

/** Reemplaza el conjunto completo de dias marcados de un medico. */
export function setDoctorWorkingDates(doctorId: string, dates: DoctorWorkingDate[]): DoctorWorkingDate[] {
  if (!doctorId) return [];
  const valid = dates.filter(d => ISO_DATE.test(d.date));
  const del = db.prepare('DELETE FROM doctor_working_dates WHERE doctor_id = ?');
  const insert = db.prepare(
    'INSERT OR REPLACE INTO doctor_working_dates (doctor_id, date, note) VALUES (?, ?, ?)',
  );
  db.transaction(() => {
    del.run(doctorId);
    for (const d of valid) insert.run(doctorId, d.date, d.note ?? null);
  })();
  return getDoctorWorkingDates(doctorId);
}

/**
 * Marca los proximos dias que coincidan con la jornada habilitada del medico.
 * Es la salida rapida: en vez de pinchar 40 dias uno por uno, se marca lo que
 * el medico ya tiene como jornada semanal.
 */
export function markFromSchedule(doctorId: string, horizonDays: number = 60): number {
  if (!doctorId) return 0;
  ensureDaySchedule(doctorId);
  const enabled = new Set(
    (db
      .prepare('SELECT day_of_week FROM day_schedules WHERE doctor_id = ? AND enabled = 1')
      .all(doctorId) as Array<{ day_of_week: number }>).map(r => r.day_of_week),
  );
  if (enabled.size === 0) return 0;

  const insert = db.prepare(
    'INSERT OR IGNORE INTO doctor_working_dates (doctor_id, date, note) VALUES (?, ?, NULL)',
  );
  let marked = 0;
  const today = new Date();
  db.transaction(() => {
    for (let i = 0; i < horizonDays; i++) {
      const date = addDays(toDateStr(today), i);
      if (!enabled.has(isoDayOfWeek(date))) continue;
      marked += Number(insert.run(doctorId, date).changes);
    }
  })();
  return marked;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- jornadas --

export interface DaySchedule {
  dayOfWeek: number;
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  totalCapacity: number;
}

export const DAY_NAMES: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miercoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sabado',
  7: 'Domingo',
};

/** Quita acentos y pasa a minusculas, para comparar nombres de dias. */
function normalizeDayName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** 'Lunes', 'lunes', 'Miercoles' o 'Miércoles' -> 1..7. */
export function dayNameToNumber(name: string): number | undefined {
  const key = normalizeDayName(name);
  for (const [dayOfWeek, label] of Object.entries(DAY_NAMES)) {
    if (normalizeDayName(label) === key) return Number(dayOfWeek);
  }
  return undefined;
}

export function getWorkingDays(): WorkingDay[] {
  return db.prepare('SELECT date, note FROM working_days ORDER BY date').all() as WorkingDay[];
}

export function isBusinessDay(date: string): boolean {
  const row = db.prepare('SELECT 1 FROM working_days WHERE date = ?').get(date);
  return !!row;
}

export function toggleWorkingDay(date: string): void {
  const exists = isBusinessDay(date);
  if (exists) {
    db.prepare('DELETE FROM working_days WHERE date = ?').run(date);
  } else {
    db.prepare('INSERT INTO working_days (date, note) VALUES (?, ?)').run(date, null);
  }
}

export function setWorkingDays(days: WorkingDay[]): void {
  const del = db.prepare('DELETE FROM working_days');
  const insert = db.prepare('INSERT INTO working_days (date, note) VALUES (?, ?)');
  db.transaction(() => {
    del.run();
    for (const d of days) insert.run(d.date, d.note ?? null);
  })();
}

/**
 * Devuelve hasta `count` dias habiles a partir de `fromDate`.
 *
 * Antes esto era un while sin tope: si no quedaban dias habiles por delante
 * entraba en bucle infinito y colgaba el proceso. Ahora se detiene al agotar
 * el horizonte de busqueda y devuelve los que haya aunque sean menos que
 * `count`.
 */
export function getBusinessDays(fromDate: string, count: number): string[] {
  const result: string[] = [];
  let current = fromDate;
  for (let scanned = 0; scanned < MAX_SCAN_DAYS && result.length < count; scanned++) {
    if (isBusinessDay(current)) result.push(current);
    current = addDays(current, 1);
  }
  return result;
}

/**
 * Jornada semanal de un medico, siempre las 7 filas (1 = lunes ... 7 = domingo).
 * Si el medico no tiene nada cargado se devuelven los dias tal cual, apagados.
 */
export function getDaySchedules(doctorId?: string | null): DaySchedule[] {
  if (doctorId) ensureDaySchedule(doctorId);
  const base: DaySchedule[] = [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
    dayOfWeek,
    day: DAY_NAMES[dayOfWeek],
    enabled: false,
    startTime: '',
    endTime: '',
    totalCapacity: 0,
  }));

  const rows = db
    .prepare(
      `SELECT day_of_week, enabled, start_time, end_time, total_capacity
         FROM day_schedules
        WHERE doctor_id = ?`,
    )
    .all(doctorId ?? null) as Array<{
    day_of_week: number;
    enabled: number;
    start_time: string | null;
    end_time: string | null;
    total_capacity: number | null;
  }>;

  for (const r of rows) {
    const entry = base.find((b) => b.dayOfWeek === r.day_of_week);
    if (!entry) continue;
    entry.enabled = r.enabled === 1;
    entry.startTime = r.start_time ?? '';
    entry.endTime = r.end_time ?? '';
    entry.totalCapacity = r.total_capacity ?? 0;
  }
  return base;
}

/**
 * Crea la jornada por defecto de un medico que no tiene ninguna fila.
 *
 * Sin esto, un medico agregado despues de la migracion queda con los siete
 * dias apagados y su calendario de reservas aparece vacio sin explicar por
 * que. No hace falta configurar nada: solo se escribe cuando el medico no
 * tiene ninguna fila, y la jornada creada es la misma que usa la migracion.
 */
export function ensureDaySchedule(doctorId: string): void {
  if (!doctorId) return;
  const existing = db
    .prepare('SELECT COUNT(*) AS n FROM day_schedules WHERE doctor_id = ?')
    .get(doctorId) as { n: number };
  if (existing.n > 0) return;

  const insert = db.prepare(
    `INSERT OR IGNORE INTO day_schedules (doctor_id, day_of_week, enabled, start_time, end_time, total_capacity)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  db.transaction(() => {
    for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
      const workday = dayOfWeek <= 5;
      insert.run(doctorId, dayOfWeek, workday ? 1 : 0, workday ? '08:00' : null, workday ? '16:00' : null, workday ? 20 : 0);
    }
  })();
}

/** Jornada de un medico para un dia de la semana puntual, o null si no la tiene. */
export function getDaySchedule(doctorId: string | null, dayOfWeek: number): DaySchedule | null {
  if (doctorId) ensureDaySchedule(doctorId);
  const row = db
    .prepare(
      `SELECT day_of_week, enabled, start_time, end_time, total_capacity
         FROM day_schedules
        WHERE doctor_id IS ? AND day_of_week = ?`,
    )
    .get(doctorId, dayOfWeek) as
    | {
        day_of_week: number;
        enabled: number;
        start_time: string | null;
        end_time: string | null;
        total_capacity: number | null;
      }
    | undefined;
  if (!row) return null;
  return {
    dayOfWeek: row.day_of_week,
    day: DAY_NAMES[row.day_of_week],
    enabled: row.enabled === 1,
    startTime: row.start_time ?? '',
    endTime: row.end_time ?? '',
    totalCapacity: row.total_capacity ?? 0,
  };
}

/**
 * Guarda la jornada de un medico para un dia de la semana.
 *
 * El conflict va contra (doctor_id, day_of_week) porque el indice unico esta
 * en esa combinacion. Antes se usaba ON CONFLICT(day_of_week), que SQLite
 * rechaza al no existir tal restriccion.
 */
export function setDaySchedule(
  doctorId: string | null,
  dayOfWeek: number,
  enabled: boolean,
  startTime: string,
  endTime: string,
  totalCapacity: number,
): void {
  db.prepare(
    `INSERT INTO day_schedules (doctor_id, day_of_week, enabled, start_time, end_time, total_capacity)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(doctor_id, day_of_week) DO UPDATE SET
       enabled = excluded.enabled,
       start_time = excluded.start_time,
       end_time = excluded.end_time,
       total_capacity = excluded.total_capacity`,
  ).run(doctorId, dayOfWeek, enabled ? 1 : 0, startTime || null, endTime || null, totalCapacity);
}
