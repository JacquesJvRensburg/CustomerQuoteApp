import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { Quote, QuoteEntity } from '../../../models/quote.model';

export const QuoteActions = createActionGroup({
  source: 'Quotes',
  events: {
    'Load Quotes': emptyProps(),
    'Load Quotes Success': props<{ quotes: QuoteEntity[] }>(),
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
    'Set Filter': props<{ filter: string; customerIdFilter: number | null }>(),
  },
});
