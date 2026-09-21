import { Component, computed, inject, signal } from '@angular/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { TriageLevel, TriageAutoRule, TriageRuleField } from '../../../core/models/types';
import { ButtonComponent } from '../../../shared/button/button.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ToastComponent } from '../../../shared/toast/toast.component';

@Component({
  selector: 'app-triage-management',
  standalone: true,
  imports: [ButtonComponent, ModalComponent, ToastComponent],
  template: `
    <div class="flex flex-col gap-6">
      <div>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-[16px] font-bold text-[#191c1e]">Escala de Triaje</h2>
            <p class="text-[12px] text-[#45464d]">Niveles de prioridad con tiempos máximos de espera y color asociado</p>
          </div>
          <app-button variant="primary" size="md" icon="add" (click)="openNewLevel()">Nuevo Nivel</app-button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          @for (level of sortedLevels(); track level.id) {
            <div class="bg-white rounded-xl p-4 shadow-sm border border-[#e6e8ea] flex flex-col gap-2" [class.opacity-60]="!level.active">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <span class="w-5 h-5 rounded-full shrink-0" [style.background-color]="level.color"></span>
                  <span class="font-bold text-[14px] text-[#191c1e]">{{ level.name }}</span>
                </div>
                <span class="text-[11px] font-bold bg-[#f2f4f6] text-[#45464d] px-2 py-0.5 rounded">{{ level.code.toUpperCase() }}</span>
              </div>
              <p class="text-[12px] text-[#76777d]">{{ level.description }}</p>
              <div class="flex items-center justify-between mt-1">
                <span class="text-[12px] font-semibold text-[#006a61]">Espera máx: {{ level.maxWaitMinutes }} min</span>
                <div class="flex items-center gap-1">
                  <button class="p-1.5 rounded-lg text-[#006a61] hover:bg-[#86f2e4]/20 transition-colors" title="Editar" (click)="openEditLevel(level)"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                  <button class="p-1.5 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors" title="Activar/Desactivar" (click)="toggleLevel(level.id)"><span class="material-symbols-outlined text-[18px]">{{ level.active ? 'toggle_on' : 'toggle_off' }}</span></button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <div>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-[16px] font-bold text-[#191c1e]">Reglas de Clasificación Automática</h2>
            <p class="text-[12px] text-[#45464d]">Rangos de constantes vitales que sugieren un nivel de triaje al registrar el chequeo</p>
          </div>
          <app-button variant="outline" size="md" icon="add" (click)="openNewRule()">Nueva Regla</app-button>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-[#e6e8ea] overflow-hidden">
          @if (rules().length === 0) {
            <div class="p-8 text-center text-[13px] text-[#76777d]">Aún no hay reglas configuradas.</div>
          } @else {
            <table class="w-full text-left text-[13px]">
              <thead>
                <tr class="bg-[#f7f9fb] border-b border-[#eceef0] text-[11px] uppercase tracking-wider text-[#45464d]">
                  <th class="px-4 py-3 font-bold">Nivel</th>
                  <th class="px-4 py-3 font-bold">Parámetro</th>
                  <th class="px-4 py-3 font-bold">Rango</th>
                  <th class="px-4 py-3 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (rule of rules(); track rule.id) {
                  <tr class="border-b border-[#eceef0] hover:bg-[#f7f9fb]/60">
                    <td class="px-4 py-3">
                      <span class="inline-flex items-center gap-2 font-semibold text-[#191c1e]">
                        <span class="w-3 h-3 rounded-full" [style.background-color]="colorOf(rule.levelCode)"></span>
                        {{ levelName(rule.levelCode) }}
                      </span>
                    </td>
                    <td class="px-4 py-3">{{ fieldLabel(rule.field) }}</td>
                    <td class="px-4 py-3">{{ rule.min === null ? '—' : '≥ ' + rule.min }} a {{ rule.max === null ? '—' : '≤ ' + rule.max }}</td>
                    <td class="px-4 py-3 text-right whitespace-nowrap">
                      <button class="p-1.5 rounded-lg text-[#006a61] hover:bg-[#86f2e4]/20 transition-colors" title="Editar" (click)="openEditRule(rule)"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                      <button class="p-1.5 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors" title="Eliminar" (click)="removeRule(rule.id)"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>

      <app-modal
        [isOpen]="showLevelModal()"
        [title]="editingLevel() ? 'Editar Nivel de Triaje' : 'Nuevo Nivel de Triaje'"
        subtitle="Configure el nivel, el tiempo máximo de espera y su color"
        icon="monitor_heart"
        [maxWidth]="'md'"
        [footerTemplate]="true"
        (dismiss)="closeLevel()"
      >
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Código *</span>
              <select [value]="levelForm().code" (change)="onLevelSelect('code', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]">
                @for (c of levelCodes; track c) {
                  <option [value]="c">{{ c.toUpperCase() }}</option>
                }
              </select>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Tiempo máx. de espera (min)</span>
              <input type="number" [value]="levelForm().maxWaitMinutes" (input)="onLevelNumber('maxWaitMinutes', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" />
            </label>
          </div>
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Nombre *</span>
            <input type="text" [value]="levelForm().name" (input)="onLevelInput('name', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" placeholder="Ej: Urgencia menor / Observación" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Descripción</span>
            <textarea rows="2" [value]="levelForm().description" (input)="onLevelInput('description', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] resize-none"></textarea>
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Color</span>
            <div class="flex items-center gap-2.5 flex-wrap">
              @for (c of colorSwatches; track c) {
                <button
                  type="button"
                  class="w-9 h-9 rounded-full border-2 transition-transform hover:scale-110"
                  [style.background-color]="c"
                  [class.border-[#191c1e]]="levelForm().color === c"
                  [class.border-transparent]="levelForm().color !== c"
                  (click)="setLevelColor(c)"
                ></button>
              }
            </div>
          </label>
          <label class="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" [checked]="levelForm().active" (change)="onLevelInput('active', $event)" class="w-4 h-4 accent-[#006a61]" />
            <span class="text-[13px] font-semibold text-[#191c1e]">Nivel activo en la clasificación</span>
          </label>
        </div>
        <div modal-footer>
          <app-button variant="light" size="md" (click)="closeLevel()">Cancelar</app-button>
          <app-button variant="primary" size="md" icon="check" (click)="saveLevel()">Guardar Nivel</app-button>
        </div>
      </app-modal>

      <app-modal
        [isOpen]="showRuleModal()"
        title="Regla de Clasificación Automática"
        subtitle="Defina el rango del parámetro vital que sugiere un nivel"
        icon="tune"
        [maxWidth]="'md'"
        [footerTemplate]="true"
        (dismiss)="closeRule()"
      >
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Nivel Resultante *</span>
              <select [value]="ruleForm().levelCode" (change)="onRuleSelect('levelCode', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]">
                @for (l of sortedLevels(); track l.id) {
                  <option [value]="l.code">{{ l.name }}</option>
                }
              </select>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Parámetro *</span>
              <select [value]="ruleForm().field" (change)="onRuleSelect('field', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]">
                @for (fd of ruleFields; track fd) {
                  <option [value]="fd">{{ fieldLabel(fd) }}</option>
                }
              </select>
            </label>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Mínimo (vacío = sin límite)</span>
              <input type="number" [value]="ruleForm().min ?? ''" (input)="onRuleNumber('min', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Máximo (vacío = sin límite)</span>
              <input type="number" [value]="ruleForm().max ?? ''" (input)="onRuleNumber('max', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" />
            </label>
          </div>
        </div>
        <div modal-footer>
          <app-button variant="light" size="md" (click)="closeRule()">Cancelar</app-button>
          <app-button variant="primary" size="md" icon="check" (click)="saveRule()">Guardar Regla</app-button>
        </div>
      </app-modal>
      <app-toast />
    </div>
  `,
})
export class TriageManagementComponent {
  data = inject(MockDataService);
  toast = inject(ToastService);

  readonly levelCodes = ['rojo', 'naranja', 'amarillo', 'verde', 'azul'];
  readonly colorSwatches = ['#d32f2f', '#ed6c02', '#f9a825', '#2e7d32', '#1976d2', '#6a1b9a', '#191c1e'];
  readonly ruleFields: TriageRuleField[] = ['spo2', 'temp', 'pulse', 'systolic', 'diastolic'];

  sortedLevels = computed(() => [...this.data.getTriageLevels()].sort((a, b) => b.order - a.order));
  rules = computed(() => this.data.getTriageRules());

  readonly showLevelModal = signal(false);
  readonly editingLevel = signal<string | null>(null);
  readonly levelForm = signal<TriageLevel>(this.blankLevel());

  readonly showRuleModal = signal(false);
  readonly editingRule = signal<string | null>(null);
  readonly ruleForm = signal<TriageAutoRule>(this.blankRule());

  private updateLevel(key: string, value: unknown): void {
    this.levelForm.update((f) => ({ ...f, [key]: value as never }));
  }

  private updateRule(key: string, value: unknown): void {
    this.ruleForm.update((f) => ({ ...f, [key]: value as never }));
  }

  onLevelInput(key: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateLevel(key, target.type === 'checkbox' ? target.checked : target.value);
  }

  onLevelSelect(key: string, event: Event): void {
    this.updateLevel(key, (event.target as HTMLSelectElement).value);
  }

  onLevelNumber(key: string, event: Event): void {
    this.updateLevel(key, Number((event.target as HTMLInputElement).value));
  }

  onRuleSelect(key: string, event: Event): void {
    this.updateRule(key, (event.target as HTMLSelectElement).value);
  }

  onRuleNumber(key: string, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.updateRule(key, raw === '' ? null : Number(raw));
  }

  setLevelColor(color: string): void {
    this.updateLevel('color', color);
  }

  private blankLevel(): TriageLevel {
    return { id: '', code: 'verde', name: '', maxWaitMinutes: 120, description: '', color: '#2e7d32', active: true, order: 2 };
  }

  private blankRule(): TriageAutoRule {
    return { id: '', levelCode: 'verde', field: 'spo2', min: null, max: null };
  }

  levelName(code: string): string {
    return this.data.getTriageLevelByCode(code)?.name ?? code.toUpperCase();
  }

  colorOf(code: string): string {
    return this.data.getTriageLevelByCode(code)?.color ?? '#76777d';
  }

  fieldLabel(field: TriageRuleField): string {
    const labels: Record<TriageRuleField, string> = {
      spo2: 'SpO₂ (%)',
      temp: 'Temperatura (°C)',
      pulse: 'Frecuencia Cardíaca (lpm)',
      systolic: 'Tensión Sistólica (mmHg)',
      diastolic: 'Tensión Diastólica (mmHg)',
    };
    return labels[field];
  }

  openNewLevel(): void {
    this.editingLevel.set(null);
    this.levelForm.set(this.blankLevel());
    this.showLevelModal.set(true);
  }

  openEditLevel(level: TriageLevel): void {
    this.editingLevel.set(level.id);
    this.levelForm.set({ ...level });
    this.showLevelModal.set(true);
  }

  closeLevel(): void {
    this.showLevelModal.set(false);
  }

  saveLevel(): void {
    const f = this.levelForm();
    if (!f.name.trim()) {
      this.toast.show('Faltan Datos', 'Ingrese el nombre del nivel.');
      return;
    }
    const order = this.levelCodes.indexOf(f.code) >= 0 ? this.levelCodes.length - this.levelCodes.indexOf(f.code) : 2;
    if (this.editingLevel()) {
      this.data.updateTriageLevel({ ...f, name: f.name.trim(), order });
      this.toast.show('Nivel Actualizado', `Nivel ${f.code.toUpperCase()} actualizado.`);
    } else {
      const item: TriageLevel = { ...f, id: 'TL-' + Date.now().toString().slice(-6), name: f.name.trim(), order };
      this.data.addTriageLevel(item);
      this.toast.show('Nivel Creado', `Nivel ${item.code.toUpperCase()} creado.`);
    }
    this.closeLevel();
  }

  toggleLevel(id: string): void {
    const level = this.data.getTriageLevels().find((l) => l.id === id);
    if (level) {
      this.data.updateTriageLevel({ ...level, active: !level.active });
    }
  }

  openNewRule(): void {
    this.editingRule.set(null);
    this.ruleForm.set(this.blankRule());
    this.showRuleModal.set(true);
  }

  openEditRule(rule: TriageAutoRule): void {
    this.editingRule.set(rule.id);
    this.ruleForm.set({ ...rule });
    this.showRuleModal.set(true);
  }

  closeRule(): void {
    this.showRuleModal.set(false);
  }

  saveRule(): void {
    const f = this.ruleForm();
    if (f.min === null && f.max === null) {
      this.toast.show('Faltan Datos', 'Defina al menos un límite (mínimo o máximo) para la regla.');
      return;
    }
    if (f.min !== null && f.max !== null && f.min > f.max) {
      this.toast.show('Rango Inválido', 'El mínimo no puede ser mayor que el máximo.');
      return;
    }
    if (this.editingRule()) {
      this.data.updateTriageRule(f);
    } else {
      this.data.addTriageRule({ ...f, id: 'TR-' + Date.now().toString().slice(-6) });
    }
    this.toast.show('Regla Guardada', 'La regla de clasificación automática fue configurada.');
    this.closeRule();
  }

  removeRule(id: string): void {
    this.data.removeTriageRule(id);
    this.toast.show('Regla Eliminada', 'La regla fue retirada de la clasificación automática.');
  }
}