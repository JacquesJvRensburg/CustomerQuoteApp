import { NgClass, PercentPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
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
import {
  debounceTime,
  distinctUntilChanged,
  map,
} from 'rxjs/operators';

import { Country } from '../../../models/country.model';
import { countryFlagUrl } from '../../../shared/utils/country-flag.util';
import { CustomerActions } from '../store/customer.actions';
import {
  selectCountries,
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
    PercentPipe,
  ],
  templateUrl: './customer-nationality-panel.component.html',
})
export class CustomerNationalityPanelComponent implements OnInit, AfterViewInit {
  private readonly store = inject(Store);
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

  readonly countryQuery = signal('');
  readonly countryDropdownOpen = signal(false);
  readonly countrySearchReadonly = signal(true);

  /** True once the surname has a value and predictions have been requested. */
  readonly hasQueried = signal(false);

  private readonly allCountries = toSignal(this.store.select(selectCountries), {
    initialValue: [] as Country[],
  });

  readonly filteredCountries = computed(() =>
    this.filterCountries(this.countryQuery(), this.allCountries()),
  );

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

  constructor() {
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
        if (this.preserveSavedDraft() && this.draftNationalityCode()) {
          this.hasQueried.set(true);
          return;
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

  onCountrySearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.countryQuery.set(value);
    this.countryDropdownOpen.set(true);
  }

  onCountrySearchFocus(event: FocusEvent): void {
    this.countrySearchReadonly.set(false);
    const input = event.target as HTMLInputElement;
    if (!this.countryQuery()) {
      input.value = '';
    }
    this.countryDropdownOpen.set(true);
  }

  onCountrySearchBlur(): void {
    this.countrySearchReadonly.set(true);
    setTimeout(() => this.countryDropdownOpen.set(false), 150);
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
}
