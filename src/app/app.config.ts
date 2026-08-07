import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { CustomerEffects } from './features/customers/store/customer.effects';
import { customersFeature } from './features/customers/store/customer.reducer';
import { QuoteEffects } from './features/quotes/store/quote.effects';
import { quotesFeature } from './features/quotes/store/quote.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideStore({
      [customersFeature.name]: customersFeature.reducer,
      [quotesFeature.name]: quotesFeature.reducer,
    }),
    provideEffects([CustomerEffects, QuoteEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
