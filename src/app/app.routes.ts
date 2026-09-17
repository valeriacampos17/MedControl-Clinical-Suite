import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./views/login/login.component').then(m => m.LoginComponent) },
  { path: '', redirectTo: 'dashboard-de-citas', pathMatch: 'full' },
  { path: 'dashboard-de-citas', canActivate: [authGuard], loadComponent: () => import('./views/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'pacientes-y-historial-clinico', canActivate: [authGuard], loadComponent: () => import('./views/patient-history/patient-history.component').then(m => m.PatientHistoryComponent) },
  { path: 'agenda-y-disponibilidad', canActivate: [authGuard], loadComponent: () => import('./views/appointment-booking/appointment-booking.component').then(m => m.AppointmentBookingComponent) },
  { path: 'configuracion-del-sistema', canActivate: [authGuard], loadComponent: () => import('./views/doctor-config/doctor-config.component').then(m => m.DoctorConfigComponent) },
  { path: 'recetas-y-examenes', canActivate: [authGuard], loadComponent: () => import('./views/recetas/recetas.component').then(m => m.RecetasComponent) },
  { path: 'notificaciones-y-alertas', canActivate: [authGuard], loadComponent: () => import('./views/alertas/alertas.component').then(m => m.AlertasComponent) },
  { path: 'nueva-consulta', canActivate: [authGuard], loadComponent: () => import('./views/consulta/consulta.component').then(m => m.ConsultaComponent) },
  { path: '**', redirectTo: 'dashboard-de-citas' },
];
