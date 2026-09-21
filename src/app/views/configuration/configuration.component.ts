import { Component, signal } from '@angular/core';
import { ExamsManagementComponent } from './tabs/exams-management.component';
import { MedicationsManagementComponent } from './tabs/medications-management.component';
import { DiagnosesManagementComponent } from './tabs/diagnoses-management.component';
import { TriageManagementComponent } from './tabs/triage-management.component';
import { OrganizationManagementComponent } from './tabs/organization-management.component';
import { AlertsManagementComponent } from './tabs/alerts-management.component';
import { UsersManagementComponent } from './tabs/users-management.component';

type ConfigTab = 'exams' | 'medications' | 'diagnoses' | 'triage' | 'organization' | 'alerts' | 'users';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [
    ExamsManagementComponent,
    MedicationsManagementComponent,
    DiagnosesManagementComponent,
    TriageManagementComponent,
    OrganizationManagementComponent,
    AlertsManagementComponent,
    UsersManagementComponent,
  ],
  template: `
    <div class="flex flex-col w-full">
      <div class="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col gap-4 pb-4 mb-6 border-b border-[#eceef0]">
          <div class="flex items-center gap-3">
            <h1 class="text-[20px] sm:text-[22px] font-bold text-[#191c1e] tracking-tight">Mantenimiento de Catálogos</h1>
          </div>
          <p class="text-[13px] text-[#45464d]">Administre los catálogos clínicos y la configuración base del sistema. Los cambios se reflejan de inmediato en la aplicación y se persisten en el navegador.</p>
        </div>

        <div class="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6">
          @for (tab of tabs; track tab.id) {
            <button
              type="button"
              class="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors"
              [class]="activeTab() === tab.id
                ? 'bg-[#006a61] text-white shadow-sm'
                : 'bg-white text-[#45464d] border border-[#e6e8ea] hover:bg-[#f2f4f6]'"
              (click)="activeTab.set(tab.id)"
            >
              <span class="material-symbols-outlined text-[18px]">{{ tab.icon }}</span>
              {{ tab.label }}
            </button>
          }
        </div>

        @switch (activeTab()) {
          @case ('exams') {
            <app-exams-management />
          }
          @case ('medications') {
            <app-medications-management />
          }
          @case ('diagnoses') {
            <app-diagnoses-management />
          }
          @case ('triage') {
            <app-triage-management />
          }
          @case ('organization') {
            <app-organization-management />
          }
          @case ('alerts') {
            <app-alerts-management />
          }
          @case ('users') {
            <app-users-management />
          }
        }
      </div>
    </div>
  `,
})
export class ConfigurationComponent {
  readonly activeTab = signal<ConfigTab>('exams');

  readonly tabs: { id: ConfigTab; label: string; icon: string }[] = [
    { id: 'exams', label: 'Exámenes', icon: 'science' },
    { id: 'medications', label: 'Medicamentos', icon: 'medication' },
    { id: 'diagnoses', label: 'Diagnósticos CIE-10', icon: 'event_note' },
    { id: 'triage', label: 'Triajes', icon: 'monitor_heart' },
    { id: 'organization', label: 'Organización', icon: 'apartment' },
    { id: 'alerts', label: 'Alertas', icon: 'notifications_active' },
    { id: 'users', label: 'Usuarios', icon: 'manage_accounts' },
  ];
}