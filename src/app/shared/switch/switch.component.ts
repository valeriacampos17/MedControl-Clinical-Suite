import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-switch',
  standalone: true,
  template: `
    <label class="inline-flex items-start justify-between gap-3 cursor-pointer select-none" [class.opacity-50]="disabled()" [class.cursor-not-allowed]="disabled()">
      @if (label() || description()) {
        <div class="flex flex-col text-left">
          @if (label()) {
            <span class="text-[14px] font-medium text-[#191c1e]">{{ label() }}</span>
          }
          @if (description()) {
            <span class="text-[12px] text-[#76777d] mt-0.5">{{ description() }}</span>
          }
        </div>
      }
      <button
        type="button"
        role="switch"
        [attr.aria-checked]="checked()"
        [disabled]="disabled()"
        (click)="toggle()"
        [class]="switchClasses()"
      >
        <span
          [class]="thumbClasses()"
        ></span>
      </button>
    </label>
  `,
})
export class SwitchComponent {
  checked = input(false);
  label = input('');
  description = input('');
  disabled = input(false);
  size = input<'sm' | 'md'>('md');
  change = output<boolean>();

  toggle(): void {
    if (!this.disabled()) {
      this.change.emit(!this.checked());
    }
  }

  switchClasses(): string {
    const sizes: Record<string, string> = {
      sm: 'w-8 h-4.5 p-0.5',
      md: 'w-11 h-6 p-0.5',
    };
    return `relative inline-flex shrink-0 transition-colors duration-200 ease-in-out rounded-full focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 ${
      sizes[this.size()]
    } ${this.checked() ? 'bg-[#006a61]' : 'bg-[#c6c6cd]'}`;
  }

  thumbClasses(): string {
    const sizes: Record<string, string> = {
      sm: 'w-3.5 h-3.5',
      md: 'w-5 h-5',
    };
    return `pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
      sizes[this.size()]
    } ${
      this.checked()
        ? this.size() === 'sm' ? 'translate-x-3.5' : 'translate-x-5'
        : 'translate-x-0'
    }`;
  }
}
