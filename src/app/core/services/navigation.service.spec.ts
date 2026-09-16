import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { NavigationService } from './navigation.service';

@Component({
  standalone: true,
  template: '',
})
class StubRouteComponent {}

const testRoutes = [
  { path: 'agenda-y-disponibilidad', component: StubRouteComponent },
];

describe('NavigationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(testRoutes)],
    });
  });

  it('inicializa en la ruta del dashboard', () => {
    const service = TestBed.inject(NavigationService);
    expect(service.currentRoute()).toBe('dashboard-de-citas');
  });

  it('navega por el router y sincroniza la ruta activa', async () => {
    const service = TestBed.inject(NavigationService);
    const router = TestBed.inject(Router);

    await service.navigate('agenda-y-disponibilidad');

    expect(router.url).toBe('/agenda-y-disponibilidad');
    expect(service.currentRoute()).toBe('agenda-y-disponibilidad');
  });

  it('abre y cierra el menú móvil', () => {
    const service = TestBed.inject(NavigationService);
    service.openMobileMenu();
    expect(service.mobileMenuOpen()).toBe(true);
    service.closeMobileMenu();
    expect(service.mobileMenuOpen()).toBe(false);
  });
});