import { createSelector } from '@ngrx/store';

import { quotesFeature } from './quote.reducer';

export const {
  selectQuotesState,
  selectQuotes,
  selectLoading: selectQuotesLoading,
  selectSaving: selectQuotesSaving,
  selectLoadError: selectQuotesLoadError,
  selectMutationError: selectQuotesMutationError,
  selectFilter: selectQuotesFilter,
  selectCustomerIdFilter,
  selectEditingQuoteId,
} = quotesFeature;

export const selectFilteredQuotes = createSelector(
  selectQuotes,
  selectQuotesFilter,
  selectCustomerIdFilter,
  (quotes, filterValue, customerIdFilter) => {
    if (customerIdFilter !== null) {
      return quotes.filter((quote) => quote.customerId === customerIdFilter);
    }

    const term = filterValue.trim().toLowerCase();
    if (!term) {
      return quotes;
    }

    return quotes.filter((quote) =>
      [
        String(quote.customerId),
        quote.customerFullName,
        quote.description,
        quote.status,
        String(quote.amount),
        quote.createdDate,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  },
);
