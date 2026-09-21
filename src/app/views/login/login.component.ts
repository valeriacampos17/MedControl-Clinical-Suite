import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#006a61] via-[#00857a] to-[#00a99a] relative overflow-hidden">
      <div class="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-[#86f2e4] opacity-10 blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#acedff] opacity-10 blur-3xl pointer-events-none"></div>

      <div class="w-full max-w-md px-4">
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <div class="flex flex-col items-center mb-8">
            <div class="w-16 h-16 rounded-2xl bg-[#006a61] text-white flex items-center justify-center text-[28px] font-bold shadow-sm mb-4">
              M
            </div>
            <h1 class="text-[22px] font-bold text-[#191c1e] tracking-tight">MedControl</h1>
            <p class="text-[13px] text-[#76777d] mt-1">Suite Clínica — Inicio de Sesión</p>
          </div>

          <form (ngSubmit)="handleLogin()" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Correo Electrónico</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-[20px]">mail</span>
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  placeholder="usuario@medcontrol.com"
                  class="w-full h-11 pl-10 pr-4 rounded-lg bg-[#f2f4f6] text-[14px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#006a61] focus:bg-white border border-[#e0e3e5] transition-all"
                />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Contraseña</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-[20px]">lock</span>
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="••••••••"
                  class="w-full h-11 pl-10 pr-11 rounded-lg bg-[#f2f4f6] text-[14px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#006a61] focus:bg-white border border-[#e0e3e5] transition-all"
                />
                <button type="button" (click)="showPassword.set(!showPassword())" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777d] hover:text-[#45464d]">
                  <span class="material-symbols-outlined text-[20px]">{{ showPassword() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>

            @if (error()) {
              <div class="flex items-center gap-2 p-3 rounded-lg bg-[#ffdad6] border border-[#ba1a1a]/20">
                <span class="material-symbols-outlined text-[18px] text-[#ba1a1a]">error</span>
                <span class="text-[13px] text-[#93000a] font-medium">{{ error() }}</span>
              </div>
            }

            <button
              type="submit"
              [disabled]="loading()"
              class="w-full h-11 rounded-lg bg-[#006a61] text-white text-[14px] font-semibold hover:bg-[#005049] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              @if (loading()) {
                <span class="flex items-center justify-center gap-2">
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Iniciando sesión...
                </span>
              } @else {
                Iniciar Sesión
              }
            </button>
          </form>

          <div class="mt-6 pt-5 border-t border-[#eceef0]">
            <button type="button" (click)="showCredentials.set(!showCredentials())" class="flex items-center gap-2 text-[12px] text-[#76777d] hover:text-[#006a61] transition-colors w-full justify-center">
              <span class="material-symbols-outlined text-[16px]">key</span>
              Credenciales de prueba
              <span class="material-symbols-outlined text-[16px]">{{ showCredentials() ? 'expand_less' : 'expand_more' }}</span>
            </button>
            @if (showCredentials()) {
              <div class="mt-3 p-3 rounded-lg bg-[#f2f4f6] border border-[#e0e3e5]">
                <div class="flex flex-col gap-2 text-[12px]">
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-[#45464d]">Admin:</span>
                    <span class="text-[#191c1e]">admin&#64;medcontrol.com / admin123</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-[#45464d]">Dra. Aguirre:</span>
                    <span class="text-[#191c1e]">aguirre&#64;medcontrol.com / doctor123</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-[#45464d]">Dr. Mawad:</span>
                    <span class="text-[#191c1e]">mawad&#64;medcontrol.com / doctor123</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-[#45464d]">Dra. Muñoz:</span>
                    <span class="text-[#191c1e]">munoz&#64;medcontrol.com / doctor123</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <p class="text-center text-[11px] text-white/60 mt-6">MedControl Sede Central v3.4.1 EHR</p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  showPassword = signal(false);
  showCredentials = signal(false);
  loading = signal(false);
  error = signal('');

  constructor() {
    this.restore();
  }

  private async restore(): Promise<void> {
    const restored = await this.auth.restoreSession();
    if (restored) this.router.navigate(['/dashboard-de-citas']);
  }

  async handleLogin(): Promise<void> {
    this.error.set('');
    this.loading.set(true);

    const success = await this.auth.login(this.email, this.password);
    this.loading.set(false);
    if (success) {
      this.router.navigate(['/dashboard-de-citas']);
    } else {
      this.error.set(this.auth.loginError() || 'Correo o contraseña incorrectos');
    }
  }
}
