import { Component, signal } from '@angular/core';
import { BookingFormComponent } from './tabs/booking-form.component';
import { AppointmentHistoryComponent } from './tabs/appointment-history.component';

type AgendaTab = 'booking' | 'history';

@Component({
  selector: 'app-appointment-booking',
  standalone: true,
  imports: [BookingFormComponent, AppointmentHistoryComponent],
  template: `
    <div class="flex flex-col w-full">
      <div class="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col gap-4 pb-4 mb-6 border-b border-[#eceef0]">
          <div class="flex items-center gap-3">
            <h1 class="text-[20px] sm:text-[22px] font-bold text-[#191c1e] tracking-tight">Agenda &amp; Disponibilidad</h1>
          </div>
          <p class="text-[13px] text-[#45464d]">Agende citas y consulte el historial completo de la agenda.</p>
        </div>

        <div class="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6">
          @for (tab of tabs; track tab.id) {
            <button
              type="button"
              class="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors"
              [class]="activeTab() === tab.id
                ? 'bg-[#006a61] text-white shadow-sm'
                : 'bg-white text-[#45464d] border border-[#e6e8ea] hover:bg-[#f2f4f6]'"
              (click)="activeTab.set(tab.id)"
            >
              <span class="material-symbols-outlined text-[18px]">{{ tab.icon }}</span>
              {{ tab.label }}
            </button>
          }
        </div>

        @switch (activeTab()) {
          @case ('booking') {
            <app-booking-form />
          }
          @case ('history') {
            <app-appointment-history />
          }
        }
      </div>
    </div>
  `,
})
export class AppointmentBookingComponent {
  readonly activeTab = signal<AgendaTab>('booking');

  readonly tabs = [{ id: 'booking' as AgendaTab, label: 'Agendar Cita', icon: 'event_available' }, { id: 'history' as AgendaTab, label: 'Historial de Citas', icon: 'history' }];
}
