import Database from 'libsql';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.resolve(__dirname, '../../data');
export const DB_PATH = process.env.DB_PATH ?? path.join(DATA_DIR, 'medcontrol.db');

const syncUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

type ReplicaOptions = ConstructorParameters<typeof Database>[1] & {
  syncPeriod?: number;
  authToken?: string;
};

export const db = syncUrl
  ? new Database(DB_PATH, { syncUrl, authToken, syncPeriod: 60 } as ReplicaOptions)
  : new Database(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

if (syncUrl) db.sync();

export function loadSchema(): void {
  const schemaPath = path.join(__dirname, '../../src/db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
}
