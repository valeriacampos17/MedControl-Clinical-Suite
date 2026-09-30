import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { NavigationService } from '../../core/services/navigation.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { BookableDay, ConsultationType, Patient } from '../../core/models/types';
import { ButtonComponent } from '../../shared/button/button.component';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ToastComponent } from '../../shared/toast/toast.component';
import { NewPatientModalComponent } from '../../shared/new-patient-modal/new-patient-modal.component';

interface DoctorOption {
  id: string;
  name: string;
  shortName: string;
  specialty: string;
  avatarUrl?: string;
}

type DayPickerVariant = 'cards' | 'calendar' | 'select';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEK_HEADERS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function firstOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

@Component({
  selector: 'app-appointment-booking',
  standalone: true,
  imports: [ButtonComponent, BadgeComponent, ModalComponent, ToastComponent, NewPatientModalComponent],
  template: `
    <div class="flex flex-col w-full">
      <div class="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
        <div class="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-[#86f2e4] opacity-20 blur-3xl pointer-events-none -z-10"></div>
        <div class="absolute top-80 right-0 w-80 h-80 rounded-full bg-[#acedff] opacity-20 blur-3xl pointer-events-none -z-10"></div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#eceef0]">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-[20px] sm:text-[22px] font-bold text-[#191c1e] tracking-tight">Programación de Turno Clínico</h1>
              <app-badge variant="teal" size="sm">Modo Admisión / Asistente Clínico</app-badge>
            </div>
            <p class="text-[13px] text-[#45464d] mt-1">Los horarios salen de los días abiertos y de la jornada de cada médico</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div class="lg:col-span-7 flex flex-col gap-6">
            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#eceef0]">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-full bg-[#006a61] text-white flex items-center justify-center text-[13px] font-bold">1</span>
                  <h2 class="text-[15px] font-bold text-[#191c1e]">Búsqueda &amp; Identificación del Paciente</h2>
                </div>
                <app-badge variant="success" size="sm">Completado</app-badge>
              </div>

              @if (selectedPatient()?.id) {
                <div class="p-4 rounded-xl bg-[#f2f4f6] border border-[#e0e3e5]">
                  <div class="flex items-start gap-3.5">
                    <div class="w-12 h-12 rounded-xl bg-[#006a61] text-white flex items-center justify-center text-[16px] font-bold shrink-0 ring-1 ring-[#c6c6cd]">
                      {{ data.getInitials(selectedPatient()!.name) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-[14px] font-bold text-[#191c1e] truncate">{{ selectedPatient()!.name }}</span>
                        <span class="text-[11px] text-[#45464d]">{{ selectedPatient()!.age }} años ({{ selectedPatient()!.birthDate }})</span>
                      </div>
                      <p class="text-[12px] text-[#45464d] truncate mt-0.5">Expediente: {{ selectedPatient()!.id }} · CI: {{ selectedPatient()!.ci }}</p>
                    </div>
                    <button
                      type="button"
                      class="shrink-0 px-2.5 py-1 rounded-lg text-[#76777d] hover:bg-[#e6e8ea] transition-colors text-[12px] font-semibold"
                      (click)="clearPatient()"
                      title="Cambiar de paciente"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              } @else {
                <div class="p-4 rounded-xl bg-[#fffdf5] border border-[#fde68a]">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="material-symbols-outlined text-[#b45309] text-[18px]">search</span>
                    <span class="text-[12.5px] font-semibold text-[#92400e]">Seleccione o registre un paciente para continuar</span>
                  </div>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-[18px] pointer-events-none" aria-hidden="true">search</span>
                    <input
                      type="text"
                      placeholder="Buscar paciente por nombre o CI..."
                      title="Buscar un paciente por nombre o CI para asignarlo al turno"
                      class="w-full pl-9 pr-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] transition-colors"
                      [value]="searchPatientTerm()"
                      (input)="onSearchPatient($event)"
                      (focus)="showPatientDropdown.set(true)"
                      (blur)="onBlurPatient()"
                    />
                  </div>
                  @if (showPatientDropdown() && filteredPatients().length > 0) {
                    <div class="absolute z-30 mt-1 w-full max-w-[calc(100%-2rem)] bg-white rounded-xl shadow-lg border border-[#e6e8ea] max-h-60 overflow-y-auto">
                      @for (p of filteredPatients(); track p.id) {
                        <button
                          type="button"
                          class="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#f2f4f6] transition-colors first:rounded-t-xl last:rounded-b-xl"
                          (mousedown)="handleSelectPatient(p.id)"
                        >
                          <div class="w-8 h-8 rounded-lg bg-[#006a61] text-white flex items-center justify-center text-[11px] font-bold ring-1 ring-[#eceef0] shrink-0">
                            {{ data.getInitials(p.name) }}
                          </div>
                          <div class="flex flex-col min-w-0">
                            <span class="text-[13px] font-semibold text-[#191c1e] truncate">{{ p.name }}</span>
                            <span class="text-[11px] text-[#76777d]">CI: {{ p.ci }} · {{ p.age }} años</span>
                          </div>
                        </button>
                      }
                    </div>
                  }
                  @if (showPatientDropdown() && searchPatientTerm() && filteredPatients().length === 0) {
                    <div class="absolute z-30 mt-1 w-full max-w-[calc(100%-2rem)] bg-white rounded-xl shadow-lg border border-[#e6e8ea] p-4 text-center">
                      <span class="text-[12px] text-[#76777d]">No se encontraron pacientes con "{{ searchPatientTerm() }}"</span>
                    </div>
                  }
                </div>
              }
              <div class="mt-3 flex items-center gap-2">
                <app-button variant="outline" size="sm" icon="person_add" (click)="openNewPatientModal()" title="Abrir el formulario para registrar un nuevo paciente en el sistema">
                  Registrar Nuevo Paciente
                </app-button>
              </div>
            </div>

            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#eceef0]">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-full bg-[#006a61] text-white flex items-center justify-center text-[13px] font-bold">2</span>
                  <h2 class="text-[15px] font-bold text-[#191c1e]">Especialidad &amp; Asignación Médica</h2>
                </div>
                <app-badge variant="teal" size="sm">Asignado</app-badge>
              </div>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-[18px] pointer-events-none" aria-hidden="true">stethoscope</span>
                <input
                  type="text"
                  placeholder="Buscar médico por nombre o especialidad..."
                  title="Buscar y asignar el médico responsable del turno"
                  class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] transition-colors"
                  [value]="doctorSearchTerm()"
                  (input)="onSearchDoctor($event)"
                  (focus)="showDoctorDropdown.set(true)"
                  (blur)="onBlurDoctor()"
                />
              </div>
              @if (showDoctorDropdown() && filteredDoctors().length > 0) {
                <div class="absolute z-30 mt-1 w-full max-w-[calc(100%-2rem)] bg-white rounded-xl shadow-lg border border-[#e6e8ea] max-h-60 overflow-y-auto">
                  @for (d of filteredDoctors(); track d.id) {
                    <button
                      type="button"
                      class="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#f2f4f6] transition-colors first:rounded-t-xl last:rounded-b-xl"
                      [class.bg-[#f2f4f6]]="selectedDoctorId() === d.id"
                      (mousedown)="handleSelectDoctor(d)"
                    >
                      <div class="w-8 h-8 rounded-lg bg-[#006a61] text-white flex items-center justify-center text-[11px] font-bold ring-1 ring-[#eceef0] shrink-0">
                        {{ data.getInitials(d.name) }}
                      </div>
                      <div class="flex flex-col min-w-0">
                        <span class="text-[13px] font-semibold text-[#191c1e] truncate">{{ d.name }}</span>
                        <span class="text-[11px] text-[#76777d]">{{ d.specialty }}</span>
                      </div>
                      @if (selectedDoctorId() === d.id) {
                        <span class="material-symbols-outlined text-[#006a61] text-[16px] ml-auto shrink-0">check</span>
                      }
                    </button>
                  }
                </div>
              }
              @if (showDoctorDropdown() && doctorSearchTerm() && filteredDoctors().length === 0) {
                <div class="absolute z-30 mt-1 w-full max-w-[calc(100%-2rem)] bg-white rounded-xl shadow-lg border border-[#e6e8ea] p-4 text-center">
                  <span class="text-[12px] text-[#76777d]">No se encontraron médicos con "{{ doctorSearchTerm() }}"</span>
                </div>
              }
              @if (selectedDoctor(); as doctor) {
                <div class="p-3 rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] flex items-center gap-3 mt-3">
                  <div class="w-10 h-10 rounded-lg bg-[#006a61] text-white flex items-center justify-center text-[13px] font-bold shrink-0 ring-1 ring-[#c6c6cd]">
                    {{ data.getInitials(doctor.name) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-bold text-[#191c1e] truncate">{{ doctor.name }}</p>
                    <p class="text-[11px] text-[#45464d] truncate">Especialidad: {{ doctor.specialty }}</p>
                  </div>
                  @if (doctorJornada(); as j) {
                    <span class="text-[11px] text-[#45464d] shrink-0 text-right">
                      Jornada<br />
                      <span class="font-bold text-[#006a61]">{{ j.startTime }}–{{ j.endTime }}</span>
                    </span>
                  }
                </div>
              }
            </div>

            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#eceef0]">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-full bg-[#006a61] text-white flex items-center justify-center text-[13px] font-bold">3</span>
                  <h2 class="text-[15px] font-bold text-[#191c1e]">Tipo de Consulta &amp; Duración del Bloque</h2>
                </div>
              </div>
              @if (loadingTypes()) {
                <p class="text-[12px] text-[#76777d]">Cargando tipos de consulta...</p>
              } @else {
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  @for (item of consultationTypes(); track item.id) {
                    <button
                      type="button"
                      (click)="onSelectType(item.id)"
                      class="text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between"
                      [class]="consultationType() === item.id
                        ? 'border-2 border-[#006a61] bg-[#006a61]/5 shadow-xs'
                        : 'border-[#e0e3e5] bg-[#f2f4f6] hover:bg-[#e6e8ea]'"
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
                        <span class="font-semibold text-[#006a61]">{{ item.durationMinutes }} minutos</span>
                        <span class="text-[#76777d]">{{ item.price }}</span>
                      </div>
                    </button>
                  }
                </div>
              }
            </div>

            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#eceef0]">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-full bg-[#006a61] text-white flex items-center justify-center text-[13px] font-bold">4</span>
                  <h2 class="text-[15px] font-bold text-[#191c1e]">Día y Hora Disponibles</h2>
                </div>
                @if (selectedDate()) {
                  <app-badge variant="teal" size="sm">{{ slots().totalSlots }} horarios libres</app-badge>
                }
              </div>

              @if (!selectedDoctorId()) {
                <p class="text-[12.5px] text-[#76777d]">Seleccione un médico para ver los días y horarios.</p>
              } @else if (loadingDays()) {
                <p class="text-[12.5px] text-[#76777d] flex items-center gap-2">
                  <span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  Consultando días abiertos...
                </p>
              } @else if (daysError()) {
                <div class="p-3.5 rounded-xl bg-[#fef2f2] border border-[#fecaca]">
                  <span class="text-[12.5px] text-[#991b1b]">No se pudo consultar la disponibilidad: {{ daysError() }}</span>
                </div>
              } @else if (!hasAnyBookableDay()) {
                <div class="p-3.5 rounded-xl bg-[#fff7ed] border border-[#fed7aa]">
                  <span class="text-[12.5px] text-[#92400e]">
                    Este médico no tiene días marcados para laborar, así que no se puede agendar ninguna cita.
                    Márquelos en <strong>Configuración del Sistema → Días a Laborar</strong>.
                  </span>
                </div>
              } @else if (bookableDays().length === 0) {
                <div class="p-3.5 rounded-xl bg-[#fff7ed] border border-[#fed7aa]">
                  <span class="text-[12.5px] text-[#92400e]">No hay días para mostrar en este mes.</span>
                </div>
              } @else {
                <div class="flex items-center gap-1.5 mb-3 flex-wrap">
                  <span class="text-[11px] text-[#76777d] mr-1">Vista del calendario:</span>
                  @for (v of dayPickerVariants; track v.id) {
                    <button
                      type="button"
                      (click)="dayPickerVariant.set(v.id)"
                      class="px-2 py-1 rounded-md text-[11px] font-semibold transition-colors"
                      [class]="dayPickerVariant() === v.id ? 'bg-[#006a61] text-white' : 'bg-[#f2f4f6] text-[#45464d] hover:bg-[#e6e8ea]'"
                    >
                      {{ v.label }}
                    </button>
                  }
                </div>

                @switch (dayPickerVariant()) {
                  @case ('cards') {
                    <div class="flex gap-2 overflow-x-auto pb-2">
                      @for (d of bookableDays(); track d.date) {
                        <button
                          type="button"
                          (click)="onSelectDate(d)"
                          [disabled]="!d.bookable"
                          [title]="d.blockedDetail ?? 'Cupos libres: ' + d.remaining"
                          class="shrink-0 w-[74px] rounded-xl border px-2 py-2.5 text-center transition-all"
                          [class]="selectedDate() === d.date
                            ? 'border-2 border-[#006a61] bg-[#006a61]/5'
                            : d.bookable
                              ? 'border-[#e0e3e5] bg-white hover:border-[#006a61]/40'
                              : 'border-[#eceef0] bg-[#f8f9fa] opacity-55 cursor-not-allowed'"
                        >
                          <span class="block text-[10px] font-semibold uppercase text-[#76777d]">{{ d.day.slice(0, 3) }}</span>
                          <span class="block text-[19px] font-bold leading-tight"
                            [class]="selectedDate() === d.date ? 'text-[#006a61]' : d.bookable ? 'text-[#191c1e]' : 'text-[#b0b3b7]'">
                            {{ d.dayNumber }}
                          </span>
                          <span class="block text-[9.5px] text-[#76777d]">{{ d.monthLabel.slice(0, 3) }}</span>
                          <span class="block mt-1 text-[9px] font-semibold"
                            [class]="d.bookable ? 'text-[#006a61]' : 'text-[#b0b3b7]'">
                            {{ d.bookable ? d.remaining + ' cupos' : shortBlocked(d.blockedBy) }}
                          </span>
                        </button>
                      }
                    </div>
                  }
                  @case ('calendar') {
                    <div class="flex items-center justify-between mb-2">
                      <button type="button" (click)="shiftMonth(-1)" class="p-1.5 rounded-lg hover:bg-[#f2f4f6]" title="Mes anterior">
                        <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                      </button>
                      <span class="text-[13px] font-bold text-[#191c1e]">{{ visibleMonthLabel() }}</span>
                      <button type="button" (click)="shiftMonth(1)" class="p-1.5 rounded-lg hover:bg-[#f2f4f6]" title="Mes siguiente">
                        <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </div>
                    <div class="grid grid-cols-7 gap-1 mb-1">
                      @for (h of weekHeaders; track h) {
                        <span class="text-center text-[10px] font-bold uppercase text-[#76777d]">{{ h }}</span>
                      }
                    </div>
                    <div class="grid grid-cols-7 gap-1">
                      @for (cell of calendarCells(); track cell.date) {
                        <button
                          type="button"
                          (click)="onSelectDate(cell)"
                          [disabled]="!cell.bookable"
                          [title]="cell.blockedDetail ?? (cell.bookable ? 'Cupos libres: ' + cell.remaining : '')"
                          class="aspect-square rounded-lg border text-[11px] font-semibold flex flex-col items-center justify-center transition-all leading-none"
                          [class]="selectedDate() === cell.date
                            ? 'bg-[#006a61] text-white border-[#006a61]'
                            : cell.bookable
                              ? 'bg-white text-[#191c1e] border-[#e0e3e5] hover:border-[#006a61]/50'
                              : 'bg-[#f8f9fa] text-[#c2c5c9] border-[#f0f1f2] cursor-not-allowed'"
                        >
                          <span>{{ cell.dayNumber }}</span>
                          @if (cell.bookable && cell.remaining <= 5) {
                            <span class="text-[8px] font-bold" [class]="selectedDate() === cell.date ? 'text-white/80' : 'text-[#b45309]'">{{ cell.remaining }}</span>
                          }
                        </button>
                      }
                    </div>
                    <p class="mt-2 text-[10.5px] text-[#76777d]">El número chico es la cantidad de cupos restantes. Los días en gris no tienen atención.</p>
                  }
                  @case ('select') {
                    <select
                      class="w-full px-3 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                      [value]="selectedDate() ?? ''"
                      (change)="onSelectDateByValue($event)"
                    >
                      <option value="" disabled>Elige un día disponible</option>
                      @for (d of bookableDays(); track d.date) {
                        <option [value]="d.date" [disabled]="!d.bookable">
                          {{ d.day }} {{ d.dayNumber }} {{ d.monthLabel }} — {{ d.bookable ? d.remaining + ' cupos' : d.blockedDetail }}
                        </option>
                      }
                    </select>
                  }
                }

                <div class="mt-4 pt-4 border-t border-[#eceef0]">
                  @if (!selectedDate()) {
                    <p class="text-[12.5px] text-[#76777d]">Elige un día para ver los horarios libres.</p>
                  } @else if (loadingSlots()) {
                    <p class="text-[12.5px] text-[#76777d] flex items-center gap-2">
                      <span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      Consultando horarios...
                    </p>
                  } @else if (slots().blockedDetail) {
                    <div class="p-3 rounded-xl bg-[#fff7ed] border border-[#fed7aa]">
                      <span class="text-[12px] text-[#92400e]">{{ slots().blockedDetail }}</span>
                    </div>
                  } @else if (slots().slots.length === 0) {
                    <div class="p-3 rounded-xl bg-[#fff7ed] border border-[#fed7aa]">
                      <span class="text-[12px] text-[#92400e]">
                        No quedan horarios libres de {{ durationMinutes() }} minutos ese día. Prueba con otro día o con un bloque más corto.
                      </span>
                    </div>
                  } @else {
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-[12px] font-semibold text-[#191c1e]">
                        Horarios para {{ selectedDayLabel() }}
                      </span>
                      <span class="text-[11px] text-[#76777d]">
                        Jornada {{ slots().startTime }}–{{ slots().endTime }} · {{ durationMinutes() }} min por turno
                      </span>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                      @for (slot of slots().slots; track slot) {
                        <button
                          type="button"
                          (click)="selectedTime.set(slot)"
                          class="px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-all"
                          [class]="selectedTime() === slot
                            ? 'bg-[#006a61] text-white border-[#006a61]'
                            : 'bg-white text-[#191c1e] border-[#e0e3e5] hover:border-[#006a61]/50 hover:bg-[#006a61]/5'"
                        >
                          {{ slot }}
                        </button>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <div class="lg:col-span-5 flex flex-col gap-6">
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

            <div class="bg-white rounded-xl p-5 shadow-lg border-2 border-[#006a61] relative">
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#eceef0]">
                <h3 class="text-[15px] font-bold text-[#191c1e]">Resumen de Agendamiento</h3>
                <span class="w-2.5 h-2.5 rounded-full bg-[#006a61] animate-pulse"></span>
              </div>
              <div class="flex flex-col gap-2 text-[12px] text-[#45464d] mb-4">
                <div class="flex items-center justify-between">
                  <span>Paciente:</span>
                  <span class="font-bold text-[#191c1e]">{{ selectedPatient()?.name ?? '—' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Médico:</span>
                  <span class="font-semibold text-[#191c1e]">{{ selectedDoctor()?.name ?? '—' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Consulta:</span>
                  <span class="font-semibold text-[#191c1e]">{{ selectedType()?.title ?? '—' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Día:</span>
                  <span class="font-bold text-[#006a61]">{{ selectedDate() ? selectedDayLabel() : '—' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Hora:</span>
                  <span class="font-bold text-[#006a61]">{{ selectedTime() ?? '—' }}</span>
                </div>
              </div>
              @if (missingHint(); as hint) {
                <p class="mb-3 text-[11.5px] text-[#b45309] bg-[#fff7ed] border border-[#fed7aa] rounded-lg px-3 py-2">
                  {{ hint }}
                </p>
              }
              <app-button variant="primary" size="lg" icon="check_circle" [fullWidth]="true" [disabled]="!canConfirm()" (click)="showConfirmModal.set(true)">
                {{ saving() ? 'Agendando...' : 'Confirmar y Agendar Cita' }}
              </app-button>
            </div>
          </div>
        </div>
      </div>

      <app-modal
        [isOpen]="showConfirmModal()"
        title="Confirmar Cita Médica"
        subtitle="Verifique los detalles antes de emitir la reserva electrónica"
        icon="event_available"
        [footerTemplate]="true"
        (dismiss)="showConfirmModal.set(false)"
      >
        <div class="space-y-3 text-[13px]">
          <p class="text-[#45464d]">Se reservará un bloque de atención clínica para:</p>
          <div class="p-3.5 rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] space-y-1.5">
            <p class="font-bold text-[#191c1e]">Paciente: {{ selectedPatient()?.name }}</p>
            <p class="text-[#45464d]">Profesional: {{ selectedDoctor()?.name }}</p>
            <p class="text-[#45464d]">Consulta: {{ selectedType()?.title }} ({{ durationMinutes() }} minutos)</p>
            <p class="text-[#45464d]">Fecha: {{ selectedDate() ? selectedDayLabel() : '—' }} a las {{ selectedTime() }}</p>
          </div>
        </div>
        <div modal-footer class="flex items-center justify-end gap-2.5">
          <app-button variant="light" (click)="showConfirmModal.set(false)">Cancelar</app-button>
          <app-button variant="primary" icon="check" [disabled]="saving()" (click)="handleConfirmBooking()">
            {{ saving() ? 'Agendando...' : 'Confirmar Definitivamente' }}
          </app-button>
        </div>
      </app-modal>

      <app-new-patient-modal
        [isOpen]="showNewPatientModal()"
        (created)="handlePatientCreated($event)"
        (dismiss)="closeNewPatientModal()"
      />

      <app-toast />
    </div>
  `,
})
export class AppointmentBookingComponent implements OnInit, OnDestroy {
  nav = inject(NavigationService);
  data = inject(MockDataService);
  toast = inject(ToastService);

  timeLeft = signal(582);
  consultationType = signal('control');
  showConfirmModal = signal(false);
  selectedPatient = signal<Patient | null>(null);
  showNewPatientModal = signal(false);
  saving = signal(false);

  searchPatientTerm = signal('');
  showPatientDropdown = signal(false);
  doctorSearchTerm = signal('');
  showDoctorDropdown = signal(false);
  selectedDoctorId = signal<string | null>(this.data.doctors()[0]?.id ?? null);

  // ---- disponibilidad ----
  consultationTypes = signal<ConsultationType[]>([]);
  loadingTypes = signal(true);
  bookableDays = signal<BookableDay[]>([]);
  loadingDays = signal(false);
  /** Distingue "no se pudo consultar" de "no hay dias", que no es lo mismo. */
  daysError = signal<string | null>(null);
  selectedDate = signal<string | null>(null);
  slots = signal<{ slots: string[]; startTime: string; endTime: string; totalSlots: number; blockedDetail: string | null }>({
    slots: [],
    startTime: '',
    endTime: '',
    totalSlots: 0,
    blockedDetail: null,
  });
  loadingSlots = signal(false);
  selectedTime = signal<string | null>(null);
  doctorJornada = signal<{ startTime: string; endTime: string } | null>(null);

  /** Vista del calendario. Temporal: se borran las dos perdedoras cuando se elija una. */
  dayPickerVariant = signal<DayPickerVariant>('cards');
  readonly dayPickerVariants: Array<{ id: DayPickerVariant; label: string }> = [
    { id: 'cards', label: 'Tarjetas' },
    { id: 'calendar', label: 'Calendario' },
    { id: 'select', label: 'Lista' },
  ];
  readonly weekHeaders = WEEK_HEADERS;

  visibleMonth = signal<Date>(firstOfCurrentMonth());

  private timer: ReturnType<typeof setInterval> | null = null;

  readonly filteredPatients = computed(() => {
    const term = this.searchPatientTerm().toLowerCase().trim();
    if (!term) return this.data.patients();
    return this.data.patients().filter(
      (p) => p.name.toLowerCase().includes(term) || p.ci.toLowerCase().includes(term)
    );
  });

  readonly filteredDoctors = computed<DoctorOption[]>(() => {
    const term = this.doctorSearchTerm().toLowerCase().trim();
    const doctors: DoctorOption[] = this.data.doctors();
    if (!term) return doctors;
    return doctors.filter(
      (d) => d.name.toLowerCase().includes(term) || d.specialty.toLowerCase().includes(term)
    );
  });

  readonly selectedDoctor = computed<DoctorOption | null>(() => {
    const id = this.selectedDoctorId();
    if (!id) return null;
    return this.data.doctors().find((d) => d.id === id) ?? null;
  });

  readonly selectedType = computed<ConsultationType | null>(() => {
    return this.consultationTypes().find(t => t.id === this.consultationType()) ?? null;
  });

  readonly durationMinutes = computed(() => this.selectedType()?.durationMinutes ?? 30);

  readonly canConfirm = computed(
    () =>
      !!this.selectedPatient() &&
      !!this.selectedDoctorId() &&
      !!this.selectedDate() &&
      !!this.selectedTime() &&
      !this.saving(),
  );

  /** Que falta para poder confirmar, para que la pantalla lo diga. */
  readonly missingHint = computed(() => {
    if (!this.selectedPatient()) return 'Falta seleccionar el paciente.';
    if (!this.selectedDoctorId()) return 'Falta seleccionar el médico.';
    if (!this.selectedDate()) return 'Falta elegir el día.';
    if (!this.selectedTime()) return 'Falta elegir la hora.';
    return null;
  });

  readonly selectedDayLabel = computed(() => {
    const date = this.selectedDate();
    const day = this.bookableDays().find(d => d.date === date);
    if (!day) return date ?? '—';
    return `${day.day} ${day.dayNumber} ${day.monthLabel}`;
  });

  readonly visibleMonthLabel = computed(() => {
    const m = this.visibleMonth();
    return `${MONTHS[m.getMonth()]} ${m.getFullYear()}`;
  });

  /** El medico no tiene ningun dia de la semana habilitado en su jornada. */
  readonly hasAnyBookableDay = computed(() => this.bookableDays().some(d => d.bookable));

  /** Celdas del mes visible, con su estado de reserva. */
  readonly calendarCells = computed(() => {
    const month = this.visibleMonth();
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    // getDay() arranca en domingo; la semana arranca en lunes.
    const lead = (first.getDay() + 6) % 7;
    const start = new Date(month.getFullYear(), month.getMonth(), 1 - lead);
    const byDate = new Map(this.bookableDays().map(d => [d.date, d]));
    const today = todayStr();

    const cells: BookableDay[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const date = toDateStr(d);
      const known = byDate.get(date);
      cells.push(
        known ?? {
          date,
          dayOfWeek: ((d.getDay() + 6) % 7) + 1,
          day: '',
          dayNumber: d.getDate(),
          monthLabel: MONTHS[d.getMonth()],
          bookable: false,
          blockedBy: date < today ? 'pasado' : 'jornada-cerrada',
          blockedDetail: date < today ? 'Día pasado' : 'Sin datos de disponibilidad para esta fecha',
          remaining: 0,
        },
      );
    }
    return cells;
  });

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.timeLeft.update(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    this.data.getConsultationTypes().subscribe({
      next: types => {
        this.consultationTypes.set(types);
        const suggested = types.find(t => t.suggested) ?? types[0];
        if (suggested) this.consultationType.set(suggested.id);
        this.loadingTypes.set(false);
      },
      error: () => this.loadingTypes.set(false),
    });

    this.loadDoctorContext();
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  formatCountdown(): string {
    const seconds = this.timeLeft();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} min`;
  }

  shortBlocked(reason: string | null): string {
    switch (reason) {
      case 'ausencia': return 'ausencia';
      case 'no-labora': return 'no labora';
      case 'sin-horario': return 'sin horario';
      case 'jornada-cerrada': return 'no atiende';
      case 'sin-cupo': return 'sin cupo';
      case 'pasado': return 'pasado';
      default: return 'no disponible';
    }
  }

  // ---- carga de disponibilidad ----

  /** Jornada y dias abiertos del medico elegido. */
  private loadDoctorContext(): void {
    const doctorId = this.selectedDoctorId();
    if (!doctorId) return;

    this.data.loadScheduleFor(doctorId).subscribe({
      next: days => {
        const enabled = days.find(d => d.enabled);
        this.doctorJornada.set(enabled ? { startTime: enabled.startTime, endTime: enabled.endTime } : null);
      },
      error: () => this.doctorJornada.set(null),
    });

    this.loadDays(doctorId);
  }

  private loadDays(doctorId: string): void {
    this.loadingDays.set(true);
    this.daysError.set(null);
    this.selectedDate.set(null);
    this.selectedTime.set(null);
    this.slots.set({ slots: [], startTime: '', endTime: '', totalSlots: 0, blockedDetail: null });

    // Se pide el mes que se esta viendo, no una ventana fija: asi el calendario
    // no se queda corto cuando se navega a un mes que todavia no se consulto.
    const { from, to } = this.monthRange(this.visibleMonth());
    this.data.getBookableDays(doctorId, from, to).subscribe({
      next: days => {
        this.bookableDays.set(days);
        this.loadingDays.set(false);
        // Preselecciona el primer dia con disponibilidad para no dejar la
        // pantalla en blanco al abrirla.
        const first = days.find(d => d.bookable);
        if (first) this.selectDate(first.date);
      },
      error: (err: Error) => {
        this.bookableDays.set([]);
        this.daysError.set(err.message);
        this.loadingDays.set(false);
        this.toast.show('No se pudo consultar la disponibilidad', err.message);
      },
    });
  }

  /** Rango que cubre el mes visible completo. */
  private monthRange(month: Date): { from: string; to: string } {
    const y = month.getFullYear();
    const m = month.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();
    return { from: toDateStr(new Date(y, m, 1)), to: toDateStr(new Date(y, m, lastDay)) };
  }

  private selectDate(date: string): void {
    const doctorId = this.selectedDoctorId();
    const day = this.bookableDays().find(d => d.date === date);
    if (!doctorId || !day?.bookable) return;

    this.selectedDate.set(date);
    this.selectedTime.set(null);
    this.loadingSlots.set(true);

    this.data.getAvailableSlots(doctorId, date, this.durationMinutes()).subscribe({
      next: res => {
        this.slots.set({
          slots: res.slots,
          startTime: res.startTime,
          endTime: res.endTime,
          totalSlots: res.totalSlots,
          blockedDetail: res.blockedDetail,
        });
        this.loadingSlots.set(false);
      },
      error: () => {
        this.slots.set({ slots: [], startTime: '', endTime: '', totalSlots: 0, blockedDetail: 'No se pudieron consultar los horarios.' });
        this.loadingSlots.set(false);
      },
    });
  }

  onSelectDate(day: BookableDay): void {
    if (!day.bookable) {
      this.toast.show('Día no disponible', day.blockedDetail ?? 'Ese día no tiene atención.');
      return;
    }
    this.selectDate(day.date);
  }

  onSelectDateByValue(event: Event): void {
    const date = (event.target as HTMLSelectElement).value;
    if (date) this.selectDate(date);
  }

  onSelectType(id: string): void {
    this.consultationType.set(id);
    // Cambia la duracion, asi que la rejilla se recalcula.
    const doctorId = this.selectedDoctorId();
    const date = this.selectedDate();
    if (doctorId && date) {
      this.selectedTime.set(null);
      this.loadingSlots.set(true);
      this.data.getAvailableSlots(doctorId, date, this.durationMinutes()).subscribe({
        next: res => {
          this.slots.set({
            slots: res.slots,
            startTime: res.startTime,
            endTime: res.endTime,
            totalSlots: res.totalSlots,
            blockedDetail: res.blockedDetail,
          });
          this.loadingSlots.set(false);
        },
        error: () => {
          this.slots.set({ slots: [], startTime: '', endTime: '', totalSlots: 0, blockedDetail: 'No se pudieron consultar los horarios.' });
          this.loadingSlots.set(false);
        },
      });
    }
  }

  shiftMonth(delta: number): void {
    this.visibleMonth.update(m => new Date(m.getFullYear(), m.getMonth() + delta, 1));
    const doctorId = this.selectedDoctorId();
    if (doctorId) this.loadDays(doctorId);
  }

  // ---- paciente / medico ----

  onSearchPatient(event: Event): void {
    this.searchPatientTerm.set((event.target as HTMLInputElement).value);
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

  clearPatient(): void {
    this.selectedPatient.set(null);
  }

  openNewPatientModal(): void {
    this.showNewPatientModal.set(true);
  }

  closeNewPatientModal(): void {
    this.showNewPatientModal.set(false);
  }

  handlePatientCreated(patient: Patient): void {
    this.selectedPatient.set(patient);
    this.closeNewPatientModal();
    this.searchPatientTerm.set('');
    this.showPatientDropdown.set(false);
    this.toast.show('Paciente Registrado', `${patient.name} fue agregado y seleccionado para el turno.`);
  }

  onSearchDoctor(event: Event): void {
    this.doctorSearchTerm.set((event.target as HTMLInputElement).value);
    this.showDoctorDropdown.set(true);
  }

  onBlurDoctor(): void {
    setTimeout(() => this.showDoctorDropdown.set(false), 150);
  }

  handleSelectDoctor(doctor: DoctorOption): void {
    this.selectedDoctorId.set(doctor.id);
    this.doctorSearchTerm.set('');
    this.showDoctorDropdown.set(false);
    this.loadDoctorContext();
  }

  // ---- confirmacion ----

  handleConfirmBooking(): void {
    const patient = this.selectedPatient();
    const doctorId = this.selectedDoctorId();
    const date = this.selectedDate();
    const time = this.selectedTime();
    const doctor = this.selectedDoctor();
    const type = this.selectedType();
    if (!patient || !doctorId || !date || !time || !doctor || !this.canConfirm()) return;

    this.showConfirmModal.set(false);
    this.saving.set(true);

    this.data
      .createAppointment({
        date,
        time,
        durationMinutes: this.durationMinutes(),
        patientId: patient.id,
        doctorId,
        reason: type?.title ?? 'Consulta',
        consultationTypeId: type?.id,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.show(
            '¡Cita Médica Agendada Exitosamente!',
            `Cita reservada para ${patient.name} (${doctor.name}) el ${this.selectedDayLabel()} a las ${time}.`,
          );
          this.selectedTime.set(null);
          this.selectDate(date);
        },
        error: (err: Error) => {
          this.saving.set(false);
          this.toast.show('No se pudo agendar', err.message);
          // El horario puede haberse tomado mientras tanto: se recarga la rejilla.
          if (date) this.selectDate(date);
        },
      });
  }
}
