import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavRoute } from '../models/types';

const routes: NavRoute[] = [
  'dashboard-de-citas',
  'pacientes-y-historial-clinico',
  'agenda-y-disponibilidad',
  'recetas-y-examenes',
  'notificaciones-y-alertas',
  'configuracion-del-sistema',
];

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly router = inject(Router);

  currentRoute = signal<NavRoute>('dashboard-de-citas');
  mobileMenuOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        const route = this.resolveRoute(this.router.url);
        if (route) {
          this.currentRoute.set(route);
        }
      });
  }

  navigate(route: NavRoute): Promise<boolean> {
    return this.router.navigate([route]);
  }

  private resolveRoute(url: string): NavRoute | null {
    const path = url.split('?')[0].replace(/^\//, '').split('/')[0] as NavRoute;
    return routes.includes(path) ? path : null;
  }

  openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
