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
import { Store } from '@ngrx/store';
import { filter, map, switchMap, take } from 'rxjs';

import { AddressEntity } from '../../../models/address.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/confirm-dialog/confirm-dialog.component';
import { EditFieldInvalidPipe } from '../../../shared/pipes/edit-field-invalid.pipe';
import { TruncateLongWordsPipe } from '../../../shared/pipes/truncate-long-words.pipe';
import { CustomerActions } from '../store/customer.actions';
import {
  selectCustomerById,
  selectCustomersLoadError,
  selectCustomersLoading,
  selectCustomersMutationError,
  selectCustomersSaving,
  selectEditingAddressId,
} from '../store/customer.selectors';

@Component({
  selector: 'app-customer-addresses',
  imports: [
    AsyncPipe,
    EditFieldInvalidPipe,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    NgClass,
    RouterLink,
    TruncateLongWordsPipe,
  ],
  templateUrl: './customer-addresses.component.html',
})
export class CustomerAddressesComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

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

  readonly loading$ = this.store.select(selectCustomersLoading);
  readonly saving$ = this.store.select(selectCustomersSaving);
  readonly loadError$ = this.store.select(selectCustomersLoadError);
  readonly mutationError$ = this.store.select(selectCustomersMutationError);

  editingAddressId: number | null = null;
  editStreet = '';
  editSuburb = '';
  editCity = '';
  editPostalCode = '';
  editAttempted = false;

  readonly editInputValidClass =
    'border-cyan-300/80 bg-cyan-50 text-slate-900 ring-cyan-200/70 focus:border-cyan-500 focus:bg-white focus:ring-cyan-300';
  readonly editInputInvalidClass =
    'border-red-400 bg-red-50 text-slate-900 ring-red-200 focus:border-red-500 focus:bg-white focus:ring-red-300';

  readonly trackByAddressId = (_index: number, address: AddressEntity): number => address.id;

  constructor() {
    this.store
      .select(selectEditingAddressId)
      .pipe(takeUntilDestroyed())
      .subscribe((editingAddressId) => {
        this.editingAddressId = editingAddressId;
        if (editingAddressId === null) {
          this.editStreet = '';
          this.editSuburb = '';
          this.editCity = '';
          this.editPostalCode = '';
          this.editAttempted = false;
        }
      });
  }

  ngOnInit(): void {
    this.store.dispatch(CustomerActions.loadCustomers());
  }

  dismissMutationError(): void {
    this.store.dispatch(CustomerActions.clearMutationError());
  }

  startEdit(address: AddressEntity): void {
    this.editStreet = address.street;
    this.editSuburb = address.suburb;
    this.editCity = address.city;
    this.editPostalCode = address.postalCode;
    this.editAttempted = false;
    this.store.dispatch(CustomerActions.startAddressEdit({ id: address.id }));
  }

  cancelEdit(): void {
    this.store.dispatch(CustomerActions.cancelAddressEdit());
  }

  saveEdit(address: AddressEntity): void {
    this.editAttempted = true;
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

  deleteAddress(address: AddressEntity, addressCount: number): void {
    if (addressCount <= 1) {
      return;
    }

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
      .pipe(
        take(1),
        filter((confirmed): confirmed is true => confirmed === true),
      )
      .subscribe(() => {
        this.store.dispatch(CustomerActions.deleteAddress({ addressId: address.id }));
      });
  }
}
