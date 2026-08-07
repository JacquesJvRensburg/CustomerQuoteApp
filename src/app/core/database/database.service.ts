import { Injectable } from '@angular/core';
import { from, Observable, of, throwError } from 'rxjs';
import { concatMap, last, map, switchMap, tap } from 'rxjs/operators';
import initSqlJs, { Database, ParamsObject, SqlJsStatic } from 'sql.js';

import { Address } from '../../models/address.model';
import { Customer, CustomerEntity } from '../../models/customer.model';
import { DATABASE_SCHEMA } from './database.schema';

const DB_STORAGE_KEY = 'customer-quote-app-sqlite';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private sqlJs: SqlJsStatic | null = null;
  private db: Database | null = null;
  private init$: Observable<Database> | null = null;

  /**
   * Ensures SQLite is loaded, schema applied, and the DB is ready for queries.
   */
  initialize(): Observable<Database> {
    if (this.db) {
      return of(this.db);
    }

    if (!this.init$) {
      this.init$ = from(this.openDatabase()).pipe(
        tap((db) => {
          this.db = db;
        }),
      );
    }

    return this.init$;
  }

  saveCustomer(customer: Customer): Observable<CustomerEntity> {
    return this.initialize().pipe(
      map((db) => {
        db.run('BEGIN');

        try {
          db.run('INSERT INTO customers (firstName, lastName) VALUES (?, ?)', [
            customer.firstName,
            customer.lastName,
          ]);

          const customerId = this.getLastInsertId(db);

          for (const address of customer.addresses) {
            this.insertAddress(db, customerId, address);
          }

          db.run('COMMIT');
          this.persist(db);

          return this.getCustomerByIdSync(db, customerId);
        } catch (error) {
          db.run('ROLLBACK');
          throw error;
        }
      }),
    );
  }

  /** Seeds demo customers when the database is empty. */
  ensureSeedData(): Observable<void> {
    return this.getCustomers().pipe(
      switchMap((customers) => {
        if (customers.length > 0) {
          return of(undefined);
        }

        const seedCustomers: Customer[] = [
          {
            firstName: 'Thabo',
            lastName: 'Molefe',
            addresses: [
              {
                street: '12 Long Street',
                city: 'Cape Town',
                suburb: 'City Centre',
                postalCode: '8001',
              },
            ],
          },
          {
            firstName: 'Sarah',
            lastName: 'van Wyk',
            addresses: [
              {
                street: '45 Rivonia Road',
                city: 'Johannesburg',
                suburb: 'Sandton',
                postalCode: '2196',
              },
              {
                street: '8 Beach Road',
                city: 'Durban',
                suburb: 'Umhlanga',
                postalCode: '4319',
              },
            ],
          },
          {
            firstName: 'James',
            lastName: 'Naidoo',
            addresses: [
              {
                street: '3 Church Street',
                city: 'Pretoria',
                suburb: 'Hatfield',
                postalCode: '0028',
              },
            ],
          },
        ];

        return from(seedCustomers).pipe(
          concatMap((customer) => this.saveCustomer(customer)),
          last(),
          map(() => undefined),
        );
      }),
    );
  }

  getCustomers(): Observable<CustomerEntity[]> {
    return this.initialize().pipe(
      map((db) => {
        const result = db.exec(
          'SELECT id, firstName, lastName FROM customers ORDER BY id ASC',
        );

        if (!result.length || !result[0].values.length) {
          return [];
        }

        return result[0].values.map((row) => {
          const id = row[0] as number;
          return {
            id,
            firstName: row[1] as string,
            lastName: row[2] as string,
            addresses: this.getAddressesForCustomerSync(db, id),
          };
        });
      }),
    );
  }

  getCustomerById(id: number): Observable<CustomerEntity | null> {
    return this.initialize().pipe(
      map((db) => {
        try {
          return this.getCustomerByIdSync(db, id);
        } catch {
          return null;
        }
      }),
    );
  }

  updateCustomer(id: number, customer: Customer): Observable<CustomerEntity> {
    return this.initialize().pipe(
      switchMap((db) => {
        const existing = this.findCustomerRow(db, id);
        if (!existing) {
          return throwError(() => new Error(`Customer with id ${id} not found`));
        }

        db.run('BEGIN');

        try {
          db.run(
            'UPDATE customers SET firstName = ?, lastName = ? WHERE id = ?',
            [customer.firstName, customer.lastName, id],
          );
          db.run('DELETE FROM addresses WHERE customerId = ?', [id]);

          for (const address of customer.addresses) {
            this.insertAddress(db, id, address);
          }

          db.run('COMMIT');
          this.persist(db);

          return of(this.getCustomerByIdSync(db, id));
        } catch (error) {
          db.run('ROLLBACK');
          return throwError(() => error);
        }
      }),
    );
  }

  deleteCustomer(id: number): Observable<void> {
    return this.initialize().pipe(
      map((db) => {
        db.run('DELETE FROM customers WHERE id = ?', [id]);
        this.persist(db);
      }),
    );
  }

  private async openDatabase(): Promise<Database> {
    this.sqlJs = await initSqlJs({
      locateFile: () => '/assets/sql-wasm.wasm',
    });

    const stored = localStorage.getItem(DB_STORAGE_KEY);
    const db = stored
      ? new this.sqlJs.Database(this.decodeBase64(stored))
      : new this.sqlJs.Database();

    db.run(DATABASE_SCHEMA);
    this.persist(db);
    return db;
  }

  private insertAddress(db: Database, customerId: number, address: Address): void {
    db.run(
      `INSERT INTO addresses (customerId, street, city, suburb, postalCode)
       VALUES (?, ?, ?, ?, ?)`,
      [
        customerId,
        address.street,
        address.city,
        address.suburb,
        address.postalCode,
      ],
    );
  }

  private getCustomerByIdSync(db: Database, id: number): CustomerEntity {
    const row = this.findCustomerRow(db, id);
    if (!row) {
      throw new Error(`Customer with id ${id} not found`);
    }

    return {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      addresses: this.getAddressesForCustomerSync(db, id),
    };
  }

  private findCustomerRow(
    db: Database,
    id: number,
  ): { id: number; firstName: string; lastName: string } | null {
    const statement = db.prepare(
      'SELECT id, firstName, lastName FROM customers WHERE id = ?',
    );
    statement.bind([id]);

    if (!statement.step()) {
      statement.free();
      return null;
    }

    const row = statement.getAsObject() as {
      id: number;
      firstName: string;
      lastName: string;
    };
    statement.free();
    return row;
  }

  private getAddressesForCustomerSync(db: Database, customerId: number): Address[] {
    const statement = db.prepare(
      `SELECT street, city, suburb, postalCode
       FROM addresses
       WHERE customerId = ?
       ORDER BY id ASC`,
    );
    statement.bind([customerId]);

    const addresses: Address[] = [];
    while (statement.step()) {
      const row = statement.getAsObject();
      addresses.push({
        street: String(row['street'] ?? ''),
        city: String(row['city'] ?? ''),
        suburb: String(row['suburb'] ?? ''),
        postalCode: String(row['postalCode'] ?? ''),
      });
    }
    statement.free();
    return addresses;
  }

  private getLastInsertId(db: Database): number {
    const result = db.exec('SELECT last_insert_rowid() AS id');
    return result[0].values[0][0] as number;
  }

  private persist(db: Database): void {
    const data = db.export();
    localStorage.setItem(DB_STORAGE_KEY, this.encodeBase64(data));
  }

  private encodeBase64(data: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  }

  private decodeBase64(value: string): Uint8Array {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
