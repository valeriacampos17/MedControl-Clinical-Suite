import { db } from '../db/connection.js';
import { DAY_NAMES, getDaySchedule, isoDayOfWeek } from './schedule.js';

/**
 * Paso de la rejilla de horarios.
 *
 * Por ahora el paso es la misma duracion del bloque, asi que para una primera
 * consulta de 45 min los horarios caen 08:00, 08:45, 09:30...
 *
 * Si se quiere una rejilla mas fina (arranque cada 15 min y que el bloque
 * siga durando lo que dura la consulta) alcanza con poner STEP_MINUTES = 15:
 * el resto de la logica no cambia.
 */
const STEP_MINUTES = 0; // 0 = usar la duracion del bloque

/** Cuantos dias hacia adelante se revisan por defecto. */
const DEFAULT_HORIZON_DAYS = 60;

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

// ---------------------------------------------------------------- tiempo ---

export function toMinutes(time: string): number {
  const m = HHMM.exec(time.trim());
  if (!m) return Number.NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function fromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Acepta 'HH:MM' y tambien 'h:mm AM/PM' y lo deja en 'HH:MM' de 24 horas.
 * Devuelve null si no es una hora reconocible.
 */
export function normalizeTime(time: string): string | null {
  const raw = time.trim();
  const direct = HHMM.exec(raw);
  if (direct) return fromMinutes(Number(direct[1]) * 60 + Number(direct[2]));

  const twelve = /^(\d{1,2}):(\d{2})\s*([AP])M$/i.exec(raw);
  if (!twelve) return null;
  const hour = Number(twelve[1]);
  const meridiem = twelve[3].toUpperCase();
  if (hour < 1 || hour > 12) return null;
  const normalized = (hour % 12) + (meridiem === 'P' ? 12 : 0);
  return fromMinutes(normalized * 60 + Number(twelve[2]));
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ------------------------------------------------------------ ausencias ---

interface AbsenceRow {
  doctor_id: string | null;
  start_date: string;
  end_date: string;
  validation_status: string | null;
  reason: string;
}

/** Una ausencia anulada o rechazada no bloquea la agenda. */
const NOT_BLOCKING = /rechaz|deneg|cancel|anulad/i;

function blockingAbsence(doctorId: string, date: string): AbsenceRow | null {
  const rows = db
    .prepare(
      `SELECT doctor_id, start_date, end_date, validation_status, reason
         FROM absences
        WHERE start_date <= ? AND end_date >= ?`,
    )
    .all(date, date) as AbsenceRow[];
  return (
    rows.find(
      (a) =>
        (a.doctor_id === null || a.doctor_id === doctorId) &&
        !(a.validation_status && NOT_BLOCKING.test(a.validation_status)),
    ) ?? null
  );
}

// ------------------------------------------------------------- capacidad ---

function bookedCount(doctorId: string, date: string): number {
  const row = db
    .prepare('SELECT COUNT(*) AS n FROM appointments WHERE doctor_id = ? AND date = ?')
    .get(doctorId, date) as { n: number };
  return row.n;
}

interface BookedRow {
  time: string;
  duration_minutes: number;
}

/** Citas del medico ese dia, normalizadas a minutos. */
function bookedThatDay(doctorId: string, date: string): Array<{ start: number; end: number }> {
  const rows = db
    .prepare('SELECT time, duration_minutes FROM appointments WHERE doctor_id = ? AND date = ?')
    .all(doctorId, date) as BookedRow[];
  const blocks: Array<{ start: number; end: number }> = [];
  for (const r of rows) {
    const start = normalizeTime(r.time) ? toMinutes(r.time) : Number.NaN;
    if (Number.isNaN(start)) continue;
    const duration = r.duration_minutes > 0 ? r.duration_minutes : 30;
    blocks.push({ start, end: start + duration });
  }
  return blocks;
}

// ------------------------------------------------------------- capacidad ---

export type BlockedReason = 'sin-abrir' | 'ausencia' | 'jornada-cerrada' | 'sin-cupo';

export interface BookableDay {
  date: string;
  dayOfWeek: number;
  day: string;
  dayNumber: number;
  monthLabel: string;
  bookable: boolean;
  blockedBy: BlockedReason | null;
  blockedDetail: string | null;
  remaining: number;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function dayMeta(date: string): Pick<BookableDay, 'dayOfWeek' | 'day' | 'dayNumber' | 'monthLabel'> {
  const d = new Date(`${date}T00:00:00`);
  const dayOfWeek = isoDayOfWeek(date);
  return {
    dayOfWeek,
    day: DAY_NAMES[dayOfWeek],
    dayNumber: d.getDate(),
    monthLabel: MONTHS[d.getMonth()],
  };
}

/**
 * Por que un dia no se puede reservar, o null si se puede.
 * No mira slots: solo fecha abierta, ausencia, jornada del dia y cupo.
 */
function whyBlocked(doctorId: string, date: string): { reason: BlockedReason; detail: string } | null {
  const isOpen = db.prepare('SELECT 1 FROM working_days WHERE date = ?').get(date);
  if (!isOpen) {
    return { reason: 'sin-abrir', detail: 'La clinica no atiende este dia' };
  }

  const absence = blockingAbsence(doctorId, date);
  if (absence) {
    return {
      reason: 'ausencia',
      detail: absence.doctor_id
        ? `${absence.reason} (ausencia del medico)`
        : `${absence.reason} (clinica cerrada)`,
    };
  }

  const schedule = getDaySchedule(doctorId, isoDayOfWeek(date));
  if (!schedule || !schedule.enabled) {
    return { reason: 'jornada-cerrada', detail: 'El medico no atiende este dia' };
  }

  const capacity = schedule.totalCapacity;
  if (capacity > 0 && bookedCount(doctorId, date) >= capacity) {
    return { reason: 'sin-cupo', detail: `Cupo completo (${capacity})` };
  }

  return null;
}

export function getBookableDays(
  doctorId: string,
  from: string = todayStr(),
  horizonDays: number = DEFAULT_HORIZON_DAYS,
): BookableDay[] {
  const days: BookableDay[] = [];
  const firstOpen = db.prepare('SELECT date FROM working_days WHERE date >= ? ORDER BY date LIMIT 1').get(from) as
    | { date: string }
    | undefined;
  if (!firstOpen) return days;

  const lastOpen = db
    .prepare('SELECT date FROM working_days WHERE date >= ? ORDER BY date DESC LIMIT 1')
    .get(from) as { date: string } | undefined;

  const start = firstOpen.date;
  const end = lastOpen ? lastOpen.date : start;

  // El conteo de horarios no se calcula aqui a proposito: seria una consulta
  // por dia y por tipo de consulta. El dia solo informa si se puede reservar y
  // quantos cupos quedan; los horarios libres se piden al elegir el dia.
  for (let date = start; date <= end && days.length < horizonDays; date = addDays(date, 1)) {
    const blocked = whyBlocked(doctorId, date);
    days.push({
      date,
      ...dayMeta(date),
      bookable: !blocked,
      blockedBy: blocked?.reason ?? null,
      blockedDetail: blocked?.detail ?? null,
      remaining: blocked ? 0 : Math.max(capacityLeft(doctorId, date), 0),
    });
  }
  return days;
}

function capacityLeft(doctorId: string, date: string): number {
  const schedule = getDaySchedule(doctorId, isoDayOfWeek(date));
  if (!schedule || schedule.totalCapacity <= 0) return Number.MAX_SAFE_INTEGER;
  return schedule.totalCapacity - bookedCount(doctorId, date);
}

// ----------------------------------------------------------------- slots ---

/**
 * Horarios posibles de un dia, separado en libres y ocupados.
 *
 * Los horarios avanzan de a STEP_MINUTES; con 0 el paso es la duracion del
 * bloque. Se descarta todo slot que se solape con una cita existente.
 */
export interface AvailableSlots {
  date: string;
  doctorId: string;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  slots: string[];
  takenCount: number;
  totalSlots: number;
  blockedBy: BlockedReason | null;
  blockedDetail: string | null;
}

export function getAvailableSlots(
  doctorId: string,
  date: string,
  durationMinutes: number,
): AvailableSlots {
  const blocked = whyBlocked(doctorId, date);
  const empty: AvailableSlots = {
    date,
    doctorId,
    durationMinutes,
    startTime: '',
    endTime: '',
    slots: [],
    takenCount: 0,
    totalSlots: 0,
    blockedBy: blocked?.reason ?? null,
    blockedDetail: blocked?.detail ?? null,
  };
  if (blocked) return empty;

  const schedule = getDaySchedule(doctorId, isoDayOfWeek(date))!;
  const open = toMinutes(schedule.startTime);
  const close = toMinutes(schedule.endTime);
  if (Number.isNaN(open) || Number.isNaN(close)) return empty;

  const step = STEP_MINUTES > 0 ? STEP_MINUTES : durationMinutes;
  const taken = bookedThatDay(doctorId, date);
  const slots: string[] = [];
  for (let start = open; start + durationMinutes <= close; start += step) {
    const overlaps = taken.some((b) => start < b.end && b.start < start + durationMinutes);
    if (!overlaps) slots.push(fromMinutes(start));
  }
  return {
    ...empty,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    slots,
    takenCount: taken.length,
    totalSlots: slots.length,
  };
}

// ------------------------------------------------------------ validacion ---

export type RejectReason = BlockedReason | 'dia-pasado' | 'horario-invalido' | 'fuera-de-jornada' | 'ocupado' | 'duracion-invalida';

export type Bookability =
  | { ok: true }
  | { ok: false; reason: RejectReason; message: string };

/**
 * Verificacion completa antes de guardar una cita. La logica se comparte con
 * los endpoints de disponibilidad para que lo que se ve sea lo que se puede
 * reservar.
 */
export function assertBookable(input: {
  doctorId: string;
  date: string;
  time: string;
  durationMinutes: number;
  /** Ignora estas citas al buscar solapes, para poder reagendar una. */
  ignoreAppointmentId?: string;
}): Bookability {
  const { doctorId, date, durationMinutes } = input;

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return { ok: false, reason: 'duracion-invalida', message: 'La duracion de la consulta no es valida' };
  }

  const normalized = normalizeTime(input.time);
  if (!normalized) {
    return { ok: false, reason: 'horario-invalido', message: `El horario "${input.time}" no es valido` };
  }
  const start = toMinutes(normalized);

  if (date < todayStr()) {
    return { ok: false, reason: 'dia-pasado', message: 'No se pueden agendar citas en dias que ya pasaron' };
  }

  const blocked = whyBlocked(doctorId, date);
  if (blocked) {
    const message =
      blocked.reason === 'ausencia'
        ? `No se puede agendar: ${blocked.detail}`
        : blocked.reason === 'sin-abrir'
          ? 'La clinica no atiende ese dia'
          : blocked.reason === 'sin-cupo'
            ? 'No quedan cupos para ese medico en ese dia'
            : 'El medico no atiende ese dia';
    return { ok: false, reason: blocked.reason, message };
  }

  const schedule = getDaySchedule(doctorId, isoDayOfWeek(date))!;
  const open = toMinutes(schedule.startTime);
  const close = toMinutes(schedule.endTime);

  if (start < open || start + durationMinutes > close) {
    return {
      ok: false,
      reason: 'fuera-de-jornada',
      message: `El horario ${normalized} esta fuera de la jornada del medico (${schedule.startTime} a ${schedule.endTime})`,
    };
  }

  const taken = db
    .prepare('SELECT time, duration_minutes FROM appointments WHERE doctor_id = ? AND date = ? AND id != ?')
    .all(doctorId, date, input.ignoreAppointmentId ?? '') as BookedRow[];

  for (const t of taken) {
    const otherStart = normalizeTime(t.time) ? toMinutes(t.time) : Number.NaN;
    if (Number.isNaN(otherStart)) continue;
    const otherEnd = otherStart + (t.duration_minutes > 0 ? t.duration_minutes : 30);
    if (start < otherEnd && otherStart < start + durationMinutes) {
      return {
        ok: false,
        reason: 'ocupado',
        message: `Ese horario ya esta ocupado (${normalizeTime(t.time)})`,
      };
    }
  }

  return { ok: true };
}
