import { Injectable, signal } from '@angular/core';

/**
 * Como se ve y suena el toast. Antes no existia: todos los mensajes salian
 * verdes con check, incluidos los errores.
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  title: string;
  message?: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toast = signal<ToastMessage | null>(null);

  /**
   * `type` va al final con default a 'success' para que las decenas de
   * llamadas que ya existen y son exitosas no tengan que cambiar. Solo hay
   * que pasarlo donde el mensaje es un error o una advertencia.
   */
  show(title: string, message?: string, type: ToastType = 'success'): void {
    this.toast.set({ title, message, type });
  }

  hide(): void {
    this.toast.set(null);
  }
}