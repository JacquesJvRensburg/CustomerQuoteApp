import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
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
import { debounceTime, distinctUntilChanged, map, pairwise, startWith } from 'rxjs';

import { University } from '../../../models/university.model';
import { CustomerActions } from '../store/customer.actions';
import {
  selectCountries,
  selectCountriesError,
  selectCountriesLoading,
  selectDraftNationalityCode,
  selectDraftUniversity,
  selectUniversitySearchError,
  selectUniversitySearchLoading,
  selectUniversitySearchResults,
} from '../store/customer.selectors';

@Component({
  selector: 'app-customer-university-panel',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './customer-university-panel.component.html',
})
export class CustomerUniversityPanelComponent implements AfterViewInit {
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);
  private readonly universitySearchInput = viewChild<ElementRef<HTMLInputElement>>(
    'universitySearchInput',
  );

  /** When true and no university is selected, show a required-field error. */
  readonly showRequiredError = input(false);

  readonly draftNationalityCode = toSignal(this.store.select(selectDraftNationalityCode), {
    initialValue: null as string | null,
  });
  readonly draftUniversity = toSignal(this.store.select(selectDraftUniversity), {
    initialValue: null as University | null,
  });
  readonly searchResults = toSignal(this.store.select(selectUniversitySearchResults), {
    initialValue: [] as University[],
  });
  readonly searchLoading = toSignal(this.store.select(selectUniversitySearchLoading), {
    initialValue: false,
  });
  readonly searchError = toSignal(this.store.select(selectUniversitySearchError), {
    initialValue: null as string | null,
  });
  readonly countriesLoading = toSignal(this.store.select(selectCountriesLoading), {
    initialValue: false,
  });
  readonly countriesError = toSignal(this.store.select(selectCountriesError), {
    initialValue: null as string | null,
  });

  readonly universityQuery = signal('');
  readonly dropdownOpen = signal(false);
  readonly searchReadonly = signal(true);
  readonly activeOptionIndex = signal(-1);
  readonly listboxId = 'university-search-listbox';

  private readonly countries = toSignal(this.store.select(selectCountries), {
    initialValue: [],
  });

  /** Panel shows whenever a nationality is selected — even before countries resolve. */
  readonly showPanel = computed(() => !!this.draftNationalityCode());

  readonly countryName = computed(() => {
    const code = this.draftNationalityCode();
    if (!code) {
      return null;
    }
    const match = this.countries().find(
      (country) => country.alpha2Code.toUpperCase() === code.toUpperCase(),
    );
    return match?.name ?? null;
  });

  readonly activeDescendantId = computed(() => {
    const index = this.activeOptionIndex();
    return index >= 0 ? `university-option-${index}` : null;
  });

  private blurCloseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearBlurTimer());

    effect(() => {
      const query = this.universityQuery();
      queueMicrotask(() => this.syncSearchInputValue(query));
    });

    toObservable(this.draftNationalityCode)
      .pipe(startWith(null as string | null), pairwise(), takeUntilDestroyed())
      .subscribe(([previousCode, nextCode]) => {
        if (previousCode === nextCode) {
          return;
        }

        this.resetUniversitySearch();
      });

    toObservable(this.universityQuery)
      .pipe(
        map((value) => value.trim()),
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((trimmed) => {
        this.store.dispatch(CustomerActions.clearUniversitySearch());
        this.activeOptionIndex.set(-1);

        const country = this.countryName();
        if (!country || trimmed.length < 2) {
          return;
        }

        this.store.dispatch(
          CustomerActions.searchUniversities({ countryName: country, query: trimmed }),
        );
      });
  }

  ngAfterViewInit(): void {
    this.resetUniversitySearch();
  }

  retryLoadCountries(): void {
    this.store.dispatch(CustomerActions.loadCountries());
  }

  onUniversitySearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.universityQuery.set(value);
    this.dropdownOpen.set(true);
    this.activeOptionIndex.set(-1);
  }

  onUniversitySearchFocus(event: FocusEvent): void {
    this.clearBlurTimer();
    this.searchReadonly.set(false);
    const input = event.target as HTMLInputElement;
    if (!this.universityQuery()) {
      input.value = '';
    }
    this.dropdownOpen.set(true);
  }

  onUniversitySearchBlur(): void {
    this.searchReadonly.set(true);
    this.clearBlurTimer();
    this.blurCloseTimer = setTimeout(() => this.dropdownOpen.set(false), 150);
  }

  onUniversitySearchKeydown(event: KeyboardEvent): void {
    const results = this.searchResults();
    if (!this.dropdownOpen() || results.length === 0) {
      if (event.key === 'Escape') {
        this.dropdownOpen.set(false);
      }
      return;
    }

    const current = this.activeOptionIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeOptionIndex.set(current < results.length - 1 ? current + 1 : 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeOptionIndex.set(current > 0 ? current - 1 : results.length - 1);
        break;
      case 'Enter':
        if (current >= 0 && current < results.length) {
          event.preventDefault();
          this.selectUniversity(results[current]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.dropdownOpen.set(false);
        this.activeOptionIndex.set(-1);
        break;
      default:
        break;
    }
  }

  selectUniversity(university: University): void {
    this.store.dispatch(CustomerActions.setDraftUniversity({ university }));
    this.resetUniversitySearch();
  }

  clearSelection(): void {
    this.store.dispatch(CustomerActions.setDraftUniversity({ university: null }));
    this.resetUniversitySearch();
  }

  trackUniversity(_index: number, university: University): string {
    return `${university.name}|${university.website}`;
  }

  private resetUniversitySearch(): void {
    this.universityQuery.set('');
    this.dropdownOpen.set(false);
    this.activeOptionIndex.set(-1);
    this.syncSearchInputValue('');
    this.store.dispatch(CustomerActions.clearUniversitySearch());
  }

  private syncSearchInputValue(value: string): void {
    const input = this.universitySearchInput()?.nativeElement;
    if (input && input.value !== value) {
      input.value = value;
    }
  }

  private clearBlurTimer(): void {
    if (this.blurCloseTimer !== null) {
      clearTimeout(this.blurCloseTimer);
      this.blurCloseTimer = null;
    }
  }
}
