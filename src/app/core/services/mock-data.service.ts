import { Injectable, signal, computed } from '@angular/core';
import {
  Patient,
  Doctor,
  AppointmentItem,
  DaySchedule,
  AbsenceBlock,
  Consultation,
  TriageVitals,
  WorkingDay,
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

  readonly consultations = signal<Consultation[]>([]);

  addConsultation(consultation: Consultation): void {
    this.consultations.update((list) => [consultation, ...list]);
  }

  getConsultationsByPatient(patientId: string): Consultation[] {
    return this.consultations().filter((c) => c.patientId === patientId);
  }
}
