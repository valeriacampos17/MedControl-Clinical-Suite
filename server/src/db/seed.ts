import bcrypt from 'bcryptjs';
import { db } from './connection.js';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function json(value: unknown): string {
  return JSON.stringify(value ?? []);
}

export function seed(): void {
  const count = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
  if (count.count > 0) return;

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, doctor_id, avatar_url, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const admin = insertUser.run(
    'usr-001',
    'Administradora Central',
    'admin@medcontrol.com',
    bcrypt.hashSync('admin123', 10),
    'admin',
    null,
    null,
  );
  void admin;

  const users: Array<[string, string, string, string, string, string]> = [
    ['usr-002', 'Dra. Noemí Aguirre', 'aguirre@medcontrol.com', 'doc-aguirre', 'doc-aguirre', 'doctor'],
    ['usr-003', 'Dr. Jorge Mawad', 'mawad@medcontrol.com', 'doc-mawad', 'doc-mawad', 'doctor'],
    ['usr-004', 'Dra. Sandra Muñoz', 'munoz@medcontrol.com', 'doc-munoz', 'doc-munoz', 'doctor'],
  ];
  for (const [id, name, email, doctorId, _unusedRoleEmail, role] of users) {
    void _unusedRoleEmail;
    insertUser.run(id, name, email, bcrypt.hashSync('doctor123', 10), role, doctorId, null);
  }

  const insertDoctor = db.prepare(`
    INSERT INTO doctors (id, name, short_name, specialty, active_today, avatar_url)
    VALUES (?, ?, ?, ?, 1, ?)
  `);
  insertDoctor.run('doc-aguirre', 'Dra. Noemí Aguirre', 'Dra. Aguirre', 'Medicina General', 'assets/images/doctors/doctor-aguirre.jpeg');
  insertDoctor.run('doc-mawad', 'Dr. Jorge Mawad', 'Dr. Mawad', 'Medicina General', 'assets/images/doctors/doctor-mawad.jpeg');
  insertDoctor.run('doc-munoz', 'Dra. Sandra Muñoz', 'Dra. Muñoz', 'Medicina General', 'assets/images/doctors/doctor-munoz.webp');

  const insertPatient = db.prepare(`
    INSERT INTO patients (id, ci, name, birth_date, age, phone, email, address, insurance, blood_type, allergies, chronic_conditions, consent_signed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const patients = [
    ['MED-0001', 'V-12.345.678', 'María García López', '12/05/1966', 58, '+58 412-8412893', 'maria.garcia@email.com', 'Av. Libertador 1240, Caracas', 'Seguros Caracas', 'O+', ['Penicilina'], ['Hipertensión Arterial', 'Dislipidemia'], 1],
    ['MED-0002', 'V-15.204.912', 'Carlos Rodríguez Pérez', '18/08/1982', 42, '+58 414-7711445', 'carlos.rodriguez@email.com', 'Calle Principal 890, Maracaibo', 'Seguros Mercantil', 'A+', [], [], 1],
    ['MED-0003', 'V-18.901.234', 'Ana Martínez Silva', '22/11/1989', 35, '+58 424-5551234', 'ana.martinez@email.com', 'Av. Francisco de Miranda, Caracas', 'Plan Madisons', 'B+', ['Sulfamidas'], [], 1],
    ['MED-0004', 'V-11.450.812', 'Roberto Sánchez Díaz', '03/02/1960', 64, '+58 412-9998877', 'roberto.sanchez@email.com', 'Urb. Las Mercedes, Caracas', 'Seguros La Previsora', 'O-', ['AINEs'], ['Diabetes Tipo 2', 'HTA Grado 2'], 1],
    ['MED-0005', 'V-16.782.339', 'Sofía Ramírez Torres', '14/07/1982', 42, '+58 416-3334455', 'sofia.ramirez@email.com', 'Av. Bolívar 456, Valencia', 'Seguros Caracas', 'A-', [], ['Arritmia'], 1],
    ['MED-0006', 'V-17.891.203', 'Carolina Muñoz Herrera', '25/09/1989', 35, '+58 412-7776655', 'carolina.munoz@email.com', 'Calle 5, Barquisimeto', 'Plan Madisons', 'AB+', [], ['Diabetes Tipo 2'], 1],
    ['MED-0007', 'V-10.234.891', 'Pedro Santana Blanco', '08/12/1956', 67, '+58 414-2223344', 'pedro.santana@email.com', 'Urb. El Paraiso, Caracas', 'Seguros Mercantil', 'O+', ['Penicilina', 'Mariscos'], ['Hipertensión', 'Insuficiencia Cardíaca'], 1],
    ['MED-0008', 'V-15.901.456', 'Lucía Fernández Rivas', '30/03/1985', 39, '+58 424-1112233', 'lucia.fernandez@email.com', 'Av. Universidad 789, Caracas', 'Seguros La Previsora', 'A+', [], [], 1],
    ['MED-0009', 'V-12.678.345', 'Jorge Tapia Gómez', '16/06/1969', 55, '+58 412-4445566', 'jorge.tapia@email.com', 'Calle Real 321, Los Teques', 'Seguros Caracas', 'B-', [], ['Colesterol Alto'], 1],
    ['MED-0010', 'V-18.345.678', 'Valentina Soto Mendes', '19/01/1995', 29, '+58 416-8887766', 'valentina.soto@email.com', 'Av. Principal, Guatire', 'Plan Madisons', 'O+', [], [], 0],
    ['MED-0011', 'V-12.890.123', 'Héctor Fuentes Castillo', '05/10/1967', 57, '+58 414-9990011', 'hector.fuentes@email.com', 'Calle Norte 654, Caracas', 'Seguros Mercantil', 'A+', ['Ibuprofeno'], ['Hipertensión'], 1],
    ['MED-0012', 'V-13.901.234', 'Isabel Navarro Peña', '11/04/1975', 49, '+58 424-6665544', 'isabel.navarro@email.com', 'Urb. Los Samanes, Caracas', 'Seguros Caracas', 'B+', [], [], 1],
  ] as const;
  for (const p of patients) {
    insertPatient.run(p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[9], json(p[10]), json(p[11]), p[12]);
  }

  const insertAppointment = db.prepare(`
    INSERT INTO appointments (id, date, time, duration_minutes, patient_id, doctor_id, reason, status, relative_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const today = todayStr();
  const appointments: Array<[string, string, string, number, string | null, string | null, string, string, string | null]> = [
    ['apt-1', today, '08:30 AM', 40, 'MED-0001', 'doc-aguirre', 'Control Hipertensión Arterial', 'completed', null],
    ['apt-2', today, '09:15 AM', 45, 'MED-0005', 'doc-aguirre', 'Evaluación de Arritmia y Disnea', 'in-progress', null],
    ['apt-3', today, '10:00 AM', 30, 'MED-0004', 'doc-aguirre', 'Primera Consulta - Dolor Torácico', 'pending', null],
    ['apt-4', today, '10:45 AM', 45, null, null, 'Espacio reservado para informe médico', 'break', null],
    ['apt-5', today, '11:30 AM', 30, 'MED-0003', 'doc-aguirre', 'Control Rutinario', 'pending', null],
    ['apt-6', addDays(today, 1), '08:30 AM', 30, 'MED-0006', 'doc-mawad', 'Control Diabetes Mellitus Tipo 2', 'confirmed', null],
    ['apt-7', addDays(today, 1), '10:00 AM', 45, 'MED-0007', 'doc-mawad', 'Control Presión Arterial Post-Operatorio', 'pending', null],
    ['apt-8', addDays(today, 1), '11:30 AM', 30, 'MED-0002', 'doc-mawad', 'Chequeo General', 'confirmed', null],
    ['apt-9', addDays(today, 2), '09:00 AM', 40, 'MED-0009', 'doc-mawad', 'Ecocardiograma Transtorácico', 'confirmed', null],
    ['apt-10', addDays(today, 2), '10:30 AM', 30, 'MED-0008', 'doc-mawad', 'Control Colesterol - Resultados', 'pending', null],
    ['apt-11', addDays(today, 3), '08:30 AM', 35, 'MED-0004', 'doc-munoz', 'Seguimiento Arritmia Cardíaca', 'confirmed', null],
    ['apt-12', addDays(today, 3), '10:15 AM', 30, 'MED-0005', 'doc-munoz', 'Control Colesterol y Triglicéridos', 'pending', null],
    ['apt-13', addDays(today, 5), '09:00 AM', 40, 'MED-0007', 'doc-munoz', 'Control Insuficiencia Cardíaca', 'confirmed', null],
    ['apt-14', addDays(today, 6), '08:30 AM', 30, 'MED-0010', 'doc-munoz', 'Primera Consulta - Dolor Torácico', 'pending', null],
    ['apt-15', addDays(today, 6), '10:45 AM', 45, 'MED-0002', 'doc-munoz', 'Stress Test / Prueba de Esfuerzo', 'confirmed', null],
    ['apt-16', addDays(today, 7), '09:30 AM', 30, 'MED-0009', 'doc-aguirre', 'Control Hipertensión Resistente', 'pending', null],
    ['apt-17', today, '09:30 AM', 30, 'MED-0011', 'doc-mawad', 'Chequeo General', 'confirmed', null],
    ['apt-18', today, '10:00 AM', 30, 'MED-0006', 'doc-munoz', 'Control Diabetes Mellitus Tipo 2', 'pending', null],
    ['apt-19', today, '10:00 AM', 30, 'MED-0008', 'doc-munoz', 'Primera Consulta - Palpitaciones', 'pending', null],
    ['apt-past-1', addDays(today, -1), '09:00 AM', 30, 'MED-0011', 'doc-aguirre', 'Control Cardiología Rutinario', 'completed', null],
    ['apt-past-2', addDays(today, -1), '10:30 AM', 30, 'MED-0012', 'doc-mawad', 'Evaluación de Palpitaciones', 'no-show', null],
  ];
  for (const a of appointments) {
    insertAppointment.run(...a);
  }

  const triageInsert = db.prepare(`
    INSERT INTO triage_vitals (appointment_id, systolic, diastolic, pulse, temperature, spo2, weight, height, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  triageInsert.run('apt-2', 120, 80, 72, 36.5, 99, 62, 165, 'TA y frecuencia dentro de rango');

  const insertConsultation = db.prepare(`
    INSERT INTO consultations (id, patient_id, doctor_id, date, time, type, chief_complaint, history_of_present_illness, physical_exam, vitals, diagnosis_code, diagnosis_description, treatment_plan, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
  `);
  const consultations = [
    {
      id: 'CONS-2024-1014', patientId: 'MED-0001', doctorId: 'doc-aguirre', date: '14/10/2024', time: '10:15 AM',
      type: 'Control Cardiológico',
      chiefComplaint: 'Control rutinario de hipertensión arterial y revisión de exámenes de laboratorio.',
      history: 'Paciente de 58 años con antecedente de HTA y dislipidemia en tratamiento continuo. Refiere sentirse estable sin dolor torácico, palpitaciones ni disnea de esfuerzo. Buena adherencia al tratamiento.',
      physical: 'Paciente consciente, orientada, normoperfundida. Ruidos cardíacos rítmicos, bien auditados, sin soplos. Campos pulmonares bien ventilados sin ruidos agregados. Abdomen blando, no doloroso, sin visceromegalias. Extremidades sin edema.',
      vitals: { systolic: 135, diastolic: 85, pulse: 72, temperature: 36.6, spo2: 98, weight: 68.5, height: 162 },
      dxCode: 'I10', dxDesc: 'Hipertensión esencial (primaria)',
      plan: '1. Continuar Losartán Potásico 50 mg v.o. cada 12 horas.\n2. Continuar Atorvastatina 20 mg v.o. en la noche.\n3. Mantener dieta hiposódica y caminata diaria 30 min.\n4. Control en 3 meses con perfil lipídico y función renal.',
      notes: 'Se adjuntan resultados de laboratorio. Parámetros metabólicos estables. Paciente firma consentimiento de telemonitoreo.',
    },
    {
      id: 'CONS-2024-0618', patientId: 'MED-0001', doctorId: 'doc-aguirre', date: '18/06/2024', time: '09:30 AM',
      type: 'Primera Consulta',
      chiefComplaint: 'Cefalea holocraneana leve y registro de presión elevada en domicilio.',
      history: 'Paciente acude por presentar dolor de cabeza pulsátil ocasional en región occipital. Refiere tomas de PA en farmacia con valores de 145/90 mmHg.',
      physical: 'Buen estado general. PA 142/90 mmHg. Sin signos de focalidad neurológica. Auscultación cardiopulmonar dentro de límites normales.',
      vitals: { systolic: 142, diastolic: 90, pulse: 78, temperature: 36.8, spo2: 97, weight: 70, height: 162 },
      dxCode: 'I10', dxDesc: 'Hipertensión esencial (primaria)',
      plan: '1. Iniciar Losartán 50 mg v.o. cada 12 horas.\n2. Bitácora de presión arterial 2 veces al día.\n3. Evaluación por nutricionista.',
      notes: 'Se solicita ecocardiograma transtorácico de control.',
    },
    {
      id: 'CONS-2024-0115', patientId: 'MED-0001', doctorId: 'doc-mawad', date: '15/01/2024', time: '11:30 AM',
      type: 'Ingreso Preventivo',
      chiefComplaint: 'Evaluación inicial por antecedentes familiares de hipertensión y dislipidemia.',
      history: 'Paciente acude a control de salud preventivo. Refiere madre hipertensa. Asintomática en el momento del examen.',
      physical: 'Consciente, sin edemas. PA 148/92 mmHg en primera toma, 144/88 en segunda toma. Ruidos cardíacos rítmicos.',
      vitals: { systolic: 148, diastolic: 92, pulse: 82, temperature: 36.5, spo2: 97, weight: 71.5, height: 162 },
      dxCode: 'I10', dxDesc: 'Hipertensión esencial (primaria) - Sospecha inicial',
      plan: '1. Solicitud de perfil lipídico, hemograma y ECG de 12 derivaciones.\n2. Iniciar bitácora de presión arterial.\n3. Indicación de dieta baja en sodio.',
      notes: 'Primera consulta en la clínica. Se abre expediente HCE-MED-0001.',
    },
    {
      id: 'CONS-2024-0920', patientId: 'MED-0002', doctorId: 'doc-mawad', date: '20/09/2024', time: '11:00 AM',
      type: 'Chequeo General',
      chiefComplaint: 'Chequeo preventivo anual por antecedentes familiares de diabetes.',
      history: 'Paciente masculino de 42 años asintomático. Solicita evaluación médica general y exámenes de rutina.',
      physical: 'Sin hallazgos patológicos significativos. Auscultación cardíaca y pulmonar normal.',
      vitals: { systolic: 120, diastolic: 78, pulse: 68, temperature: 36.5, spo2: 99, weight: 78, height: 175 },
      dxCode: 'Z00.0', dxDesc: 'Examen médico general',
      plan: '1. Mantener estilo de vida saludable y ejercicio aeróbico.\n2. Exámenes de laboratorio de control preventivo.',
      notes: 'Paciente sin factores de riesgo agudos.',
    },
    {
      id: 'CONS-2024-0915', patientId: 'MED-0005', doctorId: 'doc-munoz', date: '15/09/2024', time: '08:45 AM',
      type: 'Control de Arritmia',
      chiefComplaint: 'Evaluación de palpitaciones esporádicas y cansancio.',
      history: 'Paciente de 42 años refiere episodios breves de palpitaciones en reposo, asociados a estrés laboral.',
      physical: 'Ruidos cardíacos rítmicos con extrasístoles ocasionales. Sin soplos. Murmullo vesicular normal.',
      vitals: { systolic: 128, diastolic: 82, pulse: 84, temperature: 36.7, spo2: 98, weight: 62, height: 165 },
      dxCode: 'I49.9', dxDesc: 'Arritmia cardíaca no especificada',
      plan: '1. Solicitud de Holter de ritmo de 24 horas.\n2. Ecocardiograma Doppler a color.\n3. Evitar estimulantes (café, bebidas energizantes).',
      notes: 'Se programa cita de seguimiento tras resultados de Holter.',
    },
  ];
  const insertConsultationStmt = db.prepare(`
    INSERT INTO consultations (id, patient_id, doctor_id, date, time, type, chief_complaint, history_of_present_illness, physical_exam, vitals, diagnosis_code, diagnosis_description, treatment_plan, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
  `);
  for (const c of consultations) {
    insertConsultationStmt.run(
      c.id, c.patientId, c.doctorId, c.date, c.time, c.type,
      c.chiefComplaint, c.history, c.physical, json(c.vitals),
      c.dxCode, c.dxDesc, c.plan, c.notes,
    );
  }
  void insertConsultation;

  const insertWorkingDay = db.prepare('INSERT INTO working_days (date, note) VALUES (?, ?)');
  const days = [ -1, 0, 1, 2, 3, 5, 6, 7, 8, 9 ] as const;
  for (const n of days) insertWorkingDay.run(addDays(today, n), 'Turno normal');

  const insertDaySchedule = db.prepare('INSERT INTO day_schedules (doctor_id, day_of_week, enabled, start_time, end_time, total_capacity) VALUES (NULL, ?, ?, ?, ?, ?)');
  const weekdays: Array<[number, number, string, string, number]> = [
    [1, 1, '08:00', '16:00', 20],
    [2, 1, '08:00', '16:00', 20],
    [3, 1, '08:00', '16:00', 20],
    [4, 1, '08:00', '16:00', 20],
    [5, 1, '08:00', '16:00', 20],
    [6, 0, '', '', 0],
  ];
  for (const s of weekdays) insertDaySchedule.run(...s);

  const insertAbsence = db.prepare('INSERT INTO absences (id, doctor_id, reason, location, type, start_date, end_date, affected_note, collision_status, validation_status, icon_name) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertAbsence.run('abs-1', 'Congreso Médico Venezolano 2026', 'Hotel Alba Caracas', 'Actividad Académica', '2026-11-15', '2026-11-18', '0 citas colisionadas', 'ok', 'Aprobado por Dirección Médica', 'school');

  const insertExamTemplate = db.prepare('INSERT INTO exam_templates (id, name, category, fasting, preparation, active) VALUES (?, ?, ?, ?, ?, 1)');
  const examTemplates: Array<[string, string, string, number, string]> = [
    ['EX-LAB-01', 'Hemograma completo', 'laboratorio', 0, 'Sin ayunas requerido'],
    ['EX-LAB-02', 'Perfil lipídico (Colesterol Total, HDL, LDL, Triglicéridos)', 'laboratorio', 1, 'Ayuno de 12 horas'],
    ['EX-LAB-03', 'Glicemia en ayunas', 'laboratorio', 1, 'Ayuno de 8 horas'],
    ['EX-LAB-04', 'Hemoglobina Glicosilada (HbA1c)', 'laboratorio', 0, 'Sin ayunas requerido'],
    ['EX-LAB-05', 'Creatinina y BUN (Función renal)', 'laboratorio', 0, 'Sin ayunas requerido'],
    ['EX-LAB-06', 'Perfil hepático (TGO, TGP, Bilirrubinas, FA)', 'laboratorio', 1, 'Ayuno de 8 horas'],
    ['EX-LAB-07', 'TSH y T4 libre', 'laboratorio', 0, 'Sin ayunas requerido'],
    ['EX-LAB-08', 'Urocultivo con antibiograma', 'laboratorio', 0, 'Recoger primera orina de la mañana'],
    ['EX-LAB-09', 'Electrolitos (Na, K, Cl, Ca)', 'laboratorio', 0, 'Sin ayunas requerido'],
    ['EX-LAB-10', 'PCR y VSG', 'laboratorio', 0, 'Sin ayunas requerido'],
    ['EX-IMG-01', 'Radiografía de tórax (AP y Lateral)', 'imagen', 0, 'Retirar objetos metálicos de la zona'],
    ['EX-IMG-02', 'Ecocardiograma transtorácico (TTE)', 'imagen', 0, 'Sin ayunas requerido'],
    ['EX-IMG-03', 'TAC cerebral simple', 'imagen', 0, 'Retirar objetos metálicos'],
    ['EX-IMG-04', 'TAC de tórax con contraste', 'imagen', 1, 'Ayuno de 4 horas y función renal previa'],
    ['EX-IMG-05', 'Ecografía abdominal total', 'imagen', 1, 'Ayuno de 8 horas'],
    ['EX-IMG-06', 'Ecografía renal y vías urinarias', 'imagen', 0, 'Llenado vesical (tomar 1L de agua 1h antes)'],
    ['EX-FUN-01', 'Electrocardiograma (ECG) de 12 derivaciones', 'funcional', 0, 'Sin ayunas requerido'],
    ['EX-FUN-02', 'Holter de ritmo de 24 horas', 'funcional', 0, 'Ducha previa sin cremas ni talco'],
    ['EX-FUN-03', 'Prueba de esfuerzo (Stress Test)', 'funcional', 0, 'Ropa cómoda, evitar café 4h antes'],
    ['EX-FUN-04', 'Espirometría', 'funcional', 0, 'Evitar broncodilatadores 6h antes'],
    ['EX-PROC-01', 'Endoscopía digestiva alta', 'procedimiento', 1, 'Ayuno absoluto de 8 horas'],
    ['EX-PROC-02', 'Colonoscopía', 'procedimiento', 1, 'Dieta líquida y evacuantes el día previo'],
  ];
  for (const e of examTemplates) insertExamTemplate.run(...e);

  const insertMedication = db.prepare('INSERT INTO medications (id, name, presentation, pharmaceutical_form, route, default_frequency, requires_prescription, controlled, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)');
  const medications: Array<[string, string, string, string, string, string, number, number]> = [
    ['MED-001', 'Losartán Potásico', '50 mg', 'tableta', 'oral', '1 tableta cada 24 h (en la mañana)', 1, 0],
    ['MED-002', 'Atorvastatina', '20 mg', 'tableta', 'oral', '1 tableta cada 24 h (en la noche)', 1, 0],
    ['MED-003', 'Enalapril', '10 mg', 'tableta', 'oral', '1 tableta cada 12 h', 1, 0],
    ['MED-004', 'Ácido Acetilsalicílico', '100 mg', 'tableta', 'oral', '1 tableta al día', 0, 0],
    ['MED-005', 'Metformina', '850 mg', 'tableta', 'oral', '1 tableta cada 12 h con alimentos', 1, 0],
    ['MED-006', 'Amlodipino', '5 mg', 'tableta', 'oral', '1 tableta cada 24 h', 1, 0],
    ['MED-007', 'Bisoprolol', '2.5 mg', 'tableta', 'oral', '1 tableta cada 24 h', 1, 0],
    ['MED-008', 'Omeprazol', '20 mg', 'cápsula', 'oral', '1 cápsula en ayunas cada 24 h', 0, 0],
    ['MED-009', 'Ibuprofeno', '400 mg', 'tableta', 'oral', '1 tableta cada 8 h con alimentos', 0, 0],
    ['MED-010', 'Paracetamol', '500 mg', 'tableta', 'oral', '1 tableta cada 6-8 h si dolor o fiebre', 0, 0],
    ['MED-011', 'Levotiroxina', '100 mcg', 'tableta', 'oral', '1 tableta en ayunas 30 min antes del desayuno', 1, 0],
    ['MED-012', 'Sertralina', '50 mg', 'tableta', 'oral', '1 tableta cada 24 h', 1, 0],
    ['MED-013', 'Amoxicilina', '500 mg', 'cápsula', 'oral', '1 cápsula cada 8 h por 7 días', 1, 0],
    ['MED-014', 'Azitromicina', '500 mg', 'tableta', 'oral', '1 tableta cada 24 h por 3-5 días', 1, 0],
    ['MED-015', 'Clopidogrel', '75 mg', 'tableta', 'oral', '1 tableta cada 24 h', 1, 0],
    ['MED-016', 'Furosemida', '40 mg', 'tableta', 'oral', '1 tableta por la mañana', 1, 0],
    ['MED-017', 'Prednisona', '5 mg', 'tableta', 'oral', 'Según esquema médico indicado', 1, 0],
    ['MED-018', 'Salbutamol', '100 mcg', 'inhalador', 'inhalatoria', '2 inhalaciones cada 4-6 h según síntomas', 1, 0],
  ];
  for (const m of medications) insertMedication.run(...m);

  const insertDiagnosisCatalog = db.prepare('INSERT INTO diagnosis_codes (code, label) VALUES (?, ?)');
  const diagnoses: Array<[string, string]> = [
    ['I10', 'Hipertensión esencial (primaria)'],
    ['E11', 'Diabetes mellitus tipo 2'],
    ['E78', 'Dislipidemia'],
    ['J06', 'Infección aguda de vías respiratorias superiores'],
    ['M54', 'Dorsalgia (dolor de espalda)'],
    ['K21', 'Enfermedad por reflujo gastroesofágico'],
    ['F41', 'Trastorno de ansiedad'],
    ['N39', 'Infección de vías urinarias'],
    ['J45', 'Asma'],
    ['E66', 'Obesidad'],
    ['I48', 'Fibrilación y aleteo auricular'],
    ['D64', 'Anemia no especificada'],
    ['E03', 'Hipotiroidismo'],
    ['N18', 'Enfermedad renal crónica'],
    ['Z00.0', 'Examen médico general'],
  ];
  for (const d of diagnoses) {
    insertDiagnosisCatalog.run(...d);
  }

  const insertTriageLevel = db.prepare('INSERT INTO triage_levels (id, code, name, max_wait_minutes, description, color, active, ord) VALUES (?, ?, ?, ?, ?, ?, 1, ?)');
  const triageLevels = [
    ['TL-001', 'rojo', 'Reanimación / Emergencia Vital', 0, 'Requiere atención inmediata, riesgo vital presente.', '#d32f2f', 5],
    ['TL-002', 'naranja', 'Urgencia / Emergencia', 10, 'Situación potencialmente grave, riesgo probable.', '#ed6c02', 4],
    ['TL-003', 'amarillo', 'Urgencia menor / Observación', 60, 'Sin riesgo vital, requiere evaluación en corto plazo.', '#f9a825', 3],
    ['TL-004', 'verde', 'Atención rutinaria', 120, 'Problema agudo no urgente o control programado.', '#2e7d32', 2],
    ['TL-005', 'azul', 'Consulta sin urgencia', 240, 'Trámite o consulta no urgente.', '#1976d2', 1],
  ] as const;
  for (const t of triageLevels) insertTriageLevel.run(t[0], t[1], t[2], t[3], t[4], t[5], t[6]);

  const insertTriageRule = db.prepare('INSERT INTO triage_auto_rules (id, level_code, field, min_value, max_value) VALUES (?, ?, ?, ?, ?)');
  const triageRules: Array<[string, string, string, number | null, number | null]> = [
    ['TR-001', 'rojo', 'spo2', null, 86],
    ['TR-002', 'rojo', 'systolic', null, 79],
    ['TR-003', 'naranja', 'spo2', 86, 92],
    ['TR-004', 'naranja', 'pulse', 130, null],
    ['TR-005', 'naranja', 'temp', 39.5, null],
    ['TR-006', 'amarillo', 'spo2', 92, 95],
    ['TR-007', 'amarillo', 'systolic', 140, null],
    ['TR-008', 'amarillo', 'diastolic', 110, null],
    ['TR-009', 'amarillo', 'pulse', 100, 130],
    ['TR-010', 'verde', 'pulse', 60, 100],
    ['TR-011', 'verde', 'spo2', 95, null],
  ];
  for (const r of triageRules) insertTriageRule.run(...r);

  db.prepare(`INSERT INTO organization_settings (id, name, rut, address, phone, email, footer_text, signature_name) VALUES ('ORG-001', 'MedControl Sede Central', 'J-12345678-9', 'Av. Libertador 1240, Caracas', '+58 212-5550000', 'contacto@medcontrol.com', 'Documento electrónico generado por MedControl Clinical Suite. La firma del prescriptor valida este documento conforme a la normativa MINSAL de firma avanzada.', 'Dra. Noemí Aguirre')`).run();

  const insertAlertRule = db.prepare('INSERT INTO alert_rules (id, name, description, category, severity, icon, action_label, route, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const alertRules: Array<[string, string, string, string, string, string, string, string, number]> = [
    ['AR-001', 'Alergia Crítica en prescripción', 'Se detecta antecedente de alergia severa al intentar prescribir un medicamento contraindicado.', 'receta', 'critical', 'warning', 'Ver Ficha', 'pacientes-y-historial-clinico', 1],
    ['AR-002', 'Triaje Naranja sin clasificar en 10 min', 'Paciente con nivel de triaje naranja que supera el tiempo máximo de espera sin atención médica.', 'triage', 'warning', 'monitor_heart', 'Ver Dashboard', 'dashboard-de-citas', 1],
    ['AR-003', 'Recordatorios de turno enviados', 'Twilio SMS Gateway despachó recordatorios del bloque; se informa el porcentaje de confirmación.', 'cita', 'success', 'sms', 'Ver Detalle', 'dashboard-de-citas', 1],
    ['AR-004', 'Resultado de laboratorio anormal', 'Un examen de laboratorio retorna un resultado fuera del rango de referencia configurado.', 'examen', 'critical', 'science', 'Ver Recetas & Exámenes', 'recetas-y-examenes', 0],
    ['AR-005', 'Vencimiento próximo de receta', 'Una receta médica está próxima a vencer y el tratamiento no fue renovado.', 'receta', 'info', 'event_busy', 'Ver Recetas & Exámenes', 'recetas-y-examenes', 0],
  ];
  for (const a of alertRules) insertAlertRule.run(...a);

  const insertCatalogUser = db.prepare('INSERT INTO catalog_users (id, name, email, role, doctor_id, active) VALUES (?, ?, ?, ?, ?, 1)');
  insertCatalogUser.run('usr-001', 'Administradora Central', 'admin@medcontrol.com', 'admin', null);
  insertCatalogUser.run('usr-002', 'Dra. Noemí Aguirre', 'aguirre@medcontrol.com', 'doctor', 'doc-aguirre');
  insertCatalogUser.run('usr-003', 'Dr. Jorge Mawad', 'mawad@medcontrol.com', 'doctor', 'doc-mawad');
  insertCatalogUser.run('usr-004', 'Dra. Sandra Muñoz', 'munoz@medcontrol.com', 'doctor', 'doc-munoz');

  const insertConsultationType = db.prepare('INSERT INTO consultation_types (id, title, duration_minutes, price, note, suggested) VALUES (?, ?, ?, ?, ?, ?)');
  insertConsultationType.run('primera', 'Primera Consulta', 45, '$75.000 Particular', 'Evaluación médica completa', 1);
  insertConsultationType.run('control', 'Control / Seguimiento', 30, '$45.000 Particular', 'Control de tratamiento', 0);
  insertConsultationType.run('sobrecupo', 'Sobrecupo', 20, '$60.000 Particular', 'Espacio adicional en agenda', 0);
  insertConsultationType.run('examenes', 'Solo Exámenes', 15, '$20.000 Particular', 'Entrega y revisión de resultados', 0);
}