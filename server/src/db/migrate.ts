import { db, loadSchema } from './connection.js';

const ADD_ORGANIZATION_SLOGAN = `ALTER TABLE organization_settings ADD COLUMN slogan TEXT`;

/**
 * PRAGMA y DDL se arman por interpolacion, asi que todo identificador que
 * llegue desde el codigo pasa por aqui antes.
 */
function assertIdentifier(name: string): void {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Identificador SQL invalido: ${name}`);
  }
}

function columnExists(table: string, column: string): boolean {
  assertIdentifier(table);
  assertIdentifier(column);
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

function migrateColumn(table: string, column: string, sql: string): void {
  if (!columnExists(table, column)) {
    db.exec(sql);
  }
}

export function tableExists(table: string): boolean {
  assertIdentifier(table);
  return !!db
    .prepare("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table);
}

export function indexExists(index: string): boolean {
  return !!db
    .prepare("SELECT 1 AS ok FROM sqlite_master WHERE type = 'index' AND name = ?")
    .get(index);
}

export function dropIndexIfExists(index: string): void {
  assertIdentifier(index);
  if (indexExists(index)) db.exec(`DROP INDEX IF EXISTS "${index}"`);
}
export function dropTableIfExists(table: string): void {
  assertIdentifier(table);
  if (tableExists(table)) db.exec(`DROP TABLE IF EXISTS "${table}"`);
}

/**
 * Reescribe los valores de una columna que coinciden con `pattern`. Solo
 * selecciona las filas que cambiarian, asi que cuando no hay nada que tocar
 * no cuesta nada.
 *
 * Se apoya en `rowid` para poder usarse tambien en tablas cuya clave es TEXT
 * (todas las de negocio) y en las de clave compuesta.
 */
export function convertIf(
  table: string,
  column: string,
  pattern: RegExp,
  replace: (value: string) => string,
): number {
  assertIdentifier(table);
  assertIdentifier(column);
  if (!tableExists(table) || !columnExists(table, column)) return 0;
  const rows = db
    .prepare(`SELECT rowid AS rid, "${column}" AS val FROM "${table}"`)
    .all() as { rid: number; val: unknown }[];
  let changed = 0;
  for (const row of rows) {
    if (typeof row.val !== 'string' || !pattern.test(row.val)) continue;
    const next = replace(row.val);
    if (next === row.val) continue;
    db.prepare(`UPDATE "${table}" SET "${column}" = ? WHERE rowid = ?`).run(next, row.rid);
    changed += 1;
  }
  return changed;
}

/**
 * Copia filas de una tabla a otra. Las columnas que `source` no tiene se
 * resuelven con `computed`, que recibe la fila de origen: sirve para rellenar
 * un `password_hash` que depende de cada registro.
 *
 * `INSERT OR IGNORE` es intencional: la fusion de dos catalogos repetidos
 * descarta el duplicado en lugar de abortar a mitad de camino.
 */
export function copyRows(
  source: string,
  target: string,
  columns: string[],
  computed: Record<string, (row: Record<string, unknown>) => unknown> = {},
): number {
  if (!tableExists(source) || !tableExists(target)) return 0;
  for (const column of columns) assertIdentifier(column);
  const rows = db.prepare(`SELECT * FROM "${source}"`).all() as Record<string, unknown>[];
  const columnList = columns.map((c) => `"${c}"`).join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO "${target}" (${columnList}) VALUES (${placeholders})`,
  );
  let copied = 0;
  for (const row of rows) {
    const values = columns.map((c) => (c in row ? row[c] : (computed[c]?.(row) ?? null)));
    if (stmt.run(...values).changes > 0) copied += 1;
  }
  return copied;
}

export function migrate(): void {
  loadSchema();
  migrateColumn('organization_settings', 'slogan', ADD_ORGANIZATION_SLOGAN);

  // Era el mismo predicado que idx_day_schedules_doctor_day, solo que duplicado.
  dropIndexIfExists('uq_day_schedules_global');

  // Filas del horario "global" anterior a la tabla por medico. Ningun lector
  // las ve: getDaySchedules() filtra con doctor_id = ? y ese filtro nunca
  // coincide con NULL.
  if (tableExists('day_schedules')) {
    db.exec('DELETE FROM day_schedules WHERE doctor_id IS NULL');
  }
}

export function isSeeded(): boolean {
  const row = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
  return row.count > 0;
}
