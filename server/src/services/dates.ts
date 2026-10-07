/** Fecha en el formato local DD/MM/YYYY (o DD/M/YYYY). */
const DMY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
/** Fecha ISO 8601 YYYY-MM-DD. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Hora de 12 h: '8:30 AM' o '10:15 PM'. */
const AMPM = /^(\d{1,2}):(\d{2})\s*([AP])M$/i;
/** Hora de 24 h: '08:30'. */
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Normaliza una fecha a ISO 8601 (YYYY-MM-DD). Acepta el format local
 * 'DD/MM/YYYY' que usaban consultas, recetas y ordenes, y devuelve null si
 * no reconoce el valor. Las columnas de fecha se guardan en ISO desde ahora.
 */
export function toIsoDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  const dmy = DMY.exec(text);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  return ISO_DATE.test(text) ? text : null;
}

/**
 * Normaliza una hora a 'HH:MM' de 24 horas. Acepta 'h:mm AM/PM' y horas que
 * ya vengan en 24 h; null si el valor no encaja con ninguno.
 */
export function toIsoTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  const ampm = AMPM.exec(text);
  if (ampm) {
    const hour = (Number(ampm[1]) % 12) + (ampm[3].toUpperCase() === 'P' ? 12 : 0);
    return `${String(hour).padStart(2, '0')}:${ampm[2]}`;
  }
  return HHMM.test(text) ? text : null;
}