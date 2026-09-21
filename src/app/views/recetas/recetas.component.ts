import { Component, computed, inject, signal } from '@angular/core';
import { NavigationService } from '../../core/services/navigation.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { Prescription, PrescriptionMedication, ExamOrder } from '../../core/models/types';
import { ButtonComponent } from '../../shared/button/button.component';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ToastComponent } from '../../shared/toast/toast.component';

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [ButtonComponent, BadgeComponent, ModalComponent, ToastComponent],
  template: `
    <div class="flex flex-col w-full">
      <div class="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#eceef0]">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-[20px] sm:text-[22px] font-bold text-[#191c1e] tracking-tight">Recetas & Exámenes Electrónicos</h1>
              <app-badge variant="teal" size="sm">Firma Avanzada MINSAL</app-badge>
            </div>
            <p class="text-[13px] text-[#45464d] mt-1">Registro centralizado de recetas médicas electrónicas y órdenes de exámenes complementarios</p>
          </div>
          <app-button variant="primary" size="md" icon="add" (click)="openEmitModal()">Emitir Nueva Receta</app-button>
        </div>

        <div class="flex items-center gap-3 mb-4">
          <span class="w-8 h-8 rounded-lg bg-[#acedff]/30 text-[#1e3a5f] flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[20px]">biotech</span>
          </span>
          <div>
            <h2 class="text-[16px] font-bold text-[#191c1e]">Órdenes de Exámenes</h2>
            <p class="text-[12px] text-[#45464d]">Órdenes emitidas desde el módulo de atención del paciente</p>
          </div>
        </div>

        @if (examOrders().length === 0) {
          <div class="p-8 text-center flex flex-col items-center bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
            <span class="material-symbols-outlined text-[32px] text-[#76777d] mb-2">science</span>
            <p class="text-[13px] text-[#45464d]">Aún no hay órdenes de exámenes registradas.</p>
            <p class="text-[12px] text-[#76777d] mt-1">Las órdenes se generan al guardar una consulta en "Nueva Consulta".</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 gap-4 mb-8">
            @for (order of examOrders(); track order.id) {
              <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-start gap-3.5">
                  <div class="w-10 h-10 rounded-xl bg-[#acedff]/30 text-[#004e5c] flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-[22px]">biotech</span>
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-[15px] font-bold text-[#191c1e]">{{ order.patientName }}</span>
                      <app-badge [variant]="order.priority === 'urgencia' ? 'error' : 'info'" size="sm">{{ order.priority === 'urgencia' ? 'Urgencia' : 'Rutina' }}</app-badge>
                      <app-badge variant="outline" size="sm">{{ order.status === 'pending' ? 'Pendiente' : order.status === 'in-progress' ? 'En Proceso' : 'Finalizada' }}</app-badge>
                    </div>
                    <p class="text-[12px] text-[#45464d] mt-0.5">Orden #{{ order.id }} · Emitida: {{ order.date }} {{ order.time }} por {{ order.doctorName }}</p>
                    <div class="flex items-center gap-2 mt-2 flex-wrap">
                      @for (item of order.items; track item.examId) {
                        <span class="px-2 py-0.5 rounded bg-[#f2f4f6] text-[11px] font-semibold text-[#191c1e] border border-[#e0e3e5]">{{ item.name }}</span>
                      }
                    </div>
                    @if (order.notes) {
                      <p class="text-[12px] text-[#76777d] mt-2 italic">"{{ order.notes }}"</p>
                    }
                  </div>
                </div>
                <div class="flex items-center gap-2 self-end md:self-center">
                  <app-button variant="light" size="sm" icon="picture_as_pdf" (click)="handleDownloadExamOrder(order.id)">Ver PDF</app-button>
                  <app-button variant="outline" size="sm" icon="print" (click)="handlePrintExamOrder(order.id)">Imprimir</app-button>
                </div>
              </div>
            }
          </div>
        }

        <div class="flex items-center gap-3 mb-4 mt-8">
          <span class="w-8 h-8 rounded-lg bg-[#006a61]/10 text-[#006a61] flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[20px]">prescriptions</span>
          </span>
          <div>
            <h2 class="text-[16px] font-bold text-[#191c1e]">Recetas Médicas</h2>
            <p class="text-[12px] text-[#45464d]">Recetas electrónicas emitidas</p>
          </div>
        </div>

        @if (prescriptions().length === 0) {
          <div class="p-8 text-center flex flex-col items-center bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
            <span class="material-symbols-outlined text-[32px] text-[#76777d] mb-2">prescriptions</span>
            <p class="text-[13px] text-[#45464d]">Aún no hay recetas médicas registradas.</p>
            <p class="text-[12px] text-[#76777d] mt-1">Use "Emitir Nueva Receta" para prescribir medicamentos a un paciente.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 gap-4">
            @for (rx of prescriptions(); track rx.id) {
              <div class="bg-white rounded-xl p-5 shadow-sm border border-[#e6e8ea] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-start gap-3.5">
                  <div class="w-10 h-10 rounded-xl bg-[#006a61]/10 text-[#006a61] flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-[22px]">prescriptions</span>
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-[15px] font-bold text-[#191c1e]">{{ rx.patientName }}</span>
                      <span class="text-[12px] text-[#76777d]">CI: {{ rx.ci }}</span>
                      <app-badge [variant]="rx.status === 'Finalizada' ? 'neutral' : 'teal'" size="sm">{{ rx.status }}</app-badge>
                    </div>
                    <p class="text-[12px] text-[#45464d] mt-0.5">Receta #{{ rx.id }} · Emitida: {{ rx.date }} {{ rx.time }} por {{ rx.doctorName }}</p>
                    <div class="flex items-center gap-2 mt-2 flex-wrap">
                      @for (med of rx.meds; track med.id) {
                        <span class="px-2 py-0.5 rounded bg-[#f2f4f6] text-[11px] font-semibold text-[#191c1e] border border-[#e0e3e5]" title="{{ med.dose }} · {{ med.frequency }} · {{ med.duration }}">{{ med.name }}</span>
                      }
                    </div>
                    @if (rx.notes) {
                      <p class="text-[12px] text-[#76777d] mt-2 italic">"{{ rx.notes }}"</p>
                    }
                  </div>
                </div>
                <div class="flex items-center gap-2 self-end md:self-center">
                  <app-button variant="light" size="sm" icon="picture_as_pdf" (click)="handleDownloadPrescription(rx.id)">Ver PDF</app-button>
                  <app-button variant="outline" size="sm" icon="print" (click)="handlePrintPrescription(rx.id)">Imprimir</app-button>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <app-modal
        [isOpen]="showEmitModal()"
        title="Emitir Nueva Receta"
        subtitle="Registre los medicamentos a prescribir, luego podrá generar el PDF o imprimir"
        icon="prescriptions"
        [footerTemplate]="true"
        (dismiss)="closeEmitModal()"
      >
        <div class="flex flex-col gap-4">
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Paciente *</span>
            <select
              class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
              [value]="emitPatientId()"
              (change)="emitPatientId.set(($any($event.target)).value)"
            >
              @for (p of data.patients(); track p.id) {
                <option [value]="p.id">{{ p.name }} · CI: {{ p.ci }}</option>
              }
            </select>
          </label>

          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-[#191c1e] uppercase tracking-wider">Medicamentos</span>
            <app-button variant="outline" size="sm" icon="add" (click)="addEmitMedication()">Agregar Medicamento</app-button>
          </div>

          <div class="flex flex-col gap-3">
            @for (med of emitMeds(); track med.id; let mIndex = $index) {
              <div class="p-3 rounded-xl border border-[#e0e3e5] bg-white flex flex-col gap-2.5">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-lg bg-[#006a61]/10 text-[#006a61] flex items-center justify-center text-[11px] font-bold shrink-0">{{ mIndex + 1 }}</span>
                  <input
                    type="text"
                    list="recetas-medication-suggestions"
                    placeholder="Nombre del medicamento *"
                    class="flex-1 px-3 py-2 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61]"
                    [value]="med.name"
                    (input)="updateEmitMedicationField(mIndex, 'name', $event)"
                  />
                  <button
                    type="button"
                    class="shrink-0 w-7 h-7 rounded-lg bg-[#ffdad6]/60 text-[#ba1a1a] flex items-center justify-center hover:bg-[#ffdad6] transition-colors"
                    [disabled]="emitMeds().length === 1"
                    [class]="emitMeds().length === 1 ? 'opacity-40 pointer-events-none' : ''"
                    (click)="removeEmitMedication(mIndex)"
                    title="Quitar medicamento"
                  >
                    <span class="material-symbols-outlined text-[15px]">close</span>
                  </button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input type="text" placeholder="Dosis / Presentación" class="px-2.5 py-1.5 rounded-lg border border-[#d7d9dc] bg-white text-[12px] text-[#191c1e] focus:outline-none focus:ring-1 focus:ring-[#006a61]" [value]="med.dose" (input)="updateEmitMedicationField(mIndex, 'dose', $event)" />
                  <input type="text" placeholder="Frecuencia (ej: cada 12 h)" class="px-2.5 py-1.5 rounded-lg border border-[#d7d9dc] bg-white text-[12px] text-[#191c1e] focus:outline-none focus:ring-1 focus:ring-[#006a61]" [value]="med.frequency" (input)="updateEmitMedicationField(mIndex, 'frequency', $event)" />
                  <input type="text" placeholder="Duración (ej: 30 días)" class="px-2.5 py-1.5 rounded-lg border border-[#d7d9dc] bg-white text-[12px] text-[#191c1e] focus:outline-none focus:ring-1 focus:ring-[#006a61]" [value]="med.duration" (input)="updateEmitMedicationField(mIndex, 'duration', $event)" />
                </div>
              </div>
            }
          </div>

          <datalist id="recetas-medication-suggestions">
            @for (med of medicationCatalog(); track med) {
              <option [value]="med"></option>
            }
          </datalist>

          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-[#191c1e]">Indicaciones Generales</span>
            <textarea rows="2" placeholder="Ej: Tomar con alimentos, evitar alcohol..." class="px-3.5 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] resize-none" [value]="emitNotes()" (input)="emitNotes.set(($any($event.target)).value)"></textarea>
          </label>
        </div>
        <div modal-footer>
          <app-button variant="light" size="md" (click)="closeEmitModal()">Cancelar</app-button>
          <app-button variant="primary" size="md" icon="check" (click)="saveEmittedRecipe()">Guardar Receta</app-button>
        </div>
      </app-modal>
      <app-toast />
    </div>
  `,
})
export class RecetasComponent {
  nav = inject(NavigationService);
  toast = inject(ToastService);
  data = inject(MockDataService);

  examOrders = computed(() => this.data.getExamOrders());
  prescriptions = computed(() => this.data.getPrescriptions());
  medicationCatalog = computed(() => this.data.medicationCatalog());

  readonly showEmitModal = signal(false);
  readonly emitPatientId = signal<string>('');
  readonly emitNotes = signal('');
  readonly emitMeds = signal<PrescriptionMedication[]>([
    { id: 'med-init', name: '', dose: '', frequency: '', duration: '' },
  ]);

  openEmitModal(): void {
    const first = this.data.patients()[0];
    this.emitPatientId.set(first?.id ?? '');
    this.emitMeds.set([{ id: 'med-init', name: '', dose: '', frequency: '', duration: '' }]);
    this.emitNotes.set('');
    this.showEmitModal.set(true);
  }

  closeEmitModal(): void {
    this.showEmitModal.set(false);
  }

  addEmitMedication(): void {
    this.emitMeds.update((meds) => [
      ...meds,
      { id: 'med-' + Date.now() + '-' + meds.length, name: '', dose: '', frequency: '', duration: '' },
    ]);
  }

  removeEmitMedication(index: number): void {
    if (this.emitMeds().length <= 1) return;
    this.emitMeds.update((meds) => meds.filter((_, i) => i !== index));
  }

  updateEmitMedicationField(index: number, field: 'name' | 'dose' | 'frequency' | 'duration', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.emitMeds.update((meds) => meds.map((med, i) => (i === index ? { ...med, [field]: value } : med)));
  }

  saveEmittedRecipe(): void {
    const patient = this.data.getPatient(this.emitPatientId());
    if (!patient) {
      this.toast.show('Faltan Datos', 'Seleccione un paciente para emitir la receta.');
      return;
    }
    const meds = this.emitMeds().filter((m) => m.name.trim() !== '');
    if (meds.length === 0) {
      this.toast.show('Faltan Datos', 'Agregue al menos un medicamento con su nombre para emitir la receta.');
      return;
    }
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const prescription: Prescription = {
      id: 'RX-' + Date.now(),
      patientId: patient.id,
      patientName: patient.name,
      ci: patient.ci,
      doctorName: this.data.doctor.name,
      date: `${day}/${month}/${year}`,
      time: now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      meds: meds.map((m) => ({ ...m })),
      notes: this.emitNotes(),
      status: 'Emitida Hoy',
    };
    this.data.addPrescription(prescription);
    this.closeEmitModal();
    this.toast.show('Receta Emitida', `Receta ${prescription.id} registrada para ${prescription.patientName}.`);
  }

  handleDownloadPrescription(id: string): void {
    const rx = this.getPrescription(id);
    if (rx) {
      this.openDocument('Receta ' + rx.id, this.prescriptionDoc(rx), false);
      this.toast.show('Vista Preliminar', `Generando vista previa de la receta ${rx.id} en una nueva ventana.`);
    }
  }

  handlePrintPrescription(id: string): void {
    const rx = this.getPrescription(id);
    if (rx) {
      this.openDocument('Receta ' + rx.id, this.prescriptionDoc(rx), true);
      this.toast.show('Imprimiendo', `Enviando receta ${rx.id} a impresión.`);
    }
  }

  handleDownloadExamOrder(id: string): void {
    const order = this.getExamOrder(id);
    if (order) {
      this.openDocument('Orden ' + order.id, this.examOrderDoc(order), false);
      this.toast.show('Vista Preliminar', `Generando vista previa de la orden ${order.id} en una nueva ventana.`);
    }
  }

  handlePrintExamOrder(id: string): void {
    const order = this.getExamOrder(id);
    if (order) {
      this.openDocument('Orden ' + order.id, this.examOrderDoc(order), true);
      this.toast.show('Imprimiendo', `Enviando orden ${order.id} a impresión.`);
    }
  }

  private getPrescription(id: string): Prescription | undefined {
    return this.data.getPrescriptions().find((rx) => rx.id === id);
  }

  private getExamOrder(id: string): ExamOrder | undefined {
    return this.data.getExamOrders().find((o) => o.id === id);
  }

  private esc(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private brandHeader(subtitle: string): string {
    const org = this.data.organization();
    const initials = (org.name || 'MC')
      .split(/\s+/)
      .filter((w) => w.length > 0)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
    const meta = [subtitle, org.rut, org.phone].filter((v) => v && v.trim()).join(' · ');
    return `
      <div class="brand">
        <div class="logo">${this.esc(initials)}</div>
        <div><h1>${this.esc(org.name)}</h1><p>${this.esc(meta)}</p></div>
      </div>`;
  }

  private orgFooter(): string {
    const ft = this.data.organization().footerText?.trim();
    return ft ? `<p class="orgfoot">${this.esc(ft)}</p>` : '';
  }

  private docShell(title: string, body: string): string {
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${this.esc(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #191c1e; margin: 0; padding: 32px; font-size: 13px; }
  .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #006a61; padding-bottom: 14px; margin-bottom: 20px; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand .logo { width: 42px; height: 42px; border-radius: 10px; background: #006a61; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; }
  .brand h1 { font-size: 16px; margin: 0; }
  .brand p { margin: 0; font-size: 11px; color: #45464d; }
  .type .badge { display: inline-block; background: #86f2e4; color: #006f66; font-weight: 800; font-size: 11px; padding: 5px 12px; border-radius: 999px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin: 16px 0; }
  .field .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #76777d; font-weight: 700; }
  .field .val { font-size: 13px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin: 14px 0; }
  th, td { border: 1px solid #d7d9dc; padding: 8px 10px; text-align: left; font-size: 12px; }
  th { background: #f2f4f6; text-transform: uppercase; font-size: 10px; color: #45464d; letter-spacing: .04em; }
  .notes { background: #f8fafc; border: 1px solid #e0e3e5; border-radius: 8px; padding: 10px 12px; margin-top: 14px; font-size: 12px; }
  .foot { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
  .sign { text-align: center; width: 280px; }
  .sign .line { border-top: 1px solid #191c1e; padding-top: 6px; font-size: 12px; font-weight: 700; }
  .sign .sub { font-size: 10px; color: #76777d; }
  .hint { text-align: center; font-size: 11px; color: #76777d; margin-top: 26px; }
  .orgfoot { text-align: center; font-size: 10px; color: #76777d; margin-top: 6px; }
  @media print { .hint, .orgfoot { display: none; } body { padding: 0; } }
</style>
</head>
<body>${body}\n${this.orgFooter()}
<p class="hint">Previsualización de documento &mdash; use Ctrl+P / la opción de imprimir del navegador para generar el PDF o papel.</p>
</body>
</html>`;
  }

  private prescriptionDoc(rx: Prescription): string {
    const medRows = rx.meds.map((m) => `
      <tr>
        <td><b>${this.esc(m.name)}</b></td>
        <td>${this.esc(m.dose)}</td>
        <td>${this.esc(m.frequency)}</td>
        <td>${this.esc(m.duration)}</td>
      </tr>`).join('');
    return this.docShell('Receta ' + rx.id, `
    <div class="head">
      ${this.brandHeader('Receta Electrónica · Firma Avanzada MINSAL')}
      <div class="type"><span class="badge">RECETA MÉDICA ELECTRÓNICA</span></div>
    </div>
    <div class="grid">
      <div class="field"><div class="lbl">Receta N°</div><div class="val">${this.esc(rx.id)}</div></div>
      <div class="field"><div class="lbl">Emitida</div><div class="val">${this.esc(rx.date)} · ${this.esc(rx.time)}</div></div>
      <div class="field"><div class="lbl">Paciente</div><div class="val">${this.esc(rx.patientName)}</div></div>
      <div class="field"><div class="lbl">Documento</div><div class="val">${this.esc(rx.ci)}</div></div>
      <div class="field"><div class="lbl">Médico Prescriptor</div><div class="val">${this.esc(rx.doctorName)}</div></div>
      <div class="field"><div class="lbl">Estado</div><div class="val">${this.esc(rx.status)}</div></div>
    </div>
    <table>
      <thead><tr><th>Medicamento</th><th>Dosis / Presentación</th><th>Frecuencia</th><th>Duración</th></tr></thead>
      <tbody>${medRows}</tbody>
    </table>
    ${rx.notes ? `<div class="notes"><b>Indicaciones:</b>&nbsp; ${this.esc(rx.notes)}</div>` : ''}
    <div class="foot">
      <div class="sign">
        <div class="line">${this.esc(rx.doctorName)}</div>
        <div class="sub">Firma y sello del prescriptor · MINSAL</div>
      </div>
      <div class="sign">
        <div class="line">Farmacia Central</div>
        <div class="sub">Despacho autorizado · Fecha de despacho: ____/____/______</div>
      </div>
    </div>`);
  }

  private examOrderDoc(order: ExamOrder): string {
    const rows = order.items.map((i) => `
      <tr>
        <td><b>${this.esc(i.name)}</b></td>
        <td>${this.esc(i.category.toUpperCase())}</td>
        <td>${i.fasting ? 'SÍ' : 'No'}</td>
        <td>${this.esc(i.preparation || '—')}</td>
      </tr>`).join('');
    return this.docShell('Orden ' + order.id, `
    <div class="head">
      ${this.brandHeader('Órdenes de Exámenes Complementarios')}
      <div class="type"><span class="badge">ORDEN DE EXÁMENES</span></div>
    </div>
    <div class="grid">
      <div class="field"><div class="lbl">Orden N°</div><div class="val">${this.esc(order.id)}</div></div>
      <div class="field"><div class="lbl">Emitida</div><div class="val">${this.esc(order.date)} · ${this.esc(order.time)}</div></div>
      <div class="field"><div class="lbl">Paciente</div><div class="val">${this.esc(order.patientName)}</div></div>
      <div class="field"><div class="lbl">Médico Solicitante</div><div class="val">${this.esc(order.doctorName)}</div></div>
      <div class="field"><div class="lbl">Prioridad</div><div class="val">${order.priority === 'urgencia' ? 'URGENCIA' : 'RUTINA'}</div></div>
      <div class="field"><div class="lbl">Estado</div><div class="val">${order.status === 'pending' ? 'Pendiente' : order.status === 'in-progress' ? 'En Proceso' : 'Finalizada'}</div></div>
    </div>
    <table>
      <thead><tr><th>Examen</th><th>Categoría</th><th>Ayunas</th><th>Preparación / Indicaciones</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${order.notes ? `<div class="notes"><b>Notas de la orden:</b>&nbsp; ${this.esc(order.notes)}</div>` : ''}
    <div class="foot">
      <div class="sign">
        <div class="line">${this.esc(order.doctorName)}</div>
        <div class="sub">Firma y sello del médico solicitante</div>
      </div>
      <div class="sign">
        <div class="line">Depto. de Imagenología / Laboratorio</div>
        <div class="sub">Fecha de realización: ____/____/______</div>
      </div>
    </div>`);
  }

  private openDocument(title: string, html: string, autoPrint: boolean): void {
    const win = window.open('', '_blank', 'width=900,height=720,left=100,top=100');
    if (!win) {
      this.toast.show('Ventana Bloqueada', 'Permita las ventanas emergentes para visualizar o imprimir el documento.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    if (autoPrint) {
      setTimeout(() => {
        win.focus();
        win.print();
      }, 400);
    }
  }
}