import { Component, inject, signal } from '@angular/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { OrganizationSettings } from '../../../core/models/types';
import { ButtonComponent } from '../../../shared/button/button.component';
import { ToastComponent } from '../../../shared/toast/toast.component';

@Component({
  selector: 'app-organization-management',
  standalone: true,
  imports: [ButtonComponent, ToastComponent],
  template: `
    <div class="flex flex-col gap-4 max-w-3xl">
      <div>
        <h2 class="text-[16px] font-bold text-[#191c1e]">Configuración de la Organización</h2>
        <p class="text-[12px] text-[#45464d]">Datos del centro de salud que se incorporan al branding de recetas y órdenes (PDF)</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-[#e6e8ea] p-5 flex flex-col gap-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Nombre del Centro *</span>
            <input type="text" [value]="form().name" (input)="onInput('name', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">RIF</span>
            <input type="text" [value]="form().rut" (input)="onInput('rut', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" placeholder="Ej: J-12345678-9" />
          </label>
        </div>
        <label class="flex flex-col gap-1.5">
          <span class="text-[12px] font-bold text-[#191c1e]">Dirección</span>
          <input type="text" [value]="form().address" (input)="onInput('address', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" />
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Teléfono</span>
            <input type="text" [value]="form().phone" (input)="onInput('phone', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Correo</span>
            <input type="email" [value]="form().email" (input)="onInput('email', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" />
          </label>
        </div>
        <label class="flex flex-col gap-1.5">
          <span class="text-[12px] font-bold text-[#191c1e]">Firma del Responsable</span>
          <input type="text" [value]="form().signatureName" (input)="onInput('signatureName', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" placeholder="Ej: Dra. Noemí Aguirre" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-[12px] font-bold text-[#191c1e]">Pie de Documento (legal/marca de agua)</span>
          <textarea rows="2" [value]="form().footerText" (input)="onInput('footerText', $event)" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] resize-none"></textarea>
        </label>
      </div>

      <div>
        <app-button variant="primary" size="md" icon="save" (click)="save()">Guardar Organización</app-button>
      </div>
      <app-toast />
    </div>
  `,
})
export class OrganizationManagementComponent {
  data = inject(MockDataService);
  toast = inject(ToastService);

  readonly form = signal<OrganizationSettings>({ ...this.data.organization() });

  private update(key: string, value: unknown): void {
    this.form.update((f) => ({ ...f, [key]: value as never }));
  }

  onInput(key: string, event: Event): void {
    this.update(key, (event.target as HTMLInputElement).value);
  }

  save(): void {
    const f = this.form();
    if (!f.name.trim()) {
      this.toast.show('Faltan Datos', 'Ingrese el nombre del centro de salud.');
      return;
    }
    this.data.updateOrganization({ ...f, name: f.name.trim() });
    this.toast.show('Organización Guardada', 'Los datos del centro se actualizaron en el branding de los documentos.');
  }
}