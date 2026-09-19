import { Component, inject, input } from '@angular/core';
import { NavigationService } from '../../core/services/navigation.service';
import { NavRoute } from '../../core/models/types';

export interface BreadcrumbSegment {
  label: string;
  route?: NavRoute;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  template: `
    <div class="flex items-center gap-4">
      <nav class="flex items-center gap-1.5 text-[13px] shrink-0 min-w-0">
        <span (click)="navigate('dashboard-de-citas')" class="hover:text-[#006a61] cursor-pointer text-[#45464d]">Inicio</span>
        @for (segment of segments(); track segment.label; let i = $index) {
          <span class="text-[#76777d]">/</span>
          @if (segment.route) {
            <span
              (click)="navigate(segment.route!)"
              class="hover:text-[#006a61] cursor-pointer text-[#45464d] truncate"
            >
              {{ segment.label }}
            </span>
          } @else {
            <span class="font-semibold text-[#191c1e] truncate">{{ segment.label }}</span>
          }
        }
      </nav>
      @if (hasActions()) {
        <div class="flex items-center gap-2.5 flex-wrap shrink-0">
          <ng-content />
        </div>
      }
    </div>
  `,
})
export class BreadcrumbComponent {
  private nav = inject(NavigationService);

  segments = input.required<BreadcrumbSegment[]>();

  hasActions(): boolean {
    return true;
  }

  navigate(route: NavRoute): void {
    this.nav.navigate(route);
  }
}
