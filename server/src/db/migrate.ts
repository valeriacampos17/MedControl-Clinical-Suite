import { db, loadSchema } from './connection.js';

export function migrate(): void {
  loadSchema();
}

export function isSeeded(): boolean {
  const row = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
  return row.count > 0;
}