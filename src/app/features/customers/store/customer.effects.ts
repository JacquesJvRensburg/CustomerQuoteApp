import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';

import { CountriesService } from '../../../core/countries/countries.service';
import { DatabaseService } from '../../../core/database/database.service';
import { NationalizeService } from '../../../core/nationalize/nationalize.service';
import { UniversitiesService } from '../../../core/universities/universities.service';
import { Country, CountryPrediction } from '../../../models/country.model';
import { countryFlagUrl } from '../../../shared/utils/country-flag.util';
import { CustomerActions } from './customer.actions';
import { selectCountries } from './customer.selectors';

@Injectable()
export class CustomerEffects {
  private readonly actions$ = inject(Actions);
  private readonly database = inject(DatabaseService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly countriesService = inject(CountriesService);
  private readonly nationalizeService = inject(NationalizeService);
  private readonly universitiesService = inject(UniversitiesService);

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

  reseedDatabase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomerActions.reseedDatabase),
      switchMap(() =>
        this.database.reseed().pipe(
          switchMap(() => this.database.getCustomers()),
          map((customers) => CustomerActions.reseedDatabaseSuccess({ customers })),
          catchError((error: unknown) =>
            of(
              CustomerActions.reseedDatabaseFailure({
                error: error instanceof Error ? error.message : 'Failed to reseed database',
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
      switchMap(({ id, firstName, lastName, nationalityCode, universityName, universityWebsite }) =>
        this.database
          .updateCustomerNames(
            id,
            firstName,
            lastName,
            nationalityCode,
            universityName,
            universityWebsite,
          )
          .pipe(
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

  /** Fetch the full country list once; skip if already loaded. */
  loadCountries$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomerActions.loadCountries),
      withLatestFrom(this.store.select(selectCountries)),
      switchMap(([, existing]) => {
        if (existing.length > 0) {
          return of(CustomerActions.loadCountriesSuccess({ countries: existing }));
        }

        return this.countriesService.getCountries().pipe(
          map((countries) => CustomerActions.loadCountriesSuccess({ countries })),
          catchError((error: unknown) =>
            of(
              CustomerActions.loadCountriesFailure({
                error: error instanceof Error ? error.message : 'Failed to load countries',
              }),
            ),
          ),
        );
      }),
    ),
  );

  /** Call Nationalize API; joins predictions with country metadata from the countries service. */
  predictNationality$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomerActions.predictNationality),
      switchMap(({ surname }) =>
        this.countriesService.getCountries().pipe(
          switchMap((countries) => {
            const byCode = new Map<string, Country>(
              countries.map((c) => [c.alpha2Code.toUpperCase(), c]),
            );

            return this.nationalizeService.predictNationality(surname).pipe(
              map((raw) => {
                const predictions: CountryPrediction[] = raw.map(
                  ({ country_id, probability }) => {
                    const code = country_id.toUpperCase();
                    const match = byCode.get(code);
                    const flags = {
                      png: countryFlagUrl(code, match?.flags),
                      svg: countryFlagUrl(code, match?.flags),
                    };
                    return {
                      name: match?.name ?? code,
                      flag: match?.flag ?? '',
                      flags,
                      alpha2Code: code,
                      probability,
                    };
                  },
                );
                return CustomerActions.predictNationalitySuccess({ predictions });
              }),
              catchError((error: unknown) =>
                of(
                  CustomerActions.predictNationalityFailure({
                    error:
                      error instanceof Error ? error.message : 'Failed to predict nationality',
                  }),
                ),
              ),
            );
          }),
          catchError((error: unknown) =>
            of(
              CustomerActions.predictNationalityFailure({
                error: error instanceof Error ? error.message : 'Failed to load countries',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  /** Search universities in the selected country via hipolabs. */
  searchUniversities$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CustomerActions.searchUniversities),
      switchMap(({ countryName, query }) =>
        this.universitiesService.searchUniversities(countryName, query).pipe(
          map((results) => CustomerActions.searchUniversitiesSuccess({ results })),
          catchError((error: unknown) =>
            of(
              CustomerActions.searchUniversitiesFailure({
                error: error instanceof Error ? error.message : 'Failed to search universities',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
