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
);

export const customersFeature = createFeature({
  name: 'customers',
  reducer: customersReducer,
});
