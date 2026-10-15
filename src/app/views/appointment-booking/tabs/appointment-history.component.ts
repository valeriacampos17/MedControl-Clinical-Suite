import { Component, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppointmentItem, AppointmentHistoryStats } from '../../../core/models/types';
import { PickerItem, SelectionPickerComponent } from '../../../shared/selection-picker/selection-picker.component';
import { ButtonComponent } from '../../../shared/button/button.component';
import { BadgeComponent } from '../../../shared/badge/badge.component';
import { ToastComponent } from '../../../shared/toast/toast.component';

type StatusChip = 'all' | 'completed' | 'pending' | 'no-show';

const PENDING_CSV = 'pending,confirmed,checked-in,in-triage,triaged,in-progress';

const WEEK_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const STATUS_META: Record<string, { label: string; variant: 'teal' | 'success' | 'warning' | 'error' | 'neutral' | 'info' }> = {
  pending: { label: 'Pendiente', variant: 'neutral' },
  confirmed: { label: 'Confirmada', variant: 'teal' },
  'checked-in': { label: 'En Recepción', variant: 'teal' },
  'in-triage': { label: 'En Triaje', variant: 'warning' },
  triaged: { label: 'Triage', variant: 'warning' },
  'in-progress': { label: 'En Curso', variant: 'info' },
  completed: { label: 'Completada', variant: 'success' },
  'no-show': { label: 'No Asistió', variant: 'error' },
};

@Component({
  selector: 'app-appointment-history',
  standalone: true,
  imports: [SelectionPickerComponent, ButtonComponent, BadgeComponent, ToastComponent],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-[16px] font-bold text-[#191c1e]">Historial de Citas</h2>
          <p class="text-[12px] text-[#45464d]">Listado completo de citas ordenado de más reciente a más antigua, con filtros por médico, paciente y rango de fechas</p>
        </div>
        <app-button variant="light" size="md" icon="filter_list_off" (click)="clearFilters()" [disabled]="!hasActiveFilters()">
          Limpiar Filtros
        </app-button>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="bg-white rounded-xl p-4 shadow-sm border border-[#e6e8ea]">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Total Filtradas</span>
            <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#006a61]">
              <span class="material-symbols-outlined text-[18px]">fact_check</span>
            </span>
          </div>
          <div class="mt-2 flex items-baseline">
            <span class="text-[28px] font-extrabold text-[#191c1e] leading-none">{{ stats() ? stats()!.total : '—' }}</span>
          </div>
        </div>

        <div class="bg-white rounded-xl p-4 shadow-sm border border-[#e6e8ea]">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Completadas</span>
            <span class="w-8 h-8 rounded-lg bg-[#86f2e4]/30 flex items-center justify-center text-[#006f66]">
              <span class="material-symbols-outlined text-[18px]">check_circle</span>
            </span>
          </div>
          <div class="mt-2 flex items-baseline">
            <span class="text-[28px] font-extrabold text-[#191c1e] leading-none">{{ stats() ? stats()!.completed : '—' }}</span>
          </div>
        </div>

        <div class="bg-white rounded-xl p-4 shadow-sm border border-[#e6e8ea]">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">No Finalizadas</span>
            <span class="w-8 h-8 rounded-lg bg-[#fffbeb] flex items-center justify-center text-[#b45309]">
              <span class="material-symbols-outlined text-[18px]">pending</span>
            </span>
          </div>
          <div class="mt-2 flex items-baseline">
            <span class="text-[28px] font-extrabold text-[#191c1e] leading-none">{{ stats() ? stats()!.notFinished : '—' }}</span>
          </div>
        </div>

        <div class="bg-white rounded-xl p-4 shadow-sm border border-[#e6e8ea]">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">% Asistencia</span>
            <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#006a61]">
              <span class="material-symbols-outlined text-[18px]">group</span>
            </span>
          </div>
          <div class="mt-2 flex items-baseline">
            <span class="text-[28px] font-extrabold text-[#191c1e] leading-none">{{ attendanceLabel() }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm border border-[#e6e8ea] flex flex-col gap-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Médico</label>
            <select
              [value]="filterDoctorId() ?? ''"
              (change)="onDoctorChange(($any($event.target)).value)"
              class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
            >
              <option value="">Todos los médicos</option>
              @for (doc of data.doctors(); track doc.id) {
                <option [value]="doc.id">{{ doc.name }}</option>
              }
            </select>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Paciente</label>
            <app-selection-picker
              icon="search"
              noun="paciente"
              placeholder="Buscar paciente por nombre o CI..."
              emptyMessage="No se encontraron pacientes con {term}"
              [searchKeys]="['name', 'ci']"
              [items]="patientItems()"
              [selectedId]="filterPatientId()"
              [bare]="true"
              (selectedChange)="onPatientChange($event)"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Desde</label>
            <input
              type="date"
              [value]="dateFrom()"
              (change)="onDateFromChange(($any($event.target)).value)"
              class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Hasta</label>
            <input
              type="date"
              [value]="dateTo()"
              (change)="onDateToChange(($any($event.target)).value)"
              class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
            />
          </div>
        </div>

        @if (dateRangeInvalid()) {
          <p class="text-[11.5px] text-[#b45309] bg-[#fff7ed] border border-[#fed7aa] rounded-lg px-3 py-2">
            La fecha "Desde" es posterior a la fecha "Hasta". Ajuste el rango para ver resultados.
          </p>
        }

        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider mr-1">Estado:</span>
          @for (chip of statusChips; track chip.id) {
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
              [class]="statusChip() === chip.id
                ? 'bg-[#006a61] text-white shadow-sm'
                : 'bg-white text-[#45464d] border border-[#e6e8ea] hover:bg-[#f2f4f6]'"
              (click)="setStatusChip(chip.id)"
            >
              {{ chip.label }}
            </button>
          }
        </div>
      </div>

      @if (error()) {
        <div class="p-4 rounded-xl bg-[#fef2f2] border border-[#fecaca] flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-[#991b1b]">
            <span class="material-symbols-outlined text-[18px]">error</span>
            <span class="text-[13px] font-semibold">{{ error() }}</span>
          </div>
          <app-button variant="danger" size="sm" icon="refresh" (click)="reload()">Reintentar</app-button>
        </div>
      }

      <div class="bg-white rounded-xl shadow-sm border border-[#e6e8ea] overflow-hidden">
        @if (loading() && groups().length === 0) {
          <div class="p-10 flex flex-col items-center gap-3 text-[#76777d]">
            <span class="material-symbols-outlined text-[32px] animate-spin">progress_activity</span>
            <span class="text-[13px]">Cargando historial de citas...</span>
          </div>
        } @else if (!loading() && groups().length === 0 && !error()) {
          <div class="p-10 text-center flex flex-col items-center gap-3">
            <span class="material-symbols-outlined text-[36px] text-[#c6c6cd]">event_busy</span>
            <p class="text-[13px] text-[#76777d]">Ninguna cita coincide con los filtros seleccionados.</p>
            <app-button variant="light" size="sm" icon="filter_list_off" (click)="clearFilters()">Limpiar Filtros</app-button>
          </div>
        } @else {
          @for (group of groups(); track group.date) {
            <div class="px-4 py-2.5 bg-[#f7f9fb] border-y border-[#eceef0] first:border-t-0">
              <span class="text-[12px] font-bold text-[#45464d] uppercase tracking-wider">{{ formatDayLabel(group.date) }}</span>
            </div>
            @for (row of group.rows; track row.id) {
              <div class="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-[#f2f4f6] hover:bg-[#f7f9fb] transition-colors last:border-b-0">
                <div class="w-20 shrink-0">
                  <span class="text-[13px] font-bold text-[#191c1e]">{{ row.time }}</span>
                  <p class="text-[11px] text-[#76777d]">{{ row.durationMinutes }} min</p>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-[13px] font-semibold text-[#191c1e] truncate">{{ data.getPatient(row.patientId)?.name ?? row.patientId }}</span>
                    <span class="text-[11px] text-[#76777d] shrink-0">{{ data.getPatient(row.patientId)?.age }} años</span>
                  </div>
                  <p class="text-[12px] text-[#45464d] truncate">{{ data.doctors().find(d => d.id === row.doctorId)?.name ?? row.doctorId }} · {{ row.reason }}</p>
                </div>
                <div class="shrink-0 self-end sm:self-center">
                  <app-badge [variant]="statusMeta(row.status).variant" size="sm">{{ statusMeta(row.status).label }}</app-badge>
                </div>
              </div>
            }
          }
          @if (items().length < total()) {
            <div class="p-4 flex justify-center border-t border-[#eceef0]">
              <app-button variant="light" size="md" icon="expand_more" [disabled]="loading()" (click)="loadMore()">
                {{ loading() ? 'Cargando...' : 'Cargar más (' + items().length + ' de ' + total() + ')' }}
              </app-button>
            </div>
          }
        }
      </div>

      <app-toast />
    </div>
  `,
})
export class AppointmentHistoryComponent {
  data = inject(MockDataService);
  private toast = inject(ToastService);

  readonly filterDoctorId = signal<string | null>(null);
  readonly filterPatientId = signal<string | null>(null);
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly statusChip = signal<StatusChip>('all');

  readonly items = signal<AppointmentItem[]>([]);
  readonly stats = signal<AppointmentHistoryStats | null>(null);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly statusChips: { id: StatusChip; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'completed', label: 'Completadas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'no-show', label: 'No-show' },
  ];

  private readonly PAGE_SIZE = 50;
  private readonly fetch$ = new Subject<number>();

  readonly patientItems = computed<PickerItem[]>(() =>
    this.data.patients().map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: `CI: ${p.ci} · ${p.age} años`,
      search: { name: p.name, ci: p.ci },
    })),
  );

  readonly dateRangeInvalid = computed(() => {
    const from = this.dateFrom();
    const to = this.dateTo();
    return !!from && !!to && from > to;
  });

  readonly hasActiveFilters = computed(
    () => !!this.filterDoctorId() || !!this.filterPatientId() || !!this.dateFrom() || !!this.dateTo() || this.statusChip() !== 'all',
  );

  readonly attendanceLabel = computed(() => {
    const pct = this.stats()?.attendancePct;
    return pct == null ? '—' : `${pct}%`;
  });

  readonly groups = computed(() => {
    const out: { date: string; rows: AppointmentItem[] }[] = [];
    for (const apt of this.items()) {
      const last = out[out.length - 1];
      if (last && last.date === apt.date) {
        last.rows.push(apt);
      } else {
        out.push({ date: apt.date, rows: [apt] });
      }
    }
    return out;
  });

  constructor() {
    this.fetch$
      .pipe(
        switchMap((offset) => {
          this.loading.set(true);
          return this.data.fetchAppointmentHistory(this.buildQuery(offset)).pipe(
            catchError((e: Error) => {
              this.error.set(e.message);
              this.toast.show('No se pudo cargar el historial de citas', 'error');
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (!res) return;
        this.error.set(null);
        this.stats.set(res.stats);
        this.total.set(res.total);
        if (res.appointments.length > 0 && this.items().length > 0 && res.appointments[0].id === this.items()[0].id) {
          this.items.update((prev) => [...prev, ...res.appointments]);
        } else {
          this.items.set(res.appointments);
        }
      });

    this.reload();
  }

  reload(): void {
    this.fetch$.next(0);
  }

  loadMore(): void {
    this.fetch$.next(this.items().length);
  }

  onDoctorChange(id: string): void {
    this.filterDoctorId.set(id || null);
    this.reload();
  }

  onPatientChange(id: string | null): void {
    this.filterPatientId.set(id);
    this.reload();
  }

  onDateFromChange(v: string): void {
    this.dateFrom.set(v);
    if (!this.dateRangeInvalid()) this.reload();
  }

  onDateToChange(v: string): void {
    this.dateTo.set(v);
    if (!this.dateRangeInvalid()) this.reload();
  }

  setStatusChip(chip: StatusChip): void {
    this.statusChip.set(chip);
    this.reload();
  }

  clearFilters(): void {
    this.filterDoctorId.set(null);
    this.filterPatientId.set(null);
    this.dateFrom.set('');
    this.dateTo.set('');
    this.statusChip.set('all');
    this.reload();
  }

  statusMeta(status: string): { label: string; variant: 'teal' | 'success' | 'warning' | 'error' | 'neutral' | 'info' } {
    return STATUS_META[status] ?? { label: status, variant: 'neutral' as const };
  }

  formatDayLabel(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return `${WEEK_SHORT[dt.getDay()]} ${d} ${MONTH_SHORT[m - 1]} ${y}`;
  }

  private buildQuery(offset: number): {
    dateFrom?: string;
    dateTo?: string;
    doctorId?: string;
    patientId?: string;
    status?: string;
    limit: number;
    offset: number;
  } {
    const chip = this.statusChip();
    return {
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
      doctorId: this.filterDoctorId() ?? undefined,
      patientId: this.filterPatientId() ?? undefined,
      status: chip === 'all' ? undefined : chip === 'pending' ? PENDING_CSV : chip,
      limit: this.PAGE_SIZE,
      offset,
    };
  }
}
