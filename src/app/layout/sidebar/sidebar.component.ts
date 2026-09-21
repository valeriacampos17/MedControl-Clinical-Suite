import { Component, inject, computed } from '@angular/core';
import { NavigationService } from '../../core/services/navigation.service';
import { AuthService } from '../../core/services/auth.service';
import { NavRoute } from '../../core/models/types';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  template: `
    @if (nav.mobileMenuOpen()) {
      <div
        class="fixed inset-0 bg-[#191c1e]/40 backdrop-blur-xs z-40 lg:hidden"
        (click)="nav.closeMobileMenu()"
      ></div>
    }

    <aside
      class="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-[1px_0_8px_rgba(0,0,0,0.02)] border-r border-[#eceef0] z-40 flex flex-col justify-between p-3.5 overflow-y-auto transition-transform duration-200 lg:translate-x-0"
      [class.translate-x-0]="nav.mobileMenuOpen()"
      [class.-translate-x-full]="!nav.mobileMenuOpen()"
      [class.lg:translate-x-0]="true"
    >
      <div class="flex flex-col gap-3">
        <div class="px-2 py-1 flex items-center justify-between">
          <span class="text-[11px] font-bold text-[#76777d] uppercase tracking-wider">
            Navegación Principal
          </span>
          @if (nav.mobileMenuOpen()) {
            <button
              type="button"
              (click)="nav.closeMobileMenu()"
              class="lg:hidden p-1 text-[#76777d] hover:text-[#191c1e]"
            >
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          }
        </div>

        <nav class="flex flex-col gap-1">
          @for (item of filteredNavItems(); track item.id) {
            <button
              type="button"
              (click)="onItemClick(item.id)"
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left"
              [class]="nav.currentRoute() === item.id
                ? 'bg-[#131b2e] text-white font-semibold shadow-sm'
                : 'text-[#45464d] hover:bg-[#f2f4f6] hover:text-[#191c1e]'"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span
                  class="material-symbols-outlined text-[20px] shrink-0"
                  [class]="nav.currentRoute() === item.id ? 'text-[#86f2e4]' : 'text-[#76777d]'"
                >
                  {{ item.icon }}
                </span>
                <span class="truncate">{{ item.label }}</span>
              </div>
              @if (item.count) {
                <span
                  class="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  [class]="nav.currentRoute() === item.id
                    ? 'bg-[#86f2e4] text-[#006f66]'
                    : 'bg-[#ffdad6] text-[#ba1a1a]'"
                >
                  {{ item.count }}
                </span>
              }
            </button>
          }
        </nav>
      </div>

      <div class="flex flex-col gap-1 border-t border-[#eceef0] pt-3">
        <nav class="flex flex-col gap-1">
          <button
            type="button"
            (click)="onItemClick('mantenimiento-de-catalogos')"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors text-left"
            [class]="nav.currentRoute() === 'mantenimiento-de-catalogos'
              ? 'bg-[#131b2e] text-white font-semibold shadow-sm'
              : 'text-[#45464d] hover:bg-[#f2f4f6] hover:text-[#191c1e]'"
          >
            <span
              class="material-symbols-outlined text-[20px] shrink-0"
              [class]="nav.currentRoute() === 'mantenimiento-de-catalogos'
                ? 'text-[#86f2e4]'
                : 'text-[#76777d]'"
            >
              database
            </span>
            <span>Mantenimiento de Catálogos</span>
          </button>
        </nav>
        @if (auth.isAdmin()) {
          <nav class="flex flex-col gap-1">
            <button
              type="button"
              (click)="onItemClick('configuracion-del-sistema')"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors text-left"
              [class]="nav.currentRoute() === 'configuracion-del-sistema'
                ? 'bg-[#131b2e] text-white font-semibold shadow-sm'
                : 'text-[#45464d] hover:bg-[#f2f4f6] hover:text-[#191c1e]'"
            >
              <span
                class="material-symbols-outlined text-[20px] shrink-0"
                [class]="nav.currentRoute() === 'configuracion-del-sistema'
                  ? 'text-[#86f2e4]'
                  : 'text-[#76777d]'"
              >
                settings
              </span>
              <span>Configuración del Sistema</span>
            </button>
          </nav>
        }

        <div class="mt-3 p-2.5 rounded-lg bg-[#f2f4f6] flex items-center justify-between border border-[#e0e3e5]">
          <div class="flex flex-col">
            <span class="text-[11px] font-bold text-[#191c1e]">
              MedControl Sede Central
            </span>
            <span class="text-[11px] text-[#76777d]">
              v3.4.1 EHR
            </span>
          </div>
          <span class="material-symbols-outlined text-[#006a61] text-[18px]">
            verified
          </span>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  nav = inject(NavigationService);
  auth = inject(AuthService);

  allNavItems: { id: NavRoute; label: string; icon: string; count?: number; adminOnly?: boolean }[] = [
    { id: 'dashboard-de-citas', label: 'Dashboard de Citas', icon: 'grid_view' },
    { id: 'pacientes-y-historial-clinico', label: 'Pacientes & Historial Clínico', icon: 'person_search' },
    { id: 'agenda-y-disponibilidad', label: 'Agenda & Disponibilidad', icon: 'calendar_today', adminOnly: true },
    { id: 'recetas-y-examenes', label: 'Recetas & Exámenes', icon: 'prescriptions' },
    { id: 'notificaciones-y-alertas', label: 'Notificaciones & Alertas', icon: 'warning', count: 2 },
  ];

  filteredNavItems = computed(() => {
    if (this.auth.isAdmin()) return this.allNavItems;
    return this.allNavItems.filter(item => !item.adminOnly);
  });

  onItemClick(id: NavRoute): void {
    this.nav.navigate(id);
    this.nav.closeMobileMenu();
  }
}
