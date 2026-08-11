import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
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
import { sanitizeFlagImageUrl } from './shared/utils/safe-url.util';

/** Allowlisted flag CDN URLs only (see sanitizeFlagImageUrl). */
function passthroughImageLoader(config: ImageLoaderConfig): string {
  return sanitizeFlagImageUrl(config.src);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    { provide: IMAGE_LOADER, useValue: passthroughImageLoader },
    provideStore({
      [customersFeature.name]: customersFeature.reducer,
      [quotesFeature.name]: quotesFeature.reducer,
    }),
    provideEffects([CustomerEffects, QuoteEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
