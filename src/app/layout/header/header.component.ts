import { Component, inject, signal } from '@angular/core';
import { NavigationService } from '../../core/services/navigation.service';
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
              src="https://lh3.googleusercontent.com/aida/AEtjO1V82pwfuDLTk5-ehmXKHF892ZY_9YFqOHRFT6iLpeObTH2QZ_NHJTPzdxf_OS4xlUsvSN6oMowcQTI1BfBXq2Y7W21gTuFX-lxdEPIT-r3of9FRU9BprnBayQE2pXODaIAfeNHb-2T6ajlkh62f8pO51MMv46ew6r440Fqu2sJbisJ-8vEtk_Gca6Yc8ZCr1h6iQzmrz-y7dIR78MIbXDRjcUmjqIqnfTFgw4D7rcEm8Rn1jTP86ebNDhc"
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
              placeholder="Buscar paciente por RUT, nombre o cita médica..."
              class="w-full h-9 pl-10 pr-4 rounded-lg bg-[#f2f4f6] text-[13px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#006a61] transition-all border border-transparent focus:border-[#006a61]"
            />
          </div>

          @if (showSearchDropdown() && searchQuery().trim() !== '') {
            <div class="absolute top-11 left-0 right-0 bg-white rounded-xl shadow-xl border border-[#eceef0] p-2 z-50">
              <div class="text-[11px] font-bold text-[#76777d] uppercase px-2 py-1">
                Resultados coincidentes ({{ searchResults().length }})
              </div>
              @if (searchResults().length > 0) {
                @for (item of searchResults(); track item.name) {
                  <div
                    (click)="onSearchSelect(item.route)"
                    class="flex items-center justify-between p-2 rounded-lg hover:bg-[#f2f4f6] cursor-pointer"
                  >
                    <div>
                      <p class="text-[13px] font-semibold text-[#191c1e]">{{ item.name }}</p>
                      <p class="text-[11px] text-[#76777d]">RUT: {{ item.rut }} · {{ item.age }}</p>
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
              (click)="showNotifications.set(!showNotifications())"
              aria-label="Notificaciones y alertas"
              class="relative p-2 rounded-lg text-[#45464d] hover:bg-[#eceef0] hover:text-[#191c1e] transition-colors"
            >
              <span class="material-symbols-outlined text-[22px]">notifications</span>
              <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white"></span>
            </button>

            @if (showNotifications()) {
              <div class="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-[#eceef0] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div class="flex items-center justify-between pb-2 mb-2 border-b border-[#eceef0]">
                  <span class="text-[13px] font-bold text-[#191c1e]">Notificaciones Clínicas</span>
                  <span class="text-[10px] bg-[#ffdad6] text-[#ba1a1a] font-bold px-1.5 py-0.5 rounded">2 Nuevas</span>
                </div>
                <div class="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  <div class="p-2 bg-[#f2f4f6] rounded-lg text-left">
                    <p class="text-[12px] font-semibold text-[#191c1e]">Alergia confirmada - Juan Pérez</p>
                    <p class="text-[11px] text-[#45464d]">Reportada reacción anafiláctica a Penicilina.</p>
                    <span class="text-[10px] text-[#76777d]">Hace 12 min</span>
                  </div>
                  <div class="p-2 bg-[#f2f4f6] rounded-lg text-left">
                    <p class="text-[12px] font-semibold text-[#191c1e]">Cancelación de Turno 16:00</p>
                    <p class="text-[11px] text-[#45464d]">Slot liberado reasignado a lista prioritaria.</p>
                    <span class="text-[10px] text-[#76777d]">Hace 35 min</span>
                  </div>
                </div>
                <button
                  type="button"
                  (click)="onAlertsClick()"
                  class="w-full mt-2 pt-2 border-t border-[#eceef0] text-center text-[12px] text-[#006a61] font-semibold hover:underline"
                >
                  Ver centro de alertas completo
                </button>
              </div>
            }
          </div>

          <div class="relative">
            <button
              type="button"
              (click)="showUserMenu.set(!showUserMenu())"
              class="flex items-center gap-2.5 pl-1 rounded-lg hover:bg-[#f2f4f6] p-1 transition-colors"
            >
              <img
                alt="Dr. Carlos Morales"
                class="w-8 h-8 rounded-full object-cover ring-1 ring-[#c6c6cd]"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSHsgEjGZ0cxVdyPbRujNWgQPxPCQnVDFiXRZz5rqGvJmU0pMW8ZqlOnPCphAMLOp3Wrd4JhYRy9Uhwx2R2rdq2tU2QHDbOzP_0Lz8gWO-iy9ABJzF87tBTJOdZX3bwmamCTX71h9fGtRsPb6E2di0VCs4y6nuRguN8i-vD_7PbZe-YswWdPmEJt5aFYuLwAVV8LgiNMeIvQu54GsCKpW1z1xmq06CD0_itRMS7By_ZI2fp_TWLrsU"
              />
              <div class="hidden lg:flex flex-col text-left">
                <span class="text-[13px] font-bold text-[#191c1e] leading-tight">
                  Dr. Carlos Morales
                </span>
                <span class="text-[11px] text-[#45464d] leading-none">
                  Medicina Interna
                </span>
              </div>
              <span class="material-symbols-outlined text-[#76777d] text-[18px]">
                expand_more
              </span>
            </button>

            @if (showUserMenu()) {
              <div class="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-2xl border border-[#eceef0] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div class="p-2 border-b border-[#eceef0] mb-1">
                  <p class="text-[13px] font-bold text-[#191c1e]">Dr. Carlos Morales</p>
                  <p class="text-[11px] text-[#76777d]">c.morales@clinica.cl</p>
                </div>
                <button
                  type="button"
                  (click)="onConfigClick()"
                  class="w-full flex items-center gap-2 p-2 rounded-lg text-[13px] text-[#191c1e] hover:bg-[#f2f4f6]"
                >
                  <span class="material-symbols-outlined text-[18px]">settings</span>
                  <span>Configuración de Perfil</span>
                </button>
                <button
                  type="button"
                  (click)="onAgendaClick()"
                  class="w-full flex items-center gap-2 p-2 rounded-lg text-[13px] text-[#191c1e] hover:bg-[#f2f4f6]"
                >
                  <span class="material-symbols-outlined text-[18px]">calendar_today</span>
                  <span>Mi Agenda Clínica</span>
                </button>
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

  searchQuery = signal('');
  showNotifications = signal(false);
  showUserMenu = signal(false);
  showSearchDropdown = signal(false);

  searchResults = signal([
    { name: 'Juan Pérez Morales', rut: '14.892.401-2', age: '58 años', route: 'pacientes-y-historial-clinico' as NavRoute },
    { name: 'María Elena Morales', rut: '15.204.912-3', age: '52 años', route: 'dashboard-de-citas' as NavRoute },
    { name: 'Roberto Gómez', rut: '11.450.812-9', age: '64 años', route: 'agenda-y-disponibilidad' as NavRoute },
  ]);

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.showSearchDropdown.set(true);
  }

  onSearchSelect(route: NavRoute): void {
    this.nav.navigate(route);
    this.searchQuery.set('');
    this.showSearchDropdown.set(false);
  }

  onAlertsClick(): void {
    this.showNotifications.set(false);
    this.nav.navigate('notificaciones-y-alertas');
  }

  onConfigClick(): void {
    this.showUserMenu.set(false);
    this.nav.navigate('configuracion-del-sistema');
  }

  onAgendaClick(): void {
    this.showUserMenu.set(false);
    this.nav.navigate('agenda-y-disponibilidad');
  }
}
