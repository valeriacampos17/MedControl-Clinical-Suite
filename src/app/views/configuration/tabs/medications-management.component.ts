import { Component, computed, inject, signal } from '@angular/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { Medication, MedicationForm, MedicationRoute } from '../../../core/models/types';
import { ButtonComponent } from '../../../shared/button/button.component';
import { BadgeComponent } from '../../../shared/badge/badge.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ToastComponent } from '../../../shared/toast/toast.component';

@Component({
  selector: 'app-medications-management',
  standalone: true,
  imports: [ButtonComponent, BadgeComponent, ModalComponent, ToastComponent],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-[16px] font-bold text-[#191c1e]">Catálogo de Medicamentos</h2>
          <p class="text-[12px] text-[#45464d]">Medicamentos disponibles para la prescripción electrónica</p>
        </div>
        <div class="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar medicamento..."
            class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] w-56"
            (input)="search.set(($any($event.target)).value)"
          />
          <app-button variant="primary" size="md" icon="add" (click)="openNew()">Nuevo Medicamento</app-button>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-[#e6e8ea] overflow-hidden">
        @if (filtered().length === 0) {
          <div class="p-8 text-center text-[13px] text-[#76777d]">No hay medicamentos que coincidan con la búsqueda.</div>
        } @else {
          <table class="w-full text-left text-[13px]">
            <thead>
              <tr class="bg-[#f7f9fb] border-b border-[#eceef0] text-[11px] uppercase tracking-wider text-[#45464d]">
                <th class="px-4 py-3 font-bold">Medicamento</th>
                <th class="px-4 py-3 font-bold">Forma / Vía</th>
                <th class="px-4 py-3 font-bold hidden md:table-cell">Frecuencia Sugerida</th>
                <th class="px-4 py-3 font-bold">Restricciones</th>
                <th class="px-4 py-3 font-bold">Estado</th>
                <th class="px-4 py-3 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (med of filtered(); track med.id) {
                <tr class="border-b border-[#eceef0] hover:bg-[#f7f9fb]/60">
                  <td class="px-4 py-3">
                    <span class="font-semibold text-[#191c1e]">{{ data.medicationLabel(med) }}</span>
                  </td>
                  <td class="px-4 py-3 text-[#45464d]">{{ med.pharmaceuticalForm }} · {{ med.route }}</td>
                  <td class="px-4 py-3 text-[#45464d] hidden md:table-cell">{{ med.defaultFrequency || '—' }}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      @if (med.requiresPrescription) {
                        <app-badge variant="teal" size="sm">Receta</app-badge>
                      }
                      @if (med.controlled) {
                        <app-badge variant="error" size="sm">Fiscalizado</app-badge>
                      }
                      @if (!med.requiresPrescription && !med.controlled) {
                        <span class="text-[12px] text-[#76777d]">OTC</span>
                      }
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <app-badge variant="outline" size="sm">{{ med.active ? 'Activo' : 'Inactivo' }}</app-badge>
                  </td>
                  <td class="px-4 py-3 text-right whitespace-nowrap">
                    <button class="p-1.5 rounded-lg text-[#006a61] hover:bg-[#86f2e4]/20 transition-colors" title="Editar" (click)="openEdit(med)"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                    <button class="p-1.5 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors" title="Eliminar" (click)="remove(med.id)"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <app-modal
        [isOpen]="showModal()"
        [title]="editing() ? 'Editar Medicamento' : 'Nuevo Medicamento'"
        subtitle="Registre el medicamento y su esquema de prescripción sugerido"
        icon="medication"
        [maxWidth]="'lg'"
        [footerTemplate]="true"
        (dismiss)="close()"
      >
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Nombre Genérico *</span>
              <input type="text" [value]="form().name" (input)="onInput('name', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" placeholder="Ej: Losartán Potásico" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Presentación / Dosis</span>
              <input type="text" [value]="form().presentation" (input)="onInput('presentation', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" placeholder="Ej: 50 mg" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Forma Farmacéutica</span>
              <select [value]="form().pharmaceuticalForm" (change)="onSelect('pharmaceuticalForm', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]">
                @for (f of forms; track f) {
                  <option [value]="f">{{ f }}</option>
                }
              </select>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Vía de Administración</span>
              <select [value]="form().route" (change)="onSelect('route', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]">
                @for (r of routes; track r) {
                  <option [value]="r">{{ r }}</option>
                }
              </select>
            </label>
          </div>
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Frecuencia Sugerida</span>
            <input type="text" [value]="form().defaultFrequency" (input)="onInput('defaultFrequency', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" placeholder="Ej: 1 tableta cada 24 h" />
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label class="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" [checked]="form().requiresPrescription" (change)="onInput('requiresPrescription', $event)" class="w-4 h-4 accent-[#006a61]" />
              <span class="text-[13px] font-semibold text-[#191c1e]">Requiere receta</span>
            </label>
            <label class="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" [checked]="form().controlled" (change)="onInput('controlled', $event)" class="w-4 h-4 accent-[#006a61]" />
              <span class="text-[13px] font-semibold text-[#191c1e]">Fiscalizado</span>
            </label>
            <label class="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" [checked]="form().active" (change)="onInput('active', $event)" class="w-4 h-4 accent-[#006a61]" />
              <span class="text-[13px] font-semibold text-[#191c1e]">Activo</span>
            </label>
          </div>
        </div>
        <div modal-footer>
          <app-button variant="light" size="md" (click)="close()">Cancelar</app-button>
          <app-button variant="primary" size="md" icon="check" (click)="save()">{{ editing() ? 'Guardar Cambios' : 'Agregar Medicamento' }}</app-button>
        </div>
      </app-modal>
      <app-toast />
    </div>
  `,
})
export class MedicationsManagementComponent {
  data = inject(MockDataService);
  toast = inject(ToastService);

  readonly forms: MedicationForm[] = ['tableta', 'cápsula', 'jarabe', 'suspensión', 'inyectable', 'inhalador', 'crema', 'supositorio', 'gotas', 'parche'];
  readonly routes: MedicationRoute[] = ['oral', 'inhalatoria', 'inyectable', 'tópica', 'sublingual', 'rectal', 'oftálmica'];

  readonly search = signal('');
  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.data.medications().filter((m) => !q || this.data.medicationLabel(m).toLowerCase().includes(q));
  });

  readonly showModal = signal(false);
  readonly editing = signal<string | null>(null);
  readonly form = signal<Medication>({ id: '', name: '', presentation: '', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: '', requiresPrescription: true, controlled: false, active: true });

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

  openNew(): void {
    this.editing.set(null);
    this.form.set({ id: '', name: '', presentation: '', pharmaceuticalForm: 'tableta', route: 'oral', defaultFrequency: '', requiresPrescription: true, controlled: false, active: true });
    this.showModal.set(true);
  }

  openEdit(med: Medication): void {
    this.editing.set(med.id);
    this.form.set({ ...med });
    this.showModal.set(true);
  }

  close(): void {
    this.showModal.set(false);
  }

  save(): void {
    const f = this.form();
    if (!f.name.trim()) {
      this.toast.show('Faltan Datos', 'Ingrese el nombre del medicamento.');
      return;
    }
    const med = { ...f, name: f.name.trim() };
    if (this.editing()) {
      this.data.updateMedication(med);
      this.toast.show('Medicamento Actualizado', `${this.data.medicationLabel(med)} fue actualizado.`);
    } else {
      const item: Medication = { ...med, id: this.data.getNextMedicationId() };
      this.data.addMedication(item);
      this.toast.show('Medicamento Agregado', `${this.data.medicationLabel(item)} fue agregado al catálogo.`);
    }
    this.close();
  }

  remove(id: string): void {
    this.data.deactivateMedication(id);
    this.toast.show('Medicamento Eliminado', 'El medicamento fue retirado del catálogo activo.');
  }
}