import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MockDataService } from './mock-data.service';

describe('MockDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockDataService],
    });
  });

  it('provee los datos del doctor activo', () => {
    const service = TestBed.inject(MockDataService);
    expect(service.doctor.name).toBe('Dra. Noemí Aguirre');
  });

  it('expone citas programadas para hoy', () => {
    const service = TestBed.inject(MockDataService);
    expect(service.appointments().length).toBeGreaterThan(0);
  });

  it('expone el horario semanal completo', () => {
    const service = TestBed.inject(MockDataService);
    expect(service.schedule().length).toBe(6);
  });

  it('expone bloqueos de disponibilidad', () => {
    const service = TestBed.inject(MockDataService);
    expect(service.absences().length).toBeGreaterThan(0);
  });
});