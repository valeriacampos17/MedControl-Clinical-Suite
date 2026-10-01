import { Component, computed, input, output, signal } from '@angular/core';

/** Un elemento que se puede escoger en el selector. */
export interface PickerItem {
  id: string;
  /** Nombre visible. */
  title: string;
  /** Linea secundaria visible. */
  subtitle: string;
  /** Tercera linea opcional, mas chica. */
  detail?: string;
  /**
   * Campos extra por los que se puede buscar y que no se muestran, como el CI
   * de un paciente o la especialidad de un medico. El filtro los mira ademas
   * de title y subtitle.
   */
  search?: Record<string, string>;
}

/**
 * Selector de una sola entidad, con el mismo comportamiento en todas partes:
 * si no hay nada escogido muestra el aviso y el buscador; en cuanto se elige,
 * el buscador desaparece y queda la ficha con un enlace para cambiar.
 *
 * Vive en shared a proposito: paciente y medico lo usan y asi no pueden volver
 * a quedar distintos uno del otro.
 */
@Component({
  selector: 'app-selection-picker',
  standalone: true,
  template: `
    @if (!selected()) {
      <div class="p-4 rounded-xl bg-[#fffdf5] border border-[#fde68a]">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-symbols-outlined text-[#b45309] text-[18px]">{{ icon() }}</span>
          <span class="text-[12.5px] font-semibold text-[#92400e]">{{ hint() }}</span>
        </div>
        <div class="relative">
          <span
            class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d] text-[18px] pointer-events-none"
            aria-hidden="true"
          >
            {{ icon() }}
          </span>
          <input
            type="text"
            [placeholder]="placeholder()"
            [title]="placeholder()"
            class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#d7d9dc] bg-white text-[13px] text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#006a61]/30 focus:border-[#006a61] transition-colors"
            [value]="term()"
            (input)="onInput($event)"
            (focus)="open.set(true)"
            (blur)="onBlur()"
          />
          @if (open() && filtered().length > 0) {
            <div class="absolute z-30 mt-1 w-full bg-white rounded-xl shadow-lg border border-[#e6e8ea] max-h-60 overflow-y-auto">
              @for (item of filtered(); track item.id) {
                <button
                  type="button"
                  class="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#f2f4f6] transition-colors first:rounded-t-xl last:rounded-b-xl"
                  (mousedown)="choose(item.id)"
                >
                  <div class="w-8 h-8 rounded-lg bg-[#006a61] text-white flex items-center justify-center text-[11px] font-bold ring-1 ring-[#eceef0] shrink-0">
                    {{ initials(item.title) }}
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-[13px] font-semibold text-[#191c1e] truncate">{{ item.title }}</span>
                    <span class="text-[11px] text-[#76777d] truncate">{{ item.subtitle }}</span>
                  </div>
                </button>
              }
            </div>
          }
          @if (open() && term() && filtered().length === 0) {
            <div class="absolute z-30 mt-1 w-full bg-white rounded-xl shadow-lg border border-[#e6e8ea] p-4 text-center">
              <span class="text-[12px] text-[#76777d]">{{ emptyMessage().replace('{term}', term()) }}</span>
            </div>
          }
        </div>
      </div>
    } @else {
      <div class="p-4 rounded-xl bg-[#f2f4f6] border border-[#e0e3e5]">
        <div class="flex items-start gap-3.5">
          <div class="w-12 h-12 rounded-xl bg-[#006a61] text-white flex items-center justify-center text-[16px] font-bold shrink-0 ring-1 ring-[#c6c6cd]">
            {{ initials(selected()!.title) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[14px] font-bold text-[#191c1e] truncate">{{ selected()!.title }}</span>
            </div>
            <p class="text-[12px] text-[#45464d] truncate mt-0.5">{{ selected()!.subtitle }}</p>
            @if (selected()!.detail) {
              <p class="text-[11px] text-[#76777d] truncate">{{ selected()!.detail }}</p>
            }
          </div>
          <button
            type="button"
            class="shrink-0 px-2.5 py-1 rounded-lg text-[#76777d] hover:bg-[#e6e8ea] transition-colors text-[12px] font-semibold"
            (click)="clear()"
            [title]="'Cambiar de ' + noun()"
          >
            Cambiar
          </button>
        </div>
      </div>
    }
    @if (secondaryLabel()) {
      <div class="mt-3 flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-bold bg-[#f2f4f6] text-[#191c1e] border border-[#e0e3e5] hover:bg-[#e8eaec] transition-colors"
          (click)="secondaryClick.emit()"
        >
          <span class="material-symbols-outlined text-[15px]">{{ secondaryIcon() }}</span>
          {{ secondaryLabel() }}
        </button>
      </div>
    }
  `,
})
export class SelectionPickerComponent {
  /** Icono de Material, se usa en el aviso y en el buscador. */
  readonly icon = input('search');
  readonly placeholder = input('');
  /** Aviso ámbar mientras no hay nada escogido. */
  readonly hint = input('');
  /**
   * Mensaje de "sin resultados". Admite {term}, que se reemplaza por lo
   * que el usuario escribio.
   */
  readonly emptyMessage = input('Sin resultados para "{term}"');
  /** Singular para el title del boton "Cambiar". */
  readonly noun = input('elemento');
  readonly secondaryLabel = input<string | null>(null);
  readonly secondaryIcon = input('person_add');
  /** Campos por los que se filtra, en minusculas. */
  readonly searchKeys = input<string[]>(['title', 'subtitle']);
  readonly items = input<PickerItem[]>([]);
  readonly selectedId = input<string | null>(null);

  readonly selectedChange = output<string | null>();
  readonly secondaryClick = output<void>();

  readonly term = signal('');
  readonly open = signal(false);

  readonly selected = computed(() => this.items().find(i => i.id === this.selectedId()) ?? null);

  /**
   * Busca sobre los campos indicados. Cada campo puede venir en el item como
   * `name`/`ci` aunque la ficha visible se llame title/subtitle, asi que se
   * resuelve por nombre de clave y no por posicion.
   */
  readonly filtered = computed(() => {
    const t = this.term().toLowerCase().trim();
    const all = this.items();
    if (!t) return all;
    const keys = this.searchKeys();
    return all.filter(item => keys.some(key => this.matches(item, key, t)));
  });

  onInput(event: Event): void {
    this.term.set((event.target as HTMLInputElement).value);
    this.open.set(true);
  }

  onBlur(): void {
    // mousedown del item corre antes que blur, por eso el retardo.
    setTimeout(() => this.open.set(false), 150);
  }

  choose(id: string): void {
    this.selectedChange.emit(id);
    this.term.set('');
    this.open.set(false);
  }

  clear(): void {
    this.selectedChange.emit(null);
    this.term.set('');
    this.open.set(false);
  }

  /**
   * Un campo coincide con el termino? Se mira en `search`, y si no existe ahi
   * se cae a los campos visibles, asi no hay que repetir el nombre en ambos
   * lados.
   */
  private matches(item: PickerItem, key: string, term: string): boolean {
    const value =
      item.search?.[key] ??
      (key === 'title' ? item.title : key === 'subtitle' ? item.subtitle : undefined);
    return (value ?? '').toLowerCase().includes(term);
  }

  /** Primeras y ultima letra, igual que data.getInitials(). */
  initials(name: string): string {
    return name.split(' ').map(w => w[0]).filter((_, i, arr) => i === 0 || i === arr.length - 1).join('').toUpperCase();
  }
}