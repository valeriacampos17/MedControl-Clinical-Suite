import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavigationService } from '../../core/services/navigation.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { Patient, NewPatientInput, Prescription, PrescriptionMedication } from '../../core/models/types';
import { ButtonComponent } from '../../shared/button/button.component';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ToastComponent } from '../../shared/toast/toast.component';
import { ClinicalHistoryTimelineComponent } from '../../shared/clinical-history-timeline/clinical-history-timeline.component';
import { inputValue } from '../../core/utils/form.utils';

@Component({
  selector: 'app-patient-history',
  standalone: true,
  imports: [
    FormsModule,
    ButtonComponent,
    BadgeComponent,
    ModalComponent,
    ToastComponent,
    ClinicalHistoryTimelineComponent,
  ],
  template: `
    <div class="flex flex-col w-full">
      <div class="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
        <div class="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-[#86f2e4] opacity-20 blur-3xl pointer-events-none -z-10"></div>
        <div class="absolute top-80 right-0 w-80 h-80 rounded-full bg-[#acedff] opacity-20 blur-3xl pointer-events-none -z-10"></div>

        <div class="flex items-center gap-2.5 flex-wrap mb-4 pb-4 border-b border-[#eceef0]">
          @if (selectedPatient()) {
            <app-button variant="light" size="md" icon="picture_as_pdf" (click)="handleDownloadPDF()" title="Generar y descargar el expediente clínico completo en formato PDF">Descargar Expediente PDF</app-button>
            <app-button variant="light" size="md" icon="prescriptions" (click)="openRecipeModal()" title="Emitir una receta médica electrónica con firma digital">Emitir Receta</app-button>
            <app-button variant="light" size="md" icon="event" (click)="nav.navigate('agenda-y-disponibilidad')" title="Agendar una nueva cita de control para este paciente">Agendar Control</app-button>
            <app-button variant="primary" size="md" icon="add" (click)="handleNewConsulta()" title="Iniciar una nueva consulta médica para este paciente">Nueva Consulta</app-button>
          }
        </div>

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#eceef0]">
          <div class="relative flex-1 max-w-md">
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-[18px] pointer-events-none" aria-hidden="true">search</span>
              <input
                type="text"
                placeholder="Buscar paciente por nombre o RUT..."
                title="Buscar un paciente por nombre o RUT para seleccionarlo en la ficha clínica"
                class="w-full pl-9 pr-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] transition-colors"
                [value]="searchPatientTerm()"
                (input)="onSearchPatient($event)"
                (focus)="showPatientDropdown.set(true)"
                (blur)="onBlurPatient()"
              />
            </div>
            @if (showPatientDropdown() && filteredPatients().length > 0) {
              <div class="absolute z-30 mt-1 w-full bg-white rounded-xl shadow-lg border border-[#e6e8ea] max-h-60 overflow-y-auto">
                @for (p of filteredPatients(); track p.id) {
                  <button
                    type="button"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#f2f4f6] transition-colors first:rounded-t-xl last:rounded-b-xl"
                    [class]="selectedPatient()?.id === p.id ? 'bg-[#f2f4f6]' : ''"
                    (mousedown)="handleSelectPatient(p.id)"
                  >
                    <div class="w-8 h-8 rounded-lg bg-[#006a61] text-white flex items-center justify-center text-[11px] font-bold ring-1 ring-[#eceef0] shrink-0">
                      {{ data.getInitials(p.name) }}
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="text-[13px] font-semibold text-[#191c1e] truncate">{{ p.name }}</span>
                      <span class="text-[11px] text-[#76777d]">CI: {{ p.ci }} · {{ p.age }} años</span>
                    </div>
                    @if (selectedPatient()?.id === p.id) {
                      <span class="material-symbols-outlined text-[#006a61] text-[16px] ml-auto shrink-0">check</span>
                    }
                  </button>
                }
              </div>
            }
            @if (showPatientDropdown() && searchPatientTerm() && filteredPatients().length === 0) {
              <div class="absolute z-30 mt-1 w-full bg-white rounded-xl shadow-lg border border-[#e6e8ea] p-4 text-center">
                <span class="text-[12px] text-[#76777d]">No se encontraron pacientes con "{{ searchPatientTerm() }}"</span>
              </div>
            }
          </div>
          <app-button variant="primary" size="md" icon="person_add" (click)="handleOpenNewPatient()" title="Abrir el formulario para registrar un nuevo paciente en el sistema">
            Nuevo Paciente
          </app-button>
        </div>

        @if (selectedPatient(); as patient) {
        <section class="bg-white rounded-xl shadow-sm border border-[#e6e8ea] p-4 sm:p-6 mb-6 transition-all">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-6">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
              <div class="w-16 h-16 sm:w-20 sm:h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#006a61] text-white flex items-center justify-center text-[22px] sm:text-[28px] font-bold ring-2 ring-[#eceef0] shadow-sm shrink-0">
                {{ data.getInitials(patient.name) }}
              </div>
              <div class="flex flex-col min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-1">
                  <h1 class="text-[18px] sm:text-[22px] lg:text-[24px] font-bold text-[#191c1e] tracking-tight truncate">{{ patient.name }}</h1>
                  <app-badge variant="teal">{{ patient.insurance }}</app-badge>
                  <span class="px-2.5 py-0.5 rounded-full bg-[#f2f4f6] text-[#45464d] text-[11px] font-semibold whitespace-nowrap">Expediente {{ patient.id }}</span>
                </div>
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] sm:text-[13px] text-[#45464d]">
                  <span>{{ patient.age }} años ({{ patient.birthDate }})</span>
                  <span class="hidden sm:inline">•</span>
                  <span>CI: {{ patient.ci }}</span>
                  <span class="hidden sm:inline">•</span>
                  <span>Grupo Sanguíneo: <strong class="text-[#191c1e]">{{ patient.bloodType }}</strong></span>
                </div>
                @if (patient.allergies.length) {
                  <div class="mt-2.5 p-2 sm:p-2.5 rounded-lg bg-[#ffdad6] border border-[#ba1a1a]/30 flex items-center gap-2 text-[#ba1a1a] text-[11.5px] sm:text-[12px] font-semibold flex-wrap">
                    <span class="material-symbols-outlined text-[16px] sm:text-[18px] shrink-0">warning</span>
                    <span>ALERGIAS: {{ patient.allergies.join(' · ') }}</span>
                  </div>
                }
                @if (patient.chronicConditions.length) {
                  <div class="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                    <span class="text-[10.5px] sm:text-[11px] font-bold text-[#76777d] uppercase tracking-wider">Condiciones Crónicas:</span>
                    @for (cond of patient.chronicConditions; track cond) {
                      <span class="px-2 py-0.5 rounded-md bg-[#fffbeb] text-[#92400e] text-[11px] font-semibold border border-[#fde68a]">{{ cond }}</span>
                    }
                  </div>
                }
              </div>
            </div>
            <div class="lg:self-stretch flex flex-col justify-center pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[#eceef0] lg:pl-6 text-[12px] text-[#45464d] gap-2.5 shrink-0 min-w-0 sm:min-w-[260px]">
              <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <span class="material-symbols-outlined text-[#006a61] text-[18px] shrink-0">call</span>
                <span class="text-[#191c1e] font-semibold">{{ patient.phone }}</span>
                <span class="px-1.5 py-0.5 rounded bg-[#86f2e4]/40 text-[#006f66] text-[10px] font-bold whitespace-nowrap">WhatsApp Verificado</span>
              </div>
              <div class="flex items-center gap-2 min-w-0">
                <span class="material-symbols-outlined text-[#76777d] text-[18px] shrink-0">mail</span>
                <span class="truncate">{{ patient.email }}</span>
              </div>
              <div class="flex items-center gap-2 min-w-0">
                <span class="material-symbols-outlined text-[#76777d] text-[18px] shrink-0">home</span>
                <span class="truncate">{{ patient.address }}</span>
              </div>
              <div class="flex items-center gap-2 pt-1 border-t border-[#eceef0]">
                <span class="material-symbols-outlined text-[#006a61] text-[18px] shrink-0">assignment_turned_in</span>
                <span class="text-[#006a61] font-semibold">Consentimiento Informado {{ patient.consentSigned ? 'Firmado' : 'Pendiente' }}</span>
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
              @if (latestConsultation(); as lastConsult) {
                <span class="text-[20px] font-extrabold text-[#191c1e] block truncate">{{ lastConsult.date }}</span>
                <p class="text-[12px] text-[#45464d] font-medium truncate">{{ lastConsult.type }} · {{ lastConsult.doctorName }}</p>
              } @else {
                <span class="text-[18px] font-bold text-[#76777d] block">Sin consultas</span>
                <p class="text-[12px] text-[#76777d]">No registra atenciones</p>
              }
            </div>
            <div class="mt-3 pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[11px] text-[#76777d]">
              <span>{{ latestConsultation()?.diagnosisCode ?? 'CIE-10' }}</span>
              <span class="font-semibold text-[#006a61]">Atención Completada</span>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#e6e8ea] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Total Atenciones</span>
              <span class="w-8 h-8 rounded-lg bg-[#86f2e4]/30 flex items-center justify-center text-[#006f66]">
                <span class="material-symbols-outlined text-[20px]">view_timeline</span>
              </span>
            </div>
            <div class="mt-2">
              <span class="text-[28px] font-extrabold text-[#191c1e] leading-none">{{ patientConsultations().length }}</span>
              <span class="text-[13px] text-[#45464d] font-medium ml-1.5">visitas registradas</span>
            </div>
            <div class="mt-3 pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[11px] text-[#76777d]">
              <span>Historial HCE</span>
              <span class="w-2 h-2 rounded-full bg-[#006a61]"></span>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#e6e8ea] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Signos Vitales (Triaje)</span>
              <span class="w-8 h-8 rounded-lg bg-[#ffdad6]/40 flex items-center justify-center text-[#ba1a1a]">
                <span class="material-symbols-outlined text-[20px]">cardiology</span>
              </span>
            </div>
            <div class="mt-2 flex items-baseline justify-between">
              @if (latestVitals(); as v) {
                <div>
                  <span class="text-[22px] font-extrabold text-[#191c1e]">{{ v.systolic }}/{{ v.diastolic }}</span>
                  <span class="text-[11px] text-[#76777d] ml-1">mmHg</span>
                </div>
                <div class="flex items-center gap-1 text-[#006a61] font-semibold text-[13px]">
                  <span class="material-symbols-outlined text-[16px]">favorite</span>
                  <span>{{ v.pulse }} bpm</span>
                </div>
              } @else {
                <span class="text-[16px] font-semibold text-[#76777d]">Sin registro de triaje</span>
              }
            </div>
            @if (latestVitals(); as v) {
              <div class="mt-2 pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[11px] text-[#76777d]">
                <span>Temp: {{ v.temperature }} °C</span>
                <span>SpO2: {{ v.spo2 }}%</span>
                <span>Peso: {{ v.weight }} kg</span>
              </div>
            } @else {
              <div class="mt-2 pt-2 border-t border-[#f2f4f6] text-[11px] text-[#76777d]">
                Se registrará en nueva consulta
              </div>
            }
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
              <span>{{ activeMedCount() }} fármaco(s) registrado(s)</span>
              <span class="text-[#006a61] font-semibold">Farmacia OK</span>
            </div>
          </div>
        </section>

        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div class="xl:col-span-8 flex flex-col gap-6">
            <app-clinical-history-timeline [patientId]="patient.id" />
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
                @if (patient.allergies.length) {
                  @for (allergy of patient.allergies; track allergy) {
                    <div class="p-2.5 rounded-lg bg-[#ffdad6]/40 border border-[#ba1a1a]/20 flex flex-col gap-1">
                      <span class="text-[12px] font-bold text-[#ba1a1a]">{{ allergy }}</span>
                      <span class="text-[11px] text-[#45464d]">Reacción adversa registrada. Se recomienda precaución.</span>
                    </div>
                  }
                } @else {
                  <div class="p-2.5 rounded-lg bg-[#ecfdf5] border border-[#86efac]/40 flex flex-col gap-1">
                    <span class="text-[12px] font-bold text-[#065f46]">Sin alergias registradas</span>
                    <span class="text-[11px] text-[#45464d]">No se han registrado alergias medicamentosas.</span>
                  </div>
                }
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
                    <p class="text-[12px] text-[#45464d]">{{ patientPrescriptions().length }} prescripción(es) registrada(s)</p>
                  </div>
                </div>
                <app-button variant="outline" size="sm" icon="prescriptions" (click)="openRecipeModal()" title="Emitir una nueva receta médica">Nueva Receta</app-button>
              </div>
              <div class="flex flex-col gap-3">
                @if (patientPrescriptions().length === 0) {
                  <div class="p-4 text-center rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex flex-col items-center gap-1">
                    <span class="material-symbols-outlined text-[24px] text-[#76777d]">medication</span>
                    <span class="text-[12px] text-[#76777d]">Sin recetas prescritas. Pulse "Nueva Receta" para emitir la primera.</span>
                  </div>
                }
                @for (rx of patientPrescriptions(); track rx.id) {
                  <div class="p-3 rounded-lg bg-[#f2f4f6] border border-[#e0e3e5]">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                      <span class="text-[12px] font-bold text-[#006a61]">Receta #{{ rx.id }}</span>
                      <app-badge [variant]="rx.status === 'Finalizada' ? 'neutral' : 'teal'" size="sm">{{ rx.status }}</app-badge>
                    </div>
                    <div class="flex flex-col gap-2 mt-2">
                      @for (med of rx.meds; track med.id) {
                        <div class="p-2 rounded-lg bg-white border border-[#e0e3e5]">
                          <div class="flex items-center justify-between">
                            <span class="text-[13px] font-bold text-[#191c1e]">{{ med.name }}</span>
                            <span class="w-2 h-2 rounded-full bg-[#006a61]"></span>
                          </div>
                          <p class="text-[12px] text-[#45464d] mt-1">{{ med.dose }}</p>
                          <div class="flex items-center justify-between mt-2 pt-2 border-t border-[#e0e3e5] text-[11px]">
                            <span class="text-[#006a61] font-semibold">{{ med.frequency }}</span>
                            <span class="text-[#76777d]">{{ med.duration }}</span>
                          </div>
                        </div>
                      }
                    </div>
                    @if (rx.notes) {
                      <p class="text-[11px] text-[#76777d] mt-2 italic">"{{ rx.notes }}"</p>
                    }
                    <div class="mt-2 pt-2 border-t border-[#e0e3e5] text-[11px] text-[#76777d] flex items-center justify-between">
                      <span>Emitida: {{ rx.date }} {{ rx.time }}</span>
                      <span>{{ rx.doctorName }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
        } @else {
          <div class="bg-white rounded-xl shadow-sm border border-[#e6e8ea] p-8 sm:p-14 text-center flex flex-col items-center">
            <div class="w-16 h-16 rounded-2xl bg-[#006a61]/10 text-[#006a61] flex items-center justify-center mb-4 ring-8 ring-[#006a61]/5">
              <span class="material-symbols-outlined text-[32px]">person_search</span>
            </div>
            <h2 class="text-[20px] font-bold text-[#191c1e]">Selecciona un Paciente</h2>
            <p class="text-[13px] text-[#45464d] mt-1.5 max-w-md leading-relaxed">
              Usa el buscador para consultar la Ficha Clínica Electrónica, Triaje y atenciones anteriores del paciente.
            </p>

            <div class="mt-6 w-full max-w-lg flex flex-col items-center gap-3">
              <span class="text-[11px] font-bold text-[#76777d] uppercase tracking-wider">Acceso rápido a pacientes de demostración:</span>
              <div class="flex flex-wrap items-center justify-center gap-2">
                @for (demoP of data.patients().slice(0, 5); track demoP.id) {
                  <button
                    type="button"
                    (click)="handleSelectPatient(demoP.id)"
                    class="px-3.5 py-2 rounded-xl bg-[#f2f4f6] hover:bg-[#006a61] text-[#191c1e] hover:text-white text-[12.5px] font-semibold border border-[#e0e3e5] transition-all flex items-center gap-2 shadow-xs group"
                  >
                    <div class="w-6 h-6 rounded-full bg-[#006a61] text-white group-hover:bg-white group-hover:text-[#006a61] flex items-center justify-center text-[10px] font-bold">
                      {{ data.getInitials(demoP.name) }}
                    </div>
                    <span>{{ demoP.name }}</span>
                  </button>
                }
              </div>
            </div>

            <div class="mt-8 pt-6 border-t border-[#eceef0] flex items-center gap-3">
              <span class="text-[12px] text-[#76777d]">¿No encuentra al paciente?</span>
              <app-button variant="outline" size="sm" icon="person_add" (click)="handleOpenNewPatient()" title="Abrir el formulario para registrar un nuevo paciente">
                Registrar Nuevo Paciente
              </app-button>
            </div>
          </div>
        }
      </div>
      <app-modal
        [isOpen]="showNewPatientModal()"
        title="Registrar Nuevo Paciente"
        subtitle="Complete los datos del paciente. El resto de la ficha clínica se carga con datos de demostración."
        icon="person_add"
        [footerTemplate]="true"
        (dismiss)="closeNewPatientModal()"
      >
        <form class="flex flex-col gap-4" (ngSubmit)="handleCreatePatient()" #newPatientFormElement="ngForm">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="flex flex-col gap-1.5 sm:col-span-2">
              <span class="text-[12px] font-bold text-[#191c1e]">Nombre Completo *</span>
              <input
                type="text"
                name="name"
                required
                placeholder="Ej: Carlos Soto Riquelme"
                class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                (input)="setField('name', $event)"
                [value]="newPatientForm().name"
              />
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">RUT *</span>
              <input
                type="text"
                name="rut"
                required
                placeholder="Ej: 12.345.678-9"
                class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                (input)="setField('rut', $event)"
                [value]="newPatientForm().rut"
              />
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Edad (años)</span>
              <input
                type="number"
                name="age"
                min="0"
                max="120"
                placeholder="Ej: 45"
                class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                (input)="setField('age', $event)"
                [value]="newPatientForm().age"
              />
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Teléfono</span>
              <input
                type="tel"
                name="phone"
                placeholder="+56 9 ..."
                class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                (input)="setField('phone', $event)"
                [value]="newPatientForm().phone"
              />
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Email</span>
              <input
                type="email"
                name="email"
                placeholder="paciente@correo.cl"
                class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                (input)="setField('email', $event)"
                [value]="newPatientForm().email"
              />
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Previsión</span>
              <input
                type="text"
                name="insurance"
                placeholder="Ej: Isapre Colmena Golden"
                class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                (input)="setField('insurance', $event)"
                [value]="newPatientForm().insurance"
              />
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Grupo Sanguíneo</span>
              <select
                name="bloodType"
                class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                (change)="setField('bloodType', $event)"
                [value]="newPatientForm().bloodType"
              >
                <option value="">Seleccionar…</option>
                <option value="O Rh(+)">O Rh(+)</option>
                <option value="O Rh(-)">O Rh(-)</option>
                <option value="A Rh(+)">A Rh(+)</option>
                <option value="A Rh(-)">A Rh(-)</option>
                <option value="B Rh(+)">B Rh(+)</option>
                <option value="B Rh(-)">B Rh(-)</option>
                <option value="AB Rh(+)">AB Rh(+)</option>
                <option value="AB Rh(-)">AB Rh(-)</option>
              </select>
            </label>

            <label class="flex flex-col gap-1.5 sm:col-span-2">
              <span class="text-[12px] font-bold text-[#191c1e]">Alergias (separadas por coma)</span>
              <input
                type="text"
                name="allergies"
                placeholder="Ej: Penicilina, Ibuprofeno"
                class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                (input)="setField('allergies', $event)"
                [value]="newPatientForm().allergies"
              />
            </label>
          </div>
          <div class="flex gap-2 pt-1 text-[11.5px] text-[#76777d] leading-relaxed">
            <span class="material-symbols-outlined text-[16px] shrink-0 mt-0.5">info</span>
            <span>Los datos clínicos (consentimiento, condiciones crónicas y medicamentos) se precargan con la ficha de demostración hasta que se agregue información real.</span>
          </div>
        </form>
        <div modal-footer>
          <app-button variant="light" size="md" (click)="closeNewPatientModal()">Cancelar</app-button>
          <app-button
            variant="primary"
            size="md"
            type="submit"
            icon="person_add"
            (click)="handleCreatePatient()"
          >
            Registrar Paciente
          </app-button>
        </div>
      </app-modal>
      <app-modal
        [isOpen]="showRecipeModal()"
        title="Emitir Receta Médica"
        subtitle="Registre los medicamentos a prescribir al paciente"
        icon="prescriptions"
        [footerTemplate]="true"
        (dismiss)="closeRecipeModal()"
      >
        <div class="flex flex-col gap-4">
          @if (selectedPatient(); as patient) {
            <div class="p-3 rounded-lg bg-[#f2f4f6] border border-[#e0e3e5] flex items-center gap-2 text-[12.5px]">
              <span class="material-symbols-outlined text-[#006a61] text-[18px] shrink-0">person</span>
              <span class="min-w-0">Prescribiendo a: <strong class="text-[#191c1e]">{{ patient.name }}</strong></span>
              <span class="ml-auto px-2 py-0.5 rounded bg-white border border-[#e0e3e5] text-[10.5px] font-semibold text-[#45464d] whitespace-nowrap">CI: {{ patient.ci }}</span>
            </div>
          }

          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-[#191c1e] uppercase tracking-wider">Medicamentos</span>
            <app-button variant="outline" size="sm" icon="add" (click)="addMedicationRow()">Agregar Medicamento</app-button>
          </div>

          <div class="flex flex-col gap-3">
            @for (med of recipeMeds(); track med.id; let mIndex = $index) {
              <div class="p-3 rounded-xl border border-[#e0e3e5] bg-white flex flex-col gap-2.5">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-lg bg-[#006a61]/10 text-[#006a61] flex items-center justify-center text-[11px] font-bold shrink-0">{{ mIndex + 1 }}</span>
                  <input
                    type="text"
                    list="medication-suggestions"
                    placeholder="Nombre del medicamento *"
                    title="Busque o escriba el nombre del medicamento"
                    class="flex-1 px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                    [value]="med.name"
                    (input)="updateMedicationField(mIndex, 'name', $event)"
                  />
                  <button
                    type="button"
                    class="shrink-0 w-7 h-7 rounded-lg bg-[#ffdad6]/60 text-[#ba1a1a] flex items-center justify-center hover:bg-[#ffdad6] transition-colors"
                    [disabled]="recipeMeds().length === 1"
                    [class]="recipeMeds().length === 1 ? 'opacity-40 pointer-events-none' : ''"
                    (click)="removeMedicationRow(mIndex)"
                    title="Quitar medicamento"
                  >
                    <span class="material-symbols-outlined text-[15px]">close</span>
                  </button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label class="flex flex-col">
                    <span class="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Dosis / Presentación</span>
                    <input type="text" placeholder="Ej: 50 mg en comprimidos" class="px-2.5 py-1.5 rounded-lg border border-[#d7d9dc] bg-white text-[12px] text-[#191c1e] focus:outline-none focus:ring-1 focus:ring-[#006a61]" [value]="med.dose" (input)="updateMedicationField(mIndex, 'dose', $event)" />
                  </label>
                  <label class="flex flex-col">
                    <span class="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Frecuencia</span>
                    <input type="text" placeholder="Ej: cada 12 horas" class="px-2.5 py-1.5 rounded-lg border border-[#d7d9dc] bg-white text-[12px] text-[#191c1e] focus:outline-none focus:ring-1 focus:ring-[#006a61]" [value]="med.frequency" (input)="updateMedicationField(mIndex, 'frequency', $event)" />
                  </label>
                  <label class="flex flex-col">
                    <span class="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Duración</span>
                    <input type="text" placeholder="Ej: 30 días / 90 días" class="px-2.5 py-1.5 rounded-lg border border-[#d7d9dc] bg-white text-[12px] text-[#191c1e] focus:outline-none focus:ring-1 focus:ring-[#006a61]" [value]="med.duration" (input)="updateMedicationField(mIndex, 'duration', $event)" />
                  </label>
                </div>
              </div>
            }
            @empty {
              <p class="text-center text-[12px] text-[#76777d] py-4">Sin medicamentos. Agregue al menos uno.</p>
            }
          </div>

          <datalist id="medication-suggestions">
            @for (med of medicationCatalog(); track med) {
              <option [value]="med"></option>
            }
          </datalist>

          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Indicaciones Generales</span>
            <textarea rows="2" placeholder="Ej: Tomar con alimentos, evitar alcohol..." class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] resize-none" [value]="recipeNotes()" (input)="recipeNotes.set(($any($event.target)).value)"></textarea>
          </label>
        </div>
        <div modal-footer>
          <app-button variant="light" size="md" (click)="closeRecipeModal()">Cancelar</app-button>
          <app-button variant="primary" size="md" icon="check" (click)="saveRecipe()">Guardar Receta</app-button>
        </div>
      </app-modal>
      <app-toast />
    </div>
  `,
})
export class PatientHistoryComponent {
  nav = inject(NavigationService);
  private router = inject(Router);
  data = inject(MockDataService);
  toast = inject(ToastService);

  selectedPatient = signal<Patient | null>(null);

  readonly patientPrescriptions = computed(() => {
    const patient = this.selectedPatient();
    if (!patient) return [];
    return this.data.getPrescriptionsByPatient(patient.id);
  });

  readonly activeMedCount = computed(() =>
    this.patientPrescriptions().reduce((acc, rx) => acc + rx.meds.length, 0)
  );

  readonly medicationCatalog = computed(() => this.data.medicationCatalog());

  readonly showNewPatientModal = signal(false);
  readonly showRecipeModal = signal(false);
  readonly recipeMeds = signal<PrescriptionMedication[]>([
    { id: 'med-' + Date.now(), name: '', dose: '', frequency: '', duration: '' },
  ]);
  readonly recipeNotes = signal('');
  readonly searchPatientTerm = signal('');
  readonly showPatientDropdown = signal(false);

  readonly patientConsultations = computed(() => {
    const patient = this.selectedPatient();
    if (!patient) return [];
    return this.data.getConsultationsByPatient(patient.id);
  });

  readonly latestConsultation = computed(() => {
    const consults = this.patientConsultations();
    return consults.length > 0 ? consults[0] : null;
  });

  readonly latestVitals = computed(() => {
    const consult = this.latestConsultation();
    return consult?.vitals ?? null;
  });

  readonly filteredPatients = computed(() => {
    const term = this.searchPatientTerm().toLowerCase().trim();
    if (!term) return this.data.patients();
    return this.data.patients().filter(
      (p) => p.name.toLowerCase().includes(term) || p.ci.toLowerCase().includes(term)
    );
  });

  newPatientForm = signal({
    name: '',
    rut: '',
    age: '',
    birthDate: '',
    phone: '',
    email: '',
    insurance: '',
    bloodType: '',
    allergies: '',
  });

  readonly avatarPreview = computed(() => {
    const name = this.newPatientForm().name.trim();
    if (!name) return '';
    const parts = name.split(/\s+/).filter(Boolean);
    const initials = parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : (parts[0]![0] ?? '');
    return initials.toUpperCase();
  });

  setField(field: keyof NewPatientInput, event: Event): void {
    const value = inputValue(event);
    this.newPatientForm.update((f) => ({ ...f, [field]: value }));
  }

  handleSelectPatient(id: string): void {
    const patient = this.data.getPatient(id);
    if (!patient) return;
    this.data.selectPatient(id);
    this.selectedPatient.set(patient);
    this.searchPatientTerm.set('');
    this.showPatientDropdown.set(false);
    this.nav.setBreadcrumb([
      { label: 'Pacientes', route: 'pacientes-y-historial-clinico' },
      { label: 'Ficha Clínica Electrónica' },
      { label: `HCE-${patient.id}` },
    ]);
  }

  onSearchPatient(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchPatientTerm.set(value);
    this.showPatientDropdown.set(true);
  }

  onBlurPatient(): void {
    setTimeout(() => this.showPatientDropdown.set(false), 150);
  }

  handleOpenNewPatient(): void {
    this.showNewPatientModal.set(true);
  }

  closeNewPatientModal(): void {
    this.showNewPatientModal.set(false);
  }

  handleCreatePatient(): void {
    const f = this.newPatientForm();
    const name = f.name.trim();
    if (!name) {
      this.toast.show('Faltan Datos', 'Ingrese al menos el nombre completo del paciente.');
      return;
    }
    const fileNumber = this.data.nextFileNumber();
    const age = Number(f.age) || 0;
    const patient: Patient = {
      id: 'MED-' + fileNumber,
      ci: f.rut.trim() || 'Registrado sin CI',
      name,
      age,
      birthDate: f.birthDate.trim() || (age ? `Edad registrada: ${age} años` : 'Sin fecha registrada'),
      phone: f.phone.trim() || '+58 000-0000000',
      email: f.email.trim() || 'sin@email.com',
      address: 'Sin dirección registrada',
      insurance: f.insurance.trim() || 'Sin previsión',
      bloodType: f.bloodType || 'Sin especificar',
      allergies: f.allergies.split(',').map((a) => a.trim()).filter(Boolean),
      chronicConditions: [],
      consentSigned: false,
    };
    this.data.addPatient(patient);
    this.selectedPatient.set(patient);
    this.closeNewPatientModal();
    this.newPatientForm.set({ name: '', rut: '', age: '', birthDate: '', phone: '', email: '', insurance: '', bloodType: '', allergies: '' });
    this.toast.show('Paciente Registrado', `${patient.name} fue agregado y seleccionado en la ficha.`);
  }

  handleDownloadPDF(): void {
    this.toast.show('Generando Expediente PDF', `Expediente clínico completo de ${this.selectedPatient()?.name} descargado con éxito.`);
  }

  openRecipeModal(): void {
    this.recipeMeds.set([{ id: 'med-' + Date.now(), name: '', dose: '', frequency: '', duration: '' }]);
    this.recipeNotes.set('');
    this.showRecipeModal.set(true);
  }

  closeRecipeModal(): void {
    this.showRecipeModal.set(false);
  }

  addMedicationRow(): void {
    this.recipeMeds.update((meds) => [
      ...meds,
      { id: 'med-' + Date.now() + '-' + meds.length, name: '', dose: '', frequency: '', duration: '' },
    ]);
  }

  removeMedicationRow(index: number): void {
    if (this.recipeMeds().length <= 1) return;
    this.recipeMeds.update((meds) => meds.filter((_, i) => i !== index));
  }

  updateMedicationField(index: number, field: 'name' | 'dose' | 'frequency' | 'duration', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.recipeMeds.update((meds) => meds.map((med, i) => (i === index ? { ...med, [field]: value } : med)));
  }

  saveRecipe(): void {
    const patient = this.selectedPatient();
    if (!patient) return;
    const meds = this.recipeMeds().filter((m) => m.name.trim() !== '');
    if (meds.length === 0) {
      this.toast.show('Faltan Datos', 'Agregue al menos un medicamento con su nombre para emitir la receta.');
      return;
    }
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const prescription: Prescription = {
      id: 'RX-' + Date.now(),
      patientId: patient.id,
      patientName: patient.name,
      ci: patient.ci,
      doctorName: this.data.doctor.name,
      date: `${day}/${month}/${year}`,
      time: now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      meds: meds.map((m) => ({ ...m })),
      notes: this.recipeNotes(),
      status: 'Emitida Hoy',
    };
    this.data.addPrescription(prescription);
    this.closeRecipeModal();
    this.toast.show('Receta Emitida', `Receta ${prescription.id} registrada para ${prescription.patientName} con ${meds.length} medicamento${meds.length > 1 ? 's' : ''}.`);
  }

  handleEmitRecipe(): void {
    this.openRecipeModal();
  }

  handleNewConsulta(): void {
    const patient = this.selectedPatient();
    if (patient) {
      this.data.selectPatient(patient.id);
      this.router.navigate(['nueva-consulta']);
    }
  }
}
