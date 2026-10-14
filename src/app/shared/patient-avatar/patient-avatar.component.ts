import { Component, computed, input } from '@angular/core';

/**
 * Avatar de paciente: muestra la foto si existe y, si no, las iniciales.
 * El contenedor (tamano, forma y color) se define con clases en el uso; este
 * componente solo centra el contenido y recorta la imagen.
 */
@Component({
  selector: 'app-patient-avatar',
  standalone: true,
  styles: [':host{display:flex;align-items:center;justify-content:center;overflow:hidden}'],
  template: `
    @if (photoUrl()) {
      <img [src]="photoUrl()" [alt]="name()" class="w-full h-full object-cover" />
    } @else {
      {{ initials() }}
    }
  `,
})
export class PatientAvatarComponent {
  name = input('');
  photoUrl = input('');

  initials = computed(() => {
    const words = this.name().split(' ').filter(Boolean);
    if (words.length === 0) return '';
    const first = words[0][0] ?? '';
    const last = words.length > 1 ? words[words.length - 1][0] ?? '' : '';
    return (first + last).toUpperCase();
  });
}
