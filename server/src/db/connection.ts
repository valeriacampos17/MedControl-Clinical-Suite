import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.resolve(__dirname, '../../data');
export const DB_PATH = process.env.DB_PATH ?? path.join(DATA_DIR, 'medcontrol.db');

if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function loadSchema(): void {
  const schemaPath = path.join(__dirname, '../../src/db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
}