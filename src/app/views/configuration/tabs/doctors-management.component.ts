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
              <th class="px-4 py-3 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (doctor of doctors(); track doctor.id) {
              <tr class="border-b border-[#eceef0] hover:bg-[#f7f9fb]/60">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2.5">
                    @if (doctor.avatarUrl) {
                      <img [src]="doctor.avatarUrl" [alt]="doctor.name" class="w-9 h-9 rounded-full object-cover ring-1 ring-[#eceef0]" />
                    } @else {
                      <span class="w-9 h-9 rounded-full bg-[#006a61]/10 text-[#006a61] flex items-center justify-center text-[12px] font-bold">{{ data.getInitials(doctor.name) }}</span>
                    }
                    <span class="font-semibold text-[#191c1e]">{{ doctor.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-[#45464d]">{{ doctor.specialty }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <button
                      class="p-1 rounded-lg text-[#006a61] hover:bg-[#86f2e4]/20 transition-colors"
                      title="Activar / Desactivar"
                      (click)="toggle(doctor.id)"
                    >
                      <span class="material-symbols-outlined text-[22px]">{{ doctor.activeToday ? 'toggle_on' : 'toggle_off' }}</span>
                    </button>
                    <app-badge variant="outline" size="sm">{{ doctor.activeToday ? 'Activo' : 'Inactivo' }}</app-badge>
                  </div>
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
          <div class="flex items-center justify-center">
            <input #avatarFile type="file" hidden accept="image/*" (change)="onAvatarFile($event)" />
            <div class="relative">
              <button
                type="button"
                (click)="avatarFile.click()"
                title="Clic para subir foto"
                class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#006a61] text-white flex items-center justify-center shadow-sm ring-2 ring-[#eceef0] overflow-hidden cursor-pointer hover:opacity-90 transition"
              >
                @if (form().avatarUrl) {
                  <img [src]="form().avatarUrl" [alt]="form().name || 'Médico'" class="w-full h-full object-cover" />
                } @else if (form().name) {
                  <span class="text-[20px] sm:text-[24px] font-bold">{{ data.getInitials(form().name) }}</span>
                } @else {
                  <span class="material-symbols-outlined text-[28px] sm:text-[32px]">person</span>
                }
              </button>
              @if (form().avatarUrl) {
                <button
                  type="button"
                  (click)="clearAvatar()"
                  title="Quitar foto"
                  class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shadow-md hover:bg-[#991111] transition-colors"
                >
                  <span class="material-symbols-outlined text-[14px]">close</span>
                </button>
              }
            </div>
          </div>
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
          @if (!editing()) {
            <div class="border-t border-[#e6e8ea] pt-4">
              <label class="flex items-center justify-between gap-3 cursor-pointer">
                <span class="text-[12px] font-bold text-[#191c1e]">Habilitar inicio de sesión</span>
                <input type="checkbox" [checked]="withAccount()" (change)="onToggleAccount($event)" class="w-4 h-4 accent-[#006a61]" />
              </label>
              @if (withAccount()) {
                <label class="flex flex-col gap-1.5 mt-3">
                  <span class="text-[12px] font-bold text-[#191c1e]">Correo Electrónico para la cuenta *</span>
                  <input type="email" [value]="email()" (input)="onEmail($event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" placeholder="usuario@medcontrol.com" />
                </label>
              }
              <p class="text-[12px] text-[#76777d] mt-2">Al crear el médico se generará también su cuenta de acceso. La contraseña temporal se mostrará una sola vez.</p>
            </div>
          }
        </div>
        <div modal-footer class="flex items-center justify-end gap-2.5">
          <app-button variant="light" size="md" (click)="close()">Cancelar</app-button>
          <app-button variant="primary" size="md" icon="check" (click)="save()">{{ editing() ? 'Guardar Cambios' : 'Crear Médico' }}</app-button>
        </div>
      </app-modal>

      <app-modal
        [isOpen]="!!credentials()"
        title="Contraseña temporal"
        subtitle="Guárdela ahora: solo se muestra una sola vez"
        icon="key"
        [maxWidth]="'sm'"
        (dismiss)="credentials.set(null)"
      >
        <div class="flex flex-col gap-4">
          <div class="p-3 rounded-lg bg-[#f2f4f6] border border-[#e0e3e5]">
            <div class="text-[12px] font-semibold text-[#45464d]">{{ credentials()?.name }} <span class="normal-case text-[#76777d]">· {{ credentials()?.email }}</span></div>
            <div class="mt-2 flex items-center justify-between gap-2">
              <code class="font-mono text-[15px] font-bold text-[#006a61] tracking-wide break-all">{{ credentials()?.password }}</code>
              <button
                class="shrink-0 p-2 rounded-lg text-[#006a61] hover:bg-[#86f2e4]/20 transition-colors"
                title="Copiar contraseña"
                (click)="copyCredentials()"
              >
                <span class="material-symbols-outlined text-[18px]">content_copy</span>
              </button>
            </div>
          </div>
          <p class="text-[12px] text-[#76777d]">
            Este usuario deberá cambiar la contraseña en su primer inicio de sesión.
          </p>
        </div>
        <div modal-footer class="flex items-center justify-end gap-2.5">
          <app-button variant="primary" size="md" (click)="credentials.set(null)">Entendido</app-button>
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
  readonly withAccount = signal(true);
  readonly email = signal('');
  readonly credentials = signal<{ name: string; email: string; password: string } | null>(null);
  readonly form = signal<DoctorSummary>({ id: '', name: '', shortName: '', specialty: 'Medicina General', activeToday: true, avatarUrl: '' });

  private update(key: string, value: unknown): void {
    this.form.update((f) => ({ ...f, [key]: value as never }));
  }

  onInput(key: string, event: Event): void {
    this.update(key, (event.target as HTMLInputElement).value);
  }

  onEmail(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  onToggleAccount(event: Event): void {
    this.withAccount.set((event.target as HTMLInputElement).checked);
  }

  async copyCredentials(): Promise<void> {
    const password = this.credentials()?.password;
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      this.toast.show('Contraseña copiada', 'Péguela en un lugar seguro antes de cerrar esta ventana.');
    } catch {
      this.toast.show('No se pudo copiar', 'Copie la contraseña manualmente antes de cerrar.', 'error');
    }
  }

  clearAvatar(): void {
    this.update('avatarUrl', '');
  }

  onAvatarFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.show('Formato no válido', 'Seleccione una imagen (JPG, PNG o WebP).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 256;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        this.update('avatarUrl', canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  openNew(): void {
    this.editing.set(false);
    this.form.set({ id: '', name: '', shortName: '', specialty: 'Medicina General', activeToday: true, avatarUrl: '' });
    this.withAccount.set(true);
    this.email.set('');
    this.credentials.set(null);
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
      this.close();
      return;
    }
    const name = f.name.trim();
    const doctorId = 'doc-' + Date.now().toString().slice(-6);
    const email = this.email().trim();
    if (this.withAccount()) {
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        this.toast.show('Falta Correo', 'Ingrese un correo válido para la cuenta de acceso.', 'warning');
        return;
      }
      if (this.data.emailTaken(email)) {
        this.toast.show('Correo Duplicado', 'Ya existe una cuenta con ese correo electrónico.', 'error');
        return;
      }
    }
    this.data.addDoctor(
      {
        id: doctorId,
        name,
        shortName: f.shortName.trim() || name,
        specialty: f.specialty.trim() || 'Medicina General',
        activeToday: true,
        avatarUrl: f.avatarUrl,
      },
      this.withAccount() ? undefined : (r) => this.toast.show('Médico Creado', `${r.doctor.name} aparecerá en Ver Médico.`),
    );
    if (this.withAccount()) {
      this.data.addCatalogUser(
        { id: 'usr-' + Date.now().toString().slice(-6), name, email, role: 'doctor', doctorId, active: true },
        (r) => {
          this.credentials.set({ name: r.user.name, email: r.user.email, password: r.tempPassword ?? '' });
          this.toast.show('Médico Creado', 'Perfil y cuenta de acceso creados. Guarde la contraseña temporal.', 'info');
        },
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