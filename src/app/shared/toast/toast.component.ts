import { Component, inject, effect } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    @if (toastService.toast()) {
      <div class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#2d3133] text-white rounded-xl shadow-xl border border-white/10 animate-in slide-in-from-bottom-5 duration-300">
        <span [class]="'material-symbols-outlined text-[22px] shrink-0 ' + colorClass()">
          {{ iconClass() }}
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
        >
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    }
  `,
})
export class ToastComponent {
  toastService = inject(ToastService);

  colorClass(): string {
    return 'text-[#10b981]';
  }

  iconClass(): string {
    return 'check_circle';
  }
}
