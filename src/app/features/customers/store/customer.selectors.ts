import { createSelector } from '@ngrx/store';

import { customersFeature } from './customer.reducer';

export const {
  selectCustomersState,
  selectCustomers,
  selectLoading,
  selectError,
} = customersFeature;

export const selectCustomerTableRows = createSelector(selectCustomers, (customers) =>
  customers.map((customer) => ({
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
  })),
);

export const selectCustomerById = (customerId: number) =>
  createSelector(selectCustomers, (customers) =>
    customers.find((customer) => customer.id === customerId) ?? null,
  );
