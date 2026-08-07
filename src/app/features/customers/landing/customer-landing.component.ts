import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { CustomerActions } from '../store/customer.actions';
import {
  selectCustomerTableRows,
  selectError,
  selectLoading,
} from '../store/customer.selectors';

@Component({
  selector: 'app-customer-landing',
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatToolbarModule,
    RouterLink,
  ],
  templateUrl: './customer-landing.component.html',
})
export class CustomerLandingComponent implements OnInit {
  private readonly store = inject(Store);

  readonly displayedColumns = [
    'id',
    'firstName',
    'lastName',
    'addresses',
  ] as const;

  readonly customers$ = this.store.select(selectCustomerTableRows);
  readonly loading$ = this.store.select(selectLoading);
  readonly error$ = this.store.select(selectError);

  ngOnInit(): void {
    this.store.dispatch(CustomerActions.loadCustomers());
  }
}
