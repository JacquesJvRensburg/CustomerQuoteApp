import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export type FeatureSwitcherValue = 'customers' | 'quotes';

@Component({
  selector: 'app-feature-switcher',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div
      class="inline-flex rounded-xl border border-slate-200/90 bg-slate-100/80 p-1 shadow-inner shadow-slate-900/5"
      role="radiogroup"
      aria-label="Select feature"
    >
      <a
        routerLink="/"
        routerLinkActive="bg-white text-teal-900 shadow-sm shadow-slate-900/10"
        [routerLinkActiveOptions]="{ exact: true }"
        class="min-w-36 rounded-lg px-4 py-2.5 text-left text-slate-500 transition-colors hover:text-slate-700"
        role="radio"
        [attr.aria-checked]="activeFeature() === 'customers'"
      >
        <span class="block text-sm font-medium tracking-tight">Customers</span>
        <span class="mt-0.5 block text-xs font-normal opacity-80">Saved customer records</span>
      </a>
      <a
        routerLink="/quotes"
        routerLinkActive="bg-white text-teal-900 shadow-sm shadow-slate-900/10"
        class="min-w-36 rounded-lg px-4 py-2.5 text-left text-slate-500 transition-colors hover:text-slate-700"
        role="radio"
        [attr.aria-checked]="activeFeature() === 'quotes'"
      >
        <span class="block text-sm font-medium tracking-tight">Quotes</span>
        <span class="mt-0.5 block text-xs font-normal opacity-80">Saved quote records</span>
      </a>
    </div>
  `,
})
export class FeatureSwitcherComponent {
  readonly activeFeature = input.required<FeatureSwitcherValue>();
}
