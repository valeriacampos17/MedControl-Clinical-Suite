import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { MockDataService } from './mock-data.service';
import { User } from '../models/types';
import { getStoredToken, storeToken, clearToken } from '../interceptors/jwt.interceptor';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private api = inject(ApiService);
  private data = inject(MockDataService);

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isDoctor = computed(() => this.currentUser()?.role === 'doctor');
  readonly loginError = signal('');
  readonly mustChangePassword = signal(false);

  async login(email: string, password: string): Promise<boolean> {
    this.loginError.set('');
    try {
      const res = (await firstValueFrom(this.api.post<{ token: string; user: User; mustChangePassword?: boolean }>('/auth/login', { email, password }))) as { token: string; user: User; mustChangePassword?: boolean };
      storeToken(res.token);
      this.currentUser.set(res.user);
      this.mustChangePassword.set(res.mustChangePassword === true || res.user.mustChangePassword === true);
      await this.data.initialize();
      return true;
    } catch (err) {
      this.loginError.set(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
      return false;
    }
  }

  /** Restaura la sesión desde el token almacenado (recarga de página). */
  async restoreSession(): Promise<boolean> {
    const token = getStoredToken();
    if (!token) return false;
    try {
      const res = (await firstValueFrom(this.api.get<{ user: User; mustChangePassword?: boolean }>('/auth/me'))) as { user: User; mustChangePassword?: boolean };
      this.currentUser.set(res.user);
      this.mustChangePassword.set(res.mustChangePassword === true || res.user.mustChangePassword === true);
      await this.data.initialize();
      return true;
    } catch {
      clearToken();
      this.currentUser.set(null);
      this.mustChangePassword.set(false);
      this.data.reset?.();
      return false;
    }
  }

  logout(): void {
    clearToken();
    this.currentUser.set(null);
    this.mustChangePassword.set(false);
    this.router.navigate(['/login']);
  }

  /** Marca la contraseña como ya cambiada (POST /auth/change-password OK). */
  confirmPasswordChanged(): void {
    this.mustChangePassword.set(false);
    this.currentUser.update((u) => (u ? { ...u, mustChangePassword: false } : u));
  }

  getDoctorId(): string | null {
    return this.currentUser()?.doctorId ?? null;
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).filter((_, i, arr) => i === 0 || i === arr.length - 1).join('').toUpperCase();
  }
}