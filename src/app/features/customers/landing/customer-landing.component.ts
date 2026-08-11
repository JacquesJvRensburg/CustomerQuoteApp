import { AsyncPipe, NgClass, NgOptimizedImage } from '@angular/common';
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
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, filter, take } from 'rxjs';

import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/confirm-dialog/confirm-dialog.component';
import { DatabaseExportButtonComponent } from '../../../shared/database-export-button/database-export-button.component';
import { FeatureSwitcherComponent } from '../../../shared/feature-switcher/feature-switcher.component';
import { EditFieldInvalidPipe } from '../../../shared/pipes/edit-field-invalid.pipe';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { CustomerNationalityPanelComponent } from '../nationality/customer-nationality-panel.component';
import { CustomerActions } from '../store/customer.actions';
import {
  CustomerTableRow,
  selectCustomersFilter,
  selectCustomersLoadError,
  selectCustomersLoading,
  selectCustomersMutationError,
  selectCustomersSaving,
  selectDraftNationalityCode,
  selectDraftUniversity,
  selectEditingCustomerId,
  selectFilteredCustomerTableRows,
} from '../store/customer.selectors';
import { CustomerUniversityPanelComponent } from '../university/customer-university-panel.component';

@Component({
  selector: 'app-customer-landing',
  imports: [
    AsyncPipe,
    CustomerNationalityPanelComponent,
    CustomerUniversityPanelComponent,
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
    NgOptimizedImage,
    RouterLink,
    TruncatePipe,
  ],
  templateUrl: './customer-landing.component.html',
})
export class CustomerLandingComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly paginator = viewChild(MatPaginator);
  private readonly sort = viewChild(MatSort);

  readonly displayedColumns = [
    'id',
    'firstName',
    'lastName',
    'nationality',
    'university',
    'addresses',
    'quotes',
    'actions',
  ] as const;

  readonly dataSource = new MatTableDataSource<CustomerTableRow>([]);
  readonly pageSizeOptions = [5, 10, 25];
  readonly loading$ = this.store.select(selectCustomersLoading);
  readonly saving$ = this.store.select(selectCustomersSaving);
  readonly loadError$ = this.store.select(selectCustomersLoadError);
  readonly mutationError$ = this.store.select(selectCustomersMutationError);

  filterValue = '';
  private lastFilterKey = '';
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

  readonly trackByCustomerId = (_index: number, row: CustomerTableRow): number => row.id;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.store.dispatch(CustomerActions.cancelCustomerEdit());
    });

    this.store
      .select(selectFilteredCustomerTableRows)
      .pipe(takeUntilDestroyed())
      .subscribe((rows) => {
        this.dataSource.data = rows;
      });

    this.store
      .select(selectCustomersFilter)
      .pipe(takeUntilDestroyed())
      .subscribe((filterValue) => {
        this.filterValue = filterValue;
      });

    this.store
      .select(selectEditingCustomerId)
      .pipe(takeUntilDestroyed())
      .subscribe((editingCustomerId) => {
        this.editingCustomerId = editingCustomerId;
        if (editingCustomerId === null) {
          this.editFirstName = '';
          this.editLastName = '';
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
    this.store.dispatch(CustomerActions.loadCustomers());
    this.store.dispatch(CustomerActions.loadCountries());
  }

  applyFilter(value: string): void {
    const next = value ?? '';
    this.filterValue = next;
    this.store.dispatch(CustomerActions.setFilter({ filter: next }));
    const filterKey = next.trim().toLowerCase();
    if (filterKey !== this.lastFilterKey) {
      this.lastFilterKey = filterKey;
      this.dataSource.paginator?.firstPage();
    }
  }

  dismissMutationError(): void {
    this.store.dispatch(CustomerActions.clearMutationError());
  }

  startEdit(row: CustomerTableRow): void {
    this.editFirstName = row.firstName;
    this.editLastName = row.lastName;
    this.editAttempted = false;
    this.store.dispatch(CustomerActions.startCustomerEdit({ id: row.id }));
  }

  cancelEdit(): void {
    this.store.dispatch(CustomerActions.cancelCustomerEdit());
  }

  saveEdit(row: CustomerTableRow): void {
    this.editAttempted = true;
    const firstName = this.editFirstName.trim();
    const lastName = this.editLastName.trim();

    if (!firstName || !lastName) {
      return;
    }

    combineLatest([
      this.store.select(selectDraftNationalityCode),
      this.store.select(selectDraftUniversity),
    ])
      .pipe(take(1))
      .subscribe(([nationalityCode, draftUniversity]) => {
        const trimmedNationality = nationalityCode?.trim() ?? '';
        const universityName = draftUniversity?.name?.trim() ?? '';

        if (!trimmedNationality || !universityName) {
          return;
        }

        this.store.dispatch(
          CustomerActions.updateCustomer({
            id: row.id,
            firstName,
            lastName,
            nationalityCode: trimmedNationality,
            universityName,
            universityWebsite: draftUniversity?.website?.trim() || null,
          }),
        );
      });
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
      .pipe(
        take(1),
        filter((confirmed): confirmed is true => confirmed === true),
      )
      .subscribe(() => {
        this.store.dispatch(CustomerActions.deleteCustomer({ id: row.id }));
      });
  }
}
