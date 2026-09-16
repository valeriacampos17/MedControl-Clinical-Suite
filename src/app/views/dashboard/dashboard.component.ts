import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '../../core/services/navigation.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { ToastComponent } from '../../shared/toast/toast.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ButtonComponent, BadgeComponent, ToastComponent],
  template: `
    <div class="flex flex-col w-full">
      <div class="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
        <div class="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-[#86f2e4] opacity-20 blur-3xl pointer-events-none -z-10"></div>
        <div class="absolute top-80 right-0 w-80 h-80 rounded-full bg-[#acedff] opacity-20 blur-3xl pointer-events-none -z-10"></div>

        <section class="w-full bg-white rounded-xl shadow-sm border border-[#e6e8ea] p-5 lg:p-6 mb-6 relative overflow-hidden">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div class="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
              <div class="relative shrink-0">
                <img
                  class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shadow-sm ring-2 ring-[#eceef0]"
                  alt="Dr. Carlos Mendoza"
                  [src]="data.doctor.avatarUrl"
                />
                <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs">
                  <span class="w-3.5 h-3.5 rounded-full bg-[#006a61] animate-pulse"></span>
                </span>
              </div>
              <div class="flex flex-col min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-1">
                  <h1 class="text-[20px] sm:text-[22px] font-bold text-[#191c1e] tracking-tight truncate">
                    {{ data.doctor.name }}
                  </h1>
                  <app-badge variant="teal" [dot]="true" [pulse]="true">En Consultorio (Atendiendo Citas)</app-badge>
                  <span class="px-2.5 py-0.5 rounded-full bg-[#e6e8ea] text-[#45464d] text-[11px] font-semibold">
                    {{ data.doctor.box }} - {{ data.doctor.wing }}
                  </span>
                </div>
                <p class="text-[13px] text-[#45464d] truncate">
                  Especialista en {{ data.doctor.specialty }} & Medicina Interna | Reg. Médico {{ data.doctor.regNumber }}
                </p>
                <div class="flex flex-wrap items-center gap-4 mt-2 text-[#45464d] text-[12px]">
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px] text-[#006a61]">verified</span>
                    Credenciales Validadas
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px] text-[#76777d]">schedule</span>
                    Turno Activo: 08:00 - 15:30
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center flex-wrap gap-2.5 self-start lg:self-center">
              <app-button variant="light" size="md" icon="emergency" (click)="handleDeclareEmergency()">
                Declarar Urgencia
              </app-button>
              <app-button variant="primary" size="md" icon="stethoscope" (click)="handleOpenConsultation()">
                Consulta en Curso
              </app-button>
            </div>
          </div>
        </section>

        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
          <div class="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#e6e8ea] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Citas de Hoy</span>
              <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#006a61]">
                <span class="material-symbols-outlined text-[20px]">calendar_today</span>
              </span>
            </div>
            <div class="mt-3 flex items-baseline justify-between">
              <div class="flex items-baseline">
                <span class="text-[34px] font-extrabold text-[#191c1e] leading-none tracking-tight">12</span>
                <span class="text-[13px] text-[#45464d] ml-1.5 font-medium">programadas</span>
              </div>
              <div class="flex items-center gap-1 bg-[#f2f4f6] px-2 py-1 rounded-md border border-[#e0e3e5]">
                <span class="w-2 h-2 rounded-full bg-[#006a61]"></span>
                <span class="text-[12px] font-semibold text-[#191c1e]">4 comp</span>
              </div>
            </div>
            <div class="mt-3 pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[#45464d] text-[11px]">
              <span class="text-[#006a61] font-semibold">1 en curso</span>
              <span>7 pendientes</span>
            </div>
            <div class="w-full h-1.5 bg-[#e6e8ea] rounded-full overflow-hidden mt-2 flex">
              <div class="h-full bg-[#006a61]" style="width: 33.3%"></div>
              <div class="h-full bg-[#86f2e4]" style="width: 8.3%"></div>
              <div class="h-full bg-[#eceef0]" style="width: 58.4%"></div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#e6e8ea] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Pacientes en Espera</span>
              <span class="w-8 h-8 rounded-lg bg-[#86f2e4]/30 flex items-center justify-center text-[#006f66]">
                <span class="material-symbols-outlined text-[20px]">airline_seat_recline_normal</span>
              </span>
            </div>
            <div class="mt-3 flex items-baseline justify-between">
              <span class="text-[34px] font-extrabold text-[#191c1e] leading-none tracking-tight">02</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-[#86f2e4]/30 text-[#006f66] text-[11px] font-semibold">Check-in OK</span>
            </div>
            <div class="mt-3 pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[#45464d] text-[11px]">
              <span>Sala Triage: 1</span>
              <span>Recepción A: 1</span>
            </div>
            <div class="w-full bg-[#e6e8ea] h-1.5 rounded-full mt-2 overflow-hidden">
              <div class="h-full bg-[#006a61] rounded-full" style="width: 40%"></div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#e6e8ea] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Próxima Cita En</span>
              <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#191c1e]">
                <span class="material-symbols-outlined text-[20px]">timer</span>
              </span>
            </div>
            <div class="mt-3 flex items-baseline justify-between">
              <div class="flex items-baseline">
                <span class="text-[34px] font-extrabold text-[#191c1e] leading-none tracking-tight">15</span>
                <span class="text-[14px] font-semibold text-[#191c1e] ml-1">min</span>
              </div>
              <span class="text-[12px] text-[#76777d] font-semibold">10:00 AM</span>
            </div>
            <div class="mt-3 pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[#45464d] text-[11px]">
              <span class="truncate">Roberto Gómez (Cardiología)</span>
              <span class="w-2 h-2 rounded-full bg-[#006a61] animate-ping"></span>
            </div>
            <div class="w-full bg-[#e6e8ea] h-1.5 rounded-full mt-2 overflow-hidden">
              <div class="h-full bg-[#006a61] rounded-full" style="width: 75%"></div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#e6e8ea] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Eficiencia / Puntualidad</span>
              <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#006a61]">
                <span class="material-symbols-outlined text-[20px]">speed</span>
              </span>
            </div>
            <div class="mt-3 flex items-baseline justify-between">
              <span class="text-[34px] font-extrabold text-[#191c1e] leading-none tracking-tight">98%</span>
              <div class="flex items-center text-[#006a61] font-bold text-[12px]">
                <span class="material-symbols-outlined text-[16px]">trending_up</span>
                <span>+2.4% sem</span>
              </div>
            </div>
            <div class="mt-3 pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[#45464d] text-[11px]">
              <span>Desviación Promedio: 2.1m</span>
              <span class="font-semibold text-[#006a61]">Óptimo</span>
            </div>
            <div class="w-full bg-[#e6e8ea] h-1.5 rounded-full mt-2 overflow-hidden">
              <div class="h-full bg-[#006a61] rounded-full" style="width: 98%"></div>
            </div>
          </div>
        </section>

        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div class="xl:col-span-8 flex flex-col gap-6">
            <div class="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-[#e6e8ea]">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b border-[#eceef0]">
                <div class="flex items-center gap-3">
                  <span class="w-9 h-9 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#006a61]">
                    <span class="material-symbols-outlined text-[22px]">view_timeline</span>
                  </span>
                  <div>
                    <h2 class="text-[17px] font-bold text-[#191c1e] tracking-tight">Cronograma Clínico de Hoy</h2>
                    <span class="text-[12px] text-[#45464d]">Lunes, 28 de Octubre 2024 · 5 Citas Visibles del Bloque Matutino</span>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-3.5 relative mt-4">
                <div class="hidden md:block absolute left-[98px] top-6 bottom-6 w-0.5 bg-[#e6e8ea]"></div>

                @for (apt of data.appointments(); track apt.id) {
                  @if (apt.status === 'completed') {
                    <div class="flex flex-col md:flex-row md:items-center gap-3.5 p-4 rounded-xl bg-[#f2f4f6] hover:bg-[#e6e8ea]/70 transition-colors border border-[#e0e3e5]">
                      <div class="w-24 shrink-0 flex items-center md:flex-col md:items-start justify-between">
                        <span class="text-[14px] font-bold text-[#191c1e]">{{ apt.time }}</span>
                        <span class="text-[11px] text-[#76777d]">{{ apt.durationMinutes }} min</span>
                      </div>
                      <div class="hidden md:flex w-6 h-6 rounded-full bg-white items-center justify-center shrink-0 shadow-xs z-10">
                        <span class="material-symbols-outlined text-[#006a61] text-[16px]">check_circle</span>
                      </div>
                      <div class="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="w-10 h-10 rounded-full bg-white border border-[#c6c6cd] flex items-center justify-center text-[13px] font-bold text-[#191c1e] shrink-0">
                            {{ apt.patientInitials }}
                          </div>
                          <div class="min-w-0">
                            <div class="flex items-center gap-2">
                              <span class="text-[14px] font-semibold text-[#191c1e] hover:text-[#006a61] cursor-pointer truncate" (click)="nav.navigate('pacientes-y-historial-clinico')">
                                {{ apt.patientName }}
                              </span>
                              <span class="text-[11px] text-[#76777d]">{{ apt.patientAge }} años</span>
                            </div>
                            <p class="text-[12px] text-[#45464d] truncate">{{ apt.reason }}</p>
                          </div>
                        </div>
                        <div class="flex items-center gap-3 self-end sm:self-center">
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6e8ea] text-[#45464d] text-[11px] font-semibold">
                            <span class="w-1.5 h-1.5 rounded-full bg-[#76777d]"></span>
                            Completada
                          </span>
                        </div>
                      </div>
                    </div>
                  }

                  @if (apt.status === 'in-progress') {
                    <div class="flex flex-col md:flex-row md:items-stretch gap-3.5 p-4 sm:p-5 rounded-xl bg-white shadow-md border-2 border-[#006a61] relative overflow-hidden">
                      <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#006a61]"></div>
                      <div class="w-24 shrink-0 flex items-center md:flex-col md:items-start justify-between pl-1">
                        <span class="text-[14px] font-bold text-[#006a61]">{{ apt.time }}</span>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#86f2e4]/30 text-[#006f66] text-[10px] font-bold uppercase tracking-wider">
                          <span class="w-1.5 h-1.5 rounded-full bg-[#006a61] animate-pulse"></span>
                          En Curso
                        </span>
                      </div>
                      <div class="hidden md:flex w-6 h-6 rounded-full bg-[#006a61] text-white items-center justify-center shrink-0 shadow-xs z-10 self-center">
                        <span class="material-symbols-outlined text-[16px]">play_arrow</span>
                      </div>
                      <div class="flex-1 flex flex-col justify-between gap-3 min-w-0">
                        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div class="flex items-center gap-3 min-w-0">
                            <img class="w-12 h-12 rounded-xl object-cover shrink-0 shadow-xs ring-1 ring-[#e6e8ea]" [alt]="apt.patientName" [src]="data.patientMariaMorales.avatarUrl" />
                            <div class="min-w-0">
                              <div class="flex items-center gap-2 flex-wrap">
                                <span class="text-[15px] font-bold text-[#191c1e] truncate">{{ apt.patientName }}</span>
                                <span class="px-2 py-0.5 rounded bg-[#e6e8ea] text-[11px] font-semibold text-[#45464d]">ID: MED-9482</span>
                              </div>
                              <p class="text-[12px] text-[#45464d] truncate">{{ apt.reason }}</p>
                            </div>
                          </div>
                          <app-button variant="primary" size="sm" icon="clinical_notes" (click)="handleRegisterConsultation()" class="shrink-0">
                            Registrar Consulta / Historial
                          </app-button>
                        </div>
                        @if (apt.vitals) {
                          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            <div class="p-2 rounded-lg bg-[#f2f4f6] flex flex-col border border-[#e0e3e5]">
                              <span class="text-[11px] text-[#76777d]">Presión Arterial</span>
                              <div class="flex items-baseline gap-1 mt-0.5">
                                <span class="text-[14px] font-bold text-[#191c1e]">{{ apt.vitals.bp }}</span>
                                <span class="text-[10px] text-[#76777d]">mmHg</span>
                              </div>
                            </div>
                            <div class="p-2 rounded-lg bg-[#f2f4f6] flex flex-col border border-[#e0e3e5]">
                              <span class="text-[11px] text-[#76777d]">Frecuencia / Pulso</span>
                              <div class="flex items-baseline gap-1 mt-0.5">
                                <span class="text-[14px] font-bold text-[#191c1e]">{{ apt.vitals.pulse }}</span>
                                <span class="text-[10px] text-[#76777d]">bpm</span>
                              </div>
                            </div>
                            <div class="p-2 rounded-lg bg-[#f2f4f6] flex flex-col border border-[#e0e3e5]">
                              <span class="text-[11px] text-[#76777d]">Temperatura</span>
                              <div class="flex items-baseline gap-1 mt-0.5">
                                <span class="text-[14px] font-bold text-[#191c1e]">{{ apt.vitals.temp }}</span>
                                <span class="text-[10px] text-[#76777d]">°C</span>
                              </div>
                            </div>
                            <div class="p-2 rounded-lg bg-[#f2f4f6] flex flex-col border border-[#e0e3e5]">
                              <span class="text-[11px] text-[#76777d]">Sat. O2</span>
                              <div class="flex items-baseline gap-1 mt-0.5">
                                <span class="text-[14px] font-bold text-[#006a61]">{{ apt.vitals.spo2 }}%</span>
                                <span class="text-[10px] text-[#76777d]">Aire Amb.</span>
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  @if (apt.status === 'confirmed') {
                    <div class="flex flex-col md:flex-row md:items-center gap-3.5 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow border border-[#e6e8ea]">
                      <div class="w-24 shrink-0 flex items-center md:flex-col md:items-start justify-between">
                        <span class="text-[14px] font-bold text-[#191c1e]">{{ apt.time }}</span>
                        <span class="text-[11px] text-[#76777d]">{{ apt.relativeTime }}</span>
                      </div>
                      <div class="hidden md:flex w-6 h-6 rounded-full bg-[#f2f4f6] items-center justify-center shrink-0 shadow-xs z-10 text-[#006a61]">
                        <span class="material-symbols-outlined text-[16px]">schedule</span>
                      </div>
                      <div class="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="w-10 h-10 rounded-full bg-[#131b2e] text-white flex items-center justify-center text-[13px] font-bold shrink-0">
                            {{ apt.patientInitials }}
                          </div>
                          <div class="min-w-0">
                            <div class="flex items-center gap-2">
                              <span class="text-[14px] font-semibold text-[#191c1e] truncate">{{ apt.patientName }}</span>
                              <span class="text-[11px] text-[#76777d]">{{ apt.patientAge }} años</span>
                            </div>
                            <p class="text-[12px] text-[#45464d] truncate">{{ apt.reason }}</p>
                          </div>
                        </div>
                        <div class="flex items-center gap-3 self-end sm:self-center">
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#86f2e4]/30 text-[#006f66] text-[11px] font-semibold">
                            <span class="w-1.5 h-1.5 rounded-full bg-[#006a61]"></span>
                            Confirmada
                          </span>
                        </div>
                      </div>
                    </div>
                  }

                  @if (apt.status === 'break') {
                    <div class="flex flex-col md:flex-row md:items-center gap-3.5 p-4 rounded-xl bg-[#f2f4f6] text-[#45464d] border border-dashed border-[#c6c6cd]">
                      <div class="w-24 shrink-0 flex items-center md:flex-col md:items-start justify-between">
                        <span class="text-[14px] font-bold text-[#45464d]">{{ apt.time }}</span>
                        <span class="text-[11px] text-[#76777d]">{{ apt.durationMinutes }} min</span>
                      </div>
                      <div class="hidden md:flex w-6 h-6 rounded-full bg-[#e6e8ea] items-center justify-center shrink-0 shadow-xs z-10 text-[#76777d]">
                        <span class="material-symbols-outlined text-[16px]">lock</span>
                      </div>
                      <div class="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div class="flex items-center gap-3">
                          <span class="w-10 h-10 rounded-full bg-[#e0e3e5] flex items-center justify-center text-[#76777d] shrink-0">
                            <span class="material-symbols-outlined text-[20px]">coffee</span>
                          </span>
                          <div>
                            <span class="text-[13px] font-bold text-[#191c1e]">Bloqueo de Disponibilidad: {{ apt.patientName }}</span>
                            <p class="text-[12px] text-[#76777d]">{{ apt.reason }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                }
              </div>
            </div>
          </div>

          <div class="xl:col-span-4 flex flex-col gap-6">
            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-lg bg-[#86f2e4]/30 flex items-center justify-center text-[#006f66]">
                  <span class="material-symbols-outlined text-[20px]">manage_search</span>
                </span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Búsqueda de Historial</h3>
                  <p class="text-[12px] text-[#45464d]">Acceso inmediato a fichas clínicas</p>
                </div>
              </div>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-[20px]">person_search</span>
                <input type="search" placeholder="Ingresar DNI, RUT o Apellidos..." class="w-full h-10 pl-10 pr-4 rounded-lg bg-[#f2f4f6] text-[13px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#006a61] transition-all border border-[#e0e3e5]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <app-toast />
    </div>
  `,
})
export class DashboardComponent {
  nav = inject(NavigationService);
  private router = inject(Router);
  data = inject(MockDataService);
  toast = inject(ToastService);

  handleOpenConsultation(): void {
    this.toast.show('Consulta en Curso', 'Abriendo protocolo de atención activo del Dr. Mendoza.');
  }

  handleRegisterConsultation(): void {
    this.router.navigate(['nueva-consulta']);
  }

  handleDeclareEmergency(): void {
    this.toast.show('Alerta de Urgencia Activada', 'Notificación transmitida a Triage y Secretaría Central.');
  }
}
