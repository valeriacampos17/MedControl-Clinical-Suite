import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { NavRoute } from '../models/types';

const routeMap: Record<NavRoute, string> = {
  'dashboard-de-citas': 'dashboard',
  'pacientes-y-historial-clinico': 'pacientes',
  'agenda-y-disponibilidad': 'agenda',
  'recetas-y-examenes': 'recetas',
  'notificaciones-y-alertas': 'alertas',
  'configuracion-del-sistema': 'configuracion',
};

const pathToRoute: Record<string, NavRoute> = Object.fromEntries(
  Object.entries(routeMap).map(([key, val]) => [val, key as NavRoute])
);

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private router = inject(Router);

  currentRoute = signal<NavRoute>('dashboard-de-citas');
  mobileMenuOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(e => {
          const path = e.urlAfterRedirects.replace('/', '');
          return pathToRoute[path] || 'dashboard-de-citas';
        })
      )
      .subscribe(route => this.currentRoute.set(route));
  }

  navigate(route: NavRoute): void {
    this.currentRoute.set(route);
    const path = routeMap[route] || 'dashboard';
    this.router.navigate([path]);
  }

  openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
