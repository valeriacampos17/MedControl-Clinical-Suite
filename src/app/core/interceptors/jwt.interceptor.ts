import type { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'medcontrol_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getStoredToken();
  if (!token || req.url.includes('/api/auth/login')) return next(req);
  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};