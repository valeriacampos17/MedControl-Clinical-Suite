import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { BreadcrumbSegment } from './layout/breadcrumb/breadcrumb.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./views/login/login.component').then(m => m.LoginComponent) },
  { path: '', redirectTo: 'dashboard-de-citas', pathMatch: 'full' },
  {
    path: 'dashboard-de-citas',
    canActivate: [authGuard],
    data: { breadcrumb: [{ label: 'Dashboard de Citas' }] as BreadcrumbSegment[] },
    loadComponent: () => import('./views/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'pacientes-y-historial-clinico',
    canActivate: [authGuard],
    data: { breadcrumb: [{ label: 'Pacientes' }] as BreadcrumbSegment[] },
    loadComponent: () => import('./views/patient-history/patient-history.component').then(m => m.PatientHistoryComponent),
  },
  {
    path: 'agenda-y-disponibilidad',
    canActivate: [authGuard],
    data: { breadcrumb: [{ label: 'Agenda & Disponibilidad' }] as BreadcrumbSegment[] },
    loadComponent: () => import('./views/appointment-booking/appointment-booking.component').then(m => m.AppointmentBookingComponent),
  },
  {
    path: 'configuracion-del-sistema',
    canActivate: [authGuard],
    data: { breadcrumb: [{ label: 'Configuración del Sistema' }] as BreadcrumbSegment[] },
    loadComponent: () => import('./views/doctor-config/doctor-config.component').then(m => m.DoctorConfigComponent),
  },
  {
    path: 'recetas-y-examenes',
    canActivate: [authGuard],
    data: { breadcrumb: [{ label: 'Recetas & Exámenes' }] as BreadcrumbSegment[] },
    loadComponent: () => import('./views/recetas/recetas.component').then(m => m.RecetasComponent),
  },
  {
    path: 'notificaciones-y-alertas',
    canActivate: [authGuard],
    data: { breadcrumb: [{ label: 'Notificaciones & Alertas' }] as BreadcrumbSegment[] },
    loadComponent: () => import('./views/alertas/alertas.component').then(m => m.AlertasComponent),
  },
  {
    path: 'nueva-consulta',
    canActivate: [authGuard],
    data: { breadcrumb: [{ label: 'Pacientes', route: 'pacientes-y-historial-clinico' }, { label: 'Nueva Consulta' }] as BreadcrumbSegment[] },
    loadComponent: () => import('./views/consulta/consulta.component').then(m => m.ConsultaComponent),
  },
  { path: '**', redirectTo: 'dashboard-de-citas' },
];
