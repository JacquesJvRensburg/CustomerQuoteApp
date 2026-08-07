import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, switchMap } from 'rxjs/operators';

import { CustomerActions } from '../store/customer.actions';
import {
  selectCustomerById,
  selectError,
  selectLoading,
} from '../store/customer.selectors';

@Component({
  selector: 'app-customer-addresses',
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
  templateUrl: './customer-addresses.component.html',
})
export class CustomerAddressesComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  readonly displayedColumns = ['street', 'suburb', 'city', 'postalCode'] as const;

  private readonly customerId$ = this.route.paramMap.pipe(
    map((params) => Number(params.get('customerId'))),
  );

  readonly customer$ = this.customerId$.pipe(
    switchMap((customerId) => this.store.select(selectCustomerById(customerId))),
  );

  readonly loading$ = this.store.select(selectLoading);
  readonly error$ = this.store.select(selectError);

  ngOnInit(): void {
    this.store.dispatch(CustomerActions.loadCustomers());
  }
}
