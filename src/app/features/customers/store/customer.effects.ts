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

  updateCustomer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomerActions.updateCustomer),
      switchMap(({ id, firstName, lastName }) =>
        this.database.updateCustomerNames(id, firstName, lastName).pipe(
          map((customer) => CustomerActions.updateCustomerSuccess({ customer })),
          catchError((error: unknown) =>
            of(
              CustomerActions.updateCustomerFailure({
                error: error instanceof Error ? error.message : 'Failed to update customer',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  deleteCustomer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomerActions.deleteCustomer),
      switchMap(({ id }) =>
        this.database.deleteCustomer(id).pipe(
          map(() => CustomerActions.deleteCustomerSuccess({ id })),
          catchError((error: unknown) =>
            of(
              CustomerActions.deleteCustomerFailure({
                error: error instanceof Error ? error.message : 'Failed to delete customer',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  updateAddress$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomerActions.updateAddress),
      switchMap(({ address }) =>
        this.database.updateAddress(address).pipe(
          map((customer) => CustomerActions.updateAddressSuccess({ customer })),
          catchError((error: unknown) =>
            of(
              CustomerActions.updateAddressFailure({
                error: error instanceof Error ? error.message : 'Failed to update address',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  deleteAddress$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomerActions.deleteAddress),
      switchMap(({ addressId }) =>
        this.database.deleteAddress(addressId).pipe(
          map((customer) => CustomerActions.deleteAddressSuccess({ customer })),
          catchError((error: unknown) =>
            of(
              CustomerActions.deleteAddressFailure({
                error: error instanceof Error ? error.message : 'Failed to delete address',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
