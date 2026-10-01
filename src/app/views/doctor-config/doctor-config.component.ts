import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NavigationService } from '../../core/services/navigation.service';
import { ApiService } from '../../core/services/api.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { SwitchComponent } from '../../shared/switch/switch.component';
import { ToastComponent } from '../../shared/toast/toast.component';
import { DaySchedule } from '../../core/models/types';

@Component({
  selector: 'app-doctor-config',
  standalone: true,
  imports: [ButtonComponent, BadgeComponent, SwitchComponent, ToastComponent],
  template: `
    <div class="flex flex-col w-full">
      <div class="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
        <div class="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-[#86f2e4] opacity-20 blur-3xl pointer-events-none -z-10"></div>
        <div class="absolute top-80 right-0 w-80 h-80 rounded-full bg-[#acedff] opacity-20 blur-3xl pointer-events-none -z-10"></div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#eceef0]">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-[20px] sm:text-[22px] font-bold text-[#191c1e] tracking-tight">Configuración del Perfil y Disponibilidad</h1>
              <app-badge variant="teal" size="sm">Estado: Habilitado</app-badge>
            </div>
            <p class="text-[13px] text-[#45464d] mt-1">Gestión integral de horarios clínicos, reglas de agendamiento y acreditación profesional</p>
          </div>
          <app-button variant="primary" size="md" icon="save" (click)="handleSaveAllConfig()">Guardar Cambios</app-button>
        </div>

        <div class="flex flex-col gap-6">
          <!-- Medico a configurar: por defecto el grupo completo. -->
          <div class="bg-white rounded-xl p-4 lg:px-5 shadow-sm border border-[#e6e8ea]">
            <div class="flex flex-col gap-2">
              <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span class="text-[11px] font-bold text-[#76777d] uppercase tracking-wider shrink-0">Ver médico:</span>
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    (click)="onSelectScope('all')"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border"
                    [class]="scopeIsAll()
                      ? 'bg-[#006a61] text-white border-[#006a61] shadow-sm'
                      : 'bg-white text-[#45464d] border-[#e0e3e5] hover:border-[#006a61] hover:text-[#006a61]'"
                  >
                    <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      [class]="scopeIsAll() ? 'bg-white/20 text-white' : 'bg-[#006a61]/15 text-[#006a61]'">
                      <span class="material-symbols-outlined text-[14px]">group</span>
                    </span>
                    <span>Todos</span>
                  </button>
                  @for (doc of data.doctors(); track doc.id) {
                    <button
                      type="button"
                      (click)="onSelectScope(doc.id)"
                      class="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border"
                      [class]="scope() === doc.id
                        ? 'bg-[#006a61] text-white border-[#006a61] shadow-sm'
                        : 'bg-white text-[#45464d] border-[#e0e3e5] hover:border-[#006a61] hover:text-[#006a61]'"
                    >
                      <img [src]="doc.avatarUrl" [alt]="doc.name" class="w-5 h-5 rounded-full object-cover ring-1 ring-current/20" />
                      <span>{{ doc.shortName }}</span>
                    </button>
                  }
                </div>
              </div>
              @if (scopeIsAll()) {
                <p class="text-[11px] text-[#76777d]">
                  Los cambios de este bloque se guardan para los {{ data.doctors().length }} médicos a la vez.
                </p>
              }
            </div>
          </div>

          <!-- Un solo card: dias a laborar y jornadas, uno al lado del otro. -->
          <div class="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-[#e6e8ea]">
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
              <!-- Mitad izquierda: dias a laborar -->
              <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-2.5 pb-3 mb-4 border-b border-[#eceef0]">
              <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#006a61] shrink-0">
                <span class="material-symbols-outlined text-[20px]">calendar_month</span>
              </span>
              <div class="flex-1 min-w-0">
                <h3 class="text-[16px] font-bold text-[#191c1e]">Días a Laborar</h3>
                <p class="text-[12px] text-[#45464d]">
                  {{ scopeLabel() }}. Solo esas fechas se pueden agendar.
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="markFromSchedule()"
                  [disabled]="markingSchedule()"
                  class="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-[#f2f4f6] text-[#191c1e] border border-[#e0e3e5] hover:bg-[#e8eaec] disabled:opacity-50 shrink-0"
                >
                  {{ markingSchedule() ? 'Marcando…' : 'Marcar según la jornada' }}
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-1.5">
                <button type="button" (click)="shiftMarkingMonth(-1)" class="p-1.5 rounded-lg hover:bg-[#f2f4f6]">
                  <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span class="text-[13px] font-bold text-[#191c1e]">{{ markingMonthLabel() }}</span>
                <button type="button" (click)="shiftMarkingMonth(1)" class="p-1.5 rounded-lg hover:bg-[#f2f4f6]">
                  <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
                @if (!isCurrentMarkingMonth()) {
                  <button
                    type="button"
                    (click)="goToCurrentMonth()"
                    class="ml-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-[#f2f4f6] text-[#45464d] border border-[#e0e3e5] hover:bg-[#e8eaec]"
                  >
                    Hoy
                  </button>
                }
              </div>
              <span class="text-[12px] text-[#45464d]">
                <strong class="text-[#006a61]">{{ markedCount() }}</strong> días marcados
                @if (rangeAnchor() && rangeHint()) {
                  <span class="ml-2 text-[#92400e]">{{ rangeHint() }}</span>
                }
              </span>
            </div>

            <div class="flex gap-1.5 mb-3 overflow-x-auto pb-1">
              @for (m of monthStrip(); track m.full) {
                <button
                  type="button"
                  (click)="goToMonth(m.date)"
                  [title]="m.full + ' — ' + (monthStripCounts()[stripKey(m.date)] || 0) + ' días marcados'"
                  class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors shrink-0"
                  [class.bg-[#006a61]]="stripKey(m.date) === stripKey(markingMonth())"
                  [class.text-white]="stripKey(m.date) === stripKey(markingMonth())"
                  [class.border-[#006a61]]="stripKey(m.date) === stripKey(markingMonth())"
                  [class.bg-white]="stripKey(m.date) !== stripKey(markingMonth())"
                  [class.text-[#45464d]]="stripKey(m.date) !== stripKey(markingMonth())"
                  [class.border-[#e0e3e5]]="stripKey(m.date) !== stripKey(markingMonth())"
                  [class.hover:border-[#006a61]]="stripKey(m.date) !== stripKey(markingMonth())"
                  [class.hover:text-[#006a61]]="stripKey(m.date) !== stripKey(markingMonth())"
                >
                  <span>{{ m.label }}</span>
                  <span
                    class="px-1.5 py-0.5 rounded-full text-[10px] leading-none"
                    [class.bg-white/20]="stripKey(m.date) === stripKey(markingMonth())"
                    [class.text-white]="stripKey(m.date) === stripKey(markingMonth())"
                    [class.bg-[#f0fdfa]]="stripKey(m.date) !== stripKey(markingMonth()) && (monthStripCounts()[stripKey(m.date)] || 0) > 0"
                    [class.text-[#006a61]]="stripKey(m.date) !== stripKey(markingMonth()) && (monthStripCounts()[stripKey(m.date)] || 0) > 0"
                    [class.bg-[#f2f4f6]]="stripKey(m.date) !== stripKey(markingMonth()) && (monthStripCounts()[stripKey(m.date)] || 0) === 0"
                    [class.text-[#9a9ca1]]="stripKey(m.date) !== stripKey(markingMonth()) && (monthStripCounts()[stripKey(m.date)] || 0) === 0"
                  >
                    {{ monthStripCounts()[stripKey(m.date)] || 0 }}
                  </span>
                </button>
              }
            </div>

            <div class="grid grid-cols-7 gap-1 mb-1">
              @for (d of weekLabels; track d; let i = $index) {
                <button
                  type="button"
                  (click)="toggleWeekday(i + 1)"
                  [disabled]="!weekdayDates(i + 1).length"
                  [title]="weekdayDates(i + 1).length
                    ? 'Clic para ' + (weekdayState(i + 1) === 'full' ? 'desmarcar' : 'marcar') + ' todos los ' + d.toLowerCase() + ' de ' + markingMonthLabel()
                    : d + ': no quedan días futuros en este mes'"
                  class="text-center text-[11px] font-bold uppercase rounded py-1 transition-colors"
                  [class.text-[#76777d]]="weekdayState(i + 1) === 'none'"
                  [class.hover:text-[#006a61]]="weekdayState(i + 1) === 'none'"
                  [class.hover:bg-[#f2f4f6]]="weekdayState(i + 1) === 'none'"
                  [class.text-[#006a61]]="weekdayState(i + 1) !== 'none'"
                  [class.bg-[#f0fdfa]]="weekdayState(i + 1) !== 'none'"
                  [class.cursor-not-allowed]="!weekdayDates(i + 1).length"
                  [class.opacity-40]="!weekdayDates(i + 1).length"
                >
                  {{ d }}
                </button>
              }
            </div>
            <div class="grid grid-cols-7 gap-1">
              @for (cell of markingCells(); track cell.date) {
                <button
                  type="button"
                  (click)="onMarkingDayClick(cell.date)"
                  [disabled]="cell.locked"
                  [class.bg-[#006a61]]="!cell.locked && stateOf(cell.date) === 'full'"
                  [class.text-white]="!cell.locked && stateOf(cell.date) === 'full'"
                  [class.bg-gradient-to-r]="!cell.locked && stateOf(cell.date) === 'partial'"
                  [class.from-[#006a61]]="!cell.locked && stateOf(cell.date) === 'partial'"
                  [class.from-0]="!cell.locked && stateOf(cell.date) === 'partial'"
                  [class.to-transparent]="!cell.locked && stateOf(cell.date) === 'partial'"
                  [class.to-90%]="!cell.locked && stateOf(cell.date) === 'partial'"
                  [class.border-2]="!cell.locked && stateOf(cell.date) === 'partial'"
                  [class.border-[#006a61]]="!cell.locked && stateOf(cell.date) === 'partial'"
                  [class.bg-white]="!cell.locked && stateOf(cell.date) === 'none'"
                  [class.text-[#191c1e]]="!cell.locked && stateOf(cell.date) === 'none'"
                  [class.opacity-40]="cell.locked"
                  [class.cursor-not-allowed]="cell.locked"
                  [class.ring-2]="isInRange(cell.date)"
                  [class.ring-[#006a61]/40]="isInRange(cell.date)"
                  class="aspect-square rounded-lg text-[12px] font-bold transition-colors hover:ring-2 hover:ring-[#006a61]/30"
                  [title]="cell.outside
                    ? 'Día del mes vecino, solo ocupa su columna'
                    : cell.date > maxMarkableDate()
                    ? cell.date + ' — fuera del periodo programable'
                    : cell.date + (
                      stateOf(cell.date) === 'full' ? ' — marcado'
                      : stateOf(cell.date) === 'partial' ? ' — marcado solo para ' + markedDoctorNames(cell.date) + '. Clic para marcarlo para todos.'
                      : ' — sin marcar')"
                >
                  {{ cell.dayNumber }}
                </button>
              }
            </div>

            <div class="flex items-center gap-3 flex-wrap mt-3 text-[11px] text-[#76777d]">
              <span class="inline-flex items-center gap-1.5">
                <span class="w-3 h-3 rounded bg-[#006a61]"></span>Marcado para {{ targetDoctorIds().length > 1 ? 'todos' : 'el médico' }}
              </span>
              @if (targetDoctorIds().length > 1) {
                <span class="inline-flex items-center gap-1.5">
                  <span class="w-3 h-3 rounded border-2 border-[#006a61] bg-gradient-to-r from-[#006a61] from-0 to-transparent to-90%"></span>Solo para algunos
                </span>
              }
              <span class="inline-flex items-center gap-1.5">
                <span class="w-3 h-3 rounded bg-white border border-[#d8dbde]"></span>Sin marcar
              </span>
              <span class="ml-auto">{{ markedCount() }} días marcados en {{ markingMonthLabel() }}</span>
            </div>

            <p class="mt-3 text-[11px] text-[#76777d]">
              Clic en un día para marcarlo o desmarcarlo. Clic en uno y después en otro marca todo el rango.
              @if (targetDoctorIds().length > 1) {
                Los cambios se guardan solos para {{ whoLabel() }}.
              }
            </p>
            @if (markedWithoutHours().length > 0) {
              <p class="mt-3 p-2.5 rounded-lg bg-[#fff7ed] border border-[#fed7aa] text-[12px] text-[#92400e]">
                Marcó {{ markedWithoutHours().length }} día(s) sin horario configurado para ese día de la semana:
                <strong>{{ markedWithoutHours() }}</strong>.
                Se pueden marcar, pero no se podrán agendar citas hasta que les ponga hora de inicio y fin en
                "Jornadas Semanales" al lado.
              </p>
            }
            @if (markedCount() === 0) {
              <p class="mt-3 p-2.5 rounded-lg bg-[#fff7ed] border border-[#fed7aa] text-[12px] text-[#92400e]">
                {{ scopeIsAll() ? 'Ninguno de los médicos' : 'Este médico' }} tiene días marcados en este mes, así que
                no se podrá agendar ninguna cita en él. Marque fechas o use "Marcar según la jornada".
              </p>
            }
          </div>

          <!-- Mitad derecha: jornadas semanales -->
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-2.5 pb-3 mb-4 border-b border-[#eceef0]">
              <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#006a61] shrink-0">
                <span class="material-symbols-outlined text-[20px]">schedule</span>
              </span>
              <div class="min-w-0">
                <h3 class="text-[16px] font-bold text-[#191c1e]">Jornadas Semanales y Horarios de Atención</h3>
                <p class="text-[12px] text-[#45464d]">Horario y capacidad de cada día que el médico atiende</p>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-[12px] border-collapse min-w-[700px]">
                <thead>
                  <tr class="border-b border-[#eceef0] text-[#76777d] uppercase text-[11px] font-bold tracking-wider">
                    <th class="py-2.5 px-3">Día</th>
                    <th class="py-2.5 px-3">Horario</th>
                    <th class="py-2.5 px-3 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <span>Cupos</span>
                        <input
                          type="number"
                          min="0"
                          max="999"
                          [value]="defaultCapacity()"
                          (change)="onDefaultCapacityChange($event)"
                          title="Se aplica a todos los días. Si un día necesita otro número, cámbialo en su fila."
                          class="w-20 px-2 py-1 rounded-md border border-[#006a61] text-[13px] font-bold text-[#006a61] text-right focus:outline-none focus:ring-2 focus:ring-[#006a61]/30"
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#eceef0]">
                  @for (day of scheduleDays(); track day.dayOfWeek; let idx = $index) {
                    <tr class="transition-colors"
                      [class.opacity-60]="!day.enabled && !isDivergent(day.dayOfWeek)"
                      [class.bg-[#fffaf3]]="isDivergent(day.dayOfWeek)"
                    >
                      <td class="py-3 px-3">
                        <div class="flex items-center gap-2.5">
                          <app-switch [checked]="day.enabled" (toggled)="toggleDay(idx)" size="sm" />
                          <span class="font-bold text-[13px] text-[#191c1e]">{{ day.day }}</span>
                          @if (isDivergent(day.dayOfWeek)) {
                            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ffedd5] text-[#9a3412] uppercase tracking-wide">
                              difieren
                            </span>
                          }
                        </div>
                      </td>
                      <td class="py-3 px-3">
                        @if (day.enabled || isDivergent(day.dayOfWeek)) {
                          <div class="flex flex-col gap-1">
                            <div class="flex items-center gap-1.5">
                              <input
                                type="time"
                                [value]="day.startTime"
                                (change)="onTimeChange(idx, 'startTime', $event)"
                                class="px-2 py-1 rounded-md border border-[#d7d9dc] text-[12px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                              />
                              <span class="text-[#76777d]">-</span>
                              <input
                                type="time"
                                [value]="day.endTime"
                                (change)="onTimeChange(idx, 'endTime', $event)"
                                class="px-2 py-1 rounded-md border border-[#d7d9dc] text-[12px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                              />
                            </div>
                            @if (isDivergent(day.dayOfWeek)) {
                              <span class="text-[11px] text-[#9a3412] leading-snug" [title]="divergenceDetail(day.dayOfWeek)">
                                Cada médico tiene un horario. Escriba aquí para dejar el mismo para todos.
                              </span>
                            }
                          </div>
                        } @else {
                          <span class="text-[#76777d] italic">Sin jornada</span>
                        }
                      </td>
                      <td class="py-3 px-3 text-right">
                        @if (day.enabled || isDivergent(day.dayOfWeek)) {
                          <input
                            type="number"
                            min="0"
                            max="999"
                            [value]="day.totalCapacity"
                            (change)="onCapacityChange(idx, $event)"
                            [title]="day.totalCapacity === defaultCapacity() ? 'Mismo valor para todos los días' : 'Excepción: solo ' + day.day.toLowerCase() + ' tiene ' + day.totalCapacity + ' cupos'"
                            class="w-20 px-2 py-1 rounded-md border text-[13px] font-bold text-right focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                            [class.border-[#d7d9dc]]="day.totalCapacity === defaultCapacity()"
                            [class.text-[#006a61]]="day.totalCapacity === defaultCapacity()"
                            [class.border-[#b45309]]="day.totalCapacity !== defaultCapacity()"
                            [class.text-[#b45309]]="day.totalCapacity !== defaultCapacity()"
                            [class.bg-[#fff7ed]]="day.totalCapacity !== defaultCapacity()"
                          />
                        } @else {
                          <span class="text-[#76777d]">0</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="mt-4 pt-3 border-t border-[#eceef0] flex flex-col sm:flex-row items-center justify-between text-[12px] text-[#45464d] gap-2">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-[#006a61]">info</span>
                El campo de arriba aplica el mismo número de cupos a todos los días. Solo cámbielo en la fila de un día si ese día necesita otro.
              </span>
            </div>
              </div>
            </div>
          </div>

          <!-- Ausencias: ancho completo, debajo del card de arriba. -->
          <div class="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-[#e6e8ea]">
            <div class="flex items-center gap-2.5 pb-3 mb-4 border-b border-[#eceef0]">
              <span class="w-8 h-8 rounded-lg bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
                <span class="material-symbols-outlined text-[20px]">event_busy</span>
              </span>
              <div>
                <h3 class="text-[16px] font-bold text-[#191c1e]">Bloqueos de Disponibilidad y Ausencias Programadas</h3>
                <p class="text-[12px] text-[#45464d]">
                  Vacaciones, congresos y pausas periódicas validadas. Se muestran las de {{ whoLabelPublic() }} y los cierres de clínica.
                </p>
              </div>
            </div>
            <div class="flex flex-col gap-3">
              @for (abs of scopedAbsences(); track abs.id) {
                <div class="p-4 rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div class="flex items-start gap-3">
                    <span class="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-[#006a61] shadow-xs shrink-0 mt-0.5">
                      <span class="material-symbols-outlined text-[20px]">{{ abs.iconName }}</span>
                    </span>
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-[13px] font-bold text-[#191c1e]">{{ abs.reason }}</span>
                        <app-badge variant="teal" size="sm">{{ abs.type }}</app-badge>
                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                          [class]="abs.doctorId ? 'bg-[#e0f2fe] text-[#075985]' : 'bg-[#f3e8ff] text-[#6b21a8]'">
                          {{ abs.doctorId ? (doctorName(abs.doctorId)) : 'Todo la clínica' }}
                        </span>
                      </div>
                      <p class="text-[12px] text-[#45464d] mt-0.5">{{ abs.period }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 self-end md:self-center">
                    <span class="text-[11px] text-[#006a61] font-semibold bg-white px-2.5 py-1 rounded-md border border-[#e0e3e5]">{{ abs.validationStatus }}</span>
                    <button type="button" (click)="removeAbsence(abs.id)" class="p-1.5 text-[#76777d] hover:text-[#ba1a1a] rounded transition-colors" title="Eliminar bloqueo">
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <app-toast />
    </div>
  `,
})
export class DoctorConfigComponent implements OnInit {
  nav = inject(NavigationService);
  data = inject(MockDataService);
  api = inject(ApiService);
  toast = inject(ToastService);

  scheduleDays = signal<DaySchedule[]>([...this.data.schedule()]);
  absences = signal([...this.data.absences()]);
  loading = signal(true);
  saving = signal(false);

  /**
   * A quien aplica lo que se edita. 'all' es la configuracion grupal: lo que
   * se marca o se guarda se escribe en los tres medicos. Por eso no se usa el
   * `data.doctor` fijo, que siempre fue uno solo.
   */
  readonly scope = signal<'all' | string>('all');

  /** Medicos que reciben los cambios del scope actual. */
  readonly targetDoctorIds = computed<string[]>(() => {
    const current = this.scope();
    return current === 'all' ? this.data.doctors().map(d => d.id) : [current];
  });

  readonly scopeIsAll = computed(() => this.scope() === 'all');

  readonly scopeLabel = computed(() => {
    if (this.scopeIsAll()) return `Configurando los ${this.data.doctors().length} médicos a la vez`;
    // Se resuelve desde el scope y no desde el medico del sidebar: son
    // independientes y aqui manda el que se esta configurando.
    return this.doctorName(this.scope());
  });

  /** Jornada de un solo medico, para cuando el scope es individual. */
  ngOnInit(): void {
    this.loadScope();
  }

  /**
   * Carga las jornadas y los dias marcados de los medicos del scope. En modo
   * grupal son tres peticiones en paralelo; con tres medicos da igual de
   * lento que fuera una sola.
   */
  private loadScope(): void {
    this.loading.set(true);
    const ids = this.targetDoctorIds();
    forkJoin({
      schedules: forkJoin(ids.map(id => this.data.loadScheduleFor(id))),
      dates: forkJoin(ids.map(id => this.data.getDoctorWorkingDates(id))),
    }).subscribe({
      next: ({ schedules, dates }) => {
        const byDoctor: Record<string, DaySchedule[]> = {};
        schedules.forEach((days, i) => (byDoctor[ids[i]] = days));
        this.schedulesByDoctor.set(byDoctor);
        this.scheduleDays.set(this.mergeSchedules(ids, byDoctor));

        const byDates: Record<string, Set<string>> = {};
        dates.forEach((list, i) => (byDates[ids[i]] = new Set(list.map(d => d.date))));
        this.markedByDoctor.set(byDates);

        this.touchedRows.set(new Set());
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.show('No se pudo cargar la disponibilidad', 'Revise la conexión e intente de nuevo.');
      },
    });
  }

  onSelectScope(id: 'all' | string): void {
    if (this.scope() === id) return;
    this.rangeAnchor.set(null);
    // El aviso de guardado grupal es por intento, no permanente: cambiar de
    // medico tiene que pedir confirmacion de nuevo.
    this.confirmedSave = false;
    this.scope.set(id);
    this.loadScope();
  }

  toggleDay(dayIndex: number): void {
    const day = this.scheduleDays()[dayIndex];
    if (day) this.touchRow(day.dayOfWeek);
    this.scheduleDays.update(days =>
      days.map((d, idx) => (idx === dayIndex ? { ...d, enabled: !d.enabled } : d))
    );
  }

  toggleDayByDayOfWeek(dayOfWeek: number): void {
    this.touchRow(dayOfWeek);
    this.scheduleDays.update(days =>
      days.map(day => (day.dayOfWeek === dayOfWeek ? { ...day, enabled: !day.enabled } : day))
    );
  }

  readonly anyDayEnabled = computed(() => this.scheduleDays().some(day => day.enabled));

  // ---- jornadas de varios medicos ----

  schedulesByDoctor = signal<Record<string, DaySchedule[]>>({});
  /** Filas que el usuario toco. Lo que no se toco no se sobrescribe al guardar. */
  touchedRows = signal<Set<number>>(new Set());

  private touchRow(dayOfWeek: number): void {
    this.touchedRows.update(s => new Set(s).add(dayOfWeek));
  }

  /**
   * Una fila muestra el valor solo si todos los medicos del scope coinciden.
   * Si difieren queda vacia y avisada, para no decidir por el usuario que
   * valor es el bueno.
   */
  private mergeSchedules(ids: string[], byDoctor: Record<string, DaySchedule[]>): DaySchedule[] {
    const lists = ids.map(id => byDoctor[id]).filter(Boolean);
    const base = lists[0] ?? [];
    return base.map(day => {
      const same = lists.every(list => {
        const other = list.find(d => d.dayOfWeek === day.dayOfWeek);
        return other && other.enabled === day.enabled
          && (other.startTime ?? '') === (day.startTime ?? '')
          && (other.endTime ?? '') === (day.endTime ?? '')
          && other.totalCapacity === day.totalCapacity;
      });
      return same ? { ...day } : { ...day, enabled: false, startTime: '', endTime: '', totalCapacity: 0 };
    });
  }

  /** Si una fila del scope tiene valores distintos entre medicos. */
  isDivergent(dayOfWeek: number): boolean {
    const ids = this.targetDoctorIds();
    if (ids.length < 2) return false;
    const values = ids.map(id => {
      const day = (this.schedulesByDoctor()[id] ?? []).find(d => d.dayOfWeek === dayOfWeek);
      return day ? `${day.enabled}|${day.startTime}|${day.endTime}|${day.totalCapacity}` : '';
    });
    return new Set(values).size > 1;
  }

  /** Como va cada medico en una fila divergente, para poder decidir. */
  divergenceDetail(dayOfWeek: number): string {
    return this.targetDoctorIds()
      .map(id => {
        const day = (this.schedulesByDoctor()[id] ?? []).find(d => d.dayOfWeek === dayOfWeek);
        const name = this.doctorName(id);
        if (!day || !day.enabled) return `${name}: sin jornada`;
        return `${name}: ${day.startTime} a ${day.endTime} (${day.totalCapacity} cupos)`;
      })
      .join(' · ');
  }

  // ---- dias a laborar (fechas marcadas) ----

  /**
   * Fechas marcadas por medico. Se guardan todas, no solo el mes visible,
   * porque al aplicar un rango el backend reemplaza el conjunto completo: si
   * mandamos solo el mes en pantalla, el resto de los meses se borrarian.
   */
  markedByDoctor = signal<Record<string, Set<string>>>({});
  markingMonth = signal<Date>(new Date());
  /** Primer clic de un rango. El segundo clic cierra el rango. */
  rangeAnchor = signal<string | null>(null);
  /** El primer clic ya marco un dia: el siguiente lo cierra hasta donde se llegue. */
  rangeArmed = signal(false);
  markingSchedule = signal(false);
  savingDays = signal(false);
  readonly weekLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  /**
   * Cuantas de las fechas del mes actual tienen marcados los medicos del
   * scope. 'full' es todos, 'partial' es algunos: en ese estado el celda lo
   * muestra a medias y un clic la completa para todos.
   */
  readonly cellState = computed(() => {
    const ids = this.targetDoctorIds();
    const marked = this.markedByDoctor();
    const month = this.markingMonth();
    const map = new Map<string, 'full' | 'partial' | 'none'>();
    for (const date of this.markedDatesInMonth(month)) {
      const count = ids.filter(id => marked[id]?.has(date)).length;
      map.set(date, count === 0 ? 'none' : count === ids.length ? 'full' : 'partial');
    }
    return map;
  });

  readonly markedCount = computed(() => this.markedCountFor(this.markingMonth()));

  /** Dias de un mes con al menos un medico del scope marcado, sin repetir. */
  private markedCountFor(month: Date): number {
    const ids = this.targetDoctorIds();
    const marked = this.markedByDoctor();
    return this.markedDatesInMonth(month).filter(date =>
      ids.some(id => marked[id]?.has(date)),
    ).length;
  }

  /** Medicos del scope que tienen marcada una fecha, para el title de la celda. */
  markedDoctorNames(date: string): string {
    const marked = this.markedByDoctor();
    return this.targetDoctorIds()
      .filter(id => marked[id]?.has(date))
      .map(id => this.doctorName(id))
      .join(', ');
  }

  /** Estado de la celda: 'full' la tienen todos, 'partial' algunos, 'none' nadie. */
  stateOf(date: string): 'full' | 'partial' | 'none' {
    return this.cellState().get(date) ?? 'none';
  }

  private doctorName(id: string): string {
    return this.data.doctors().find(d => d.id === id)?.shortName ?? id;
  }

  private markedDatesInMonth(month: Date): string[] {
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const marked = this.markedByDoctor();
    const all = new Set<string>();
    for (const set of Object.values(marked)) for (const d of set) all.add(d);
    return [...all].filter(date => {
      const [y, m] = date.split('-').map(Number);
      return y === month.getFullYear() && m === month.getMonth() + 1;
    }).sort();
  }

  readonly markingMonthLabel = computed(() => monthLabel(this.markingMonth()));

  readonly markingLead = computed(() => {
    const first = new Date(this.markingMonth().getFullYear(), this.markingMonth().getMonth(), 1);
    return (first.getDay() + 6) % 7;
  });

  /**
   * Ultima fecha en la que se puede marcar. Se_markean hasta 3 meses despues
   * del mes actual: el mes vigente mas los tres siguientes.
   */
  readonly maxMarkableDate = computed(() => {
    const now = new Date();
    return toDateStr(new Date(now.getFullYear(), now.getMonth() + MONTHS_AHEAD + 1, 0));
  });

  /** Meses navegables en la tira: el actual mas los 3 siguientes. */
  readonly monthStrip = computed(() => {
    const now = new Date();
    const months = [];
    for (let i = 0; i <= MONTHS_AHEAD; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({ date: d, label: MONTH_SHORT[d.getMonth()], full: monthLabel(d) });
    }
    return months;
  });

  /** Dias marcados de cada mes de la tira, para el scope activo. */
  readonly monthStripCounts = computed(() => {
    const tally: Record<string, number> = {};
    for (const m of this.monthStrip()) tally[this.stripKey(m.date)] = this.markedCountFor(m.date);
    return tally;
  });

  /** Ultimo mes programable: el mes actual mas MONTHS_AHEAD. */
  readonly maxMarkableMonth = computed(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + MONTHS_AHEAD, 1);
  });

  /** Dias entre hoy y el final de la ventana programable, ambos inclusive. */
daysUntilHorizon(): number {
    const ms =
      new Date(`${this.maxMarkableDate()}T00:00:00`).getTime() -
      new Date(`${todayStr()}T00:00:00`).getTime();
    return Math.floor(ms / 86400000) + 1;
  }

  /** El mes visible sigue dentro de la ventana programable? */
  readonly monthIsProgramable = computed(() => {
    const m = this.markingMonth();
    return m.getTime() <= this.maxMarkableMonth().getTime();
  });

  readonly markingCells = computed(() => {
    const month = this.markingMonth();
    const lead = this.markingLead();
    const start = new Date(month.getFullYear(), month.getMonth(), 1 - lead);
    const today = todayStr();
    const horizon = this.maxMarkableDate();
    const cells: Array<{
      date: string;
      dayNumber: number;
      past: boolean;
      outside: boolean;
      locked: boolean;
    }> = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const date = toDateStr(d);
      // fuera = pertenece al mes anterior o siguiente. Las del inicio existen
      // solo para alinear las columnas; en cuanto aparece una despues de haber
      // entrado al mes, el mes ya termino y no hay nada que agregar.
      const outside = d.getMonth() !== month.getMonth() || d.getFullYear() !== month.getFullYear();
      if (outside && cells.some(c => !c.outside)) break;
      cells.push({
        date,
        dayNumber: d.getDate(),
        past: date < today,
        outside,
        locked: outside || date > horizon,
      });
    }
    return cells;
  });

  readonly rangeHint = computed(() => {
    const anchor = this.rangeAnchor();
    if (!anchor) return '';
    const who = this.scopeIsAll() ? 'los médicos del grupo' : this.doctorName(this.scope());
    return `Rango iniciado en ${anchor}. Elija el día final y se marcará para ${who}.`;
  });

  isInRange(date: string): boolean {
    const anchor = this.rangeAnchor();
    if (!anchor) return false;
    return date > anchor;
  }

  /**
   * Dias marcados cuyo dia de la semana no tiene horario. Marcarlos es valido,
   * pero sin horas no se pueden agendar citas, asi que se avisa antes de que
   * el medico descubra eso en la pantalla de reserva.
   */
  readonly markedWithoutHours = computed(() => {
    const enabled = new Set(this.scheduleDays().filter(d => d.enabled).map(d => d.dayOfWeek));
    const labels: string[] = [];
    for (const date of this.markedDatesInMonth(this.markingMonth())) {
      if (this.stateOf(date) === 'none') continue;
      if (enabled.has(isoDayOfWeekOf(date))) continue;
      labels.push(`${Number(date.slice(8, 10))}/${date.slice(5, 7)}`);
    }
    return labels;
  });

  shiftMarkingMonth(delta: number): void {
    const m = this.markingMonth();
    const next = new Date(m.getFullYear(), m.getMonth() + delta, 1);
    // No se navega mas alla de la ventana programable; hacia atras si se
    // permite, para poder revisar meses ya criados sin poder editarlos.
    if (delta > 0 && next.getTime() > this.maxMarkableMonth().getTime()) return;
    this.markingMonth.set(next);
    this.rangeAnchor.set(null);
  }

  /** 'YYYY-MM', clave de mes que usan la tira y los contadores. */
  stripKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  goToMonth(d: Date): void {
    this.markingMonth.set(new Date(d.getFullYear(), d.getMonth(), 1));
    this.rangeAnchor.set(null);
  }

  goToCurrentMonth(): void {
    const now = new Date();
    this.markingMonth.set(new Date(now.getFullYear(), now.getMonth(), 1));
    this.rangeAnchor.set(null);
  }

  isCurrentMarkingMonth(): boolean {
    const now = new Date();
    return (
      this.markingMonth().getFullYear() === now.getFullYear() &&
      this.markingMonth().getMonth() === now.getMonth()
    );
  }

  /**
   * Un clic marca o desmarca. Dos clics en dias distintos marcan todo el rango
   * intermedio: es la forma rapida de decir "del 5 al 10". En modo grupal cada
   * cambio se escribe en los tres medicos.
   */
  onMarkingDayClick(date: string): void {
    if (date < todayStr()) return;
    // Fuera de la ventana de programacion no se escribe nada.
    if (date > this.maxMarkableDate()) {
      this.toast.show(
        'Fuera del periodo programable',
        `Se puede marcar hasta el ${this.maxMarkableDate().split('-').reverse().join('/')}.`,
      );
      return;
    }

    const anchor = this.rangeAnchor();
    if (anchor) {
      // Segundo clic: cierra el rango. Si es el mismo dia, solo cancela.
      this.rangeAnchor.set(null);
      this.rangeArmed.set(false);
      if (anchor !== date) {
        const [from, to] = anchor < date ? [anchor, date] : [date, anchor];
        this.applyRange(from, to);
      }
      return;
    }

    // Primer clic: marca o desmarca, y deja el rango armado para que el
    // siguiente clic lo cierre hasta donde se llegue.
    this.setMarked(date, this.stateOf(date) !== 'full');
    this.rangeArmed.set(true);
  }

  /**
   * Fechas de un dia de la semana dentro del mes en pantalla. Los dias ya
   * pasados se excluyen porque no se pueden marcar.
   */
  weekdayDates(dayOfWeek: number): string[] {
    const month = this.markingMonth();
    const prefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    return this.markingCells()
      .filter(c => c.date.startsWith(prefix) && !c.past && !c.outside)
      .filter(c => c.date <= this.maxMarkableDate())
      .filter(c => isoDayOfWeekOf(c.date) === dayOfWeek)
      .map(c => c.date);
  }

  /** Estado del encabezado: si todos los de ese dia estan marcados, se resalta. */
  weekdayState(dayOfWeek: number): 'full' | 'partial' | 'none' {
    const dates = this.weekdayDates(dayOfWeek);
    if (!dates.length) return 'none';
    const full = dates.filter(d => this.stateOf(d) === 'full').length;
    if (full === 0) return 'none';
    return full === dates.length ? 'full' : 'partial';
  }

  /**
   * Clic en el encabezado del dia de la semana: marca o desmarca todas las
   * fechas de ese dia en el mes visible, como si se hubieran marcado una por
   * una. Se escribe una sola vez por medico con el conjunto completo, igual
   * que el rango, para no disparar una peticion por cada dia del mes.
   */
  toggleWeekday(dayOfWeek: number): void {
    const dates = this.weekdayDates(dayOfWeek);
    if (!dates.length) return;

    const unmark = this.weekdayState(dayOfWeek) === 'full';
    const ids = this.targetDoctorIds();
    const current = this.markedByDoctor();

    this.savingDays.set(true);
    this.markedByDoctor.update(all => {
      const next: Record<string, Set<string>> = {};
      for (const [id, set] of Object.entries(all)) next[id] = new Set(set);
      for (const id of ids) {
        for (const d of dates) {
          if (unmark) next[id]?.delete(d);
          else next[id]?.add(d);
        }
      }
      return next;
    });

    forkJoin(
      ids.map(id => {
        const complete = new Set(current[id] ?? []);
        for (const d of dates) {
          if (unmark) complete.delete(d);
          else complete.add(d);
        }
        return this.data.setDoctorWorkingDates(
          id,
          [...complete].map(d => ({ date: d, note: null })),
        );
      }),
    ).subscribe({
      next: () => {
        this.savingDays.set(false);
        const name = this.weekLabels[dayOfWeek - 1];
        this.toast.show(
          unmark ? `${name} desmarcado` : `${name} marcado`,
          `${dates.length} días de ${name} para ${this.whoLabel()}.`,
        );
      },
      error: () => {
        this.savingDays.set(false);
        this.loadScope();
        this.toast.show('No se pudo cambiar el día de la semana', this.failureHint(ids));
      },
    });
  }

  private setMarked(date: string, marked: boolean): void {
    const ids = this.targetDoctorIds();
    this.savingDays.set(true);
    this.patchMarkedOptimistically(ids, date, marked);

    forkJoin(
      ids.map(id => this.data.toggleDoctorWorkingDate(id, date, marked)),
    ).subscribe({
      next: () => {
        this.savingDays.set(false);
      },
      error: () => {
        this.savingDays.set(false);
        this.loadScope();
        this.toast.show(
          'No se pudo cambiar el día',
          this.failureHint(ids),
        );
      },
    });
  }

  /** Escribe en memoria antes de la respuesta, y revierte si el backend dice que no. */
  private patchMarkedOptimistically(ids: string[], date: string, marked: boolean): void {
    this.markedByDoctor.update(current => {
      const next: Record<string, Set<string>> = {};
      for (const [id, set] of Object.entries(current)) next[id] = new Set(set);
      for (const id of ids) {
        if (marked) next[id]?.add(date);
        else next[id]?.delete(date);
      }
      return next;
    });
  }

  /**
   * Marca un rango. El PUT reemplaza el conjunto completo del medico, asi que
   * se manda todo lo que tiene marcado (no solo el mes en pantalla) mas el
   * rango, de lo contrario los demas meses quedarian vacios.
   */
  private applyRange(from: string, to: string): void {
    const ids = this.targetDoctorIds();
    const dates: string[] = [];
    const cursor = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    const horizon = this.maxMarkableDate();
    let truncated = false;
    while (cursor <= end) {
      const date = toDateStr(cursor);
      if (date > horizon) truncated = true;
      else dates.push(date);
      cursor.setDate(cursor.getDate() + 1);
    }
    if (!dates.length) {
      this.toast.show(
        'Fuera del periodo programable',
        `Se puede marcar hasta el ${horizon.split('-').reverse().join('/')}.`,
      );
      return;
    }
    const inRange = new Set(dates);
    const marked = this.markedByDoctor();

    this.savingDays.set(true);
    this.markedByDoctor.update(current => {
      const next: Record<string, Set<string>> = {};
      for (const [id, set] of Object.entries(current)) next[id] = new Set(set);
      for (const id of ids) {
        for (const d of inRange) next[id]?.add(d);
      }
      return next;
    });

    forkJoin(
      ids.map(id => {
        const complete = new Set(marked[id] ?? []);
        for (const d of inRange) complete.add(d);
        return this.data.setDoctorWorkingDates(
          id,
          [...complete].map(d => ({ date: d, note: null })),
        );
      }),
    ).subscribe({
      next: () => {
        this.savingDays.set(false);
        this.toast.show(
          `${dates.length} días marcados`,
          truncated
            ? `Del ${from} al ${horizon.split('-').reverse().join('/')} para ${this.whoLabel()}: el rango llegaba más allá de la ventana programable.`
            : `Del ${from} al ${to} para ${this.whoLabel()}.`,
        );
      },
      error: () => {
        this.savingDays.set(false);
        this.loadScope();
        this.toast.show('No se pudo marcar el rango', this.failureHint(ids));
      },
    });
  }

  private whoLabel(): string {
    return this.scopeIsAll() ? 'los tres médicos' : (this.data.selectedDoctor()?.shortName ?? 'el médico');
  }

  readonly whoLabelPublic = computed(() => this.whoLabel());

  /** Si una llamada falla, se avisa en plural: el problema es de grupo. */
  private failureHint(ids: string[]): string {
    if (ids.length === 1) return 'Intente de nuevo.';
    return 'Se recargó la pantalla con lo que sí quedó guardado. Intente de nuevo.';
  }

  markFromSchedule(): void {
    this.markingSchedule.set(true);
    const ids = this.targetDoctorIds();
    // 90 dias, no 60: con 60 el horizonte no avanzaria mas alla de donde
    // quedo la siembra y el boton pareceria no hacer nada. Se recorta al final
    // de la ventana programable para no escribir meses que el usuario no ve.
    const available = this.daysUntilHorizon();
    const days = Math.max(1, Math.min(90, available));
    forkJoin(ids.map(id => this.data.markFromSchedule(id, days))).subscribe({
      next: results => {
        this.markingSchedule.set(false);
        this.loadScope();
        const total = results.reduce((acc, r) => acc + r.marked, 0);
        this.toast.show(
          total > 0 ? `${total} días marcados` : 'No había días nuevos que marcar',
          `Se usaron los días de la semana que ${this.whoLabel()} tiene habilitados.`,
        );
      },
      error: () => {
        this.markingSchedule.set(false);
        this.loadScope();
        this.toast.show('No se pudieron marcar los días', this.failureHint(ids));
      },
    });
  }

  onTimeChange(dayIndex: number, field: 'startTime' | 'endTime', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const day = this.scheduleDays()[dayIndex];
    if (day) this.touchRow(day.dayOfWeek);
    this.scheduleDays.update(days =>
      days.map((d, idx) =>
        // Escribir una hora enciende el día: si no, una fila divergente que
        // el usuario no enciende se guardaria apagada para los tres.
        idx === dayIndex ? { ...d, [field]: value, enabled: d.enabled || !!value } : d,
      )
    );
  }

  onCapacityChange(dayIndex: number, event: Event): void {
    const value = Math.max(0, Number((event.target as HTMLInputElement).value) || 0);
    const day = this.scheduleDays()[dayIndex];
    if (day) this.touchRow(day.dayOfWeek);
    this.scheduleDays.update(days =>
      days.map((d, idx) =>
        idx === dayIndex ? { ...d, totalCapacity: value, enabled: d.enabled || value > 0 } : d,
      )
    );
  }

  /**
   * El numero que se repite en las filas. Se toma del primer dia habilitado
   * para que, al cambiarlo, un solo campo siga siendo la fuente de verdad.
   */
  readonly defaultCapacity = computed(() => {
    const first = this.scheduleDays().find(d => d.enabled);
    return first?.totalCapacity ?? 0;
  });

  /** Un solo campo para todos los dias: se escribe el mismo valor en cada fila. */
  onDefaultCapacityChange(event: Event): void {
    const value = Math.max(0, Math.min(999, Number((event.target as HTMLInputElement).value) || 0));
    // Toca todas las filas: el valor se escribe en cada dia, asi que al
    // guardar hay que escribirlas todas en cada medico.
    this.touchedRows.set(new Set(this.scheduleDays().map(d => d.dayOfWeek)));
    this.scheduleDays.update(days => days.map(day => ({ ...day, totalCapacity: value })));
    this.toast.show(
      'Cupos aplicados a todos los días',
      'Se guardan al presionar el botón de guardar.',
    );
  }

  /**
   * Ausencias del scope. Se incluyen las que no tienen medico, porque un
   * cierre de clinica (feriado) le importa a todos los que se estan
   * configurando, no solo a uno.
   */
  readonly scopedAbsences = computed(() => {
    const all = this.absences();
    if (this.scopeIsAll()) return all;
    const id = this.scope();
    return all.filter(a => !a.doctorId || a.doctorId === id);
  });

  /** Elimina el bloqueo de verdad; si el servidor lo rechaza, el bloque sigue. */
  removeAbsence(id: string): void {
    this.api.delete<{ ok: boolean }>(`/config/absences/${id}`).subscribe({
      next: () => {
        this.absences.update(abs => abs.filter(a => a.id !== id));
        this.toast.show('Bloqueo Eliminado', 'Horario liberado para agendamiento.');
      },
      error: (err: Error) => this.toast.show('No se pudo eliminar el bloqueo', err.message),
    });
  }

  /**
   * Guarda la jornada. En modo grupal cada medico recibe su propia copia, y
   * las filas que NO se tocaron conservan el valor que ya tenia cada uno: si el
   * lunes es 08:00 para Mawad y 09:00 para Aguirre, guardar sin tocar esa fila
   * no puede dejar a los dos con lo mismo.
   */
  handleSaveAllConfig(): void {
    const ids = this.targetDoctorIds();
    if (ids.length > 1 && !this.confirmedSave) {
      this.confirmedSave = true;
      this.toast.show(
        `Se guardará en ${ids.length} médicos`,
        'Presione Guardar otra vez para confirmar, o cambie a un solo médico.',
      );
      return;
    }
    this.confirmedSave = false;

    this.saving.set(true);
    const touched = this.touchedRows();
    const shown = this.scheduleDays();

    forkJoin(
      ids.map(id => {
        const current = this.schedulesByDoctor()[id] ?? [];
        const payload = shown.map(day => {
          const own = current.find(d => d.dayOfWeek === day.dayOfWeek);
          const keepOwn = !touched.has(day.dayOfWeek) && own;
          return keepOwn ? own : day;
        });
        return this.data.saveScheduleFor(id, payload).pipe(
          tap(days => this.schedulesByDoctor.update(all => ({ ...all, [id]: days }))),
        );
      }),
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.touchedRows.set(new Set());
        this.loadScope();
        this.toast.show(
          'Configuración Guardada',
          `La jornada quedó actualizada para ${this.whoLabel()}.`,
        );
      },
      error: (err: Error) => {
        this.saving.set(false);
        this.loadScope();
        this.toast.show('No se pudo guardar', err.message);
      },
    });
  }

  /** El primer clic de guardar en grupo pide confirmacion, el segundo escribe. */
  private confirmedSave = false;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 1 = lunes ... 7 = domingo, igual que day_of_week en la base. */
function isoDayOfWeekOf(dateStr: string): number {
  return ((new Date(`${dateStr}T00:00:00`).getDay() + 6) % 7) + 1;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Meses hacia adelante en los que se puede seguir programando. */
const MONTHS_AHEAD = 3;

function monthLabel(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}
