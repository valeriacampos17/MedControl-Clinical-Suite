import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import {
  Patient,
  Doctor,
  AppointmentItem,
  DaySchedule,
  AbsenceBlock,
  Consultation,
  TriageVitals,
  WorkingDay,
  ExamTemplate,
  ExamOrder,
  Prescription,
  Medication,
  Diagnosis,
  TriageLevel,
  TriageAutoRule,
  OrganizationSettings,
  AlertRule,
  AppUser,
} from '../models/types';

export interface DoctorSummary {
  id: string;
  name: string;
  shortName: string;
  specialty: string;
  activeToday: boolean;
  avatarUrl: string;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Injectable({ providedIn: 'root' })
export class MockDataService {
  readonly userRole = signal<'admin' | 'doctor'>('admin');

  private storage<T>(key: string, seed: T): WritableSignal<T> {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return signal<T>(JSON.parse(raw) as T);
    } catch {
      /* seed fallback */
    }
    return signal<T>(seed);
  }

  private persist(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage no disponible */
    }
  }

  readonly doctors = signal<DoctorSummary[]>([
    { id: 'doc-aguirre', name: 'Dra. Noemí Aguirre', shortName: 'Dra. Aguirre', specialty: 'Medicina General', activeToday: true, avatarUrl: 'assets/images/doctors/doctor-aguirre.jpeg' },
    { id: 'doc-mawad', name: 'Dr. Jorge Mawad', shortName: 'Dr. Mawad', specialty: 'Medicina General', activeToday: true, avatarUrl: 'assets/images/doctors/doctor-mawad.jpeg' },
    { id: 'doc-munoz', name: 'Dra. Sandra Muñoz', shortName: 'Dra. Muñoz', specialty: 'Medicina General', activeToday: true, avatarUrl: 'assets/images/doctors/doctor-munoz.webp' },
  ]);

  readonly selectedDoctorId = signal<string | null>('doc-aguirre');

  readonly selectedDoctor = computed(() => {
    const id = this.selectedDoctorId();
    if (id) {
      return this.doctors().find(d => d.id === id) || this.doctors()[0];
    }
    return {
      id: 'all',
      name: 'Todos los Médicos',
      shortName: 'Todos',
      specialty: 'Medicina General',
      activeToday: true,
    };
  });

  readonly doctor: Doctor = {
    id: 'doc-aguirre',
    name: 'Dra. Noemí Aguirre',
    specialty: 'Medicina General',
  };

  readonly patients = signal<Patient[]>([
    { id: 'MED-0001', ci: 'V-12.345.678', name: 'María García López', age: 58, birthDate: '12/05/1966', phone: '+58 412-8412893', email: 'maria.garcia@email.com', address: 'Av. Libertador 1240, Caracas', insurance: 'Seguros Caracas', bloodType: 'O+', allergies: ['Penicilina'], chronicConditions: ['Hipertensión Arterial', 'Dislipidemia'], consentSigned: true },
    { id: 'MED-0002', ci: 'V-15.204.912', name: 'Carlos Rodríguez Pérez', age: 42, birthDate: '18/08/1982', phone: '+58 414-7711445', email: 'carlos.rodriguez@email.com', address: 'Calle Principal 890, Maracaibo', insurance: 'Seguros Mercantil', bloodType: 'A+', allergies: [], chronicConditions: [], consentSigned: true },
    { id: 'MED-0003', ci: 'V-18.901.234', name: 'Ana Martínez Silva', age: 35, birthDate: '22/11/1989', phone: '+58 424-5551234', email: 'ana.martinez@email.com', address: 'Av. Francisco de Miranda, Caracas', insurance: 'Plan Madisons', bloodType: 'B+', allergies: ['Sulfamidas'], chronicConditions: [], consentSigned: true },
    { id: 'MED-0004', ci: 'V-11.450.812', name: 'Roberto Sánchez Díaz', age: 64, birthDate: '03/02/1960', phone: '+58 412-9998877', email: 'roberto.sanchez@email.com', address: 'Urb. Las Mercedes, Caracas', insurance: 'Seguros La Previsora', bloodType: 'O-', allergies: ['AINEs'], chronicConditions: ['Diabetes Tipo 2', 'HTA Grado 2'], consentSigned: true },
    { id: 'MED-0005', ci: 'V-16.782.339', name: 'Sofía Ramírez Torres', age: 42, birthDate: '14/07/1982', phone: '+58 416-3334455', email: 'sofia.ramirez@email.com', address: 'Av. Bolívar 456, Valencia', insurance: 'Seguros Caracas', bloodType: 'A-', allergies: [], chronicConditions: ['Arritmia'], consentSigned: true },
    { id: 'MED-0006', ci: 'V-17.891.203', name: 'Carolina Muñoz Herrera', age: 35, birthDate: '25/09/1989', phone: '+58 412-7776655', email: 'carolina.munoz@email.com', address: 'Calle 5, Barquisimeto', insurance: 'Plan Madisons', bloodType: 'AB+', allergies: [], chronicConditions: ['Diabetes Tipo 2'], consentSigned: true },
    { id: 'MED-0007', ci: 'V-10.234.891', name: 'Pedro Santana Blanco', age: 67, birthDate: '08/12/1956', phone: '+58 414-2223344', email: 'pedro.santana@email.com', address: 'Urb. El Paraiso, Caracas', insurance: 'Seguros Mercantil', bloodType: 'O+', allergies: ['Penicilina', 'Mariscos'], chronicConditions: ['Hipertensión', 'Insuficiencia Cardíaca'], consentSigned: true },
    { id: 'MED-0008', ci: 'V-15.901.456', name: 'Lucía Fernández Rivas', age: 39, birthDate: '30/03/1985', phone: '+58 424-1112233', email: 'lucia.fernandez@email.com', address: 'Av. Universidad 789, Caracas', insurance: 'Seguros La Previsora', bloodType: 'A+', allergies: [], chronicConditions: [], consentSigned: true },
    { id: 'MED-0009', ci: 'V-12.678.345', name: 'Jorge Tapia Gómez', age: 55, birthDate: '16/06/1969', phone: '+58 412-4445566', email: 'jorge.tapia@email.com', address: 'Calle Real 321, Los Teques', insurance: 'Seguros Caracas', bloodType: 'B-', allergies: [], chronicConditions: ['Colesterol Alto'], consentSigned: true },
    { id: 'MED-0010', ci: 'V-18.345.678', name: 'Valentina Soto Mendes', age: 29, birthDate: '19/01/1995', phone: '+58 416-8887766', email: 'valentina.soto@email.com', address: 'Av. Principal, Guatire', insurance: 'Plan Madisons', bloodType: 'O+', allergies: [], chronicConditions: [], consentSigned: false },
    { id: 'MED-0011', ci: 'V-12.890.123', name: 'Héctor Fuentes Castillo', age: 57, birthDate: '05/10/1967', phone: '+58 414-9990011', email: 'hector.fuentes@email.com', address: 'Calle Norte 654, Caracas', insurance: 'Seguros Mercantil', bloodType: 'A+', allergies: ['Ibuprofeno'], chronicConditions: ['Hipertensión'], consentSigned: true },
    { id: 'MED-0012', ci: 'V-13.901.234', name: 'Isabel Navarro Peña', age: 49, birthDate: '11/04/1975', phone: '+58 424-6665544', email: 'isabel.navarro@email.com', address: 'Urb. Los Samanes, Caracas', insurance: 'Seguros Caracas', bloodType: 'B+', allergies: [], chronicConditions: [], consentSigned: true },
  ]);

  getPatient(id: string): Patient | undefined {
    return this.patients().find(p => p.id === id);
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).filter((_, i, arr) => i === 0 || i === arr.length - 1).join('').toUpperCase();
  }

  readonly appointments = signal<AppointmentItem[]>([
    { id: 'apt-1', date: todayStr(), time: '08:30 AM', durationMinutes: 40, patientId: 'MED-0001', doctorId: 'doc-aguirre', reason: 'Control Hipertensión Arterial', status: 'completed' },
    { id: 'apt-2', date: todayStr(), time: '09:15 AM', durationMinutes: 45, patientId: 'MED-0005', doctorId: 'doc-aguirre', reason: 'Evaluación de Arritmia y Disnea', status: 'in-progress', vitals: { bp: '120/80', pulse: 72, temp: 36.5, spo2: 99 } },
    { id: 'apt-3', date: todayStr(), time: '10:00 AM', durationMinutes: 30, patientId: 'MED-0004', doctorId: 'doc-aguirre', reason: 'Primera Consulta - Dolor Torácico', status: 'pending' },
    { id: 'apt-4', date: todayStr(), time: '10:45 AM', durationMinutes: 45, patientId: '', doctorId: '', reason: 'Espacio reservado para informe médico', status: 'break' },
    { id: 'apt-5', date: todayStr(), time: '11:30 AM', durationMinutes: 30, patientId: 'MED-0003', doctorId: 'doc-aguirre', reason: 'Control Rutinario', status: 'pending' },
    { id: 'apt-6', date: addDays(todayStr(), 1), time: '08:30 AM', durationMinutes: 30, patientId: 'MED-0006', doctorId: 'doc-mawad', reason: 'Control Diabetes Mellitus Tipo 2', status: 'confirmed' },
    { id: 'apt-7', date: addDays(todayStr(), 1), time: '10:00 AM', durationMinutes: 45, patientId: 'MED-0007', doctorId: 'doc-mawad', reason: 'Control Presión Arterial Post-Operatorio', status: 'pending' },
    { id: 'apt-8', date: addDays(todayStr(), 1), time: '11:30 AM', durationMinutes: 30, patientId: 'MED-0002', doctorId: 'doc-mawad', reason: 'Chequeo General', status: 'confirmed' },
    { id: 'apt-9', date: addDays(todayStr(), 2), time: '09:00 AM', durationMinutes: 40, patientId: 'MED-0009', doctorId: 'doc-mawad', reason: 'Ecocardiograma Transtorácico', status: 'confirmed' },
    { id: 'apt-10', date: addDays(todayStr(), 2), time: '10:30 AM', durationMinutes: 30, patientId: 'MED-0008', doctorId: 'doc-mawad', reason: 'Control Colesterol - Resultados', status: 'pending' },
    { id: 'apt-11', date: addDays(todayStr(), 3), time: '08:30 AM', durationMinutes: 35, patientId: 'MED-0004', doctorId: 'doc-munoz', reason: 'Seguimiento Arritmia Cardíaca', status: 'confirmed' },
    { id: 'apt-12', date: addDays(todayStr(), 3), time: '10:15 AM', durationMinutes: 30, patientId: 'MED-0005', doctorId: 'doc-munoz', reason: 'Control Colesterol y Triglicéridos', status: 'pending' },
    { id: 'apt-13', date: addDays(todayStr(), 5), time: '09:00 AM', durationMinutes: 40, patientId: 'MED-0007', doctorId: 'doc-munoz', reason: 'Control Insuficiencia Cardíaca', status: 'confirmed' },
    { id: 'apt-14', date: addDays(todayStr(), 6), time: '08:30 AM', durationMinutes: 30, patientId: 'MED-0010', doctorId: 'doc-munoz', reason: 'Primera Consulta - Dolor Torácico', status: 'pending' },
    { id: 'apt-15', date: addDays(todayStr(), 6), time: '10:45 AM', durationMinutes: 45, patientId: 'MED-0002', doctorId: 'doc-munoz', reason: 'Stress Test / Prueba de Esfuerzo', status: 'confirmed' },
    { id: 'apt-16', date: addDays(todayStr(), 7), time: '09:30 AM', durationMinutes: 30, patientId: 'MED-0009', doctorId: 'doc-aguirre', reason: 'Control Hipertensión Resistente', status: 'pending' },
    { id: 'apt-17', date: todayStr(), time: '09:30 AM', durationMinutes: 30, patientId: 'MED-0011', doctorId: 'doc-mawad', reason: 'Chequeo General', status: 'confirmed' },
    { id: 'apt-18', date: todayStr(), time: '10:00 AM', durationMinutes: 30, patientId: 'MED-0006', doctorId: 'doc-munoz', reason: 'Control Diabetes Mellitus Tipo 2', status: 'pending' },
    { id: 'apt-19', date: todayStr(), time: '10:00 AM', durationMinutes: 30, patientId: 'MED-0008', doctorId: 'doc-munoz', reason: 'Primera Consulta - Palpitaciones', status: 'pending' },
    { id: 'apt-past-1', date: addDays(todayStr(), -1), time: '09:00 AM', durationMinutes: 30, patientId: 'MED-0011', doctorId: 'doc-aguirre', reason: 'Control Cardiología Rutinario', status: 'completed' },
    { id: 'apt-past-2', date: addDays(todayStr(), -1), time: '10:30 AM', durationMinutes: 30, patientId: 'MED-0012', doctorId: 'doc-mawad', reason: 'Evaluación de Palpitaciones', status: 'no-show' },
  ]);

  readonly schedule = signal<DaySchedule[]>([
    { day: 'Lunes', enabled: true, startTime: '08:00', endTime: '16:00', totalCapacity: 20 },
    { day: 'Martes', enabled: true, startTime: '08:00', endTime: '16:00', totalCapacity: 20 },
    { day: 'Miércoles', enabled: true, startTime: '08:00', endTime: '16:00', totalCapacity: 20 },
    { day: 'Jueves', enabled: true, startTime: '08:00', endTime: '16:00', totalCapacity: 20 },
    { day: 'Viernes', enabled: true, startTime: '08:00', endTime: '16:00', totalCapacity: 20 },
    { day: 'Sábado', enabled: false, startTime: '', endTime: '', totalCapacity: 0 },
  ]);

  readonly absences = signal<AbsenceBlock[]>([
    {
      id: 'abs-1',
      reason: 'Congreso Médico Venezolano 2026',
      location: 'Hotel Alba Caracas',
      type: 'Actividad Académica',
      period: '15 Nov 2026 - 18 Nov 2026 (4 días)',
      affectedNote: '0 citas colisionadas',
      collisionStatus: 'ok',
      validationStatus: 'Aprobado por Dirección Médica',
      iconName: 'school',
    },
  ]);

  readonly workingDays = signal<WorkingDay[]>([
    { date: addDays(todayStr(), -1), note: 'Turno normal' },
    { date: todayStr(), note: 'Turno normal' },
    { date: addDays(todayStr(), 1), note: 'Turno normal' },
    { date: addDays(todayStr(), 2), note: 'Turno normal' },
    { date: addDays(todayStr(), 3), note: 'Turno normal' },
    { date: addDays(todayStr(), 5), note: 'Turno normal' },
    { date: addDays(todayStr(), 6), note: 'Turno normal' },
    { date: addDays(todayStr(), 7), note: 'Turno normal' },
    { date: addDays(todayStr(), 8), note: 'Turno normal' },
    { date: addDays(todayStr(), 9), note: 'Turno normal' },
  ]);

  readonly enabledDates = computed(() => new Set(this.workingDays().map(w => w.date)));

  readonly selectedDate = signal<string>(todayStr());
  readonly calendarMonth = signal<Date>(new Date());

  readonly selectedDateAppointments = computed(() => {
    const doctorId = this.selectedDoctorId();
    return this.appointments().filter(a =>
      a.date === this.selectedDate() && (doctorId === null || a.doctorId === doctorId)
    );
  });

  readonly calendarDays = computed(() => {
    const month = this.calendarMonth();
    const year = month.getFullYear();
    const m = month.getMonth();
    const firstDay = new Date(year, m, 1).getDay();
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const startOffset = (firstDay + 6) % 7;
    return { year, month: m, daysInMonth, startOffset };
  });

  readonly appointmentCountByDate = computed(() => {
    const doctorId = this.selectedDoctorId();
    const counts = new Map<string, number>();
    this.appointments().forEach(a => {
      if (doctorId !== null && a.doctorId !== doctorId) return;
      counts.set(a.date, (counts.get(a.date) || 0) + 1);
    });
    return counts;
  });

  isBusinessDay(dateStr: string): boolean {
    return this.enabledDates().has(dateStr);
  }

  toggleWorkingDay(dateStr: string): void {
    this.workingDays.update(days => {
      const exists = days.some(d => d.date === dateStr);
      if (exists) return days.filter(d => d.date !== dateStr);
      return [...days, { date: dateStr }];
    });
  }

  setWorkingDays(dates: WorkingDay[]): void {
    this.workingDays.set(dates);
  }

  getBusinessDays(fromDate: string, count: number): string[] {
    const result: string[] = [];
    let current = fromDate;
    while (result.length < count) {
      if (this.isBusinessDay(current)) {
        result.push(current);
      }
      current = addDays(current, 1);
    }
    return result;
  }

  rescheduleAppointment(aptId: string, newDate: string, newTime: string): void {
    this.appointments.update(apts =>
      apts.map(apt => apt.id === aptId ? { ...apt, date: newDate, time: newTime } : apt)
    );
  }

  readonly currentTriageAppointmentId = signal<string | null>(null);

  readonly currentTriageAppointment = computed(() =>
    this.appointments().find(a => a.id === this.currentTriageAppointmentId()) ?? null
  );

  readonly waitingAppointments = computed(() =>
    this.selectedDateAppointments().filter(a =>
      ['pending', 'confirmed', 'checked-in', 'in-triage', 'triaged'].includes(a.status)
    )
  );

  readonly waitingCount = computed(() =>
    this.selectedDateAppointments().filter(a =>
      ['pending', 'confirmed', 'checked-in', 'in-triage'].includes(a.status)
    ).length
  );

  readonly triageCount = computed(() =>
    this.selectedDateAppointments().filter(a => a.status === 'in-triage').length
  );

  readonly receptionCount = computed(() =>
    this.selectedDateAppointments().filter(a => a.status === 'checked-in').length
  );

  checkInPatient(aptId: string): void {
    this.appointments.update(apts =>
      apts.map(apt => apt.id === aptId ? { ...apt, status: 'checked-in' as const } : apt)
    );
  }

  confirmAppointment(aptId: string): void {
    this.appointments.update(apts =>
      apts.map(apt => apt.id === aptId ? { ...apt, status: 'confirmed' as const } : apt)
    );
  }

  startTriage(aptId: string): void {
    this.appointments.update(apts =>
      apts.map(apt => apt.id === aptId ? { ...apt, status: 'in-triage' as const } : apt)
    );
    this.currentTriageAppointmentId.set(aptId);
  }

  completeTriage(aptId: string, vitals: TriageVitals): void {
    this.appointments.update(apts =>
      apts.map(apt => {
        if (apt.id !== aptId) return apt;
        return {
          ...apt,
          status: 'triaged' as const,
          vitals: {
            bp: `${vitals.systolic}/${vitals.diastolic}`,
            pulse: vitals.pulse || 0,
            temp: vitals.temp || 0,
            spo2: vitals.spo2 || 0,
          }
        };
      })
    );
    this.currentTriageAppointmentId.set(null);
  }

  cancelTriage(): void {
    const aptId = this.currentTriageAppointmentId();
    if (aptId) {
      this.appointments.update(apts =>
        apts.map(apt => apt.id === aptId ? { ...apt, status: 'checked-in' as const } : apt)
      );
    }
    this.currentTriageAppointmentId.set(null);
  }

  startConsultation(patientId: string): void {
    this.appointments.update(apts =>
      apts.map(apt =>
        apt.patientId === patientId && apt.date === this.selectedDate()
          ? { ...apt, status: 'in-progress' as const }
          : apt
      )
    );
  }

  completeConsultation(patientId: string): void {
    this.appointments.update(apts =>
      apts.map(apt =>
        apt.patientId === patientId && apt.date === this.selectedDate()
          ? { ...apt, status: 'completed' as const, vitals: undefined }
          : apt
      )
    );
  }

  readonly activePatientId = signal<string>('MED-0001');

  readonly activePatient = computed<Patient>(
    () => this.patients().find((p) => p.id === this.activePatientId()) ?? this.patients()[0]
  );

  selectPatient(id: string): void {
    this.activePatientId.set(id);
  }

  addPatient(patient: Patient): void {
    this.patients.update((list) => [...list, patient]);
    this.activePatientId.set(patient.id);
  }

  nextFileNumber(): string {
    const max = this.patients().reduce(
      (acc, p) => Math.max(acc, Number(p.id.replace('MED-', '')) || 0),
      0
    );
    return (max + 1).toString();
  }

  readonly consultations = signal<Consultation[]>([
    {
      id: 'CONS-2024-1014',
      patientId: 'MED-0001',
      patientName: 'María García López',
      doctorName: 'Dra. Noemí Aguirre',
      date: '14/10/2024',
      time: '10:15 AM',
      type: 'Control Cardiológico',
      chiefComplaint: 'Control rutinario de hipertensión arterial y revisión de exámenes de laboratorio.',
      historyOfPresentIllness: 'Paciente de 58 años con antecedente de HTA y dislipidemia en tratamiento continuo. Refiere sentirse estable sin dolor torácico, palpitaciones ni disnea de esfuerzo. Buena adherencia al tratamiento.',
      physicalExam: 'Paciente consciente, orientada, normoperfundida. Ruidos cardíacos rítmicos, bien auditados, sin soplos. Campos pulmonares bien ventilados sin ruidos agregados. Abdomen blando, no doloroso, sin visceromegalias. Extremidades sin edema.',
      vitals: {
        systolic: 135,
        diastolic: 85,
        pulse: 72,
        temperature: 36.6,
        spo2: 98,
        weight: 68.5,
        height: 162,
      },
      diagnosisCode: 'I10',
      diagnosisDescription: 'Hipertensión esencial (primaria)',
      treatmentPlan: '1. Continuar Losartán Potásico 50 mg v.o. cada 12 horas.\n2. Continuar Atorvastatina 20 mg v.o. en la noche.\n3. Mantener dieta hiposódica y caminata diaria 30 min.\n4. Control en 3 meses con perfil lipídico y función renal.',
      notes: 'Se adjuntan resultados de laboratorio. Parámetros metabólicos estables. Paciente firma consentimiento de telemonitoreo.',
      status: 'completed',
    },
    {
      id: 'CONS-2024-0618',
      patientId: 'MED-0001',
      patientName: 'María García López',
      doctorName: 'Dra. Noemí Aguirre',
      date: '18/06/2024',
      time: '09:30 AM',
      type: 'Primera Consulta',
      chiefComplaint: 'Cefalea holocraneana leve y registro de presión elevada en domicilio.',
      historyOfPresentIllness: 'Paciente acude por presentar dolor de cabeza pulsátil ocasional en región occipital. Refiere tomas de PA en farmacia con valores de 145/90 mmHg.',
      physicalExam: 'Buen estado general. PA 142/90 mmHg. Sin signos de focalidad neurológica. Auscultación cardiopulmonar dentro de límites normales.',
      vitals: {
        systolic: 142,
        diastolic: 90,
        pulse: 78,
        temperature: 36.8,
        spo2: 97,
        weight: 70.0,
        height: 162,
      },
      diagnosisCode: 'I10',
      diagnosisDescription: 'Hipertensión esencial (primaria)',
      treatmentPlan: '1. Iniciar Losartán 50 mg v.o. cada 12 horas.\n2. Bitácora de presión arterial 2 veces al día.\n3. Evaluación por nutricionista.',
      notes: 'Se solicita ecocardiograma transtorácico de control.',
      status: 'completed',
    },
    {
      id: 'CONS-2024-0115',
      patientId: 'MED-0001',
      patientName: 'María García López',
      doctorName: 'Dr. Jorge Mawad',
      date: '15/01/2024',
      time: '11:30 AM',
      type: 'Ingreso Preventivo',
      chiefComplaint: 'Evaluación inicial por antecedentes familiares de hipertensión y dislipidemia.',
      historyOfPresentIllness: 'Paciente acude a control de salud preventivo. Refiere madre hipertensa. Asintomática en el momento del examen.',
      physicalExam: 'Consciente, sin edemas. PA 148/92 mmHg en primera toma, 144/88 en segunda toma. Ruidos cardíacos rítmicos.',
      vitals: {
        systolic: 148,
        diastolic: 92,
        pulse: 82,
        temperature: 36.5,
        spo2: 97,
        weight: 71.5,
        height: 162,
      },
      diagnosisCode: 'I10',
      diagnosisDescription: 'Hipertensión esencial (primaria) - Sospecha inicial',
      treatmentPlan: '1. Solicitud de perfil lipídico, hemograma y ECG de 12 derivaciones.\n2. Iniciar bitácora de presión arterial.\n3. Indicación de dieta baja en sodio.',
      notes: 'Primera consulta en la clínica. Se abre expediente HCE-MED-0001.',
      status: 'completed',
    },
    {
      id: 'CONS-2024-0920',
      patientId: 'MED-0002',
      patientName: 'Carlos Rodríguez Pérez',
      doctorName: 'Dr. Jorge Mawad',
      date: '20/09/2024',
      time: '11:00 AM',
      type: 'Chequeo General',
      chiefComplaint: 'Chequeo preventivo anual por antecedentes familiares de diabetes.',
      historyOfPresentIllness: 'Paciente masculino de 42 años asintomático. Solicita evaluación médica general y exámenes de rutina.',
      physicalExam: 'Sin hallazgos patológicos significativos. Auscultación cardíaca y pulmonar normal.',
      vitals: {
        systolic: 120,
        diastolic: 78,
        pulse: 68,
        temperature: 36.5,
        spo2: 99,
        weight: 78.0,
        height: 175,
      },
      diagnosisCode: 'Z00.0',
      diagnosisDescription: 'Examen médico general',
      treatmentPlan: '1. Mantener estilo de vida saludable y ejercicio aeróbico.\n2. Exámenes de laboratorio de control preventivo.',
      notes: 'Paciente sin factores de riesgo agudos.',
      status: 'completed',
    },
    {
      id: 'CONS-2024-0915',
      patientId: 'MED-0005',
      patientName: 'Sofía Ramírez Torres',
      doctorName: 'Dra. Sandra Muñoz',
      date: '15/09/2024',
      time: '08:45 AM',
      type: 'Control de Arritmia',
      chiefComplaint: 'Evaluación de palpitaciones esporádicas y cansancio.',
      historyOfPresentIllness: 'Paciente de 42 años refiere episodios breves de palpitaciones en reposo, asociados a estrés laboral.',
      physicalExam: 'Ruidos cardíacos rítmicos con extrasístoles ocasionales. Sin soplos. Murmullo vesicular normal.',
      vitals: {
        systolic: 128,
        diastolic: 82,
        pulse: 84,
        temperature: 36.7,
        spo2: 98,
        weight: 62.0,
        height: 165,
      },
      diagnosisCode: 'I49.9',
      diagnosisDescription: 'Arritmia cardíaca no especificada',
      treatmentPlan: '1. Solicitud de Holter de ritmo de 24 horas.\n2. Ecocardiograma Doppler a color.\n3. Evitar estimulantes (café, bebidas energizantes).',
      notes: 'Se programa cita de seguimiento tras resultados de Holter.',
      status: 'completed',
    },
  ]);

  addConsultation(consultation: Consultation): void {
    this.consultations.update((list) => [consultation, ...list]);
  }

  getConsultationsByPatient(patientId: string): Consultation[] {
    return this.consultations().filter((c) => c.patientId === patientId);
  }

  readonly examCatalog = this.storage<ExamTemplate[]>('medcontrol.exams', [
    { id: 'EX-LAB-01', name: 'Hemograma completo', category: 'laboratorio', fasting: false, preparation: 'Sin ayunas requerido' },
    { id: 'EX-LAB-02', name: 'Perfil lipídico (Colesterol Total, HDL, LDL, Triglicéridos)', category: 'laboratorio', fasting: true, preparation: 'Ayuno de 12 horas' },
    { id: 'EX-LAB-03', name: 'Glicemia en ayunas', category: 'laboratorio', fasting: true, preparation: 'Ayuno de 8 horas' },
    { id: 'EX-LAB-04', name: 'Hemoglobina Glicosilada (HbA1c)', category: 'laboratorio', fasting: false, preparation: 'Sin ayunas requerido' },
    { id: 'EX-LAB-05', name: 'Creatinina y BUN (Función renal)', category: 'laboratorio', fasting: false, preparation: 'Sin ayunas requerido' },
    { id: 'EX-LAB-06', name: 'Perfil hepático (TGO, TGP, Bilirrubinas, FA)', category: 'laboratorio', fasting: true, preparation: 'Ayuno de 8 horas' },
    { id: 'EX-LAB-07', name: 'TSH y T4 libre', category: 'laboratorio', fasting: false, preparation: 'Sin ayunas requerido' },
    { id: 'EX-LAB-08', name: 'Urocultivo con antibiograma', category: 'laboratorio', fasting: false, preparation: 'Recoger primera orina de la mañana' },
    { id: 'EX-LAB-09', name: 'Electrolitos (Na, K, Cl, Ca)', category: 'laboratorio', fasting: false, preparation: 'Sin ayunas requerido' },
    { id: 'EX-LAB-10', name: 'PCR y VSG', category: 'laboratorio', fasting: false, preparation: 'Sin ayunas requerido' },
    { id: 'EX-IMG-01', name: 'Radiografía de tórax (AP y Lateral)', category: 'imagen', fasting: false, preparation: 'Retirar objetos metálicos de la zona' },
    { id: 'EX-IMG-02', name: 'Ecocardiograma transtorácico (TTE)', category: 'imagen', fasting: false, preparation: 'Sin ayunas requerido' },
    { id: 'EX-IMG-03', name: 'TAC cerebral simple', category: 'imagen', fasting: false, preparation: 'Retirar objetos metálicos' },
    { id: 'EX-IMG-04', name: 'TAC de tórax con contraste', category: 'imagen', fasting: true, preparation: 'Ayuno de 4 horas y función renal previa' },
    { id: 'EX-IMG-05', name: 'Ecografía abdominal total', category: 'imagen', fasting: true, preparation: 'Ayuno de 8 horas' },
    { id: 'EX-IMG-06', name: 'Ecografía renal y vías urinarias', category: 'imagen', fasting: false, preparation: 'Llenado vesical (tomar 1L de agua 1h antes)' },
    { id: 'EX-FUN-01', name: 'Electrocardiograma (ECG) de 12 derivaciones', category: 'funcional', fasting: false, preparation: 'Sin ayunas requerido' },
    { id: 'EX-FUN-02', name: 'Holter de ritmo de 24 horas', category: 'funcional', fasting: false, preparation: 'Ducha previa sin cremas ni talco' },
    { id: 'EX-FUN-03', name: 'Prueba de esfuerzo (Stress Test)', category: 'funcional', fasting: false, preparation: 'Ropa cómoda, evitar café 4h antes' },
    { id: 'EX-FUN-04', name: 'Espirometría', category: 'funcional', fasting: false, preparation: 'Evitar broncodilatadores 6h antes' },
    { id: 'EX-PROC-01', name: 'Endoscopía digestiva alta', category: 'procedimiento', fasting: true, preparation: 'Ayuno absoluto de 8 horas' },
    { id: 'EX-PROC-02', name: 'Colonoscopía', category: 'procedimiento', fasting: true, preparation: 'Dieta líquida y evacuantes el día previo' },
  ]);

  getExams(): ExamTemplate[] {
    return this.examCatalog();
  }

  addExam(exam: ExamTemplate): void {
    this.examCatalog.update((list) => [...list, exam]);
    this.persist('medcontrol.exams', this.examCatalog());
  }

  updateExam(exam: ExamTemplate): void {
    this.examCatalog.update((list) => list.map((e) => (e.id === exam.id ? {...exam} : e)));
    this.persist('medcontrol.exams', this.examCatalog());
  }

  deactivateExam(id: string): void {
    this.examCatalog.update((list) => list.filter((e) => e.id !== id));
    this.persist('medcontrol.exams', this.examCatalog());
  }

  readonly examOrders = signal<ExamOrder[]>([]);

  addExamOrder(order: ExamOrder): void {
    this.examOrders.update((list) => [order, ...list]);
  }

  getExamOrders(): ExamOrder[] {
    return this.examOrders();
  }

  getExamOrdersByPatient(patientId: string): ExamOrder[] {
    return this.examOrders().filter((order) => order.patientId === patientId);
  }

  getExamOrdersByConsultation(consultationId: string): ExamOrder[] {
    return this.examOrders().filter((order) => order.consultationId === consultationId);
  }

  readonly medications = this.storage<Medication[]>('medcontrol.medications', [
    { id: 'MED-001', name: 'Losartán Potásico', presentation: '50 mg', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: '1 tableta cada 24 h (en la mañana)', requiresPrescription: true, controlled: false, active: true },
    { id: 'MED-002', name: 'Atorvastatina', presentation: '20 mg', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: '1 tableta cada 24 h (en la noche)', requiresPrescription: true, controlled: false, active: true },
    { id: 'MED-003', name: 'Enalapril', presentation: '10 mg', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: '1 tableta cada 12 h', requiresPrescription: true, controlled: false, active: true },
    { id: 'MED-004', name: 'Ácido Acetilsalicílico', presentation: '100 mg', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: '1 tableta al día', requiresPrescription: false, controlled: false, active: true },
    { id: 'MED-005', name: 'Metformina', presentation: '850 mg', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: '1 tableta cada 12 h con alimentos', requiresPrescription: true, controlled: false, active: true },
    { id: 'MED-006', name: 'Amlodipino', presentation: '5 mg', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: '1 tableta cada 24 h', requiresPrescription: true, controlled: false, active: true },
    { id: 'MED-007', name: 'Bisoprolol', presentation: '2.5 mg', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: '1 tableta cada 24 h', requiresPrescription: true, controlled: false, active: true },
    { id: 'MED-008', name: 'Omeprazol', presentation: '20 mg', pharmaceuticalForm: 'cápsula', route: 'oral', defaultFrequency: '1 cápsula en ayunas cada 24 h', requiresPrescription: false, controlled: false, active: true },
    { id: 'MED-009', name: 'Ibuprofeno', presentation: '400 mg', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: '1 tableta cada 8 h con alimentos', requiresPrescription: false, controlled: false, active: true },
    { id: 'MED-010', name: 'Paracetamol', presentation: '500 mg', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: '1 tableta cada 6-8 h si dolor o fiebre', requiresPrescription: false, controlled: false, active: true },
    { id: 'MED-011', name: 'Levotiroxina', presentation: '100 mcg', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: '1 tableta en ayunas 30 min antes del desayuno', requiresPrescription: true, controlled: false, active: true },
    { id: 'MED-012', name: 'Sertralina', presentation: '50 mg', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: '1 tableta cada 24 h', requiresPrescription: true, controlled: false, active: true },
    { id: 'MED-013', name: 'Amoxicilina', presentation: '500 mg', pharmaceuticalForm: 'cápsula', route: 'oral', defaultFrequency: '1 cápsula cada 8 h por 7 días', requiresPrescription: true, controlled: false, active: true },
    { id: 'MED-014', name: 'Azitromicina', presentation: '500 mg', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: '1 tableta cada 24 h por 3-5 días', requiresPrescription: true, controlled: false, active: true },
    { id: 'MED-015', name: 'Clopidogrel', presentation: '75 mg', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: '1 tableta cada 24 h', requiresPrescription: true, controlled: false, active: true },
    { id: 'MED-016', name: 'Furosemida', presentation: '40 mg', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: '1 tableta por la mañana', requiresPrescription: true, controlled: false, active: true },
    { id: 'MED-017', name: 'Prednisona', presentation: '5 mg', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: 'Según esquema médico indicado', requiresPrescription: true, controlled: false, active: true },
    { id: 'MED-018', name: 'Salbutamol', presentation: '100 mcg', pharmaceuticalForm: 'inhalador', route: 'inhalatoria', defaultFrequency: '2 inhalaciones cada 4-6 h según síntomas', requiresPrescription: true, controlled: false, active: true },
  ]);

  getMedications(): Medication[] {
    return this.medications().filter((m) => m.active);
  }

  medicationLabel(m: Medication): string {
    return [m.name, m.presentation].filter(Boolean).join(' ');
  }

  addMedication(med: Medication): void {
    this.medications.update((list) => [...list, med]);
    this.persist('medcontrol.medications', this.medications());
  }

  updateMedication(med: Medication): void {
    this.medications.update((list) => list.map((m) => (m.id === med.id ? {...med} : m)));
    this.persist('medcontrol.medications', this.medications());
  }

  deactivateMedication(id: string): void {
    this.medications.update((list) => list.filter((m) => m.id !== id));
    this.persist('medcontrol.medications', this.medications());
  }

  getNextMedicationId(): string {
    return 'MED-' + Date.now().toString().slice(-6);
  }

  readonly medicationCatalog = computed(() => this.getMedications().map((m) => this.medicationLabel(m)));

  readonly prescriptions = signal<Prescription[]>([]);

  addPrescription(prescription: Prescription): void {
    this.prescriptions.update((list) => [prescription, ...list]);
  }

  getPrescriptions(): Prescription[] {
    return this.prescriptions();
  }

  getPrescriptionsByPatient(patientId: string): Prescription[] {
    return this.prescriptions().filter((rx) => rx.patientId === patientId);
  }

  getPrescriptionsByConsultation(consultationId: string): Prescription[] {
    return this.prescriptions().filter((rx) => rx.consultationId === consultationId);
  }

  readonly diagnoses = this.storage<Diagnosis[]>('medcontrol.diagnoses', [
    { id: 'DG-001', code: 'I10', description: 'Hipertensión esencial (primaria)', active: true },
    { id: 'DG-002', code: 'E11', description: 'Diabetes mellitus tipo 2', active: true },
    { id: 'DG-003', code: 'E78', description: 'Dislipidemia', active: true },
    { id: 'DG-004', code: 'J06', description: 'Infección aguda de vías respiratorias superiores', active: true },
    { id: 'DG-005', code: 'M54', description: 'Dorsalgia (dolor de espalda)', active: true },
    { id: 'DG-006', code: 'K21', description: 'Enfermedad por reflujo gastroesofágico', active: true },
    { id: 'DG-007', code: 'F41', description: 'Trastorno de ansiedad', active: true },
    { id: 'DG-008', code: 'N39', description: 'Infección de vías urinarias', active: true },
    { id: 'DG-009', code: 'J45', description: 'Asma', active: true },
    { id: 'DG-010', code: 'E66', description: 'Obesidad', active: true },
    { id: 'DG-011', code: 'I48', description: 'Fibrilación y aleteo auricular', active: true },
    { id: 'DG-012', code: 'D64', description: 'Anemia no especificada', active: true },
    { id: 'DG-013', code: 'E03', description: 'Hipotrioidismo', active: true },
    { id: 'DG-014', code: 'N18', description: 'Enfermedad renal crónica', active: true },
    { id: 'DG-015', code: 'Z00.0', description: 'Examen médico general', active: true },
  ]);

  getDiagnoses(): Diagnosis[] {
    return this.diagnoses().filter((d) => d.active);
  }

  addDiagnosis(dg: Diagnosis): void {
    this.diagnoses.update((list) => [...list, dg]);
    this.persist('medcontrol.diagnoses', this.diagnoses());
  }

  updateDiagnosis(dg: Diagnosis): void {
    this.diagnoses.update((list) => list.map((d) => (d.id === dg.id ? {...dg} : d)));
    this.persist('medcontrol.diagnoses', this.diagnoses());
  }

  deactivateDiagnosis(id: string): void {
    this.diagnoses.update((list) => list.filter((d) => d.id !== id));
    this.persist('medcontrol.diagnoses', this.diagnoses());
  }

  getNextDiagnosisId(): string {
    return 'DG-' + Date.now().toString().slice(-6);
  }

  readonly triageLevels = this.storage<TriageLevel[]>('medcontrol.triageLevels', [
    { id: 'TL-001', code: 'rojo', name: 'Reanimación / Emergencia Vital', maxWaitMinutes: 0, description: 'Requiere atención inmediata, riesgo vital presente.', color: '#d32f2f', active: true, order: 5 },
    { id: 'TL-002', code: 'naranja', name: 'Urgencia / Emergencia', maxWaitMinutes: 10, description: 'Situación potencialmente grave, riesgo probable.', color: '#ed6c02', active: true, order: 4 },
    { id: 'TL-003', code: 'amarillo', name: 'Urgencia menor / Observación', maxWaitMinutes: 60, description: 'Sin riesgo vital, requiere evaluación en corto plazo.', color: '#f9a825', active: true, order: 3 },
    { id: 'TL-004', code: 'verde', name: 'Atención rutinaria', maxWaitMinutes: 120, description: 'Problema agudo no urgente o control programado.', color: '#2e7d32', active: true, order: 2 },
    { id: 'TL-005', code: 'azul', name: 'Consulta sin urgencia', maxWaitMinutes: 240, description: 'Trámite o consulta no urgente.', color: '#1976d2', active: true, order: 1 },
  ]);

  readonly triageAutoRules = this.storage<TriageAutoRule[]>('medcontrol.triageRules', [
    { id: 'TR-001', levelCode: 'rojo', field: 'spo2', min: null, max: 86 },
    { id: 'TR-002', levelCode: 'rojo', field: 'systolic', min: null, max: 79 },
    { id: 'TR-003', levelCode: 'naranja', field: 'spo2', min: 86, max: 92 },
    { id: 'TR-004', levelCode: 'naranja', field: 'pulse', min: 130, max: null },
    { id: 'TR-005', levelCode: 'naranja', field: 'temp', min: 39.5, max: null },
    { id: 'TR-006', levelCode: 'amarillo', field: 'spo2', min: 92, max: 95 },
    { id: 'TR-007', levelCode: 'amarillo', field: 'systolic', min: 140, max: null },
    { id: 'TR-008', levelCode: 'amarillo', field: 'diastolic', min: 110, max: null },
    { id: 'TR-009', levelCode: 'amarillo', field: 'pulse', min: 100, max: 130 },
    { id: 'TR-010', levelCode: 'verde', field: 'pulse', min: 60, max: 100 },
    { id: 'TR-011', levelCode: 'verde', field: 'spo2', min: 95, max: null },
  ]);

  getTriageLevels(): TriageLevel[] {
    return this.triageLevels();
  }

  getTriageLevelByCode(code: string): TriageLevel | undefined {
    return this.triageLevels().find((l) => l.code === code);
  }

  updateTriageLevel(level: TriageLevel): void {
    this.triageLevels.update((list) => list.map((l) => (l.id === level.id ? {...level} : l)));
    this.persist('medcontrol.triageLevels', this.triageLevels());
  }

  addTriageLevel(level: TriageLevel): void {
    this.triageLevels.update((list) => [...list, level]);
    this.persist('medcontrol.triageLevels', this.triageLevels());
  }

  getTriageRules(): TriageAutoRule[] {
    return this.triageAutoRules();
  }

  addTriageRule(rule: TriageAutoRule): void {
    this.triageAutoRules.update((list) => [...list, rule]);
    this.persist('medcontrol.triageRules', this.triageAutoRules());
  }

  updateTriageRule(rule: TriageAutoRule): void {
    this.triageAutoRules.update((list) => list.map((r) => (r.id === rule.id ? {...rule} : r)));
    this.persist('medcontrol.triageRules', this.triageAutoRules());
  }

  removeTriageRule(id: string): void {
    this.triageAutoRules.update((list) => list.filter((r) => r.id !== id));
    this.persist('medcontrol.triageRules', this.triageAutoRules());
  }

  classifyTriage(vitals: TriageVitals): { level: TriageLevel; matched: TriageAutoRule[] } | null {
    const active = new Set(this.triageLevels().filter((l) => l.active).map((l) => l.code));
    const matches: { level: TriageLevel; rule: TriageAutoRule }[] = [];
    for (const rule of this.triageAutoRules()) {
      const level = this.getTriageLevelByCode(rule.levelCode);
      if (!level || !active.has(rule.levelCode)) continue;
      const value = vitals[rule.field];
      if (value === null || value === undefined) continue;
      const aboveMin = rule.min === null || value >= rule.min;
      const belowMax = rule.max === null || value <= rule.max;
      if (aboveMin && belowMax) matches.push({ level, rule });
    }
    if (matches.length === 0) return null;
    const best = matches.sort((a, b) => b.level.order - a.level.order)[0];
    return { level: best.level, matched: matches.map((m) => m.rule) };
  }

  readonly organization = this.storage<OrganizationSettings>('medcontrol.organization', {
    id: 'ORG-001',
    name: 'MedControl Sede Central',
    rut: 'J-12345678-9',
    address: 'Av. Libertador 1240, Caracas',
    phone: '+58 212-5550000',
    email: 'contacto@medcontrol.com',
    footerText: 'Documento electrónico generado por MedControl Clinical Suite. La firma del prescriptor valida este documento conforme a la normativa MINSAL de firma avanzada.',
    signatureName: 'Dra. Noemí Aguirre',
  });

  updateOrganization(org: OrganizationSettings): void {
    this.organization.set({ ...org });
    this.persist('medcontrol.organization', this.organization());
  }

  readonly alertRules = this.storage<AlertRule[]>('medcontrol.alertRules', [
    { id: 'AR-001', name: 'Alergia Crítica en prescripción', description: 'Se detecta antecedente de alergia severa al intentar prescribir un medicamento contraindicado.', category: 'receta', severity: 'critical', icon: 'warning', actionLabel: 'Ver Ficha', route: 'pacientes-y-historial-clinico', active: true },
    { id: 'AR-002', name: 'Triaje Naranja sin clasificar en 10 min', description: 'Paciente con nivel de triaje naranja que supera el tiempo máximo de espera sin atención médica.', category: 'triage', severity: 'warning', icon: 'monitor_heart', actionLabel: 'Ver Dashboard', route: 'dashboard-de-citas', active: true },
    { id: 'AR-003', name: 'Recordatorios de turno enviados', description: 'Twilio SMS Gateway despachó recordatorios del bloque; se informa el porcentaje de confirmación.', category: 'cita', severity: 'success', icon: 'sms', actionLabel: 'Ver Detalle', route: 'dashboard-de-citas', active: true },
    { id: 'AR-004', name: 'Resultado de laboratorio anormal', description: 'Un examen de laboratorio retorna un resultado fuera del rango de referencia configurado.', category: 'examen', severity: 'critical', icon: 'science', actionLabel: 'Ver Recetas & Exámenes', route: 'recetas-y-examenes', active: false },
    { id: 'AR-005', name: 'Vencimiento próximo de receta', description: 'Una receta médica está próxima a vencer y el tratamiento no fue renovado.', category: 'receta', severity: 'info', icon: 'event_busy', actionLabel: 'Ver Recetas & Exámenes', route: 'recetas-y-examenes', active: false },
  ]);

  getAlertRules(): AlertRule[] {
    return this.alertRules();
  }

  getActiveAlertRules(): AlertRule[] {
    return this.alertRules().filter((r) => r.active);
  }

  addAlertRule(rule: AlertRule): void {
    this.alertRules.update((list) => [...list, rule]);
    this.persist('medcontrol.alertRules', this.alertRules());
  }

  updateAlertRule(rule: AlertRule): void {
    this.alertRules.update((list) => list.map((r) => (r.id === rule.id ? {...rule} : r)));
    this.persist('medcontrol.alertRules', this.alertRules());
  }

  deactivateAlertRule(id: string): void {
    this.alertRules.update((list) => list.filter((r) => r.id !== id));
    this.persist('medcontrol.alertRules', this.alertRules());
  }

  readonly catalogUsers = this.storage<AppUser[]>('medcontrol.users', [
    { id: 'usr-001', name: 'Administradora Central', email: 'admin@medcontrol.com', role: 'admin', active: true },
    { id: 'usr-002', name: 'Dra. Noemí Aguirre', email: 'aguirre@medcontrol.com', role: 'doctor', doctorId: 'doc-aguirre', active: true },
    { id: 'usr-003', name: 'Dr. Jorge Mawad', email: 'mawad@medcontrol.com', role: 'doctor', doctorId: 'doc-mawad', active: true },
    { id: 'usr-004', name: 'Dra. Sandra Muñoz', email: 'munoz@medcontrol.com', role: 'doctor', doctorId: 'doc-munoz', active: true },
  ]);

  getCatalogUsers(): AppUser[] {
    return this.catalogUsers();
  }

  emailTaken(email: string, ignoreId?: string): boolean {
    return this.catalogUsers().some((u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== ignoreId);
  }

  addCatalogUser(user: AppUser): void {
    this.catalogUsers.update((list) => [...list, user]);
    this.persist('medcontrol.users', this.catalogUsers());
  }

  toggleCatalogUserActive(id: string): void {
    this.catalogUsers.update((list) => list.map((u) => (u.id === id ? {...u, active: !u.active} : u)));
    this.persist('medcontrol.users', this.catalogUsers());
  }
}
