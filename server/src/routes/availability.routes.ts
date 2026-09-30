import { Router } from 'express';
import { getAvailableSlots, getBookableDays, normalizeTime } from '../services/availability.js';

export const availabilityRouter = Router();

/** Dias que se pueden reservar para un medico, con el motivo si no se puede. */
availabilityRouter.get('/days', (req, res) => {
  const doctorId = req.query.doctorId ? String(req.query.doctorId) : null;
  if (!doctorId) {
    res.status(400).json({ error: 'El parametro doctorId es requerido' });
    return;
  }
  const rawFrom = req.query.from ? String(req.query.from) : null;
  const days = req.query.days ? Number(req.query.days) : undefined;
  if (days !== undefined && (!Number.isInteger(days) || days <= 0 || days > 180)) {
    res.status(400).json({ error: 'El parametro days debe ser un entero entre 1 y 180' });
    return;
  }
  // Una fecha con formato inesperado se ignora y arranca desde hoy.
  const from = rawFrom && /^\d{4}-\d{2}-\d{2}$/.test(rawFrom) ? rawFrom : null;
  res.json({ doctorId, from, days: getBookableDays(doctorId, from ?? undefined, days) });
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
