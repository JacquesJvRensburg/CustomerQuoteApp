import { createFeature, createReducer, on } from '@ngrx/store';

import { Country, CountryPrediction } from '../../../models/country.model';
import { CustomerEntity } from '../../../models/customer.model';
import { University } from '../../../models/university.model';
import { CustomerActions } from './customer.actions';

export interface CustomersState {
  customers: CustomerEntity[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  filter: string;
  editingCustomerId: number | null;
  editingAddressId: number | null;
  draftNationalityCode: string | null;
  countries: Country[];
  countriesLoading: boolean;
  countriesError: string | null;
  predictions: CountryPrediction[];
  predictionsLoading: boolean;
  predictionsError: string | null;
  draftUniversity: University | null;
  universitySearchResults: University[];
  universitySearchLoading: boolean;
  universitySearchError: string | null;
}

export const initialCustomersState: CustomersState = {
  customers: [],
  loading: false,
  saving: false,
  error: null,
  filter: '',
  editingCustomerId: null,
  editingAddressId: null,
  draftNationalityCode: null,
  countries: [],
  countriesLoading: false,
  countriesError: null,
  predictions: [],
  predictionsLoading: false,
  predictionsError: null,
  draftUniversity: null,
  universitySearchResults: [],
  universitySearchLoading: false,
  universitySearchError: null,
};

const customersReducer = createReducer(
  initialCustomersState,
  on(CustomerActions.loadCustomers, (state) => ({
    ...state,
    loading: state.customers.length === 0,
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
  on(CustomerActions.reseedDatabase, (state) => ({
    ...state,
    loading: true,
    saving: false,
    error: null,
  })),
  on(CustomerActions.reseedDatabaseSuccess, (state, { customers }) => ({
    ...initialCustomersState,
    customers,
    loading: false,
  })),
  on(CustomerActions.reseedDatabaseFailure, (state, { error }) => ({
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
    draftNationalityCode: null,
    draftUniversity: null,
    universitySearchResults: [],
    universitySearchLoading: false,
    universitySearchError: null,
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
    editingCustomerId: null,
    draftNationalityCode: null,
    draftUniversity: null,
    universitySearchResults: [],
    universitySearchLoading: false,
    universitySearchError: null,
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
      editingAddressId: null,
    }),
  ),
  on(CustomerActions.deleteCustomerSuccess, (state, { id }) => ({
    ...state,
    customers: state.customers.filter((customer) => customer.id !== id),
    saving: false,
    error: null,
    editingCustomerId: state.editingCustomerId === id ? null : state.editingCustomerId,
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
  on(CustomerActions.setFilter, (state, { filter }) => ({
    ...state,
    filter,
  })),
  on(CustomerActions.setDraftNationality, (state, { nationalityCode }) => ({
    ...state,
    draftNationalityCode: nationalityCode,
    draftUniversity: null,
    universitySearchResults: [],
    universitySearchLoading: false,
    universitySearchError: null,
  })),
  on(CustomerActions.startCustomerEdit, (state, { id }) => {
    const customer = state.customers.find((existing) => existing.id === id);
    const draftUniversity =
      customer?.universityName != null
        ? {
            name: customer.universityName,
            website: customer.universityWebsite ?? '',
          }
        : null;
    return {
      ...state,
      editingCustomerId: id,
      draftNationalityCode: customer?.nationalityCode ?? null,
      draftUniversity,
      universitySearchResults: [],
      universitySearchLoading: false,
      universitySearchError: null,
    };
  }),
  on(CustomerActions.cancelCustomerEdit, (state) => ({
    ...state,
    editingCustomerId: null,
    draftNationalityCode: null,
    draftUniversity: null,
    universitySearchResults: [],
    universitySearchLoading: false,
    universitySearchError: null,
  })),
  on(CustomerActions.startAddressEdit, (state, { id }) => ({
    ...state,
    editingAddressId: id,
  })),
  on(CustomerActions.cancelAddressEdit, (state) => ({
    ...state,
    editingAddressId: null,
  })),
  // Countries
  on(CustomerActions.loadCountries, (state) => ({
    ...state,
    countriesLoading: true,
    countriesError: null,
  })),
  on(CustomerActions.loadCountriesSuccess, (state, { countries }) => ({
    ...state,
    countries,
    countriesLoading: false,
    countriesError: null,
  })),
  on(CustomerActions.loadCountriesFailure, (state, { error }) => ({
    ...state,
    countriesLoading: false,
    countriesError: error,
  })),
  // Predictions
  on(CustomerActions.predictNationality, (state) => ({
    ...state,
    predictions: [],
    predictionsLoading: true,
    predictionsError: null,
  })),
  on(CustomerActions.predictNationalitySuccess, (state, { predictions }) => ({
    ...state,
    predictions,
    predictionsLoading: false,
    predictionsError: null,
  })),
  on(CustomerActions.predictNationalityFailure, (state, { error }) => ({
    ...state,
    predictions: [],
    predictionsLoading: false,
    predictionsError: error,
  })),
  on(CustomerActions.clearNationalityPredictions, (state) => ({
    ...state,
    predictions: [],
    predictionsLoading: false,
    predictionsError: null,
  })),
  // University search
  on(CustomerActions.setDraftUniversity, (state, { university }) => ({
    ...state,
    draftUniversity: university,
  })),
  on(CustomerActions.searchUniversities, (state) => ({
    ...state,
    universitySearchResults: [],
    universitySearchLoading: true,
    universitySearchError: null,
  })),
  on(CustomerActions.searchUniversitiesSuccess, (state, { results }) => ({
    ...state,
    universitySearchResults: results,
    universitySearchLoading: false,
    universitySearchError: null,
  })),
  on(CustomerActions.searchUniversitiesFailure, (state, { error }) => ({
    ...state,
    universitySearchResults: [],
    universitySearchLoading: false,
    universitySearchError: error,
  })),
  on(CustomerActions.clearUniversitySearch, (state) => ({
    ...state,
    universitySearchResults: [],
    universitySearchLoading: false,
    universitySearchError: null,
  })),
);

export const customersFeature = createFeature({
  name: 'customers',
  reducer: customersReducer,
});
