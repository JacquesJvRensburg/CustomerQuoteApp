import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
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
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { Quote, QuoteStatus, QUOTE_DESCRIPTION_MAX_LENGTH, QUOTE_STATUSES } from '../../../models/quote.model';
import { HasFormErrorPipe } from '../../../shared/pipes/has-form-error.pipe';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { CustomerActions } from '../../customers/store/customer.actions';
import { selectCustomers } from '../../customers/store/customer.selectors';
import { QuoteActions } from '../store/quote.actions';
import { selectError, selectSaving } from '../store/quote.selectors';

interface QuoteForm {
  customerId: FormControl<number | null>;
  amount: FormControl<number | null>;
  description: FormControl<string>;
  status: FormControl<QuoteStatus>;
}

interface CustomerOption {
  id: number;
  fullName: string;
}

@Component({
  selector: 'app-quote-create',
  imports: [
    AsyncPipe,
    HasFormErrorPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
    RouterLink,
    TruncatePipe,
  ],
  templateUrl: './quote-create.component.html',
})
export class QuoteCreateComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly store = inject(Store);

  readonly saving$ = this.store.select(selectSaving);
  readonly error$ = this.store.select(selectError);
  readonly quoteStatuses = QUOTE_STATUSES;
  readonly descriptionMaxLength = QUOTE_DESCRIPTION_MAX_LENGTH;

  customerOptions: CustomerOption[] = [];
  submitted = false;

  readonly form: FormGroup<QuoteForm> = this.formBuilder.group({
    customerId: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required],
    }),
    amount: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    description: this.formBuilder.nonNullable.control('', {
      validators: [Validators.required, Validators.maxLength(QUOTE_DESCRIPTION_MAX_LENGTH)],
    }),
    status: this.formBuilder.nonNullable.control<QuoteStatus>('Draft', {
      validators: [Validators.required],
    }),
  });

  constructor() {
    this.store
      .select(selectCustomers)
      .pipe(takeUntilDestroyed())
      .subscribe((customers) => {
        this.customerOptions = customers.map((customer) => ({
          id: customer.id,
          fullName: `${customer.firstName} ${customer.lastName}`.trim(),
        }));
      });
  }

  ngOnInit(): void {
    this.store.dispatch(CustomerActions.loadCustomers());
  }

  submit(): void {
    this.submitted = true;
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();
    const quote: Quote = {
      customerId: raw.customerId!,
      amount: raw.amount!,
      description: raw.description.trim(),
      status: raw.status,
    };
    this.store.dispatch(QuoteActions.createQuote({ quote }));
  }
}
