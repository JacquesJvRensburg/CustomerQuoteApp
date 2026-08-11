import {
  AfterViewInit,
  Component,
  computed,
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
import { debounceTime, distinctUntilChanged, map, pairwise, startWith } from 'rxjs/operators';

import { University } from '../../../models/university.model';
import { CustomerActions } from '../store/customer.actions';
import {
  selectCountries,
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

  readonly universityQuery = signal('');
  readonly dropdownOpen = signal(false);
  readonly searchReadonly = signal(true);

  private readonly countries = toSignal(this.store.select(selectCountries), {
    initialValue: [],
  });

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

  constructor() {
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

  onUniversitySearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.universityQuery.set(value);
    this.dropdownOpen.set(true);
  }

  onUniversitySearchFocus(event: FocusEvent): void {
    this.searchReadonly.set(false);
    const input = event.target as HTMLInputElement;
    if (!this.universityQuery()) {
      input.value = '';
    }
    this.dropdownOpen.set(true);
  }

  onUniversitySearchBlur(): void {
    this.searchReadonly.set(true);
    setTimeout(() => this.dropdownOpen.set(false), 150);
  }

  selectUniversity(university: University): void {
    this.store.dispatch(CustomerActions.setDraftUniversity({ university }));
    this.resetUniversitySearch();
  }

  clearSelection(): void {
    this.store.dispatch(CustomerActions.setDraftUniversity({ university: null }));
    this.resetUniversitySearch();
  }

  private resetUniversitySearch(): void {
    this.universityQuery.set('');
    this.dropdownOpen.set(false);
    this.syncSearchInputValue('');
    this.store.dispatch(CustomerActions.clearUniversitySearch());
  }

  private syncSearchInputValue(value: string): void {
    const input = this.universitySearchInput()?.nativeElement;
    if (input && input.value !== value) {
      input.value = value;
    }
  }
}
