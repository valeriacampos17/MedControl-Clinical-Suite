import { db, loadSchema } from './connection.js';

const ADD_ORGANIZATION_SLOGAN = `ALTER TABLE organization_settings ADD COLUMN slogan TEXT`;

function columnExists(table: string, column: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return cols.some((c) => c.name === column);
}

function migrateColumn(table: string, column: string, sql: string): void {
  if (!columnExists(table, column)) {
    db.exec(sql);
  }
}

export function migrate(): void {
  loadSchema();
  migrateColumn('organization_settings', 'slogan', ADD_ORGANIZATION_SLOGAN);
}

export function isSeeded(): boolean {
  const row = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
  return row.count > 0;
}