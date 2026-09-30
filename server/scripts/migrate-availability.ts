/**
 * Migracion de disponibilidad: deja los datos listos para que la reserva de
 * turnos se ligue a los dias abiertos y al horario real de cada medico.
 *
 * Es idempotente: se puede correr las veces que haga falta.
 *
 *   npx tsx server/scripts/migrate-availability.ts
 *
 * Para correr contra una copia en vez de la base real:
 *
 *   env -u TURSO_DATABASE_URL DB_PATH=/tmp/copia.db npx tsx server/scripts/migrate-availability.ts
 */

import { db } from '../src/db/connection.js';

const HORIZON_DAYS = 56; // 8 semanas

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 1 = lunes ... 7 = domingo. day_of_week sigue esa convencion. */
function isoDayOfWeek(dateStr: string): number {
  return ((new Date(`${dateStr}T00:00:00`).getDay() + 6) % 7) + 1;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const JOURNEYS: Array<[number, number, string, string, number]> = [
  [1, 1, '08:00', '16:00', 20],
  [2, 1, '08:00', '16:00', 20],
  [3, 1, '08:00', '16:00', 20],
  [4, 1, '08:00', '16:00', 20],
  [5, 1, '08:00', '16:00', 20],
  [6, 0, '', '', 0],
  [7, 0, '', '', 0],
];

function step(label: string): void {
  console.log(`\n== ${label}`);
}

// 1. Horarios de cita en formato 24 horas.
//    El GLOB solo toma las filas que siguen en 12 horas, asi que volver a correr
//    el script no convierte dos veces.
step('Convirtiendo appointments.time a HH:MM (24 horas)');
const converted = db
  .prepare(
    `UPDATE appointments
        SET time = printf('%02d:%s',
              (CAST(substr(time, 1, 2) AS INTEGER) % 12)
                + CASE WHEN time LIKE '%PM' THEN 12 ELSE 0 END,
              substr(time, 4, 2))
      WHERE time GLOB '[0-9][0-9]:[0-9][0-9] [AP]M'`,
  )
  .run();
console.log(`   citas convertidas: ${converted.changes}`);

// El orden importa: primero se borran las filas sin medico (la tabla no tiene
// indice unico todavia y podrian existir duplicados), recien ahi se crea el
// indice que va a garantizar la unicidad de los horarios por medico.
step('Dejando day_schedules con medico asignado');
const removed = db.prepare('DELETE FROM day_schedules WHERE doctor_id IS NULL').run();
console.log(`   filas de horario de clinica eliminadas: ${removed.changes}`);

db.exec(
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_day_schedules_doctor_day
     ON day_schedules(doctor_id, day_of_week)`,
);
console.log('   indice unico (doctor_id, day_of_week) verificado');

const insertSchedule = db.prepare(`
  INSERT OR IGNORE INTO day_schedules (doctor_id, day_of_week, enabled, start_time, end_time, total_capacity)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const doctors = db.prepare('SELECT id FROM doctors').all() as Array<{ id: string }>;
let created = 0;
db.transaction(() => {
  for (const doc of doctors) {
    for (const [dow, enabled, start, end, cap] of JOURNEYS) {
      created += insertSchedule.run(doc.id, dow, enabled, start || null, end || null, cap).changes;
    }
  }
})();
console.log(`   horarios creados: ${created} (${doctors.length} medicos x 7 dias)`);

// 2. Dias abiertos: 8 semanas de lunes a viernes.
step('Abriendo dias habiles en working_days');
const today = todayStr();
const toOpen = new Set<string>();
for (let n = 0; n < HORIZON_DAYS; n++) {
  const date = addDays(today, n);
  const dow = isoDayOfWeek(date);
  if (dow >= 1 && dow <= 5) toOpen.add(date);
}
// Fechas que ya tienen citas en la base pero no estaban abiertas.
for (const date of ['2026-10-01', '2026-10-02']) toOpen.add(date);

const alreadyOpen = new Set(
  (db.prepare('SELECT date FROM working_days').all() as Array<{ date: string }>).map((r) => r.date),
);
const insertWorkingDay = db.prepare(
  'INSERT OR IGNORE INTO working_days (date, note) VALUES (?, ?)',
);
let opened = 0;
db.transaction(() => {
  for (const date of [...toOpen].sort()) {
    if (alreadyOpen.has(date)) continue;
    opened += insertWorkingDay.run(date, 'Turno normal').changes;
  }
})();
console.log(`   dias nuevos abiertos: ${opened} (de ${toOpen.size} habiles en el horizonte)`);

// 2b. Dias que labora cada medico.
//
// `working_days` era una lista global de fechas con horizonte fijo, y ya se
// acababa sola. La disponibilidad ahora se apoya en `doctor_working_dates`:
// los dias concretos que cada medico marco. Este paso siembra esa tabla desde
// `working_days` para que un despliegue no deje a nadie sin agenda; a partir
// de aqui los dias se administran desde la pantalla de Configuracion.
step('Dias que labora cada medico');
db.exec(`
  CREATE TABLE IF NOT EXISTS doctor_working_dates (
    doctor_id TEXT NOT NULL REFERENCES doctors(id),
    date      TEXT NOT NULL,
    note      TEXT,
    PRIMARY KEY (doctor_id, date)
  );
  CREATE INDEX IF NOT EXISTS idx_doctor_working_dates_date
    ON doctor_working_dates(date);
`);

const openDates = (db.prepare('SELECT date FROM working_days').all() as Array<{ date: string }>).map(
  r => r.date,
);
const insertWorkingDate = db.prepare(
  'INSERT OR IGNORE INTO doctor_working_dates (doctor_id, date, note) VALUES (?, ?, ?)',
);
let seeded = 0;
db.transaction(() => {
  for (const { id } of doctors) {
    for (const date of openDates) {
      seeded += insertWorkingDate.run(id, date, 'Migrado desde working_days').changes;
    }
  }
})();
console.log(`   dias marcados sembrados: ${seeded} (${doctors.length} medicos x ${openDates.length} fechas abiertas)`);
const perDoctor = db
  .prepare(
    'SELECT doctor_id, COUNT(*) AS n, MIN(date) AS desde, MAX(date) AS hasta FROM doctor_working_dates GROUP BY doctor_id ORDER BY doctor_id',
  )
  .all() as Array<{ doctor_id: string; n: number; desde: string; hasta: string }>;
for (const p of perDoctor) {
  console.log(`   ${p.doctor_id}: ${p.n} dias marcados, ${p.desde} a ${p.hasta}`);
}
const hasta = (db
  .prepare('SELECT MAX(date) AS d FROM doctor_working_dates')
  .get() as { d: string }).d;
const diasParaCubrir = Math.round(
  (Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
);
if (diasParaCubrir >= 0) {
  console.log(
    `   la agenda llega hasta ${hasta}: en ${diasParaCubrir} dias habra que marcar mas dias ` +
      `desde Configuracion, o usar "Marcar segun la jornada"`,
  );
}

// 3. Reporte final.
step('Resultado');
const total = db.prepare('SELECT COUNT(*) AS n FROM working_days').get() as { n: number };
const last = db
  .prepare('SELECT date FROM working_days ORDER BY date DESC LIMIT 1')
  .get() as { date: string };
console.log(`   working_days: ${total.n} dias, hasta ${last.date}`);

const schedules = db
  .prepare(
    'SELECT doctor_id, COUNT(*) AS n, SUM(enabled) AS activos FROM day_schedules GROUP BY doctor_id ORDER BY doctor_id',
  )
  .all() as Array<{ doctor_id: string; n: number; activos: number }>;
for (const s of schedules) {
  console.log(`   ${s.doctor_id}: ${s.n} dias configurados, ${s.activos} habilitados`);
}

const times = db.prepare('SELECT DISTINCT time FROM appointments ORDER BY time').all() as Array<{
  time: string;
}>;
console.log(`   horarios de cita en la base: ${times.map((t) => t.time).join(', ')}`);

const still12h = db
  .prepare(`SELECT COUNT(*) AS n FROM appointments WHERE time GLOB '[0-9][0-9]:[0-9][0-9] [AP]M'`)
  .get() as { n: number };
console.log(`   citas que quedan en formato 12 horas: ${still12h.n}`);

// El seed original metia dias corridos sin mirar el dia de la semana, asi que
// quedaron algunos sabados y domingos marcados como abiertos. Son fechas
// pasadas y no se tocan, pero la disponibilidad exige ademas que el medico
// tenga jornada habilitada ese dia, asi que en la practica no se pueden
// agendar. Se reporta para que quede a la vista.
const weekendOpen = db
  .prepare(
    `SELECT date FROM working_days
      WHERE strftime('%w', date) IN ('0', '6')
        AND date >= ? ORDER BY date`,
  )
  .all(today) as Array<{ date: string }>;
if (weekendOpen.length > 0) {
  console.log(
    `   aviso: ${weekendOpen.length} fines de semana marcados como abiertos desde hoy en adelante: ` +
      weekendOpen.map((d) => d.date).join(', '),
  );
}

console.log('\nMigracion completada.\n');
