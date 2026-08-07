import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable, of, Subject } from 'rxjs';

import { CustomerLandingComponent } from './customer-landing.component';
import { CustomerActions } from '../store/customer.actions';
import {
  selectCustomerTableRows,
  selectError,
  selectFilter,
  selectLoading,
  selectSaving,
} from '../store/customer.selectors';

describe('CustomerLandingComponent', () => {
  let store: MockStore;
  let actions$: Subject<unknown>;
  let dialogOpen: jasmine.Spy;

  const rows = [
    {
      id: 1,
      firstName: 'Thabo',
      lastName: 'Molefe',
      addressSearchText: '12 Long Street Cape Town',
    },
  ];

  beforeEach(async () => {
    actions$ = new Subject();

    await TestBed.configureTestingModule({
      imports: [CustomerLandingComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideMockActions(() => actions$ as Observable<unknown>),
        provideMockStore({
          selectors: [
            { selector: selectCustomerTableRows, value: rows },
            { selector: selectLoading, value: false },
            { selector: selectSaving, value: false },
            { selector: selectError, value: null },
            { selector: selectFilter, value: '' },
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

  it('should enter and cancel edit mode', () => {
    const fixture = TestBed.createComponent(CustomerLandingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.startEdit(rows[0]);
    expect(component.editingCustomerId).toBe(1);
    expect(component.editFirstName).toBe('Thabo');

    component.cancelEdit();
    expect(component.editingCustomerId).toBeNull();
    expect(component.editFirstName).toBe('');
  });

  it('should not save when edit fields are blank', () => {
    const fixture = TestBed.createComponent(CustomerLandingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    (store.dispatch as jasmine.Spy).calls.reset();

    component.startEdit(rows[0]);
    component.editFirstName = '   ';
    component.saveEdit(rows[0]);

    expect(component.editAttempted).toBeTrue();
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should dispatch updateCustomer when save is valid', () => {
    const fixture = TestBed.createComponent(CustomerLandingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    (store.dispatch as jasmine.Spy).calls.reset();

    component.startEdit(rows[0]);
    component.editFirstName = 'Sara';
    component.editLastName = 'Molefe';
    component.saveEdit(rows[0]);

    expect(store.dispatch).toHaveBeenCalledWith(
      CustomerActions.updateCustomer({
        id: 1,
        firstName: 'Sara',
        lastName: 'Molefe',
      }),
    );
  });

  it('should cancel edit after update success', () => {
    const fixture = TestBed.createComponent(CustomerLandingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.startEdit(rows[0]);
    actions$.next(CustomerActions.updateCustomerSuccess({
      customer: {
        id: 1,
        firstName: 'Sara',
        lastName: 'Molefe',
        addresses: [],
      },
    }));

    expect(component.editingCustomerId).toBeNull();
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
