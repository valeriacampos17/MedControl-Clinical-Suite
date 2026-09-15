import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div [class]="cardClasses()">
      <ng-content />
    </div>
  `,
})
export class CardComponent {
  variant = input<'elevated' | 'flat' | 'outline' | 'interactive'>('elevated');

  cardClasses(): string {
    const variants: Record<string, string> = {
      elevated: 'bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] border border-[#e6e8ea]',
      flat: 'bg-[#f2f4f6] rounded-xl border border-transparent',
      outline: 'bg-white rounded-xl border border-[#c6c6cd]/60',
      interactive: 'bg-white rounded-xl shadow-sm border border-[#e6e8ea] hover:shadow-md hover:border-[#006a61]/30 transition-all cursor-pointer',
    };
    return `${variants[this.variant()]} p-4 sm:p-5`;
  }
}

@Component({
  selector: 'app-card-header',
  standalone: true,
  template: `
    <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#eceef0]">
      <ng-content />
    </div>
  `,
})
export class CardHeaderComponent {}

@Component({
  selector: 'app-card-title',
  standalone: true,
  template: `
    <h3 class="text-[16px] font-semibold text-[#191c1e] tracking-tight flex items-center gap-2">
      <ng-content />
    </h3>
  `,
})
export class CardTitleComponent {}

@Component({
  selector: 'app-card-description',
  standalone: true,
  template: `
    <p class="text-[13px] text-[#45464d] mt-0.5">
      <ng-content />
    </p>
  `,
})
export class CardDescriptionComponent {}

@Component({
  selector: 'app-card-content',
  standalone: true,
  template: `
    <div class="flex flex-col gap-3">
      <ng-content />
    </div>
  `,
})
export class CardContentComponent {}

@Component({
  selector: 'app-card-footer',
  standalone: true,
  template: `
    <div class="mt-4 pt-3 border-t border-[#eceef0] flex items-center justify-between">
      <ng-content />
    </div>
  `,
})
export class CardFooterComponent {}
