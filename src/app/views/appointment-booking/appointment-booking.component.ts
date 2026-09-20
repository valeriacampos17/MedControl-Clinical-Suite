import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationService } from '../../core/services/navigation.service';
import { MockDataService, DoctorSummary } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { Patient, NewPatientInput } from '../../core/models/types';
import { ButtonComponent } from '../../shared/button/button.component';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ToastComponent } from '../../shared/toast/toast.component';
import { inputValue } from '../../core/utils/form.utils';

@Component({
  selector: 'app-appointment-booking',
  standalone: true,
  imports: [FormsModule, ButtonComponent, BadgeComponent, ModalComponent, ToastComponent],
  template: `
    <div class="flex flex-col w-full">
      <div class="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
        <!-- Background decorative ambient blur -->
        <div class="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-[#86f2e4] opacity-20 blur-3xl pointer-events-none -z-10"></div>
        <div class="absolute top-80 right-0 w-80 h-80 rounded-full bg-[#acedff] opacity-20 blur-3xl pointer-events-none -z-10"></div>

        <!-- Header section -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#eceef0]">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-[20px] sm:text-[22px] font-bold text-[#191c1e] tracking-tight">Programación de Turno Clínico</h1>
              <app-badge variant="teal" size="sm">Modo Admisión / Asistente Clínico</app-badge>
            </div>
            <p class="text-[13px] text-[#45464d] mt-1">Agendamiento en tiempo real con validación biomédica y bono electrónico integrado</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Left Main Form Column -->
          <div class="lg:col-span-7 flex flex-col gap-6">

            <!-- Step 1: Patient Search & Selection (Unified with Patient History module) -->
            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center justify-between pb-3 mb-4 border-b border-[#eceef0]">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-full bg-[#006a61] text-white flex items-center justify-center text-[13px] font-bold">1</span>
                  <h2 class="text-[15px] font-bold text-[#191c1e]">Búsqueda & Identificación del Paciente</h2>
                </div>
                @if (selectedPatient()) {
                  <app-badge variant="success" size="sm" icon="check_circle">Paciente Seleccionado</app-badge>
                } @else {
                  <app-badge variant="warning" size="sm" icon="pending">Pendiente de Selección</app-badge>
                }
              </div>

              <!-- Search Bar and Add Patient Button (Identical pattern to Patient module) -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div class="relative flex-1">
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-[18px] pointer-events-none" aria-hidden="true">search</span>
                    <input
                      type="text"
                      placeholder="Buscar paciente por nombre o RUT..."
                      title="Buscar un paciente por nombre o RUT para seleccionarlo en el agendamiento"
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

                <app-button
                  variant="primary"
                  size="md"
                  icon="person_add"
                  (click)="showNewPatientModal.set(true)"
                  title="Abrir el formulario para registrar un nuevo paciente en el sistema"
                  class="shrink-0"
                >
                  Nuevo Paciente
                </app-button>
              </div>

              <!-- Selected Patient Display Card -->
              @if (selectedPatient(); as patient) {
                <div class="p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-3.5 min-w-0">
                      <div class="w-12 h-12 rounded-xl bg-[#006a61] text-white flex items-center justify-center text-[16px] font-bold shrink-0 shadow-xs ring-2 ring-[#006a61]/20">
                        {{ data.getInitials(patient.name) }}
                      </div>
                      <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-[15px] font-bold text-[#191c1e] truncate">{{ patient.name }}</span>
                          <app-badge variant="teal">{{ patient.insurance }}</app-badge>
                        </div>
                        <p class="text-[12px] text-[#45464d] mt-0.5 truncate">
                          CI/RUT: <strong class="text-[#191c1e]">{{ patient.ci }}</strong> · {{ patient.age }} años · Expediente: {{ patient.id }}
                        </p>
                        <p class="text-[11px] text-[#76777d] mt-0.5 flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-[14px]">phone</span>
                          <span>{{ patient.phone }}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="p-6 text-center rounded-xl bg-[#f8fafc] border border-dashed border-[#c6c6cd]">
                  <span class="material-symbols-outlined text-[32px] text-[#76777d] mb-1">person_search</span>
                  <p class="text-[13px] font-semibold text-[#191c1e]">Ningún paciente seleccionado</p>
                  <p class="text-[12px] text-[#76777d] mt-0.5">Use el buscador superior o cree un nuevo paciente para continuar</p>
                </div>
              }
            </div>

            <!-- Step 2: Doctor & Specialty Selection -->
            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center justify-between pb-3 mb-4 border-b border-[#eceef0]">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-full bg-[#006a61] text-white flex items-center justify-center text-[13px] font-bold">2</span>
                  <h2 class="text-[15px] font-bold text-[#191c1e]">Especialidad & Asignación Médica</h2>
                </div>
                <app-badge variant="teal" size="sm" icon="medical_services">Médico Asignado</app-badge>
              </div>

              <!-- Doctor Selection Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                @for (doc of data.doctors(); track doc.id) {
                  <div
                    (click)="selectedDoctorId.set(doc.id)"
                    class="p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3"
                    [class]="selectedDoctorId() === doc.id
                      ? 'border-2 border-[#006a61] bg-[#006a61]/5 shadow-xs ring-2 ring-[#006a61]/10'
                      : 'border-[#e0e3e5] bg-[#f8fafc] hover:bg-[#e6e8ea]'"
                  >
                    <img [src]="doc.avatarUrl" [alt]="doc.name" class="w-10 h-10 rounded-full object-cover ring-2 ring-[#006a61]/20 shrink-0" />
                    <div class="min-w-0 flex-1">
                      <p class="text-[12.5px] font-bold text-[#191c1e] truncate">{{ doc.shortName }}</p>
                      <p class="text-[10.5px] text-[#45464d] truncate">{{ doc.specialty }}</p>
                    </div>
                    @if (selectedDoctorId() === doc.id) {
                      <span class="material-symbols-outlined text-[18px] text-[#006a61] shrink-0">check_circle</span>
                    }
                  </div>
                }
              </div>

              <!-- Active Doctor Summary Banner -->
              <div class="mt-4 p-3.5 rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <img [src]="selectedDoctor().avatarUrl" [alt]="selectedDoctor().name" class="w-11 h-11 rounded-full object-cover ring-2 ring-[#006a61]" />
                  <div>
                    <p class="text-[13px] font-bold text-[#191c1e]">{{ selectedDoctor().name }}</p>
                    <p class="text-[11px] text-[#45464d]">Especialista en {{ selectedDoctor().specialty }} · Box #4 de Consulta Externa</p>
                  </div>
                </div>
                <app-badge variant="teal" size="sm" icon="event_available">Atendiendo Hoy</app-badge>
              </div>
            </div>

            <!-- Step 3: Date & Slot Availability -->
            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center justify-between pb-3 mb-4 border-b border-[#eceef0]">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-full bg-[#006a61] text-white flex items-center justify-center text-[13px] font-bold">3</span>
                  <h2 class="text-[15px] font-bold text-[#191c1e]">Fecha & Bloque de Disponibilidad</h2>
                </div>
                <span class="text-[12px] font-bold text-[#006a61]">Octubre - Noviembre 2024</span>
              </div>

              <!-- Days Selector -->
              <div class="mb-4">
                <label class="text-[11px] font-bold text-[#76777d] uppercase tracking-wider block mb-2">Seleccione Día de Atención:</label>
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  @for (dayObj of availableDays; track dayObj.day) {
                    <button
                      type="button"
                      (click)="selectedDay.set(dayObj.day); selectedDayLabel.set(dayObj.label)"
                      class="p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between"
                      [class]="selectedDay() === dayObj.day
                        ? 'border-2 border-[#006a61] bg-[#006a61] text-white shadow-xs'
                        : 'border-[#e0e3e5] bg-[#f8fafc] text-[#191c1e] hover:border-[#006a61]'"
                    >
                      <span class="text-[10px] font-bold uppercase opacity-80">{{ dayObj.weekday }}</span>
                      <div class="flex items-baseline justify-between mt-1">
                        <span class="text-[16px] font-extrabold">{{ dayObj.day }}</span>
                        <span class="text-[10px] font-semibold">{{ dayObj.month }}</span>
                      </div>
                    </button>
                  }
                </div>
              </div>

              <!-- Time Slots Grid -->
              <div>
                <label class="text-[11px] font-bold text-[#76777d] uppercase tracking-wider block mb-2">Horarios Disponibles (Mañana & Tarde):</label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  @for (slot of timeSlots; track slot.time) {
                    <button
                      type="button"
                      [disabled]="!slot.available"
                      (click)="selectedTime.set(slot.time)"
                      class="p-2.5 rounded-xl border text-center transition-all flex items-center justify-between px-3"
                      [class]="selectedTime() === slot.time
                        ? 'border-2 border-[#006a61] bg-[#006a61]/10 text-[#006a61] font-bold shadow-2xs'
                        : slot.available
                          ? 'border-[#e0e3e5] bg-white hover:border-[#006a61] text-[#191c1e] font-semibold'
                          : 'border-[#e0e3e5] bg-[#f2f4f6] text-[#76777d] cursor-not-allowed opacity-60 line-through'"
                    >
                      <span class="text-[12px]">{{ slot.time }}</span>
                      @if (selectedTime() === slot.time) {
                        <span class="material-symbols-outlined text-[16px] text-[#006a61]">check_circle</span>
                      } @else if (!slot.available) {
                        <span class="text-[9px] uppercase font-bold text-[#76777d]">Ocupado</span>
                      }
                    </button>
                  }
                </div>
              </div>
            </div>

            <!-- Step 4: Type of Consultation -->
            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#eceef0]">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-full bg-[#006a61] text-white flex items-center justify-center text-[13px] font-bold">4</span>
                  <h2 class="text-[15px] font-bold text-[#191c1e]">Tipo de Consulta & Duración del Bloque</h2>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                @for (item of consultationTypes; track item.id) {
                  <div
                    (click)="consultationType.set(item.id)"
                    class="p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between"
                    [class]="consultationType() === item.id
                      ? 'border-2 border-[#006a61] bg-[#006a61]/5 shadow-xs'
                      : 'border-[#e0e3e5] bg-[#f8fafc] hover:bg-[#e6e8ea]'"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="flex items-center gap-1.5">
                          <span class="text-[13px] font-bold text-[#191c1e]">{{ item.title }}</span>
                          @if (item.suggested) {
                            <span class="px-1.5 py-0.2 rounded bg-[#006a61] text-white text-[9px] font-bold">Sugerido</span>
                          }
                        </div>
                        <p class="text-[11px] text-[#45464d] mt-0.5">{{ item.note }}</p>
                      </div>
                    </div>
                    <div class="flex items-center justify-between mt-3 pt-2 border-t border-[#e0e3e5] text-[11px]">
                      <span class="font-semibold text-[#006a61]">{{ item.mins }}</span>
                      <span class="text-[#76777d]">{{ item.price }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>

          </div>

          <!-- Right Summary & Confirmation Column -->
          <div class="lg:col-span-5 flex flex-col gap-6 sticky top-6">
            <!-- Countdown Banner -->
            <div class="bg-[#ffdad6]/40 border border-[#ba1a1a]/30 rounded-xl p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-[#ba1a1a]">
                  <span class="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  <span class="text-[13px] font-bold">Bloqueo Atómico de Reserva</span>
                </div>
                <span class="font-mono text-[14px] font-extrabold text-[#ba1a1a] bg-white px-2 py-0.5 rounded border border-[#ba1a1a]/30 shadow-xs">
                  {{ formatCountdown() }}
                </span>
              </div>
            </div>

            <!-- Booking Summary Card -->
            <div class="bg-white rounded-xl p-5 shadow-lg border-2 border-[#006a61] relative">
              <div class="flex items-center justify-between pb-3 mb-4 border-b border-[#eceef0]">
                <h3 class="text-[15px] font-bold text-[#191c1e]">Resumen de Agendamiento</h3>
                <span class="w-2.5 h-2.5 rounded-full bg-[#006a61] animate-pulse"></span>
              </div>

              <div class="flex flex-col gap-3 text-[12.5px] text-[#45464d] mb-5">
                <div class="flex items-start justify-between pb-2 border-b border-[#eceef0]">
                  <span class="text-[#76777d]">Paciente:</span>
                  <div class="text-right">
                    @if (selectedPatient()) {
                      <p class="font-bold text-[#191c1e]">{{ selectedPatient()!.name }}</p>
                      <p class="text-[11px] text-[#76777d]">CI: {{ selectedPatient()!.ci }}</p>
                    } @else {
                      <span class="text-[#ba1a1a] font-semibold">Sin seleccionar</span>
                    }
                  </div>
                </div>

                <div class="flex items-start justify-between pb-2 border-b border-[#eceef0]">
                  <span class="text-[#76777d]">Médico Tratante:</span>
                  <div class="text-right">
                    <p class="font-bold text-[#191c1e]">{{ selectedDoctor().name }}</p>
                    <p class="text-[11px] text-[#006a61] font-medium">{{ selectedDoctor().specialty }}</p>
                  </div>
                </div>

                <div class="flex items-center justify-between pb-2 border-b border-[#eceef0]">
                  <span class="text-[#76777d]">Fecha de Cita:</span>
                  <span class="font-bold text-[#191c1e]">{{ selectedDayLabel() }}</span>
                </div>

                <div class="flex items-center justify-between pb-2 border-b border-[#eceef0]">
                  <span class="text-[#76777d]">Bloque de Horario:</span>
                  <span class="font-bold text-[#006a61] bg-[#006a61]/10 px-2 py-0.5 rounded">{{ selectedTime() }}</span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-[#76777d]">Tipo de Atención:</span>
                  <span class="font-semibold text-[#191c1e]">{{ selectedConsultationType().title }}</span>
                </div>
              </div>

              <app-button
                variant="primary"
                size="lg"
                icon="check_circle"
                [fullWidth]="true"
                [disabled]="!selectedPatient()"
                (click)="showConfirmModal.set(true)"
              >
                Confirmar y Agendar Cita
              </app-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Registrar Nuevo Paciente -->
      <app-modal
        [isOpen]="showNewPatientModal()"
        title="Registrar Nuevo Paciente"
        subtitle="Complete la información del paciente para añadirlo y agendar su cita"
        icon="person_add"
        [footerTemplate]="true"
        (dismiss)="showNewPatientModal.set(false)"
      >
        <div class="space-y-4 text-[13px]">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label class="flex flex-col gap-1">
              <span class="font-semibold text-[#191c1e]">Nombre Completo *</span>
              <input
                type="text"
                placeholder="Ej. Carlos Mendoza"
                class="px-3 py-2 rounded-lg border border-[#d7d9dc] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                [value]="newPatientForm().name"
                (input)="setField('name', $event)"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-semibold text-[#191c1e]">RUT / CI</span>
              <input
                type="text"
                placeholder="Ej. 12.345.678-9"
                class="px-3 py-2 rounded-lg border border-[#d7d9dc] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                [value]="newPatientForm().rut"
                (input)="setField('rut', $event)"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-semibold text-[#191c1e]">Edad</span>
              <input
                type="number"
                placeholder="Ej. 35"
                class="px-3 py-2 rounded-lg border border-[#d7d9dc] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                [value]="newPatientForm().age"
                (input)="setField('age', $event)"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-semibold text-[#191c1e]">Teléfono</span>
              <input
                type="text"
                placeholder="Ej. +56 9 1234 5678"
                class="px-3 py-2 rounded-lg border border-[#d7d9dc] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                [value]="newPatientForm().phone"
                (input)="setField('phone', $event)"
              />
            </label>
            <label class="flex flex-col gap-1 sm:col-span-2">
              <span class="font-semibold text-[#191c1e]">Previsión / Seguro</span>
              <input
                type="text"
                placeholder="Ej. Fonasa Tramo B / Isapre Banmédica"
                class="px-3 py-2 rounded-lg border border-[#d7d9dc] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                [value]="newPatientForm().insurance"
                (input)="setField('insurance', $event)"
              />
            </label>
          </div>
        </div>
        <div modal-footer class="flex items-center justify-end gap-2.5">
          <app-button variant="light" (click)="showNewPatientModal.set(false)">Cancelar</app-button>
          <app-button variant="primary" icon="check" (click)="handleCreatePatient()">Guardar y Seleccionar</app-button>
        </div>
      </app-modal>

      <!-- Modal de Confirmar Cita -->
      <app-modal
        [isOpen]="showConfirmModal()"
        title="Confirmar Cita Médica"
        subtitle="Verifique los detalles antes de emitir la reserva electrónica"
        icon="event_available"
        [footerTemplate]="true"
        (dismiss)="showConfirmModal.set(false)"
      >
        <div class="space-y-3 text-[13px]">
          <p class="text-[#45464d]">Se reservará un bloque de atención clínica electrónica para:</p>
          <div class="p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] space-y-2">
            <div class="flex justify-between border-b pb-1.5 border-[#e0e3e5]">
              <span class="text-[#76777d]">Paciente:</span>
              <strong class="text-[#191c1e]">{{ selectedPatient()?.name }}</strong>
            </div>
            <div class="flex justify-between border-b pb-1.5 border-[#e0e3e5]">
              <span class="text-[#76777d]">Médico:</span>
              <span class="text-[#191c1e] font-semibold">{{ selectedDoctor().name }} ({{ selectedDoctor().specialty }})</span>
            </div>
            <div class="flex justify-between border-b pb-1.5 border-[#e0e3e5]">
              <span class="text-[#76777d]">Fecha:</span>
              <span class="text-[#006a61] font-bold">{{ selectedDayLabel() }}</span>
            </div>
            <div class="flex justify-between border-b pb-1.5 border-[#e0e3e5]">
              <span class="text-[#76777d]">Hora:</span>
              <span class="text-[#006a61] font-bold">{{ selectedTime() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#76777d]">Modalidad:</span>
              <span class="text-[#191c1e] font-medium">{{ selectedConsultationType().title }} ({{ selectedConsultationType().mins }})</span>
            </div>
          </div>
        </div>
        <div modal-footer class="flex items-center justify-end gap-2.5">
          <app-button variant="light" (click)="showConfirmModal.set(false)">Cancelar</app-button>
          <app-button variant="primary" icon="check" (click)="handleConfirmBooking()">Confirmar Definitivamente</app-button>
        </div>
      </app-modal>

      <app-toast />
    </div>
  `,
})
export class AppointmentBookingComponent implements OnInit, OnDestroy {
  nav = inject(NavigationService);
  data = inject(MockDataService);
  toast = inject(ToastService);

  timeLeft = signal(582);

  // Patient Search & Selection Signals (matching PatientHistoryComponent)
  selectedPatient = signal<Patient | null>(this.data.patients()[0]);
  searchPatientTerm = signal('');
  showPatientDropdown = signal(false);
  showNewPatientModal = signal(false);

  newPatientForm = signal({
    name: '',
    rut: '',
    age: '',
    phone: '',
    insurance: '',
  });

  filteredPatients = computed(() => {
    const term = this.searchPatientTerm().toLowerCase().trim();
    if (!term) return this.data.patients();
    return this.data.patients().filter(
      p => p.name.toLowerCase().includes(term) || p.ci.toLowerCase().includes(term)
    );
  });

  // Doctor Selection Signals
  selectedDoctorId = signal<string>('doc-aguirre');

  selectedDoctor = computed<DoctorSummary>(() => {
    const id = this.selectedDoctorId();
    return this.data.doctors().find(d => d.id === id) || this.data.doctors()[0];
  });

  // Date & Time Signals
  selectedDay = signal(28);
  selectedDayLabel = signal('Lunes 28 Octubre 2024');
  selectedTime = signal('10:00 AM');

  availableDays = [
    { day: 28, weekday: 'Lun', month: '28 Oct', label: 'Lunes 28 Octubre 2024' },
    { day: 29, weekday: 'Mar', month: '29 Oct', label: 'Martes 29 Octubre 2024' },
    { day: 30, weekday: 'Mié', month: '30 Oct', label: 'Miércoles 30 Octubre 2024' },
    { day: 31, weekday: 'Jue', month: '31 Oct', label: 'Jueves 31 Octubre 2024' },
    { day: 1, weekday: 'Vie', month: '01 Nov', label: 'Viernes 01 Noviembre 2024' },
  ];

  timeSlots = [
    { time: '08:30 AM', available: true },
    { time: '09:15 AM', available: true },
    { time: '10:00 AM', available: true },
    { time: '10:45 AM', available: false },
    { time: '11:30 AM', available: true },
    { time: '02:00 PM', available: true },
    { time: '02:45 PM', available: true },
    { time: '03:30 PM', available: false },
    { time: '04:15 PM', available: true },
    { time: '05:00 PM', available: true },
  ];

  consultationType = signal('control');
  showConfirmModal = signal(false);

  consultationTypes = [
    { id: 'primera', title: 'Primera Consulta', mins: '45 minutos', price: '$75.000 Particular', note: 'Anamnesis completa y examen físico', suggested: false },
    { id: 'control', title: 'Control Periódico', mins: '30 minutos', price: '$60.000 Particular', note: 'Sugerido por Sistema', suggested: true },
    { id: 'sobrecupo', title: 'Sobrecupo de Urgencia', mins: '20 minutos', price: '$50.000 Particular', note: 'Requiere autorización médica', suggested: false },
    { id: 'examenes', title: 'Lectura de Exámenes', mins: '15 minutos', price: 'Sin costo adicional', note: 'Revisión rápida de laboratorio', suggested: false },
  ];

  selectedConsultationType = computed(() => {
    return this.consultationTypes.find(t => t.id === this.consultationType()) || this.consultationTypes[1];
  });

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.timeLeft.update(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  onSearchPatient(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchPatientTerm.set(value);
    this.showPatientDropdown.set(true);
  }

  onBlurPatient(): void {
    setTimeout(() => this.showPatientDropdown.set(false), 150);
  }

  handleSelectPatient(id: string): void {
    const patient = this.data.getPatient(id);
    if (!patient) return;
    this.selectedPatient.set(patient);
    this.searchPatientTerm.set('');
    this.showPatientDropdown.set(false);
  }

  setField(field: 'name' | 'rut' | 'age' | 'phone' | 'insurance', event: Event): void {
    const value = inputValue(event);
    this.newPatientForm.update((f) => ({ ...f, [field]: value }));
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
      ci: f.rut.trim() || 'Sin CI',
      name,
      age,
      birthDate: age ? `Edad: ${age} años` : 'Sin fecha registrada',
      phone: f.phone.trim() || '+56 9 0000 0000',
      email: 'sin@email.com',
      address: 'Sin dirección registrada',
      insurance: f.insurance.trim() || 'Sin previsión',
      bloodType: 'Sin especificar',
      allergies: [],
      chronicConditions: [],
      consentSigned: false,
    };
    this.data.addPatient(patient);
    this.selectedPatient.set(patient);
    this.showNewPatientModal.set(false);
    this.newPatientForm.set({ name: '', rut: '', age: '', phone: '', insurance: '' });
    this.toast.show('Paciente Registrado', `${patient.name} fue agregado y seleccionado.`);
  }

  formatCountdown(): string {
    const seconds = this.timeLeft();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} min`;
  }

  handleConfirmBooking(): void {
    const patientName = this.selectedPatient()?.name || 'Paciente';
    const doctorName = this.selectedDoctor().name;
    const dateLabel = this.selectedDayLabel();
    const time = this.selectedTime();

    this.showConfirmModal.set(false);
    this.toast.show(
      '¡Cita Médica Agendada Exitosamente!',
      `Cita reservada para ${patientName} con el/la ${doctorName} el ${dateLabel} a las ${time}.`
    );
  }
}
