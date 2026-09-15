import { Component, input } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span [class]="badgeClasses()">
      @if (dot()) {
        <span [class]="'w-1.5 h-1.5 rounded-full shrink-0 ' + dotColor() + (pulse() ? ' animate-pulse' : '')"></span>
      }
      @if (icon()) {
        <span class="material-symbols-outlined text-[14px] leading-none shrink-0">{{ icon() }}</span>
      }
      <span><ng-content /></span>
    </span>
  `,
})
export class BadgeComponent {
  variant = input<'teal' | 'success' | 'warning' | 'error' | 'neutral' | 'outline' | 'info'>('teal');
  size = input<'sm' | 'md'>('md');
  dot = input(false);
  pulse = input(false);
  icon = input<string>('');

  badgeClasses(): string {
    const sizes: Record<string, string> = {
      sm: 'px-2 py-0.5 text-[11px] leading-tight font-medium',
      md: 'px-2.5 py-1 text-[12px] leading-none font-semibold',
    };

    const variants: Record<string, string> = {
      teal: 'bg-[#006a61]/10 text-[#006a61] border border-[#006a61]/15',
      success: 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]',
      warning: 'bg-[#fffbeb] text-[#92400e] border border-[#fde68a]',
      error: 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab]',
      neutral: 'bg-[#e6e8ea] text-[#45464d] border border-transparent',
      outline: 'bg-white text-[#45464d] border border-[#c6c6cd]',
      info: 'bg-[#acedff]/30 text-[#004e5c] border border-[#acedff]',
    };

    return `inline-flex items-center gap-1.5 rounded-full select-none ${sizes[this.size()]} ${variants[this.variant()]}`;
  }

  dotColor(): string {
    const colors: Record<string, string> = {
      teal: 'bg-[#006a61]',
      success: 'bg-[#10b981]',
      warning: 'bg-[#f59e0b]',
      error: 'bg-[#ba1a1a]',
      neutral: 'bg-[#76777d]',
      outline: 'bg-[#76777d]',
      info: 'bg-[#0090a9]',
    };
    return colors[this.variant()];
  }
}
