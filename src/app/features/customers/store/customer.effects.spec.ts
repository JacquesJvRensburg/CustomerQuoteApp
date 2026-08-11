import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';

import { CountriesService } from '../../../core/countries/countries.service';
import { DatabaseService } from '../../../core/database/database.service';
import { NationalizeService } from '../../../core/nationalize/nationalize.service';
import { UniversitiesService } from '../../../core/universities/universities.service';
import { AddressEntity } from '../../../models/address.model';
import { Country } from '../../../models/country.model';
import { Customer, CustomerEntity } from '../../../models/customer.model';
import { University } from '../../../models/university.model';
import { CustomerActions } from './customer.actions';
import { CustomerEffects } from './customer.effects';
import { initialCustomersState } from './customer.reducer';
import { selectCountries, selectCustomersDataRevision } from './customer.selectors';

describe('CustomerEffects', () => {
  let actions$: Observable<Action>;
  let effects: CustomerEffects;
  let database: jasmine.SpyObj<DatabaseService>;
  let router: jasmine.SpyObj<Router>;
  let countriesService: jasmine.SpyObj<CountriesService>;
  let nationalizeService: jasmine.SpyObj<NationalizeService>;
  let universitiesService: jasmine.SpyObj<UniversitiesService>;
  let store: MockStore;

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
    universityName: null,
    universityWebsite: null,
    addresses: [address],
  };

  const country: Country = {
    name: 'South Africa',
    flag: '🇿🇦',
    flags: { png: 'https://flagcdn.com/za.png', svg: 'https://flagcdn.com/za.svg' },
    alpha2Code: 'ZA',
  };

  const university: University = {
    name: 'University of Cape Town',
    website: 'http://www.uct.ac.za/',
  };

  beforeEach(() => {
    database = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
      'ensureSeedData',
      'getCustomers',
      'saveCustomer',
      'updateCustomerNames',
      'deleteCustomer',
      'updateAddress',
      'deleteAddress',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    countriesService = jasmine.createSpyObj<CountriesService>('CountriesService', ['getCountries']);
    nationalizeService = jasmine.createSpyObj<NationalizeService>('NationalizeService', [
      'predictNationality',
    ]);
    universitiesService = jasmine.createSpyObj<UniversitiesService>('UniversitiesService', [
      'searchUniversities',
    ]);

    TestBed.configureTestingModule({
      providers: [
        CustomerEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: { customers: initialCustomersState },
        }),
        { provide: DatabaseService, useValue: database },
        { provide: Router, useValue: router },
        { provide: CountriesService, useValue: countriesService },
        { provide: NationalizeService, useValue: nationalizeService },
        { provide: UniversitiesService, useValue: universitiesService },
      ],
    });

    effects = TestBed.inject(CustomerEffects);
    store = TestBed.inject(MockStore);
    store.overrideSelector(selectCountries, []);
    store.overrideSelector(selectCustomersDataRevision, 0);
  });

  afterEach(() => {
    store.resetSelectors();
  });

  it('should load customers after seeding', async () => {
    database.ensureSeedData.and.returnValue(of(undefined));
    database.getCustomers.and.returnValue(of([customer]));
    actions$ = of(CustomerActions.loadCustomers());

    await expectAsync(firstValueFrom(effects.loadCustomers$)).toBeResolvedTo(
      CustomerActions.loadCustomersSuccess({ customers: [customer], revision: 0 }),
    );
  });

  it('should emit loadCustomersFailure when loading fails', async () => {
    database.ensureSeedData.and.returnValue(throwError(() => new Error('db down')));
    actions$ = of(CustomerActions.loadCustomers());

    await expectAsync(firstValueFrom(effects.loadCustomers$)).toBeResolvedTo(
      CustomerActions.loadCustomersFailure({ error: 'db down' }),
    );
  });

  it('should create a customer', async () => {
    const payload: Customer = {
      firstName: 'Thabo',
      lastName: 'Molefe',
      nationalityCode: 'ZA',
      universityName: null,
      universityWebsite: null,
      addresses: [
        {
          street: '12 Long Street',
          city: 'Cape Town',
          suburb: 'City Centre',
          postalCode: '8001',
        },
      ],
    };

    database.saveCustomer.and.returnValue(of(customer));
    actions$ = of(CustomerActions.createCustomer({ customer: payload }));

    await expectAsync(firstValueFrom(effects.createCustomer$)).toBeResolvedTo(
      CustomerActions.createCustomerSuccess({ customer }),
    );
  });

  it('should navigate home after createCustomerSuccess', async () => {
    router.navigate.and.resolveTo(true);
    actions$ = of(CustomerActions.createCustomerSuccess({ customer }));

    await firstValueFrom(effects.createCustomerSuccess$);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should update a customer', async () => {
    database.updateCustomerNames.and.returnValue(of(customer));
    actions$ = of(
      CustomerActions.updateCustomer({
        id: 1,
        firstName: 'Thabo',
        lastName: 'Molefe',
        nationalityCode: 'ZA',
        universityName: null,
        universityWebsite: null,
      }),
    );

    await expectAsync(firstValueFrom(effects.updateCustomer$)).toBeResolvedTo(
      CustomerActions.updateCustomerSuccess({ customer }),
    );
  });

  it('should delete a customer', async () => {
    database.deleteCustomer.and.returnValue(of(undefined));
    actions$ = of(CustomerActions.deleteCustomer({ id: 1 }));

    await expectAsync(firstValueFrom(effects.deleteCustomer$)).toBeResolvedTo(
      CustomerActions.deleteCustomerSuccess({ id: 1 }),
    );
  });

  it('should update and delete addresses', async () => {
    database.updateAddress.and.returnValue(of(customer));
    database.deleteAddress.and.returnValue(of(customer));

    actions$ = of(CustomerActions.updateAddress({ address }));
    await expectAsync(firstValueFrom(effects.updateAddress$)).toBeResolvedTo(
      CustomerActions.updateAddressSuccess({ customer }),
    );

    actions$ = of(CustomerActions.deleteAddress({ addressId: 10 }));
    await expectAsync(firstValueFrom(effects.deleteAddress$)).toBeResolvedTo(
      CustomerActions.deleteAddressSuccess({ customer }),
    );
  });

  it('should skip the countries request when countries are already loaded', async () => {
    store.overrideSelector(selectCountries, [country]);
    store.refreshState();
    actions$ = of(CustomerActions.loadCountries());

    await expectAsync(firstValueFrom(effects.loadCountries$)).toBeResolvedTo(
      CustomerActions.loadCountriesSuccess({ countries: [country] }),
    );
    expect(countriesService.getCountries).not.toHaveBeenCalled();
  });

  it('should load countries from the service when the store is empty', async () => {
    countriesService.getCountries.and.returnValue(of([country]));
    actions$ = of(CustomerActions.loadCountries());

    await expectAsync(firstValueFrom(effects.loadCountries$)).toBeResolvedTo(
      CustomerActions.loadCountriesSuccess({ countries: [country] }),
    );
  });

  it('should join nationality predictions with country metadata', async () => {
    countriesService.getCountries.and.returnValue(of([country]));
    nationalizeService.predictNationality.and.returnValue(
      of([{ country_id: 'za', probability: 0.8 }]),
    );
    actions$ = of(CustomerActions.predictNationality({ surname: 'Molefe' }));

    await expectAsync(firstValueFrom(effects.predictNationality$)).toBeResolvedTo(
      CustomerActions.predictNationalitySuccess({
        predictions: [
          {
            name: 'South Africa',
            flag: '🇿🇦',
            flags: {
              png: 'https://flagcdn.com/za.svg',
              svg: 'https://flagcdn.com/za.svg',
            },
            alpha2Code: 'ZA',
            probability: 0.8,
          },
        ],
      }),
    );
  });

  it('should emit predictNationalityFailure when nationalize fails', async () => {
    countriesService.getCountries.and.returnValue(of([country]));
    nationalizeService.predictNationality.and.returnValue(
      throwError(() => new Error('rate limited')),
    );
    actions$ = of(CustomerActions.predictNationality({ surname: 'Molefe' }));

    await expectAsync(firstValueFrom(effects.predictNationality$)).toBeResolvedTo(
      CustomerActions.predictNationalityFailure({ error: 'rate limited' }),
    );
  });

  it('should search universities', async () => {
    universitiesService.searchUniversities.and.returnValue(of([university]));
    actions$ = of(
      CustomerActions.searchUniversities({
        countryName: 'South Africa',
        query: 'Cape',
      }),
    );

    await expectAsync(firstValueFrom(effects.searchUniversities$)).toBeResolvedTo(
      CustomerActions.searchUniversitiesSuccess({ results: [university] }),
    );
  });

  it('should map non-Error failures to generic messages', async () => {
    database.ensureSeedData.and.returnValue(throwError(() => 'oops'));
    actions$ = of(CustomerActions.loadCustomers());

    await expectAsync(firstValueFrom(effects.loadCustomers$)).toBeResolvedTo(
      CustomerActions.loadCustomersFailure({ error: 'Failed to load customers' }),
    );
  });

  it('should map create customer failures', async () => {
    database.saveCustomer.and.returnValue(throwError(() => new Error('save failed')));
    actions$ = of(
      CustomerActions.createCustomer({
        customer: {
          firstName: 'A',
          lastName: 'B',
          nationalityCode: null,
          universityName: null,
          universityWebsite: null,
          addresses: [],
        },
      }),
    );

    await expectAsync(firstValueFrom(effects.createCustomer$)).toBeResolvedTo(
      CustomerActions.createCustomerFailure({ error: 'save failed' }),
    );
  });
});