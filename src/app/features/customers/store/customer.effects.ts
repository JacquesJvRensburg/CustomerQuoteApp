import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { DatabaseService } from '../../../core/database/database.service';
import { CustomerActions } from './customer.actions';

@Injectable()
export class CustomerEffects {
  private readonly actions$ = inject(Actions);
  private readonly database = inject(DatabaseService);

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
}
