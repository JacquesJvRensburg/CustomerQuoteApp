import { AsyncPipe, NgClass } from '@angular/common';
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

import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/confirm-dialog/confirm-dialog.component';
import { TruncateLongWordsPipe } from '../../../shared/pipes/truncate-long-words.pipe';
import { EditFieldInvalidPipe } from '../../../shared/pipes/edit-field-invalid.pipe';
import { FeatureSwitcherComponent } from '../../../shared/feature-switcher/feature-switcher.component';
import { CustomerActions } from '../store/customer.actions';
import {
  selectCustomerTableRows,
  selectError,
  selectLoading,
  selectSaving,
} from '../store/customer.selectors';

interface CustomerTableRow {
  id: number;
  firstName: string;
  lastName: string;
  addressSearchText: string;
}

@Component({
  selector: 'app-customer-landing',
  imports: [
    AsyncPipe,
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
  templateUrl: './customer-landing.component.html',
})
export class CustomerLandingComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);
  private readonly actions$ = inject(Actions);
  private readonly paginator = viewChild(MatPaginator);
  private readonly sort = viewChild(MatSort);

  readonly displayedColumns = [
    'id',
    'firstName',
    'lastName',
    'addresses',
    'quotes',
    'actions',
  ] as const;

  readonly dataSource = new MatTableDataSource<CustomerTableRow>([]);
  readonly pageSizeOptions = [5, 10, 25];
  readonly loading$ = this.store.select(selectLoading);
  readonly saving$ = this.store.select(selectSaving);
  readonly error$ = this.store.select(selectError);

  editingCustomerId: number | null = null;
  editFirstName = '';
  editLastName = '';
  editAttempted = false;

  readonly editInputBaseClass =
    'w-full min-w-36 rounded-md border px-2 py-1 text-base font-medium outline-none ring-2';
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

      return [row.firstName, row.lastName, row.addressSearchText]
        .join(' ')
        .toLowerCase()
        .includes(term);
    };

    this.store
      .select(selectCustomerTableRows)
      .pipe(takeUntilDestroyed())
      .subscribe((customers) => {
        this.dataSource.data = customers;
      });

    this.actions$
      .pipe(
        ofType(CustomerActions.updateCustomerSuccess),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.cancelEdit();
      });

    this.actions$
      .pipe(
        ofType(CustomerActions.deleteCustomerSuccess),
        takeUntilDestroyed(),
      )
      .subscribe(({ id }) => {
        if (this.editingCustomerId === id) {
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
    this.store.dispatch(CustomerActions.loadCustomers());
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.dataSource.filter = value.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  startEdit(row: CustomerTableRow): void {
    this.editingCustomerId = row.id;
    this.editFirstName = row.firstName;
    this.editLastName = row.lastName;
    this.editAttempted = false;
  }

  cancelEdit(): void {
    this.editingCustomerId = null;
    this.editFirstName = '';
    this.editLastName = '';
    this.editAttempted = false;
  }

  saveEdit(row: CustomerTableRow): void {
    this.editAttempted = true;
    const firstName = this.editFirstName.trim();
    const lastName = this.editLastName.trim();

    if (!firstName || !lastName) {
      return;
    }

    this.store.dispatch(
      CustomerActions.updateCustomer({
        id: row.id,
        firstName,
        lastName,
      }),
    );
  }

  deleteCustomer(row: CustomerTableRow): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Delete customer',
          message: `Delete ${row.firstName} ${row.lastName} and all of their addresses? This cannot be undone.`,
          confirmLabel: 'Delete',
        },
      },
    );

    dialogRef
      .afterClosed()
      .pipe(filter((confirmed): confirmed is true => confirmed === true))
      .subscribe(() => {
        this.store.dispatch(CustomerActions.deleteCustomer({ id: row.id }));
      });
  }
}
