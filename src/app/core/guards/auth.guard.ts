import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { getStoredToken } from '../interceptors/jwt.interceptor';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  const hasToken = !!getStoredToken();
  if (hasToken) {
    const restored = await auth.restoreSession();
    if (restored) return true;
  }
  return router.createUrlTree(['/login']);
};
