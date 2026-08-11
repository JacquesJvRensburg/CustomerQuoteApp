import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, concatMap, map, of, switchMap, tap, withLatestFrom } from 'rxjs';

import { DatabaseService } from '../../../core/database/database.service';
import { CustomerActions } from '../../customers/store/customer.actions';
import { QuoteActions } from './quote.actions';
import { selectQuotesDataRevision } from './quote.selectors';

@Injectable()
export class QuoteEffects {
  private readonly actions$ = inject(Actions);
  private readonly database = inject(DatabaseService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  loadQuotes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuoteActions.loadQuotes),
      withLatestFrom(this.store.select(selectQuotesDataRevision)),
      switchMap(([, revision]) =>
        this.database.ensureSeedData().pipe(
          switchMap(() => this.database.getQuotes()),
          map((quotes) => QuoteActions.loadQuotesSuccess({ quotes, revision })),
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
      concatMap(({ quote }) =>
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
      concatMap(({ id, quote }) =>
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
      concatMap(({ id }) =>
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

  /** Keep quote list aligned when SQLite CASCADE-deletes quotes with a customer. */
  removeQuotesForDeletedCustomer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomerActions.deleteCustomerSuccess),
      map(({ id }) => QuoteActions.removeQuotesForCustomer({ customerId: id })),
    ),
  );

  /** Refresh denormalized customer names after a customer rename. */
  syncQuoteCustomerNames$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomerActions.updateCustomerSuccess),
      map(({ customer }) =>
        QuoteActions.syncCustomerNameOnQuotes({
          customerId: customer.id,
          customerFullName: `${customer.firstName} ${customer.lastName}`.trim(),
        }),
      ),
    ),
  );
}
