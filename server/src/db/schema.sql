-- MedControl Clinical Suite - Esquema SQLite (espejo de docs/DB_STRUCTURE_PROPOSAL.md)

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','doctor')),
  doctor_id     TEXT,
  avatar_url    TEXT,
  active        INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS doctors (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  short_name    TEXT,
  specialty     TEXT NOT NULL,
  active_today  INTEGER NOT NULL DEFAULT 1,
  avatar_url    TEXT
);

CREATE TABLE IF NOT EXISTS patients (
  id                TEXT PRIMARY KEY,
  ci                TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  birth_date        TEXT,
  age               INTEGER,
  phone             TEXT,
  email             TEXT,
  address           TEXT,
  insurance         TEXT,
  blood_type        TEXT,
  allergies         TEXT NOT NULL DEFAULT '[]',
  chronic_conditions TEXT NOT NULL DEFAULT '[]',
  consent_signed    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS appointments (
  id                  TEXT PRIMARY KEY,
  date                TEXT NOT NULL,
  time                TEXT NOT NULL,
  duration_minutes    INTEGER NOT NULL,
  patient_id          TEXT REFERENCES patients(id),
  doctor_id           TEXT REFERENCES doctors(id),
  reason              TEXT NOT NULL,
  status              TEXT NOT NULL CHECK (status IN ('pending','confirmed','checked-in','in-triage','triaged','in-progress','completed','break','no-show')),
  consultation_type_id TEXT,
  relative_time       TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS triage_vitals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_id TEXT NOT NULL UNIQUE REFERENCES appointments(id),
  systolic      INTEGER NOT NULL,
  diastolic     INTEGER NOT NULL,
  pulse         INTEGER NOT NULL,
  temperature   REAL NOT NULL,
  spo2          INTEGER NOT NULL,
  weight        REAL,
  height        INTEGER,
  notes         TEXT,
  taken_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS consultations (
  id                   TEXT PRIMARY KEY,
  patient_id           TEXT NOT NULL REFERENCES patients(id),
  appointment_id       TEXT REFERENCES appointments(id),
  doctor_id            TEXT REFERENCES doctors(id),
  date                 TEXT NOT NULL,
  time                 TEXT NOT NULL,
  type                 TEXT NOT NULL,
  chief_complaint      TEXT,
  history_of_present_illness TEXT,
  physical_exam        TEXT,
  vitals               TEXT,
  diagnosis_code       TEXT,
  diagnosis_description TEXT,
  treatment_plan       TEXT,
  notes                TEXT,
  status               TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft','completed'))
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id              TEXT PRIMARY KEY,
  patient_id      TEXT REFERENCES patients(id),
  doctor_id       TEXT REFERENCES doctors(id),
  consultation_id TEXT REFERENCES consultations(id),
  patient_name    TEXT NOT NULL,
  ci              TEXT,
  date            TEXT NOT NULL,
  time            TEXT NOT NULL,
  notes           TEXT,
  status          TEXT NOT NULL CHECK (status IN ('Vigente en Farmacia','Emitida Hoy','Finalizada'))
);

CREATE TABLE IF NOT EXISTS prescription_medications (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  prescription_id  TEXT NOT NULL REFERENCES prescriptions(id),
  name             TEXT NOT NULL,
  dose             TEXT,
  frequency        TEXT,
  duration         TEXT
);

CREATE TABLE IF NOT EXISTS working_days (
  date TEXT PRIMARY KEY,
  note TEXT
);

CREATE TABLE IF NOT EXISTS day_schedules (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id      TEXT REFERENCES doctors(id),
  day_of_week    INTEGER NOT NULL,
  enabled        INTEGER NOT NULL DEFAULT 1,
  start_time     TEXT,
  end_time       TEXT,
  total_capacity INTEGER
);

CREATE TABLE IF NOT EXISTS absences (
  id                TEXT PRIMARY KEY,
  doctor_id         TEXT REFERENCES doctors(id),
  reason            TEXT NOT NULL,
  location          TEXT,
  type              TEXT NOT NULL,
  start_date        TEXT NOT NULL,
  end_date          TEXT NOT NULL,
  affected_note     TEXT,
  collision_status  TEXT,
  validation_status TEXT,
  icon_name         TEXT
);

CREATE TABLE IF NOT EXISTS alerts_notifications (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT,
  time           TEXT NOT NULL,
  level          TEXT NOT NULL CHECK (level IN ('critical','info','success')),
  icon           TEXT,
  action         TEXT,
  route          TEXT,
  patient_id     TEXT REFERENCES patients(id),
  appointment_id TEXT REFERENCES appointments(id),
  is_read        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS consultation_types (
  id               TEXT PRIMARY KEY CHECK (id IN ('primera','control','sobrecupo','examenes')),
  title            TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price            TEXT NOT NULL,
  note             TEXT,
  suggested        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS diagnosis_codes (
  code  TEXT PRIMARY KEY,
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exam_orders (
  id              TEXT PRIMARY KEY,
  consultation_id TEXT NOT NULL REFERENCES consultations(id),
  patient_id      TEXT NOT NULL REFERENCES patients(id),
  doctor_id       TEXT REFERENCES doctors(id),
  patient_name    TEXT NOT NULL,
  doctor_name     TEXT NOT NULL,
  date            TEXT NOT NULL,
  time            TEXT NOT NULL,
  priority        TEXT NOT NULL CHECK (priority IN ('rutina','urgencia')),
  notes           TEXT,
  status          TEXT NOT NULL CHECK (status IN ('pending','in-progress','completed'))
);

CREATE TABLE IF NOT EXISTS exam_order_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      TEXT NOT NULL REFERENCES exam_orders(id),
  exam_id       TEXT NOT NULL REFERENCES exam_templates(id),
  name          TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('laboratorio','imagen','funcional','procedimiento')),
  fasting       INTEGER NOT NULL DEFAULT 0,
  preparation   TEXT
);

CREATE TABLE IF NOT EXISTS medications (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  presentation        TEXT NOT NULL,
  pharmaceutical_form TEXT NOT NULL,
  route               TEXT NOT NULL,
  default_frequency   TEXT NOT NULL,
  requires_prescription INTEGER NOT NULL DEFAULT 1,
  controlled          INTEGER NOT NULL DEFAULT 0,
  active              INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS exam_templates (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('laboratorio','imagen','funcional','procedimiento')),
  fasting     INTEGER NOT NULL DEFAULT 0,
  preparation TEXT,
  active      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS triage_levels (
  id              TEXT PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE CHECK (code IN ('rojo','naranja','amarillo','verde','azul')),
  name            TEXT NOT NULL,
  max_wait_minutes INTEGER NOT NULL,
  description     TEXT,
  color           TEXT NOT NULL,
  active          INTEGER NOT NULL DEFAULT 1,
  ord             INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS triage_auto_rules (
  id         TEXT PRIMARY KEY,
  level_code TEXT NOT NULL REFERENCES triage_levels(code),
  field      TEXT NOT NULL CHECK (field IN ('spo2','temp','pulse','systolic','diastolic')),
  min_value  REAL,
  max_value  REAL
);

CREATE TABLE IF NOT EXISTS organization_settings (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  rut           TEXT NOT NULL,
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  footer_text   TEXT,
  signature_name TEXT
);

CREATE TABLE IF NOT EXISTS alert_rules (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT,
  category     TEXT NOT NULL CHECK (category IN ('triage','receta','examen','cita')),
  severity     TEXT NOT NULL CHECK (severity IN ('critical','warning','info','success')),
  icon         TEXT,
  action_label TEXT NOT NULL,
  route        TEXT,
  active       INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS catalog_users (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  role       TEXT NOT NULL CHECK (role IN ('admin','doctor')),
  doctor_id  TEXT,
  active     INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_exam_orders_patient ON exam_orders(patient_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_day_schedules_global ON day_schedules(doctor_id, day_of_week);