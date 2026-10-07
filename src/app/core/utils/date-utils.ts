/** Fecha local 'DD/MM/YYYY' (o 'D/M/YYYY') que usan pantallas antiguas. */
const DMY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
/** Hora de 12 h: '8:30 AM'. */
const AMPM = /^(\d{1,2}):(\d{2})\s*([AP])M$/i;

/**
 * Normaliza una fecha a ISO 8601 (YYYY-MM-DD). Acepta Date o string; si ya es
 * ISO la devuelve, si es 'DD/MM/YYYY' la convierte. Se usa al emitir consultas,
 * recetas y ordenes de examen, que antes enviaban el formato local.
 */
export function toIsoDate(value: Date | string): string {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  const dmy = DMY.exec(value.trim());
  return dmy ? `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}` : value.trim();
}

/** Hora de 12 h 'h:mm AM/PM' a 'HH:MM' de 24 horas. Si ya viene en 24 h la deja igual. */
export function toIsoTime(value: string): string {
  const ampm = AMPM.exec(value.trim());
  if (ampm) {
    const hour = (Number(ampm[1]) % 12) + (ampm[3].toUpperCase() === 'P' ? 12 : 0);
    return `${String(hour).padStart(2, '0')}:${ampm[2]}`;
  }
  return value.trim();
}

/** Fecha ISO a 'DD/MM/YYYY' para mostrar; si ya es 'DD/MM/YYYY' la deja igual. */
export function formatDateDisplay(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

/** Hora 'HH:MM' o 'h:mm AM/PM' a 'HH:MM' para mostrar de forma uniforme (24 h). */
export function formatTimeDisplay(value: string): string {
  return toIsoTime(value);
}