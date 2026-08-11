import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';

import { CustomerLandingComponent } from './customer-landing.component';
import { CustomerActions } from '../store/customer.actions';
import {
  selectCustomersFilter,
  selectCustomersLoadError,
  selectCustomersLoading,
  selectCustomersMutationError,
  selectCustomersSaving,
  selectDraftNationalityCode,
  selectDraftUniversity,
  selectEditingCustomerId,
  selectFilteredCustomerTableRows,
} from '../store/customer.selectors';

describe('CustomerLandingComponent', () => {
  let store: MockStore;
  let dialogOpen: jasmine.Spy;

  const rows = [
    {
      id: 1,
      firstName: 'Thabo',
      lastName: 'Molefe',
      nationalityCode: 'ZA',
      nationalityName: 'South Africa',
      nationalityFlagUrl: 'https://flagcdn.com/za.svg',
      universityName: null,
      universityWebsite: null,
      addressSearchText: '12 Long Street Cape Town',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerLandingComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [
            { selector: selectFilteredCustomerTableRows, value: rows },
            { selector: selectCustomersLoading, value: false },
            { selector: selectCustomersSaving, value: false },
            { selector: selectCustomersLoadError, value: null },
            { selector: selectCustomersMutationError, value: null },
            { selector: selectCustomersFilter, value: '' },
            { selector: selectEditingCustomerId, value: null },
            { selector: selectDraftNationalityCode, value: null },
            { selector: selectDraftUniversity, value: null },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
  });

  it('should create and load customers', () => {
    const fixture = TestBed.createComponent(CustomerLandingComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(store.dispatch).toHaveBeenCalledWith(CustomerActions.loadCustomers());
    expect(store.dispatch).toHaveBeenCalledWith(CustomerActions.loadCountries());
    expect(fixture.componentInstance.dataSource.data).toEqual(rows);
  });

  it('should dispatch setFilter when applying a filter', () => {
    const fixture = TestBed.createComponent(CustomerLandingComponent);
    fixture.detectChanges();
    (store.dispatch as jasmine.Spy).calls.reset();

    fixture.componentInstance.applyFilter('thabo');

    expect(store.dispatch).toHaveBeenCalledWith(
      CustomerActions.setFilter({ filter: 'thabo' }),
    );
  });

  it('should enter and cancel edit mode via store actions', () => {
    const fixture = TestBed.createComponent(CustomerLandingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    (store.dispatch as jasmine.Spy).calls.reset();

    component.startEdit(rows[0]);
    expect(store.dispatch).toHaveBeenCalledWith(
      CustomerActions.startCustomerEdit({ id: 1 }),
    );
    expect(component.editFirstName).toBe('Thabo');

    store.overrideSelector(selectEditingCustomerId, 1);
    store.refreshState();
    expect(component.editingCustomerId).toBe(1);

    (store.dispatch as jasmine.Spy).calls.reset();
    component.cancelEdit();
    expect(store.dispatch).toHaveBeenCalledWith(CustomerActions.cancelCustomerEdit());

    store.overrideSelector(selectEditingCustomerId, null);
    store.refreshState();
    expect(component.editingCustomerId).toBeNull();
    expect(component.editFirstName).toBe('');
  });

  it('should not save when edit fields are blank', () => {
    const fixture = TestBed.createComponent(CustomerLandingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.startEdit(rows[0]);
    (store.dispatch as jasmine.Spy).calls.reset();
    component.editFirstName = '   ';
    component.saveEdit(rows[0]);

    expect(component.editAttempted).toBeTrue();
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should not save when nationality or university is missing', () => {
    const fixture = TestBed.createComponent(CustomerLandingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.startEdit(rows[0]);
    (store.dispatch as jasmine.Spy).calls.reset();
    component.editFirstName = 'Sara';
    component.editLastName = 'Molefe';
    component.saveEdit(rows[0]);

    expect(component.editAttempted).toBeTrue();
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should dispatch updateCustomer when save is valid', () => {
    store.overrideSelector(selectDraftNationalityCode, 'ZA');
    store.overrideSelector(selectDraftUniversity, {
      name: 'University of Cape Town',
      website: 'https://www.uct.ac.za',
    });
    store.refreshState();

    const fixture = TestBed.createComponent(CustomerLandingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.startEdit(rows[0]);
    (store.dispatch as jasmine.Spy).calls.reset();
    component.editFirstName = 'Sara';
    component.editLastName = 'Molefe';
    component.saveEdit(rows[0]);

    expect(store.dispatch).toHaveBeenCalledWith(
      CustomerActions.updateCustomer({
        id: 1,
        firstName: 'Sara',
        lastName: 'Molefe',
        nationalityCode: 'ZA',
        universityName: 'University of Cape Town',
        universityWebsite: 'https://www.uct.ac.za',
      }),
    );
  });

  it('should clear draft fields when editing id becomes null', () => {
    const fixture = TestBed.createComponent(CustomerLandingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.startEdit(rows[0]);
    store.overrideSelector(selectEditingCustomerId, 1);
    store.refreshState();

    store.overrideSelector(selectEditingCustomerId, null);
    store.refreshState();

    expect(component.editFirstName).toBe('');
    expect(component.editLastName).toBe('');
    expect(component.editAttempted).toBeFalse();
  });

  it('should dispatch deleteCustomer after dialog confirm', () => {
    const fixture = TestBed.createComponent(CustomerLandingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    (store.dispatch as jasmine.Spy).calls.reset();

    const dialog = (
      component as unknown as { dialog: MatDialog }
    ).dialog;
    dialogOpen = spyOn(dialog, 'open').and.returnValue({
      afterClosed: () => of(true),
    } as never);

    component.deleteCustomer(rows[0]);

    expect(dialogOpen).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(
      CustomerActions.deleteCustomer({ id: 1 }),
    );
  });
});
