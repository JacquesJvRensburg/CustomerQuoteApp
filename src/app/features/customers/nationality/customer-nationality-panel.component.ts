import { NgClass, NgOptimizedImage, PercentPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import { Country } from '../../../models/country.model';
import { countryFlagUrl } from '../../../shared/utils/country-flag.util';
import { CustomerActions } from '../store/customer.actions';
import {
  selectCountries,
  selectCountriesError,
  selectDraftNationalityCode,
  selectPredictions,
  selectPredictionsError,
  selectPredictionsLoading,
} from '../store/customer.selectors';

@Component({
  selector: 'app-customer-nationality-panel',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    NgClass,
    NgOptimizedImage,
    PercentPipe,
  ],
  templateUrl: './customer-nationality-panel.component.html',
})
export class CustomerNationalityPanelComponent implements OnInit, AfterViewInit {
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);
  private readonly countrySearchInput = viewChild<ElementRef<HTMLInputElement>>('countrySearchInput');

  /** Surname (last name) used to predict nationality. */
  readonly surname = input<string>('');

  /** When true, keeps nationality/university already loaded from the store (e.g. inline edit). */
  readonly preserveSavedDraft = input(false);

  /** When true and no nationality is selected, show a required-field error. */
  readonly showRequiredError = input(false);

  readonly draftNationalityCode = toSignal(this.store.select(selectDraftNationalityCode), {
    initialValue: null as string | null,
  });
  readonly predictions = toSignal(this.store.select(selectPredictions), { initialValue: [] });
  readonly predictionsLoading = toSignal(this.store.select(selectPredictionsLoading), {
    initialValue: false,
  });
  readonly predictionsError = toSignal(this.store.select(selectPredictionsError), {
    initialValue: null as string | null,
  });
  readonly countriesError = toSignal(this.store.select(selectCountriesError), {
    initialValue: null as string | null,
  });

  readonly countryQuery = signal('');
  readonly countryDropdownOpen = signal(false);
  readonly countrySearchReadonly = signal(true);
  readonly activeOptionIndex = signal(-1);
  readonly listboxId = 'nationality-country-listbox';

  /** True once the surname has a value and predictions have been requested. */
  readonly hasQueried = signal(false);

  private initialPreservedSurname: string | null = null;

  private readonly allCountries = toSignal(this.store.select(selectCountries), {
    initialValue: [] as Country[],
  });

  readonly filteredCountries = computed(() =>
    this.filterCountries(this.countryQuery(), this.allCountries()),
  );

  readonly activeDescendantId = computed(() => {
    const index = this.activeOptionIndex();
    return index >= 0 ? `country-option-${index}` : null;
  });

  private readonly countriesByCode = computed(() => {
    const mapByCode = new Map<string, Country>();
    for (const country of this.allCountries()) {
      mapByCode.set(country.alpha2Code.toUpperCase(), country);
    }
    return mapByCode;
  });

  readonly selectedCountry = linkedSignal((): Country | null => {
    const code = this.draftNationalityCode();
    if (!code) {
      return null;
    }
    const normalized = code.toUpperCase();
    const match = this.countriesByCode().get(normalized);
    if (match) {
      return match;
    }

    return {
      name: normalized,
      flag: '',
      flags: {
        png: countryFlagUrl(normalized),
        svg: countryFlagUrl(normalized),
      },
      alpha2Code: normalized,
    };
  });

  private blurCloseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearBlurTimer());

    effect(() => {
      if (this.preserveSavedDraft() && this.draftNationalityCode()) {
        this.hasQueried.set(true);
      }
    });

    effect(() => {
      const query = this.countryQuery();
      queueMicrotask(() => this.syncSearchInputValue(query));
    });

    toObservable(this.surname)
      .pipe(
        map((value) => value.trim()),
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((trimmed) => {
        if (this.preserveSavedDraft()) {
          if (this.initialPreservedSurname === null) {
            this.initialPreservedSurname = trimmed;
            if (this.draftNationalityCode()) {
              this.hasQueried.set(true);
              return;
            }
          } else if (trimmed === this.initialPreservedSurname && this.draftNationalityCode()) {
            this.hasQueried.set(true);
            return;
          }
        }

        this.store.dispatch(CustomerActions.setDraftNationality({ nationalityCode: null }));
        this.store.dispatch(CustomerActions.clearNationalityPredictions());
        this.resetCountrySearch();

        if (trimmed) {
          this.hasQueried.set(true);
          this.store.dispatch(CustomerActions.predictNationality({ surname: trimmed }));
        } else {
          this.hasQueried.set(false);
        }
      });
  }

  ngOnInit(): void {
    this.store.dispatch(CustomerActions.loadCountries());
  }

  ngAfterViewInit(): void {
    this.resetCountrySearch();
  }

  retryLoadCountries(): void {
    this.store.dispatch(CustomerActions.loadCountries());
  }

  onCountrySearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.countryQuery.set(value);
    this.countryDropdownOpen.set(true);
    this.activeOptionIndex.set(-1);
  }

  onCountrySearchFocus(event: FocusEvent): void {
    this.clearBlurTimer();
    this.countrySearchReadonly.set(false);
    const input = event.target as HTMLInputElement;
    if (!this.countryQuery()) {
      input.value = '';
    }
    this.countryDropdownOpen.set(true);
  }

  onCountrySearchBlur(): void {
    this.countrySearchReadonly.set(true);
    this.clearBlurTimer();
    this.blurCloseTimer = setTimeout(() => this.countryDropdownOpen.set(false), 150);
  }

  onCountrySearchKeydown(event: KeyboardEvent): void {
    const countries = this.filteredCountries();
    if (!this.countryDropdownOpen() || !this.countryQuery().trim() || countries.length === 0) {
      if (event.key === 'Escape') {
        this.countryDropdownOpen.set(false);
      }
      return;
    }

    const current = this.activeOptionIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeOptionIndex.set(current < countries.length - 1 ? current + 1 : 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeOptionIndex.set(current > 0 ? current - 1 : countries.length - 1);
        break;
      case 'Enter':
        if (current >= 0 && current < countries.length) {
          event.preventDefault();
          this.selectCountryFromList(countries[current]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.countryDropdownOpen.set(false);
        this.activeOptionIndex.set(-1);
        break;
      default:
        break;
    }
  }

  selectCountryFromList(country: Country): void {
    this.store.dispatch(
      CustomerActions.setDraftNationality({ nationalityCode: country.alpha2Code.toUpperCase() }),
    );
    this.resetCountrySearch();
  }

  selectPrediction(countryCode: string): void {
    this.store.dispatch(
      CustomerActions.setDraftNationality({ nationalityCode: countryCode.toUpperCase() }),
    );
  }

  onPredictionKeydown(event: KeyboardEvent, countryCode: string, index: number): void {
    const predictions = this.predictions();
    if (predictions.length === 0) {
      return;
    }

    const target = event.currentTarget as HTMLElement;
    const group = target.closest('[role="radiogroup"]');
    const buttons = group
      ? Array.from(group.querySelectorAll<HTMLElement>('[role="radio"]'))
      : [];

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const nextIndex = index < predictions.length - 1 ? index + 1 : 0;
        buttons[nextIndex]?.focus();
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prevIndex = index > 0 ? index - 1 : predictions.length - 1;
        buttons[prevIndex]?.focus();
        break;
      }
      case ' ':
      case 'Enter': {
        event.preventDefault();
        this.selectPrediction(countryCode);
        break;
      }
      default:
        break;
    }
  }

  clearSelection(): void {
    this.store.dispatch(CustomerActions.setDraftNationality({ nationalityCode: null }));
    this.resetCountrySearch();
  }

  isSelected(countryCode: string): boolean {
    return this.draftNationalityCode()?.toUpperCase() === countryCode.toUpperCase();
  }

  flagUrl(country: Pick<Country, 'alpha2Code' | 'flags'>): string {
    return countryFlagUrl(country.alpha2Code, country.flags);
  }

  private resetCountrySearch(): void {
    this.countryQuery.set('');
    this.countryDropdownOpen.set(false);
    this.activeOptionIndex.set(-1);
    this.syncSearchInputValue('');
  }

  private syncSearchInputValue(value: string): void {
    const input = this.countrySearchInput()?.nativeElement;
    if (input && input.value !== value) {
      input.value = value;
    }
  }

  private filterCountries(query: string, countries: Country[]): Country[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return countries;
    }
    return countries.filter((country) => {
      const name = country.name.toLowerCase();
      const code = country.alpha2Code.toLowerCase();
      return name.includes(normalized) || code.includes(normalized);
    });
  }

  private clearBlurTimer(): void {
    if (this.blurCloseTimer !== null) {
      clearTimeout(this.blurCloseTimer);
      this.blurCloseTimer = null;
    }
  }
}
