import { Injectable, computed, inject, signal } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MockDataService } from './mock-data.service';
import { NavRoute } from '../models/types';

export interface SetupTask {
  id: string;
  title: string;
  description: string;
  route: NavRoute;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Detecta lo que a un médico le falta para poder operar: jornada semanal con
 * horarios y fechas disponibles para agendar. Es la fuente de las tareas de la
 * campana del header, y consulta el estado real (backend) cada vez que se pide.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private data = inject(MockDataService);

  readonly tasks = signal<SetupTask[]>([]);
  readonly pendingCount = computed(() => this.tasks().length);

  refresh(doctorId: string): Observable<SetupTask[]> {
    const from = todayStr();
    const to = addDays(from, 60);
    return combineLatest([
      this.data.loadScheduleFor(doctorId),
      this.data.getDoctorWorkingDates(doctorId, from, to),
    ]).pipe(
      map(([schedule, dates]) => {
        const tasks: SetupTask[] = [];
        const hasSchedule = schedule.some(
          (d) => d.enabled && !!d.startTime && !!d.endTime && (d.totalCapacity ?? 0) > 0,
        );
        if (!hasSchedule) {
          tasks.push({
            id: 'jornada',
            title: 'Configura tu horario de atención',
            description: 'Habilita al menos un día de la semana con hora de inicio y fin para poder recibir citas.',
            route: 'configuracion-del-sistema',
          });
        }
        if (dates.length === 0) {
          tasks.push({
            id: 'fechas',
            title: 'Abre días disponibles para agendar',
            description: 'Marca las fechas en que atenderás o usa «Marcar según la jornada» para llenarlas de una vez.',
            route: 'configuracion-del-sistema',
          });
        }
        this.tasks.set(tasks);
        return tasks;
      }),
    );
  }

  clear(): void {
    this.tasks.set([]);
  }
}