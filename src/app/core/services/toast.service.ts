import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  title: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toast = signal<ToastMessage | null>(null);

  show(title: string, message?: string): void {
    this.toast.set({ title, message });
  }

  hide(): void {
    this.toast.set(null);
  }
}
