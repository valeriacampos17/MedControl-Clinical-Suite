import { Component, computed, inject, signal } from '@angular/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { AlertRule, AlertCategory, AlertSeverity } from '../../../core/models/types';
import { ButtonComponent } from '../../../shared/button/button.component';
import { BadgeComponent } from '../../../shared/badge/badge.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ToastComponent } from '../../../shared/toast/toast.component';

@Component({
  selector: 'app-alerts-management',
  standalone: true,
  imports: [ButtonComponent, BadgeComponent, ModalComponent, ToastComponent],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-[16px] font-bold text-[#191c1e]">Reglas de Alertas y Notificaciones</h2>
          <p class="text-[12px] text-[#45464d]">Reglas que generan alertas en el Centro de Notificaciones cuando se cumple la condición</p>
        </div>
        <app-button variant="primary" size="md" icon="add" (click)="openNew()">Nueva Regla</app-button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-[#e6e8ea] overflow-hidden">
        @if (rules().length === 0) {
          <div class="p-8 text-center text-[13px] text-[#76777d]">No hay reglas de alerta configuradas.</div>
        } @else {
          <table class="w-full text-left text-[13px]">
            <thead>
              <tr class="bg-[#f7f9fb] border-b border-[#eceef0] text-[11px] uppercase tracking-wider text-[#45464d]">
                <th class="px-4 py-3 font-bold">Regla</th>
                <th class="px-4 py-3 font-bold">Categoría</th>
                <th class="px-4 py-3 font-bold">Severidad</th>
                <th class="px-4 py-3 font-bold">Estado</th>
                <th class="px-4 py-3 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (rule of rules(); track rule.id) {
                <tr class="border-b border-[#eceef0] hover:bg-[#f7f9fb]/60">
                  <td class="px-4 py-3">
                    <span class="font-semibold text-[#191c1e]">{{ rule.name }}</span>
                    <p class="text-[12px] text-[#76777d]">{{ rule.description }}</p>
                  </td>
                  <td class="px-4 py-3"><app-badge variant="outline" size="sm">{{ rule.category }}</app-badge></td>
                  <td class="px-4 py-3">
                    <app-badge [variant]="severityVariant(rule.severity)" size="sm">{{ rule.severity }}</app-badge>
                  </td>
                  <td class="px-4 py-3">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 text-[12px] font-semibold"
                      [class.text-[#006a61]]="rule.active"
                      [class.text-[#76777d]]="!rule.active"
                      (click)="toggle(rule.id)"
                    >
                      <span class="material-symbols-outlined text-[18px]">{{ rule.active ? 'toggle_on' : 'toggle_off' }}</span>
                      {{ rule.active ? 'Activa' : 'Inactiva' }}
                    </button>
                  </td>
                  <td class="px-4 py-3 text-right whitespace-nowrap">
                    <button class="p-1.5 rounded-lg text-[#006a61] hover:bg-[#86f2e4]/20 transition-colors" title="Editar" (click)="openEdit(rule)"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                    <button class="p-1.5 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors" title="Eliminar" (click)="remove(rule.id)"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <app-modal
        [isOpen]="showModal()"
        [title]="editing() ? 'Editar Regla de Alerta' : 'Nueva Regla de Alerta'"
        subtitle="Configure la condición que generará una notificación"
        icon="notifications_active"
        [maxWidth]="'md'"
        [footerTemplate]="true"
        (dismiss)="close()"
      >
        <div class="flex flex-col gap-4">
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Nombre *</span>
            <input type="text" [value]="form().name" (input)="onInput('name', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Descripción</span>
            <textarea rows="2" [value]="form().description" (input)="onInput('description', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] resize-none"></textarea>
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Categoría</span>
              <select [value]="form().category" (change)="onSelect('category', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]">
                <option value="triage">Triaje</option>
                <option value="receta">Receta</option>
                <option value="examen">Examen</option>
                <option value="cita">Cita</option>
              </select>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Severidad</span>
              <select [value]="form().severity" (change)="onSelect('severity', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]">
                <option value="critical">Crítica</option>
                <option value="warning">Advertencia</option>
                <option value="info">Informativa</option>
                <option value="success">Éxito</option>
              </select>
            </label>
          </div>
          <label class="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" [checked]="form().active" (change)="onInput('active', $event)" class="w-4 h-4 accent-[#006a61]" />
            <span class="text-[13px] font-semibold text-[#191c1e]">Regla activa</span>
          </label>
        </div>
        <div modal-footer>
          <app-button variant="light" size="md" (click)="close()">Cancelar</app-button>
          <app-button variant="primary" size="md" icon="check" (click)="save()">{{ editing() ? 'Guardar Cambios' : 'Crear Regla' }}</app-button>
        </div>
      </app-modal>
      <app-toast />
    </div>
  `,
})
export class AlertsManagementComponent {
  data = inject(MockDataService);
  toast = inject(ToastService);

  rules = computed(() => this.data.getAlertRules());

  readonly showModal = signal(false);
  readonly editing = signal<string | null>(null);
  readonly form = signal<AlertRule>({ id: '', name: '', description: '', category: 'triage', severity: 'info', icon: 'notifications_active', actionLabel: 'Ver Detalle', active: true });

  private update(key: string, value: unknown): void {
    this.form.update((f) => ({ ...f, [key]: value as never }));
  }

  onInput(key: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.update(key, target.type === 'checkbox' ? target.checked : target.value);
  }

  onSelect(key: string, event: Event): void {
    this.update(key, (event.target as HTMLSelectElement).value);
  }

  severityVariant(severity: AlertSeverity): 'primary' | 'teal' | 'info' | 'warning' | 'error' | 'outline' | 'neutral' {
    switch (severity) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'teal';
      default: return 'outline';
    }
  }

  openNew(): void {
    this.editing.set(null);
    this.form.set({ id: '', name: '', description: '', category: 'triage', severity: 'info', icon: 'notifications_active', actionLabel: 'Ver Detalle', active: true });
    this.showModal.set(true);
  }

  openEdit(rule: AlertRule): void {
    this.editing.set(rule.id);
    this.form.set({ ...rule });
    this.showModal.set(true);
  }

  close(): void {
    this.showModal.set(false);
  }

  save(): void {
    const f = this.form();
    if (!f.name.trim()) {
      this.toast.show('Faltan Datos', 'Ingrese el nombre de la regla.');
      return;
    }
    if (this.editing()) {
      this.data.updateAlertRule({ ...f, name: f.name.trim() });
      this.toast.show('Regla Actualizada', `${f.name} fue actualizada.`);
    } else {
      this.data.addAlertRule({ ...f, id: 'AR-' + Date.now().toString().slice(-6), name: f.name.trim() });
      this.toast.show('Regla Creada', `${f.name} fue configurada.`);
    }
    this.close();
  }

  toggle(id: string): void {
    const rule = this.data.getAlertRules().find((r) => r.id === id);
    if (rule) {
      this.data.updateAlertRule({ ...rule, active: !rule.active });
    }
  }

  remove(id: string): void {
    this.data.deactivateAlertRule(id);
    this.toast.show('Regla Eliminada', 'La regla fue retirada del catálogo.');
  }
}