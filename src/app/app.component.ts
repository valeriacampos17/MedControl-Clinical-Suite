import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { NavigationService } from './core/services/navigation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex flex-col font-sans selection:bg-[#86f2e4] selection:text-[#006f66]">
      @if (nav.currentRoute() !== 'login') {
        <app-header />
      }
      <div class="flex flex-1" [class.pt-16]="nav.currentRoute() !== 'login'">
        @if (nav.currentRoute() !== 'login') {
          <app-sidebar />
        }
        <main class="flex-1 min-w-0 transition-all duration-200" [class.lg:ml-64]="nav.currentRoute() !== 'login'">
          @if (nav.currentRoute() !== 'login') {
            <div class="bg-white/80 backdrop-blur-xs border-b border-[#eceef0] px-4 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto text-[12px]">
              <nav class="flex items-center gap-1.5 shrink-0">
                <span class="material-symbols-outlined text-[16px] text-[#76777d]">home</span>
                <span class="text-[#76777d]">/</span>
                <span class="text-[12px] font-semibold text-[#191c1e]">{{ currentLabel() }}</span>
              </nav>
              <div class="hidden md:flex items-center gap-2 text-[11px] text-[#76777d] shrink-0">
                <span class="material-symbols-outlined text-[14px]">schedule</span>
                <span>{{ currentTime() }}</span>
              </div>
            </div>
          }
          <div class="w-full">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  nav = inject(NavigationService);

  currentTime = signal('');

  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.updateTime();
    this.intervalId = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private updateTime(): void {
    this.currentTime.set(new Date().toLocaleTimeString('es-CL'));
  }

  private routeLabels: Record<string, string> = {
    'dashboard-de-citas': 'Dashboard de Citas',
    'pacientes-y-historial-clinico': 'Pacientes & Historial Clínico',
    'agenda-y-disponibilidad': 'Agenda & Disponibilidad',
    'recetas-y-examenes': 'Recetas & Exámenes',
    'notificaciones-y-alertas': 'Notificaciones & Alertas',
    'configuracion-del-sistema': 'Configuración del Sistema',
  };

  currentLabel = (): string => this.routeLabels[this.nav.currentRoute()] || 'Dashboard de Citas';
}
