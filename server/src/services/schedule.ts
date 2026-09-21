import { db } from '../db/connection.js';
import type { WorkingDay } from '../types.js';

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

export function getBusinessDays(fromDate: string, count: number): string[] {
  const result: string[] = [];
  let current = fromDate;
  while (result.length < count) {
    if (isBusinessDay(current)) result.push(current);
    current = addDays(current, 1);
  }
  return result;
}

export function getDaySchedules(): Array<{ day: string; enabled: number; startTime: string; endTime: string; totalCapacity: number }> {
  const map: Record<string, { day: string; enabled: number; startTime: string; endTime: string; totalCapacity: number }> = {
    '1': { day: 'Lunes', enabled: 0, startTime: '', endTime: '', totalCapacity: 0 },
    '2': { day: 'Martes', enabled: 0, startTime: '', endTime: '', totalCapacity: 0 },
    '3': { day: 'Miércoles', enabled: 0, startTime: '', endTime: '', totalCapacity: 0 },
    '4': { day: 'Jueves', enabled: 0, startTime: '', endTime: '', totalCapacity: 0 },
    '5': { day: 'Viernes', enabled: 0, startTime: '', endTime: '', totalCapacity: 0 },
    '6': { day: 'Sábado', enabled: 0, startTime: '', endTime: '', totalCapacity: 0 },
  };
  const rows = db.prepare('SELECT day_of_week, enabled, start_time, end_time, total_capacity FROM day_schedules WHERE doctor_id IS NULL').all() as Array<{
    day_of_week: number; enabled: number; start_time: string | null; end_time: string | null; total_capacity: number | null;
  }>;
  for (const r of rows) {
    const key = String(r.day_of_week);
    if (map[key]) {
      map[key].enabled = r.enabled;
      map[key].startTime = r.start_time ?? '';
      map[key].endTime = r.end_time ?? '';
      map[key].totalCapacity = r.total_capacity ?? 0;
    }
  }
  return Object.values(map);
}

export function setDaySchedule(day: string, enabled: boolean, startTime: string, endTime: string, totalCapacity: number): void {
  const dayOfWeek = { Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6, Domingo: 7 }[day];
  if (!dayOfWeek) return;
  db.prepare(`
    INSERT INTO day_schedules (doctor_id, day_of_week, enabled, start_time, end_time, total_capacity)
    VALUES (NULL, ?, ?, ?, ?, ?)
    ON CONFLICT(day_of_week) DO UPDATE SET
      enabled = excluded.enabled,
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      total_capacity = excluded.total_capacity
  `).run(dayOfWeek, enabled ? 1 : 0, startTime, endTime, totalCapacity);
}