/** Allowed quote lifecycle statuses. */
export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected';

export const QUOTE_STATUSES: readonly QuoteStatus[] = [
  'Draft',
  'Sent',
  'Accepted',
  'Rejected',
] as const;

/** Payload for creating or updating a quote. */
export interface Quote {
  customerId: number;
  amount: number;
  status: QuoteStatus;
}

/** Persisted quote row including generated keys and joined customer name. */
export interface QuoteEntity {
  id: number;
  customerId: number;
  customerFullName: string;
  amount: number;
  status: QuoteStatus;
  createdDate: string;
}
