import { Component, computed, inject, signal } from '@angular/core';
import { MockDataService, type DoctorSummary } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { ButtonComponent } from '../../../shared/button/button.component';
import { BadgeComponent } from '../../../shared/badge/badge.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ToastComponent } from '../../../shared/toast/toast.component';

@Component({
  selector: 'app-doctors-management',
  standalone: true,
  imports: [ButtonComponent, BadgeComponent, ModalComponent, ToastComponent],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-[16px] font-bold text-[#191c1e]">Médicos del Centro</h2>
          <p class="text-[12px] text-[#45464d]">Perfiles médicos que aparecen en el filtro "Ver Médico" y pueden tener agenda</p>
        </div>
        <app-button variant="primary" size="md" icon="person_add" (click)="openNew()">Nuevo Médico</app-button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-[#e6e8ea] overflow-hidden">
        <table class="w-full text-left text-[13px]">
          <thead>
            <tr class="bg-[#f7f9fb] border-b border-[#eceef0] text-[11px] uppercase tracking-wider text-[#45464d]">
              <th class="px-4 py-3 font-bold">Nombre</th>
              <th class="px-4 py-3 font-bold">Especialidad</th>
              <th class="px-4 py-3 font-bold">Estado</th>
              <th class="px-4 py-3 font-bold text-right">Red de Acción</th>
            </tr>
          </thead>
          <tbody>
            @for (doctor of doctors(); track doctor.id) {
              <tr class="border-b border-[#eceef0] hover:bg-[#f7f9fb]/60">
                <td class="px-4 py-3 font-semibold text-[#191c1e]">{{ doctor.name }}</td>
                <td class="px-4 py-3 text-[#45464d]">{{ doctor.specialty }}</td>
                <td class="px-4 py-3">
                  <app-badge variant="outline" size="sm">{{ doctor.activeToday ? 'Activo' : 'Inactivo' }}</app-badge>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="inline-flex items-center gap-1.5">
                    <button
                      class="p-1.5 rounded-lg text-[#006a61] hover:bg-[#86f2e4]/20 transition-colors"
                      title="Editar"
                      (click)="edit(doctor)"
                    >
                      <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      class="p-1.5 rounded-lg text-[#006a61] hover:bg-[#86f2e4]/20 transition-colors"
                      title="Activar / Desactivar"
                      (click)="toggle(doctor.id)"
                    >
                      <span class="material-symbols-outlined text-[18px]">{{ doctor.activeToday ? 'toggle_on' : 'toggle_off' }}</span>
                    </button>
                    <button
                      class="p-1.5 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors"
                      title="Eliminar"
                      (click)="remove(doctor)"
                    >
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <app-modal
        [isOpen]="showModal()"
        [title]="editing() ? 'Editar Médico' : 'Nuevo Médico'"
        subtitle="El perfil aparecerá en el filtro Ver Médico del dashboard"
        icon="stethoscope"
        [maxWidth]="'md'"
        [footerTemplate]="true"
        (dismiss)="close()"
      >
        <div class="flex flex-col gap-4">
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Nombre *</span>
            <input type="text" [value]="form().name" (input)="onInput('name', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" placeholder="Dra. María Pérez" />
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Especialidad</span>
              <input type="text" [value]="form().specialty" (input)="onInput('specialty', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" placeholder="Medicina General" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Nombre corto</span>
              <input type="text" [value]="form().shortName" (input)="onInput('shortName', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" placeholder="Dra. Pérez" />
            </label>
          </div>
        </div>
        <div modal-footer class="flex items-center justify-end gap-2.5">
          <app-button variant="light" size="md" (click)="close()">Cancelar</app-button>
          <app-button variant="primary" size="md" icon="check" (click)="save()">{{ editing() ? 'Guardar Cambios' : 'Crear Médico' }}</app-button>
        </div>
      </app-modal>
      <app-toast />
    </div>
  `,
})
export class DoctorsManagementComponent {
  data = inject(MockDataService);
  toast = inject(ToastService);

  doctors = computed(() => this.data.doctors());

  readonly showModal = signal(false);
  readonly editing = signal(false);
  readonly form = signal<DoctorSummary>({ id: '', name: '', shortName: '', specialty: 'Medicina General', activeToday: true, avatarUrl: '' });

  private update(key: string, value: unknown): void {
    this.form.update((f) => ({ ...f, [key]: value as never }));
  }

  onInput(key: string, event: Event): void {
    this.update(key, (event.target as HTMLInputElement).value);
  }

  openNew(): void {
    this.editing.set(false);
    this.form.set({ id: '', name: '', shortName: '', specialty: 'Medicina General', activeToday: true, avatarUrl: '' });
    this.showModal.set(true);
  }

  edit(doctor: DoctorSummary): void {
    this.editing.set(true);
    this.form.set({ ...doctor });
    this.showModal.set(true);
  }

  close(): void {
    this.showModal.set(false);
  }

  save(): void {
    const f = this.form();
    if (!f.name.trim()) {
      this.toast.show('Faltan Datos', 'Ingrese el nombre del médico.', 'warning');
      return;
    }
    if (this.editing()) {
      this.data.updateDoctor({ ...f, name: f.name.trim(), specialty: f.specialty.trim() || 'Medicina General' });
      this.toast.show('Médico Actualizado', `${f.name.trim()} fue actualizado.`);
    } else {
      const name = f.name.trim();
      this.data.addDoctor(
        {
          id: 'doc-' + Date.now().toString().slice(-6),
          name,
          shortName: f.shortName.trim() || name,
          specialty: f.specialty.trim() || 'Medicina General',
          activeToday: true,
          avatarUrl: '',
        },
        (r) => this.toast.show('Médico Creado', `${r.doctor.name} aparecerá en Ver Médico.`),
      );
    }
    this.close();
  }

  toggle(id: string): void {
    this.data.toggleDoctorActive(id);
    const doctor = this.data.doctors().find((d) => d.id === id);
    this.toast.show('Estado Actualizado', doctor ? `${doctor.name} ${doctor.activeToday ? 'activado' : 'desactivado'}.` : '');
  }

  remove(doctor: DoctorSummary): void {
    this.data.deleteDoctor(doctor.id, (err) => {
      const message = err instanceof Error ? err.message : 'El médico no se pudo eliminar';
      this.toast.show('No se pudo eliminar', message, 'error');
    });
    this.toast.show('Médico Eliminado', `${doctor.name} fue eliminado.`);
  }
}