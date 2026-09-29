import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { NavigationService } from '../../core/services/navigation.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { Patient } from '../../core/models/types';
import { ButtonComponent } from '../../shared/button/button.component';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ToastComponent } from '../../shared/toast/toast.component';
import { NewPatientModalComponent } from '../../shared/new-patient-modal/new-patient-modal.component';

interface DoctorOption {
  id: string;
  name: string;
  shortName: string;
  specialty: string;
  avatarUrl?: string;
}

@Component({
  selector: 'app-appointment-booking',
  standalone: true,
  imports: [ButtonComponent, BadgeComponent, ModalComponent, ToastComponent, NewPatientModalComponent],
  template: `
    <div class="flex flex-col w-full">
      <div class="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
        <div class="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-[#86f2e4] opacity-20 blur-3xl pointer-events-none -z-10"></div>
        <div class="absolute top-80 right-0 w-80 h-80 rounded-full bg-[#acedff] opacity-20 blur-3xl pointer-events-none -z-10"></div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#eceef0]">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-[20px] sm:text-[22px] font-bold text-[#191c1e] tracking-tight">Programación de Turno Clínico</h1>
              <app-badge variant="teal" size="sm">Modo Admisión / Asistente Clínico</app-badge>
            </div>
            <p class="text-[13px] text-[#45464d] mt-1">Agendamiento en tiempo real con validación biomédica y bono electrónico integrado</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div class="lg:col-span-7 flex flex-col gap-6">
            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#eceef0]">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-full bg-[#006a61] text-white flex items-center justify-center text-[13px] font-bold">1</span>
                  <h2 class="text-[15px] font-bold text-[#191c1e]">Búsqueda & Identificación del Paciente</h2>
                </div>
                <app-badge variant="success" size="sm">Completado</app-badge>
              </div>

              @if (selectedPatient()?.id) {
                <div class="p-4 rounded-xl bg-[#f2f4f6] border border-[#e0e3e5]">
                  <div class="flex items-start gap-3.5">
                    <div class="w-12 h-12 rounded-xl bg-[#006a61] text-white flex items-center justify-center text-[16px] font-bold shrink-0 ring-1 ring-[#c6c6cd]">
                      {{ data.getInitials(selectedPatient()!.name) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-[14px] font-bold text-[#191c1e] truncate">{{ selectedPatient()!.name }}</span>
                        <span class="text-[11px] text-[#45464d]">{{ selectedPatient()!.age }} años ({{ selectedPatient()!.birthDate }})</span>
                      </div>
                      <p class="text-[12px] text-[#45464d] truncate mt-0.5">Expediente: {{ selectedPatient()!.id }} · CI: {{ selectedPatient()!.ci }}</p>
                    </div>
                    <button
                      type="button"
                      class="shrink-0 px-2.5 py-1 rounded-lg text-[#76777d] hover:bg-[#e6e8ea] transition-colors text-[12px] font-semibold"
                      (click)="clearPatient()"
                      title="Cambiar de paciente"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              } @else {
                <div class="p-4 rounded-xl bg-[#fffdf5] border border-[#fde68a]">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="material-symbols-outlined text-[#b45309] text-[18px]">search</span>
                    <span class="text-[12.5px] font-semibold text-[#92400e]">Seleccione o registre un paciente para continuar</span>
                  </div>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-[18px] pointer-events-none" aria-hidden="true">search</span>
                    <input
                      type="text"
                      placeholder="Buscar paciente por nombre o CI..."
                      title="Buscar un paciente por nombre o CI para asignarlo al turno"
                      class="w-full pl-9 pr-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] transition-colors"
                      [value]="searchPatientTerm()"
                      (input)="onSearchPatient($event)"
                      (focus)="showPatientDropdown.set(true)"
                      (blur)="onBlurPatient()"
                    />
                  </div>
                  @if (showPatientDropdown() && filteredPatients().length > 0) {
                    <div class="absolute z-30 mt-1 w-full max-w-[calc(100%-2rem)] bg-white rounded-xl shadow-lg border border-[#e6e8ea] max-h-60 overflow-y-auto">
                      @for (p of filteredPatients(); track p.id) {
                        <button
                          type="button"
                          class="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#f2f4f6] transition-colors first:rounded-t-xl last:rounded-b-xl"
                          (mousedown)="handleSelectPatient(p.id)"
                        >
                          <div class="w-8 h-8 rounded-lg bg-[#006a61] text-white flex items-center justify-center text-[11px] font-bold ring-1 ring-[#eceef0] shrink-0">
                            {{ data.getInitials(p.name) }}
                          </div>
                          <div class="flex flex-col min-w-0">
                            <span class="text-[13px] font-semibold text-[#191c1e] truncate">{{ p.name }}</span>
                            <span class="text-[11px] text-[#76777d]">CI: {{ p.ci }} · {{ p.age }} años</span>
                          </div>
                        </button>
                      }
                    </div>
                  }
                  @if (showPatientDropdown() && searchPatientTerm() && filteredPatients().length === 0) {
                    <div class="absolute z-30 mt-1 w-full max-w-[calc(100%-2rem)] bg-white rounded-xl shadow-lg border border-[#e6e8ea] p-4 text-center">
                      <span class="text-[12px] text-[#76777d]">No se encontraron pacientes con "{{ searchPatientTerm() }}"</span>
                    </div>
                  }
                </div>
              }
              <div class="mt-3 flex items-center gap-2">
                <app-button variant="outline" size="sm" icon="person_add" (click)="openNewPatientModal()" title="Abrir el formulario para registrar un nuevo paciente en el sistema">
                  Registrar Nuevo Paciente
                </app-button>
              </div>
            </div>

            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#eceef0]">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-full bg-[#006a61] text-white flex items-center justify-center text-[13px] font-bold">2</span>
                  <h2 class="text-[15px] font-bold text-[#191c1e]">Especialidad & Asignación Médica</h2>
                </div>
                <app-badge variant="teal" size="sm">Asignado</app-badge>
              </div>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-[18px] pointer-events-none" aria-hidden="true">stethoscope</span>
                <input
                  type="text"
                  placeholder="Buscar médico por nombre o especialidad..."
                  title="Buscar y asignar el médico responsable del turno"
                  class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] transition-colors"
                  [value]="doctorSearchTerm()"
                  (input)="onSearchDoctor($event)"
                  (focus)="showDoctorDropdown.set(true)"
                  (blur)="onBlurDoctor()"
                />
              </div>
              @if (showDoctorDropdown() && filteredDoctors().length > 0) {
                <div class="absolute z-30 mt-1 w-full max-w-[calc(100%-2rem)] bg-white rounded-xl shadow-lg border border-[#e6e8ea] max-h-60 overflow-y-auto">
                  @for (d of filteredDoctors(); track d.id) {
                    <button
                      type="button"
                      class="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#f2f4f6] transition-colors first:rounded-t-xl last:rounded-b-xl"
                      [class]="selectedDoctorId() === d.id ? 'bg-[#f2f4f6]' : ''"
                      (mousedown)="handleSelectDoctor(d)"
                    >
                      <div class="w-8 h-8 rounded-lg bg-[#006a61] text-white flex items-center justify-center text-[11px] font-bold ring-1 ring-[#eceef0] shrink-0">
                        {{ data.getInitials(d.name) }}
                      </div>
                      <div class="flex flex-col min-w-0">
                        <span class="text-[13px] font-semibold text-[#191c1e] truncate">{{ d.name }}</span>
                        <span class="text-[11px] text-[#76777d]">{{ d.specialty }}</span>
                      </div>
                      @if (selectedDoctorId() === d.id) {
                        <span class="material-symbols-outlined text-[#006a61] text-[16px] ml-auto shrink-0">check</span>
                      }
                    </button>
                  }
                </div>
              }
              @if (showDoctorDropdown() && doctorSearchTerm() && filteredDoctors().length === 0) {
                <div class="absolute z-30 mt-1 w-full max-w-[calc(100%-2rem)] bg-white rounded-xl shadow-lg border border-[#e6e8ea] p-4 text-center">
                  <span class="text-[12px] text-[#76777d]">No se encontraron médicos con "{{ doctorSearchTerm() }}"</span>
                </div>
              }
              @if (selectedDoctor(); as doctor) {
                <div class="p-3 rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] flex items-center gap-3 mt-3">
                  <div class="w-10 h-10 rounded-lg bg-[#006a61] text-white flex items-center justify-center text-[13px] font-bold shrink-0 ring-1 ring-[#c6c6cd]">
                    {{ data.getInitials(doctor.name) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-bold text-[#191c1e] truncate">{{ doctor.name }}</p>
                    <p class="text-[11px] text-[#45464d] truncate">Especialidad: {{ doctor.specialty }}</p>
                  </div>
                </div>
              }
            </div>

            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#eceef0]">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-full bg-[#006a61] text-white flex items-center justify-center text-[13px] font-bold">3</span>
                  <h2 class="text-[15px] font-bold text-[#191c1e]">Tipo de Consulta & Duración del Bloque</h2>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                @for (item of consultationTypes; track item.id) {
                  <div
                    (click)="consultationType.set(item.id)"
                    class="p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between"
                    [class]="consultationType() === item.id
                      ? 'border-2 border-[#006a61] bg-[#006a61]/5 shadow-xs'
                      : 'border-[#e0e3e5] bg-[#f2f4f6] hover:bg-[#e6e8ea]'"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="flex items-center gap-1.5">
                          <span class="text-[13px] font-bold text-[#191c1e]">{{ item.title }}</span>
                          @if (item.suggested) {
                            <span class="px-1.5 py-0.2 rounded bg-[#006a61] text-white text-[9px] font-bold">Sugerido</span>
                          }
                        </div>
                        <p class="text-[11px] text-[#45464d] mt-0.5">{{ item.note }}</p>
                      </div>
                    </div>
                    <div class="flex items-center justify-between mt-3 pt-2 border-t border-[#e0e3e5] text-[11px]">
                      <span class="font-semibold text-[#006a61]">{{ item.mins }}</span>
                      <span class="text-[#76777d]">{{ item.price }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="lg:col-span-5 flex flex-col gap-6">
            <div class="bg-[#ffdad6]/40 border border-[#ba1a1a]/30 rounded-xl p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-[#ba1a1a]">
                  <span class="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  <span class="text-[13px] font-bold">Bloqueo Atómico de Reserva</span>
                </div>
                <span class="font-mono text-[14px] font-extrabold text-[#ba1a1a] bg-white px-2 py-0.5 rounded border border-[#ba1a1a]/30 shadow-xs">
                  {{ formatCountdown() }}
                </span>
              </div>
            </div>

            <div class="bg-white rounded-xl p-5 shadow-lg border-2 border-[#006a61] relative">
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#eceef0]">
                <h3 class="text-[15px] font-bold text-[#191c1e]">Resumen de Agendamiento</h3>
                <span class="w-2.5 h-2.5 rounded-full bg-[#006a61] animate-pulse"></span>
              </div>
              <div class="flex flex-col gap-2 text-[12px] text-[#45464d] mb-4">
                <div class="flex items-center justify-between">
                  <span>Paciente:</span>
                  <span class="font-bold text-[#191c1e]">{{ selectedPatient()?.name ?? '—' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Médico:</span>
                  <span class="font-semibold text-[#191c1e]">{{ selectedDoctor()?.name ?? '—' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Cita:</span>
                  <span class="font-bold text-[#006a61]">Lunes {{ selectedDay() }} Oct · {{ selectedTime() }}</span>
                </div>
              </div>
              <app-button variant="primary" size="lg" icon="check_circle" [fullWidth]="true" [disabled]="!canConfirm()" (click)="showConfirmModal.set(true)">
                Confirmar y Agendar Cita
              </app-button>
            </div>
          </div>
        </div>
      </div>

      <app-modal
        [isOpen]="showConfirmModal()"
        title="Confirmar Cita Médica"
        subtitle="Verifique los detalles antes de emitir la reserva electrónica"
        icon="event_available"
        [footerTemplate]="true"
        (dismiss)="showConfirmModal.set(false)"
      >
        <div class="space-y-3 text-[13px]">
          <p class="text-[#45464d]">Se reservará un bloque de atención clínica para:</p>
          <div class="p-3.5 rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] space-y-1.5">
            <p class="font-bold text-[#191c1e]">Paciente: {{ selectedPatient()?.name }}</p>
            <p class="text-[#45464d]">Profesional: {{ selectedDoctor()?.name }}</p>
            <p class="text-[#45464d]">Fecha: Lunes {{ selectedDay() }} Octubre 2024 a las {{ selectedTime() }}</p>
          </div>
        </div>
        <div modal-footer class="flex items-center justify-end gap-2.5">
          <app-button variant="light" (click)="showConfirmModal.set(false)">Cancelar</app-button>
          <app-button variant="primary" icon="check" (click)="handleConfirmBooking()">Confirmar Definitivamente</app-button>
        </div>
      </app-modal>

      <app-new-patient-modal
        [isOpen]="showNewPatientModal()"
        (created)="handlePatientCreated($event)"
        (dismiss)="closeNewPatientModal()"
      />

      <app-toast />
    </div>
  `,
})
export class AppointmentBookingComponent implements OnInit, OnDestroy {
  nav = inject(NavigationService);
  data = inject(MockDataService);
  toast = inject(ToastService);

  timeLeft = signal(582);
  selectedDay = signal(28);
  selectedTime = signal('12:15 PM');
  consultationType = signal('control');
  showConfirmModal = signal(false);
  selectedPatient = signal<Patient | null>(null);
  showNewPatientModal = signal(false);

  searchPatientTerm = signal('');
  showPatientDropdown = signal(false);
  doctorSearchTerm = signal('');
  showDoctorDropdown = signal(false);
  selectedDoctorId = signal<string | null>(this.data.doctors()[0]?.id ?? null);

  readonly filteredPatients = computed(() => {
    const term = this.searchPatientTerm().toLowerCase().trim();
    if (!term) return this.data.patients();
    return this.data.patients().filter(
      (p) => p.name.toLowerCase().includes(term) || p.ci.toLowerCase().includes(term)
    );
  });

  readonly filteredDoctors = computed<DoctorOption[]>(() => {
    const term = this.doctorSearchTerm().toLowerCase().trim();
    const doctors: DoctorOption[] = this.data.doctors();
    if (!term) return doctors;
    return doctors.filter(
      (d) => d.name.toLowerCase().includes(term) || d.specialty.toLowerCase().includes(term)
    );
  });

  readonly selectedDoctor = computed<DoctorOption | null>(() => {
    const id = this.selectedDoctorId();
    if (!id) return null;
    return this.data.doctors().find((d) => d.id === id) ?? null;
  });

  readonly canConfirm = computed(() => !!this.selectedPatient() && !!this.selectedDoctor());

  private timer: ReturnType<typeof setInterval> | null = null;

  consultationTypes = [
    { id: 'primera', title: 'Primera Consulta', mins: '45 minutos', price: '$75.000 Particular', note: 'Anamnesis completa y examen físico', suggested: false },
    { id: 'control', title: 'Control Periódico', mins: '30 minutos', price: '$60.000 Particular', note: 'Sugerido por Sistema', suggested: true },
    { id: 'sobrecupo', title: 'Sobrecupo de Urgencia', mins: '20 minutos', price: '$50.000 Particular', note: 'Requiere autorización médica', suggested: false },
    { id: 'examenes', title: 'Lectura de Exámenes', mins: '15 minutos', price: 'Sin costo adicional', note: 'Revisión rápida de laboratorio', suggested: false },
  ];

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.timeLeft.update(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  formatCountdown(): string {
    const seconds = this.timeLeft();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} min`;
  }

  onSearchPatient(event: Event): void {
    this.searchPatientTerm.set((event.target as HTMLInputElement).value);
    this.showPatientDropdown.set(true);
  }

  onBlurPatient(): void {
    setTimeout(() => this.showPatientDropdown.set(false), 150);
  }

  handleSelectPatient(id: string): void {
    const patient = this.data.getPatient(id);
    if (!patient) return;
    this.selectedPatient.set(patient);
    this.searchPatientTerm.set('');
    this.showPatientDropdown.set(false);
  }

  clearPatient(): void {
    this.selectedPatient.set(null);
  }

  openNewPatientModal(): void {
    this.showNewPatientModal.set(true);
  }

  closeNewPatientModal(): void {
    this.showNewPatientModal.set(false);
  }

  handlePatientCreated(patient: Patient): void {
    this.selectedPatient.set(patient);
    this.closeNewPatientModal();
    this.searchPatientTerm.set('');
    this.showPatientDropdown.set(false);
    this.toast.show('Paciente Registrado', `${patient.name} fue agregado y seleccionado para el turno.`);
  }

  onSearchDoctor(event: Event): void {
    this.doctorSearchTerm.set((event.target as HTMLInputElement).value);
    this.showDoctorDropdown.set(true);
  }

  onBlurDoctor(): void {
    setTimeout(() => this.showDoctorDropdown.set(false), 150);
  }

  handleSelectDoctor(doctor: DoctorOption): void {
    this.selectedDoctorId.set(doctor.id);
    this.doctorSearchTerm.set('');
    this.showDoctorDropdown.set(false);
  }

  handleConfirmBooking(): void {
    this.showConfirmModal.set(false);
    const patient = this.selectedPatient();
    const doctor = this.selectedDoctor();
    if (!patient || !doctor) return;
    const type = this.consultationTypes.find((t) => t.id === this.consultationType());
    this.data.createAppointment({
      date: `2024-10-${String(this.selectedDay()).padStart(2, '0')}`,
      time: this.selectedTime(),
      durationMinutes: Number((type?.mins ?? '30').split(' ')[0]) || 30,
      patientId: patient.id,
      doctorId: doctor.id,
      reason: type?.title ?? 'Consulta',
      consultationTypeId: type?.id,
    });
    this.toast.show('¡Cita Médica Agendada Exitosamente!', `Cita reservada para ${patient.name} (${doctor.name}) el Lunes ${this.selectedDay()} Octubre.`);
  }
}