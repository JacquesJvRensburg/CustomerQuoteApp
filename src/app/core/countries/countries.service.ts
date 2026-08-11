import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Country } from '../../models/country.model';

@Injectable({
  providedIn: 'root',
})
export class CountriesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://countries.dev/countries';

  /** Cached once for the app lifetime — list is stable. */
  private readonly countries$: Observable<Country[]> = this.http
    .get<Country[]>(this.apiUrl, {
      params: { fields: 'name,flag,flags,alpha2Code' },
    })
    .pipe(
      map((countries) =>
        [...countries].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
      ),
      catchError((error: unknown) => this.handleError(error)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

  /** Full country list (fetched once, then shared). */
  getCountries(): Observable<Country[]> {
    return this.countries$;
  }

  private handleError(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return throwError(
          () => new Error('Unable to reach the countries service. Check your connection.'),
        );
      }

      return throwError(
        () => new Error(error.message || 'Failed to load countries.'),
      );
    }

    if (error instanceof Error) {
      return throwError(() => error);
    }

    return throwError(() => new Error('Failed to load countries.'));
  }
}
