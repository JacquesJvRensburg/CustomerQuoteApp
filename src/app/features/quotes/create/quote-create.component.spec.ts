import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CustomerActions } from '../../customers/store/customer.actions';
import { selectCustomers } from '../../customers/store/customer.selectors';
import { QuoteActions } from '../store/quote.actions';
import { selectError, selectSaving } from '../store/quote.selectors';
import { QuoteCreateComponent } from './quote-create.component';

describe('QuoteCreateComponent', () => {
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuoteCreateComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [
            { selector: selectSaving, value: false },
            { selector: selectError, value: null },
            {
              selector: selectCustomers,
              value: [
                {
                  id: 1,
                  firstName: 'Thabo',
                  lastName: 'Molefe',
                  nationalityCode: null,
                  universityName: null,
                  universityWebsite: null,
                  addresses: [],
                },
              ],
            },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
  });

  it('should create and map customer options', () => {
    const fixture = TestBed.createComponent(QuoteCreateComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.customerOptions).toEqual([
      { id: 1, fullName: 'Thabo Molefe' },
    ]);
  });

  it('should dispatch loadCustomers on init', () => {
    const fixture = TestBed.createComponent(QuoteCreateComponent);
    fixture.detectChanges();

    expect(store.dispatch).toHaveBeenCalledWith(CustomerActions.loadCustomers());
  });

  it('should not dispatch create when the form is invalid', () => {
    const fixture = TestBed.createComponent(QuoteCreateComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    (store.dispatch as jasmine.Spy).calls.reset();

    component.submit();

    expect(component.submitted).toBeTrue();
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should dispatch createQuote when the form is valid', () => {
    const fixture = TestBed.createComponent(QuoteCreateComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    (store.dispatch as jasmine.Spy).calls.reset();

    component.form.setValue({
      customerId: 1,
      amount: 1500,
      description: 'Lorem ipsum dolor sit amet.',
      status: 'Sent',
    });
    component.submit();

    expect(store.dispatch).toHaveBeenCalledWith(
      QuoteActions.createQuote({
        quote: {
          customerId: 1,
          amount: 1500,
          description: 'Lorem ipsum dolor sit amet.',
          status: 'Sent',
        },
      }),
    );
  });
});
