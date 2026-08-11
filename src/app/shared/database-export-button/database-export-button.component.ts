import { Component, inject, isDevMode } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { filter, take } from 'rxjs/operators';

import { CustomerActions } from '../../features/customers/store/customer.actions';
import { DatabaseService } from '../../core/database/database.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-database-export-button',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTooltipModule],
  template: `
    @if (isDev) {
      <button
        mat-stroked-button
        type="button"
        class="!rounded-full !px-4"
        matTooltip="Clear all data and restore seed customers and quotes"
        (click)="reseedDatabase()"
      >
        <mat-icon>restart_alt</mat-icon>
        Reseed database
      </button>
      <button
        mat-stroked-button
        type="button"
        class="!rounded-full !px-4"
        matTooltip="Download SQLite database file for inspection"
        (click)="exportDatabase()"
      >
        <mat-icon>download</mat-icon>
        Export database
      </button>
    }
  `,
})
export class DatabaseExportButtonComponent {
  private readonly database = inject(DatabaseService);
  private readonly dialog = inject(MatDialog);
  private readonly store = inject(Store);

  readonly isDev = isDevMode();

  reseedDatabase(): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Reseed database',
          message:
            'This will delete all customers, addresses, and quotes, then restore the demo seed data. Continue?',
          confirmLabel: 'Reseed',
        },
      },
    );

    dialogRef
      .afterClosed()
      .pipe(
        filter((confirmed): confirmed is true => confirmed === true),
        take(1),
      )
      .subscribe(() => {
        this.store.dispatch(CustomerActions.reseedDatabase());
      });
  }

  exportDatabase(): void {
    this.database.exportDatabase().pipe(take(1)).subscribe();
  }
}
