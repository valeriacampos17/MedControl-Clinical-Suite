export type NavRoute =
  | 'dashboard-de-citas'
  | 'pacientes-y-historial-clinico'
  | 'agenda-y-disponibilidad'
  | 'recetas-y-examenes'
  | 'notificaciones-y-alertas'
  | 'configuracion-del-sistema'
  | 'mantenimiento-de-catalogos'
  | 'login';

export type UserRole = 'admin' | 'doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  doctorId?: string;
  avatarUrl?: string;
}

export interface Patient {
  id: string;
  ci: string;
  name: string;
  age: number;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  insurance: string;
  bloodType: string;
  allergies: string[];
  chronicConditions: string[];
  consentSigned: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'checked-in' | 'in-triage' | 'triaged' | 'in-progress' | 'completed' | 'break' | 'no-show';

export interface AppointmentItem {
  id: string;
  date: string;
  time: string;
  durationMinutes: number;
  patientId: string;
  doctorId: string;
  reason: string;
  status: AppointmentStatus;
  relativeTime?: string;
  vitals?: TriageVitalsSnapshot;
}

export interface TriageVitalsSnapshot {
  bp: string;
  pulse: number;
  temp: number;
  spo2: number;
}

export interface RescheduleData {
  appointmentId: string;
  patientId: string;
  currentDate: string;
  currentTime: string;
}

export interface WorkingDay {
  date: string;
  note?: string;
}

export interface DaySchedule {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  totalCapacity: number;
}

export interface AbsenceBlock {
  id: string;
  reason: string;
  location: string;
  type: string;
  period: string;
  affectedNote: string;
  collisionStatus: string;
  validationStatus: string;
  iconName: string;
}

export interface NewPatientInput {
  name: string;
  rut: string;
  age: string;
  birthDate: string;
  phone: string;
  email: string;
  insurance: string;
  bloodType: string;
  allergies: string;
}

export interface VitalSigns {
  systolic: number;
  diastolic: number;
  pulse: number;
  temperature: number;
  spo2: number;
  weight: number;
  height: number;
}

export interface TriageVitals {
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  temp: number | null;
  spo2: number | null;
  weight: number | null;
  height: number | null;
  notes: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  physicalExam: string;
  vitals: VitalSigns;
  diagnosisCode: string;
  diagnosisDescription: string;
  treatmentPlan: string;
  notes: string;
  status: 'draft' | 'completed';
}

export type ExamCategory = 'laboratorio' | 'imagen' | 'funcional' | 'procedimiento';

export interface ExamTemplate {
  id: string;
  name: string;
  category: ExamCategory;
  fasting?: boolean;
  preparation?: string;
  active?: boolean;
}

export interface ExamOrderItem {
  examId: string;
  name: string;
  category: ExamCategory;
  fasting: boolean;
  preparation: string;
}

export type ExamOrderStatus = 'pending' | 'in-progress' | 'completed';
export type ExamOrderPriority = 'rutina' | 'urgencia';

export interface ExamOrder {
  id: string;
  consultationId: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  priority: ExamOrderPriority;
  notes: string;
  items: ExamOrderItem[];
  status: ExamOrderStatus;
}

export type PrescriptionStatus = 'Vigente en Farmacia' | 'Emitida Hoy' | 'Finalizada';

export interface PrescriptionMedication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  consultationId?: string;
  patientId: string;
  patientName: string;
  ci: string;
  doctorName: string;
  date: string;
  time: string;
  meds: PrescriptionMedication[];
  notes: string;
  status: PrescriptionStatus;
}

export type MedicationForm =
  | 'tableta'
  | 'cápsula'
  | 'jarabe'
  | 'suspensión'
  | 'inyectable'
  | 'inhalador'
  | 'crema'
  | 'supositorio'
  | 'gotas'
  | 'parche';

export type MedicationRoute =
  | 'oral'
  | 'inhalatoria'
  | 'inyectable'
  | 'tópica'
  | 'sublingual'
  | 'rectal'
  | 'oftálmica';

export interface Medication {
  id: string;
  name: string;
  presentation: string;
  pharmaceuticalForm: MedicationForm;
  route: MedicationRoute;
  defaultFrequency: string;
  requiresPrescription: boolean;
  controlled: boolean;
  active: boolean;
}

export interface Diagnosis {
  id: string;
  code: string;
  description: string;
  active: boolean;
}

export type TriageLevelCode = 'rojo' | 'naranja' | 'amarillo' | 'verde' | 'azul';

export interface TriageLevel {
  id: string;
  code: TriageLevelCode;
  name: string;
  maxWaitMinutes: number;
  description: string;
  color: string;
  active: boolean;
  order: number;
}

export type TriageRuleField = 'spo2' | 'temp' | 'pulse' | 'systolic' | 'diastolic';

export interface TriageAutoRule {
  id: string;
  levelCode: TriageLevelCode;
  field: TriageRuleField;
  min: number | null;
  max: number | null;
}

export interface OrganizationSettings {
  id: string;
  name: string;
  rut: string;
  address: string;
  phone: string;
  email: string;
  footerText: string;
  signatureName: string;
}

export type AlertCategory = 'triage' | 'receta' | 'examen' | 'cita';
export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  icon: string;
  actionLabel: string;
  route?: NavRoute;
  active: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor';
  doctorId?: string;
  active: boolean;
}
