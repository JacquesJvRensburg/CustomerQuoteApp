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
import { Store } from '@ngrx/store';
import { filter, take } from 'rxjs/operators';

import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/confirm-dialog/confirm-dialog.component';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { EditFieldInvalidPipe } from '../../../shared/pipes/edit-field-invalid.pipe';
import { DatabaseExportButtonComponent } from '../../../shared/database-export-button/database-export-button.component';
import { FeatureSwitcherComponent } from '../../../shared/feature-switcher/feature-switcher.component';
import { CustomerNationalityPanelComponent } from '../nationality/customer-nationality-panel.component';
import { CustomerUniversityPanelComponent } from '../university/customer-university-panel.component';
import { CustomerActions } from '../store/customer.actions';
import {
  selectCustomerTableRows,
  selectDraftNationalityCode,
  selectDraftUniversity,
  selectEditingCustomerId,
  selectError,
  selectFilter,
  selectLoading,
  selectSaving,
} from '../store/customer.selectors';

interface CustomerTableRow {
  id: number;
  firstName: string;
  lastName: string;
  nationalityCode: string | null;
  nationalityName: string | null;
  nationalityFlagUrl: string;
  universityName: string | null;
  universityWebsite: string | null;
  addressSearchText: string;
}

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
    RouterLink,
    TruncatePipe,
  ],
  templateUrl: './customer-landing.component.html',
})
export class CustomerLandingComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);
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
  readonly loading$ = this.store.select(selectLoading);
  readonly saving$ = this.store.select(selectSaving);
  readonly error$ = this.store.select(selectError);

  filterValue = '';
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

      return [
        row.firstName,
        row.lastName,
        row.nationalityName,
        row.nationalityCode,
        row.universityName,
        row.addressSearchText,
      ]
        .filter((value): value is string => !!value)
        .join(' ')
        .toLowerCase()
        .includes(term);
    };

    this.store
      .select(selectCustomerTableRows)
      .pipe(takeUntilDestroyed())
      .subscribe((customers) => {
        this.dataSource.data = customers;
        this.refreshFilter();
      });

    this.store
      .select(selectFilter)
      .pipe(takeUntilDestroyed())
      .subscribe((filterValue) => {
        this.filterValue = filterValue;
        this.refreshFilter();
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
    this.store.dispatch(CustomerActions.setFilter({ filter: value ?? '' }));
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

    this.store
      .select(selectDraftNationalityCode)
      .pipe(take(1))
      .subscribe((nationalityCode) => {
        this.store
          .select(selectDraftUniversity)
          .pipe(take(1))
          .subscribe((draftUniversity) => {
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
      .pipe(filter((confirmed): confirmed is true => confirmed === true))
      .subscribe(() => {
        this.store.dispatch(CustomerActions.deleteCustomer({ id: row.id }));
      });
  }

  private refreshFilter(): void {
    this.dataSource.filter = this.filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
