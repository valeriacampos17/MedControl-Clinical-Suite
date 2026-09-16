import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { Consultation } from '../../core/models/types';
import { ButtonComponent } from '../../shared/button/button.component';

@Component({
  selector: 'app-consulta',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <div class="flex flex-col w-full">
      <div class="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
        <div class="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-[#86f2e4] opacity-20 blur-3xl pointer-events-none -z-10"></div>
        <div class="absolute top-80 right-0 w-80 h-80 rounded-full bg-[#acedff] opacity-20 blur-3xl pointer-events-none -z-10"></div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#eceef0]">
          <div class="flex items-center gap-2 text-[13px] text-[#45464d]">
            <span (click)="goBack()" class="hover:text-[#006a61] cursor-pointer">Pacientes</span>
            <span class="material-symbols-outlined text-[16px] text-[#76777d]">chevron_right</span>
            <span class="font-semibold text-[#191c1e]">Nueva Consulta</span>
            <span class="px-2 py-0.5 rounded-md bg-[#86f2e4]/40 text-[11px] font-semibold text-[#006f66]">En curso</span>
          </div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <app-button variant="light" size="md" icon="arrow_back" (click)="goBack()">Cancelar</app-button>
            <app-button variant="primary" size="md" icon="save" (click)="saveConsultation()">Guardar Consulta</app-button>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-[#e6e8ea] p-5 sm:p-6 mb-6">
          <div class="flex items-center gap-4">
            <img class="w-14 h-14 rounded-xl object-cover ring-2 ring-[#eceef0] shadow-sm shrink-0" [src]="data.activePatient().avatarUrl" [alt]="data.activePatient().name" />
            <div class="flex flex-col">
              <h1 class="text-[18px] font-bold text-[#191c1e]">{{ data.activePatient().name }}</h1>
              <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-[#45464d]">
                <span>RUT: {{ data.activePatient().rut }}</span>
                <span>•</span>
                <span>{{ data.activePatient().age }} años</span>
                <span>•</span>
                <span>{{ data.activePatient().insurance }}</span>
                <span>•</span>
                <span class="font-semibold text-[#191c1e]">{{ data.activePatient().bloodType }}</span>
              </div>
            </div>
            @if (data.activePatient().severeAllergies.length > 0) {
              <div class="ml-auto px-3 py-1.5 rounded-lg bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] text-[11px] font-semibold flex items-center gap-1.5 shrink-0">
                <span class="material-symbols-outlined text-[14px]">warning</span>
                ALERGIAS: {{ data.activePatient().severeAllergies.join(' · ') }}
              </div>
            }
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div class="xl:col-span-7 flex flex-col gap-6">

            <div class="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-lg bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">monitor_heart</span>
                </span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Signos Vitales</h3>
                  <p class="text-[12px] text-[#45464d]">Mediciones de la consulta actual</p>
                </div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">PA Sistólica</span>
                  <input type="number" placeholder="120" class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="vitals().systolic || ''" (input)="updateVital('systolic', $event)" />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">PA Diastólica</span>
                  <input type="number" placeholder="80" class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="vitals().diastolic || ''" (input)="updateVital('diastolic', $event)" />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Frec. Cardíaca</span>
                  <input type="number" placeholder="72" class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="vitals().pulse || ''" (input)="updateVital('pulse', $event)" />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Temperatura</span>
                  <input type="number" step="0.1" placeholder="36.6" class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="vitals().temperature || ''" (input)="updateVital('temperature', $event)" />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">SpO2</span>
                  <input type="number" placeholder="98" class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="vitals().spo2 || ''" (input)="updateVital('spo2', $event)" />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Peso (kg)</span>
                  <input type="number" step="0.1" placeholder="75" class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="vitals().weight || ''" (input)="updateVital('weight', $event)" />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Talla (cm)</span>
                  <input type="number" placeholder="170" class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="vitals().height || ''" (input)="updateVital('height', $event)" />
                </label>
              </div>
              @if (vitals().weight > 0 && vitals().height > 0) {
                <div class="mt-3 pt-3 border-t border-[#f2f4f6] flex items-center gap-2 text-[12px]">
                  <span class="text-[#76777d]">IMC:</span>
                  <span class="font-bold text-[#191c1e]">{{ bmi() }}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold" [class]="bmiClass()">{{ bmiLabel() }}</span>
                </div>
              }
            </div>

            <div class="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-lg bg-[#86f2e4]/30 text-[#006f66] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">description</span>
                </span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Anamnesis</h3>
                  <p class="text-[12px] text-[#45464d]">Motivo de consulta y enfermedad actual</p>
                </div>
              </div>
              <div class="flex flex-col gap-4">
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Motivo de Consulta *</span>
                  <textarea rows="2" placeholder="Ej: Control de presión arterial, cefalea desde hace 3 días..." class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] resize-none" [value]="chiefComplaint()" (input)="chiefComplaint.set(($any($event.target)).value)"></textarea>
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Enfermedad Actual</span>
                  <textarea rows="4" placeholder="Evolución temporal, síntomas asociados, tratamientos previos..." class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] resize-none" [value]="historyOfPresentIllness()" (input)="historyOfPresentIllness.set(($any($event.target)).value)"></textarea>
                </label>
              </div>
            </div>

            <div class="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] text-[#45464d] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">stethoscope</span>
                </span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Examen Físico</h3>
                  <p class="text-[12px] text-[#45464d]">Hallazgos por aparato/sistema</p>
                </div>
              </div>
              <label class="flex flex-col gap-1.5">
                <textarea rows="4" placeholder="Estado general, cabeza y cuello, tórax, abdomen, extremidades, neurológico..." class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] resize-none" [value]="physicalExam()" (input)="physicalExam.set(($any($event.target)).value)"></textarea>
              </label>
            </div>
          </div>

          <div class="xl:col-span-5 flex flex-col gap-6">

            <div class="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-lg bg-[#fffbeb] text-[#92400e] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">medical_services</span>
                </span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Diagnóstico</h3>
                  <p class="text-[12px] text-[#45464d]">Código CIE-10 y descripción</p>
                </div>
              </div>
              <div class="flex flex-col gap-3">
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Código CIE-10</span>
                  <input type="text" placeholder="Ej: I10" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="diagnosisCode()" (input)="diagnosisCode.set(($any($event.target)).value)" />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Descripción del Diagnóstico</span>
                  <input type="text" placeholder="Ej: Hipertensión arterial esencial" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="diagnosisDescription()" (input)="diagnosisDescription.set(($any($event.target)).value)" />
                </label>
                <div class="flex flex-wrap gap-2">
                  @for (dx of commonDiagnoses; track dx.code) {
                    <button type="button" class="px-2.5 py-1 rounded-lg bg-[#f2f4f6] text-[#45464d] text-[11px] font-semibold border border-[#e0e3e5] hover:bg-[#e6e8ea] hover:text-[#191c1e] transition-colors" (click)="applyDiagnosis(dx)">
                      {{ dx.code }} — {{ dx.label }}
                    </button>
                  }
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-lg bg-[#ecfdf5] text-[#065f46] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">edit_note</span>
                </span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Plan de Tratamiento</h3>
                  <p class="text-[12px] text-[#45464d]">Indicaciones, medicamentos, indicaciones</p>
                </div>
              </div>
              <label class="flex flex-col gap-1.5">
                <textarea rows="5" placeholder="Medicamentos, dosis, frecuencia, indicaciones generales, reposo..." class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] resize-none" [value]="treatmentPlan()" (input)="treatmentPlan.set(($any($event.target)).value)"></textarea>
              </label>
            </div>

            <div class="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] text-[#76777d] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">sticky_note_2</span>
                </span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Observaciones</h3>
                  <p class="text-[12px] text-[#45464d]">Notas adicionales</p>
                </div>
              </div>
              <label class="flex flex-col gap-1.5">
                <textarea rows="3" placeholder="Seguimiento, interconsultas, exámenes pendientes..." class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] resize-none" [value]="notes()" (input)="notes.set(($any($event.target)).value)"></textarea>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ConsultaComponent {
  private router = inject(Router);
  data = inject(MockDataService);
  private toast = inject(ToastService);

  readonly vitals = signal({ systolic: 0, diastolic: 0, pulse: 0, temperature: 0, spo2: 0, weight: 0, height: 0 });
  readonly chiefComplaint = signal('');
  readonly historyOfPresentIllness = signal('');
  readonly physicalExam = signal('');
  readonly diagnosisCode = signal('');
  readonly diagnosisDescription = signal('');
  readonly treatmentPlan = signal('');
  readonly notes = signal('');

  readonly bmi = computed(() => {
    const v = this.vitals();
    if (v.weight <= 0 || v.height <= 0) return 0;
    const m = v.height / 100;
    return Math.round((v.weight / (m * m)) * 10) / 10;
  });

  readonly bmiLabel = computed(() => {
    const b = this.bmi();
    if (b === 0) return '';
    if (b < 18.5) return 'Bajo peso';
    if (b < 25) return 'Normal';
    if (b < 30) return 'Sobrepeso';
    return 'Obesidad';
  });

  readonly bmiClass = computed(() => {
    const b = this.bmi();
    if (b === 0) return '';
    if (b < 18.5) return 'bg-[#acedff] text-[#1e3a5f]';
    if (b < 25) return 'bg-[#ecfdf5] text-[#065f46]';
    if (b < 30) return 'bg-[#fffbeb] text-[#92400e]';
    return 'bg-[#ffdad6] text-[#ba1a1a]';
  });

  readonly commonDiagnoses = [
    { code: 'I10', label: 'Hipertensión esencial' },
    { code: 'E11', label: 'Diabetes mellitus tipo 2' },
    { code: 'E78', label: 'Dislipidemia' },
    { code: 'J06', label: 'Infección aguda vías respiratorias' },
    { code: 'M54', label: 'Dolor de espalda' },
    { code: 'K21', label: 'ERGE' },
    { code: 'F41', label: 'Trastorno de ansiedad' },
    { code: 'N39', label: 'Infección urinaria' },
  ];

  updateVital(field: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.vitals.update((v) => ({ ...v, [field]: value }));
  }

  applyDiagnosis(dx: { code: string; label: string }): void {
    this.diagnosisCode.set(dx.code);
    this.diagnosisDescription.set(dx.label);
  }

  goBack(): void {
    this.router.navigate(['pacientes-y-historial-clinico']);
  }

  saveConsultation(): void {
    const complaint = this.chiefComplaint().trim();
    if (!complaint) {
      this.toast.show('Faltan Datos', 'Ingrese el motivo de consulta para guardar.');
      return;
    }
    const now = new Date();
    const consultation: Consultation = {
      id: 'CONS-' + Date.now(),
      patientId: this.data.activePatient().id,
      patientName: this.data.activePatient().name,
      doctorName: this.data.doctor.name,
      date: now.toLocaleDateString('es-CL'),
      time: now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      type: 'Control',
      chiefComplaint: complaint,
      historyOfPresentIllness: this.historyOfPresentIllness(),
      physicalExam: this.physicalExam(),
      vitals: this.vitals(),
      diagnosisCode: this.diagnosisCode(),
      diagnosisDescription: this.diagnosisDescription(),
      treatmentPlan: this.treatmentPlan(),
      notes: this.notes(),
      status: 'completed',
    };
    this.data.addConsultation(consultation);
    this.toast.show('Consulta Guardada', `Consulta de ${consultation.patientName} registrada exitosamente.`);
    this.goBack();
  }
}
