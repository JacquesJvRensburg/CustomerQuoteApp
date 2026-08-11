import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of, Subject } from 'rxjs';

import { QuoteLandingComponent } from './quote-landing.component';
import { QuoteActions } from '../store/quote.actions';
import {
  selectCustomerIdFilter,
  selectEditingQuoteId,
  selectFilteredQuotes,
  selectQuotesFilter,
  selectQuotesLoadError,
  selectQuotesLoading,
  selectQuotesMutationError,
  selectQuotesSaving,
} from '../store/quote.selectors';

describe('QuoteLandingComponent', () => {
  let store: MockStore;
  let dialogOpen: jasmine.Spy;
  let queryParamMap$: Subject<ReturnType<typeof convertToParamMap>>;

  const rows = [
    {
      id: 1,
      customerId: 2,
      customerFullName: 'Sarah van Wyk',
      amount: 1500,
      description: 'Lorem ipsum dolor sit amet.',
      status: 'Draft' as const,
      createdDate: '2026-01-01T00:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    queryParamMap$ = new Subject();

    await TestBed.configureTestingModule({
      imports: [QuoteLandingComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [
            { selector: selectFilteredQuotes, value: rows },
            { selector: selectQuotesLoading, value: false },
            { selector: selectQuotesSaving, value: false },
            { selector: selectQuotesLoadError, value: null },
            { selector: selectQuotesMutationError, value: null },
            { selector: selectQuotesFilter, value: '' },
            { selector: selectCustomerIdFilter, value: null },
            { selector: selectEditingQuoteId, value: null },
          ],
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamMap$.asObservable(),
          },
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
  });

  it('should create and load quotes', () => {
    const fixture = TestBed.createComponent(QuoteLandingComponent);
    fixture.detectChanges();
    queryParamMap$.next(convertToParamMap({}));

    expect(fixture.componentInstance).toBeTruthy();
    expect(store.dispatch).toHaveBeenCalledWith(QuoteActions.loadQuotes());
    expect(fixture.componentInstance.dataSource.data).toEqual(rows);
  });

  it('should set customer id filter from query params', () => {
    const fixture = TestBed.createComponent(QuoteLandingComponent);
    fixture.detectChanges();
    (store.dispatch as jasmine.Spy).calls.reset();

    queryParamMap$.next(convertToParamMap({ customerId: '2' }));

    expect(store.dispatch).toHaveBeenCalledWith(
      QuoteActions.setFilter({
        filter: '2',
        customerIdFilter: 2,
      }),
    );
  });

  it('should clear sticky customer id filter when query param is absent', () => {
    store.overrideSelector(selectCustomerIdFilter, 2);
    store.overrideSelector(selectQuotesFilter, '2');
    store.refreshState();

    const fixture = TestBed.createComponent(QuoteLandingComponent);
    fixture.detectChanges();
    (store.dispatch as jasmine.Spy).calls.reset();

    queryParamMap$.next(convertToParamMap({}));

    expect(store.dispatch).toHaveBeenCalledWith(
      QuoteActions.setFilter({
        filter: '',
        customerIdFilter: null,
      }),
    );
  });

  it('should clear customer id filter when the user changes the text filter', () => {
    store.overrideSelector(selectCustomerIdFilter, 2);
    store.overrideSelector(selectQuotesFilter, '2');
    store.refreshState();

    const fixture = TestBed.createComponent(QuoteLandingComponent);
    fixture.detectChanges();
    queryParamMap$.next(convertToParamMap({}));
    (store.dispatch as jasmine.Spy).calls.reset();

    fixture.componentInstance.applyFilter('draft');

    expect(store.dispatch).toHaveBeenCalledWith(
      QuoteActions.setFilter({
        filter: 'draft',
        customerIdFilter: null,
      }),
    );
  });

  it('should enter and cancel edit mode via store actions', () => {
    const fixture = TestBed.createComponent(QuoteLandingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    queryParamMap$.next(convertToParamMap({}));
    (store.dispatch as jasmine.Spy).calls.reset();

    component.startEdit(rows[0]);
    expect(store.dispatch).toHaveBeenCalledWith(QuoteActions.startQuoteEdit({ id: 1 }));
    expect(component.editAmount).toBe('1500');

    store.overrideSelector(selectEditingQuoteId, 1);
    store.refreshState();
    expect(component.editingQuoteId).toBe(1);

    (store.dispatch as jasmine.Spy).calls.reset();
    component.cancelEdit();
    expect(store.dispatch).toHaveBeenCalledWith(QuoteActions.cancelQuoteEdit());

    store.overrideSelector(selectEditingQuoteId, null);
    store.refreshState();
    expect(component.editingQuoteId).toBeNull();
    expect(component.editAmount).toBe('');
  });

  it('should not save when amount is invalid', () => {
    const fixture = TestBed.createComponent(QuoteLandingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    queryParamMap$.next(convertToParamMap({}));

    component.startEdit(rows[0]);
    (store.dispatch as jasmine.Spy).calls.reset();
    component.editAmount = '';
    component.saveEdit(rows[0]);

    expect(component.editAttempted).toBeTrue();
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should dispatch updateQuote when save is valid', () => {
    const fixture = TestBed.createComponent(QuoteLandingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    queryParamMap$.next(convertToParamMap({}));

    component.startEdit(rows[0]);
    (store.dispatch as jasmine.Spy).calls.reset();
    component.editAmount = '2000.5';
    component.editDescription = 'Updated quote description.';
    component.editStatus = 'Sent';
    component.saveEdit(rows[0]);

    expect(store.dispatch).toHaveBeenCalledWith(
      QuoteActions.updateQuote({
        id: 1,
        quote: {
          customerId: 2,
          amount: 2000.5,
          description: 'Updated quote description.',
          status: 'Sent',
        },
      }),
    );
  });

  it('should dispatch deleteQuote after dialog confirm', () => {
    const fixture = TestBed.createComponent(QuoteLandingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    queryParamMap$.next(convertToParamMap({}));
    (store.dispatch as jasmine.Spy).calls.reset();

    const dialog = (
      component as unknown as { dialog: MatDialog }
    ).dialog;
    dialogOpen = spyOn(dialog, 'open').and.returnValue({
      afterClosed: () => of(true),
    } as never);

    component.deleteQuote(rows[0]);

    expect(dialogOpen).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(QuoteActions.deleteQuote({ id: 1 }));
  });
});
