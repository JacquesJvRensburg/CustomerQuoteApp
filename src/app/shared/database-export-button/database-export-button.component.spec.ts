import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DatabaseService } from '../../core/database/database.service';
import { DatabaseExportButtonComponent } from './database-export-button.component';

describe('DatabaseExportButtonComponent', () => {
  let database: jasmine.SpyObj<DatabaseService>;

  beforeEach(() => {
    database = jasmine.createSpyObj('DatabaseService', ['exportDatabase']);
    database.exportDatabase.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      imports: [DatabaseExportButtonComponent],
      providers: [{ provide: DatabaseService, useValue: database }],
    });
  });

  it('should export the database', () => {
    const fixture = TestBed.createComponent(DatabaseExportButtonComponent);
    fixture.componentInstance.exportDatabase();

    expect(database.exportDatabase).toHaveBeenCalled();
    expect(fixture.componentInstance.errorMessage()).toBeNull();
  });

  it('should surface export errors', () => {
    database.exportDatabase.and.returnValue(throwError(() => new Error('disk full')));

    const fixture = TestBed.createComponent(DatabaseExportButtonComponent);
    fixture.componentInstance.exportDatabase();

    expect(fixture.componentInstance.errorMessage()).toBe('disk full');
  });
});
