import { QuoteEntity } from '../../../models/quote.model';
import { QuoteActions } from './quote.actions';
import { initialQuotesState, quotesFeature, QuotesState } from './quote.reducer';

describe('quotesReducer', () => {
  const reducer = quotesFeature.reducer;

  const quote: QuoteEntity = {
    id: 1,
    customerId: 10,
    customerFullName: 'Thabo Molefe',
    amount: 1000,
    description: 'Initial quote',
    status: 'Draft',
    createdDate: '2026-01-01T00:00:00.000Z',
  };

  it('should return the initial state for an unknown action', () => {
    expect(reducer(undefined, { type: 'Unknown' })).toEqual(initialQuotesState);
  });

  it('should set loading only when no quotes are cached', () => {
    expect(reducer(initialQuotesState, QuoteActions.loadQuotes()).loading).toBeTrue();

    const withQuotes: QuotesState = {
      ...initialQuotesState,
      quotes: [quote],
    };
    expect(reducer(withQuotes, QuoteActions.loadQuotes()).loading).toBeFalse();
  });

  it('should load quotes successfully', () => {
    const state = reducer(
      { ...initialQuotesState, loading: true },
      QuoteActions.loadQuotesSuccess({ quotes: [quote], revision: 0 }),
    );

    expect(state.quotes).toEqual([quote]);
    expect(state.loading).toBeFalse();
    expect(state.loadError).toBeNull();
  });

  it('should discard stale load snapshots after a newer mutation revision', () => {
    const previous: QuotesState = {
      ...initialQuotesState,
      quotes: [quote],
      dataRevision: 1,
      loading: true,
    };

    const state = reducer(
      previous,
      QuoteActions.loadQuotesSuccess({
        quotes: [{ ...quote, description: 'stale' }],
        revision: 0,
      }),
    );

    expect(state.quotes).toEqual([quote]);
    expect(state.loading).toBeFalse();
  });

  it('should remove quotes for a deleted customer and clear related UI state', () => {
    const other = { ...quote, id: 2, customerId: 99, customerFullName: 'Other' };
    const state = reducer(
      {
        ...initialQuotesState,
        quotes: [quote, other],
        editingQuoteId: 1,
        customerIdFilter: 10,
      },
      QuoteActions.removeQuotesForCustomer({ customerId: 10 }),
    );

    expect(state.quotes).toEqual([other]);
    expect(state.editingQuoteId).toBeNull();
    expect(state.customerIdFilter).toBeNull();
  });

  it('should sync denormalized customer names on quotes', () => {
    const other = { ...quote, id: 2, customerId: 99, customerFullName: 'Other' };
    const state = reducer(
      { ...initialQuotesState, quotes: [quote, other] },
      QuoteActions.syncCustomerNameOnQuotes({
        customerId: 10,
        customerFullName: 'Teboho Molefe',
      }),
    );

    expect(state.quotes[0].customerFullName).toBe('Teboho Molefe');
    expect(state.quotes[1].customerFullName).toBe('Other');
  });

  it('should keep saving true until all pending mutations finish', () => {
    const first = reducer(initialQuotesState, QuoteActions.deleteQuote({ id: 1 }));
    const second = reducer(
      first,
      QuoteActions.updateQuote({
        id: 2,
        quote: {
          customerId: 10,
          amount: 1,
          description: 'x',
          status: 'Draft',
        },
      }),
    );

    expect(second.pendingMutations).toBe(2);
    expect(second.saving).toBeTrue();

    const afterFirst = reducer(second, QuoteActions.deleteQuoteSuccess({ id: 1 }));
    expect(afterFirst.pendingMutations).toBe(1);
    expect(afterFirst.saving).toBeTrue();
  });

  it('should store a load failure', () => {
    const state = reducer(
      { ...initialQuotesState, loading: true },
      QuoteActions.loadQuotesFailure({ error: 'boom' }),
    );

    expect(state.loading).toBeFalse();
    expect(state.loadError).toBe('boom');
  });

  it('should create a quote at the front of the list', () => {
    const existing = { ...quote, id: 2 };
    const state = reducer(
      { ...initialQuotesState, quotes: [existing], saving: true },
      QuoteActions.createQuoteSuccess({ quote }),
    );

    expect(state.quotes).toEqual([quote, existing]);
    expect(state.saving).toBeFalse();
  });

  it('should update a quote and clear editing', () => {
    const updated = { ...quote, amount: 2500, status: 'Sent' as const };
    const state = reducer(
      {
        ...initialQuotesState,
        quotes: [quote],
        editingQuoteId: 1,
        saving: true,
      },
      QuoteActions.updateQuoteSuccess({ quote: updated }),
    );

    expect(state.quotes[0]).toEqual(updated);
    expect(state.editingQuoteId).toBeNull();
    expect(state.saving).toBeFalse();
  });

  it('should delete a quote and clear editing when that quote was being edited', () => {
    const state = reducer(
      {
        ...initialQuotesState,
        quotes: [quote],
        editingQuoteId: 1,
        saving: true,
      },
      QuoteActions.deleteQuoteSuccess({ id: 1 }),
    );

    expect(state.quotes).toEqual([]);
    expect(state.editingQuoteId).toBeNull();
  });

  it('should set saving on create/update/delete and store mutation failures', () => {
    const creating = reducer(
      { ...initialQuotesState, mutationError: 'old' },
      QuoteActions.createQuote({
        quote: {
          customerId: 1,
          amount: 1,
          description: 'x',
          status: 'Draft',
        },
      }),
    );
    expect(creating.saving).toBeTrue();
    expect(creating.mutationError).toBeNull();

    const failed = reducer(
      { ...initialQuotesState, saving: true },
      QuoteActions.updateQuoteFailure({ error: 'nope' }),
    );
    expect(failed.saving).toBeFalse();
    expect(failed.mutationError).toBe('nope');
    expect(reducer(failed, QuoteActions.clearMutationError()).mutationError).toBeNull();
  });

  it('should set filters and editing state', () => {
    const filtered = reducer(
      { ...initialQuotesState, pageIndex: 2 },
      QuoteActions.setFilter({ filter: 'thabo', customerIdFilter: 10 }),
    );
    expect(filtered.filter).toBe('thabo');
    expect(filtered.customerIdFilter).toBe(10);
    expect(filtered.pageIndex).toBe(0);

    const paged = reducer(
      initialQuotesState,
      QuoteActions.setPagination({ pageIndex: 3, pageSize: 10 }),
    );
    expect(paged.pageIndex).toBe(3);
    expect(paged.pageSize).toBe(10);

    expect(reducer(initialQuotesState, QuoteActions.startQuoteEdit({ id: 1 })).editingQuoteId)
      .toBe(1);
    expect(
      reducer(
        { ...initialQuotesState, editingQuoteId: 1 },
        QuoteActions.cancelQuoteEdit(),
      ).editingQuoteId,
    ).toBeNull();
  });
});
