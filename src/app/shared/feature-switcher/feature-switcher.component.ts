import { Component, ElementRef, input, viewChildren } from '@angular/core';
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
      (keydown)="onRadiogroupKeydown($event)"
    >
      <a
        #featureLink
        routerLink="/"
        routerLinkActive="bg-white text-teal-900 shadow-sm shadow-slate-900/10"
        [routerLinkActiveOptions]="{ exact: true }"
        class="min-w-36 rounded-lg px-4 py-2.5 text-left text-slate-500 transition-colors hover:text-slate-700"
        role="radio"
        [attr.aria-checked]="activeFeature() === 'customers'"
        [attr.tabindex]="activeFeature() === 'customers' ? 0 : -1"
      >
        <span class="block text-sm font-medium tracking-tight">Customers</span>
        <span class="mt-0.5 block text-xs font-normal opacity-80">Saved customer records</span>
      </a>
      <a
        #featureLink
        routerLink="/quotes"
        routerLinkActive="bg-white text-teal-900 shadow-sm shadow-slate-900/10"
        class="min-w-36 rounded-lg px-4 py-2.5 text-left text-slate-500 transition-colors hover:text-slate-700"
        role="radio"
        [attr.aria-checked]="activeFeature() === 'quotes'"
        [attr.tabindex]="activeFeature() === 'quotes' ? 0 : -1"
      >
        <span class="block text-sm font-medium tracking-tight">Quotes</span>
        <span class="mt-0.5 block text-xs font-normal opacity-80">Saved quote records</span>
      </a>
    </div>
  `,
})
export class FeatureSwitcherComponent {
  readonly activeFeature = input.required<FeatureSwitcherValue>();
  private readonly featureLinks = viewChildren<ElementRef<HTMLAnchorElement>>('featureLink');

  onRadiogroupKeydown(event: KeyboardEvent): void {
    const links = this.featureLinks().map((link) => link.nativeElement);
    if (links.length < 2) {
      return;
    }

    const currentIndex = links.findIndex((link) => link === document.activeElement);
    if (currentIndex < 0) {
      return;
    }

    let nextIndex = currentIndex;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % links.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + links.length) % links.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = links.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    links[nextIndex].focus();
  }
}
