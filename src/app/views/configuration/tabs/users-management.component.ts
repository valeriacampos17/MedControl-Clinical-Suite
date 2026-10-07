import { Component, computed, inject, signal } from '@angular/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppUser } from '../../../core/models/types';
import { ButtonComponent } from '../../../shared/button/button.component';
import { BadgeComponent } from '../../../shared/badge/badge.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ToastComponent } from '../../../shared/toast/toast.component';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [ButtonComponent, BadgeComponent, ModalComponent, ToastComponent],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-[16px] font-bold text-[#191c1e]">Usuarios y Roles del Sistema</h2>
          <p class="text-[12px] text-[#45464d]">Cuentas con acceso al sistema y su rol (admin o médico)</p>
        </div>
        <app-button variant="primary" size="md" icon="person_add" (click)="openNew()">Nuevo Usuario</app-button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-[#e6e8ea] overflow-hidden">
        <table class="w-full text-left text-[13px]">
          <thead>
            <tr class="bg-[#f7f9fb] border-b border-[#eceef0] text-[11px] uppercase tracking-wider text-[#45464d]">
              <th class="px-4 py-3 font-bold">Usuario</th>
              <th class="px-4 py-3 font-bold">Correo</th>
              <th class="px-4 py-3 font-bold">Rol</th>
              <th class="px-4 py-3 font-bold">Estado</th>
              <th class="px-4 py-3 font-bold text-right">Red de Acción</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr class="border-b border-[#eceef0] hover:bg-[#f7f9fb]/60" [class.opacity-60]="!user.active">
                <td class="px-4 py-3 font-semibold text-[#191c1e]">{{ user.name }}</td>
                <td class="px-4 py-3 text-[#45464d]">{{ user.email }}</td>
                <td class="px-4 py-3">
                  <app-badge [variant]="user.role === 'admin' ? 'teal' : 'outline'" size="sm">{{ user.role === 'admin' ? 'Administrador' : 'Médico' }}</app-badge>
                </td>
                <td class="px-4 py-3">
                  <app-badge variant="outline" size="sm">{{ user.active ? 'Activo' : 'Inactivo' }}</app-badge>
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    class="p-1.5 rounded-lg text-[#006a61] hover:bg-[#86f2e4]/20 transition-colors"
                    title="Activar / Desactivar"
                    (click)="toggle(user.id)"
                  >
                    <span class="material-symbols-outlined text-[18px]">{{ user.active ? 'toggle_on' : 'toggle_off' }}</span>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <app-modal
        [isOpen]="showModal()"
        title="Nuevo Usuario"
        subtitle="Registre una cuenta con acceso al sistema"
        icon="person_add"
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
            <span class="text-[12px] font-bold text-[#191c1e]">Correo Electrónico *</span>
            <input type="email" [value]="form().email" (input)="onInput('email', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" placeholder="usuario@medcontrol.com" />
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Rol *</span>
              <select [value]="form().role" (change)="onSelect('role', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]">
                <option value="doctor">Médico</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-[#191c1e]">Perfil Médico (si aplica)</span>
              <select [value]="form().doctorId ?? ''" (change)="onSelectDoctor($event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]">
                <option value="">Sin vínculo</option>
                @for (d of data.doctors(); track d.id) {
                  <option [value]="d.id">{{ d.name }}</option>
                }
              </select>
            </label>
          </div>
        </div>
        <div modal-footer class="flex items-center justify-end gap-2.5">
          <app-button variant="light" size="md" (click)="close()">Cancelar</app-button>
          <app-button variant="primary" size="md" icon="check" (click)="save()">Crear Usuario</app-button>
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
export class UsersManagementComponent {
  data = inject(MockDataService);
  toast = inject(ToastService);

  users = computed(() => this.data.getCatalogUsers());

  readonly showModal = signal(false);
  readonly form = signal<AppUser>({ id: '', name: '', email: '', role: 'doctor', doctorId: undefined, active: true });
  readonly credentials = signal<{ name: string; email: string; password: string } | null>(null);

  private update(key: string, value: unknown): void {
    this.form.update((f) => ({ ...f, [key]: value as never }));
  }

  onInput(key: string, event: Event): void {
    this.update(key, (event.target as HTMLInputElement).value);
  }

  onSelect(key: string, event: Event): void {
    this.update(key, (event.target as HTMLSelectElement).value);
  }

  onSelectDoctor(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.update('doctorId', value || undefined);
  }

  openNew(): void {
    this.form.set({ id: '', name: '', email: '', role: 'doctor', doctorId: undefined, active: true });
    this.showModal.set(true);
  }

  close(): void {
    this.showModal.set(false);
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

  save(): void {
    const f = this.form();
    if (!f.name.trim() || !f.email.trim()) {
      this.toast.show('Faltan Datos', 'Ingrese el nombre y correo del usuario.', 'warning');
      return;
    }
    if (this.data.emailTaken(f.email.trim())) {
      this.toast.show('Correo Duplicado', 'Ya existe una cuenta con ese correo electrónico.', 'error');
      return;
    }
    this.data.addCatalogUser(
      { ...f, id: 'usr-' + Date.now().toString().slice(-6), name: f.name.trim(), email: f.email.trim() },
      (r) => {
        this.credentials.set({
          name: r.user.name,
          email: r.user.email,
          password: r.tempPassword ?? '',
        });
        this.toast.show('Usuario Creado', `La contraseña temporal se muestra una sola vez.`, 'info');
      },
    );
    this.close();
  }

  toggle(id: string): void {
    this.data.toggleCatalogUserActive(id);
    const user = this.data.getCatalogUsers().find((u) => u.id === id);
    this.toast.show('Acceso Actualizado', user ? `${user.name} ${user.active ? 'habilitado' : 'deshabilitado'}.` : '');
  }
}