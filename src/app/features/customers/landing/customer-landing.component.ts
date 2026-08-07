import { AsyncPipe } from '@angular/common';
import { Component, effect, inject, OnInit, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { CustomerActions } from '../store/customer.actions';
import {
  selectCustomerTableRows,
  selectError,
  selectLoading,
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
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
    RouterLink,
  ],
  templateUrl: './customer-landing.component.html',
})
export class CustomerLandingComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly paginator = viewChild(MatPaginator);
  private readonly sort = viewChild(MatSort);

  readonly displayedColumns = [
    'id',
    'firstName',
    'lastName',
    'addresses',
  ] as const;

  readonly dataSource = new MatTableDataSource<CustomerTableRow>([]);
  readonly pageSizeOptions = [5, 10, 25];
  readonly loading$ = this.store.select(selectLoading);
  readonly error$ = this.store.select(selectError);

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
}
