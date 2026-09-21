import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${environment.apiUrl}${path}`).pipe(catchError((e: HttpErrorResponse) => this.toError(e)));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${environment.apiUrl}${path}`, body).pipe(catchError((e: HttpErrorResponse) => this.toError(e)));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${environment.apiUrl}${path}`, body).pipe(catchError((e: HttpErrorResponse) => this.toError(e)));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${environment.apiUrl}${path}`, body).pipe(catchError((e: HttpErrorResponse) => this.toError(e)));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${environment.apiUrl}${path}`).pipe(catchError((e: HttpErrorResponse) => this.toError(e)));
  }

  private toError(err: HttpErrorResponse): Observable<never> {
    const message = (err.error as { error?: string } | undefined)?.error ?? err.message ?? 'Error de conexión';
    return throwError(() => new Error(message));
  }
}