import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '../../core/services/navigation.service';
import { AuthService } from '../../core/services/auth.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { OnboardingService, type SetupTask } from '../../core/services/onboarding.service';
import { NavRoute } from '../../core/models/types';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="fixed top-0 left-0 right-0 z-50 h-16 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#eceef0]">
      <div class="w-full h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        <div class="flex items-center gap-4 sm:gap-6">
          <button
            type="button"
            (click)="nav.openMobileMenu()"
            class="lg:hidden p-2 rounded-lg text-[#45464d] hover:bg-[#eceef0] transition-colors"
            aria-label="Abrir menú"
          >
            <span class="material-symbols-outlined text-[24px]">menu</span>
          </button>

          <div
            (click)="nav.navigate('dashboard-de-citas')"
            class="flex items-center gap-2 cursor-pointer select-none"
          >
            <img
              alt="MedControl Brand Logo"
              class="h-8 w-auto object-contain"
              src="assets/images/medcontrol-logo.svg"
            />
          </div>
        </div>

        <div class="hidden md:flex flex-1 max-w-md items-center relative">
          <div class="relative w-full">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-[20px]">
              search
            </span>
            <input
              type="search"
              [value]="searchQuery()"
              (input)="onSearchInput($event)"
              (focus)="showSearchDropdown.set(true)"
              placeholder="Buscar paciente por CI, nombre o cita médica..."
              class="w-full h-9 pl-10 pr-4 rounded-lg bg-[#f2f4f6] text-[13px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#006a61] transition-all border border-transparent focus:border-[#006a61]"
            />
          </div>

          @if (showSearchDropdown() && searchQuery().trim() !== '') {
            <div class="absolute top-11 left-0 right-0 bg-white rounded-xl shadow-xl border border-[#eceef0] p-2 z-50">
              <div class="text-[11px] font-bold text-[#76777d] uppercase px-2 py-1">
                Resultados coincidentes ({{ searchResults().length }})
              </div>
              @if (searchResults().length > 0) {
                @for (item of searchResults(); track item.id) {
                  <div
                    (click)="onSearchSelect(item.id)"
                    class="flex items-center justify-between p-2 rounded-lg hover:bg-[#f2f4f6] cursor-pointer"
                  >
                    <div>
                      <p class="text-[13px] font-semibold text-[#191c1e]">{{ item.name }}</p>
                      <p class="text-[11px] text-[#76777d]">CI: {{ item.ci }} · {{ item.age }}</p>
                    </div>
                    <span class="material-symbols-outlined text-[#006a61] text-[18px]">
                      arrow_forward
                    </span>
                  </div>
                }
              } @else {
                <div class="p-3 text-[13px] text-[#76777d] text-center">
                  No se encontraron pacientes con "{{ searchQuery() }}"
                </div>
              }
            </div>
          }
        </div>

        <div class="flex items-center gap-3 sm:gap-5">
          <div class="hidden sm:flex items-center gap-1.5 bg-[#eceef0] px-2.5 py-1 rounded-full">
            <span class="w-2 h-2 rounded-full bg-[#006a61] animate-pulse"></span>
            <span class="text-[11px] font-semibold text-[#45464d]">Servicio Operativo</span>
          </div>

          <div class="relative">
            <button
              type="button"
              (click)="toggleNotifications()"
              aria-label="Notificaciones y alertas"
              class="relative p-2 rounded-lg text-[#45464d] hover:bg-[#eceef0] hover:text-[#191c1e] transition-colors"
            >
              <span class="material-symbols-outlined text-[22px]">notifications</span>
              @if (auth.isDoctor() ? setupPending() : data.unreadNotifications() > 0) {
                <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white"></span>
              }
            </button>

            @if (showNotifications()) {
              <div class="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-[#eceef0] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div class="flex items-center justify-between pb-2 mb-2 border-b border-[#eceef0]">
                  <span class="text-[13px] font-bold text-[#191c1e]">Notificaciones Clínicas</span>
                  @if (auth.isDoctor()) {
                    <span
                      class="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      [class.bg-[#ffdad6]]="setupPending()"
                      [class.text-[#ba1a1a]]="setupPending()"
                      [class.bg-[#f2f4f6]]="!setupPending()"
                      [class.text-[#76777d]]="!setupPending()"
                    >
                      {{ setupPending() ? setupCount() + (setupCount() === 1 ? ' Pendiente' : ' Pendientes') : 'Al día' }}
                    </span>
                  } @else {
                    <span class="text-[10px] bg-[#ffdad6] text-[#ba1a1a] font-bold px-1.5 py-0.5 rounded">{{ data.unreadNotifications() }} Nuevas</span>
                  }
                </div>
                <div class="flex flex-col gap-2 max-h-80 overflow-y-auto">
                  @if (auth.isDoctor()) {
                    @if (setupPending()) {
                      <div class="text-[11px] font-bold text-[#76777d] uppercase tracking-wider px-1 pt-1">
                        Para comenzar a operar
                      </div>
                      @for (task of onboarding.tasks(); track task.id) {
                        <button
                          type="button"
                          (click)="onSetupTaskClick(task)"
                          class="w-full p-2 bg-[#fff4e5] rounded-lg text-left hover:bg-[#ffe8cc] transition-colors text-start"
                        >
                          <span class="flex items-center gap-1.5 text-[12px] font-bold text-[#92400e]">
                            <span class="material-symbols-outlined text-[16px]">build_circle</span>
                            <span>{{ task.title }}</span>
                          </span>
                          <span class="text-[11px] text-[#78350f] mt-0.5 block leading-snug">{{ task.description }}</span>
                          <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006a61] mt-1">
                            Ir a configurar
                            <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </span>
                        </button>
                      }
                    } @else {
                      <div class="p-3 text-[13px] text-[#76777d] text-center">
                        No tienes pendientes de configuración. Tu horario y días están al día.
                      </div>
                    }
                  } @else {
                    @for (note of data.notifications().slice(0, 4); track note.id) {
                      <button
                        type="button"
                        (click)="onNotificationClick(note.route)"
                        class="p-2 rounded-lg text-left transition-colors hover:bg-[#e6e8ea]"
                        [class]="note.isRead ? 'bg-[#f2f4f6]' : 'bg-[#ffdad6]/30'"
                      >
                        <span class="flex items-center gap-1.5 text-[12px] font-semibold text-[#191c1e]">
                          @if (!note.isRead) {
                            <span class="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] shrink-0"></span>
                          }
                          <span class="material-symbols-outlined text-[15px] text-[#006a61]">{{ note.icon }}</span>
                          <span class="truncate">{{ note.title }}</span>
                        </span>
                        <span class="text-[11px] text-[#45464d] mt-0.5 block leading-snug">{{ note.description }}</span>
                        <span class="text-[10px] text-[#76777d]">{{ relativeTime(note.time) }}</span>
                      </button>
                    } @empty {
                      <div class="p-3 text-[13px] text-[#76777d] text-center">No hay notificaciones.</div>
                    }
                  }
                </div>
                @if (auth.isAdmin()) {
                  <button
                    type="button"
                    (click)="onAlertsClick()"
                    class="w-full mt-2 pt-2 border-t border-[#eceef0] text-center text-[12px] text-[#006a61] font-semibold hover:underline"
                  >
                    Ver centro de alertas completo
                  </button>
                }
              </div>
            }
          </div>

          <div class="relative">
            <button
              type="button"
              (click)="showUserMenu.set(!showUserMenu())"
              class="flex items-center gap-2.5 pl-1 rounded-lg hover:bg-[#f2f4f6] p-1 transition-colors"
            >
              @if (loggedAvatar()) {
                <img
                  [alt]="auth.currentUser()?.name ?? ''"
                  class="w-8 h-8 rounded-full object-cover ring-1 ring-[#c6c6cd]"
                  [src]="loggedAvatar()"
                />
              } @else {
                <div class="w-8 h-8 rounded-full bg-[#006a61] text-white flex items-center justify-center text-[12px] font-bold ring-1 ring-[#c6c6cd]">
                  {{ auth.getInitials(auth.currentUser()?.name ?? '') }}
                </div>
              }
              <div class="hidden lg:flex flex-col text-left">
                <span class="text-[13px] font-bold text-[#191c1e] leading-tight">
                  {{ auth.currentUser()?.name }}
                </span>
                <span class="text-[11px] text-[#45464d] leading-none">
                  {{ auth.currentUser()?.role === 'admin' ? 'Administrativo' : 'Médico' }}
                </span>
              </div>
              <span class="material-symbols-outlined text-[#76777d] text-[18px]">
                expand_more
              </span>
            </button>

            @if (showUserMenu()) {
              <div class="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-2xl border border-[#eceef0] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div class="p-2 border-b border-[#eceef0] mb-1">
                  <p class="text-[13px] font-bold text-[#191c1e]">{{ auth.currentUser()?.name }}</p>
                  <p class="text-[11px] text-[#76777d]">{{ auth.currentUser()?.email }}</p>
                </div>
                @if (auth.isAdmin()) {
                  <button
                    type="button"
                    (click)="onConfigClick()"
                    class="w-full flex items-center gap-2 p-2 rounded-lg text-[13px] text-[#191c1e] hover:bg-[#f2f4f6]"
                  >
                    <span class="material-symbols-outlined text-[18px]">settings</span>
                    <span>Configuración del Sistema</span>
                  </button>
                }
                <button
                  type="button"
                  (click)="onAgendaClick()"
                  class="w-full flex items-center gap-2 p-2 rounded-lg text-[13px] text-[#191c1e] hover:bg-[#f2f4f6]"
                >
                  <span class="material-symbols-outlined text-[18px]">calendar_today</span>
                  <span>Mi Agenda Clínica</span>
                </button>
                <div class="border-t border-[#eceef0] mt-1 pt-1">
                  <button
                    type="button"
                    (click)="handleLogout()"
                    class="w-full flex items-center gap-2 p-2 rounded-lg text-[13px] text-[#ba1a1a] hover:bg-[#ffdad6]"
                  >
                    <span class="material-symbols-outlined text-[18px]">logout</span>
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  nav = inject(NavigationService);
  private router = inject(Router);
  auth = inject(AuthService);
  onboarding = inject(OnboardingService);
  data = inject(MockDataService);

  /** Avatar del usuario logueado: para médicos usa la foto de su perfil médico
   *  (tabla doctors), con fallback a la foto de la cuenta de usuario. */
  readonly loggedAvatar = computed(() => {
    if (this.auth.isDoctor()) {
      const doctorId = this.auth.getDoctorId();
      const doctor = doctorId ? this.data.doctors().find((d) => d.id === doctorId) : undefined;
      if (doctor?.avatarUrl) return doctor.avatarUrl;
    }
    return this.auth.currentUser()?.avatarUrl ?? null;
  });

  searchQuery = signal('');
  showNotifications = signal(false);
  showUserMenu = signal(false);
  showSearchDropdown = signal(false);

  setupPending = signal(false);
  setupCount = signal(0);
  private taskSubscription: { unsubscribe(): void } | null = null;

  /** Refresca las tareas cuando cambia el usuario (login, restore, logout). */
  private readonly userChangeEffect = effect(() => {
    this.auth.isDoctor();
    this.auth.getDoctorId();
    this.refreshSetupTasks();
  });

  private refreshSetupTasks(force = false): void {
    const doctorId = this.auth.getDoctorId();
    if (!this.auth.isDoctor() || !doctorId) {
      this.onboarding.clear();
      this.setupPending.set(false);
      this.setupCount.set(0);
      return;
    }
    if (!force && this.onboarding.pendingCount() > 0) {
      this.setupPending.set(true);
      this.setupCount.set(this.onboarding.pendingCount());
      return;
    }
    this.taskSubscription?.unsubscribe();
    this.taskSubscription = this.onboarding.refresh(doctorId).subscribe({
      next: (tasks) => {
        this.setupPending.set(tasks.length > 0);
        this.setupCount.set(tasks.length);
      },
      error: () => {
        this.setupPending.set(false);
        this.setupCount.set(0);
      },
    });
  }

  toggleNotifications(): void {
    const open = !this.showNotifications();
    this.showNotifications.set(open);
    if (open) this.refreshSetupTasks(true);
  }

  /** Pacientes reales que coinciden con el termino de busqueda (nombre o CI). */
  readonly searchResults = computed(() => {
    const t = this.searchQuery().toLowerCase().trim();
    if (!t) return [];
    return this.data
      .patients()
      .filter((p) => p.name.toLowerCase().includes(t) || p.ci.toLowerCase().includes(t))
      .slice(0, 8)
      .map((p) => ({ id: p.id, name: p.name, ci: p.ci, age: `${p.age} años` }));
  });

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.showSearchDropdown.set(true);
  }

  onSearchSelect(patientId: string): void {
    this.router.navigate(['/pacientes-y-historial-clinico'], { queryParams: { patient: patientId } });
    this.searchQuery.set('');
    this.showSearchDropdown.set(false);
  }

  onAlertsClick(): void {
    this.showNotifications.set(false);
    this.nav.navigate('notificaciones-y-alertas');
  }

  onSetupTaskClick(task: SetupTask): void {
    this.showNotifications.set(false);
    this.nav.navigate(task.route);
  }

  onNotificationClick(route: NavRoute | undefined): void {
    this.showNotifications.set(false);
    this.nav.navigate(route ?? 'notificaciones-y-alertas');
  }

  relativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return iso;
    const minutes = Math.max(0, Math.floor((Date.now() - then) / 60000));
    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    return `Hace ${Math.floor(hours / 24)} d`;
  }

  onConfigClick(): void {
    this.showUserMenu.set(false);
    this.nav.navigate('configuracion-del-sistema');
  }

  onAgendaClick(): void {
    this.showUserMenu.set(false);
    this.nav.navigate('agenda-y-disponibilidad');
  }

  handleLogout(): void {
    this.showUserMenu.set(false);
    this.auth.logout();
  }
}
