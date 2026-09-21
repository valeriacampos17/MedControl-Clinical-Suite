import { Component, computed, inject, signal } from '@angular/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { Diagnosis } from '../../../core/models/types';
import { ButtonComponent } from '../../../shared/button/button.component';
import { BadgeComponent } from '../../../shared/badge/badge.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ToastComponent } from '../../../shared/toast/toast.component';

@Component({
  selector: 'app-diagnoses-management',
  standalone: true,
  imports: [ButtonComponent, BadgeComponent, ModalComponent, ToastComponent],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-[16px] font-bold text-[#191c1e]">Catálogo de Diagnósticos CIE-10</h2>
          <p class="text-[12px] text-[#45464d]">Códigos de diagnóstico disponibles en la consulta médica</p>
        </div>
        <div class="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar código o descripción..."
            class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] w-56"
            (input)="search.set(($any($event.target)).value)"
          />
          <app-button variant="primary" size="md" icon="add" (click)="openNew()">Nuevo Código</app-button>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-[#e6e8ea] overflow-hidden">
        @if (filtered().length === 0) {
          <div class="p-8 text-center text-[13px] text-[#76777d]">No hay diagnósticos que coincidan con la búsqueda.</div>
        } @else {
          <table class="w-full text-left text-[13px]">
            <thead>
              <tr class="bg-[#f7f9fb] border-b border-[#eceef0] text-[11px] uppercase tracking-wider text-[#45464d]">
                <th class="px-4 py-3 font-bold">Código</th>
                <th class="px-4 py-3 font-bold">Descripción</th>
                <th class="px-4 py-3 font-bold">Estado</th>
                <th class="px-4 py-3 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (dg of filtered(); track dg.id) {
                <tr class="border-b border-[#eceef0] hover:bg-[#f7f9fb]/60">
                  <td class="px-4 py-3">
                    <app-badge variant="teal" size="sm">{{ dg.code }}</app-badge>
                  </td>
                  <td class="px-4 py-3 font-semibold text-[#191c1e]">{{ dg.description }}</td>
                  <td class="px-4 py-3">
                    <app-badge variant="outline" size="sm">{{ dg.active ? 'Activo' : 'Inactivo' }}</app-badge>
                  </td>
                  <td class="px-4 py-3 text-right whitespace-nowrap">
                    <button class="p-1.5 rounded-lg text-[#006a61] hover:bg-[#86f2e4]/20 transition-colors" title="Editar" (click)="openEdit(dg)"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                    <button class="p-1.5 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors" title="Eliminar" (click)="remove(dg.id)"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <app-modal
        [isOpen]="showModal()"
        [title]="editing() ? 'Editar Diagnóstico' : 'Nuevo Código CIE-10'"
        subtitle="Registre el código CIE-10 y su descripción clínica"
        icon="event_note"
        [maxWidth]="'md'"
        [footerTemplate]="true"
        (dismiss)="close()"
      >
        <div class="flex flex-col gap-4">
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Código CIE-10 *</span>
            <input type="text" [value]="form().code" (input)="onInput('code', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" placeholder="Ej: I10" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Descripción *</span>
            <input type="text" [value]="form().description" (input)="onInput('description', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" placeholder="Ej: Hipertensión esencial" />
          </label>
          <label class="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" [checked]="form().active" (change)="onInput('active', $event)" class="w-4 h-4 accent-[#006a61]" />
            <span class="text-[13px] font-semibold text-[#191c1e]">Activo</span>
          </label>
        </div>
        <div modal-footer>
          <app-button variant="light" size="md" (click)="close()">Cancelar</app-button>
          <app-button variant="primary" size="md" icon="check" (click)="save()">{{ editing() ? 'Guardar Cambios' : 'Agregar Código' }}</app-button>
        </div>
      </app-modal>
      <app-toast />
    </div>
  `,
})
export class DiagnosesManagementComponent {
  data = inject(MockDataService);
  toast = inject(ToastService);

  readonly search = signal('');
  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.data.diagnoses().filter((d) => !q || d.code.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
  });

  readonly showModal = signal(false);
  readonly editing = signal<string | null>(null);
  readonly form = signal<Diagnosis>({ id: '', code: '', description: '', active: true });

  private update(key: string, value: unknown): void {
    this.form.update((f) => ({ ...f, [key]: value as never }));
  }

  onInput(key: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.update(key, target.type === 'checkbox' ? target.checked : target.value);
  }

  openNew(): void {
    this.editing.set(null);
    this.form.set({ id: '', code: '', description: '', active: true });
    this.showModal.set(true);
  }

  openEdit(dg: Diagnosis): void {
    this.editing.set(dg.id);
    this.form.set({ ...dg });
    this.showModal.set(true);
  }

  close(): void {
    this.showModal.set(false);
  }

  save(): void {
    const f = this.form();
    if (!f.code.trim() || !f.description.trim()) {
      this.toast.show('Faltan Datos', 'Ingrese el código y la descripción del diagnóstico.');
      return;
    }
    if (this.editing()) {
      this.data.updateDiagnosis({ ...f, code: f.code.trim().toUpperCase(), description: f.description.trim() });
      this.toast.show('Diagnóstico Actualizado', `${f.code} fue actualizado.`);
    } else {
      const item: Diagnosis = { ...f, id: this.data.getNextDiagnosisId(), code: f.code.trim().toUpperCase(), description: f.description.trim() };
      this.data.addDiagnosis(item);
      this.toast.show('Código Agregado', `${item.code} fue agregado al catálogo.`);
    }
    this.close();
  }

  remove(id: string): void {
    this.data.deactivateDiagnosis(id);
    this.toast.show('Código Eliminado', 'El diagnóstico fue retirado del catálogo activo.');
  }
}