import { Component, inject } from '@angular/core';
import { NavigationService } from '../../core/services/navigation.service';
import { ToastService } from '../../core/services/toast.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { ToastComponent } from '../../shared/toast/toast.component';

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [ButtonComponent, BadgeComponent, ToastComponent],
  template: `
    <div class="flex flex-col w-full">
      <div class="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#eceef0]">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-[20px] sm:text-[22px] font-bold text-[#191c1e] tracking-tight">Recetas & Exámenes Electrónicos</h1>
              <app-badge variant="teal" size="sm">Firma Avanzada MINSAL</app-badge>
            </div>
            <p class="text-[13px] text-[#45464d] mt-1">Registro centralizado de recetas médicas electrónicas y órdenes de exámenes complementarios</p>
          </div>
          <app-button variant="primary" size="md" icon="add" (click)="handleNewRecipe()">Emitir Nueva Receta</app-button>
        </div>

        <div class="grid grid-cols-1 gap-4">
          @for (rx of prescriptions; track rx.id) {
            <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="flex items-start gap-3.5">
                <div class="w-10 h-10 rounded-xl bg-[#006a61]/10 text-[#006a61] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[22px]">prescriptions</span>
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[15px] font-bold text-[#191c1e]">{{ rx.patient }}</span>
                    <span class="text-[12px] text-[#76777d]">RUT: {{ rx.rut }}</span>
                    <app-badge [variant]="rx.status === 'Finalizada' ? 'neutral' : 'teal'" size="sm">{{ rx.status }}</app-badge>
                  </div>
                  <p class="text-[12px] text-[#45464d] mt-0.5">Receta #{{ rx.id }} · Emitida: {{ rx.date }} por {{ rx.doctor }}</p>
                  <div class="flex items-center gap-2 mt-2 flex-wrap">
                    @for (m of rx.meds; track m) {
                      <span class="px-2 py-0.5 rounded bg-[#f2f4f6] text-[11px] font-semibold text-[#191c1e] border border-[#e0e3e5]">{{ m }}</span>
                    }
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 self-end md:self-center">
                <app-button variant="light" size="sm" icon="picture_as_pdf" (click)="handleDownload(rx.id)">Ver PDF</app-button>
                <app-button variant="outline" size="sm" icon="print" (click)="handlePrint(rx.id)">Imprimir</app-button>
              </div>
            </div>
          }
        </div>
      </div>
      <app-toast />
    </div>
  `,
})
export class RecetasComponent {
  nav = inject(NavigationService);
  toast = inject(ToastService);

  prescriptions = [
    {
      id: 'RX-99412',
      patient: 'Juan Pérez Morales',
      rut: '14.892.401-2',
      date: '14 Oct 2024',
      doctor: 'Dr. Carlos Mendoza',
      meds: ['Losartán Potásico 50 mg (90 días)', 'Atorvastatina 20 mg (90 días)'],
      status: 'Vigente en Farmacia',
    },
    {
      id: 'RX-98210',
      patient: 'María Elena Morales',
      rut: '15.204.912-3',
      date: '28 Oct 2024',
      doctor: 'Dr. Carlos Mendoza',
      meds: ['Bisoprolol 2.5 mg (60 días)'],
      status: 'Emitida Hoy',
    },
    {
      id: 'RX-95430',
      patient: 'Roberto Gómez',
      rut: '11.450.812-9',
      date: '02 Oct 2024',
      doctor: 'Dra. Patricia Silva',
      meds: ['Amlodipino 5 mg (30 días)', 'Enalapril 10 mg (30 días)'],
      status: 'Finalizada',
    },
  ];

  handleNewRecipe(): void {
    this.toast.show('Nueva Receta Digital', 'Módulo de emisión rápida abierto.');
  }

  handleDownload(id: string): void {
    this.toast.show('Descargando PDF', `Receta ${id} descargada.`);
  }

  handlePrint(id: string): void {
    this.toast.show('Imprimiendo', `Enviando ${id} a impresión.`);
  }
}
