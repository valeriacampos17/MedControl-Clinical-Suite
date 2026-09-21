import { Component, computed, inject, signal } from '@angular/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { ExamCategory, ExamTemplate } from '../../../core/models/types';
import { ButtonComponent } from '../../../shared/button/button.component';
import { BadgeComponent } from '../../../shared/badge/badge.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ToastComponent } from '../../../shared/toast/toast.component';

@Component({
  selector: 'app-exams-management',
  standalone: true,
  imports: [ButtonComponent, BadgeComponent, ModalComponent, ToastComponent],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-[16px] font-bold text-[#191c1e]">Catálogo de Exámenes Complementarios</h2>
          <p class="text-[12px] text-[#45464d]">Laboratorio, imagenología, estudios funcionales y procedimientos</p>
        </div>
        <div class="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar examen..."
            class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] w-56"
            (input)="search.set(($any($event.target)).value)"
          />
          <app-button variant="primary" size="md" icon="add" (click)="openNew()">Nuevo Examen</app-button>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-[#e6e8ea] overflow-hidden">
        @if (filtered().length === 0) {
          <div class="p-8 text-center text-[13px] text-[#76777d]">No hay exámenes que coincidan con la búsqueda.</div>
        } @else {
          <table class="w-full text-left text-[13px]">
            <thead>
              <tr class="bg-[#f7f9fb] border-b border-[#eceef0] text-[11px] uppercase tracking-wider text-[#45464d]">
                <th class="px-4 py-3 font-bold">Nombre</th>
                <th class="px-4 py-3 font-bold">Categoría</th>
                <th class="px-4 py-3 font-bold">Ayunas</th>
                <th class="px-4 py-3 font-bold hidden lg:table-cell">Preparación</th>
                <th class="px-4 py-3 font-bold">Estado</th>
                <th class="px-4 py-3 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (exam of filtered(); track exam.id) {
                <tr class="border-b border-[#eceef0] hover:bg-[#f7f9fb]/60">
                  <td class="px-4 py-3 font-semibold text-[#191c1e]">{{ exam.name }}</td>
                  <td class="px-4 py-3">
                    <app-badge [variant]="categoryVariant(exam.category)" size="sm">{{ categoryLabel(exam.category) }}</app-badge>
                  </td>
                  <td class="px-4 py-3">{{ exam.fasting ? 'Sí' : 'No' }}</td>
                  <td class="px-4 py-3 text-[#45464d] hidden lg:table-cell">{{ exam.preparation || '—' }}</td>
                  <td class="px-4 py-3">
                    <app-badge variant="outline" size="sm">{{ (exam.active ?? true) ? 'Activo' : 'Inactivo' }}</app-badge>
                  </td>
                  <td class="px-4 py-3 text-right whitespace-nowrap">
                    <button class="p-1.5 rounded-lg text-[#006a61] hover:bg-[#86f2e4]/20 transition-colors" title="Editar" (click)="openEdit(exam)"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                    <button class="p-1.5 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors" title="Eliminar" (click)="remove(exam.id)"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <app-modal
        [isOpen]="showModal()"
        [title]="editing() ? 'Editar Examen' : 'Nuevo Examen'"
        subtitle="Registre el examen complementario y sus instrucciones de preparación"
        icon="science"
        [maxWidth]="'md'"
        [footerTemplate]="true"
        (dismiss)="close()"
      >
        <div class="flex flex-col gap-4">
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Nombre del Examen *</span>
            <input type="text" [value]="form().name" (input)="onInput('name', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" placeholder="Ej: Hemograma completo" />
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Categoría *</span>
              <select [value]="form().category" (change)="onSelect('category', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]">
                <option value="laboratorio">Laboratorio</option>
                <option value="imagen">Imagenología</option>
                <option value="funcional">Estudio Funcional</option>
                <option value="procedimiento">Procedimiento</option>
              </select>
            </label>
            <label class="flex flex-col justify-end gap-1.5">
              <label class="flex items-center gap-2.5 py-2 cursor-pointer">
                <input type="checkbox" [checked]="form().fasting" (change)="onInput('fasting', $event)" class="w-4 h-4 accent-[#006a61]" />
                <span class="text-[13px] font-semibold text-[#191c1e]">Requiere ayunas</span>
              </label>
              <label class="flex items-center gap-2.5 py-2 cursor-pointer">
                <input type="checkbox" [checked]="form().active" (change)="onInput('active', $event)" class="w-4 h-4 accent-[#006a61]" />
                <span class="text-[13px] font-semibold text-[#191c1e]">Activo</span>
              </label>
            </label>
          </div>
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Preparación / Indicaciones</span>
            <textarea rows="2" [value]="form().preparation" (input)="onInput('preparation', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] resize-none" placeholder="Ej: Ayuno de 12 horas"></textarea>
          </label>
        </div>
        <div modal-footer>
          <app-button variant="light" size="md" (click)="close()">Cancelar</app-button>
          <app-button variant="primary" size="md" icon="check" (click)="save()">{{ editing() ? 'Guardar Cambios' : 'Agregar Examen' }}</app-button>
        </div>
      </app-modal>
      <app-toast />
    </div>
  `,
})
export class ExamsManagementComponent {
  data = inject(MockDataService);
  toast = inject(ToastService);

  readonly search = signal('');
  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.data.getExams().filter((e) => !q || e.name.toLowerCase().includes(q) || e.category.includes(q));
  });

  readonly showModal = signal(false);
  readonly editing = signal<string | null>(null);
  readonly form = signal<ExamTemplate>({ id: '', name: '', category: 'laboratorio', fasting: false, preparation: '', active: true });

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

  categoryVariant(category: ExamCategory): 'primary' | 'teal' | 'info' | 'warning' | 'error' | 'outline' | 'neutral' {
    switch (category) {
      case 'laboratorio': return 'teal';
      case 'imagen': return 'info';
      case 'funcional': return 'warning';
      default: return 'outline';
    }
  }

  categoryLabel(category: ExamCategory): string {
    switch (category) {
      case 'laboratorio': return 'Laboratorio';
      case 'imagen': return 'Imagenología';
      case 'funcional': return 'Funcional';
      default: return 'Procedimiento';
    }
  }

  openNew(): void {
    this.editing.set(null);
    this.form.set({ id: '', name: '', category: 'laboratorio', fasting: false, preparation: '', active: true });
    this.showModal.set(true);
  }

  openEdit(exam: ExamTemplate): void {
    this.editing.set(exam.id);
    this.form.set({ ...exam });
    this.showModal.set(true);
  }

  close(): void {
    this.showModal.set(false);
  }

  save(): void {
    const f = this.form();
    if (!f.name.trim()) {
      this.toast.show('Faltan Datos', 'Ingrese el nombre del examen.');
      return;
    }
    if (this.editing()) {
      this.data.updateExam({ ...f, name: f.name.trim(), active: f.active !== undefined ? f.active : true });
      this.toast.show('Examen Actualizado', `${f.name} fue actualizado correctamente.`);
    } else {
      const item: ExamTemplate = { ...f, id: 'EX-' + Date.now().toString().slice(-6), name: f.name.trim(), active: true };
      this.data.addExam(item);
      this.toast.show('Examen Agregado', `${item.name} fue agregado al catálogo.`);
    }
    this.close();
  }

  remove(id: string): void {
    this.data.deactivateExam(id);
    this.toast.show('Examen Eliminado', 'El examen fue retirado del catálogo activo.');
  }
}