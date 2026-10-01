import { Router } from 'express';
import {
  getAvailableSlots,
  getBookableDays,
  getOpenDates,
  normalizeTime,
} from '../services/availability.js';
import {
  getDoctorWorkingDates,
  lastSchedulableDate,
  outsideHorizon,
  markDoctorWorkingDate,
  markFromSchedule,
  setDoctorWorkingDates,
  unmarkDoctorWorkingDate,
} from '../services/schedule.js';

export const availabilityRouter = Router();

const MAX_RANGE_DAYS = 120;

/** Dias inclusive entre dos fechas ISO. */
function dayCount(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
}

function addDaysStr(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Dias que se pueden reservar para un medico, con el motivo si no se puede. */
availabilityRouter.get('/days', (req, res) => {
  const doctorId = req.query.doctorId ? String(req.query.doctorId) : null;
  if (!doctorId) {
    res.status(400).json({ error: 'El parametro doctorId es requerido' });
    return;
  }
  const rawFrom = req.query.from ? String(req.query.from) : null;
  const rawTo = req.query.to ? String(req.query.to) : null;
  // Una fecha con formato inesperado se ignora y arranca desde hoy.
  const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
  const from = rawFrom && isDate(rawFrom) ? rawFrom : null;
  const to = rawTo && isDate(rawTo) ? rawTo : null;
  if (to && from && to < from) {
    res.status(400).json({ error: 'El parametro to no puede ser anterior a from' });
    return;
  }
  // Tope del rango: el calendario pide un mes, no una agenda infinita.
  if (from && to && dayCount(from, to) > MAX_RANGE_DAYS) {
    res.status(400).json({ error: `El rango no puede superar ${MAX_RANGE_DAYS} dias` });
    return;
  }
  res.json({ doctorId, from, days: getBookableDays(doctorId, from ?? undefined, to ?? undefined) });
});

/**
 * Dias que un medico tiene marcados para laborar. Un rango del 5 al 10 de
 * octubre son seis filas aqui, una por dia: por eso el 12 se puede desmarcar
 * y volver a marcar sin tocar los demas.
 */
availabilityRouter.get('/working-dates', (req, res) => {
  const doctorId = req.query.doctorId ? String(req.query.doctorId) : null;
  if (!doctorId) {
    res.status(400).json({ error: 'El parametro doctorId es requerido' });
    return;
  }
  const from = req.query.from ? String(req.query.from) : undefined;
  const to = req.query.to ? String(req.query.to) : undefined;
  res.json({ doctorId, dates: getDoctorWorkingDates(doctorId, from, to) });
});

/** Reemplaza el conjunto completo de dias marcados. */
availabilityRouter.put('/working-dates', (req, res) => {
  const doctorId = String(req.body?.doctorId ?? req.query.doctorId ?? '');
  if (!doctorId) {
    res.status(400).json({ error: 'El campo doctorId es requerido' });
    return;
  }
  const days = Array.isArray(req.body?.dates) ? (req.body.dates as Array<{ date: string; note?: string }>) : [];
  const invalid = days.find(d => !/^\d{4}-\d{2}-\d{2}$/.test(String(d?.date ?? '')));
  if (invalid) {
    res.status(400).json({ error: `Fecha invalida: ${String(invalid?.date)}` });
    return;
  }
  const limit = lastSchedulableDate();
  const beyond = days.find(d => String(d.date) > limit);
  if (beyond) {
    res.status(400).json({ error: `No se puede marcar mas alla del ${limit} (tres meses vista)` });
    return;
  }
  res.json({ doctorId, dates: setDoctorWorkingDates(doctorId, days.map(d => ({ date: d.date, note: d.note ?? null }))) });
});

/** Marca de una vez los proximos dias que coincidan con la jornada semanal. */
// Esta ruta literal va antes que '/working-dates/:date': Express resuelve en orden
// de definicion y si no, el parametro dinamico se come 'mark-from-schedule'.
availabilityRouter.post('/working-dates/mark-from-schedule', (req, res) => {
  const doctorId = String(req.body?.doctorId ?? req.query.doctorId ?? '');
  if (!doctorId) {
    res.status(400).json({ error: 'El campo doctorId es requerido' });
    return;
  }
  const horizon = Number(req.body?.days ?? 60);
  // El tope real no es 365 sino los dias que faltan hasta el horizonte: pedir mas
  // solo marcaria la misma ventana y haria creer que se avanzo.
  const maxDays = dayCount(addDaysStr(new Date().toISOString().slice(0, 10), -1), lastSchedulableDate());
  if (!Number.isInteger(horizon) || horizon <= 0 || horizon > maxDays) {
    res.status(400).json({ error: `El campo days debe ser un entero entre 1 y ${maxDays} (hasta el horizonte)` });
    return;
  }
  const marked = markFromSchedule(doctorId, horizon);
  res.json({ doctorId, marked, dates: getDoctorWorkingDates(doctorId) });
});

/** Marca o desmarca un dia. Es lo que usa el clic en el calendario. */
availabilityRouter.post('/working-dates/:date', (req, res) => {
  const doctorId = String(req.body?.doctorId ?? req.query.doctorId ?? '');
  const date = req.params.date;
  if (!doctorId) {
    res.status(400).json({ error: 'El campo doctorId es requerido' });
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: `Fecha invalida: ${date}` });
    return;
  }
  const outside = outsideHorizon(date);
  if (outside) {
    res.status(400).json({ error: outside });
    return;
  }
  const marked = req.body?.marked;
  if (marked === false) {
    unmarkDoctorWorkingDate(doctorId, date);
  } else {
    markDoctorWorkingDate(doctorId, date, req.body?.note ?? null);
  }
  res.json({ doctorId, date, marked: marked !== false });
});

/** Fechas en las que la clinica atiende, para el Dashboard. */
availabilityRouter.get('/open-dates', (req, res) => {
  const isDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const from = isDate(req.query.from) ? String(req.query.from) : todayStr;
  const to = isDate(req.query.to) ? String(req.query.to) : addDaysStr(from, 41);
  if (to < from) {
    res.status(400).json({ error: 'El parametro to no puede ser anterior a from' });
    return;
  }
  if (dayCount(from, to) > MAX_RANGE_DAYS) {
    res.status(400).json({ error: `El rango no puede superar ${MAX_RANGE_DAYS} dias` });
    return;
  }
  res.json({ from, to, openDates: getOpenDates(from, to) });
});

/** Horarios libres de un dia, segun la duracion del tipo de consulta. */
availabilityRouter.get('/slots', (req, res) => {
  const doctorId = req.query.doctorId ? String(req.query.doctorId) : null;
  const date = req.query.date ? String(req.query.date) : null;
  if (!doctorId || !date) {
    res.status(400).json({ error: 'Los parametros doctorId y date son requeridos' });
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: `El parametro date no es una fecha valida: ${date}` });
    return;
  }
  const durationMinutes = Number(req.query.durationMinutes ?? 30);
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0 || durationMinutes > 480) {
    res.status(400).json({ error: 'El parametro durationMinutes debe ser un entero entre 1 y 480' });
    return;
  }
  res.json(getAvailableSlots(doctorId, date, durationMinutes));
});

/** Normaliza un horario a HH:MM de 24 horas, util para el cliente. */
availabilityRouter.get('/normalize-time', (req, res) => {
  const time = req.query.time ? String(req.query.time) : '';
  const normalized = normalizeTime(time);
  if (!normalized) {
    res.status(400).json({ error: `Hora invalida: ${time}` });
    return;
  }
  res.json({ time, normalized });
});
