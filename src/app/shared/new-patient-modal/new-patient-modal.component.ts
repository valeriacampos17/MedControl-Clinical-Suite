import { Component, inject, input, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { Patient, NewPatientInput } from '../../core/models/types';
import { ButtonComponent } from '../button/button.component';
import { ModalComponent } from '../modal/modal.component';
import { inputValue, selectValue } from '../../core/utils/form.utils';

@Component({
  selector: 'app-new-patient-modal',
  standalone: true,
  imports: [FormsModule, ButtonComponent, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      title="Registrar Nuevo Paciente"
      subtitle="Complete los datos del paciente. El resto de la ficha clínica se carga con datos de demostración."
      icon="person_add"
      maxWidth="xl"
      [footerTemplate]="true"
      (dismiss)="dismiss.emit()"
    >
      <form class="flex flex-col gap-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="flex flex-col gap-1.5 sm:col-span-2">
            <span class="text-[12px] font-bold text-[#191c1e]">Nombre Completo *</span>
            <input
              type="text"
              name="name"
              required
              placeholder="Ej: Carlos Soto Riquelme"
              class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
              (input)="setField('name', $event)"
              [value]="form().name"
            />
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">CI *</span>
            <input
              type="text"
              name="rut"
              required
              placeholder="Ej: 12.345.678-9"
              class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
              (input)="setField('rut', $event)"
              [value]="form().rut"
            />
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Edad (años)</span>
            <input
              type="number"
              name="age"
              min="0"
              max="120"
              placeholder="Ej: 45"
              class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
              (input)="setField('age', $event)"
              [value]="form().age"
            />
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Teléfono</span>
            <input
              type="tel"
              name="phone"
              placeholder="+56 9 ..."
              class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
              (input)="setField('phone', $event)"
              [value]="form().phone"
            />
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Email</span>
            <input
              type="email"
              name="email"
              placeholder="paciente@correo.cl"
              class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
              (input)="setField('email', $event)"
              [value]="form().email"
            />
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Previsión</span>
            <input
              type="text"
              name="insurance"
              placeholder="Ej: Isapre Colmena Golden"
              class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
              (input)="setField('insurance', $event)"
              [value]="form().insurance"
            />
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Grupo Sanguíneo</span>
            <select
              name="bloodType"
              class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
              (change)="setField('bloodType', $event)"
              [value]="form().bloodType"
            >
              <option value="">Seleccionar…</option>
              <option value="O Rh(+)">O Rh(+)</option>
              <option value="O Rh(-)">O Rh(-)</option>
              <option value="A Rh(+)">A Rh(+)</option>
              <option value="A Rh(-)">A Rh(-)</option>
              <option value="B Rh(+)">B Rh(+)</option>
              <option value="B Rh(-)">B Rh(-)</option>
              <option value="AB Rh(+)">AB Rh(+)</option>
              <option value="AB Rh(-)">AB Rh(-)</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5 sm:col-span-2">
            <span class="text-[12px] font-bold text-[#191c1e]">Alergias (separadas por coma)</span>
            <input
              type="text"
              name="allergies"
              placeholder="Ej: Penicilina, Ibuprofeno"
              class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
              (input)="setField('allergies', $event)"
              [value]="form().allergies"
            />
          </label>
        </div>
        <div class="flex gap-2 pt-1 text-[11.5px] text-[#76777d] leading-relaxed">
          <span class="material-symbols-outlined text-[16px] shrink-0 mt-0.5">info</span>
          <span>Los datos clínicos (consentimiento, condiciones crónicas y medicamentos) se precargan con la ficha de demostración hasta que se agregue información real.</span>
        </div>
      </form>
      <div modal-footer>
        <app-button variant="light" size="md" (click)="dismiss.emit()">Cancelar</app-button>
        <app-button
          variant="primary"
          size="md"
          icon="person_add"
          [disabled]="!canSubmit()"
          (click)="handleCreatePatient()"
        >
          Registrar Paciente
        </app-button>
      </div>
    </app-modal>
  `,
})
export class NewPatientModalComponent {
  private data = inject(MockDataService);
  private toast = inject(ToastService);

  isOpen = input(false);
  created = output<Patient>();
  dismiss = output<void>();

  form = signal<NewPatientInput>({
    name: '',
    rut: '',
    age: '',
    birthDate: '',
    phone: '',
    email: '',
    insurance: '',
    bloodType: '',
    allergies: '',
  });

  canSubmit = computed(() => this.form().name.trim() !== '' && this.form().rut.trim() !== '');

  setField(field: keyof NewPatientInput, event: Event): void {
    const value = field === 'bloodType' ? selectValue(event) : inputValue(event);
    this.form.update((f) => ({ ...f, [field]: value }));
  }

  handleCreatePatient(): void {
    if (!this.canSubmit()) {
      this.toast.show('Faltan Datos', 'Ingrese al menos el nombre completo y la CI del paciente.');
      return;
    }
    const f = this.form();
    const name = f.name.trim();
    const fileNumber = this.data.nextFileNumber();
    const age = Number(f.age) || 0;
    const patient: Patient = {
      id: 'MED-' + fileNumber,
      ci: f.rut.trim(),
      name,
      age,
      birthDate: f.birthDate.trim() || (age ? `Edad registrada: ${age} años` : 'Sin fecha registrada'),
      phone: f.phone.trim() || '+58 000-0000000',
      email: f.email.trim() || 'sin@email.com',
      address: 'Sin dirección registrada',
      insurance: f.insurance.trim() || 'Sin previsión',
      bloodType: f.bloodType || 'Sin especificar',
      allergies: f.allergies.split(',').map((a) => a.trim()).filter(Boolean),
      chronicConditions: [],
      consentSigned: false,
    };
    this.data.addPatient(patient);
    this.created.emit(patient);
    this.form.set({ name: '', rut: '', age: '', birthDate: '', phone: '', email: '', insurance: '', bloodType: '', allergies: '' });
  }
}