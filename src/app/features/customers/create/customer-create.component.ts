import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { Customer } from '../../../models/customer.model';
import { CustomerActions } from '../store/customer.actions';
import { selectError, selectSaving } from '../store/customer.selectors';

interface AddressForm {
  street: FormControl<string>;
  suburb: FormControl<string>;
  city: FormControl<string>;
  postalCode: FormControl<string>;
}

interface CustomerForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  addresses: FormArray<FormGroup<AddressForm>>;
}

@Component({
  selector: 'app-customer-create',
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './customer-create.component.html',
})
export class CustomerCreateComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly store = inject(Store);

  readonly saving$ = this.store.select(selectSaving);
  readonly error$ = this.store.select(selectError);

  readonly form: FormGroup<CustomerForm> = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    addresses: this.formBuilder.nonNullable.array([this.createAddressGroup()]),
  });

  get addresses(): FormArray<FormGroup<AddressForm>> {
    return this.form.controls.addresses;
  }

  addAddress(): void {
    this.addresses.push(this.createAddressGroup());
  }

  removeAddress(index: number): void {
    if (this.addresses.length === 1) {
      return;
    }

    this.addresses.removeAt(index);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const customer: Customer = this.form.getRawValue();
    this.store.dispatch(CustomerActions.createCustomer({ customer }));
  }

  private createAddressGroup(): FormGroup<AddressForm> {
    return this.formBuilder.nonNullable.group({
      street: ['', [Validators.required, Validators.maxLength(200)]],
      suburb: ['', [Validators.required, Validators.maxLength(100)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      postalCode: ['', [Validators.required, Validators.maxLength(20)]],
    });
  }
}
