import { Component, inject, isDevMode, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, of, take } from 'rxjs';

import { DatabaseService } from '../../core/database/database.service';

@Component({
  selector: 'app-database-export-button',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    @if (isDev) {
      <div class="flex flex-col items-end gap-1">
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
        @if (errorMessage(); as error) {
          <p class="m-0 max-w-xs text-right text-xs text-red-700" role="alert">{{ error }}</p>
        }
      </div>
    }
  `,
})
export class DatabaseExportButtonComponent {
  private readonly database = inject(DatabaseService);

  readonly isDev = isDevMode();
  readonly errorMessage = signal<string | null>(null);

  exportDatabase(): void {
    this.errorMessage.set(null);
    this.database
      .exportDatabase()
      .pipe(
        take(1),
        catchError((error: unknown) => {
          this.errorMessage.set(
            error instanceof Error ? error.message : 'Failed to export database',
          );
          return of(undefined);
        }),
      )
      .subscribe();
  }
}
