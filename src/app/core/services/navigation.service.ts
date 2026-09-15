import { Injectable, signal } from '@angular/core';
import { NavRoute } from '../models/types';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  currentRoute = signal<NavRoute>('dashboard-de-citas');
  mobileMenuOpen = signal(false);

  navigate(route: NavRoute): void {
    this.currentRoute.set(route);
  }

  openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
