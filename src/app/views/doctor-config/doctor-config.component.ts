import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { NavigationService } from '../../core/services/navigation.service';
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
          <div class="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-[#e6e8ea]">
            <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              <div class="flex items-start gap-4">
                <div class="w-20 h-20 rounded-2xl bg-[#006a61] text-white flex items-center justify-center text-[26px] font-bold ring-2 ring-[#eceef0] shadow-sm shrink-0">
                  {{ data.getInitials(data.doctor.name) }}
                </div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h2 class="text-[18px] font-bold text-[#191c1e] tracking-tight">{{ data.doctor.name }}</h2>
                    <app-badge variant="success">MINSAL / SIS Validadas</app-badge>
                  </div>
                  <p class="text-[13px] text-[#45464d] mt-0.5">{{ data.doctor.specialty }} · Equipo MedControl</p>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[12px] text-[#45464d]">
                    <span>Jornada: <strong class="text-[#191c1e]">08:00 - 16:00</strong></span>
                    <span>•</span>
                    <span>Capacidad: <strong class="text-[#191c1e]">{{ totalWeeklyCapacity() }} pacientes/sem</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-[#e6e8ea]">
            <div class="flex items-center gap-2.5 pb-3 mb-4 border-b border-[#eceef0]">
              <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#006a61]">
                <span class="material-symbols-outlined text-[20px]">calendar_month</span>
              </span>
              <div class="flex-1">
                <h3 class="text-[16px] font-bold text-[#191c1e]">Días a Laborar</h3>
                <p class="text-[12px] text-[#45464d]">
                  Marque las fechas en las que este médico atiende. Solo esas fechas se pueden agendar.
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="markFromSchedule()"
                  [disabled]="markingSchedule()"
                  class="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-[#f2f4f6] text-[#191c1e] border border-[#e0e3e5] hover:bg-[#e8eaec] disabled:opacity-50"
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
              </div>
              <span class="text-[12px] text-[#45464d]">
                <strong class="text-[#006a61]">{{ markedCount() }}</strong> días marcados
                @if (rangeAnchor() && rangeHint()) {
                  <span class="ml-2 text-[#92400e]">{{ rangeHint() }}</span>
                }
              </span>
            </div>

            <div class="grid grid-cols-7 gap-1 mb-1">
              @for (d of weekLabels; track d) {
                <span class="text-center text-[11px] font-bold text-[#76777d] uppercase">{{ d }}</span>
              }
            </div>
            <div class="grid grid-cols-7 gap-1">
              @for (blank of [].constructor(markingLead()); track $index) {
                <span class="aspect-square"></span>
              }
              @for (cell of markingCells(); track cell.date) {
                <button
                  type="button"
                  (click)="onMarkingDayClick(cell.date)"
                  [disabled]="cell.past"
                  [class.bg-[#006a61]]="cell.marked"
                  [class.text-white]="cell.marked"
                  [class.bg-[#f7f9fb]]="!cell.marked"
                  [class.text-[#76777d]]="!cell.marked"
                  [class.opacity-40]="cell.past"
                  [class.cursor-not-allowed]="cell.past"
                  [class.ring-2]="isInRange(cell.date)"
                  [class.ring-[#006a61]/40]="isInRange(cell.date)"
                  class="aspect-square rounded-lg text-[12px] font-bold transition-colors hover:ring-2 hover:ring-[#006a61]/30"
                  [title]="cell.date + (cell.marked ? ' — marcado' : ' — sin marcar')"
                >
                  {{ cell.dayNumber }}
                </button>
              }
            </div>

            <p class="mt-3 text-[11px] text-[#76777d]">
              Clic en un día para marcarlo o desmarcarlo. Clic en uno y después en otro marca todo el rango.
            </p>
            @if (markedWithoutHours().length > 0) {
              <p class="mt-3 p-2.5 rounded-lg bg-[#fff7ed] border border-[#fed7aa] text-[12px] text-[#92400e]">
                Marcó {{ markedWithoutHours().length }} día(s) sin horario configurado para ese día de la semana:
                <strong>{{ markedWithoutHours() }}</strong>.
                Se pueden marcar, pero no se podrán agendar citas hasta que les ponga hora de inicio y fin en
                "Jornadas Semanales" más abajo.
              </p>
            }
            @if (markedCount() === 0) {
              <p class="mt-3 p-2.5 rounded-lg bg-[#fff7ed] border border-[#fed7aa] text-[12px] text-[#92400e]">
                Este médico no tiene ningún día marcado, así que no se podrá agendar ninguna cita.
                Marque fechas o use "Marcar según la jornada".
              </p>
            }
          </div>

          <div class="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-[#e6e8ea]">
            <div class="flex items-center gap-2.5 pb-3 mb-4 border-b border-[#eceef0]">
              <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#006a61]">
                <span class="material-symbols-outlined text-[20px]">schedule</span>
              </span>
              <div>
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
                    <th class="py-2.5 px-3 text-right">Capacidad Diaria</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#eceef0]">
                  @for (day of scheduleDays(); track day.dayOfWeek; let idx = $index) {
                    <tr class="transition-colors" [class.opacity-60]="!day.enabled">
                      <td class="py-3 px-3">
                        <div class="flex items-center gap-2.5">
                          <app-switch [checked]="day.enabled" (toggled)="toggleDay(idx)" size="sm" />
                          <span class="font-bold text-[13px] text-[#191c1e]">{{ day.day }}</span>
                        </div>
                      </td>
                      <td class="py-3 px-3">
                        @if (day.enabled) {
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
                        } @else {
                          <span class="text-[#76777d] italic">Sin jornada</span>
                        }
                      </td>
                      <td class="py-3 px-3 text-right">
                        @if (day.enabled) {
                          <input
                            type="number"
                            min="0"
                            max="999"
                            [value]="day.totalCapacity"
                            (change)="onCapacityChange(idx, $event)"
                            class="w-20 px-2 py-1 rounded-md border border-[#d7d9dc] text-[13px] font-bold text-[#006a61] text-right focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
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
                Capacidad Teórica Semanal: <strong>{{ totalWeeklyCapacity() }} Pacientes</strong>
              </span>
            </div>
          </div>

          <div class="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-[#e6e8ea]">
            <div class="flex items-center gap-2.5 pb-3 mb-4 border-b border-[#eceef0]">
              <span class="w-8 h-8 rounded-lg bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
                <span class="material-symbols-outlined text-[20px]">event_busy</span>
              </span>
              <div>
                <h3 class="text-[16px] font-bold text-[#191c1e]">Bloqueos de Disponibilidad y Ausencias Programadas</h3>
                <p class="text-[12px] text-[#45464d]">Vacaciones, congresos y pausas periódicas validadas</p>
              </div>
            </div>
            <div class="flex flex-col gap-3">
              @for (abs of absences(); track abs.id) {
                <div class="p-4 rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div class="flex items-start gap-3">
                    <span class="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-[#006a61] shadow-xs shrink-0 mt-0.5">
                      <span class="material-symbols-outlined text-[20px]">{{ abs.iconName }}</span>
                    </span>
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-[13px] font-bold text-[#191c1e]">{{ abs.reason }}</span>
                        <app-badge variant="teal" size="sm">{{ abs.type }}</app-badge>
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
  toast = inject(ToastService);

  scheduleDays = signal<DaySchedule[]>([...this.data.schedule()]);
  absences = signal([...this.data.absences()]);
  loading = signal(true);
  saving = signal(false);

  totalWeeklyCapacity = signal(
    this.data.schedule()
      .filter(d => d.enabled)
      .reduce((acc, curr) => acc + curr.totalCapacity, 0)
  );

  /** La jornada es por medico, asi que se pide la de este. */
  ngOnInit(): void {
    this.data.loadScheduleFor(this.data.doctor.id).subscribe({
      next: days => {
        this.scheduleDays.set(days);
        this.loading.set(false);
        this.recalculateCapacity();
      },
      error: () => {
        this.loading.set(false);
        this.toast.show('No se pudo cargar la jornada', 'Revise la conexión e intente de nuevo.');
      },
    });
    this.loadMarkedDates();
  }

  toggleDay(dayIndex: number): void {
    this.scheduleDays.update(days =>
      days.map((day, idx) => (idx === dayIndex ? { ...day, enabled: !day.enabled } : day))
    );
    this.recalculateCapacity();
  }

  /** Mismo toggle que la tabla, pero dirigido por dia de la semana. */
  toggleDayByDayOfWeek(dayOfWeek: number): void {
    this.scheduleDays.update(days =>
      days.map(day => (day.dayOfWeek === dayOfWeek ? { ...day, enabled: !day.enabled } : day))
    );
    this.recalculateCapacity();
  }

  readonly anyDayEnabled = computed(() => this.scheduleDays().some(day => day.enabled));

  // ---- dias a laborar (fechas marcadas) ----

  markedDates = signal<Set<string>>(new Set());
  markingMonth = signal<Date>(new Date());
  /** Primer clic de un rango. El segundo clic cierra el rango. */
  rangeAnchor = signal<string | null>(null);
  markingSchedule = signal(false);
  readonly weekLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  readonly markedCount = computed(() => this.markedDates().size);

  readonly markingMonthLabel = computed(() => {
    const m = this.markingMonth();
    const names = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return `${names[m.getMonth()]} ${m.getFullYear()}`;
  });

  readonly markingLead = computed(() => {
    const first = new Date(this.markingMonth().getFullYear(), this.markingMonth().getMonth(), 1);
    return (first.getDay() + 6) % 7;
  });

  readonly markingCells = computed(() => {
    const month = this.markingMonth();
    const lead = this.markingLead();
    const start = new Date(month.getFullYear(), month.getMonth(), 1 - lead);
    const marked = this.markedDates();
    const today = todayStr();
    const cells: Array<{ date: string; dayNumber: number; marked: boolean; past: boolean }> = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const date = toDateStr(d);
      cells.push({ date, dayNumber: d.getDate(), marked: marked.has(date), past: date < today });
    }
    return cells;
  });

  readonly rangeHint = computed(() => {
    const anchor = this.rangeAnchor();
    if (!anchor) return '';
    return `Rango iniciado en ${anchor}. Elija el día final.`;
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
    for (const cell of this.markingCells()) {
      if (!cell.marked) continue;
      if (enabled.has(isoDayOfWeekOf(cell.date))) continue;
      labels.push(`${cell.dayNumber}/${cell.date.slice(5, 7)}`);
    }
    return labels;
  });

  shiftMarkingMonth(delta: number): void {
    const m = this.markingMonth();
    this.markingMonth.set(new Date(m.getFullYear(), m.getMonth() + delta, 1));
    this.rangeAnchor.set(null);
    this.loadMarkedDates();
  }

  private loadMarkedDates(): void {
    const month = this.markingMonth();
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    this.data
      .getDoctorWorkingDates(this.data.doctor.id, toDateStr(month), toDateStr(new Date(month.getFullYear(), month.getMonth(), lastDay)))
      .subscribe({
        next: dates => this.markedDates.set(new Set(dates.map(d => d.date))),
        error: () => this.toast.show('No se pudieron cargar los días marcados', 'Intente de nuevo.'),
      });
  }

  /**
   * Un clic marca o desmarca. Dos clics seguidos, en dias distintos, marcan
   * todo el rango intermedio: es la forma rapida de decir "del 5 al 10".
   */
  onMarkingDayClick(date: string): void {
    const doctorId = this.data.doctor.id;
    if (date < todayStr()) return;

    const anchor = this.rangeAnchor();
    if (anchor && anchor !== date) {
      const [from, to] = anchor < date ? [anchor, date] : [date, anchor];
      this.rangeAnchor.set(null);
      this.applyRange(doctorId, from, to);
      return;
    }

    if (anchor === date) {
      this.rangeAnchor.set(null);
      return;
    }

    const marked = this.markedDates().has(date);
    // Optimista: el calendario responde al instante y se revierte si el backend
    // dice que no.
    this.markedDates.update(s => {
      const next = new Set(s);
      if (marked) next.delete(date);
      else next.add(date);
      return next;
    });
    this.data.toggleDoctorWorkingDate(doctorId, date, !marked).subscribe({
      error: () => {
        this.markedDates.update(s => {
          const next = new Set(s);
          if (marked) next.add(date);
          else next.delete(date);
          return next;
        });
        this.toast.show('No se pudo cambiar el día', 'Intente de nuevo.');
      },
    });
  }

  private applyRange(doctorId: string, from: string, to: string): void {
    const dates: Array<{ date: string }> = [];
    const cursor = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    while (cursor <= end) {
      dates.push({ date: toDateStr(cursor) });
      cursor.setDate(cursor.getDate() + 1);
    }
    const datesInRange = new Set(dates.map(d => d.date));
    this.markedDates.update(s => {
      const next = new Set(s);
      for (const d of datesInRange) next.add(d);
      return next;
    });
    this.data.setDoctorWorkingDates(doctorId, [...this.markedDates()].map(date => ({ date, note: null }))).subscribe({
      error: () => {
        this.loadMarkedDates();
        this.toast.show('No se pudo marcar el rango', 'Intente de nuevo.');
      },
    });
    this.toast.show(
      `${dates.length} días marcados`,
      `Del ${from} al ${to} el médico atenderá en esas fechas.`,
    );
  }

  markFromSchedule(): void {
    this.markingSchedule.set(true);
    // 90 dias, no 60: con 60 el horizonte no avanzaria mas alla de donde
    // quedo la siembra y el boton pareceria no hacer nada.
    this.data.markFromSchedule(this.data.doctor.id, 90).subscribe({
      next: r => {
        this.markingSchedule.set(false);
        this.loadMarkedDates();
        this.toast.show(
          r.marked > 0 ? `${r.marked} días marcados` : 'No había días nuevos que marcar',
          'Se usaron los días de la semana que el médico tiene habilitados.',
        );
      },
      error: () => {
        this.markingSchedule.set(false);
        this.toast.show('No se pudieron marcar los días', 'Intente de nuevo.');
      },
    });
  }

  onTimeChange(dayIndex: number, field: 'startTime' | 'endTime', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.scheduleDays.update(days =>
      days.map((day, idx) => (idx === dayIndex ? { ...day, [field]: value } : day))
    );
  }

  onCapacityChange(dayIndex: number, event: Event): void {
    const value = Math.max(0, Number((event.target as HTMLInputElement).value) || 0);
    this.scheduleDays.update(days =>
      days.map((day, idx) => (idx === dayIndex ? { ...day, totalCapacity: value } : day))
    );
    this.recalculateCapacity();
  }

  recalculateCapacity(): void {
    this.totalWeeklyCapacity.set(
      this.scheduleDays()
        .filter(d => d.enabled)
        .reduce((acc, curr) => acc + curr.totalCapacity, 0)
    );
  }

  removeAbsence(id: string): void {
    this.absences.update(abs => abs.filter(a => a.id !== id));
    this.toast.show('Bloqueo Eliminado', 'Horario liberado para agendamiento.');
  }

  handleSaveAllConfig(): void {
    this.saving.set(true);
    this.data.saveScheduleFor(this.data.doctor.id, this.scheduleDays()).subscribe({
      next: days => {
        this.scheduleDays.set(days);
        this.saving.set(false);
        this.toast.show('Configuración Guardada', 'La jornada quedó actualizada y afecta los horarios de reserva.');
      },
      error: (err: Error) => {
        this.saving.set(false);
        this.toast.show('No se pudo guardar', err.message);
      },
    });
  }
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
