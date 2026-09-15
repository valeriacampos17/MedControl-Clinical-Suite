import { Component } from '@angular/core';
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
      <app-header />
      <div class="flex flex-1 pt-16">
        <app-sidebar />
        <main class="flex-1 lg:ml-64 min-w-0 transition-all duration-200">
          <div class="bg-white/80 backdrop-blur-xs border-b border-[#eceef0] px-4 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto text-[12px]">
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="text-[11px] font-bold text-[#76777d] uppercase tracking-wider mr-1">
                Pantallas Disponibles:
              </span>
              @for (screen of screens; track screen.id) {
                <button
                  type="button"
                  (click)="nav.navigate(screen.id)"
                  class="px-2.5 py-1 rounded-full font-medium transition-all"
                  [class]="nav.currentRoute() === screen.id
                    ? 'bg-[#006a61] text-white font-semibold shadow-xs'
                    : 'bg-[#f2f4f6] text-[#45464d] hover:bg-[#e6e8ea] hover:text-[#191c1e]'"
                >
                  {{ screen.label }}
                </button>
              }
            </div>
            <div class="hidden md:flex items-center gap-2 text-[11px] text-[#76777d] shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-[#006a61]"></span>
              <span>HL7 FHIR v4.0.1 Conectado</span>
            </div>
          </div>
          <div class="w-full">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `,
})
export class AppComponent {
  nav: NavigationService;

  screens = [
    { id: 'dashboard-de-citas' as const, label: '1. Dashboard Citas' },
    { id: 'pacientes-y-historial-clinico' as const, label: '2. Historial Paciente' },
    { id: 'agenda-y-disponibilidad' as const, label: '3. Agendar Cita' },
    { id: 'configuracion-del-sistema' as const, label: '4. Configuración Doctor' },
  ];

  constructor(nav: NavigationService) {
    this.nav = nav;
  }
}
