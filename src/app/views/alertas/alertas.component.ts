import { Component, inject } from '@angular/core';
import { NavigationService } from '../../core/services/navigation.service';
import { ToastService } from '../../core/services/toast.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { ToastComponent } from '../../shared/toast/toast.component';
import { NavRoute } from '../../core/models/types';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [ButtonComponent, BadgeComponent, ToastComponent],
  template: `
    <div class="flex flex-col w-full">
      <div class="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#eceef0]">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-[20px] sm:text-[22px] font-bold text-[#191c1e] tracking-tight">Centro de Notificaciones & Alertas</h1>
              <app-badge variant="error" size="sm">2 Críticas</app-badge>
            </div>
            <p class="text-[13px] text-[#45464d] mt-1">Monitoreo en tiempo real de eventos clínicos, trazabilidad y pasarelas de comunicación</p>
          </div>
          <app-button variant="light" size="md" icon="done_all" (click)="handleMarkAllRead()">Marcar Todas como Leídas</app-button>
        </div>

        <div class="flex flex-col gap-3">
          @for (al of alerts; track al.id) {
            <div
              class="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              [class]="al.level === 'critical'
                ? 'bg-[#ffdad6]/20 border-[#ba1a1a]/30'
                : 'bg-white border-[#e6e8ea]'"
            >
              <div class="flex items-start gap-3">
                <span
                  class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  [class]="al.level === 'critical'
                    ? 'bg-[#ffdad6] text-[#ba1a1a]'
                    : al.level === 'success'
                    ? 'bg-[#86f2e4]/30 text-[#006f66]'
                    : 'bg-[#f2f4f6] text-[#006a61]'"
                >
                  <span class="material-symbols-outlined text-[20px]">{{ al.icon }}</span>
                </span>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-[14px] font-bold text-[#191c1e]">{{ al.title }}</span>
                    <span class="text-[11px] text-[#76777d]">{{ al.time }}</span>
                  </div>
                  <p class="text-[12px] text-[#45464d] mt-1">{{ al.desc }}</p>
                </div>
              </div>
              <app-button
                [variant]="al.level === 'critical' ? 'danger' : 'light'"
                size="sm"
                (click)="nav.navigate(al.route)"
              >
                {{ al.action }}
              </app-button>
            </div>
          }
        </div>
      </div>
      <app-toast />
    </div>
  `,
})
export class AlertasComponent {
  nav = inject(NavigationService);
  toast = inject(ToastService);

  alerts = [
    {
      id: 'al-1',
      title: 'Alergia Crítica Confirmada - Paciente Juan Pérez Morales',
      desc: 'Se detectó antecedente severo de anafilaxia a Penicilina en ficha clínica. Alerta activa en módulo de prescripción.',
      time: 'Hace 12 min',
      level: 'critical',
      icon: 'warning',
      action: 'Ver Ficha',
      route: 'pacientes-y-historial-clinico' as NavRoute,
    },
    {
      id: 'al-2',
      title: 'Liberación de Turno 16:00 PM y Reasignación',
      desc: 'Cancelación procesada vía WhatsApp. El sistema contactó automáticamente al siguiente paciente en lista prioritaria.',
      time: 'Hace 35 min',
      level: 'info',
      icon: 'sync_alt',
      action: 'Ver Agenda',
      route: 'agenda-y-disponibilidad' as NavRoute,
    },
    {
      id: 'al-3',
      title: 'Recordatorios Automatizados de Turno Enviados (14 Pacientes)',
      desc: 'Twilio SMS Gateway despachó recordatorios para el bloque vespertino. 92% de confirmación en línea.',
      time: 'Hoy 08:00 AM',
      level: 'success',
      icon: 'sms',
      action: 'Ver Detalle',
      route: 'dashboard-de-citas' as NavRoute,
    },
  ];

  handleMarkAllRead(): void {
    this.toast.show('Alertas Marcadas', 'Todas las alertas han sido marcadas como leídas.');
  }
}
