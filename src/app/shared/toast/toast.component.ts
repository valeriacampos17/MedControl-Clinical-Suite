import { Component, computed, inject } from '@angular/core';
import { ToastService, ToastType } from '../../core/services/toast.service';

/** Colores e iconos por tipo de toast. El fondo del toast es oscuro en todos. */
const LOOK: Record<ToastType, { icon: string; text: string; chip: string; border: string }> = {
  success: { icon: 'check_circle', text: 'text-[#10b981]', chip: 'bg-[#10b981]/15', border: 'border-[#10b981]/30' },
  error: { icon: 'error', text: 'text-[#f87171]', chip: 'bg-[#f87171]/15', border: 'border-[#f87171]/30' },
  warning: { icon: 'warning', text: 'text-[#fbbf24]', chip: 'bg-[#fbbf24]/15', border: 'border-[#fbbf24]/30' },
  info: { icon: 'info', text: 'text-[#38bdf8]', chip: 'bg-[#38bdf8]/15', border: 'border-[#38bdf8]/30' },
};

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    @if (look(); as l) {
      <div
        class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#2d3133] text-white rounded-xl shadow-xl border animate-in slide-in-from-bottom-5 duration-300"
        [class]="l.border"
        role="status"
      >
        <span
          class="material-symbols-outlined text-[22px] shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
          [class]="l.chip + ' ' + l.text"
        >
          {{ l.icon }}
        </span>
        <div class="flex flex-col pr-2">
          <span class="text-[14px] font-semibold leading-tight">{{ toastService.toast()?.title }}</span>
          @if (toastService.toast()?.message) {
            <span class="text-[12px] text-[#eff1f3]/80 mt-0.5">{{ toastService.toast()?.message }}</span>
          }
        </div>
        <button
          type="button"
          (click)="toastService.hide()"
          class="p-1 text-[#eff1f3]/60 hover:text-white hover:bg-white/10 rounded transition-colors ml-auto"
          aria-label="Cerrar aviso"
        >
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    }
  `,
})
export class ToastComponent {
  toastService = inject(ToastService);

  /** Antes devolvia siempre verde y `check_circle`, fijo en el codigo. */
  look = computed(() => LOOK[this.toastService.toast()?.type ?? 'success']);
}