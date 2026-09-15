import { Component, input, output, effect, HostListener } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191c1e]/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="fixed inset-0" (click)="close.emit()" aria-hidden="true"></div>
        <div [class]="'relative w-full ' + maxWidthClass() + ' bg-white rounded-2xl shadow-2xl border border-[#e6e8ea] overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 z-10 flex flex-col'">
          <div class="flex items-center justify-between p-5 border-b border-[#eceef0] bg-[#f7f9fb]/50">
            <div class="flex items-center gap-3">
              @if (icon()) {
                <div class="w-10 h-10 rounded-xl bg-[#006a61]/10 text-[#006a61] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[22px]">{{ icon() }}</span>
                </div>
              }
              <div>
                <h3 class="text-[17px] font-bold text-[#191c1e] tracking-tight">{{ title() }}</h3>
                @if (subtitle()) {
                  <p class="text-[13px] text-[#45464d] mt-0.5">{{ subtitle() }}</p>
                }
              </div>
            </div>
            <button
              type="button"
              (click)="close.emit()"
              class="p-1.5 rounded-lg text-[#76777d] hover:text-[#191c1e] hover:bg-[#eceef0] transition-colors"
            >
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div class="p-5 max-h-[calc(100vh-220px)] overflow-y-auto">
            <ng-content />
          </div>
          @if (footerTemplate) {
            <div class="flex items-center justify-end gap-2.5 p-4 border-t border-[#eceef0] bg-[#f7f9fb]">
              <ng-content select="[modal-footer]" />
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  isOpen = input(false);
  title = input('');
  subtitle = input('');
  icon = input('');
  maxWidth = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  close = output<void>();
  footerTemplate = input(false);

  maxWidthClass(): string {
    const sizes: Record<string, string> = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
    };
    return sizes[this.maxWidth()];
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.close.emit();
    }
  }
}
