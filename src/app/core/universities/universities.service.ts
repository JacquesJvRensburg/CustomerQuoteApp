import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { HipolabsUniversity, University } from '../../models/university.model';

@Injectable({
  providedIn: 'root',
})
export class UniversitiesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://universities.hipolabs.com/search';

  /** Search universities in a country by partial name match. */
  searchUniversities(countryName: string, query: string): Observable<University[]> {
    const trimmedCountry = countryName.trim();
    const trimmedQuery = query.trim();

    if (!trimmedCountry) {
      return throwError(() => new Error('A country name is required to search universities.'));
    }

    if (!trimmedQuery) {
      return throwError(() => new Error('Enter part of a university name to search.'));
    }

    return this.http
      .get<HipolabsUniversity[]>(this.apiUrl, {
        params: {
          country: trimmedCountry,
          name: trimmedQuery,
        },
      })
      .pipe(
        map((results) =>
          (results ?? []).map((item) => ({
            name: item.name,
            website: item.web_pages?.[0] ?? '',
          })),
        ),
        catchError((error: unknown) => this.handleError(error)),
      );
  }

  private handleError(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return throwError(
          () => new Error('Unable to reach the university search service. Check your connection.'),
        );
      }

      return throwError(
        () => new Error(error.message || 'Failed to search universities.'),
      );
    }

    if (error instanceof Error) {
      return throwError(() => error);
    }

    return throwError(() => new Error('Failed to search universities.'));
  }
}
