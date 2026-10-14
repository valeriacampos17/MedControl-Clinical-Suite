import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MockDataService } from '../services/mock-data.service';
import { ToastService } from '../services/toast.service';

/**
 * Evita que la vista de consulta se abra con un paciente arbitrario
 * (p. ej. el primer paciente de la lista). Solo pasa si un flujo explícito
 * eligió un paciente (agenda, historial o cola de espera) antes de navegar.
 */
export const consultationGuard: CanActivateFn = () => {
  const data = inject(MockDataService);
  const toast = inject(ToastService);
  const router = inject(Router);
  if (data.hasActivePatient()) return true;
  toast.show(
    'Seleccione un Paciente',
    'Abra la consulta desde la agenda, la cola de espera o el historial del paciente.',
    'warning'
  );
  return router.createUrlTree(['dashboard-de-citas']);
};
