import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { Quote, QuoteEntity } from '../../../models/quote.model';

export const QuoteActions = createActionGroup({
  source: 'Quotes',
  events: {
    'Load Quotes': emptyProps(),
    'Load Quotes Success': props<{ quotes: QuoteEntity[]; revision: number }>(),
    'Load Quotes Failure': props<{ error: string }>(),
    'Create Quote': props<{ quote: Quote }>(),
    'Create Quote Success': props<{ quote: QuoteEntity }>(),
    'Create Quote Failure': props<{ error: string }>(),
    'Update Quote': props<{ id: number; quote: Quote }>(),
    'Update Quote Success': props<{ quote: QuoteEntity }>(),
    'Update Quote Failure': props<{ error: string }>(),
    'Delete Quote': props<{ id: number }>(),
    'Delete Quote Success': props<{ id: number }>(),
    'Delete Quote Failure': props<{ error: string }>(),
    /** Drop in-memory quotes after a customer CASCADE delete. */
    'Remove Quotes For Customer': props<{ customerId: number }>(),
    /** Keep denormalized customer names in sync after a customer rename. */
    'Sync Customer Name On Quotes': props<{
      customerId: number;
      customerFullName: string;
    }>(),
    'Clear Mutation Error': emptyProps(),
    'Set Filter': props<{ filter: string; customerIdFilter: number | null }>(),
    'Set Pagination': props<{ pageIndex: number; pageSize: number }>(),
    'Start Quote Edit': props<{ id: number }>(),
    'Cancel Quote Edit': emptyProps(),
  },
});
