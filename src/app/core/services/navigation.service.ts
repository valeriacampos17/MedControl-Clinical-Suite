import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { NavRoute } from '../models/types';
import { BreadcrumbSegment } from '../../layout/breadcrumb/breadcrumb.component';

const STORAGE_KEY = 'medcontrol_active_route';

const routeMap: Record<NavRoute, string> = {
  'dashboard-de-citas': 'dashboard-de-citas',
  'pacientes-y-historial-clinico': 'pacientes-y-historial-clinico',
  'agenda-y-disponibilidad': 'agenda-y-disponibilidad',
  'recetas-y-examenes': 'recetas-y-examenes',
  'notificaciones-y-alertas': 'notificaciones-y-alertas',
  'configuracion-del-sistema': 'configuracion-del-sistema',
  'login': 'login',
};

const pathToRoute: Record<string, NavRoute> = Object.fromEntries(
  Object.entries(routeMap).map(([key, val]) => [val, key as NavRoute])
);

const defaultBreadcrumb: Record<NavRoute, BreadcrumbSegment[]> = {
  'dashboard-de-citas': [{ label: 'Dashboard de Citas' }],
  'pacientes-y-historial-clinico': [{ label: 'Pacientes' }],
  'agenda-y-disponibilidad': [{ label: 'Agenda & Disponibilidad' }],
  'recetas-y-examenes': [{ label: 'Recetas & Exámenes' }],
  'notificaciones-y-alertas': [{ label: 'Notificaciones & Alertas' }],
  'configuracion-del-sistema': [{ label: 'Configuración del Sistema' }],
  'login': [{ label: 'Login' }],
};

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  currentRoute = signal<NavRoute>(this.loadRoute());
  mobileMenuOpen = signal(false);
  breadcrumbSegments = signal<BreadcrumbSegment[]>([]);

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(e => {
          const path = e.urlAfterRedirects.replace('/', '');
          return pathToRoute[path] || 'dashboard-de-citas';
        })
      )
      .subscribe(route => {
        this.currentRoute.set(route);
        this.saveRoute(route);
        this.updateBreadcrumb(route);
      });

    this.updateBreadcrumb(this.currentRoute());
  }

  navigate(route: NavRoute): void {
    this.currentRoute.set(route);
    this.saveRoute(route);
    const path = routeMap[route] || 'dashboard-de-citas';
    this.router.navigate([path]);
  }

  setBreadcrumb(segments: BreadcrumbSegment[]): void {
    this.breadcrumbSegments.set(segments);
  }

  openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  private updateBreadcrumb(route: NavRoute): void {
    const root = this.route.snapshot;
    const data = root.data as Record<string, BreadcrumbSegment[] | undefined>;
    if (data && data['breadcrumb']) {
      this.breadcrumbSegments.set(data['breadcrumb']);
    } else {
      this.breadcrumbSegments.set(defaultBreadcrumb[route] || [{ label: 'Dashboard de Citas' }]);
    }
  }

  private loadRoute(): NavRoute {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in routeMap) return stored as NavRoute;
    } catch {}
    return 'dashboard-de-citas';
  }

  private saveRoute(route: NavRoute): void {
    try {
      localStorage.setItem(STORAGE_KEY, route);
    } catch {}
  }
}
