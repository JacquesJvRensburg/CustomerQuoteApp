import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable, of, Subject } from 'rxjs';

import { AddressEntity } from '../../../models/address.model';
import { CustomerActions } from '../store/customer.actions';
import { CustomerAddressesComponent } from './customer-addresses.component';

describe('CustomerAddressesComponent', () => {
  let store: MockStore;
  let actions$: Subject<unknown>;
  let dialogOpen: jasmine.Spy;

  const address: AddressEntity = {
    id: 10,
    street: '12 Long Street',
    suburb: 'City Centre',
    city: 'Cape Town',
    postalCode: '8001',
  };

  const customer = {
    id: 1,
    firstName: 'Thabo',
    lastName: 'Molefe',
    addresses: [address],
  };

  beforeEach(async () => {
    actions$ = new Subject();

    await TestBed.configureTestingModule({
      imports: [CustomerAddressesComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideMockActions(() => actions$ as Observable<unknown>),
        provideMockStore({
          initialState: {
            customers: {
              customers: [customer],
              loading: false,
              saving: false,
              error: null,
              filter: '',
            },
          },
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ customerId: '1' })),
          },
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
  });

  it('should create and load customers', () => {
    const fixture = TestBed.createComponent(CustomerAddressesComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(store.dispatch).toHaveBeenCalledWith(CustomerActions.loadCustomers());
  });

  it('should enter and cancel edit mode', () => {
    const fixture = TestBed.createComponent(CustomerAddressesComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.startEdit(address);
    expect(component.editingAddressId).toBe(10);
    expect(component.editStreet).toBe('12 Long Street');

    component.cancelEdit();
    expect(component.editingAddressId).toBeNull();
    expect(component.editStreet).toBe('');
  });

  it('should not save when an edit field is blank', () => {
    const fixture = TestBed.createComponent(CustomerAddressesComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    (store.dispatch as jasmine.Spy).calls.reset();

    component.startEdit(address);
    component.editCity = ' ';
    component.saveEdit(address);

    expect(component.editAttempted).toBeTrue();
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should dispatch updateAddress when save is valid', () => {
    const fixture = TestBed.createComponent(CustomerAddressesComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    (store.dispatch as jasmine.Spy).calls.reset();

    component.startEdit(address);
    component.editStreet = '99 Main Rd';
    component.saveEdit(address);

    expect(store.dispatch).toHaveBeenCalledWith(
      CustomerActions.updateAddress({
        address: {
          id: 10,
          street: '99 Main Rd',
          suburb: 'City Centre',
          city: 'Cape Town',
          postalCode: '8001',
        },
      }),
    );
  });

  it('should cancel edit after update success', () => {
    const fixture = TestBed.createComponent(CustomerAddressesComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.startEdit(address);
    actions$.next(
      CustomerActions.updateAddressSuccess({
        customer: { ...customer, addresses: [{ ...address, street: '99 Main Rd' }] },
      }),
    );

    expect(component.editingAddressId).toBeNull();
  });

  it('should dispatch deleteAddress after dialog confirm', () => {
    const fixture = TestBed.createComponent(CustomerAddressesComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    (store.dispatch as jasmine.Spy).calls.reset();

    const dialog = (
      component as unknown as { dialog: MatDialog }
    ).dialog;
    dialogOpen = spyOn(dialog, 'open').and.returnValue({
      afterClosed: () => of(true),
    } as never);

    component.deleteAddress(address);

    expect(dialogOpen).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(
      CustomerActions.deleteAddress({ addressId: 10 }),
    );
  });
});
