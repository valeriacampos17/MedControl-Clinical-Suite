import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { Consultation, ExamOrder, ExamTemplate, ExamOrderItem, ExamCategory, Prescription, PrescriptionMedication } from '../../core/models/types';
import { ButtonComponent } from '../../shared/button/button.component';
import { ClinicalHistoryTimelineComponent } from '../../shared/clinical-history-timeline/clinical-history-timeline.component';

@Component({
  selector: 'app-consulta',
  standalone: true,
  imports: [ButtonComponent, ClinicalHistoryTimelineComponent],
  template: `
    <div class="flex flex-col w-full">
      <div class="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
        <div class="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-[#86f2e4] opacity-20 blur-3xl pointer-events-none -z-10"></div>
        <div class="absolute top-80 right-0 w-80 h-80 rounded-full bg-[#acedff] opacity-20 blur-3xl pointer-events-none -z-10"></div>

        <div class="flex items-center justify-between gap-2.5 flex-wrap mb-4 pb-4 border-b border-[#eceef0]">
          <app-button variant="light" size="md" icon="arrow_back" (click)="goBack()">Cancelar</app-button>
          <app-button variant="ghost" size="md" icon="history_edu" (click)="scrollToHistory()">Ver Historial Previo & Triaje</app-button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-[#e6e8ea] p-5 sm:p-6 mb-6">
          <div class="flex items-center gap-4 flex-wrap sm:flex-nowrap">
            <div class="w-14 h-14 rounded-xl bg-[#006a61] text-white flex items-center justify-center text-[18px] font-bold ring-2 ring-[#eceef0] shadow-sm shrink-0">
              {{ data.getInitials(data.activePatient().name) }}
            </div>
            <div class="flex flex-col min-w-0">
              <h1 class="text-[18px] font-bold text-[#191c1e] truncate">{{ data.activePatient().name }}</h1>
              <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-[#45464d]">
                <span>CI: {{ data.activePatient().ci }}</span>
                <span>•</span>
                <span>{{ data.activePatient().age }} años</span>
                <span>•</span>
                <span>{{ data.activePatient().insurance }}</span>
                <span>•</span>
                <span class="font-semibold text-[#191c1e]">{{ data.activePatient().bloodType }}</span>
              </div>
            </div>
            @if (data.activePatient().allergies.length > 0) {
              <div class="sm:ml-auto px-3 py-1.5 rounded-lg bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] text-[11px] font-semibold flex items-center gap-1.5 shrink-0">
                <span class="material-symbols-outlined text-[14px]">warning</span>
                ALERGIAS: {{ data.activePatient().allergies.join(' · ') }}
              </div>
            }
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start mb-8">
          <div class="xl:col-span-7 flex flex-col gap-6">

            <div class="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-lg bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">monitor_heart</span>
                </span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Signos Vitales (Triaje Actual)</h3>
                  <p class="text-[12px] text-[#45464d]">Mediciones tomadas en la consulta/triaje de hoy</p>
                </div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">PA Sistólica</span>
                  <input type="number" placeholder="120" class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="vitals().systolic || ''" (input)="updateVital('systolic', $event)" />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">PA Diastólica</span>
                  <input type="number" placeholder="80" class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="vitals().diastolic || ''" (input)="updateVital('diastolic', $event)" />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Frec. Cardíaca</span>
                  <input type="number" placeholder="72" class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="vitals().pulse || ''" (input)="updateVital('pulse', $event)" />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Temperatura</span>
                  <input type="number" step="0.1" placeholder="36.6" class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="vitals().temperature || ''" (input)="updateVital('temperature', $event)" />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">SpO2</span>
                  <input type="number" placeholder="98" class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="vitals().spo2 || ''" (input)="updateVital('spo2', $event)" />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Peso (kg)</span>
                  <input type="number" step="0.1" placeholder="75" class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="vitals().weight || ''" (input)="updateVital('weight', $event)" />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Talla (cm)</span>
                  <input type="number" placeholder="170" class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="vitals().height || ''" (input)="updateVital('height', $event)" />
                </label>
              </div>
              @if (vitals().weight > 0 && vitals().height > 0) {
                <div class="mt-3 pt-3 border-t border-[#f2f4f6] flex items-center gap-2 text-[12px]">
                  <span class="text-[#76777d]">IMC:</span>
                  <span class="font-bold text-[#191c1e]">{{ bmi() }}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold" [class]="bmiClass()">{{ bmiLabel() }}</span>
                </div>
              }
            </div>

            <div class="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-lg bg-[#86f2e4]/30 text-[#006f66] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">description</span>
                </span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Anamnesis</h3>
                  <p class="text-[12px] text-[#45464d]">Motivo de consulta y enfermedad actual</p>
                </div>
              </div>
              <div class="flex flex-col gap-4">
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Motivo de Consulta *</span>
                  <textarea rows="2" placeholder="Ej: Control de presión arterial, cefalea desde hace 3 días..." class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] resize-none" [value]="chiefComplaint()" (input)="chiefComplaint.set(($any($event.target)).value)"></textarea>
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Enfermedad Actual</span>
                  <textarea rows="4" placeholder="Evolución temporal, síntomas asociados, tratamientos previos..." class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] resize-none" [value]="historyOfPresentIllness()" (input)="historyOfPresentIllness.set(($any($event.target)).value)"></textarea>
                </label>
              </div>
            </div>

            <div class="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] text-[#45464d] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">stethoscope</span>
                </span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Examen Físico</h3>
                  <p class="text-[12px] text-[#45464d]">Hallazgos por aparato/sistema</p>
                </div>
              </div>
              <label class="flex flex-col gap-1.5">
                <textarea rows="4" placeholder="Estado general, cabeza y cuello, tórax, abdomen, extremidades, neurológico..." class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] resize-none" [value]="physicalExam()" (input)="physicalExam.set(($any($event.target)).value)"></textarea>
              </label>
            </div>

            <div class="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-lg bg-[#acedff]/30 text-[#1e3a5f] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">biotech</span>
                </span>
                <div class="flex-1 min-w-0">
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Órdenes de Exámenes</h3>
                  <p class="text-[12px] text-[#45464d]">Exámenes complementarios a solicitar al paciente</p>
                </div>
                @if (selectedExams().length > 0) {
                  <span class="px-2 py-1 rounded-lg bg-[#006a61]/10 text-[#006a61] text-[11px] font-bold shrink-0">{{ selectedExams().length }} seleccionado{{ selectedExams().length > 1 ? 's' : '' }}</span>
                }
              </div>

              <div class="flex flex-col gap-3">
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-[#76777d]">search</span>
                  <input type="text" placeholder="Buscar examen..." class="w-full pl-9 pr-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="examSearch()" (input)="examSearch.set(($any($event.target)).value)" />
                </div>

                <div class="flex items-center gap-1.5 flex-wrap">
                  @for (cat of examCategories; track cat.id) {
                    <button type="button" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1"
                            [class]="examCategory() === cat.id ? 'bg-[#006a61] text-white border-[#006a61] shadow-xs' : 'bg-[#f2f4f6] border-[#e0e3e5] text-[#45464d] hover:bg-[#e6e8ea]'"
                            (click)="setExamCategory(cat.id)">
                      <span class="material-symbols-outlined text-[14px]">{{ cat.icon }}</span>
                      {{ cat.label }}
                    </button>
                  }
                </div>

                <div class="border border-[#eceef0] rounded-xl overflow-hidden">
                  <div class="max-h-52 overflow-y-auto divide-y divide-[#f2f4f6]">
                    @for (exam of filteredExamCatalog(); track exam.id) {
                      <div class="flex items-center justify-between gap-3 px-3 py-2 hover:bg-[#f8fafc]">
                        <div class="flex flex-col min-w-0">
                          <span class="text-[13px] font-semibold text-[#191c1e]">{{ exam.name }}</span>
                          @if (exam.fasting || exam.preparation) {
                            <span class="text-[11px] text-[#76777d]">{{ exam.fasting ? 'Ayunas · ' : '' }}{{ exam.preparation }}</span>
                          }
                        </div>
                        <button type="button" class="shrink-0 w-7 h-7 rounded-lg bg-[#006a61]/10 text-[#006a61] flex items-center justify-center hover:bg-[#006a61] hover:text-white transition-colors"
                                (click)="addExam(exam)"
                                [class]="isExamSelected(exam.id) ? 'opacity-40 pointer-events-none bg-[#f2f4f6] text-[#76777d]' : ''">
                          <span class="material-symbols-outlined text-[16px]">{{ isExamSelected(exam.id) ? 'check' : 'add' }}</span>
                        </button>
                      </div>
                    } @empty {
                      <p class="text-center text-[12px] text-[#76777d] py-6">Sin resultados para "{{ examSearch() }}"</p>
                    }
                  </div>
                </div>

                @if (selectedExams().length > 0) {
                  <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Exámenes seleccionados</span>
                      <button type="button" class="text-[11px] font-semibold text-[#ba1a1a] hover:underline" (click)="clearExams()">Limpiar todo</button>
                    </div>
                    @for (item of selectedExams(); track item.examId) {
                      <div class="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#006a61]/25 bg-[#006a61]/5">
                        <div class="flex flex-col gap-1 min-w-0 flex-1">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-[13px] font-bold text-[#191c1e]">{{ item.name }}</span>
                            <span class="px-1.5 py-0.5 rounded bg-[#acedff]/40 text-[#004e5c] text-[10px] font-semibold uppercase">{{ categoryLabel(item.category) }}</span>
                          </div>
                          <div class="flex items-center gap-2 flex-wrap">
                            <label class="flex items-center gap-1.5 cursor-pointer select-none">
                              <input type="checkbox" class="accent-[#006a61]" [checked]="item.fasting" (change)="toggleFasting(item.examId)" />
                              <span class="text-[11px] text-[#45464d]">Ayunas</span>
                            </label>
                            <input type="text" placeholder="Preparación / indicaciones" class="flex-1 min-w-[140px] px-2 py-1 rounded-lg border border-[#d7d9dc] bg-white text-[12px] text-[#191c1e] focus:outline-none focus:ring-1 focus:ring-[#006a61]" [value]="item.preparation" (input)="updatePreparation(item.examId, $event)" />
                          </div>
                        </div>
                        <button type="button" class="shrink-0 w-7 h-7 rounded-lg bg-[#ffdad6]/60 text-[#ba1a1a] flex items-center justify-center hover:bg-[#ffdad6] transition-colors" (click)="removeExam(item.examId)">
                          <span class="material-symbols-outlined text-[15px]">close</span>
                        </button>
                      </div>
                    }
                    <div class="flex flex-col sm:flex-row gap-2 mt-1">
                      <label class="flex flex-col gap-1 sm:w-1/2">
                        <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Prioridad</span>
                        <select class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="examPriority()" (change)="examPriority.set(($any($event.target)).value)">
                          <option value="rutina">Rutina</option>
                          <option value="urgencia">Urgencia</option>
                        </select>
                      </label>
                      <label class="flex flex-col gap-1 flex-1">
                        <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Notas de la orden</span>
                        <input type="text" placeholder="Ej: Repetir perfil lipídico en 3 meses..." class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="examNotes()" (input)="examNotes.set(($any($event.target)).value)" />
                      </label>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-lg bg-[#ecfdf5] text-[#065f46] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">prescriptions</span>
                </span>
                <div class="flex-1 min-w-0">
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Recetas Médicas</h3>
                  <p class="text-[12px] text-[#45464d]">Medicamentos a prescribir al paciente</p>
                </div>
                @if (recipeMeds().length > 0) {
                  <span class="px-2 py-1 rounded-lg bg-[#065f46]/10 text-[#065f46] text-[11px] font-bold shrink-0">{{ recipeMeds().length }} medicamento{{ recipeMeds().length > 1 ? 's' : '' }}</span>
                }
              </div>

              <div class="flex flex-col gap-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Listado de medicamentos</span>
                  <button type="button" class="text-[11px] font-semibold text-[#065f46] hover:underline flex items-center gap-0.5" (click)="addMedicationRow()">
                    <span class="material-symbols-outlined text-[14px]">add</span> Agregar
                  </button>
                </div>

                @for (med of recipeMeds(); track med.id; let rIndex = $index) {
                  <div class="p-3 rounded-xl border border-[#e0e3e5] bg-white flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                      <span class="w-6 h-6 rounded-lg bg-[#065f46]/10 text-[#065f46] flex items-center justify-center text-[11px] font-bold shrink-0">{{ rIndex + 1 }}</span>
                      <input
                        type="text"
                        list="consulta-medication-suggestions"
                        placeholder="Nombre del medicamento *"
                        class="flex-1 px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#065f46]/30 focus:border-[#065f46]"
                        [value]="med.name"
                        (input)="updateMedicationRow(rIndex, 'name', $event)"
                      />
                      <button
                        type="button"
                        class="shrink-0 w-7 h-7 rounded-lg bg-[#ffdad6]/60 text-[#ba1a1a] flex items-center justify-center hover:bg-[#ffdad6] transition-colors"
                        [disabled]="recipeMeds().length === 1"
                        [class]="recipeMeds().length === 1 ? 'opacity-40 pointer-events-none' : ''"
                        (click)="removeMedicationRow(rIndex)"
                        title="Quitar medicamento"
                      >
                        <span class="material-symbols-outlined text-[15px]">close</span>
                      </button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input type="text" placeholder="Dosis / Presentación" class="px-2.5 py-1.5 rounded-lg border border-[#d7d9dc] bg-white text-[12x] text-[#191c1e] focus:outline-none focus:ring-1 focus:ring-[#065f46]" [value]="med.dose" (input)="updateMedicationRow(rIndex, 'dose', $event)" />
                      <input type="text" placeholder="Frecuencia (ej: cada 12 h)" class="px-2.5 py-1.5 rounded-lg border border-[#d7d9dc] bg-white text-[12px] text-[#191c1e] focus:outline-none focus:ring-1 focus:ring-[#065f46]" [value]="med.frequency" (input)="updateMedicationRow(rIndex, 'frequency', $event)" />
                      <input type="text" placeholder="Duración (ej: 30 días)" class="px-2.5 py-1.5 rounded-lg border border-[#d7d9dc] bg-white text-[12px] text-[#191c1e] focus:outline-none focus:ring-1 focus:ring-[#065f46]" [value]="med.duration" (input)="updateMedicationRow(rIndex, 'duration', $event)" />
                    </div>
                  </div>
                }

                <datalist id="consulta-medication-suggestions">
                  @for (m of medicationCatalog(); track m) {
                    <option [value]="m"></option>
                  }
                </datalist>

                @if (recipeMeds().length > 0) {
                  <div class="flex items-center gap-2 mt-1">
                    <label class="flex flex-col gap-1 flex-1">
                      <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Indicaciones Generales</span>
                      <input type="text" placeholder="Ej: Tomar con alimentos, evitar alcohol..." class="px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#065f46]/30 focus:border-[#065f46]" [value]="recipeNotes()" (input)="recipeNotes.set(($any($event.target)).value)" />
                    </label>
                    <button type="button" class="self-end text-[11px] font-semibold text-[#ba1a1a] hover:underline" (click)="clearRecipeRows()">Limpiar</button>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="xl:col-span-5 flex flex-col gap-6">

            <div class="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-lg bg-[#fffbeb] text-[#92400e] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">medical_services</span>
                </span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Diagnóstico</h3>
                  <p class="text-[12px] text-[#45464d]">Código CIE-10 y descripción</p>
                </div>
              </div>
              <div class="flex flex-col gap-3">
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Código CIE-10</span>
                  <input type="text" placeholder="Ej: I10" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="diagnosisCode()" (input)="diagnosisCode.set(($any($event.target)).value)" />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">Descripción del Diagnóstico</span>
                  <input type="text" placeholder="Ej: Hipertensión arterial esencial" class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]" [value]="diagnosisDescription()" (input)="diagnosisDescription.set(($any($event.target)).value)" />
                </label>
                <div class="flex flex-wrap gap-2">
                  @for (dx of commonDiagnoses; track dx.code) {
                    <button type="button" class="px-2.5 py-1 rounded-lg bg-[#f2f4f6] text-[#45464d] text-[11px] font-semibold border border-[#e0e3e5] hover:bg-[#e6e8ea] hover:text-[#191c1e] transition-colors" (click)="applyDiagnosis(dx)">
                      {{ dx.code }} — {{ dx.label }}
                    </button>
                  }
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-lg bg-[#ecfdf5] text-[#065f46] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">edit_note</span>
                </span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Plan de Tratamiento</h3>
                  <p class="text-[12px] text-[#45464d]">Indicaciones, medicamentos, reposo</p>
                </div>
              </div>
              <label class="flex flex-col gap-1.5">
                <textarea rows="5" placeholder="Medicamentos, dosis, frecuencia, indicaciones generales..." class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] resize-none" [value]="treatmentPlan()" (input)="treatmentPlan.set(($any($event.target)).value)"></textarea>
              </label>
            </div>

            <div class="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#e6e8ea]">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-lg bg-[#f2f4f6] text-[#76777d] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">sticky_note_2</span>
                </span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#191c1e]">Observaciones</h3>
                  <p class="text-[12px] text-[#45464d]">Notas adicionales</p>
                </div>
              </div>
              <label class="flex flex-col gap-1.5">
                <textarea rows="3" placeholder="Seguimiento, interconsultas, exámenes pendientes..." class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] resize-none" [value]="notes()" (input)="notes.set(($any($event.target)).value)"></textarea>
              </label>
            </div>
          </div>
        </div>

        <section id="previous-clinical-history" class="mt-8 pt-6 border-t border-[#eceef0]">
          <div class="mb-4">
            <h2 class="text-[18px] font-bold text-[#191c1e] flex items-center gap-2">
              <span class="material-symbols-outlined text-[#006a61]">history</span>
              <span>Historial de Atenciones Anteriores & Triaje de {{ data.activePatient().name }}</span>
            </h2>
            <p class="text-[13px] text-[#45464d]">Consulta las visitas previas, triajes y diagnósticos registrados antes de guardar la nueva atención.</p>
          </div>
          <app-clinical-history-timeline [patientId]="data.activePatient().id" [showTitle]="false" />
        </section>

        <div class="mt-8 pt-6 border-t border-[#eceef0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p class="text-[12px] text-[#76777d] max-w-md">Revise los datos antes de guardar. Las recetas médicas y órdenes de exámenes se registrarán junto con la consulta.</p>
          <div class="flex items-center gap-2.5">
            <app-button variant="light" size="md" icon="arrow_back" (click)="goBack()">Cancelar</app-button>
            <app-button variant="primary" size="md" icon="save" (click)="saveConsultation()">Guardar Consulta</app-button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ConsultaComponent {
  private router = inject(Router);
  data = inject(MockDataService);
  private toast = inject(ToastService);

  readonly vitals = signal({ systolic: 120, diastolic: 80, pulse: 72, temperature: 36.6, spo2: 98, weight: 70, height: 165 });
  readonly chiefComplaint = signal('');
  readonly historyOfPresentIllness = signal('');
  readonly physicalExam = signal('');
  readonly diagnosisCode = signal('');
  readonly diagnosisDescription = signal('');
  readonly treatmentPlan = signal('');
  readonly notes = signal('');

  readonly examSearch = signal('');
  readonly examCategory = signal<'all' | ExamCategory>('all');
  readonly examPriority = signal<'rutina' | 'urgencia'>('rutina');
  readonly examNotes = signal('');
  readonly selectedExams = signal<ExamOrderItem[]>([]);

  readonly recipeMeds = signal<PrescriptionMedication[]>([
    { id: 'med-init', name: '', dose: '', frequency: '', duration: '' },
  ]);
  readonly recipeNotes = signal('');
  readonly medicationCatalog = computed(() => this.data.medicationCatalog());

  readonly examCategories: { id: 'all' | ExamCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'Todos', icon: 'apps' },
    { id: 'laboratorio', label: 'Laboratorio', icon: 'science' },
    { id: 'imagen', label: 'Imágenes', icon: 'image_search' },
    { id: 'funcional', label: 'Funcionales', icon: 'monitor_heart' },
    { id: 'procedimiento', label: 'Procedimientos', icon: 'surgical' },
  ];

  readonly categoryLabels: Record<ExamCategory, string> = {
    laboratorio: 'Laboratorio',
    imagen: 'Imagen',
    funcional: 'Funcional',
    procedimiento: 'Procedimiento',
  };

  readonly filteredExamCatalog = computed(() => {
    const term = this.examSearch().toLowerCase().trim();
    const cat = this.examCategory();
    return this.data.examCatalog().filter((exam) => {
      const matchesCategory = cat === 'all' || exam.category === cat;
      const matchesTerm = term === '' || exam.name.toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
  });

  constructor() {
    const patientId = this.data.activePatient().id;
    const apt = this.data.appointments().find(a => a.patientId === patientId && a.vitals);
    if (apt?.vitals) {
      const parts = apt.vitals.bp ? apt.vitals.bp.split('/') : ['120', '80'];
      this.vitals.set({
        systolic: Number(parts[0]) || 120,
        diastolic: Number(parts[1]) || 80,
        pulse: apt.vitals.pulse || 72,
        temperature: apt.vitals.temp || 36.6,
        spo2: apt.vitals.spo2 || 98,
        weight: 72,
        height: 165,
      });
    } else {
      const prevConsults = this.data.getConsultationsByPatient(patientId);
      if (prevConsults.length > 0 && prevConsults[0].vitals) {
        this.vitals.set({ ...prevConsults[0].vitals });
      }
    }
  }

  readonly bmi = computed(() => {
    const v = this.vitals();
    if (v.weight <= 0 || v.height <= 0) return 0;
    const m = v.height / 100;
    return Math.round((v.weight / (m * m)) * 10) / 10;
  });

  readonly bmiLabel = computed(() => {
    const b = this.bmi();
    if (b === 0) return '';
    if (b < 18.5) return 'Bajo peso';
    if (b < 25) return 'Normal';
    if (b < 30) return 'Sobrepeso';
    return 'Obesidad';
  });

  readonly bmiClass = computed(() => {
    const b = this.bmi();
    if (b === 0) return '';
    if (b < 18.5) return 'bg-[#acedff] text-[#1e3a5f]';
    if (b < 25) return 'bg-[#ecfdf5] text-[#065f46]';
    if (b < 30) return 'bg-[#fffbeb] text-[#92400e]';
    return 'bg-[#ffdad6] text-[#ba1a1a]';
  });

  readonly commonDiagnoses = [
    { code: 'I10', label: 'Hipertensión esencial' },
    { code: 'E11', label: 'Diabetes mellitus tipo 2' },
    { code: 'E78', label: 'Dislipidemia' },
    { code: 'J06', label: 'Infección aguda vías respiratorias' },
    { code: 'M54', label: 'Dolor de espalda' },
    { code: 'K21', label: 'ERGE' },
    { code: 'F41', label: 'Trastorno de ansiedad' },
    { code: 'N39', label: 'Infección urinaria' },
  ];

  updateVital(field: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.vitals.update((v) => ({ ...v, [field]: value }));
  }

  applyDiagnosis(dx: { code: string; label: string }): void {
    this.diagnosisCode.set(dx.code);
    this.diagnosisDescription.set(dx.label);
  }

  setExamCategory(cat: 'all' | ExamCategory): void {
    this.examCategory.set(cat);
  }

  addExam(exam: ExamTemplate): void {
    if (this.isExamSelected(exam.id)) return;
    this.selectedExams.update((items) => [
      ...items,
      {
        examId: exam.id,
        name: exam.name,
        category: exam.category,
        fasting: exam.fasting ?? false,
        preparation: exam.preparation ?? '',
      },
    ]);
  }

  removeExam(examId: string): void {
    this.selectedExams.update((items) => items.filter((item) => item.examId !== examId));
  }

  clearExams(): void {
    this.selectedExams.set([]);
  }

  isExamSelected(examId: string): boolean {
    return this.selectedExams().some((item) => item.examId === examId);
  }

  toggleFasting(examId: string): void {
    this.selectedExams.update((items) =>
      items.map((item) => item.examId === examId ? { ...item, fasting: !item.fasting } : item)
    );
  }

  updatePreparation(examId: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.selectedExams.update((items) =>
      items.map((item) => item.examId === examId ? { ...item, preparation: value } : item)
    );
  }

  categoryLabel(category: ExamCategory): string {
    return this.categoryLabels[category] ?? category;
  }

  addMedicationRow(): void {
    this.recipeMeds.update((meds) => [
      ...meds,
      { id: 'med-' + Date.now() + '-' + meds.length, name: '', dose: '', frequency: '', duration: '' },
    ]);
  }

  removeMedicationRow(index: number): void {
    if (this.recipeMeds().length <= 1) return;
    this.recipeMeds.update((meds) => meds.filter((_, i) => i !== index));
  }

  updateMedicationRow(index: number, field: 'name' | 'dose' | 'frequency' | 'duration', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.recipeMeds.update((meds) => meds.map((med, i) => (i === index ? { ...med, [field]: value } : med)));
  }

  clearRecipeRows(): void {
    this.recipeMeds.set([{ id: 'med-init', name: '', dose: '', frequency: '', duration: '' }]);
    this.recipeNotes.set('');
  }

  scrollToHistory(): void {
    const el = document.getElementById('previous-clinical-history');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  goBack(): void {
    this.router.navigate(['pacientes-y-historial-clinico']);
  }

  saveConsultation(): void {
    const complaint = this.chiefComplaint().trim();
    if (!complaint) {
      this.toast.show('Faltan Datos', 'Ingrese el motivo de consulta para guardar.');
      return;
    }
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    const formattedTime = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    const consultation: Consultation = {
      id: 'CONS-' + Date.now(),
      patientId: this.data.activePatient().id,
      patientName: this.data.activePatient().name,
      doctorName: this.data.doctor.name,
      date: formattedDate,
      time: formattedTime,
      type: 'Control',
      chiefComplaint: complaint,
      historyOfPresentIllness: this.historyOfPresentIllness(),
      physicalExam: this.physicalExam(),
      vitals: this.vitals(),
      diagnosisCode: this.diagnosisCode() || 'Z00.0',
      diagnosisDescription: this.diagnosisDescription() || 'Examen de control general',
      treatmentPlan: this.treatmentPlan(),
      notes: this.notes(),
      status: 'completed',
    };
    this.data.addConsultation(consultation);

    const selected = this.selectedExams();
    if (selected.length > 0) {
      const examOrder: ExamOrder = {
        id: 'ORD-' + Date.now(),
        consultationId: consultation.id,
        patientId: consultation.patientId,
        patientName: consultation.patientName,
        doctorName: consultation.doctorName,
        date: consultation.date,
        time: consultation.time,
        priority: this.examPriority(),
        notes: this.examNotes(),
        items: selected,
        status: 'pending',
      };
      this.data.addExamOrder(examOrder);
    }

    const meds = this.recipeMeds().filter((m) => m.name.trim() !== '');
    if (meds.length > 0) {
      const prescription: Prescription = {
        id: 'RX-' + Date.now(),
        consultationId: consultation.id,
        patientId: consultation.patientId,
        patientName: consultation.patientName,
        ci: this.data.activePatient().ci,
        doctorName: consultation.doctorName,
        date: consultation.date,
        time: consultation.time,
        meds: meds.map((m) => ({ ...m })),
        notes: this.recipeNotes(),
        status: 'Emitida Hoy',
      };
      this.data.addPrescription(prescription);
    }

    this.data.completeConsultation(this.data.activePatient().id);
    this.toast.show('Consulta Guardada', `Consulta de ${consultation.patientName} registrada exitosamente.`);
    this.goBack();
  }
}
