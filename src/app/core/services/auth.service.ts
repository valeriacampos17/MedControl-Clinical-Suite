import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/types';

interface MockUser {
  email: string;
  password: string;
  user: User;
}

const MOCK_USERS: MockUser[] = [
  {
    email: 'admin@medcontrol.com',
    password: 'admin123',
    user: { id: 'usr-001', name: 'Administradora Central', email: 'admin@medcontrol.com', role: 'admin' },
  },
  {
    email: 'aguirre@medcontrol.com',
    password: 'doctor123',
    user: { id: 'usr-002', name: 'Dra. Noemí Aguirre', email: 'aguirre@medcontrol.com', role: 'doctor', doctorId: 'doc-aguirre', avatarUrl: 'assets/images/doctors/aguirre.png' },
  },
  {
    email: 'mawad@medcontrol.com',
    password: 'doctor123',
    user: { id: 'usr-003', name: 'Dr. Jorge Mawad', email: 'mawad@medcontrol.com', role: 'doctor', doctorId: 'doc-mawad', avatarUrl: 'assets/images/doctors/mawad.png' },
  },
  {
    email: 'munoz@medcontrol.com',
    password: 'doctor123',
    user: { id: 'usr-004', name: 'Dra. Sandra Muñoz', email: 'munoz@medcontrol.com', role: 'doctor', doctorId: 'doc-munoz', avatarUrl: 'assets/images/doctors/munoz.png' },
  },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router: Router;

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isDoctor = computed(() => this.currentUser()?.role === 'doctor');

  constructor(router: Router) {
    this.router = router;
  }

  login(email: string, password: string): boolean {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      this.currentUser.set(found.user);
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getDoctorId(): string | null {
    return this.currentUser()?.doctorId ?? null;
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).filter((_, i, arr) => i === 0 || i === arr.length - 1).join('').toUpperCase();
  }
}
