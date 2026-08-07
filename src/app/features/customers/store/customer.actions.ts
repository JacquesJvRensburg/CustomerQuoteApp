import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { AddressEntity } from '../../../models/address.model';
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
    'Update Customer': props<{ id: number; firstName: string; lastName: string }>(),
    'Update Customer Success': props<{ customer: CustomerEntity }>(),
    'Update Customer Failure': props<{ error: string }>(),
    'Delete Customer': props<{ id: number }>(),
    'Delete Customer Success': props<{ id: number }>(),
    'Delete Customer Failure': props<{ error: string }>(),
    'Update Address': props<{ address: AddressEntity }>(),
    'Update Address Success': props<{ customer: CustomerEntity }>(),
    'Update Address Failure': props<{ error: string }>(),
    'Delete Address': props<{ addressId: number }>(),
    'Delete Address Success': props<{ customer: CustomerEntity }>(),
    'Delete Address Failure': props<{ error: string }>(),
    'Set Filter': props<{ filter: string }>(),
    'Start Customer Edit': props<{ id: number }>(),
    'Cancel Customer Edit': emptyProps(),
    'Start Address Edit': props<{ id: number }>(),
    'Cancel Address Edit': emptyProps(),
  },
});
