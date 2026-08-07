import { AsyncPipe, NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, switchMap } from 'rxjs/operators';

import { AddressEntity } from '../../../models/address.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/confirm-dialog/confirm-dialog.component';
import { CustomerActions } from '../store/customer.actions';
import {
  selectCustomerById,
  selectError,
  selectLoading,
  selectSaving,
} from '../store/customer.selectors';

@Component({
  selector: 'app-customer-addresses',
  imports: [
    AsyncPipe,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    NgClass,
    RouterLink,
  ],
  templateUrl: './customer-addresses.component.html',
})
export class CustomerAddressesComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly actions$ = inject(Actions);

  readonly displayedColumns = [
    'street',
    'suburb',
    'city',
    'postalCode',
    'actions',
  ] as const;

  private readonly customerId$ = this.route.paramMap.pipe(
    map((params) => Number(params.get('customerId'))),
  );

  readonly customer$ = this.customerId$.pipe(
    switchMap((customerId) => this.store.select(selectCustomerById(customerId))),
  );

  readonly loading$ = this.store.select(selectLoading);
  readonly saving$ = this.store.select(selectSaving);
  readonly error$ = this.store.select(selectError);

  editingAddressId: number | null = null;
  editStreet = '';
  editSuburb = '';
  editCity = '';
  editPostalCode = '';

  constructor() {
    this.actions$
      .pipe(ofType(CustomerActions.updateAddressSuccess), takeUntilDestroyed())
      .subscribe(() => {
        this.cancelEdit();
      });

    this.actions$
      .pipe(ofType(CustomerActions.deleteAddressSuccess), takeUntilDestroyed())
      .subscribe(({ customer }) => {
        if (
          this.editingAddressId !== null &&
          !customer.addresses.some((address) => address.id === this.editingAddressId)
        ) {
          this.cancelEdit();
        }
      });
  }

  ngOnInit(): void {
    this.store.dispatch(CustomerActions.loadCustomers());
  }

  isEditing(addressId: number): boolean {
    return this.editingAddressId === addressId;
  }

  startEdit(address: AddressEntity): void {
    this.editingAddressId = address.id;
    this.editStreet = address.street;
    this.editSuburb = address.suburb;
    this.editCity = address.city;
    this.editPostalCode = address.postalCode;
  }

  cancelEdit(): void {
    this.editingAddressId = null;
    this.editStreet = '';
    this.editSuburb = '';
    this.editCity = '';
    this.editPostalCode = '';
  }

  saveEdit(address: AddressEntity): void {
    const street = this.editStreet.trim();
    const suburb = this.editSuburb.trim();
    const city = this.editCity.trim();
    const postalCode = this.editPostalCode.trim();

    if (!street || !suburb || !city || !postalCode) {
      return;
    }

    this.store.dispatch(
      CustomerActions.updateAddress({
        address: {
          id: address.id,
          street,
          suburb,
          city,
          postalCode,
        },
      }),
    );
  }

  deleteAddress(address: AddressEntity): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Delete address',
          message: `Delete ${address.street}, ${address.suburb}, ${address.city}? This cannot be undone.`,
          confirmLabel: 'Delete',
        },
      },
    );

    dialogRef
      .afterClosed()
      .pipe(filter((confirmed): confirmed is true => confirmed === true))
      .subscribe(() => {
        this.store.dispatch(CustomerActions.deleteAddress({ addressId: address.id }));
      });
  }
}
