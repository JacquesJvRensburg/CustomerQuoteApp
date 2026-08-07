import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

import { DatabaseService } from '../../../core/database/database.service';
import { CustomerActions } from './customer.actions';

@Injectable()
export class CustomerEffects {
  private readonly actions$ = inject(Actions);
  private readonly database = inject(DatabaseService);
  private readonly router = inject(Router);

  loadCustomers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomerActions.loadCustomers),
      switchMap(() =>
        this.database.ensureSeedData().pipe(
          switchMap(() => this.database.getCustomers()),
          map((customers) => CustomerActions.loadCustomersSuccess({ customers })),
          catchError((error: unknown) =>
            of(
              CustomerActions.loadCustomersFailure({
                error: error instanceof Error ? error.message : 'Failed to load customers',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  createCustomer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomerActions.createCustomer),
      switchMap(({ customer }) =>
        this.database.saveCustomer(customer).pipe(
          map((savedCustomer) =>
            CustomerActions.createCustomerSuccess({ customer: savedCustomer }),
          ),
          catchError((error: unknown) =>
            of(
              CustomerActions.createCustomerFailure({
                error: error instanceof Error ? error.message : 'Failed to create customer',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  createCustomerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(CustomerActions.createCustomerSuccess),
        tap(() => {
          void this.router.navigate(['/']);
        }),
      ),
    { dispatch: false },
  );
}
