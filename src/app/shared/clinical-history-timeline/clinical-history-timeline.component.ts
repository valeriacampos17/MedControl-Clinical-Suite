import { Component, Input, computed, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { Consultation } from '../../core/models/types';
import { BadgeComponent } from '../badge/badge.component';

@Component({
  selector: 'app-clinical-history-timeline',
  standalone: true,
  imports: [FormsModule, BadgeComponent],
  template: `
    <div class="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-[#e6e8ea]">
      @if (showTitle) {
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#eceef0]">
          <div class="flex items-center gap-2">
            <span class="w-9 h-9 rounded-lg bg-[#006a61]/10 text-[#006a61] flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[22px]">medical_information</span>
            </span>
            <div>
              <h2 class="text-[17px] font-bold text-[#191c1e]">Historial Clínico & Triaje</h2>
              <p class="text-[12px] text-[#45464d]">{{ patientConsultations().length }} atenciones médica(s) registrada(s)</p>
            </div>
          </div>

          <div class="flex items-center p-1 bg-[#f2f4f6] rounded-xl border border-[#e0e3e5] shrink-0">
            <button
              type="button"
              (click)="activeTab.set('consultas')"
              class="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5"
              [class]="activeTab() === 'consultas' ? 'bg-white text-[#006a61] shadow-xs' : 'text-[#45464d] hover:text-[#191c1e]'"
            >
              <span class="material-symbols-outlined text-[16px]">history_edu</span>
              <span>Consultas ({{ patientConsultations().length }})</span>
            </button>
            <button
              type="button"
              (click)="activeTab.set('triaje')"
              class="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5"
              [class]="activeTab() === 'triaje' ? 'bg-white text-[#006a61] shadow-xs' : 'text-[#45464d] hover:text-[#191c1e]'"
            >
              <span class="material-symbols-outlined text-[16px]">monitor_heart</span>
              <span>Evolución Triaje</span>
            </button>
          </div>
        </div>
      }

      @if (activeTab() === 'consultas') {
        @if (filteredConsultations().length > 0) {
          <div class="flex flex-col gap-3 mb-5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                <span class="text-[11px] font-bold text-[#76777d] uppercase tracking-wider shrink-0 mr-1">Ver atención del:</span>
                @for (c of patientConsultations(); track c.id; let idx = $index) {
                  @let isSel = isConsultationExpanded(c.id, idx === 0);
                  <button
                    type="button"
                    (click)="scrollToConsultation(c.id)"
                    class="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all shrink-0 flex items-center gap-1"
                    [class]="isSel
                      ? 'bg-[#006a61] text-white border-[#006a61] shadow-xs'
                      : 'bg-[#f8fafc] border-[#d7d9dc] text-[#45464d] hover:border-[#006a61] hover:text-[#006a61]'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" [class]="isSel ? 'bg-white' : 'bg-[#76777d]'"></span>
                    <span>{{ c.date }}</span>
                    @if (idx === 0) {
                      <span class="text-[9px] font-bold" [class]="isSel ? 'text-white' : 'text-[#006a61]'">(Última)</span>
                    }
                  </button>
                }
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="toggleAccordionMode()"
                  class="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1"
                  [class]="accordionMode()
                    ? 'bg-[#006a61]/10 border-[#006a61]/30 text-[#006a61]'
                    : 'bg-[#f2f4f6] border-[#e0e3e5] text-[#45464d] hover:bg-[#e6e8ea]'"
                  [title]="accordionMode() ? 'Modo Acordeón activo: muestra una sola atención desplegada a la vez' : 'Modo Expandido activo: permite ver múltiples atenciones desplegadas'"
                >
                  <span class="material-symbols-outlined text-[15px]">
                    {{ accordionMode() ? 'view_agenda' : 'view_day' }}
                  </span>
                  <span>{{ accordionMode() ? 'Acordeón (Una a la vez)' : 'Ver todas desplegadas' }}</span>
                </button>
              </div>
            </div>

            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-[16px] pointer-events-none">filter_alt</span>
              <input
                type="text"
                placeholder="Filtrar por diagnóstico, medicamento o síntoma..."
                class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#e0e3e5] bg-[#f8fafc] text-[12px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#006a61]"
                [value]="historySearchTerm()"
                (input)="historySearchTerm.set(($any($event.target)).value)"
              />
            </div>
          </div>

          <div class="flex flex-col gap-4 relative">
            <div class="hidden sm:block absolute left-4 top-4 bottom-4 w-0.5 bg-[#e2e8f0]"></div>

            @for (c of filteredConsultations(); track c.id; let idx = $index; let count = $count) {
              @let isExpanded = isConsultationExpanded(c.id, idx === 0);
              @let isFirst = idx === 0;

              <div [id]="'consultation-' + c.id" class="relative sm:pl-10">
                <div class="hidden sm:flex absolute left-2 top-4 -translate-x-1/2 w-5 h-5 rounded-full items-center justify-center z-10 border-2"
                     [class]="isExpanded ? 'bg-[#006a61] border-white text-white shadow-xs' : 'bg-white border-[#cbd5e1] text-[#64748b]'">
                  <span class="text-[10px] font-bold">{{ count - idx }}</span>
                </div>

                @if (!isExpanded) {
                  <div
                    (click)="toggleConsultation(c.id)"
                    class="cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-white hover:bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#006a61]/50 shadow-2xs hover:shadow-sm transition-all"
                  >
                    <div class="flex items-center gap-2.5 flex-wrap min-w-0">
                      <span class="px-2 py-0.5 rounded bg-[#f2f4f6] text-[11px] font-bold text-[#45464d] group-hover:bg-[#006a61] group-hover:text-white transition-colors">
                        Atención #{{ count - idx }}
                      </span>
                      <span class="text-[14px] font-bold text-[#191c1e]">{{ c.date }} · {{ c.time }}</span>
                      <span class="px-2.5 py-0.5 rounded-full bg-[#86f2e4]/30 text-[#006f66] text-[11px] font-bold">
                        {{ c.type }}
                      </span>
                      @if (c.diagnosisCode) {
                        <app-badge variant="teal" size="sm">CIE-10: {{ c.diagnosisCode }}</app-badge>
                      }
                      @if (c.vitals) {
                        <span class="text-[11.5px] font-bold text-[#191c1e] bg-[#f2f4f6] px-2 py-0.5 rounded border border-[#e0e3e5]">
                          PA {{ c.vitals.systolic }}/{{ c.vitals.diastolic }}
                        </span>
                      }
                      <span class="text-[12px] text-[#64748b] truncate max-w-xs hidden lg:inline">• {{ c.chiefComplaint }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 mt-2 sm:mt-0 text-[#006a61] font-semibold text-[12px] shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <span>Desplegar atención</span>
                      <span class="material-symbols-outlined text-[18px]">expand_more</span>
                    </div>
                  </div>
                } @else {
                  <div class="bg-white rounded-xl p-4 sm:p-5 border-2 border-[#006a61]/50 ring-2 ring-[#006a61]/10 shadow-md transition-all">

                    <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#eceef0] gap-2">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="px-2.5 py-0.5 rounded bg-[#006a61] text-white text-[11px] font-bold shadow-xs">
                          Atención #{{ count - idx }} (Desplegada)
                        </span>
                        <span class="text-[15px] font-bold text-[#191c1e]">{{ c.date }} · {{ c.time }}</span>
                        <span class="px-2.5 py-0.5 rounded-full bg-[#86f2e4]/30 text-[#006f66] text-[11px] font-bold">
                          {{ c.type }}
                        </span>
                        @if (c.diagnosisCode) {
                          <app-badge variant="teal" size="sm">CIE-10: {{ c.diagnosisCode }}</app-badge>
                        }
                      </div>
                      <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <span class="text-[12px] text-[#45464d] font-medium hidden md:inline">
                          Dr(a). <strong class="text-[#191c1e]">{{ c.doctorName }}</strong>
                        </span>
                        <button
                          type="button"
                          (click)="toggleConsultation(c.id)"
                          class="px-2 py-1 rounded-lg bg-[#f2f4f6] text-[#45464d] hover:bg-[#e6e8ea] text-[11px] font-semibold transition-colors flex items-center gap-1"
                          title="Ocultar/colapsar esta atención"
                        >
                          <span>Ocultar</span>
                          <span class="material-symbols-outlined text-[16px]">expand_less</span>
                        </button>
                      </div>
                    </div>

                    <div class="mt-4 flex flex-col gap-4">
                      @if (c.vitals) {
                        <div class="bg-[#f8fafc] rounded-xl p-3.5 border border-[#e2e8f0]">
                          <div class="flex items-center gap-2 mb-2 text-[#006a61] font-bold text-[12px]">
                            <span class="material-symbols-outlined text-[18px]">monitor_heart</span>
                            <span>Signos Vitales & Triaje capturados en esta visita</span>
                            <span class="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold" [class]="getBMIBadge(c.vitals.weight, c.vitals.height).class">
                              {{ getBMIBadge(c.vitals.weight, c.vitals.height).label }}
                            </span>
                          </div>
                          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-[12px]">
                            <div class="bg-white p-2 rounded-lg border border-[#e0e3e5]">
                              <span class="text-[10px] font-bold text-[#76777d] block uppercase">P. Arterial</span>
                              <span class="font-extrabold text-[13px]" [class]="c.vitals.systolic >= 140 ? 'text-[#ba1a1a]' : 'text-[#191c1e]'">
                                {{ c.vitals.systolic }}/{{ c.vitals.diastolic }}
                              </span>
                              <span class="text-[10px] text-[#76777d] ml-0.5">mmHg</span>
                            </div>
                            <div class="bg-white p-2 rounded-lg border border-[#e0e3e5]">
                              <span class="text-[10px] font-bold text-[#76777d] block uppercase">Pulso (FC)</span>
                              <span class="font-extrabold text-[#191c1e] text-[13px]">{{ c.vitals.pulse }}</span>
                              <span class="text-[10px] text-[#76777d] ml-0.5">bpm</span>
                            </div>
                            <div class="bg-white p-2 rounded-lg border border-[#e0e3e5]">
                              <span class="text-[10px] font-bold text-[#76777d] block uppercase">Temperatura</span>
                              <span class="font-extrabold text-[#191c1e] text-[13px]">{{ c.vitals.temperature }}</span>
                              <span class="text-[10px] text-[#76777d] ml-0.5">°C</span>
                            </div>
                            <div class="bg-white p-2 rounded-lg border border-[#e0e3e5]">
                              <span class="text-[10px] font-bold text-[#76777d] block uppercase">SpO2</span>
                              <span class="font-extrabold text-[#006a61] text-[13px]">{{ c.vitals.spo2 }}%</span>
                            </div>
                            <div class="bg-white p-2 rounded-lg border border-[#e0e3e5]">
                              <span class="text-[10px] font-bold text-[#76777d] block uppercase">Peso</span>
                              <span class="font-extrabold text-[#191c1e] text-[13px]">{{ c.vitals.weight }}</span>
                              <span class="text-[10px] text-[#76777d] ml-0.5">kg</span>
                            </div>
                            <div class="bg-white p-2 rounded-lg border border-[#e0e3e5]">
                              <span class="text-[10px] font-bold text-[#76777d] block uppercase">Talla</span>
                              <span class="font-extrabold text-[#191c1e] text-[13px]">{{ c.vitals.height }}</span>
                              <span class="text-[10px] text-[#76777d] ml-0.5">cm</span>
                            </div>
                          </div>
                        </div>
                      }

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-[#f2f4f6]/60 p-3.5 rounded-lg border border-[#e0e3e5]">
                          <span class="text-[11px] font-bold text-[#006a61] uppercase tracking-wider block mb-1">Motivo de Consulta</span>
                          <p class="text-[13px] text-[#191c1e] font-medium leading-relaxed">{{ c.chiefComplaint }}</p>
                        </div>
                        @if (c.historyOfPresentIllness) {
                          <div class="bg-[#f2f4f6]/60 p-3.5 rounded-lg border border-[#e0e3e5]">
                            <span class="text-[11px] font-bold text-[#006a61] uppercase tracking-wider block mb-1">Enfermedad Actual</span>
                            <p class="text-[13px] text-[#191c1e] leading-relaxed">{{ c.historyOfPresentIllness }}</p>
                          </div>
                        }
                      </div>

                      @if (c.physicalExam) {
                        <div>
                          <span class="text-[11px] font-bold text-[#76777d] uppercase tracking-wider block mb-1">Examen Físico</span>
                          <p class="text-[13px] text-[#191c1e] bg-[#f2f4f6] p-3 rounded-lg border border-[#e0e3e5] leading-relaxed">
                            {{ c.physicalExam }}
                          </p>
                        </div>
                      }

                      @if (c.diagnosisDescription) {
                        <div>
                          <span class="text-[11px] font-bold text-[#76777d] uppercase tracking-wider block mb-1">Diagnóstico Clínico</span>
                          <div class="p-3 rounded-lg bg-[#fffbeb] border border-[#fde68a] text-[#92400e] text-[13px] font-semibold flex items-center gap-2">
                            <span class="material-symbols-outlined text-[18px]">medical_services</span>
                            <span>{{ c.diagnosisCode ? '[' + c.diagnosisCode + '] ' : '' }}{{ c.diagnosisDescription }}</span>
                          </div>
                        </div>
                      }

                      @if (c.treatmentPlan) {
                        <div>
                          <span class="text-[11px] font-bold text-[#065f46] uppercase tracking-wider block mb-1">Plan de Tratamiento e Indicaciones</span>
                          <div class="p-3.5 rounded-lg bg-[#ecfdf5] border border-[#86efac]/40 text-[#065f46] text-[13px] whitespace-pre-line leading-relaxed font-mono">
                            {{ c.treatmentPlan }}
                          </div>
                        </div>
                      }

                      @if (c.notes) {
                        <div class="pt-3 border-t border-[#eceef0] text-[12px] text-[#45464d] flex items-start gap-2">
                          <span class="material-symbols-outlined text-[16px] text-[#76777d] shrink-0 mt-0.5">sticky_note_2</span>
                          <span><strong>Observaciones:</strong> {{ c.notes }}</span>
                        </div>
                      }

                      <div class="pt-2 flex items-center justify-end">
                        <button
                          type="button"
                          (click)="toggleConsultation(c.id)"
                          class="px-3 py-1.5 rounded-lg bg-[#f2f4f6] text-[#45464d] hover:bg-[#e6e8ea] text-[12px] font-semibold transition-colors flex items-center gap-1"
                        >
                          <span>Ocultar esta atención</span>
                          <span class="material-symbols-outlined text-[16px]">expand_less</span>
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
              <div class="p-8 text-center flex flex-col items-center bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <span class="material-symbols-outlined text-[36px] text-[#006a61] mb-2">clinical_notes</span>
                <h3 class="text-[15px] font-bold text-[#191c1e]">Sin Consultas Registradas</h3>
                <p class="text-[12.5px] text-[#45464d] mt-1 max-w-md">
                  Este paciente aún no registra consultas médicas en la ficha clínica electrónica.
                </p>
              </div>
            }
          }

          @if (activeTab() === 'triaje') {
            <div class="overflow-x-auto">
              <table class="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr class="bg-[#f2f4f6] text-[#45464d] font-bold border-b border-[#e0e3e5]">
                    <th class="p-3">Atención</th>
                    <th class="p-3">Fecha & Hora</th>
                    <th class="p-3">Presión (mmHg)</th>
                    <th class="p-3">Pulso (bpm)</th>
                    <th class="p-3">Temp (°C)</th>
                    <th class="p-3">SpO2 (%)</th>
                    <th class="p-3">Peso / Talla</th>
                    <th class="p-3">IMC Estado</th>
                    <th class="p-3">Médico</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#eceef0]">
                  @for (c of patientConsultations(); track c.id; let idx = $index; let count = $count) {
                    <tr class="hover:bg-[#f8fafc] transition-colors cursor-pointer" (click)="scrollToConsultation(c.id); activeTab.set('consultas')">
                      <td class="p-3 font-bold text-[#006a61]">#{{ count - idx }}</td>
                      <td class="p-3 font-bold text-[#191c1e] whitespace-nowrap">{{ c.date }} <span class="text-[11px] font-normal text-[#76777d] block">{{ c.time }}</span></td>
                      <td class="p-3 font-extrabold whitespace-nowrap" [class]="c.vitals?.systolic && c.vitals!.systolic >= 140 ? 'text-[#ba1a1a]' : 'text-[#191c1e]'">
                        {{ c.vitals?.systolic }}/{{ c.vitals?.diastolic }}
                      </td>
                      <td class="p-3 font-semibold text-[#191c1e]">{{ c.vitals?.pulse }}</td>
                      <td class="p-3 font-semibold text-[#191c1e]">{{ c.vitals?.temperature }} °C</td>
                      <td class="p-3 font-bold text-[#006a61]">{{ c.vitals?.spo2 }}%</td>
                      <td class="p-3 text-[#45464d] whitespace-nowrap">{{ c.vitals?.weight }} kg / {{ c.vitals?.height }} cm</td>
                      <td class="p-3">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap" [class]="getBMIBadge(c.vitals?.weight || 0, c.vitals?.height || 0).class">
                          {{ getBMIBadge(c.vitals?.weight || 0, c.vitals?.height || 0).label }}
                        </span>
                      </td>
                      <td class="p-3 text-[#45464d] truncate max-w-[120px]">{{ c.doctorName }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="9" class="p-6 text-center text-[#76777d]">No se han registrado controles de triaje para este paciente.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      `,
})
export class ClinicalHistoryTimelineComponent implements OnChanges {
  @Input() patientId: string = '';
  @Input() showTitle: boolean = true;
  @Input() compact: boolean = false;

  private data = inject(MockDataService);

  activeTab = signal<'consultas' | 'triaje'>('consultas');
  expandedConsultationId = signal<string | null>(null);
  accordionMode = signal<boolean>(true);
  historySearchTerm = signal('');
  collapsedConsultations = signal<Set<string>>(new Set());

  readonly patientConsultations = computed(() => {
    if (!this.patientId) return [];
    return this.data.getConsultationsByPatient(this.patientId);
  });

  readonly filteredConsultations = computed(() => {
    const term = this.historySearchTerm().toLowerCase().trim();
    const list = this.patientConsultations();
    if (!term) return list;
    return list.filter((c) =>
      c.chiefComplaint.toLowerCase().includes(term) ||
      c.diagnosisDescription.toLowerCase().includes(term) ||
      c.diagnosisCode.toLowerCase().includes(term) ||
      c.doctorName.toLowerCase().includes(term) ||
      c.treatmentPlan.toLowerCase().includes(term)
    );
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId']) {
      const list = this.patientConsultations();
      if (list.length > 0) {
        this.expandedConsultationId.set(list[0].id);
      } else {
        this.expandedConsultationId.set(null);
      }
    }
  }

  calculateBMI(weight?: number, height?: number): number {
    if (!weight || !height || weight <= 0 || height <= 0) return 0;
    const hM = height / 100;
    return Math.round((weight / (hM * hM)) * 10) / 10;
  }

  getBMIBadge(weight?: number, height?: number): { label: string; class: string } {
    const bmi = this.calculateBMI(weight, height);
    if (bmi === 0) return { label: 'Sin datos', class: 'bg-[#f2f4f6] text-[#76777d]' };
    if (bmi < 18.5) return { label: `IMC ${bmi} · Bajo peso`, class: 'bg-[#acedff] text-[#1e3a5f]' };
    if (bmi < 25) return { label: `IMC ${bmi} · Normal`, class: 'bg-[#ecfdf5] text-[#065f46]' };
    if (bmi < 30) return { label: `IMC ${bmi} · Sobrepeso`, class: 'bg-[#fffbeb] text-[#92400e]' };
    return { label: `IMC ${bmi} · Obesidad`, class: 'bg-[#ffdad6] text-[#ba1a1a]' };
  }

  isConsultationExpanded(id: string, isFirst: boolean): boolean {
    if (this.accordionMode()) {
      const active = this.expandedConsultationId();
      if (active === null) {
        return isFirst;
      }
      return active === id;
    }
    return !this.collapsedConsultations().has(id);
  }

  toggleConsultation(id: string): void {
    if (this.accordionMode()) {
      if (this.expandedConsultationId() === id) {
        this.expandedConsultationId.set(null);
      } else {
        this.expandedConsultationId.set(id);
      }
    } else {
      this.collapsedConsultations.update((set) => {
        const next = new Set(set);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    }
  }

  toggleAccordionMode(): void {
    this.accordionMode.update((v) => !v);
    if (this.accordionMode() && this.patientConsultations().length > 0) {
      this.expandedConsultationId.set(this.patientConsultations()[0].id);
    }
  }

  scrollToConsultation(id: string): void {
    this.expandedConsultationId.set(id);
    this.collapsedConsultations.update((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
    setTimeout(() => {
      const el = document.getElementById('consultation-' + id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }
}
