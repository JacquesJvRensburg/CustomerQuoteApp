import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

import { DatabaseService } from '../../../core/database/database.service';
import { QuoteActions } from './quote.actions';

@Injectable()
export class QuoteEffects {
  private readonly actions$ = inject(Actions);
  private readonly database = inject(DatabaseService);
  private readonly router = inject(Router);

  loadQuotes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuoteActions.loadQuotes),
      switchMap(() =>
        this.database.ensureQuoteSeedData().pipe(
          switchMap(() => this.database.getQuotes()),
          map((quotes) => QuoteActions.loadQuotesSuccess({ quotes })),
          catchError((error: unknown) =>
            of(
              QuoteActions.loadQuotesFailure({
                error: error instanceof Error ? error.message : 'Failed to load quotes',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  createQuote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuoteActions.createQuote),
      switchMap(({ quote }) =>
        this.database.saveQuote(quote).pipe(
          map((savedQuote) => QuoteActions.createQuoteSuccess({ quote: savedQuote })),
          catchError((error: unknown) =>
            of(
              QuoteActions.createQuoteFailure({
                error: error instanceof Error ? error.message : 'Failed to create quote',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  createQuoteSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(QuoteActions.createQuoteSuccess),
        tap(() => {
          void this.router.navigate(['/quotes']);
        }),
      ),
    { dispatch: false },
  );

  updateQuote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuoteActions.updateQuote),
      switchMap(({ id, quote }) =>
        this.database.updateQuote(id, quote).pipe(
          map((savedQuote) => QuoteActions.updateQuoteSuccess({ quote: savedQuote })),
          catchError((error: unknown) =>
            of(
              QuoteActions.updateQuoteFailure({
                error: error instanceof Error ? error.message : 'Failed to update quote',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  deleteQuote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuoteActions.deleteQuote),
      switchMap(({ id }) =>
        this.database.deleteQuote(id).pipe(
          map(() => QuoteActions.deleteQuoteSuccess({ id })),
          catchError((error: unknown) =>
            of(
              QuoteActions.deleteQuoteFailure({
                error: error instanceof Error ? error.message : 'Failed to delete quote',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
