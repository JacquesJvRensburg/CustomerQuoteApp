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
    path: 'customers/new',
    loadComponent: () =>
      import('./features/customers/create/customer-create.component').then(
        (m) => m.CustomerCreateComponent,
      ),
  },
  {
    path: 'customers/:customerId/addresses',
    loadComponent: () =>
      import('./features/customers/addresses/customer-addresses.component').then(
        (m) => m.CustomerAddressesComponent,
      ),
  },
  {
    path: 'quotes',
    loadComponent: () =>
      import('./features/quotes/landing/quote-landing.component').then(
        (m) => m.QuoteLandingComponent,
      ),
  },
  {
    path: 'quotes/new',
    loadComponent: () =>
      import('./features/quotes/create/quote-create.component').then(
        (m) => m.QuoteCreateComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
