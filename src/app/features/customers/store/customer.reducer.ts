import { createFeature, createReducer, on } from '@ngrx/store';

import { CustomerEntity } from '../../../models/customer.model';
import { CustomerActions } from './customer.actions';

export interface CustomersState {
  customers: CustomerEntity[];
  loading: boolean;
  error: string | null;
}

export const initialCustomersState: CustomersState = {
  customers: [],
  loading: false,
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
);

export const customersFeature = createFeature({
  name: 'customers',
  reducer: customersReducer,
});
