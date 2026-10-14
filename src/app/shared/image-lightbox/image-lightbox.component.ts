import { Component, input, output, signal, OnChanges, SimpleChanges } from '@angular/core';

export interface LightboxImage {
  dataUrl: string;
  caption?: string;
}

/** Visor a pantalla completa para las fotos de una consulta. */
@Component({
  selector: 'app-image-lightbox',
  standalone: true,
  template: `
    @if (isOpen() && images().length > 0) {
      <div
        class="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
        (click)="dismiss.emit()"
      >
        <button
          type="button"
          class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          (click)="dismiss.emit()"
          title="Cerrar"
        >
          <span class="material-symbols-outlined">close</span>
        </button>

        @if (images().length > 1) {
          <button
            type="button"
            class="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            (click)="prev(); $event.stopPropagation()"
            title="Anterior"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            type="button"
            class="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            (click)="next(); $event.stopPropagation()"
            title="Siguiente"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        }

        <figure class="flex flex-col items-center gap-3 max-w-[90vw]" (click)="$event.stopPropagation()">
          <img
            [src]="images()[currentIndex()].dataUrl"
            [alt]="images()[currentIndex()].caption || 'Foto de la consulta'"
            class="max-w-full max-h-[82vh] rounded-lg shadow-2xl object-contain bg-black/40"
          />
          @if (images()[currentIndex()].caption) {
            <figcaption class="text-white/90 text-[13px] text-center max-w-2xl">
              {{ images()[currentIndex()].caption }}
            </figcaption>
          }
          @if (images().length > 1) {
            <span class="text-white/60 text-[12px]">{{ currentIndex() + 1 }} / {{ images().length }}</span>
          }
        </figure>
      </div>
    }
  `,
})
export class ImageLightboxComponent implements OnChanges {
  isOpen = input(false);
  images = input<LightboxImage[]>([]);
  startIndex = input(0);

  dismiss = output<void>();

  currentIndex = signal(0);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen()) {
      this.currentIndex.set(this.clamp(this.startIndex()));
    }
  }

  prev(): void {
    this.currentIndex.set(this.clamp(this.currentIndex() - 1));
  }

  next(): void {
    this.currentIndex.set(this.clamp(this.currentIndex() + 1));
  }

  private clamp(index: number): number {
    const total = this.images().length;
    if (total === 0) return 0;
    return (index + total) % total;
  }
}
