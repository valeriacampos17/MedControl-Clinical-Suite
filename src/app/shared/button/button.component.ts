import { Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="buttonClasses()"
      [attr.title]="title() || null"
    >
      @if (loading()) {
        <span class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      } @else {
        @if (icon() && iconPosition() === 'left') {
          <span class="material-symbols-outlined text-[18px] leading-none shrink-0">{{ icon() }}</span>
        }
        @if (children) {
          <span><ng-content /></span>
        }
        @if (icon() && iconPosition() === 'right') {
          <span class="material-symbols-outlined text-[18px] leading-none shrink-0">{{ icon() }}</span>
        }
      }
    </button>
  `,
})
export class ButtonComponent {
  variant = input<'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'light'>('primary');
  size = input<'sm' | 'md' | 'lg'>('md');
  icon = input<string>('');
  iconPosition = input<'left' | 'right'>('left');
  fullWidth = input(false);
  loading = input(false);
  disabled = input(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  title = input<string>('');

  buttonClasses(): string {
    const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg select-none cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

    const sizes: Record<string, string> = {
      sm: 'h-8 px-2.5 text-[12px] gap-1.5 leading-none',
      md: 'h-10 px-3.5 text-[13px] gap-2',
      lg: 'h-11 px-5 text-[14px] gap-2.5 font-semibold',
    };

    const variants: Record<string, string> = {
      primary: 'bg-[#006a61] text-white hover:bg-[#005049] shadow-sm',
      secondary: 'bg-[#131b2e] text-white hover:bg-[#1e293b] shadow-sm',
      outline: 'bg-white border border-[#c6c6cd]/50 text-[#191c1e] hover:bg-[#f2f4f6] shadow-sm',
      ghost: 'text-[#45464d] hover:bg-[#eceef0] hover:text-[#191c1e]',
      danger: 'bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab] border border-[#ba1a1a]/20',
      light: 'bg-[#f2f4f6] text-[#191c1e] hover:bg-[#e6e8ea] shadow-sm',
    };

    return `${base} ${sizes[this.size()]} ${variants[this.variant()]} ${this.fullWidth() ? 'w-full' : ''}`;
  }
}
