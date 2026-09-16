import { Injectable, computed, signal } from '@angular/core';
import {
  Patient,
  Doctor,
  AppointmentItem,
  DaySchedule,
  AbsenceBlock,
} from '../models/types';

@Injectable({ providedIn: 'root' })
export class MockDataService {
  readonly doctor: Doctor = {
    id: 'doc-mendoza',
    name: 'Dr. Carlos Mendoza Soto',
    regNumber: '#94821-CLM',
    sisNumber: '439201-8',
    specialty: 'Cardiología Clínica',
    subspecialty: 'Arritmias y Electrofisiología',
    level: 'Nivel Senior Staff',
    box: 'Box 402',
    floor: 'Piso 4',
    wing: 'Ala Norte',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANiobtpf70hsill-tUbNik5LgpUdzgctDCSeKpega1xFe5K7LWB0BpZlU1MCD8YXVmPZkpOukVHbrtHiXtbKn3_EnGR7lDKH83WQDh0Kg0E6evtSQHSD1JabJP7vL06v38TvEBelMr4lki5NDINO7Foq02_ONUFcQeEJ4H3WXXE63iR--gsnKMYtMykeat-eUIoMV5jnPl-Mt11IHNAhD5kjBdnTUyfVRoDXypsEFKaqtz1Xwetss-',
    email: 'c.mendoza@medcontrol.cl',
    phone: '+56 9 8412 0924',
    annex: '4402',
    statusText: 'Turno Activo Hoy: 08:00 - 15:30',
    activeToday: true,
  };

  readonly patientJuanPerez: Patient = {
    id: 'MED-9482',
    name: 'Juan Pérez Morales',
    rut: '14.892.401-2',
    age: 58,
    birthDate: '12 Mayo 1966',
    phone: '+56 9 8412 8930',
    email: 'juan.perez@email.com',
    address: 'Av. Providencia 1240, Providencia',
    insurance: 'Isapre Colmena Golden',
    insuranceDetail: 'Golden Health 15%',
    bloodType: 'O Rh(+)',
    tutor: 'María Morales (Cónyuge)',
    allergies: ['Penicilina', 'AINEs (Ibuprofeno/Ketoprofeno)'],
    severeAllergies: ['Penicilina (Anafilaxia)'],
    chronicConditions: ['HTA Grado 2', 'Dislipidemia Mixta'],
    consentSigned: true,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApQHezU_ShVd1bzEtORQgLuINH1703taJzBk77NBQfg21rcI01mxsPR9W2Tu-BKApS4FV56gisR2c54Cteof-GKPqOE21J3PvX2vIwBVbJialByIpIgejejecD1EQqfpXwNTovSOSC1sQx3L0SlZjAr5IAnSqR_Al6wK3CjiLtG8ZZvbESHoUqr4kmhnp7XSLTl_vcIAPxmFu7gppT3QIi3ve4_7gjiP86pO4W87UICYnT_LRqmz6r',
    fileNumber: '49120',
  };

  readonly patientMariaMorales: Patient = {
    id: 'MED-9482-B',
    name: 'María Elena Morales',
    rut: '15.204.912-3',
    age: 52,
    birthDate: '18 Agosto 1972',
    phone: '+56 9 7711 4455',
    email: 'm.morales@gmail.com',
    address: 'Las Condes 890, Santiago',
    insurance: 'Isapre Colmena',
    bloodType: 'A Rh(+)',
    tutor: 'Juan Morales (Hijo)',
    allergies: ['Sulfamidas'],
    severeAllergies: [],
    chronicConditions: ['Arritmia Paroxística'],
    consentSigned: true,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDd3-9927I6KgEgA5wfFRFEznf2_MhamORn1gU2xmTel_6I_80phFDb4okDQeJzrHk5GZthOxXOf5VF85HCfpz9YnxNE8vmTDVJGDE9KViPCedjBYYDKpzYchxQ8HRjYzSvtY310sriXtC3GeqBYzkng6Oyn1FEBscrqzgXfNlSIi2ddAEilV-MQAOhG1m3Oaa6WTN8j8rSsluJh1eK1n4Vdo-VITM-FhLtkb9DK3fmaZ1-Nn3OKnJu',
    fileNumber: '51204',
  };

  readonly appointments = signal<AppointmentItem[]>([
    {
      id: 'apt-1',
      time: '08:30 AM',
      durationMinutes: 40,
      patientName: 'Juan Pérez',
      patientAge: 58,
      patientInitials: 'JP',
      patientRut: '14.892.401-2',
      insurance: 'Fonasa B',
      reason: 'Control Hipertensión Esencial · Fonasa B',
      status: 'completed',
    },
    {
      id: 'apt-2',
      time: '09:15 AM',
      durationMinutes: 45,
      patientName: 'María Elena Morales',
      patientAge: 52,
      patientInitials: 'MM',
      patientRut: '15.204.912-3',
      insurance: 'Isapre Colmena',
      reason: 'Evaluación de Arritmia & Disnea al esfuerzo · Isapre Colmena',
      status: 'in-progress',
      vitals: {
        bp: '120/80',
        pulse: 72,
        temp: 36.5,
        spo2: 99,
      },
    },
    {
      id: 'apt-3',
      time: '10:00 AM',
      durationMinutes: 30,
      patientName: 'Roberto Gómez',
      patientAge: 64,
      patientInitials: 'RG',
      patientRut: '11.450.812-9',
      insurance: 'Banmédica',
      reason: 'Primera Consulta Cardiaca · Derivación Hospitalaria',
      status: 'confirmed',
      relativeTime: 'En 15 min',
    },
    {
      id: 'apt-4',
      time: '10:45 AM',
      durationMinutes: 45,
      patientName: 'Pausa Clínica / Descanso',
      patientAge: 0,
      patientInitials: 'PC',
      patientRut: '',
      insurance: 'Bloqueo Médico',
      reason: 'Espacio reservado para informe médico y actualización de fichas',
      status: 'break',
    },
    {
      id: 'apt-5',
      time: '11:30 AM',
      durationMinutes: 30,
      patientName: 'Sofía Ramírez',
      patientAge: 42,
      patientInitials: 'SR',
      patientRut: '16.782.339-4',
      insurance: 'Cruz Blanca',
      reason: 'Revisión de Holter de 24 hrs · Telemedicina / Presencial',
      status: 'confirmed',
      relativeTime: 'En 1h 45m',
    },
  ]);

  readonly schedule = signal<DaySchedule[]>([
    {
      day: 'Lunes',
      enabled: true,
      morningStart: '08:30',
      morningEnd: '13:00',
      morningPatients: 8,
      breakStart: '13:00',
      breakEnd: '15:00',
      breakNote: '(120m)',
      afternoonStart: '15:00',
      afternoonEnd: '18:30',
      afternoonPatients: 7,
      totalCapacity: 15,
    },
    {
      day: 'Martes',
      enabled: true,
      morningStart: '08:30',
      morningEnd: '13:00',
      morningPatients: 8,
      breakStart: '13:00',
      breakEnd: '15:00',
      breakNote: '(120m)',
      afternoonStart: '15:00',
      afternoonEnd: '18:30',
      afternoonPatients: 7,
      totalCapacity: 15,
    },
    {
      day: 'Miércoles',
      enabled: true,
      morningStart: '08:30',
      morningEnd: '11:30',
      morningPatients: 6,
      breakStart: '11:30',
      breakEnd: '15:00',
      breakNote: '(Qx + Almuerzo)',
      afternoonStart: '15:00',
      afternoonEnd: '18:30',
      afternoonPatients: 7,
      totalCapacity: 13,
      specialBadge: 'Pausa Procedimiento Qx',
    },
    {
      day: 'Jueves',
      enabled: true,
      morningStart: '08:30',
      morningEnd: '13:00',
      morningPatients: 8,
      breakStart: '13:00',
      breakEnd: '15:00',
      breakNote: '(120m)',
      afternoonStart: '15:00',
      afternoonEnd: '18:30',
      afternoonPatients: 7,
      totalCapacity: 15,
    },
    {
      day: 'Viernes',
      enabled: true,
      morningStart: '08:30',
      morningEnd: '14:00',
      morningPatients: 10,
      breakStart: '',
      breakEnd: '',
      breakNote: 'Sin pausa (Jornada Continua)',
      afternoonStart: '',
      afternoonEnd: '',
      afternoonPatients: 0,
      totalCapacity: 10,
      specialBadge: 'Tarde Libre / Investigación',
    },
    {
      day: 'Sábado',
      enabled: false,
      morningStart: '',
      morningEnd: '',
      morningPatients: 0,
      breakStart: '',
      breakEnd: '',
      breakNote: '',
      afternoonStart: '',
      afternoonEnd: '',
      afternoonPatients: 0,
      totalCapacity: 0,
    },
  ]);

  readonly absences = signal<AbsenceBlock[]>([
    {
      id: 'abs-1',
      reason: 'Congreso Chileno de Cardiología 2024',
      location: 'Hotel Sheraton Miramar, Viña del Mar',
      type: 'Actividad Académica',
      period: '15 Nov 2024 - 18 Nov 2024 (Bloqueo de Jornada Completa - 4 días)',
      affectedNote: '0 citas colisionadas (Bloqueado anticipadamente)',
      collisionStatus: 'ok',
      validationStatus: 'Aprobado por Dirección Médica',
      iconName: 'school',
    },
    {
      id: 'abs-2',
      reason: 'Pausa Clínica / Procedimiento Quirúrgico',
      location: 'Pabellón Hemodinamia Piso 2',
      type: 'Pabellón / Quirófano',
      period: 'Todos los miércoles 11:30 - 12:30 (Bloqueo Periódico Activo)',
      affectedNote: 'Reserva reservada para Staff Quirúrgico',
      collisionStatus: 'warning',
      validationStatus: 'Validado Sistemático',
      iconName: 'medical_services',
    },
  ]);

  readonly patients = signal<Patient[]>([
    this.patientJuanPerez,
    this.patientMariaMorales,
  ]);

  readonly activePatientId = signal<string>(this.patientJuanPerez.id);

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
      (acc, p) => Math.max(acc, Number(p.fileNumber) || 0),
      0
    );
    return (max + 1).toString();
  }
}
