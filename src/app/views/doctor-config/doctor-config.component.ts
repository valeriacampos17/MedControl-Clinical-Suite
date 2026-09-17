import { Component, inject, signal } from '@angular/core';
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
              <div>
                <h3 class="text-[16px] font-bold text-[#191c1e]">Jornadas Semanales y Horarios de Atención</h3>
                <p class="text-[12px] text-[#45464d]">Distribución de bloques horarios y capacidad de atención</p>
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
                  @for (day of scheduleDays(); track day.day; let idx = $index) {
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
                            <span class="font-semibold text-[#191c1e]">{{ day.startTime }} - {{ day.endTime }}</span>
                          </div>
                        } @else {
                          <span class="text-[#76777d] italic">Sin jornada</span>
                        }
                      </td>
                      <td class="py-3 px-3 text-right">
                        @if (day.enabled) {
                          <span class="font-bold text-[#006a61] text-[13px]">{{ day.totalCapacity }} pacientes</span>
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
export class DoctorConfigComponent {
  nav = inject(NavigationService);
  data = inject(MockDataService);
  toast = inject(ToastService);

  scheduleDays = signal<DaySchedule[]>([...this.data.schedule()]);
  absences = signal([...this.data.absences()]);

  totalWeeklyCapacity = signal(
    this.data.schedule()
      .filter(d => d.enabled)
      .reduce((acc, curr) => acc + curr.totalCapacity, 0)
  );

  toggleDay(dayIndex: number): void {
    this.scheduleDays.update(days =>
      days.map((day, idx) =>
        idx === dayIndex ? { ...day, enabled: !day.enabled } : day
      )
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
    this.toast.show('Configuración Guardada', 'Parámetros de disponibilidad y reglas de atención sincronizados con éxito.');
  }
}
