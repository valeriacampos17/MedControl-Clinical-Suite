import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { getStoredToken } from '../interceptors/jwt.interceptor';

export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    if (auth.mustChangePassword() && route.url[0]?.path !== 'cambiar-contrasena') {
      return router.createUrlTree(['/cambiar-contrasena']);
    }
    return true;
  }
  const hasToken = !!getStoredToken();
  if (hasToken) {
    const restored = await auth.restoreSession();
    if (restored) {
      if (auth.mustChangePassword() && route.url[0]?.path !== 'cambiar-contrasena') {
        return router.createUrlTree(['/cambiar-contrasena']);
      }
      return true;
    }
  }
  return router.createUrlTree(['/login']);
};
