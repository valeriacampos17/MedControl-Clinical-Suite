import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('renderiza la marca MedControl', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('MedControl');
  });

  it('lista las 6 pantallas disponibles del suite', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('6. Configuración Doctor');
  });
});