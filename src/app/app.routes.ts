import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./views/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'pacientes', loadComponent: () => import('./views/patient-history/patient-history.component').then(m => m.PatientHistoryComponent) },
  { path: 'agenda', loadComponent: () => import('./views/appointment-booking/appointment-booking.component').then(m => m.AppointmentBookingComponent) },
  { path: 'configuracion', loadComponent: () => import('./views/doctor-config/doctor-config.component').then(m => m.DoctorConfigComponent) },
  { path: 'recetas', loadComponent: () => import('./views/recetas/recetas.component').then(m => m.RecetasComponent) },
  { path: 'alertas', loadComponent: () => import('./views/alertas/alertas.component').then(m => m.AlertasComponent) },
];
