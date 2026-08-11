/** Allowed quote lifecycle statuses. */
export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected';

export const QUOTE_STATUSES: readonly QuoteStatus[] = [
  'Draft',
  'Sent',
  'Accepted',
  'Rejected',
] as const;

/** Maximum length for quote descriptions (enforced in UI and database writes). */
export const QUOTE_DESCRIPTION_MAX_LENGTH = 250;

/** Payload for creating or updating a quote. */
export interface Quote {
  customerId: number;
  amount: number;
  description: string;
  status: QuoteStatus;
}

/** Persisted quote row including generated keys and joined customer name. */
export interface QuoteEntity {
  id: number;
  customerId: number;
  customerFullName: string;
  amount: number;
  description: string;
  status: QuoteStatus;
  createdDate: string;
}
