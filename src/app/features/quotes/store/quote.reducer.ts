import { createFeature, createReducer, on } from '@ngrx/store';

import { QuoteEntity } from '../../../models/quote.model';
import { QuoteActions } from './quote.actions';

export interface QuotesState {
  quotes: QuoteEntity[];
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
  loading: false,
  saving: false,
  loadError: null,
  mutationError: null,
  filter: '',
  customerIdFilter: null,
  editingQuoteId: null,
};

const quotesReducer = createReducer(
  initialQuotesState,
  on(QuoteActions.loadQuotes, (state) => ({
    ...state,
    loading: state.quotes.length === 0,
    loadError: null,
  })),
  on(QuoteActions.loadQuotesSuccess, (state, { quotes }) => ({
    ...state,
    quotes,
    loading: false,
    loadError: null,
  })),
  on(QuoteActions.loadQuotesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    loadError: error,
  })),
  on(QuoteActions.createQuote, (state) => ({
    ...state,
    saving: true,
    mutationError: null,
  })),
  on(QuoteActions.createQuoteSuccess, (state, { quote }) => ({
    ...state,
    quotes: [quote, ...state.quotes],
    saving: false,
    mutationError: null,
  })),
  on(QuoteActions.createQuoteFailure, (state, { error }) => ({
    ...state,
    saving: false,
    mutationError: error,
  })),
  on(QuoteActions.updateQuote, QuoteActions.deleteQuote, (state) => ({
    ...state,
    saving: true,
    mutationError: null,
  })),
  on(QuoteActions.updateQuoteSuccess, (state, { quote }) => ({
    ...state,
    quotes: state.quotes.map((existing) => (existing.id === quote.id ? quote : existing)),
    saving: false,
    mutationError: null,
    editingQuoteId: null,
  })),
  on(QuoteActions.deleteQuoteSuccess, (state, { id }) => ({
    ...state,
    quotes: state.quotes.filter((quote) => quote.id !== id),
    saving: false,
    mutationError: null,
    editingQuoteId: state.editingQuoteId === id ? null : state.editingQuoteId,
  })),
  on(
    QuoteActions.updateQuoteFailure,
    QuoteActions.deleteQuoteFailure,
    (state, { error }) => ({
      ...state,
      saving: false,
      mutationError: error,
    }),
  ),
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
