import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavigationService } from '../../core/services/navigation.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { ToastComponent } from '../../shared/toast/toast.component';
import { AppointmentItem, RescheduleData, TriageVitals } from '../../core/models/types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, ButtonComponent, BadgeComponent, ToastComponent],
  template: `
    <div class="flex flex-col w-full">
      <div class="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
        <div class="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-[#86f2e4] opacity-20 blur-3xl pointer-events-none -z-10"></div>
        <div class="absolute top-80 right-0 w-80 h-80 rounded-full bg-[#acedff] opacity-20 blur-3xl pointer-events-none -z-10"></div>

        @if (auth.isAdmin()) {
          <div class="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            <span class="text-[11px] font-bold text-[#76777d] uppercase tracking-wider shrink-0">Ver médico:</span>
            <button
              type="button"
              (click)="data.selectedDoctorId.set(null)"
              class="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all shrink-0 border"
              [class]="data.selectedDoctorId() === null
                ? 'bg-[#006a61] text-white border-[#006a61] shadow-sm'
                : 'bg-white text-[#45464d] border-[#e0e3e5] hover:border-[#006a61] hover:text-[#006a61]'"
            >
              <span class="w-5 h-5 rounded-full bg-[#006a61]/15 text-[#006a61] flex items-center justify-center text-[10px] font-bold"
                [class]="data.selectedDoctorId() === null ? 'bg-white/20 text-white' : ''">
                <span class="material-symbols-outlined text-[14px]">group</span>
              </span>
              <span>Todos</span>
            </button>
            @for (doc of data.doctors(); track doc.id) {
              <button
                type="button"
                (click)="data.selectedDoctorId.set(doc.id)"
                class="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all shrink-0 border"
                [class]="data.selectedDoctorId() === doc.id
                  ? 'bg-[#006a61] text-white border-[#006a61] shadow-sm'
                  : 'bg-white text-[#45464d] border-[#e0e3e5] hover:border-[#006a61] hover:text-[#006a61]'"
              >
              <img [src]="doc.avatarUrl" [alt]="doc.name" class="w-5 h-5 rounded-full object-cover ring-1 ring-current/20" />
                <span>{{ doc.shortName }}</span>
                @if (doc.activeToday) {
                  <span class="w-1.5 h-1.5 rounded-full bg-[#006a61]"></span>
                }
              </button>
            }
          </div>
        }

        <section class="w-full bg-white rounded-xl shadow-sm border border-[#e6e8ea] p-5 lg:p-6 mb-6 relative overflow-hidden">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div class="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
              <div class="relative shrink-0">
                <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#006a61] text-white flex items-center justify-center text-[22px] sm:text-[26px] font-bold shadow-sm ring-2 ring-[#eceef0]">
                  @if (data.selectedDoctorId() === null) {
                    <span class="material-symbols-outlined text-[30px] sm:text-[36px]">group</span>
                  } @else {
                    <img [src]="data.selectedDoctor().avatarUrl" [alt]="data.selectedDoctor().name" class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover ring-2 ring-[#eceef0]" />
                  }
                </div>
                <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs">
                  <span class="w-3.5 h-3.5 rounded-full bg-[#006a61] animate-pulse"></span>
                </span>
              </div>
              <div class="flex flex-col min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-1">
                  <h1 class="text-[20px] sm:text-[22px] font-bold text-[#191c1e] tracking-tight truncate">
                    {{ data.selectedDoctor().name }}
                  </h1>
                  <app-badge [variant]="activeConsultation() ? 'teal' : 'neutral'" [dot]="true" [pulse]="activeConsultation()">{{ activeConsultation() ? 'En Consultorio (Atendiendo Citas)' : 'En Consultorio (Sin Citas Activas)' }}</app-badge>
                </div>
                <p class="text-[13px] text-[#45464d] truncate">
                  {{ doctorRoleLabel() }}
                </p>
                <div class="flex flex-wrap items-center gap-4 mt-2 text-[#45464d] text-[12px]">
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px] text-[#006a61]">verified</span>
                    Credenciales Validadas
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px] text-[#76777d]">schedule</span>
                    Jornada: 08:00 - 16:00
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center flex-wrap gap-2.5 self-start lg:self-center">
              <app-button variant="light" size="md" icon="emergency" (click)="handleDeclareEmergency()" [disabled]="data.selectedDoctorId() === null" title="Activar protocolo de emergencia y notificar al equipo">
                Declarar Urgencia
              </app-button>
              <app-button variant="primary" size="md" icon="stethoscope" (click)="handleOpenConsultation()" [disabled]="data.selectedDoctorId() === null" title="Ir a nueva consulta o continuar consulta activa">
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
                <span class="text-[34px] font-extrabold text-[#191c1e] leading-none tracking-tight">{{ dayStats().total }}</span>
                <span class="text-[14px] font-semibold text-[#191c1e] ml-1">Total</span>
              </div>
              <div class="flex items-center gap-1 bg-[#f2f4f6] px-2 py-1 rounded-md border border-[#e0e3e5]">
                <span class="w-2 h-2 rounded-full bg-[#006a61]"></span>
                <span class="text-[12px] font-semibold text-[#191c1e]">
                  <span class="hidden xl:inline">{{ dayStats().completed }} comp</span>
                  <span class="xl:hidden">{{ dayStats().completed }}</span>
                </span>
              </div>
            </div>
            <div class="mt-3 pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[#45464d] text-[11px]">
              <span class="text-[#006a61] font-semibold">{{ dayStats().inProgress }} en curso</span>
              <span>{{ dayStats().pending }} pendientes</span>
            </div>
            <div class="w-full h-1.5 bg-[#e6e8ea] rounded-full overflow-hidden mt-2 flex">
              <div class="h-full bg-[#006a61]" [style.width.%]="dayStats().pctCompleted"></div>
              <div class="h-full bg-[#86f2e4]" [style.width.%]="dayStats().pctInProgress"></div>
              <div class="h-full bg-[#eceef0]" [style.width.%]="dayStats().pctPending"></div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#e6e8ea] flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow" (click)="showCheckInModal.set(true)">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Pacientes en Espera</span>
              <span class="w-8 h-8 rounded-lg bg-[#86f2e4]/30 flex items-center justify-center text-[#006f66]">
                <span class="material-symbols-outlined text-[20px]">airline_seat_recline_normal</span>
              </span>
            </div>
            <div class="mt-3 flex items-baseline justify-between">
              <span class="text-[34px] font-extrabold text-[#191c1e] leading-none tracking-tight">{{ data.waitingCount() }}</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-[#86f2e4]/30 text-[#006f66] text-[11px] font-semibold">Check-in</span>
            </div>
            <div class="mt-3 pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[#45464d] text-[11px]">
              <span>Sala Triage: {{ data.triageCount() }}</span>
              <span>Recepción: {{ data.receptionCount() }}</span>
            </div>
            <div class="w-full bg-[#e6e8ea] h-1.5 rounded-full mt-2 overflow-hidden">
              <div class="h-full bg-[#006a61] rounded-full" [style.width.%]="data.waitingCount() > 0 ? (data.receptionCount() / data.waitingCount()) * 100 : 0"></div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#e6e8ea] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Próxima Cita En</span>
              <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#191c1e]">
                <span class="material-symbols-outlined text-[20px]">timer</span>
              </span>
            </div>
            @if (nextAppointment(); as next) {
              <div class="mt-3 flex items-baseline justify-between">
                <div class="flex items-baseline">
                  <span class="text-[30px] sm:text-[34px] font-extrabold text-[#191c1e] leading-none tracking-tight whitespace-nowrap">{{ next.display }}</span>
                </div>
                <span class="text-[12px] text-[#76777d] font-semibold">{{ next.timeLabel }}</span>
              </div>
              <div class="mt-3 pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[#45464d] text-[11px]">
                <span class="truncate">{{ next.patient?.name }} · {{ next.apt.reason }}</span>
                <span class="w-2 h-2 rounded-full bg-[#006a61] animate-ping shrink-0" [class]="next.minutes <= 5 ? '' : 'opacity-0'"></span>
              </div>
              <div class="w-full bg-[#e6e8ea] h-1.5 rounded-full mt-2 overflow-hidden">
                <div class="h-full bg-[#006a61] rounded-full" [style.width.%]="next.minutes >= 180 ? 8 : ((180 - next.minutes) / 180) * 100"></div>
              </div>
            } @else {
              <div class="mt-3 flex items-baseline justify-between">
                <div class="flex items-baseline">
                  <span class="text-[34px] font-extrabold text-[#c6c6cd] leading-none tracking-tight">—</span>
                </div>
                <span class="text-[12px] text-[#76777d] font-semibold">{{ dayStats().total === 0 ? 'Sin citas' : 'Jornada completa' }}</span>
              </div>
              <div class="mt-3 pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[#45464d] text-[11px]">
                <span class="truncate">{{ dayStats().total === 0 ? 'No hay citas programadas en esta selección.' : 'Todas las citas de hoy ya finalizaron.' }}</span>
              </div>
              <div class="w-full bg-[#e6e8ea] h-1.5 rounded-full mt-2 overflow-hidden">
                <div class="h-full bg-[#e6e8ea] rounded-full" style="width: 0%"></div>
              </div>
            }
          </div>

          <div class="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#e6e8ea] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Eficiencia / Puntualidad</span>
              <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#006a61]">
                <span class="material-symbols-outlined text-[20px]">speed</span>
              </span>
            </div>
            <div class="mt-3 flex items-baseline justify-between">
              <span class="text-[34px] font-extrabold text-[#191c1e] leading-none tracking-tight">{{ punctuality().pct }}%</span>
              <div class="flex items-center text-[12px] font-bold" [class]="punctuality().optimal ? 'text-[#006a61]' : 'text-[#b45309]'">
                <span class="material-symbols-outlined text-[16px]">{{ punctuality().optimal ? 'trending_up' : 'trending_down' }}</span>
                <span>{{ dayStats().completed }} completadas</span>
              </div>
            </div>
            <div class="mt-3 pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[#45464d] text-[11px]">
              <span>{{ dayStats().noShow }} sin asistir · {{ dayStats().total }} citas</span>
              <span class="font-semibold" [class]="punctuality().optimal ? 'text-[#006a61]' : punctuality().pct >= 70 ? 'text-[#b45309]' : 'text-[#ba1a1a]'">{{ punctuality().label }}</span>
            </div>
            <div class="w-full bg-[#e6e8ea] h-1.5 rounded-full mt-2 overflow-hidden">
              <div class="h-full rounded-full" [style.width.%]="punctuality().pct" [class]="punctuality().optimal ? 'bg-[#006a61]' : punctuality().pct >= 70 ? 'bg-[#f59e0b]' : 'bg-[#ba1a1a]'"></div>
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
                    <h2 class="text-[17px] font-bold text-[#191c1e] tracking-tight">
                      Cronograma Clínico - {{ formattedSelectedDate() }}
                    </h2>
                    <span class="text-[12px] text-[#45464d]">
                      {{ data.selectedDateAppointments().length }} Citas · {{ totalDayPatientsLabel() }} · Bloque {{ morningOrAfternoonLabel() }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-3.5 relative mt-4">
                <div class="hidden md:block absolute left-[98px] top-6 bottom-6 w-0.5 bg-[#e6e8ea]"></div>

                @for (apt of data.selectedDateAppointments(); track apt.id) {
                  @let patient = data.getPatient(apt.patientId);
                  @let doctor = data.doctors().find(d => d.id === apt.doctorId);
                  @if (apt.status === 'completed') {
                    <div class="flex flex-col md:flex-row md:items-center gap-3.5 p-4 rounded-xl bg-[#f2f4f6] hover:bg-[#e6e8ea]/70 transition-colors border border-[#e0e3e5]">
                      <div class="w-24 shrink-0 flex items-center md:flex-col md:items-start justify-between">
                        <span class="text-[14px] font-bold text-[#191c1e]">{{ apt.time }}</span>
                        <span class="text-[11px] text-[#76777d]">{{ apt.durationMinutes }} min</span>
                      </div>
                      <div class="hidden md:flex w-6 h-6 rounded-full bg-white items-center justify-center shrink-0 shadow-xs z-10">
                        <span class="material-symbols-outlined text-[#006a61] text-[16px]" title="Cita completada">check_circle</span>
                      </div>
                      <div class="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="relative shrink-0">
                            <div class="w-10 h-10 rounded-full bg-white border border-[#c6c6cd] flex items-center justify-center text-[13px] font-bold text-[#191c1e]">
                              {{ data.getInitials(patient?.name ?? '') }}
                            </div>
                            @if (data.selectedDoctorId() === null && doctor) {
                              <img [src]="doctor.avatarUrl" [alt]="doctor.name" class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm" />
                            }
                          </div>
                          <div class="min-w-0">
                            <div class="flex items-center gap-2">
                              <span class="text-[14px] font-semibold text-[#191c1e] hover:text-[#006a61] cursor-pointer truncate" (click)="nav.navigate('pacientes-y-historial-clinico')">
                                {{ patient?.name }}
                              </span>
                              <span class="text-[11px] text-[#76777d]">{{ patient?.age }} años</span>
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
                        <span class="material-symbols-outlined text-[16px]" title="Consulta en curso">play_arrow</span>
                      </div>
                      <div class="flex-1 flex flex-col justify-between gap-3 min-w-0">
                        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div class="flex items-center gap-3 min-w-0">
                            <div class="relative shrink-0">
                              <div class="w-12 h-12 rounded-xl bg-[#006a61] text-white flex items-center justify-center text-[14px] font-bold shadow-xs">
                                {{ data.getInitials(patient?.name ?? '') }}
                              </div>
                              @if (data.selectedDoctorId() === null && doctor) {
                                <img [src]="doctor.avatarUrl" [alt]="doctor.name" class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm" />
                              }
                            </div>
                            <div class="min-w-0">
                              <div class="flex items-center gap-2 flex-wrap">
                                <span class="text-[15px] font-bold text-[#191c1e] truncate">{{ patient?.name }}</span>
                                <span class="px-2 py-0.5 rounded bg-[#e6e8ea] text-[11px] font-semibold text-[#45464d]">ID: {{ apt.patientId }}</span>
                              </div>
                              <p class="text-[12px] text-[#45464d] truncate">{{ apt.reason }}</p>
                            </div>
                          </div>
                          <app-button variant="primary" size="sm" icon="clinical_notes" (click)="handleRegisterConsultation()" class="shrink-0" [disabled]="data.selectedDoctorId() === null" title="Registrar consulta y ver historial clínico">
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

                  @if (apt.status === 'triaged') {
                    <div class="flex flex-col md:flex-row md:items-stretch gap-3.5 p-4 sm:p-5 rounded-xl bg-[#fffdf5] shadow-sm border-2 border-[#f59e0b] relative overflow-hidden">
                      <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#f59e0b]"></div>
                      <div class="w-24 shrink-0 flex items-center md:flex-col md:items-start justify-between pl-1">
                        <span class="text-[14px] font-bold text-[#b45309]">{{ apt.time }}</span>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fde68a]/50 text-[#92400e] text-[10px] font-bold uppercase tracking-wider">
                          <span class="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
                          Listo para Doctor
                        </span>
                      </div>
                      <div class="hidden md:flex w-6 h-6 rounded-full bg-[#f59e0b] text-white items-center justify-center shrink-0 shadow-xs z-10 self-center">
                        <span class="material-symbols-outlined text-[16px]" title="Triage completado">pending</span>
                      </div>
                      <div class="flex-1 flex flex-col justify-between gap-3 min-w-0">
                        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div class="flex items-center gap-3 min-w-0">
                            <div class="relative shrink-0">
                              <div class="w-12 h-12 rounded-xl bg-[#fef3c7] border border-[#f59e0b]/30 flex items-center justify-center text-[14px] font-bold text-[#92400e] shadow-xs">
                                {{ data.getInitials(patient?.name ?? '') }}
                              </div>
                              @if (data.selectedDoctorId() === null && doctor) {
                                <img [src]="doctor.avatarUrl" [alt]="doctor.name" class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm" />
                              }
                            </div>
                            <div class="min-w-0">
                              <div class="flex items-center gap-2 flex-wrap">
                                <span class="text-[15px] font-bold text-[#191c1e] truncate">{{ patient?.name }}</span>
                                <span class="px-2 py-0.5 rounded bg-[#fde68a]/50 text-[11px] font-semibold text-[#92400e]">{{ patient?.age }} años</span>
                              </div>
                              <p class="text-[12px] text-[#45464d] truncate">{{ apt.reason }}</p>
                            </div>
                          </div>
                          <app-button variant="primary" size="sm" icon="stethoscope" (click)="handleStartConsultation(apt.patientId)" class="shrink-0" title="Iniciar consulta médica con el paciente">
                            Iniciar Consulta
                          </app-button>
                        </div>
                        @if (apt.vitals) {
                          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            <div class="p-2 rounded-lg bg-[#fef3c7] flex flex-col border border-[#f59e0b]/20">
                              <span class="text-[11px] text-[#92400e]">Presión Arterial</span>
                              <div class="flex items-baseline gap-1 mt-0.5">
                                <span class="text-[14px] font-bold text-[#191c1e]">{{ apt.vitals.bp }}</span>
                                <span class="text-[10px] text-[#92400e]">mmHg</span>
                              </div>
                            </div>
                            <div class="p-2 rounded-lg bg-[#fef3c7] flex flex-col border border-[#f59e0b]/20">
                              <span class="text-[11px] text-[#92400e]">Frecuencia / Pulso</span>
                              <div class="flex items-baseline gap-1 mt-0.5">
                                <span class="text-[14px] font-bold text-[#191c1e]">{{ apt.vitals.pulse }}</span>
                                <span class="text-[10px] text-[#92400e]">bpm</span>
                              </div>
                            </div>
                            <div class="p-2 rounded-lg bg-[#fef3c7] flex flex-col border border-[#f59e0b]/20">
                              <span class="text-[11px] text-[#92400e]">Temperatura</span>
                              <div class="flex items-baseline gap-1 mt-0.5">
                                <span class="text-[14px] font-bold text-[#191c1e]">{{ apt.vitals.temp }}</span>
                                <span class="text-[10px] text-[#92400e]">°C</span>
                              </div>
                            </div>
                            <div class="p-2 rounded-lg bg-[#fef3c7] flex flex-col border border-[#f59e0b]/20">
                              <span class="text-[11px] text-[#92400e]">Sat. O2</span>
                              <div class="flex items-baseline gap-1 mt-0.5">
                                <span class="text-[14px] font-bold text-[#b45309]">{{ apt.vitals.spo2 }}%</span>
                                <span class="text-[10px] text-[#92400e]">Aire Amb.</span>
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  @if (apt.status === 'pending') {
                    <div class="flex flex-col md:flex-row md:items-center gap-3.5 p-4 rounded-xl bg-[#fffbe6] shadow-sm hover:shadow-md transition-shadow border border-[#f59e0b]/40">
                      <div class="w-24 shrink-0 flex items-center md:flex-col md:items-start justify-between">
                        <span class="text-[14px] font-bold text-[#92400e]">{{ apt.time }}</span>
                        <span class="text-[11px] text-[#76777d]">{{ apt.durationMinutes }} min</span>
                      </div>
                      <div class="hidden md:flex w-6 h-6 rounded-full bg-[#fde68a] items-center justify-center shrink-0 shadow-xs z-10 text-[#92400e]">
                        <span class="material-symbols-outlined text-[16px]" title="Cita pendiente">schedule</span>
                      </div>
                      <div class="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="relative shrink-0">
                            <div class="w-10 h-10 rounded-full bg-[#f59e0b]/20 text-[#92400e] flex items-center justify-center text-[13px] font-bold">
                              {{ data.getInitials(patient?.name ?? '') }}
                            </div>
                            @if (data.selectedDoctorId() === null && doctor) {
                              <img [src]="doctor.avatarUrl" [alt]="doctor.name" class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm" />
                            }
                          </div>
                          <div class="min-w-0">
                            <div class="flex items-center gap-2">
                              <span class="text-[14px] font-semibold text-[#191c1e] truncate">{{ patient?.name }}</span>
                              <span class="text-[11px] text-[#76777d]">{{ patient?.age }} años</span>
                            </div>
                            <p class="text-[12px] text-[#45464d] truncate">{{ apt.reason }}</p>
                          </div>
                        </div>
                        <div class="flex items-center gap-3 self-end sm:self-center">
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fde68a] text-[#92400e] text-[11px] font-semibold">
                            <span class="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse"></span>
                            Pendiente
                          </span>
                          <app-button variant="outline" size="sm" icon="event_available" (click)="handleConfirmAppointment(apt.id, apt.patientId)" class="shrink-0" title="Confirmar asistencia del paciente">
                            Confirmar Asistencia
                          </app-button>
                          @if (data.selectedDate() >= todayStr()) {
                            <app-button variant="ghost" size="sm" icon="update" (click)="openReschedule(apt)" class="shrink-0" title="Reagendar esta cita a otra fecha u hora">
                              Reagendar
                            </app-button>
                          }
                        </div>
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
                        <span class="material-symbols-outlined text-[16px]" title="Cita confirmada">schedule</span>
                      </div>
                      <div class="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="relative shrink-0">
                            <div class="w-10 h-10 rounded-full bg-[#131b2e] text-white flex items-center justify-center text-[13px] font-bold">
                              {{ data.getInitials(patient?.name ?? '') }}
                            </div>
                            @if (data.selectedDoctorId() === null && doctor) {
                              <img [src]="doctor.avatarUrl" [alt]="doctor.name" class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm" />
                            }
                          </div>
                          <div class="min-w-0">
                            <div class="flex items-center gap-2">
                              <span class="text-[14px] font-semibold text-[#191c1e] truncate">{{ patient?.name }}</span>
                              <span class="text-[11px] text-[#76777d]">{{ patient?.age }} años</span>
                            </div>
                            <p class="text-[12px] text-[#45464d] truncate">{{ apt.reason }}</p>
                          </div>
                        </div>
                        <div class="flex items-center gap-3 self-end sm:self-center">
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#86f2e4]/30 text-[#006f66] text-[11px] font-semibold">
                            <span class="w-1.5 h-1.5 rounded-full bg-[#006a61]"></span>
                            Confirmada
                          </span>
                          @if (data.selectedDate() >= todayStr()) {
                            <app-button variant="ghost" size="sm" icon="update" (click)="openReschedule(apt)" class="shrink-0" title="Reagendar esta cita a otra fecha u hora">
                              Reagendar
                            </app-button>
                          }
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
                        <span class="material-symbols-outlined text-[16px]" title="Horario bloqueado">lock</span>
                      </div>
                      <div class="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div class="flex items-center gap-3">
                          <span class="w-10 h-10 rounded-full bg-[#e0e3e5] flex items-center justify-center text-[#76777d] shrink-0">
                            <span class="material-symbols-outlined text-[20px]">coffee</span>
                          </span>
                          <div>
                            <span class="text-[13px] font-bold text-[#191c1e]">Bloqueo de Disponibilidad</span>
                            <p class="text-[12px] text-[#76777d]">{{ apt.reason }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  }

                  @if (apt.status === 'no-show') {
                    <div class="flex flex-col md:flex-row md:items-center gap-3.5 p-4 rounded-xl bg-[#fffbeb] border border-[#eab308]/50">
                      <div class="w-24 shrink-0 flex items-center md:flex-col md:items-start justify-between">
                        <span class="text-[14px] font-bold text-[#a16207]">{{ apt.time }}</span>
                        <span class="text-[11px] text-[#76777d]">{{ apt.durationMinutes }} min</span>
                      </div>
                      <div class="hidden md:flex w-6 h-6 rounded-full bg-[#fde68a] items-center justify-center shrink-0 shadow-xs z-10 text-[#a16207]">
                        <span class="material-symbols-outlined text-[16px]" title="Paciente no asistió">person_off</span>
                      </div>
                      <div class="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="relative shrink-0">
                            <div class="w-10 h-10 rounded-full bg-[#fde68a] text-[#a16207] flex items-center justify-center text-[13px] font-bold">
                              {{ data.getInitials(patient?.name ?? '') }}
                            </div>
                            @if (data.selectedDoctorId() === null && doctor) {
                              <img [src]="doctor.avatarUrl" [alt]="doctor.name" class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm" />
                            }
                          </div>
                          <div class="min-w-0">
                            <div class="flex items-center gap-2">
                              <span class="text-[14px] font-semibold text-[#191c1e] truncate">{{ patient?.name }}</span>
                              <span class="text-[11px] text-[#76777d]">{{ patient?.age }} años</span>
                            </div>
                            <p class="text-[12px] text-[#45464d] truncate">{{ apt.reason }}</p>
                          </div>
                        </div>
                        <div class="flex items-center gap-3 self-end sm:self-center">
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef3c7] text-[#a16207] text-[11px] font-semibold">
                            <span class="w-1.5 h-1.5 rounded-full bg-[#eab308]"></span>
                            No Asistió
                          </span>
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

            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <span class="w-8 h-8 rounded-lg bg-[#86f2e4]/30 flex items-center justify-center text-[#006f66]">
                    <span class="material-symbols-outlined text-[20px]">calendar_month</span>
                  </span>
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Calendario</h3>
                </div>
                <button
                  type="button"
                  (click)="goToToday()"
                  class="text-[11px] font-semibold text-[#006a61] hover:underline"
                >
                  Volver a Hoy
                </button>
              </div>

              <div class="flex items-center justify-between mb-3">
                <button
                  type="button"
                  (click)="prevMonth()"
                  class="p-1.5 rounded-lg text-[#45464d] hover:bg-[#f2f4f6] transition-colors"
                  aria-label="Mes anterior"
                >
                  <span class="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <span class="text-[13px] font-bold text-[#191c1e]">{{ calendarHeader() }}</span>
                <button
                  type="button"
                  (click)="nextMonth()"
                  class="p-1.5 rounded-lg text-[#45464d] hover:bg-[#f2f4f6] transition-colors"
                  aria-label="Mes siguiente"
                >
                  <span class="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>

              <div class="grid grid-cols-7 gap-1 text-center mb-1">
                @for (d of ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']; track d) {
                  <span class="text-[10px] font-bold text-[#76777d] uppercase py-1">{{ d }}</span>
                }
              </div>

              <div class="grid grid-cols-7 gap-px rounded-xl overflow-hidden border border-[#eceef0] bg-[#eceef0]">
                @for (blank of [].constructor(calendarDays().startOffset); track $index) {
                  <span class="aspect-square bg-[#f7f9fb]"></span>
                }
                @for (day of calendarNumbers(); track day) {
                  @let dateStr = calendarDateStr(day);
                  @let aptCount = data.appointmentCountByDate().get(dateStr) ?? 0;
                  @let isSelected = data.selectedDate() === dateStr;
                  @let isToday = dateStr === todayStr();
                  @let isDisabled = !data.isBusinessDay(dateStr);
                  <button
                    type="button"
                    (click)="data.selectedDate.set(dateStr)"
                    [disabled]="isDisabled"
                    class="relative flex items-center justify-center w-full aspect-square text-[12px] font-semibold transition-colors"
                    [class]="isSelected
                      ? 'bg-[#006a61] text-white cursor-default'
                      : isToday
                        ? 'bg-[#86f2e4]/40 text-[#006f66] cursor-pointer'
                        : isDisabled
                          ? 'bg-[#f7f9fb] text-[#c6c6cd] cursor-not-allowed'
                          : 'bg-white text-[#191c1e] hover:bg-[#f2f4f6] cursor-pointer'"
                  >
                    {{ day }}
                    @if (aptCount > 0 && !isSelected) {
                      <span
                        class="absolute bottom-0.5 right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center text-[9px] font-bold"
                        [class]="isToday ? 'bg-[#006a61] text-white' : 'bg-[#006a61]/15 text-[#006a61]'"
                      >
                        {{ aptCount }}
                      </span>
                    }
                  </button>
                }
              </div>

              <div class="flex items-center gap-2 mt-3 pt-3 border-t border-[#f2f4f6] text-[11px] text-[#76777d]">
                <span class="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#006a61]/15 text-[#006a61] text-[9px] font-bold">3</span>
                <span>Citas</span>
                <span class="mx-1">·</span>
                <span class="w-2 h-2 rounded-full border border-[#006a61] bg-[#86f2e4]/40"></span>
                <span>Hoy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <app-toast />

      @if (showCheckInModal()) {
        <div class="fixed inset-0 bg-[#191c1e]/40 backdrop-blur-xs z-[999] flex items-center justify-center p-4" (click)="showCheckInModal.set(false)">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col relative z-[1000]" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-5 border-b border-[#eceef0]">
              <div class="flex items-center gap-3">
                <span class="w-9 h-9 rounded-lg bg-[#86f2e4]/30 flex items-center justify-center text-[#006f66]">
                  <span class="material-symbols-outlined text-[20px]">how_to_reg</span>
                </span>
                <div>
                  <h3 class="text-[16px] font-bold text-[#191c1e]">Check-in de Pacientes</h3>
                  <p class="text-[12px] text-[#45464d]">Pacientes con cita pendiente de llegada</p>
                </div>
              </div>
              <button type="button" (click)="showCheckInModal.set(false)" class="p-1.5 rounded-lg text-[#76777d] hover:bg-[#f2f4f6]" title="Cerrar">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-5">
              @for (patient of data.waitingAppointments(); track patient.id) {
                @let wp = data.getPatient(patient.patientId);
                <div class="flex items-center justify-between p-3 rounded-xl border mb-3"
                  [class]="patient.status === 'checked-in'
                    ? 'border-[#86f2e4] bg-[#86f2e4]/10'
                    : patient.status === 'in-triage'
                      ? 'border-[#f59e0b] bg-[#fffbeb]'
                      : patient.status === 'triaged'
                        ? 'border-[#006a61] bg-[#86f2e4]/20'
                        : 'border-[#e0e3e5] bg-white hover:border-[#006a61]'">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-[#131b2e] text-white flex items-center justify-center text-[13px] font-bold shrink-0">
                      {{ data.getInitials(wp?.name ?? '') }}
                    </div>
                    <div>
                      <p class="text-[13px] font-semibold text-[#191c1e]">{{ wp?.name }}</p>
                      <p class="text-[11px] text-[#76777d]">{{ patient.time }} · {{ patient.reason }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    @if (patient.status === 'pending' || patient.status === 'confirmed') {
                      <button type="button" (click)="handleCheckIn(patient.id)" class="px-3 py-1.5 rounded-lg bg-[#006a61] text-white text-[12px] font-semibold hover:bg-[#005049] transition-colors" title="Marcar llegada del paciente y pasar a recepción">
                        Registrar Llegada
                      </button>
                    } @else if (patient.status === 'checked-in') {
                      <button type="button" (click)="handleStartTriage(patient.id)" class="px-3 py-1.5 rounded-lg bg-[#f59e0b] text-white text-[12px] font-semibold hover:bg-[#d97706] transition-colors" title="Iniciar evaluación de signos vitales (triage)">
                        Iniciar Triage
                      </button>
                    } @else if (patient.status === 'in-triage') {
                      <span class="px-3 py-1.5 rounded-lg bg-[#fffbeb] text-[#92400e] text-[12px] font-semibold border border-[#fde68a]">En Triage...</span>
                    } @else {
                      <span class="px-3 py-1.5 rounded-lg bg-[#86f2e4]/30 text-[#006f66] text-[12px] font-semibold">Listo para Doctor</span>
                    }
                  </div>
                </div>
              }
              @if (data.waitingAppointments().length === 0) {
                <div class="text-center py-8 text-[13px] text-[#76777d]">
                  No hay pacientes en espera por el momento.
                </div>
              }
            </div>
          </div>
        </div>
      }

      @if (data.currentTriageAppointment()) {
        @let triagePatient = data.getPatient(data.currentTriageAppointment()?.patientId ?? '');
        <div class="fixed inset-0 bg-[#191c1e]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4" (click)="handleCancelTriage()">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-5 border-b border-[#eceef0]">
              <div class="flex items-center gap-3">
                <span class="w-9 h-9 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center text-[#d97706]">
                  <span class="material-symbols-outlined text-[20px]">medical_information</span>
                </span>
                <div>
                  <h3 class="text-[16px] font-bold text-[#191c1e]">Triage — {{ triagePatient?.name }}</h3>
                  <p class="text-[12px] text-[#45464d]">Captura de signos vitales</p>
                </div>
              </div>
              <button type="button" (click)="handleCancelTriage()" class="p-1.5 rounded-lg text-[#76777d] hover:bg-[#f2f4f6]" title="Cerrar">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-5">
              <div class="grid grid-cols-2 gap-3 mb-4">
                  <div class="flex flex-col gap-1">
                    <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Presión Sistólica</label>
                    <div class="relative">
                      <input type="number" placeholder="120" [ngModel]="vitalsForm().systolic" (ngModelChange)="updateVital('systolic', $event)" class="w-full h-10 px-3 pr-8 rounded-lg bg-[#f2f4f6] text-[14px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-1 focus:ring-[#006a61] border border-[#e0e3e5]" />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#76777d]">mmHg</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Presión Diastólica</label>
                    <div class="relative">
                      <input type="number" placeholder="80" [ngModel]="vitalsForm().diastolic" (ngModelChange)="updateVital('diastolic', $event)" class="w-full h-10 px-3 pr-8 rounded-lg bg-[#f2f4f6] text-[14px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-1 focus:ring-[#006a61] border border-[#e0e3e5]" />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#76777d]">mmHg</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Pulso</label>
                    <div class="relative">
                      <input type="number" placeholder="72" [ngModel]="vitalsForm().pulse" (ngModelChange)="updateVital('pulse', $event)" class="w-full h-10 px-3 pr-8 rounded-lg bg-[#f2f4f6] text-[14px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-1 focus:ring-[#006a61] border border-[#e0e3e5]" />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#76777d]">bpm</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Temperatura</label>
                    <div class="relative">
                      <input type="number" step="0.1" placeholder="36.5" [ngModel]="vitalsForm().temp" (ngModelChange)="updateVital('temp', $event)" class="w-full h-10 px-3 pr-8 rounded-lg bg-[#f2f4f6] text-[14px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-1 focus:ring-[#006a61] border border-[#e0e3e5]" />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#76777d]">°C</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">SpO2</label>
                    <div class="relative">
                      <input type="number" placeholder="99" [ngModel]="vitalsForm().spo2" (ngModelChange)="updateVital('spo2', $event)" class="w-full h-10 px-3 pr-8 rounded-lg bg-[#f2f4f6] text-[14px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-1 focus:ring-[#006a61] border border-[#e0e3e5]" />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#76777d]">%</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Peso</label>
                    <div class="relative">
                      <input type="number" step="0.1" placeholder="78" [ngModel]="vitalsForm().weight" (ngModelChange)="updateVital('weight', $event)" class="w-full h-10 px-3 pr-8 rounded-lg bg-[#f2f4f6] text-[14px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-1 focus:ring-[#006a61] border border-[#e0e3e5]" />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#76777d]">kg</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Altura</label>
                    <div class="relative">
                      <input type="number" placeholder="170" [ngModel]="vitalsForm().height" (ngModelChange)="updateVital('height', $event)" class="w-full h-10 px-3 pr-8 rounded-lg bg-[#f2f4f6] text-[14px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-1 focus:ring-[#006a61] border border-[#e0e3e5]" />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#76777d]">cm</span>
                    </div>
                  </div>
                </div>
                @if (triageSuggestion(); as suggestion) {
                  <div class="flex items-center justify-between gap-3 p-3 mb-4 rounded-xl border" [style.border-color]="suggestion.level.color" [style.background-color]="suggestion.level.color + '14'">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <span class="w-4 h-4 rounded-full shrink-0" [style.background-color]="suggestion.level.color"></span>
                      <div class="min-w-0">
                        <span class="block text-[13px] font-bold text-[#191c1e]">Sugerencia: {{ suggestion.level.name }}</span>
                        <span class="block text-[11px] text-[#45464d] truncate">Atender en un máximo de {{ suggestion.level.maxWaitMinutes }} min</span>
                      </div>
                    </div>
                    <span class="shrink-0 text-[11px] font-bold uppercase px-2 py-1 rounded-full text-white" [style.background-color]="suggestion.level.color">{{ suggestion.level.code }}</span>
                  </div>
                }
                <div class="flex flex-col gap-1 mb-4">
                  <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Notas de Triage</label>
                  <textarea placeholder="Observaciones, motivo de consulta, síntomas..." rows="3" [ngModel]="vitalsForm().notes" (ngModelChange)="updateVital('notes', $event)" class="w-full px-3 py-2 rounded-lg bg-[#f2f4f6] text-[13px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-1 focus:ring-[#006a61] border border-[#e0e3e5] resize-none"></textarea>
                </div>
            </div>
            <div class="flex items-center justify-end gap-3 p-5 border-t border-[#eceef0]">
              <button type="button" (click)="handleCancelTriage()" class="px-4 py-2 rounded-lg bg-[#f2f4f6] text-[#45464d] text-[13px] font-semibold hover:bg-[#e6e8ea] transition-colors">
                Cancelar
              </button>
              <button type="button" (click)="handleCompleteTriage()" class="px-4 py-2 rounded-lg bg-[#006a61] text-white text-[13px] font-semibold hover:bg-[#005049] transition-colors">
                Guardar y pasar a Doctor
              </button>
            </div>
          </div>
        </div>
      }

      @if (rescheduleData()) {
        <div class="fixed inset-0 bg-[#191c1e]/40 backdrop-blur-xs z-[999] flex items-center justify-center p-4" (click)="closeReschedule()">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-5 border-b border-[#eceef0]">
              <div class="flex items-center gap-3">
                <span class="w-9 h-9 rounded-lg bg-[#86f2e4]/30 flex items-center justify-center text-[#006f66]">
                  <span class="material-symbols-outlined text-[20px]">update</span>
                </span>
                <div>
                  <h3 class="text-[16px] font-bold text-[#191c1e]">Reagendar Cita</h3>
                  <p class="text-[12px] text-[#45464d]">{{ data.getPatient(rescheduleData()?.patientId ?? '')?.name }} · {{ formatTime(rescheduleData()?.currentTime ?? '') }}</p>
                </div>
              </div>
              <button type="button" (click)="closeReschedule()" class="p-1.5 rounded-lg text-[#76777d] hover:bg-[#f2f4f6]" title="Cerrar">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-5">
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Nueva Fecha</label>
                  <div class="grid grid-cols-3 gap-2">
                    @for (day of rescheduleOptions(); track day) {
                      <button
                        type="button"
                        (click)="newRescheduleDate.set(day)"
                        class="flex flex-col items-center py-2 rounded-lg border transition-all"
                        [class]="newRescheduleDate() === day
                          ? 'border-[#006a61] bg-[#86f2e4]/20 text-[#006f66]'
                          : 'border-[#e0e3e5] bg-white text-[#191c1e] hover:border-[#006a61]'"
                      >
                        <span class="text-[11px] font-bold">{{ shortDayLabel(day) }}</span>
                        <span class="text-[13px] font-bold">{{ dayNumLabel(day) }}</span>
                      </button>
                    }
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Nueva Hora</label>
                  <div class="grid grid-cols-3 gap-2">
                    @for (slot of timeSlots(); track slot) {
                      <button
                        type="button"
                        (click)="newRescheduleTime.set(slot)"
                        class="px-2 py-2 rounded-lg text-[12px] font-semibold border transition-all"
                        [class]="newRescheduleTime() === slot
                          ? 'border-[#006a61] bg-[#86f2e4]/20 text-[#006f66]'
                          : 'border-[#e0e3e5] bg-white text-[#191c1e] hover:border-[#006a61]'"
                      >
                        {{ slot }}
                      </button>
                    }
                  </div>
                </div>
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 p-5 border-t border-[#eceef0]">
              <button type="button" (click)="closeReschedule()" class="px-4 py-2 rounded-lg bg-[#f2f4f6] text-[#45464d] text-[13px] font-semibold hover:bg-[#e6e8ea] transition-colors">
                Cancelar
              </button>
              <button
                type="button"
                (click)="applyReschedule()"
                [disabled]="!newRescheduleDate() || !newRescheduleTime()"
                class="px-4 py-2 rounded-lg bg-[#006a61] text-white text-[13px] font-semibold hover:bg-[#005049] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Reagendar Cita
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent {
  nav = inject(NavigationService);
  private router = inject(Router);
  data = inject(MockDataService);
  auth = inject(AuthService);
  toast = inject(ToastService);

  doctorRoleLabel = computed(() => {
    if (this.data.selectedDoctorId() === null) {
      return 'Equipo Médico MedControl';
    }
    const doctor = this.data.selectedDoctor();
    return `Especialista en ${doctor.specialty} | Equipo Médico MedControl`;
  });

  showConsultationDrawer = signal(true);
  emergencyLock = signal(true);
  vacationMode = signal(false);
  showCheckInModal = signal(false);

  readonly vitalsForm = signal<TriageVitals>({
    systolic: null,
    diastolic: null,
    pulse: null,
    temp: null,
    spo2: null,
    weight: null,
    height: null,
    notes: '',
  });

  readonly triageSuggestion = computed(() => this.data.classifyTriage(this.vitalsForm()));

  updateVital(field: keyof TriageVitals, value: number | string | null): void {
    this.vitalsForm.update((v) => ({ ...v, [field]: value === '' ? null : (value as never) }));
  }

  readonly dayStats = computed(() => {
    const list = this.data.selectedDateAppointments();
    const total = list.length;
    const completed = list.filter((a) => a.status === 'completed').length;
    const noShow = list.filter((a) => a.status === 'no-show').length;
    const inProgress = list.filter((a) => a.status === 'in-progress').length;
    const pending = list.filter((a) => ['pending', 'confirmed', 'checked-in', 'in-triage', 'triaged'].includes(a.status)).length;
    const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
    return { total, completed, noShow, inProgress, pending, pctCompleted: pct(completed), pctInProgress: pct(inProgress), pctPending: pct(pending) };
  });

  readonly activeConsultation = computed(() =>
    this.data.selectedDateAppointments().some((a) => a.status === 'in-progress')
  );

  readonly nextAppointment = computed(() => {
    const now = this.nowMinutes();
    const upcoming = this.data
      .selectedDateAppointments()
      .filter((a) => ['pending', 'confirmed', 'checked-in'].includes(a.status))
      .filter((a) => this.parseTimeMin(a.time) >= now)
      .sort((a, b) => this.parseTimeMin(a.time) - this.parseTimeMin(b.time));
    if (upcoming.length === 0) return null;
    const apt = upcoming[0];
    const minutes = this.parseTimeMin(apt.time) - now;
    const patient = this.data.getPatient(apt.patientId);
    const doctor = this.data.doctors().find((d) => d.id === apt.doctorId);
    return { apt, minutes, patient, doctor, timeLabel: apt.time, display: minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min` : `${minutes} min` };
  });

  readonly punctuality = computed(() => {
    const { completed, noShow } = this.dayStats();
    const denominator = completed + noShow;
    const pct = denominator > 0 ? Math.round((completed / denominator) * 100) : 100;
    return { pct, optimal: pct >= 90, label: pct >= 90 ? 'Óptimo' : pct >= 70 ? 'Atención' : 'Crítico' };
  });

  private parseTimeMin(time: string): number {
    const m = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return 0;
    let hours = parseInt(m[1], 10);
    const minutes = parseInt(m[2], 10);
    const meridiem = m[3].toUpperCase();
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  private nowMinutes(): number {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  constructor() {
    if (this.auth.isDoctor()) {
      const doctorId = this.auth.getDoctorId();
      if (doctorId) {
        this.data.selectedDoctorId.set(doctorId);
      }
    }
  }

  handleOpenConsultation(): void {
    if (this.data.selectedDoctorId() === null) return;
    this.router.navigate(['nueva-consulta']);
  }

  handleRegisterConsultation(): void {
    if (this.data.selectedDoctorId() === null) return;
    this.router.navigate(['nueva-consulta']);
  }

  handleDeclareEmergency(): void {
    if (this.data.selectedDoctorId() === null) return;
    this.toast.show('Alerta de Urgencia Activada', 'Notificación transmitida a Triage y Secretaría Central.');
  }

  handleCheckIn(patientId: string): void {
    this.data.checkInPatient(patientId);
    this.toast.show('Check-in Registrado', 'Paciente marcado como llegado. Listo para triage.');
  }

  handleConfirmAppointment(aptId: string, patientId: string): void {
    if (this.data.selectedDoctorId() === null) return;
    this.data.confirmAppointment(aptId);
    this.toast.show('Cita Confirmada', `${this.data.getPatient(patientId)?.name} confirmó su asistencia.`);
  }

  handleStartTriage(patientId: string): void {
    this.data.startTriage(patientId);
    this.showCheckInModal.set(false);
    this.vitalsForm.set({ systolic: null, diastolic: null, pulse: null, temp: null, spo2: null, weight: null, height: null, notes: '' });
  }

  handleCompleteTriage(): void {
    const apt = this.data.currentTriageAppointment();
    if (apt) {
      this.data.completeTriage(apt.id, { ...this.vitalsForm() });
      this.toast.show('Triage Completado', `${this.data.getPatient(apt.patientId)?.name} listo para consulta médica.`);
    }
  }

  handleCancelTriage(): void {
    this.data.cancelTriage();
  }

  handleStartConsultation(patientId: string): void {
    if (this.data.selectedDoctorId() === null) return;
    this.data.startConsultation(patientId);
    this.showConsultationDrawer.set(true);
    this.toast.show('Consulta Iniciada', `${this.data.getPatient(patientId)?.name} pasó a consulta médica.`);
  }

  rescheduleData = signal<RescheduleData | null>(null);
  newRescheduleDate = signal<string>('');
  newRescheduleTime = signal<string>('');

  timeSlots = computed(() => ['08:30 AM', '09:15 AM', '10:00 AM', '10:45 AM', '11:30 AM', '12:15 PM', '03:00 PM', '03:45 PM', '04:30 PM', '05:15 PM']);

  rescheduleOptions = computed(() => {
    const options: string[] = [];
    let day = this.todayStr();
    while (options.length < 6) {
      day = this.addDaysStr(day, 1);
      if (this.data.isBusinessDay(day)) {
        options.push(day);
      }
    }
    return options;
  });

  openReschedule(apt: AppointmentItem): void {
    if (this.data.selectedDoctorId() === null) return;
    this.rescheduleData.set({
      appointmentId: apt.id,
      patientId: apt.patientId,
      currentDate: apt.date,
      currentTime: apt.time,
    });
    this.newRescheduleDate.set('');
    this.newRescheduleTime.set('');
  }

  closeReschedule(): void {
    this.rescheduleData.set(null);
  }

  applyReschedule(): void {
    const data = this.rescheduleData();
    const newDate = this.newRescheduleDate();
    const newTime = this.newRescheduleTime();
    if (data && newDate && newTime) {
      this.data.rescheduleAppointment(data.appointmentId, newDate, newTime);
      this.data.selectedDate.set(newDate);
      this.toast.show('Cita Reagendada', `${this.data.getPatient(data.patientId)?.name} movida a ${this.formatDate(newDate)} ${newTime}.`);
      this.rescheduleData.set(null);
    }
  }

  formatTime(time: string): string {
    return time;
  }

  shortDayLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return names[d.getDay()];
  }

  dayNumLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return String(d.getDate()).padStart(2, '0');
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${names[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  addDaysStr(dateStr: string, n: number): string {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  formattedSelectedDate(): string {
    return this.formatDate(this.data.selectedDate());
  }

  totalDayPatientsLabel(): string {
    const count = this.data.selectedDateAppointments().length;
    return count === 1 ? '1 Cita' : `${count} Citas`;
  }

  morningOrAfternoonLabel(): string {
    const hasMorning = this.data.selectedDateAppointments().some(a => a.time.includes('AM'));
    const hasAfternoon = this.data.selectedDateAppointments().some(a => a.time.includes('PM'));
    if (hasMorning && hasAfternoon) return 'Bloques Matutino y Vespertino';
    if (hasMorning) return 'Bloque Matutino';
    if (hasAfternoon) return 'Bloque Vespertino';
    return 'Sin citas programadas';
  }

  calendarHeader(): string {
    const month = this.data.calendarMonth();
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${months[month.getMonth()]} ${month.getFullYear()}`;
  }

  calendarDays() {
    return this.data.calendarDays();
  }

  calendarNumbers(): number[] {
    const { daysInMonth } = this.data.calendarDays();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }

  calendarDateStr(day: number): string {
    const { year, month } = this.data.calendarDays();
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  prevMonth(): void {
    const m = new Date(this.data.calendarMonth());
    m.setMonth(m.getMonth() - 1);
    this.data.calendarMonth.set(m);
  }

  nextMonth(): void {
    const m = new Date(this.data.calendarMonth());
    m.setMonth(m.getMonth() + 1);
    this.data.calendarMonth.set(m);
  }

  goToToday(): void {
    this.data.selectedDate.set(this.todayStr());
    this.data.calendarMonth.set(new Date());
  }
}
