import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { Customer, CustomerEntity } from '../../../models/customer.model';

export const CustomerActions = createActionGroup({
  source: 'Customers',
  events: {
    'Load Customers': emptyProps(),
    'Load Customers Success': props<{ customers: CustomerEntity[] }>(),
    'Load Customers Failure': props<{ error: string }>(),
    'Create Customer': props<{ customer: Customer }>(),
    'Create Customer Success': props<{ customer: CustomerEntity }>(),
    'Create Customer Failure': props<{ error: string }>(),
  },
});
