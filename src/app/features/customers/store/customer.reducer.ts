import { createFeature, createReducer, on } from '@ngrx/store';

import { CustomerEntity } from '../../../models/customer.model';
import { CustomerActions } from './customer.actions';

export interface CustomersState {
  customers: CustomerEntity[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export const initialCustomersState: CustomersState = {
  customers: [],
  loading: false,
  saving: false,
  error: null,
};

const customersReducer = createReducer(
  initialCustomersState,
  on(CustomerActions.loadCustomers, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(CustomerActions.loadCustomersSuccess, (state, { customers }) => ({
    ...state,
    customers,
    loading: false,
    error: null,
  })),
  on(CustomerActions.loadCustomersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(CustomerActions.createCustomer, (state) => ({
    ...state,
    saving: true,
    error: null,
  })),
  on(CustomerActions.createCustomerSuccess, (state, { customer }) => ({
    ...state,
    customers: [...state.customers, customer],
    saving: false,
    error: null,
  })),
  on(CustomerActions.createCustomerFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error,
  })),
  on(
    CustomerActions.updateCustomer,
    CustomerActions.deleteCustomer,
    CustomerActions.updateAddress,
    CustomerActions.deleteAddress,
    (state) => ({
      ...state,
      saving: true,
      error: null,
    }),
  ),
  on(CustomerActions.updateCustomerSuccess, (state, { customer }) => ({
    ...state,
    customers: state.customers.map((existing) =>
      existing.id === customer.id ? customer : existing,
    ),
    saving: false,
    error: null,
  })),
  on(
    CustomerActions.updateAddressSuccess,
    CustomerActions.deleteAddressSuccess,
    (state, { customer }) => ({
      ...state,
      customers: state.customers.map((existing) =>
        existing.id === customer.id ? customer : existing,
      ),
      saving: false,
      error: null,
    }),
  ),
  on(CustomerActions.deleteCustomerSuccess, (state, { id }) => ({
    ...state,
    customers: state.customers.filter((customer) => customer.id !== id),
    saving: false,
    error: null,
  })),
  on(
    CustomerActions.updateCustomerFailure,
    CustomerActions.deleteCustomerFailure,
    CustomerActions.updateAddressFailure,
    CustomerActions.deleteAddressFailure,
    (state, { error }) => ({
      ...state,
      saving: false,
      error,
    }),
  ),
);

export const customersFeature = createFeature({
  name: 'customers',
  reducer: customersReducer,
});
