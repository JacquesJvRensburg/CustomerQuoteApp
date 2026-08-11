import { createSelector } from '@ngrx/store';

import { countryFlagUrl } from '../../../shared/utils/country-flag.util';
import { customersFeature } from './customer.reducer';

export const {
  selectCustomersState,
  selectCustomers,
  selectDataRevision: selectCustomersDataRevision,
  selectPendingMutations: selectCustomersPendingMutations,
  selectLoading: selectCustomersLoading,
  selectSaving: selectCustomersSaving,
  selectLoadError: selectCustomersLoadError,
  selectMutationError: selectCustomersMutationError,
  selectFilter: selectCustomersFilter,
  selectEditingCustomerId,
  selectEditingAddressId,
  selectDraftNationalityCode,
  selectCountries,
  selectCountriesLoading,
  selectCountriesError,
  selectPredictions,
  selectPredictionsLoading,
  selectPredictionsError,
  selectDraftUniversity,
  selectUniversitySearchResults,
  selectUniversitySearchLoading,
  selectUniversitySearchError,
} = customersFeature;

export const selectCustomerTableRows = createSelector(
  selectCustomers,
  selectCountries,
  (customers, countries) => {
    const countriesByCode = new Map(
      countries.map((country) => [country.alpha2Code.toUpperCase(), country]),
    );

    return customers.map((customer) => {
      const code = customer.nationalityCode?.toUpperCase() ?? null;
      const country = code ? countriesByCode.get(code) : undefined;

      return {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        nationalityCode: code,
        nationalityName: country?.name ?? code,
        nationalityFlagUrl: code ? countryFlagUrl(code, country?.flags) : '',
        universityName: customer.universityName,
        universityWebsite: customer.universityWebsite,
        addressSearchText: customer.addresses
          .map(
            (address) =>
              `${address.street} ${address.suburb} ${address.city} ${address.postalCode}`,
          )
          .join(' '),
      };
    });
  },
);

export type CustomerTableRow = ReturnType<typeof selectCustomerTableRows>[number];

export const selectFilteredCustomerTableRows = createSelector(
  selectCustomerTableRows,
  selectCustomersFilter,
  (rows, filterValue) => {
    const term = filterValue.trim().toLowerCase();
    if (!term) {
      return rows;
    }

    return rows.filter((row) =>
      [
        row.firstName,
        row.lastName,
        row.nationalityName,
        row.nationalityCode,
        row.universityName,
        row.addressSearchText,
      ]
        .filter((value): value is string => !!value)
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  },
);

export const selectCustomerById = (customerId: number) =>
  createSelector(selectCustomers, (customers) =>
    customers.find((customer) => customer.id === customerId) ?? null,
  );
