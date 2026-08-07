import { createSelector } from '@ngrx/store';

import { customersFeature } from './customer.reducer';

export const {
  selectCustomersState,
  selectCustomers,
  selectLoading,
  selectSaving,
  selectError,
} = customersFeature;

export const selectCustomerTableRows = createSelector(selectCustomers, (customers) =>
  customers.map((customer) => ({
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    addressSearchText: customer.addresses
      .map(
        (address) =>
          `${address.street} ${address.suburb} ${address.city} ${address.postalCode}`,
      )
      .join(' '),
  })),
);

export const selectCustomerById = (customerId: number) =>
  createSelector(selectCustomers, (customers) =>
    customers.find((customer) => customer.id === customerId) ?? null,
  );
