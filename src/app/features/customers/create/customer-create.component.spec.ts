import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CustomerCreateComponent } from './customer-create.component';
import { CustomerActions } from '../store/customer.actions';
import { selectError, selectSaving } from '../store/customer.selectors';

describe('CustomerCreateComponent', () => {
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerCreateComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [
            { selector: selectSaving, value: false },
            { selector: selectError, value: null },
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

    component.submit();

    expect(component.submitted).toBeTrue();
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should dispatch createCustomer when the form is valid', () => {
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
