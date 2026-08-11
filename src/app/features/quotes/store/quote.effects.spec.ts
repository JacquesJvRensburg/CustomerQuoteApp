import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';

import { DatabaseService } from '../../../core/database/database.service';
import { CustomerEntity } from '../../../models/customer.model';
import { Quote, QuoteEntity } from '../../../models/quote.model';
import { CustomerActions } from '../../customers/store/customer.actions';
import { QuoteActions } from './quote.actions';
import { QuoteEffects } from './quote.effects';
import { initialQuotesState } from './quote.reducer';
import { selectQuotesDataRevision } from './quote.selectors';

describe('QuoteEffects', () => {
  let actions$: Observable<Action>;
  let effects: QuoteEffects;
  let database: jasmine.SpyObj<DatabaseService>;
  let router: jasmine.SpyObj<Router>;
  let store: MockStore;

  const quote: QuoteEntity = {
    id: 1,
    customerId: 10,
    customerFullName: 'Thabo Molefe',
    amount: 1000,
    description: 'Initial quote',
    status: 'Draft',
    createdDate: '2026-01-01T00:00:00.000Z',
  };

  const quoteInput: Quote = {
    customerId: 10,
    amount: 1000,
    description: 'Initial quote',
    status: 'Draft',
  };

  const customer: CustomerEntity = {
    id: 10,
    firstName: 'Teboho',
    lastName: 'Molefe',
    nationalityCode: 'ZA',
    universityName: null,
    universityWebsite: null,
    addresses: [],
  };

  beforeEach(() => {
    database = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
      'ensureSeedData',
      'getQuotes',
      'saveQuote',
      'updateQuote',
      'deleteQuote',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        QuoteEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: { quotes: initialQuotesState },
        }),
        { provide: DatabaseService, useValue: database },
        { provide: Router, useValue: router },
      ],
    });

    effects = TestBed.inject(QuoteEffects);
    store = TestBed.inject(MockStore);
    store.overrideSelector(selectQuotesDataRevision, 0);
  });

  it('should load quotes after seeding', async () => {
    database.ensureSeedData.and.returnValue(of(undefined));
    database.getQuotes.and.returnValue(of([quote]));
    actions$ = of(QuoteActions.loadQuotes());

    await expectAsync(firstValueFrom(effects.loadQuotes$)).toBeResolvedTo(
      QuoteActions.loadQuotesSuccess({ quotes: [quote], revision: 0 }),
    );
  });

  it('should remove quotes when a customer is deleted', async () => {
    actions$ = of(CustomerActions.deleteCustomerSuccess({ id: 10 }));

    await expectAsync(firstValueFrom(effects.removeQuotesForDeletedCustomer$)).toBeResolvedTo(
      QuoteActions.removeQuotesForCustomer({ customerId: 10 }),
    );
  });

  it('should sync quote customer names when a customer is updated', async () => {
    actions$ = of(CustomerActions.updateCustomerSuccess({ customer }));

    await expectAsync(firstValueFrom(effects.syncQuoteCustomerNames$)).toBeResolvedTo(
      QuoteActions.syncCustomerNameOnQuotes({
        customerId: 10,
        customerFullName: 'Teboho Molefe',
      }),
    );
  });

  it('should emit loadQuotesFailure when loading fails', async () => {
    database.ensureSeedData.and.returnValue(throwError(() => new Error('db down')));
    actions$ = of(QuoteActions.loadQuotes());

    await expectAsync(firstValueFrom(effects.loadQuotes$)).toBeResolvedTo(
      QuoteActions.loadQuotesFailure({ error: 'db down' }),
    );
  });

  it('should create a quote', async () => {
    database.saveQuote.and.returnValue(of(quote));
    actions$ = of(QuoteActions.createQuote({ quote: quoteInput }));

    await expectAsync(firstValueFrom(effects.createQuote$)).toBeResolvedTo(
      QuoteActions.createQuoteSuccess({ quote }),
    );
  });

  it('should navigate to quotes after createQuoteSuccess', async () => {
    router.navigate.and.resolveTo(true);
    actions$ = of(QuoteActions.createQuoteSuccess({ quote }));

    await firstValueFrom(effects.createQuoteSuccess$);
    expect(router.navigate).toHaveBeenCalledWith(['/quotes']);
  });

  it('should update a quote', async () => {
    database.updateQuote.and.returnValue(of(quote));
    actions$ = of(QuoteActions.updateQuote({ id: 1, quote: quoteInput }));

    await expectAsync(firstValueFrom(effects.updateQuote$)).toBeResolvedTo(
      QuoteActions.updateQuoteSuccess({ quote }),
    );
  });

  it('should delete a quote', async () => {
    database.deleteQuote.and.returnValue(of(undefined));
    actions$ = of(QuoteActions.deleteQuote({ id: 1 }));

    await expectAsync(firstValueFrom(effects.deleteQuote$)).toBeResolvedTo(
      QuoteActions.deleteQuoteSuccess({ id: 1 }),
    );
  });

  it('should map mutation failures to failure actions', async () => {
    database.saveQuote.and.returnValue(throwError(() => new Error('save failed')));
    actions$ = of(QuoteActions.createQuote({ quote: quoteInput }));
    await expectAsync(firstValueFrom(effects.createQuote$)).toBeResolvedTo(
      QuoteActions.createQuoteFailure({ error: 'save failed' }),
    );

    database.updateQuote.and.returnValue(throwError(() => 'update failed'));
    actions$ = of(QuoteActions.updateQuote({ id: 1, quote: quoteInput }));
    await expectAsync(firstValueFrom(effects.updateQuote$)).toBeResolvedTo(
      QuoteActions.updateQuoteFailure({ error: 'Failed to update quote' }),
    );

    database.deleteQuote.and.returnValue(throwError(() => new Error('delete failed')));
    actions$ = of(QuoteActions.deleteQuote({ id: 1 }));
    await expectAsync(firstValueFrom(effects.deleteQuote$)).toBeResolvedTo(
      QuoteActions.deleteQuoteFailure({ error: 'delete failed' }),
    );
  });
});
