import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-cambiar-contrasena',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[#f2f4f6] p-4">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <div class="flex flex-col items-center mb-8">
            <div class="w-14 h-14 rounded-2xl bg-[#006a61] text-white flex items-center justify-center text-[24px] font-bold shadow-sm mb-4">
              M
            </div>
            <h1 class="text-[20px] font-bold text-[#191c1e] tracking-tight">Cambiar contraseña</h1>
            <p class="text-[13px] text-[#76777d] mt-1 text-center">
              Tu contraseña fue generada por el administrador y debe ser cambiada antes de continuar.
            </p>
          </div>

          <form (ngSubmit)="handleSubmit()" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Contraseña actual</label>
              <input
                [type]="showCurrent ? 'text' : 'password'"
                [(ngModel)]="currentPassword"
                name="currentPassword"
                placeholder="••••••••"
                class="w-full h-11 px-4 rounded-lg bg-[#f2f4f6] text-[14px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#006a61] focus:bg-white border border-[#e0e3e5] transition-all"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Nueva contraseña</label>
              <input
                [type]="showNew ? 'text' : 'password'"
                [(ngModel)]="newPassword"
                name="newPassword"
                placeholder="Mínimo 8 caracteres"
                class="w-full h-11 px-4 rounded-lg bg-[#f2f4f6] text-[14px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#006a61] focus:bg-white border border-[#e0e3e5] transition-all"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Confirmar nueva contraseña</label>
              <input
                [type]="showNew ? 'text' : 'password'"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                placeholder="Repite la nueva contraseña"
                class="w-full h-11 px-4 rounded-lg bg-[#f2f4f6] text-[14px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#006a61] focus:bg-white border border-[#e0e3e5] transition-all"
              />
            </div>

            <div class="flex gap-2">
              <button type="button" (click)="showCurrent = !showCurrent" class="flex items-center gap-1 text-[12px] text-[#76777d] hover:text-[#006a61] transition-colors">
                <span class="material-symbols-outlined text-[16px]">{{ showCurrent ? 'visibility_off' : 'visibility' }}</span>
                Mostrar
              </button>
            </div>

            @if (error()) {
              <div class="flex items-center gap-2 p-3 rounded-lg bg-[#ffdad6] border border-[#ba1a1a]/20">
                <span class="material-symbols-outlined text-[18px] text-[#ba1a1a]">error</span>
                <span class="text-[13px] text-[#93000a] font-medium">{{ error() }}</span>
              </div>
            }

            <div class="flex flex-col gap-2 mt-2">
              <button
                type="submit"
                [disabled]="loading()"
                class="w-full h-11 rounded-lg bg-[#006a61] text-white text-[14px] font-semibold hover:bg-[#005049] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (loading()) {
                  <span class="flex items-center justify-center gap-2">
                    <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Guardando...
                  </span>
                } @else {
                  Cambiar contraseña
                }
              </button>
              <button
                type="button"
                (click)="auth.logout()"
                class="w-full h-11 rounded-lg bg-transparent text-[#76777d] text-[13px] font-medium hover:bg-[#f2f4f6] transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class CambiarContrasenaComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  readonly auth = inject(AuthService);
  private toast = inject(ToastService);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrent = false;
  showNew = false;
  loading = signal(false);
  error = signal('');

  async handleSubmit(): Promise<void> {
    this.error.set('');
    if (!this.newPassword || this.newPassword.length < 8) {
      this.error.set('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error.set('La confirmación no coincide con la nueva contraseña');
      return;
    }
    this.loading.set(true);
    try {
      await firstValueFrom(this.api.post<{ ok: boolean }>('/auth/change-password', {
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
      }));
      this.auth.confirmPasswordChanged();
      this.toast.show('Contraseña actualizada', 'Tu contraseña fue cambiada correctamente.');
      this.router.navigate(['/dashboard-de-citas']);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña');
    } finally {
      this.loading.set(false);
    }
  }
}