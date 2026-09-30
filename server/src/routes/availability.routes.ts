import { Router } from 'express';
import {
  getAvailableSlots,
  getBookableDays,
  getOpenDates,
  normalizeTime,
} from '../services/availability.js';

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
