import { Component, inject, signal } from '@angular/core';
import { NavigationService } from '../../core/services/navigation.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { ToastComponent } from '../../shared/toast/toast.component';

@Component({
  selector: 'app-patient-history',
  standalone: true,
  imports: [ButtonComponent, BadgeComponent, ToastComponent],
  template: `
    <div class="flex flex-col w-full">
      <div class="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
        <div class="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-[#86f2e4] opacity-20 blur-3xl pointer-events-none -z-10"></div>
        <div class="absolute top-80 right-0 w-80 h-80 rounded-full bg-[#acedff] opacity-20 blur-3xl pointer-events-none -z-10"></div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#eceef0]">
          <div class="flex items-center gap-2 text-[13px] text-[#45464d]">
            <span (click)="nav.navigate('dashboard-de-citas')" class="hover:text-[#006a61] cursor-pointer">Pacientes</span>
            <span class="material-symbols-outlined text-[16px] text-[#76777d]">chevron_right</span>
            <span class="font-semibold text-[#191c1e]">Ficha Clínica Electrónica</span>
            <span class="px-2 py-0.5 rounded-md bg-[#e6e8ea] text-[11px] font-mono text-[#45464d]">HCE-9482</span>
          </div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <app-button variant="light" size="md" icon="picture_as_pdf" (click)="handleDownloadPDF()">Descargar Expediente PDF</app-button>
            <app-button variant="light" size="md" icon="prescriptions" (click)="handleEmitRecipe()">Emitir Receta</app-button>
            <app-button variant="light" size="md" icon="event" (click)="nav.navigate('agenda-y-disponibilidad')">Agendar Control</app-button>
            <app-button variant="primary" size="md" icon="add" (click)="handleNewConsulta()">Nueva Consulta</app-button>
          </div>
        </div>

        <section class="bg-white rounded-xl shadow-sm border border-[#e6e8ea] p-5 sm:p-6 mb-6">
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="flex items-start gap-4 shrink-0">
              <img class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-[#eceef0] shadow-sm shrink-0" alt="Juan Pérez Morales" [src]="data.patientJuanPerez.avatarUrl" />
              <div class="flex flex-col">
                <div class="flex flex-wrap items-center gap-2 mb-1">
                  <h1 class="text-[20px] sm:text-[24px] font-bold text-[#191c1e] tracking-tight">{{ data.patientJuanPerez.name }}</h1>
                  <app-badge variant="teal">Isapre Colmena Golden</app-badge>
                  <span class="px-2.5 py-0.5 rounded-full bg-[#f2f4f6] text-[#45464d] text-[11px] font-semibold">Golden Health 15%</span>
                </div>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#45464d]">
                  <span>{{ data.patientJuanPerez.age }} años ({{ data.patientJuanPerez.birthDate }})</span>
                  <span>•</span>
                  <span>RUT: {{ data.patientJuanPerez.rut }}</span>
                  <span>•</span>
                  <span>Grupo Sanguíneo: <strong class="text-[#191c1e]">{{ data.patientJuanPerez.bloodType }}</strong></span>
                  <span>•</span>
                  <span>Tutor: {{ data.patientJuanPerez.tutor }}</span>
                </div>
                <div class="mt-3 p-2.5 rounded-lg bg-[#ffdad6] border border-[#ba1a1a]/30 flex items-center gap-2 text-[#ba1a1a] text-[12px] font-semibold">
                  <span class="material-symbols-outlined text-[18px] shrink-0">warning</span>
                  <span>ALERGIAS SEVERAS: Penicilina (Anafilaxia) · AINEs (Ibuprofeno/Ketoprofeno)</span>
                </div>
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                  <span class="text-[11px] font-bold text-[#76777d] uppercase tracking-wider">Condiciones Crónicas:</span>
                  <span class="px-2 py-0.5 rounded-md bg-[#fffbeb] text-[#92400e] text-[11px] font-semibold border border-[#fde68a]">HTA Grado 2</span>
                  <span class="px-2 py-0.5 rounded-md bg-[#f2f4f6] text-[#45464d] text-[11px] font-semibold border border-[#e0e3e5]">Dislipidemia Mixta</span>
                </div>
              </div>
            </div>
            <div class="lg:ml-auto flex flex-col justify-between pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[#eceef0] lg:pl-6 text-[12px] text-[#45464d] gap-2 min-w-[260px]">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#006a61] text-[18px]">call</span>
                <span class="text-[#191c1e] font-semibold">{{ data.patientJuanPerez.phone }}</span>
                <span class="px-1.5 py-0.2 rounded bg-[#86f2e4]/40 text-[#006f66] text-[10px] font-bold">WhatsApp Verificado</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#76777d] text-[18px]">mail</span>
                <span>{{ data.patientJuanPerez.email }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#76777d] text-[18px]">home</span>
                <span class="truncate">{{ data.patientJuanPerez.address }}</span>
              </div>
              <div class="flex items-center gap-2 pt-1 border-t border-[#eceef0]">
                <span class="material-symbols-outlined text-[#006a61] text-[18px]">assignment_turned_in</span>
                <span class="text-[#006a61] font-semibold">Consentimiento Informado Firmado</span>
              </div>
            </div>
          </div>
        </section>

        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
          <div class="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#e6e8ea] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Última Consulta</span>
              <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#006a61]">
                <span class="material-symbols-outlined text-[20px]">history_edu</span>
              </span>
            </div>
            <div class="mt-2">
              <span class="text-[24px] font-extrabold text-[#191c1e]">Hace 14 días</span>
              <p class="text-[12px] text-[#45464d] font-medium">14 Oct 2024 · Control Cardiológico</p>
            </div>
            <div class="mt-3 pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[11px] text-[#76777d]">
              <span>Dr. Carlos Mendoza</span>
              <span class="font-semibold text-[#191c1e]">Box 402</span>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#e6e8ea] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Próxima Cita</span>
              <span class="w-8 h-8 rounded-lg bg-[#86f2e4]/30 flex items-center justify-center text-[#006f66]">
                <span class="material-symbols-outlined text-[20px]">event_available</span>
              </span>
            </div>
            <div class="mt-2">
              <span class="text-[24px] font-extrabold text-[#191c1e]">28 Oct 2024</span>
              <p class="text-[12px] text-[#006a61] font-semibold">08:30 AM (En 3 días)</p>
            </div>
            <div class="mt-3 pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[11px] text-[#76777d]">
              <span>Confirmada por Paciente</span>
                      <span class="w-2 h-2 rounded-full bg-[#006a61]"></span>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#e6e8ea] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Signos Vitales (Último)</span>
              <span class="w-8 h-8 rounded-lg bg-[#ffdad6]/40 flex items-center justify-center text-[#ba1a1a]">
                <span class="material-symbols-outlined text-[20px]">cardiology</span>
              </span>
            </div>
            <div class="mt-2 flex items-baseline justify-between">
              <div>
                <span class="text-[24px] font-extrabold text-[#191c1e]">135/85</span>
                <span class="text-[11px] text-[#76777d] ml-1">mmHg</span>
              </div>
              <div class="flex items-center gap-1 text-[#006a61] font-semibold text-[13px]">
                <span class="material-symbols-outlined text-[16px]">favorite</span>
                <span>72 bpm</span>
              </div>
            </div>
            <div class="mt-2 w-full h-7 overflow-hidden">
              <svg class="w-full h-full text-[#006a61]" viewBox="0 0 200 30" fill="none">
                <path d="M0 15 L30 15 L35 5 L42 25 L48 8 L54 18 L60 15 L90 15 L95 5 L102 25 L108 8 L114 18 L120 15 L150 15 L155 5 L162 25 L168 8 L174 18 L180 15 L200 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div class="pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[11px] text-[#76777d]">
              <span>Temp: 36.6 °C</span>
              <span>SpO2: 98%</span>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#e6e8ea] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Adherencia Farmacológica</span>
              <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#006a61]">
                <span class="material-symbols-outlined text-[20px]">medication</span>
              </span>
            </div>
            <div class="mt-2 flex items-baseline justify-between">
              <span class="text-[24px] font-extrabold text-[#191c1e]">94%</span>
              <span class="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#065f46] text-[11px] font-semibold">Excelente</span>
            </div>
            <div class="w-full bg-[#e6e8ea] h-1.5 rounded-full mt-2 overflow-hidden">
              <div class="h-full bg-[#006a61] rounded-full" style="width: 94%"></div>
            </div>
            <div class="mt-3 pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[11px] text-[#76777d]">
              <span>3 de 3 fármacos activos</span>
              <span class="text-[#006a61] font-semibold">Farmacia OK</span>
            </div>
          </div>
        </section>

        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div class="xl:col-span-8 flex flex-col gap-6">
            <div class="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-[#e6e8ea] relative">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#eceef0] gap-2">
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-[16px] font-bold text-[#191c1e]">14 Oct 2024 · 10:15 AM</h3>
                    <app-badge variant="teal" size="sm">CIE-10: I10</app-badge>
                    <span class="px-2 py-0.5 rounded bg-[#f2f4f6] text-[11px] font-semibold text-[#45464d]">Presencial</span>
                  </div>
                  <p class="text-[12px] text-[#45464d] mt-0.5">Consulta de Control Cardiológico · Dr. Carlos Mendoza (Cardiología Clínica) · Box 402</p>
                </div>
              </div>
              <div class="mb-4">
                <span class="text-[11px] font-bold text-[#76777d] uppercase tracking-wider block mb-1">Diagnóstico Clínico</span>
                <p class="text-[13px] text-[#191c1e] bg-[#f2f4f6] p-3 rounded-lg border border-[#e0e3e5] leading-relaxed">
                  Hipertensión arterial en estadio 2 en fase de estabilización. Buen control tensional en reposo con régimen farmacológico combinado. Sin signos de congestión ni disnea paroxística nocturna. Se mantiene conducta expectante y se solicitan exámenes de control metabólico.
                </p>
              </div>
            </div>
          </div>

          <div class="xl:col-span-4 flex flex-col gap-6">
            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-lg bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
                  <span class="material-symbols-outlined text-[20px]">health_and_safety</span>
                </span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Antecedentes & Alergias</h3>
                  <p class="text-[12px] text-[#45464d]">Registro crítico del paciente</p>
                </div>
              </div>
              <div class="flex flex-col gap-2 mb-4">
                <span class="text-[11px] font-bold text-[#ba1a1a] uppercase tracking-wider">Alergias Medicamentosas</span>
                <div class="p-2.5 rounded-lg bg-[#ffdad6]/40 border border-[#ba1a1a]/20 flex flex-col gap-1">
                  <span class="text-[12px] font-bold text-[#ba1a1a]">Penicilinas (Anafilaxia)</span>
                  <span class="text-[11px] text-[#45464d]">Reacción severa en 2012. Contraindicación absoluta.</span>
                </div>
                <div class="p-2.5 rounded-lg bg-[#fffbeb] border border-[#fde68a] flex flex-col gap-1">
                  <span class="text-[12px] font-bold text-[#92400e]">AINEs (Ibuprofeno/Ketoprofeno)</span>
                  <span class="text-[11px] text-[#45464d]">Broncoespasmo y edema palpebral.</span>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <span class="w-8 h-8 rounded-lg bg-[#86f2e4]/30 text-[#006f66] flex items-center justify-center">
                    <span class="material-symbols-outlined text-[20px]">pill</span>
                  </span>
                  <div>
                    <h3 class="text-[15px] font-bold text-[#191c1e]">Medicamentos Vigentes</h3>
                    <p class="text-[12px] text-[#45464d]">3 prescripciones activas</p>
                  </div>
                </div>
                <app-badge variant="teal" size="sm">Adherencia 94%</app-badge>
              </div>
              <div class="flex flex-col gap-3">
                @for (med of medications(); track med.name) {
                  <div class="p-3 rounded-lg bg-[#f2f4f6] border border-[#e0e3e5]">
                    <div class="flex items-center justify-between">
                      <span class="text-[13px] font-bold text-[#191c1e]">{{ med.name }}</span>
              <span class="w-2 h-2 rounded-full bg-[#006a61]"></span>
                    </div>
                    <p class="text-[12px] text-[#45464d] mt-1">{{ med.dose }}</p>
                    <div class="flex items-center justify-between mt-2 pt-2 border-t border-[#e0e3e5] text-[11px]">
                      <span class="text-[#006a61] font-semibold">{{ med.daysLeft }}</span>
                      <span class="text-[#76777d]">Farmacia Central</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      <app-toast />
    </div>
  `,
})
export class PatientHistoryComponent {
  nav = inject(NavigationService);
  data = inject(MockDataService);
  toast = inject(ToastService);

  medications = signal([
    { name: 'Losartán Potásico 50 mg', dose: '1 comp cada 12 horas · Vía Oral', status: 'Activo', daysLeft: '62 días restantes' },
    { name: 'Atorvastatina 20 mg', dose: '1 comp cada noche · Vía Oral', status: 'Activo', daysLeft: '45 días restantes' },
    { name: 'Ácido Acetilsalicílico 100 mg', dose: '1 comp con almuerzo · Vía Oral', status: 'Activo', daysLeft: '78 días restantes' },
  ]);

  handleDownloadPDF(): void {
    this.toast.show('Generando Expediente PDF', 'Expediente clínico completo de Juan Pérez descargado con éxito.');
  }

  handleEmitRecipe(): void {
    this.toast.show('Receta Médica Digital', 'Módulo de firma I-Med abierto. Código de autorización generado.');
  }

  handleNewConsulta(): void {
    this.toast.show('Nueva Consulta Iniciada', 'Cargando protocolo de atención para Juan Pérez Morales.');
  }
}
