export type NavRoute =
  | 'dashboard-de-citas'
  | 'pacientes-y-historial-clinico'
  | 'agenda-y-disponibilidad'
  | 'recetas-y-examenes'
  | 'notificaciones-y-alertas'
  | 'configuracion-del-sistema';

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
