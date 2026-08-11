import { AddressEntity } from '../../../models/address.model';
import { Country, CountryPrediction } from '../../../models/country.model';
import { CustomerEntity } from '../../../models/customer.model';
import { University } from '../../../models/university.model';
import { CustomerActions } from './customer.actions';
import { customersFeature, initialCustomersState, CustomersState } from './customer.reducer';

describe('customersReducer', () => {
  const reducer = customersFeature.reducer;

  const address: AddressEntity = {
    id: 10,
    street: '12 Long Street',
    city: 'Cape Town',
    suburb: 'City Centre',
    postalCode: '8001',
  };

  const customer: CustomerEntity = {
    id: 1,
    firstName: 'Thabo',
    lastName: 'Molefe',
    nationalityCode: 'ZA',
    universityName: 'University of Cape Town',
    universityWebsite: 'http://www.uct.ac.za/',
    addresses: [address],
  };

  const country: Country = {
    name: 'South Africa',
    flag: '🇿🇦',
    flags: { png: 'za.png', svg: 'za.svg' },
    alpha2Code: 'ZA',
  };

  const prediction: CountryPrediction = {
    ...country,
    probability: 0.8,
  };

  const university: University = {
    name: 'University of Cape Town',
    website: 'http://www.uct.ac.za/',
  };

  it('should return the initial state for an unknown action', () => {
    const state = reducer(undefined, { type: 'Unknown' });
    expect(state).toEqual(initialCustomersState);
  });

  it('should set loading only when no customers are cached', () => {
    expect(reducer(initialCustomersState, CustomerActions.loadCustomers()).loading).toBeTrue();

    const withCustomers: CustomersState = {
      ...initialCustomersState,
      customers: [customer],
    };
    expect(reducer(withCustomers, CustomerActions.loadCustomers()).loading).toBeFalse();
  });

  it('should load customers successfully', () => {
    const state = reducer(
      { ...initialCustomersState, loading: true },
      CustomerActions.loadCustomersSuccess({ customers: [customer] }),
    );

    expect(state.customers).toEqual([customer]);
    expect(state.loading).toBeFalse();
    expect(state.loadError).toBeNull();
  });

  it('should store a load failure', () => {
    const state = reducer(
      { ...initialCustomersState, loading: true },
      CustomerActions.loadCustomersFailure({ error: 'boom' }),
    );

    expect(state.loading).toBeFalse();
    expect(state.loadError).toBe('boom');
  });

  it('should create a customer and clear drafts', () => {
    const previous: CustomersState = {
      ...initialCustomersState,
      saving: true,
      draftNationalityCode: 'ZA',
      draftUniversity: university,
      universitySearchResults: [university],
    };

    const state = reducer(
      previous,
      CustomerActions.createCustomerSuccess({ customer }),
    );

    expect(state.customers).toEqual([customer]);
    expect(state.saving).toBeFalse();
    expect(state.draftNationalityCode).toBeNull();
    expect(state.draftUniversity).toBeNull();
    expect(state.universitySearchResults).toEqual([]);
  });

  it('should update a customer and clear editing state', () => {
    const updated = { ...customer, firstName: 'Teboho' };
    const previous: CustomersState = {
      ...initialCustomersState,
      customers: [customer],
      editingCustomerId: 1,
      draftNationalityCode: 'ZA',
      saving: true,
    };

    const state = reducer(
      previous,
      CustomerActions.updateCustomerSuccess({ customer: updated }),
    );

    expect(state.customers[0].firstName).toBe('Teboho');
    expect(state.editingCustomerId).toBeNull();
    expect(state.draftNationalityCode).toBeNull();
    expect(state.saving).toBeFalse();
  });

  it('should delete a customer and clear editing when that customer was being edited', () => {
    const previous: CustomersState = {
      ...initialCustomersState,
      customers: [customer],
      editingCustomerId: 1,
      saving: true,
    };

    const state = reducer(previous, CustomerActions.deleteCustomerSuccess({ id: 1 }));

    expect(state.customers).toEqual([]);
    expect(state.editingCustomerId).toBeNull();
  });

  it('should update address success and clear address editing', () => {
    const updated = {
      ...customer,
      addresses: [{ ...address, city: 'Stellenbosch' }],
    };
    const previous: CustomersState = {
      ...initialCustomersState,
      customers: [customer],
      editingAddressId: 10,
      saving: true,
    };

    const state = reducer(
      previous,
      CustomerActions.updateAddressSuccess({ customer: updated }),
    );

    expect(state.customers[0].addresses[0].city).toBe('Stellenbosch');
    expect(state.editingAddressId).toBeNull();
  });

  it('should set saving and clear mutation error on mutating actions', () => {
    const previous: CustomersState = {
      ...initialCustomersState,
      mutationError: 'old',
    };

    expect(reducer(previous, CustomerActions.createCustomer({
      customer: {
        firstName: 'A',
        lastName: 'B',
        nationalityCode: null,
        universityName: null,
        universityWebsite: null,
        addresses: [],
      },
    })).saving).toBeTrue();
    expect(reducer(previous, CustomerActions.updateCustomer({
      id: 1,
      firstName: 'A',
      lastName: 'B',
      nationalityCode: null,
      universityName: null,
      universityWebsite: null,
    })).mutationError).toBeNull();
    expect(reducer(previous, CustomerActions.deleteCustomer({ id: 1 })).saving).toBeTrue();
  });

  it('should store mutation failures and clear them', () => {
    const failed = reducer(
      { ...initialCustomersState, saving: true },
      CustomerActions.createCustomerFailure({ error: 'nope' }),
    );

    expect(failed.saving).toBeFalse();
    expect(failed.mutationError).toBe('nope');
    expect(reducer(failed, CustomerActions.clearMutationError()).mutationError).toBeNull();
  });

  it('should set filter and edit ids', () => {
    expect(reducer(initialCustomersState, CustomerActions.setFilter({ filter: 'thabo' })).filter)
      .toBe('thabo');
    expect(reducer(initialCustomersState, CustomerActions.startAddressEdit({ id: 10 }))
      .editingAddressId).toBe(10);
    expect(
      reducer(
        { ...initialCustomersState, editingAddressId: 10 },
        CustomerActions.cancelAddressEdit(),
      ).editingAddressId,
    ).toBeNull();
  });

  it('should start customer edit with draft nationality and university', () => {
    const previous: CustomersState = {
      ...initialCustomersState,
      customers: [customer],
    };

    const state = reducer(previous, CustomerActions.startCustomerEdit({ id: 1 }));

    expect(state.editingCustomerId).toBe(1);
    expect(state.draftNationalityCode).toBe('ZA');
    expect(state.draftUniversity).toEqual({
      name: 'University of Cape Town',
      website: 'http://www.uct.ac.za/',
    });
  });

  it('should cancel customer edit and clear drafts', () => {
    const previous: CustomersState = {
      ...initialCustomersState,
      editingCustomerId: 1,
      draftNationalityCode: 'ZA',
      draftUniversity: university,
      universitySearchResults: [university],
    };

    const state = reducer(previous, CustomerActions.cancelCustomerEdit());

    expect(state.editingCustomerId).toBeNull();
    expect(state.draftNationalityCode).toBeNull();
    expect(state.draftUniversity).toBeNull();
    expect(state.universitySearchResults).toEqual([]);
  });

  it('should set draft nationality and clear university search when it changes', () => {
    const previous: CustomersState = {
      ...initialCustomersState,
      draftNationalityCode: 'ZA',
      draftUniversity: university,
      universitySearchResults: [university],
    };

    const unchanged = reducer(
      previous,
      CustomerActions.setDraftNationality({ nationalityCode: 'ZA' }),
    );
    expect(unchanged).toBe(previous);

    const changed = reducer(
      previous,
      CustomerActions.setDraftNationality({ nationalityCode: 'BW' }),
    );
    expect(changed.draftNationalityCode).toBe('BW');
    expect(changed.draftUniversity).toBeNull();
    expect(changed.universitySearchResults).toEqual([]);
  });

  it('should manage countries, predictions, and university search state', () => {
    expect(reducer(initialCustomersState, CustomerActions.loadCountries()).countriesLoading)
      .toBeTrue();

    const withCountries = reducer(
      { ...initialCustomersState, countriesLoading: true },
      CustomerActions.loadCountriesSuccess({ countries: [country] }),
    );
    expect(withCountries.countries).toEqual([country]);
    expect(withCountries.countriesLoading).toBeFalse();

    const countriesFailed = reducer(
      { ...initialCustomersState, countriesLoading: true },
      CustomerActions.loadCountriesFailure({ error: 'countries' }),
    );
    expect(countriesFailed.countriesError).toBe('countries');

    const predicting = reducer(
      initialCustomersState,
      CustomerActions.predictNationality({ surname: 'Molefe' }),
    );
    expect(predicting.predictionsLoading).toBeTrue();
    expect(predicting.predictions).toEqual([]);

    const predicted = reducer(
      predicting,
      CustomerActions.predictNationalitySuccess({ predictions: [prediction] }),
    );
    expect(predicted.predictions).toEqual([prediction]);

    const predictionFailed = reducer(
      predicting,
      CustomerActions.predictNationalityFailure({ error: 'predict' }),
    );
    expect(predictionFailed.predictionsError).toBe('predict');

    expect(
      reducer(predicted, CustomerActions.clearNationalityPredictions()).predictions,
    ).toEqual([]);

    expect(
      reducer(initialCustomersState, CustomerActions.setDraftUniversity({ university }))
        .draftUniversity,
    ).toEqual(university);

    const searching = reducer(
      initialCustomersState,
      CustomerActions.searchUniversities({ countryName: 'South Africa', query: 'Cape' }),
    );
    expect(searching.universitySearchLoading).toBeTrue();

    const searched = reducer(
      searching,
      CustomerActions.searchUniversitiesSuccess({ results: [university] }),
    );
    expect(searched.universitySearchResults).toEqual([university]);

    const searchFailed = reducer(
      searching,
      CustomerActions.searchUniversitiesFailure({ error: 'search' }),
    );
    expect(searchFailed.universitySearchError).toBe('search');

    expect(
      reducer(searched, CustomerActions.clearUniversitySearch()).universitySearchResults,
    ).toEqual([]);
  });
});
