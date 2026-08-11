import { createFeature, createReducer, on } from '@ngrx/store';

import { QuoteEntity } from '../../../models/quote.model';
import { QuoteActions } from './quote.actions';

export interface QuotesState {
  quotes: QuoteEntity[];
  /** Bumped on successful mutations so in-flight loads can discard stale snapshots. */
  dataRevision: number;
  /** In-flight create/update/delete operations; drives `saving`. */
  pendingMutations: number;
  loading: boolean;
  saving: boolean;
  loadError: string | null;
  mutationError: string | null;
  filter: string;
  customerIdFilter: number | null;
  editingQuoteId: number | null;
}

export const initialQuotesState: QuotesState = {
  quotes: [],
  dataRevision: 0,
  pendingMutations: 0,
  loading: false,
  saving: false,
  loadError: null,
  mutationError: null,
  filter: '',
  customerIdFilter: null,
  editingQuoteId: null,
};

function beginMutation(state: QuotesState): QuotesState {
  const pendingMutations = state.pendingMutations + 1;
  return {
    ...state,
    pendingMutations,
    saving: true,
    mutationError: null,
  };
}

function endMutation(state: QuotesState, patch: Partial<QuotesState> = {}): QuotesState {
  const pendingMutations = Math.max(0, state.pendingMutations - 1);
  return {
    ...state,
    ...patch,
    pendingMutations,
    saving: pendingMutations > 0,
  };
}

const quotesReducer = createReducer(
  initialQuotesState,
  on(QuoteActions.loadQuotes, (state) => ({
    ...state,
    loading: state.quotes.length === 0,
    loadError: null,
  })),
  on(QuoteActions.loadQuotesSuccess, (state, { quotes, revision }) => {
    if (revision !== state.dataRevision) {
      return {
        ...state,
        loading: false,
        loadError: null,
      };
    }

    return {
      ...state,
      quotes,
      loading: false,
      loadError: null,
    };
  }),
  on(QuoteActions.loadQuotesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    loadError: error,
  })),
  on(QuoteActions.createQuote, beginMutation),
  on(QuoteActions.createQuoteSuccess, (state, { quote }) =>
    endMutation(state, {
      quotes: [quote, ...state.quotes],
      dataRevision: state.dataRevision + 1,
      mutationError: null,
    }),
  ),
  on(QuoteActions.createQuoteFailure, (state, { error }) =>
    endMutation(state, { mutationError: error }),
  ),
  on(QuoteActions.updateQuote, QuoteActions.deleteQuote, beginMutation),
  on(QuoteActions.updateQuoteSuccess, (state, { quote }) =>
    endMutation(state, {
      quotes: state.quotes.map((existing) => (existing.id === quote.id ? quote : existing)),
      dataRevision: state.dataRevision + 1,
      mutationError: null,
      editingQuoteId: null,
    }),
  ),
  on(QuoteActions.deleteQuoteSuccess, (state, { id }) =>
    endMutation(state, {
      quotes: state.quotes.filter((quote) => quote.id !== id),
      dataRevision: state.dataRevision + 1,
      mutationError: null,
      editingQuoteId: state.editingQuoteId === id ? null : state.editingQuoteId,
    }),
  ),
  on(QuoteActions.updateQuoteFailure, QuoteActions.deleteQuoteFailure, (state, { error }) =>
    endMutation(state, { mutationError: error }),
  ),
  on(QuoteActions.removeQuotesForCustomer, (state, { customerId }) => {
    const removedIds = new Set(
      state.quotes.filter((quote) => quote.customerId === customerId).map((quote) => quote.id),
    );

    return {
      ...state,
      quotes: state.quotes.filter((quote) => quote.customerId !== customerId),
      dataRevision: state.dataRevision + 1,
      editingQuoteId:
        state.editingQuoteId !== null && removedIds.has(state.editingQuoteId)
          ? null
          : state.editingQuoteId,
      customerIdFilter: state.customerIdFilter === customerId ? null : state.customerIdFilter,
    };
  }),
  on(QuoteActions.syncCustomerNameOnQuotes, (state, { customerId, customerFullName }) => ({
    ...state,
    dataRevision: state.dataRevision + 1,
    quotes: state.quotes.map((quote) =>
      quote.customerId === customerId ? { ...quote, customerFullName } : quote,
    ),
  })),
  on(QuoteActions.clearMutationError, (state) => ({
    ...state,
    mutationError: null,
  })),
  on(QuoteActions.setFilter, (state, { filter, customerIdFilter }) => ({
    ...state,
    filter,
    customerIdFilter,
  })),
  on(QuoteActions.startQuoteEdit, (state, { id }) => ({
    ...state,
    editingQuoteId: id,
  })),
  on(QuoteActions.cancelQuoteEdit, (state) => ({
    ...state,
    editingQuoteId: null,
  })),
);

export const quotesFeature = createFeature({
  name: 'quotes',
  reducer: quotesReducer,
});
