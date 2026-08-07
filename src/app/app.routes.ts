import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/customers/landing/customer-landing.component').then(
        (m) => m.CustomerLandingComponent,
      ),
  },
  {
    path: 'customers/:customerId/addresses',
    loadComponent: () =>
      import('./features/customers/addresses/customer-addresses.component').then(
        (m) => m.CustomerAddressesComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
