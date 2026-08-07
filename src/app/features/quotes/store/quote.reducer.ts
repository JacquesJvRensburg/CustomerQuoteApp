import { createFeature, createReducer, on } from '@ngrx/store';

import { QuoteEntity } from '../../../models/quote.model';
import { QuoteActions } from './quote.actions';

export interface QuotesState {
  quotes: QuoteEntity[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export const initialQuotesState: QuotesState = {
  quotes: [],
  loading: false,
  saving: false,
  error: null,
};

const quotesReducer = createReducer(
  initialQuotesState,
  on(QuoteActions.loadQuotes, (state) => ({
    ...state,
    loading: state.quotes.length === 0,
    error: null,
  })),
  on(QuoteActions.loadQuotesSuccess, (state, { quotes }) => ({
    ...state,
    quotes,
    loading: false,
    error: null,
  })),
  on(QuoteActions.loadQuotesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(QuoteActions.createQuote, (state) => ({
    ...state,
    saving: true,
    error: null,
  })),
  on(QuoteActions.createQuoteSuccess, (state, { quote }) => ({
    ...state,
    quotes: [...state.quotes, quote],
    saving: false,
    error: null,
  })),
  on(QuoteActions.createQuoteFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error,
  })),
  on(QuoteActions.updateQuote, QuoteActions.deleteQuote, (state) => ({
    ...state,
    saving: true,
    error: null,
  })),
  on(QuoteActions.updateQuoteSuccess, (state, { quote }) => ({
    ...state,
    quotes: state.quotes.map((existing) => (existing.id === quote.id ? quote : existing)),
    saving: false,
    error: null,
  })),
  on(QuoteActions.deleteQuoteSuccess, (state, { id }) => ({
    ...state,
    quotes: state.quotes.filter((quote) => quote.id !== id),
    saving: false,
    error: null,
  })),
  on(
    QuoteActions.updateQuoteFailure,
    QuoteActions.deleteQuoteFailure,
    (state, { error }) => ({
      ...state,
      saving: false,
      error,
    }),
  ),
);

export const quotesFeature = createFeature({
  name: 'quotes',
  reducer: quotesReducer,
});
