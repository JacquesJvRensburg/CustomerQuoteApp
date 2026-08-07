import { AsyncPipe, CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, effect, inject, OnInit, viewChild } from '@angular/core';
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
import { RouterLink } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';

import { QuoteStatus, QUOTE_STATUSES } from '../../../models/quote.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/confirm-dialog/confirm-dialog.component';
import { FeatureSwitcherComponent } from '../../../shared/feature-switcher/feature-switcher.component';
import { EditFieldInvalidPipe } from '../../../shared/pipes/edit-field-invalid.pipe';
import { TruncateLongWordsPipe } from '../../../shared/pipes/truncate-long-words.pipe';
import { QuoteActions } from '../store/quote.actions';
import {
  selectError,
  selectLoading,
  selectQuoteTableRows,
  selectSaving,
} from '../store/quote.selectors';

interface QuoteTableRow {
  id: number;
  customerId: number;
  customerFullName: string;
  amount: number;
  status: QuoteStatus;
  createdDate: string;
}

@Component({
  selector: 'app-quote-landing',
  imports: [
    AsyncPipe,
    CurrencyPipe,
    DatePipe,
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
    TruncateLongWordsPipe,
  ],
  templateUrl: './quote-landing.component.html',
})
export class QuoteLandingComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);
  private readonly actions$ = inject(Actions);
  private readonly paginator = viewChild(MatPaginator);
  private readonly sort = viewChild(MatSort);

  readonly displayedColumns = [
    'id',
    'customerId',
    'customerFullName',
    'amount',
    'status',
    'createdDate',
    'actions',
  ] as const;

  readonly dataSource = new MatTableDataSource<QuoteTableRow>([]);
  readonly pageSizeOptions = [5, 10, 25];
  readonly quoteStatuses = QUOTE_STATUSES;
  readonly loading$ = this.store.select(selectLoading);
  readonly saving$ = this.store.select(selectSaving);
  readonly error$ = this.store.select(selectError);

  editingQuoteId: number | null = null;
  editAmount: string | number = '';
  editStatus: QuoteStatus = 'Draft';
  editAttempted = false;

  readonly editInputBaseClass =
    'w-full min-w-28 rounded-md border px-2 py-1 text-base outline-none ring-2';
  readonly editInputValidClass =
    'border-cyan-300/80 bg-cyan-50 text-slate-900 ring-cyan-200/70 focus:border-cyan-500 focus:bg-white focus:ring-cyan-300';
  readonly editInputInvalidClass =
    'border-red-400 bg-red-50 text-slate-900 ring-red-200 focus:border-red-500 focus:bg-white focus:ring-red-300';

  constructor() {
    this.dataSource.filterPredicate = (row, filter) => {
      const term = filter.trim().toLowerCase();
      if (!term) {
        return true;
      }

      return [
        String(row.id),
        String(row.customerId),
        row.customerFullName,
        String(row.amount),
        row.status,
        row.createdDate,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term);
    };

    this.store
      .select(selectQuoteTableRows)
      .pipe(takeUntilDestroyed())
      .subscribe((quotes) => {
        this.dataSource.data = quotes;
      });

    this.actions$
      .pipe(ofType(QuoteActions.updateQuoteSuccess), takeUntilDestroyed())
      .subscribe(() => {
        this.cancelEdit();
      });

    this.actions$
      .pipe(ofType(QuoteActions.deleteQuoteSuccess), takeUntilDestroyed())
      .subscribe(({ id }) => {
        if (this.editingQuoteId === id) {
          this.cancelEdit();
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

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.dataSource.filter = value.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  startEdit(row: QuoteTableRow): void {
    this.editingQuoteId = row.id;
    this.editAmount = String(row.amount);
    this.editStatus = row.status;
    this.editAttempted = false;
  }

  cancelEdit(): void {
    this.editingQuoteId = null;
    this.editAmount = '';
    this.editStatus = 'Draft';
    this.editAttempted = false;
  }

  saveEdit(row: QuoteTableRow): void {
    this.editAttempted = true;
    const amountText = this.editAmount == null ? '' : String(this.editAmount).trim();
    const amount = Number(amountText);

    if (!amountText || !Number.isFinite(amount) || amount < 0) {
      return;
    }

    this.store.dispatch(
      QuoteActions.updateQuote({
        id: row.id,
        quote: {
          customerId: row.customerId,
          amount,
          status: this.editStatus,
        },
      }),
    );
  }

  deleteQuote(row: QuoteTableRow): void {
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
      .pipe(filter((confirmed): confirmed is true => confirmed === true))
      .subscribe(() => {
        this.store.dispatch(QuoteActions.deleteQuote({ id: row.id }));
      });
  }
}
