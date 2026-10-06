import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NavigationService } from '../../core/services/navigation.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { BookableDay, ConsultationType, Patient } from '../../core/models/types';
import { PickerItem, SelectionPickerComponent } from '../../shared/selection-picker/selection-picker.component';
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

const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
// A tres letras y en el mismo tamano que usa Configuracion del Sistema, para
// que las dos rejillas se lean igual.
const WEEK_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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
  imports: [ButtonComponent, BadgeComponent, ModalComponent, ToastComponent, NewPatientModalComponent, SelectionPickerComponent],
  template: `
    <div class="flex flex-col w-full">
      <!-- Sin overflow-hidden en este nivel: ese atributo crea un contexto de
           scroll y anula el position:sticky del resumen. El recorte que necesitan
           los circulos decorativos se hace aqui, en su propia capa. -->
      <div class="relative w-full px-4 sm:px-6 lg:px-8 py-6">
        <div class="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
          <div class="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-[#86f2e4] opacity-20 blur-3xl"></div>
          <div class="absolute top-80 right-0 w-80 h-80 rounded-full bg-[#acedff] opacity-20 blur-3xl"></div>
        </div>

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
                @if (selectedPatient()?.id) {
                  <app-badge variant="success" size="sm">Completado</app-badge>
                } @else {
                  <app-badge variant="neutral" size="sm">Pendiente</app-badge>
                }
              </div>

              <app-selection-picker
                icon="search"
                noun="paciente"
                placeholder="Buscar paciente por nombre o CI..."
                hint="Seleccione o registre un paciente para continuar"
                emptyMessage="No se encontraron pacientes con {term}"
                [searchKeys]="['name', 'ci']"
                [items]="patientItems()"
                [selectedId]="selectedPatient()?.id ?? null"
                secondaryLabel="Registrar Nuevo Paciente"
                secondaryIcon="person_add"
                (selectedChange)="onPickPatient($event)"
                (secondaryClick)="openNewPatientModal()"
              />
            </div>

            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#eceef0]">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-full bg-[#006a61] text-white flex items-center justify-center text-[13px] font-bold">2</span>
                  <h2 class="text-[15px] font-bold text-[#191c1e]">Especialidad &amp; Asignación Médica</h2>
                </div>
                @if (selectedDoctorId()) {
                  <app-badge variant="teal" size="sm">Asignado</app-badge>
                } @else {
                  <app-badge variant="neutral" size="sm">Pendiente</app-badge>
                }
              </div>

              <app-selection-picker
                icon="stethoscope"
                noun="médico"
                placeholder="Buscar médico por nombre o especialidad..."
                hint="Seleccione el médico responsable de este turno"
                emptyMessage="No se encontraron médicos"
                [searchKeys]="['name', 'specialty']"
                [items]="doctorItems()"
                [selectedId]="selectedDoctorId()"
                (selectedChange)="onPickDoctor($event)"
              />
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

            <div class="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-[#e6e8ea]">
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
                <div class="flex items-center mb-2">
                  <!--
                    Flechas, etiqueta y "Hoy" van agrupados. Antes las flechas
                    eran hijas directas de un justify-between y la etiqueta
                    quedaba centrada por el espacio sobrante; al sumar "Hoy" ese
                    reparto se habria roto, asi que el grupo se cierra como en
                    Configuracion del Sistema. El justify-between tambien se
                    fue: con un solo hijo no repartia nada.
                  -->
                  <div class="flex items-center gap-1.5">
                    <button
                      type="button"
                      (click)="shiftMonth(-1)"
                      [disabled]="isCurrentMonth()"
                      [class.cursor-not-allowed]="isCurrentMonth()"
                      [class.opacity-40]="isCurrentMonth()"
                      class="p-1.5 rounded-lg hover:bg-[#f2f4f6]"
                      title="Mes anterior"
                    >
                      <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <span class="text-[13px] font-bold text-[#191c1e]">{{ visibleMonthLabel() }}</span>
                    <button
                      type="button"
                      (click)="shiftMonth(1)"
                      [disabled]="isLastProgramableMonth()"
                      [class.cursor-not-allowed]="isLastProgramableMonth()"
                      [class.opacity-40]="isLastProgramableMonth()"
                      class="p-1.5 rounded-lg hover:bg-[#f2f4f6]"
                      title="Mes siguiente"
                    >
                      <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                    @if (!isCurrentMonth()) {
                      <button
                        type="button"
                        (click)="goToCurrentMonth()"
                        class="ml-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-[#f2f4f6] text-[#45464d] border border-[#e0e3e5] hover:bg-[#e8eaec]"
                        title="Volver al mes en curso"
                      >
                        Hoy
                      </button>
                    }
                  </div>
                </div>
                <div class="flex gap-1.5 mb-3 overflow-x-auto pb-1">
                  @for (m of programableMonths(); track m.key) {
                    <button
                      type="button"
                      (click)="goToMonth(m.date)"
                      [title]="m.label + ' — ' + availableDaysIn(m.key) + ' días con atención'"
                      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors shrink-0"
                      [class.bg-[#006a61]]="m.key === visibleMonthKey()"
                      [class.text-white]="m.key === visibleMonthKey()"
                      [class.border-[#006a61]]="m.key === visibleMonthKey()"
                      [class.bg-white]="m.key !== visibleMonthKey()"
                      [class.text-[#45464d]]="m.key !== visibleMonthKey()"
                      [class.border-[#e0e3e5]]="m.key !== visibleMonthKey()"
                      [class.hover:border-[#006a61]]="m.key !== visibleMonthKey()"
                      [class.hover:text-[#006a61]]="m.key !== visibleMonthKey()"
                    >
                      <span>{{ m.short }}</span>
                      <span
                        class="px-1.5 py-0.5 rounded-full text-[10px] leading-none"
                        [class.bg-white/20]="m.key === visibleMonthKey()"
                        [class.text-white]="m.key === visibleMonthKey()"
                        [class.bg-[#f0fdfa]]="m.key !== visibleMonthKey() && availableDaysIn(m.key) > 0"
                        [class.text-[#006a61]]="m.key !== visibleMonthKey() && availableDaysIn(m.key) > 0"
                        [class.bg-[#f2f4f6]]="m.key !== visibleMonthKey() && availableDaysIn(m.key) === 0"
                        [class.text-[#9a9ca1]]="m.key !== visibleMonthKey() && availableDaysIn(m.key) === 0"
                      >
                        {{ availableDaysIn(m.key) }}
                      </span>
                    </button>
                  }
                </div>
                <div class="grid grid-cols-7 gap-1 mb-1">
                  @for (h of weekHeaders; track h) {
                    <span class="text-center text-[11px] font-bold uppercase text-[#76777d]">{{ h }}</span>
                  }
                </div>
                <div class="grid grid-cols-7 gap-1">
                  @for (cell of calendarCells(); track cell.date) {
                    <button
                      type="button"
                      (click)="onSelectDate(cell)"
                      [disabled]="!cell.bookable || cell.outside"
                      [title]="cell.outside
                        ? 'Día del mes vecino, solo ocupa su columna'
                        : cell.blockedDetail ?? (cell.bookable ? 'Cupos libres: ' + cell.remaining : '')"
                      class="aspect-square rounded-lg border text-[12px] font-bold flex flex-col items-center justify-center transition-all leading-none"
                      [class]="selectedDate() === cell.date
                        ? 'bg-[#006a61] text-white border-[#006a61]'
                        : cell.outside
                          ? 'bg-transparent text-[#c2c5c9] border-transparent cursor-not-allowed'
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
                <!--
                  Leyenda con muestras de color, igual que en Configuracion del
                  Sistema. Se conserva la nota del numero chico porque en la
                  agenda si aporta informacion: son los cupos que quedan.
                -->
                <div class="flex items-center gap-3 flex-wrap mt-3 text-[11px] text-[#76777d]">
                  <span class="inline-flex items-center gap-1.5">
                    <span class="w-3 h-3 rounded bg-white border border-[#d8dbde]"></span>Con atención
                  </span>
                  <span class="inline-flex items-center gap-1.5">
                    <span class="w-3 h-3 rounded bg-[#f8f9fa] border border-[#f0f1f2]"></span>Sin atención
                  </span>
                  <span class="ml-auto">El número chico son los cupos que quedan.</span>
                </div>

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

          <!-- sticky: el resumen y el boton quedan a la vista mientras se recorre
                 el calendario y los horarios, que es la parte larga del formulario.
                 El top son 64px del header fijo mas 24px de aire: con menos, el
                 header lo tapa. self-start es necesario porque en un grid el
                 item estiraria a toda la fila y no habria nada que anclar. -->
            <div class="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-[88px] self-start">
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
              <!-- El title solo aparece con el boton habilitado: un boton deshabilitado no
                   recibe hover, y para ese caso esta el aviso de que falta, arriba. -->
              <app-button
                variant="primary"
                size="lg"
                icon="check_circle"
                [fullWidth]="true"
                [disabled]="!canConfirm()"
                [title]="canConfirm()
                  ? 'Confirma la cita con el paciente, el médico, el día y la hora que aparecen en este resumen.'
                  : ''"
                (click)="showConfirmModal.set(true)"
              >
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

  /** Arranca vacio como el paciente: asi ambos piden seleccion explicita. */
  selectedDoctorId = signal<string | null>(null);

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

  readonly weekHeaders = WEEK_HEADERS;

  visibleMonth = signal<Date>(firstOfCurrentMonth());

  /**
   * Dias disponibles por clave de mes. Se cargan los cuatro meses de una vez al
   * cambiar de medico, asi cambiar de mes no vuelve a pedir nada.
   */
  readonly daysByMonth = signal<Record<string, BookableDay[]>>({});

  private timer: ReturnType<typeof setInterval> | null = null;

  /** Pacientes en el formato que espera app-selection-picker. */
  readonly patientItems = computed<PickerItem[]>(() =>
    this.data.patients().map(p => ({
      id: p.id,
      title: p.name,
      subtitle: `CI: ${p.ci} · ${p.age} años`,
      detail: `Expediente: ${p.id} · Nac. ${p.birthDate}`,
      search: { name: p.name, ci: p.ci },
    })),
  );

  /** Medicos en el mismo formato, con la jornada en la tercera linea. */
  readonly doctorItems = computed<PickerItem[]>(() => {
    const j = this.doctorJornada();
    return this.data.doctors().map(d => ({
      id: d.id,
      title: d.name,
      subtitle: `Especialidad: ${d.specialty}`,
      detail: j ? `Jornada ${j.startTime}–${j.endTime}` : undefined,
      search: { name: d.name, specialty: d.specialty },
    }));
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

  /** 'YYYY-MM', con el mes en dos digitos. */
  private monthKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Meses en los que se puede agendar: el actual mas los tres siguientes, la
   * misma ventana en que Configuración del Sistema permite marcar días. Mas
   * alla no hay nada que reservar porque nadie puede programarlo.
   */
  readonly programableMonths = computed(() => {
    const now = new Date();
    const out: Array<{ date: Date; key: string; short: string; label: string }> = [];
    for (let i = 0; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      out.push({ date: d, key: this.monthKey(d), short: MONTH_SHORT[d.getMonth()], label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` });
    }
    return out;
  });

  readonly visibleMonthKey = computed(() => this.monthKey(this.visibleMonth()));

  /** Dias con atención de ese mes. Cero si el mes todavía no se consultó. */
  availableDaysIn(key: string): number {
    return (this.daysByMonth()[key] ?? []).filter(d => d.bookable).length;
  }

  /**
   * El primer mes programable es siempre el mes en curso, asi que esto vale
   * tanto para saber si ya se esta en el mes actual (y esconder "Hoy") como
   * para bloquear la flecha hacia atras. Se deja un solo metodo para que las
   * dos cosas no puedan empezar a discrepar.
   */
  isCurrentMonth(): boolean {
    return this.visibleMonthKey() === this.programableMonths()[0]?.key;
  }

  /** Vuelve al mes en curso, igual que el boton de Configuracion del Sistema. */
  goToCurrentMonth(): void {
    this.goToMonth(this.programableMonths()[0].date);
  }

  isLastProgramableMonth(): boolean {
    return this.visibleMonthKey() === this.programableMonths()[this.programableMonths().length - 1]?.key;
  }

  goToMonth(d: Date): void {
    this.visibleMonth.set(new Date(d.getFullYear(), d.getMonth(), 1));
  }

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

    const cells: Array<BookableDay & { outside: boolean }> = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const date = toDateStr(d);
      // outside = dia del mes vecino. Sirve para alinear las columnas, asi que
      // se dibuja pero nunca se puede elegir.
      const outside = d.getMonth() !== month.getMonth() || d.getFullYear() !== month.getFullYear();
      const known = byDate.get(date);
      if (!outside && known) {
        cells.push({ ...known, outside });
        continue;
      }
      // Una vez que se entró al mes, la primera celda de fuera significa que el
      // mes terminó: no hace falta agregar la fila final de días vacíos.
      if (outside && cells.some(c => !c.outside)) break;
      cells.push({
        date,
        dayOfWeek: ((d.getDay() + 6) % 7) + 1,
        day: '',
        dayNumber: d.getDate(),
        monthLabel: MONTHS[d.getMonth()],
        bookable: false,
        blockedBy: date < today ? 'pasado' : 'jornada-cerrada',
        blockedDetail: date < today ? 'Día pasado' : 'Sin datos de disponibilidad para esta fecha',
        remaining: 0,
        outside,
      });
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

    this.loadProgramableMonths(doctorId);
  }

  /**
   * Carga los cuatro meses de la ventana de una sola vez. Cuatro peticiones
   * mensuales en vez de una: cada una cabe de sobra en el tope de rango del
   * servidor y asi cambiar de mes ya no vuelve a pedir nada.
   */
  private loadProgramableMonths(doctorId: string): void {
    this.loadingDays.set(true);
    this.daysError.set(null);
    this.selectedDate.set(null);
    this.selectedTime.set(null);
    this.slots.set({ slots: [], startTime: '', endTime: '', totalSlots: 0, blockedDetail: null });

    const months = this.programableMonths();
    forkJoin(
      months.map(m => {
        const { from, to } = this.monthRange(m.date);
        return this.data.getBookableDays(doctorId, from, to).pipe(
          map(days => ({ key: m.key, days })),
          catchError(err => of({ key: m.key, days: [] as BookableDay[], error: err as Error })),
        );
      }),
    ).subscribe(results => {
      const byMonth: Record<string, BookableDay[]> = {};
      let failure: Error | null = null;
      for (const r of results) {
        byMonth[r.key] = r.days;
        if ('error' in r && r.error) failure = failure ?? r.error;
      }
      this.daysByMonth.set(byMonth);
      this.loadingDays.set(false);
      // bookableDays se deriva del mes visible, asi las demas partes de la
      // pantalla siguen leyendo la misma senal de siempre.
      this.syncVisibleMonth();

      if (failure) {
        this.daysError.set(failure.message);
        this.toast.show('No se pudo consultar la disponibilidad', failure.message, 'error');
        return;
      }
      // Preselecciona el primer dia con disponibilidad para no dejar la
      // pantalla en blanco al abrirla.
      const first = (byMonth[this.visibleMonthKey()] ?? []).find(d => d.bookable);
      if (first) this.selectDate(first.date);
    });
  }

  /** Vuelca en bookableDays el mes que se esta viendo. */
  private syncVisibleMonth(): void {
    this.bookableDays.set(this.daysByMonth()[this.visibleMonthKey()] ?? []);
  }

  /**
   * Refresca un solo mes. Se usa tras agendar porque los cupos libres de ese
   * dia ya no son los mismos.
   */
  private refreshMonth(month: Date): void {
    const doctorId = this.selectedDoctorId();
    if (!doctorId) return;
    const key = this.monthKey(month);
    const { from, to } = this.monthRange(month);
    this.data.getBookableDays(doctorId, from, to).subscribe({
      next: days => {
        this.daysByMonth.update(all => ({ ...all, [key]: days }));
        if (key === this.visibleMonthKey()) this.bookableDays.set(days);
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
      this.toast.show('Día no disponible', day.blockedDetail ?? 'Ese día no tiene atención.', 'warning');
      return;
    }
    this.selectDate(day.date);
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
    const next = new Date(this.visibleMonth().getFullYear(), this.visibleMonth().getMonth() + delta, 1);
    // No se sale de la ventana programable: mas alla no hay nada que agendar.
    const first = this.programableMonths()[0];
    const last = this.programableMonths()[this.programableMonths().length - 1];
    if (delta < 0 && first && this.monthKey(next) < first.key) return;
    if (delta > 0 && last && this.monthKey(next) > last.key) return;

    this.visibleMonth.set(next);
    // Los dias ya estan en cache: aqui solo se cambia que mes se ve.
    this.syncVisibleMonth();
    this.selectedDate.set(null);
    this.selectedTime.set(null);
    this.slots.set({ slots: [], startTime: '', endTime: '', totalSlots: 0, blockedDetail: null });
  }

  // ---- paciente / medico ----

  /** El selector devuelve un id o null para "cambiar". */
  onPickPatient(id: string | null): void {
    if (!id) {
      this.selectedPatient.set(null);
      return;
    }
    const patient = this.data.getPatient(id);
    if (!patient) return;
    this.selectedPatient.set(patient);
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
    this.toast.show('Paciente Registrado', `${patient.name} fue agregado y seleccionado para el turno.`);
  }

  /** Al cambiar de medico se recarga su jornada y sus dias disponibles. */
  onPickDoctor(id: string | null): void {
    this.selectedDoctorId.set(id);
    this.selectedDate.set(null);
    this.selectedTime.set(null);
    this.daysByMonth.set({});
    if (id) this.loadDoctorContext();
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
          // Los cupos libres de ese dia ya cambiaron: se refresca el mes para
          // que el numero del calendario no quede viejo.
          this.refreshMonth(new Date(`${date}T00:00:00`));
          this.selectDate(date);
        },
        error: (err: Error) => {
          this.saving.set(false);
          this.toast.show('No se pudo agendar', err.message, 'error');
          // El horario puede haberse tomado mientras tanto: se recarga la rejilla.
          if (date) this.selectDate(date);
        },
      });
  }
}
