export type NavRoute =
  | 'dashboard-de-citas'
  | 'pacientes-y-historial-clinico'
  | 'agenda-y-disponibilidad'
  | 'recetas-y-examenes'
  | 'notificaciones-y-alertas'
  | 'configuracion-del-sistema';

export interface Patient {
  id: string;
  name: string;
  rut: string;
  age: number;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  insurance: string;
  insuranceDetail?: string;
  bloodType: string;
  tutor: string;
  allergies: string[];
  severeAllergies: string[];
  chronicConditions: string[];
  consentSigned: boolean;
  avatarUrl: string;
  fileNumber: string;
}

export interface Doctor {
  id: string;
  name: string;
  regNumber: string;
  sisNumber: string;
  specialty: string;
  subspecialty: string;
  level: string;
  box: string;
  floor: string;
  wing: string;
  avatarUrl: string;
  email: string;
  phone: string;
  annex: string;
  statusText: string;
  activeToday: boolean;
}

export interface AppointmentItem {
  id: string;
  time: string;
  durationMinutes: number;
  patientName: string;
  patientAge: number;
  patientInitials: string;
  patientRut: string;
  insurance: string;
  reason: string;
  status: 'completed' | 'in-progress' | 'confirmed' | 'break' | 'pending';
  relativeTime?: string;
  vitals?: {
    bp: string;
    pulse: number;
    temp: number;
    spo2: number;
  };
}

export interface DaySchedule {
  day: string;
  enabled: boolean;
  morningStart: string;
  morningEnd: string;
  morningPatients: number;
  breakStart: string;
  breakEnd: string;
  breakNote: string;
  afternoonStart: string;
  afternoonEnd: string;
  afternoonPatients: number;
  totalCapacity: number;
  specialBadge?: string;
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
