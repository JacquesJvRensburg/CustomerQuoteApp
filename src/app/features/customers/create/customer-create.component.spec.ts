import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CustomerCreateComponent } from './customer-create.component';
import { CustomerActions } from '../store/customer.actions';
import {
  selectCustomersMutationError,
  selectCustomersSaving,
  selectDraftNationalityCode,
  selectDraftUniversity,
} from '../store/customer.selectors';

describe('CustomerCreateComponent', () => {
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerCreateComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideMockStore({
          selectors: [
            { selector: selectCustomersSaving, value: false },
            { selector: selectCustomersMutationError, value: null },
            { selector: selectDraftNationalityCode, value: null },
            { selector: selectDraftUniversity, value: null },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
  });

  it('should create with one address group', () => {
    const fixture = TestBed.createComponent(CustomerCreateComponent);
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();
    expect(component.addresses.length).toBe(1);
  });

  it('should add and remove addresses', () => {
    const fixture = TestBed.createComponent(CustomerCreateComponent);
    const component = fixture.componentInstance;

    component.addAddress();
    expect(component.addresses.length).toBe(2);

    component.removeAddress(1);
    expect(component.addresses.length).toBe(1);
  });

  it('should not remove the last address', () => {
    const fixture = TestBed.createComponent(CustomerCreateComponent);
    const component = fixture.componentInstance;

    component.removeAddress(0);
    expect(component.addresses.length).toBe(1);
  });

  it('should not dispatch when the form is invalid', () => {
    const fixture = TestBed.createComponent(CustomerCreateComponent);
    const component = fixture.componentInstance;
    (store.dispatch as jasmine.Spy).calls.reset();

    component.submit();

    expect(component.submitted).toBeTrue();
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should not dispatch when nationality or university is missing', () => {
    const fixture = TestBed.createComponent(CustomerCreateComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      firstName: 'Thabo',
      lastName: 'Molefe',
      addresses: [
        {
          street: '12 Long Street',
          suburb: 'City Centre',
          city: 'Cape Town',
          postalCode: '8001',
        },
      ],
    });

    (store.dispatch as jasmine.Spy).calls.reset();
    component.submit();

    expect(component.submitted).toBeTrue();
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should dispatch createCustomer when the form is valid', () => {
    store.overrideSelector(selectDraftNationalityCode, 'ZA');
    store.overrideSelector(selectDraftUniversity, {
      name: 'University of Cape Town',
      website: 'https://www.uct.ac.za',
    });
    store.refreshState();

    const fixture = TestBed.createComponent(CustomerCreateComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      firstName: 'Thabo',
      lastName: 'Molefe',
      addresses: [
        {
          street: '12 Long Street',
          suburb: 'City Centre',
          city: 'Cape Town',
          postalCode: '8001',
        },
      ],
    });

    component.submit();

    expect(store.dispatch).toHaveBeenCalledWith(
      CustomerActions.createCustomer({
        customer: {
          firstName: 'Thabo',
          lastName: 'Molefe',
          nationalityCode: 'ZA',
          universityName: 'University of Cape Town',
          universityWebsite: 'https://www.uct.ac.za',
          addresses: [
            {
              street: '12 Long Street',
              suburb: 'City Centre',
              city: 'Cape Town',
              postalCode: '8001',
            },
          ],
        },
      }),
    );
  });
});
