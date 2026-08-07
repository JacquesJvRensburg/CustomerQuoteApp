import { createSelector } from '@ngrx/store';

import { quotesFeature } from './quote.reducer';

export const {
  selectQuotesState,
  selectQuotes,
  selectLoading,
  selectSaving,
  selectError,
} = quotesFeature;

export const selectQuoteTableRows = createSelector(selectQuotes, (quotes) =>
  quotes.map((quote) => ({
    id: quote.id,
    customerId: quote.customerId,
    customerFullName: quote.customerFullName,
    amount: quote.amount,
    status: quote.status,
    createdDate: quote.createdDate,
  })),
);
