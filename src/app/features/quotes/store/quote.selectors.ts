import { createSelector } from '@ngrx/store';

import { quotesFeature } from './quote.reducer';

export const {
  selectQuotesState,
  selectQuotes,
  selectLoading,
  selectSaving,
  selectError,
  selectFilter,
  selectCustomerIdFilter,
  selectEditingQuoteId,
} = quotesFeature;

export const selectQuoteTableRows = createSelector(selectQuotes, (quotes) =>
  quotes.map((quote) => ({
    id: quote.id,
    customerId: quote.customerId,
    customerFullName: quote.customerFullName,
    amount: quote.amount,
    description: quote.description,
    status: quote.status,
    createdDate: quote.createdDate,
  })),
);
