import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { AddressEntity } from '../../../models/address.model';
import { Country, CountryPrediction } from '../../../models/country.model';
import { Customer, CustomerEntity } from '../../../models/customer.model';
import { University } from '../../../models/university.model';

export const CustomerActions = createActionGroup({
  source: 'Customers',
  events: {
    'Load Customers': emptyProps(),
    'Load Customers Success': props<{ customers: CustomerEntity[]; revision: number }>(),
    'Load Customers Failure': props<{ error: string }>(),
    'Create Customer': props<{ customer: Customer }>(),
    'Create Customer Success': props<{ customer: CustomerEntity }>(),
    'Create Customer Failure': props<{ error: string }>(),
    'Update Customer': props<{
      id: number;
      firstName: string;
      lastName: string;
      nationalityCode: string | null;
      universityName: string | null;
      universityWebsite: string | null;
    }>(),
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
    'Clear Mutation Error': emptyProps(),
    'Set Filter': props<{ filter: string }>(),
    'Set Pagination': props<{ pageIndex: number; pageSize: number }>(),
    'Start Customer Edit': props<{ id: number }>(),
    'Cancel Customer Edit': emptyProps(),
    'Start Address Edit': props<{ id: number }>(),
    'Cancel Address Edit': emptyProps(),
    // Nationality panel
    'Set Draft Nationality': props<{ nationalityCode: string | null }>(),
    'Load Countries': emptyProps(),
    'Load Countries Success': props<{ countries: Country[] }>(),
    'Load Countries Failure': props<{ error: string }>(),
    'Predict Nationality': props<{ surname: string }>(),
    'Predict Nationality Success': props<{ predictions: CountryPrediction[] }>(),
    'Predict Nationality Failure': props<{ error: string }>(),
    'Clear Nationality Predictions': emptyProps(),
    // University search
    'Set Draft University': props<{ university: University | null }>(),
    'Search Universities': props<{ countryName: string; query: string }>(),
    'Search Universities Success': props<{ results: University[] }>(),
    'Search Universities Failure': props<{ error: string }>(),
    'Clear University Search': emptyProps(),
  },
});
