import { AsyncPipe, CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, DestroyRef, effect, inject, OnInit, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, take, withLatestFrom } from 'rxjs';

import {
  QuoteEntity,
  QuoteStatus,
  QUOTE_DESCRIPTION_MAX_LENGTH,
  QUOTE_STATUSES,
} from '../../../models/quote.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/confirm-dialog/confirm-dialog.component';
import { DatabaseExportButtonComponent } from '../../../shared/database-export-button/database-export-button.component';
import { FeatureSwitcherComponent } from '../../../shared/feature-switcher/feature-switcher.component';
import { EditFieldInvalidPipe } from '../../../shared/pipes/edit-field-invalid.pipe';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { QuoteActions } from '../store/quote.actions';
import {
  selectCustomerIdFilter,
  selectEditingQuoteId,
  selectFilteredQuotes,
  selectQuotesFilter,
  selectQuotesLoadError,
  selectQuotesLoading,
  selectQuotesMutationError,
  selectQuotesSaving,
} from '../store/quote.selectors';

@Component({
  selector: 'app-quote-landing',
  imports: [
    AsyncPipe,
    CurrencyPipe,
    DatePipe,
    DatabaseExportButtonComponent,
    EditFieldInvalidPipe,
    FeatureSwitcherComponent,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    NgClass,
    RouterLink,
    TruncatePipe,
  ],
  templateUrl: './quote-landing.component.html',
})
export class QuoteLandingComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly paginator = viewChild(MatPaginator);
  private readonly sort = viewChild(MatSort);

  readonly displayedColumns = [
    'id',
    'customerId',
    'customerFullName',
    'amount',
    'description',
    'status',
    'createdDate',
    'actions',
  ] as const;

  readonly dataSource = new MatTableDataSource<QuoteEntity>([]);
  readonly pageSizeOptions = [5, 10, 25];
  readonly quoteStatuses = QUOTE_STATUSES;
  readonly descriptionMaxLength = QUOTE_DESCRIPTION_MAX_LENGTH;
  readonly loading$ = this.store.select(selectQuotesLoading);
  readonly saving$ = this.store.select(selectQuotesSaving);
  readonly loadError$ = this.store.select(selectQuotesLoadError);
  readonly mutationError$ = this.store.select(selectQuotesMutationError);

  filterValue = '';
  private lastFilterKey = '';
  private customerIdFilter: number | null = null;

  editingQuoteId: number | null = null;
  editAmount: string | number = '';
  editDescription = '';
  editStatus: QuoteStatus = 'Draft';
  editAttempted = false;

  readonly editInputBaseClass =
    'w-full min-w-28 rounded-md border px-2 py-1 text-base outline-none ring-2';
  readonly editInputValidClass =
    'border-cyan-300/80 bg-cyan-50 text-slate-900 ring-cyan-200/70 focus:border-cyan-500 focus:bg-white focus:ring-cyan-300';
  readonly editInputInvalidClass =
    'border-red-400 bg-red-50 text-slate-900 ring-red-200 focus:border-red-500 focus:bg-white focus:ring-red-300';

  readonly trackByQuoteId = (_index: number, row: QuoteEntity): number => row.id;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.store.dispatch(QuoteActions.cancelQuoteEdit());
    });

    this.route.queryParamMap
      .pipe(
        withLatestFrom(
          this.store.select(selectCustomerIdFilter),
          this.store.select(selectQuotesFilter),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(([params, customerIdFilter, filterValue]) => {
        const raw = params.get('customerId');
        if (raw === null) {
          if (customerIdFilter !== null) {
            this.store.dispatch(
              QuoteActions.setFilter({
                filter: filterValue === String(customerIdFilter) ? '' : filterValue,
                customerIdFilter: null,
              }),
            );
          }
          return;
        }

        const customerId = Number(raw);
        if (Number.isInteger(customerId) && customerId > 0) {
          this.store.dispatch(
            QuoteActions.setFilter({
              filter: String(customerId),
              customerIdFilter: customerId,
            }),
          );
        }
      });

    this.store
      .select(selectFilteredQuotes)
      .pipe(takeUntilDestroyed())
      .subscribe((quotes) => {
        this.dataSource.data = quotes;
      });

    this.store
      .select(selectQuotesFilter)
      .pipe(takeUntilDestroyed())
      .subscribe((filterValue) => {
        this.filterValue = filterValue;
      });

    this.store
      .select(selectCustomerIdFilter)
      .pipe(takeUntilDestroyed())
      .subscribe((customerIdFilter) => {
        this.customerIdFilter = customerIdFilter;
      });

    this.store
      .select(selectEditingQuoteId)
      .pipe(takeUntilDestroyed())
      .subscribe((editingQuoteId) => {
        this.editingQuoteId = editingQuoteId;
        if (editingQuoteId === null) {
          this.editAmount = '';
          this.editDescription = '';
          this.editStatus = 'Draft';
          this.editAttempted = false;
        }
      });

    effect(() => {
      const paginator = this.paginator();
      const sort = this.sort();

      if (paginator) {
        this.dataSource.paginator = paginator;
      }

      if (sort) {
        this.dataSource.sort = sort;
      }
    });
  }

  ngOnInit(): void {
    this.store.dispatch(QuoteActions.loadQuotes());
  }

  applyFilter(value: string): void {
    const nextValue = value ?? '';

    if (
      this.customerIdFilter !== null &&
      nextValue.trim() === String(this.customerIdFilter)
    ) {
      return;
    }

    this.filterValue = nextValue;
    this.store.dispatch(
      QuoteActions.setFilter({
        filter: nextValue,
        customerIdFilter: null,
      }),
    );

    const filterKey = nextValue.trim().toLowerCase();
    if (filterKey !== this.lastFilterKey) {
      this.lastFilterKey = filterKey;
      this.dataSource.paginator?.firstPage();
    }
  }

  dismissMutationError(): void {
    this.store.dispatch(QuoteActions.clearMutationError());
  }

  startEdit(row: QuoteEntity): void {
    this.editAmount = String(row.amount);
    this.editDescription = row.description;
    this.editStatus = row.status;
    this.editAttempted = false;
    this.store.dispatch(QuoteActions.startQuoteEdit({ id: row.id }));
  }

  cancelEdit(): void {
    this.store.dispatch(QuoteActions.cancelQuoteEdit());
  }

  saveEdit(row: QuoteEntity): void {
    this.editAttempted = true;
    const amountText = this.editAmount == null ? '' : String(this.editAmount).trim();
    const amount = Number(amountText);
    const description = this.editDescription.trim();

    if (
      !amountText ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !description ||
      description.length > QUOTE_DESCRIPTION_MAX_LENGTH
    ) {
      return;
    }

    this.store.dispatch(
      QuoteActions.updateQuote({
        id: row.id,
        quote: {
          customerId: row.customerId,
          amount,
          description,
          status: this.editStatus,
        },
      }),
    );
  }

  deleteQuote(row: QuoteEntity): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Delete quote',
          message: `Delete quote #${row.id} for ${row.customerFullName}? This cannot be undone.`,
          confirmLabel: 'Delete',
        },
      },
    );

    dialogRef
      .afterClosed()
      .pipe(
        take(1),
        filter((confirmed): confirmed is true => confirmed === true),
      )
      .subscribe(() => {
        this.store.dispatch(QuoteActions.deleteQuote({ id: row.id }));
      });
  }
}
