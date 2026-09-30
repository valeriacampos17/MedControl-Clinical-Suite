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

/** Jornada de un medico para un dia de la semana puntual, o null si no la tiene. */
export function getDaySchedule(doctorId: string | null, dayOfWeek: number): DaySchedule | null {
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
