import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { NationalizeCountry, NationalizeResponse } from '../../models/nationalize.model';
import { environment } from '../../../environments/environment';

/** Nationalize.io API key from environment config. */
export const NATIONALIZE_API_KEY = new InjectionToken<string>('NATIONALIZE_API_KEY', {
  providedIn: 'root',
  factory: () => environment.nationalizeApiKey.trim(),
});

@Injectable({
  providedIn: 'root',
})
export class NationalizeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://api.nationalize.io';
  private readonly apiKey = inject(NATIONALIZE_API_KEY);

  /**
   * Predict nationality from a surname (or full name).
   * Returns up to 5 countries ordered by descending probability.
   */
  predictNationality(name: string): Observable<NationalizeCountry[]> {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return throwError(() => new Error('A name is required to predict nationality.'));
    }

    let params = new HttpParams().set('name', trimmedName);
    if (this.apiKey) {
      params = params.set('apikey', this.apiKey);
    }

    return this.http
      .get<NationalizeResponse>(this.apiUrl, { params })
      .pipe(
        map((response) => response.country ?? []),
        catchError((error: unknown) => this.handleError(error)),
      );
  }

  private handleError(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 429) {
        return throwError(
          () =>
            new Error(
              'Nationality lookup is rate limited. Please wait a moment and try again.',
            ),
        );
      }

      if (error.status === 401) {
        return throwError(
          () =>
            new Error(
              'Nationality lookup API key is invalid. Check environment.nationalizeApiKey.',
            ),
        );
      }

      if (error.status === 0) {
        return throwError(
          () => new Error('Unable to reach the nationality service. Check your connection.'),
        );
      }

      return throwError(
        () =>
          new Error(
            this.readHttpErrorMessage(error) ?? error.message ?? 'Failed to predict nationality.',
          ),
      );
    }

    if (error instanceof Error) {
      return throwError(() => error);
    }

    return throwError(() => new Error('Failed to predict nationality.'));
  }

  private readHttpErrorMessage(error: HttpErrorResponse): string | null {
    const body = error.error;
    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    if (body && typeof body === 'object' && 'error' in body) {
      const message = (body as { error?: unknown }).error;
      return typeof message === 'string' && message.trim() ? message : null;
    }

    return null;
  }
}
