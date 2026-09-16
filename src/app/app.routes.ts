import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard-de-citas', pathMatch: 'full' },
  { path: 'dashboard-de-citas', loadComponent: () => import('./views/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'pacientes-y-historial-clinico', loadComponent: () => import('./views/patient-history/patient-history.component').then(m => m.PatientHistoryComponent) },
  { path: 'agenda-y-disponibilidad', loadComponent: () => import('./views/appointment-booking/appointment-booking.component').then(m => m.AppointmentBookingComponent) },
  { path: 'configuracion-del-sistema', loadComponent: () => import('./views/doctor-config/doctor-config.component').then(m => m.DoctorConfigComponent) },
  { path: 'recetas-y-examenes', loadComponent: () => import('./views/recetas/recetas.component').then(m => m.RecetasComponent) },
  { path: 'notificaciones-y-alertas', loadComponent: () => import('./views/alertas/alertas.component').then(m => m.AlertasComponent) },
  { path: '**', redirectTo: 'dashboard-de-citas' },
];