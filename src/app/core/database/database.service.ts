import { Injectable } from '@angular/core';
import { concatMap, from, last, map, Observable, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

import { Address, AddressEntity } from '../../models/address.model';
import { Customer, CustomerEntity } from '../../models/customer.model';
import { Quote, QuoteEntity, QuoteStatus, QUOTE_DESCRIPTION_MAX_LENGTH, QUOTE_STATUSES } from '../../models/quote.model';
import { sanitizeHttpUrl } from '../../shared/utils/safe-url.util';
import { DATABASE_SCHEMA } from './database.schema';

const DB_STORAGE_KEY = 'customer-quote-app-sqlite';
const ALLOWED_TABLES = new Set(['customers', 'addresses', 'quotes'] as const);
@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private sqlJs: SqlJsStatic | null = null;
  private db: Database | null = null;
  private init$: Observable<Database> | null = null;
  private seed$: Observable<void> | null = null;

  /**
   * Ensures SQLite is loaded, schema applied, and the DB is ready for queries.
   */
  initialize(): Observable<Database> {
    if (this.db) {
      return of(this.db);
    }

    if (!this.init$) {
      this.init$ = from(this.openDatabase()).pipe(
        tap({
          next: (db) => {
            this.db = db;
          },
          error: () => {
            this.init$ = null;
          },
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.init$;
  }

  saveCustomer(customer: Customer): Observable<CustomerEntity> {
    return this.initialize().pipe(
      map((db) => {
        this.assertCustomerNameLengths(customer.firstName, customer.lastName);

        db.run('BEGIN');

        try {
          db.run(
            'INSERT INTO customers (firstName, lastName, nationalityCode, universityName, universityWebsite) VALUES (?, ?, ?, ?, ?)',
            [
              customer.firstName,
              customer.lastName,
              customer.nationalityCode,
              customer.universityName,
              this.sanitizeStoredWebsite(customer.universityWebsite),
            ],
          );

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

  /** Seeds demo customers and quotes when the database is first initialised. */
  ensureSeedData(): Observable<void> {
    if (!this.seed$) {
      this.seed$ = this.getCustomers().pipe(
        switchMap((customers) => {
          if (customers.length > 0) {
            return of(undefined);
          }

          const seedCustomers: Customer[] = [
            {
              firstName: 'Thabo',
              lastName: 'Molefe',
              nationalityCode: 'ZA',
              universityName: 'University of Cape Town',
              universityWebsite: 'http://www.uct.ac.za/',
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
              nationalityCode: 'ZA',
              universityName: 'University of Witwatersrand',
              universityWebsite: 'http://www.wits.ac.za/',
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
              nationalityCode: 'ZA',
              universityName: 'University of Pretoria',
              universityWebsite: 'http://www.up.ac.za/',
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
            switchMap(() => this.getCustomers()),
            switchMap((savedCustomers) =>
              this.initialize().pipe(
                map((db) => {
                  this.insertSeedQuotes(db, savedCustomers);
                }),
              ),
            ),
          );
        }),
        tap({
          error: () => {
            this.seed$ = null;
          },
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.seed$;
  }

  getCustomers(): Observable<CustomerEntity[]> {
    return this.initialize().pipe(
      map((db) => {
        const result = db.exec(
          'SELECT id, firstName, lastName, nationalityCode, universityName, universityWebsite FROM customers ORDER BY id DESC',
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
            nationalityCode: (row[3] as string | null) ?? null,
            universityName: (row[4] as string | null) ?? null,
            universityWebsite: this.sanitizeStoredWebsite(row[5] as string | null),
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
            'UPDATE customers SET firstName = ?, lastName = ?, nationalityCode = ?, universityName = ?, universityWebsite = ? WHERE id = ?',
            [
              customer.firstName,
              customer.lastName,
              customer.nationalityCode,
              customer.universityName,
              this.sanitizeStoredWebsite(customer.universityWebsite),
              id,
            ],
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

  updateCustomerNames(
    id: number,
    firstName: string,
    lastName: string,
    nationalityCode: string | null,
    universityName: string | null,
    universityWebsite: string | null,
  ): Observable<CustomerEntity> {
    return this.initialize().pipe(
      map((db) => {
        const existing = this.findCustomerRow(db, id);
        if (!existing) {
          throw new Error(`Customer with id ${id} not found`);
        }

        this.assertCustomerNameLengths(firstName, lastName);

        db.run(
          'UPDATE customers SET firstName = ?, lastName = ?, nationalityCode = ?, universityName = ?, universityWebsite = ? WHERE id = ?',
          [
            firstName,
            lastName,
            nationalityCode,
            universityName,
            this.sanitizeStoredWebsite(universityWebsite),
            id,
          ],
        );
        this.persist(db);
        return this.getCustomerByIdSync(db, id);
      }),
    );
  }

  updateAddress(address: AddressEntity): Observable<CustomerEntity> {
    return this.initialize().pipe(
      map((db) => {
        const customerId = this.findAddressCustomerId(db, address.id);
        if (customerId === null) {
          throw new Error(`Address with id ${address.id} not found`);
        }

        this.assertAddressLengths(address);

        db.run(
          `UPDATE addresses
           SET street = ?, city = ?, suburb = ?, postalCode = ?
           WHERE id = ?`,
          [address.street, address.city, address.suburb, address.postalCode, address.id],
        );
        this.persist(db);
        return this.getCustomerByIdSync(db, customerId);
      }),
    );
  }

  deleteAddress(addressId: number): Observable<CustomerEntity> {
    return this.initialize().pipe(
      map((db) => {
        const customerId = this.findAddressCustomerId(db, addressId);
        if (customerId === null) {
          throw new Error(`Address with id ${addressId} not found`);
        }

        const addresses = this.getAddressesForCustomerSync(db, customerId);
        if (addresses.length <= 1) {
          throw new Error('A customer must have at least one address');
        }

        db.run('DELETE FROM addresses WHERE id = ?', [addressId]);
        this.persist(db);
        return this.getCustomerByIdSync(db, customerId);
      }),
    );
  }

  getQuotes(): Observable<QuoteEntity[]> {
    return this.initialize().pipe(
      map((db) => this.getQuotesSync(db)),
    );
  }

  saveQuote(quote: Quote): Observable<QuoteEntity> {
    return this.initialize().pipe(
      map((db) => {
        this.assertQuoteDescription(quote.description);
        this.assertQuoteStatus(quote.status);

        const customer = this.findCustomerRow(db, quote.customerId);
        if (!customer) {
          throw new Error(`Customer with id ${quote.customerId} not found`);
        }

        const createdDate = new Date().toISOString();
        db.run(
          `INSERT INTO quotes (customerId, amount, description, status, createdDate)
           VALUES (?, ?, ?, ?, ?)`,
          [quote.customerId, quote.amount, quote.description, quote.status, createdDate],
        );

        const id = this.getLastInsertId(db);
        this.persist(db);
        return this.getQuoteByIdSync(db, id);
      }),
    );
  }

  updateQuote(
    id: number,
    quote: Pick<Quote, 'customerId' | 'amount' | 'description' | 'status'>,
  ): Observable<QuoteEntity> {
    return this.initialize().pipe(
      map((db) => {
        this.assertQuoteDescription(quote.description);
        this.assertQuoteStatus(quote.status);

        const existing = this.findQuoteRow(db, id);
        if (!existing) {
          throw new Error(`Quote with id ${id} not found`);
        }

        const customer = this.findCustomerRow(db, quote.customerId);
        if (!customer) {
          throw new Error(`Customer with id ${quote.customerId} not found`);
        }

        db.run(
          `UPDATE quotes
           SET customerId = ?, amount = ?, description = ?, status = ?
           WHERE id = ?`,
          [quote.customerId, quote.amount, quote.description, quote.status, id],
        );
        this.persist(db);
        return this.getQuoteByIdSync(db, id);
      }),
    );
  }

  deleteQuote(id: number): Observable<void> {
    return this.initialize().pipe(
      map((db) => {
        db.run('DELETE FROM quotes WHERE id = ?', [id]);
        this.persist(db);
      }),
    );
  }

  /** Downloads the current SQLite database as a `.db` file. */
  exportDatabase(): Observable<void> {
    return this.initialize().pipe(
      map((db) => {
        this.downloadDatabaseFile(db.export(), 'customer-quote-app.db');
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
    this.migrate(db);
    this.persist(db);
    return db;
  }

  private migrate(db: Database): void {
    if (!this.hasColumn(db, 'customers', 'nationalityCode')) {
      db.run('ALTER TABLE customers ADD COLUMN nationalityCode TEXT');
    }
    if (!this.hasColumn(db, 'customers', 'universityName')) {
      db.run('ALTER TABLE customers ADD COLUMN universityName TEXT');
    }
    if (!this.hasColumn(db, 'customers', 'universityWebsite')) {
      db.run('ALTER TABLE customers ADD COLUMN universityWebsite TEXT');
    }
    if (!this.hasColumn(db, 'quotes', 'description')) {
      db.run("ALTER TABLE quotes ADD COLUMN description TEXT NOT NULL DEFAULT ''");
    }
  }

  private hasColumn(db: Database, table: string, column: string): boolean {
    if (!ALLOWED_TABLES.has(table as 'customers' | 'addresses' | 'quotes')) {
      throw new Error(`Unsupported table for schema introspection: ${table}`);
    }

    const result = db.exec(`PRAGMA table_info(${table})`);
    if (!result.length) {
      return false;
    }

    return result[0].values.some((row) => row[1] === column);
  }

  private insertAddress(db: Database, customerId: number, address: Address): void {
    this.assertAddressLengths(address);

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
      nationalityCode: row.nationalityCode,
      universityName: row.universityName,
      universityWebsite: this.sanitizeStoredWebsite(row.universityWebsite),
      addresses: this.getAddressesForCustomerSync(db, id),
    };
  }

  private findCustomerRow(
    db: Database,
    id: number,
  ): {
    id: number;
    firstName: string;
    lastName: string;
    nationalityCode: string | null;
    universityName: string | null;
    universityWebsite: string | null;
  } | null {
    const statement = db.prepare(
      'SELECT id, firstName, lastName, nationalityCode, universityName, universityWebsite FROM customers WHERE id = ?',
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
      nationalityCode: string | null;
      universityName: string | null;
      universityWebsite: string | null;
    };
    statement.free();
    return {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      nationalityCode: row.nationalityCode ?? null,
      universityName: row.universityName ?? null,
      universityWebsite: row.universityWebsite ?? null,
    };
  }

  private getAddressesForCustomerSync(db: Database, customerId: number): AddressEntity[] {
    const statement = db.prepare(
      `SELECT id, street, city, suburb, postalCode
       FROM addresses
       WHERE customerId = ?
       ORDER BY id ASC`,
    );
    statement.bind([customerId]);

    const addresses: AddressEntity[] = [];
    while (statement.step()) {
      const row = statement.getAsObject();
      addresses.push({
        id: Number(row['id'] ?? 0),
        street: String(row['street'] ?? ''),
        city: String(row['city'] ?? ''),
        suburb: String(row['suburb'] ?? ''),
        postalCode: String(row['postalCode'] ?? ''),
      });
    }
    statement.free();
    return addresses;
  }

  private findAddressCustomerId(db: Database, addressId: number): number | null {
    const statement = db.prepare('SELECT customerId FROM addresses WHERE id = ?');
    statement.bind([addressId]);

    if (!statement.step()) {
      statement.free();
      return null;
    }

    const row = statement.getAsObject();
    statement.free();
    return Number(row['customerId'] ?? 0) || null;
  }

  private getQuotesSync(db: Database): QuoteEntity[] {
    const result = db.exec(
      `SELECT
         q.id,
         q.customerId,
         c.firstName,
         c.lastName,
         q.amount,
         q.description,
         q.status,
         q.createdDate
       FROM quotes q
       INNER JOIN customers c ON c.id = q.customerId
       ORDER BY q.createdDate DESC, q.id DESC`,
    );

    if (!result.length || !result[0].values.length) {
      return [];
    }

    return result[0].values.map((row) => this.mapQuoteRow(row));
  }

  private getQuoteByIdSync(db: Database, id: number): QuoteEntity {
    const statement = db.prepare(
      `SELECT
         q.id,
         q.customerId,
         c.firstName,
         c.lastName,
         q.amount,
         q.description,
         q.status,
         q.createdDate
       FROM quotes q
       INNER JOIN customers c ON c.id = q.customerId
       WHERE q.id = ?`,
    );
    statement.bind([id]);

    if (!statement.step()) {
      statement.free();
      throw new Error(`Quote with id ${id} not found`);
    }

    const row = statement.getAsObject();
    statement.free();

    return {
      id: Number(row['id'] ?? 0),
      customerId: Number(row['customerId'] ?? 0),
      customerFullName: `${String(row['firstName'] ?? '')} ${String(row['lastName'] ?? '')}`.trim(),
      amount: Number(row['amount'] ?? 0),
      description: String(row['description'] ?? ''),
      status: String(row['status'] ?? 'Draft') as QuoteStatus,
      createdDate: String(row['createdDate'] ?? ''),
    };
  }

  private findQuoteRow(
    db: Database,
    id: number,
  ): { id: number; customerId: number } | null {
    const statement = db.prepare('SELECT id, customerId FROM quotes WHERE id = ?');
    statement.bind([id]);

    if (!statement.step()) {
      statement.free();
      return null;
    }

    const row = statement.getAsObject();
    statement.free();
    return {
      id: Number(row['id'] ?? 0),
      customerId: Number(row['customerId'] ?? 0),
    };
  }

  private mapQuoteRow(row: (string | number | null | Uint8Array)[]): QuoteEntity {
    return {
      id: row[0] as number,
      customerId: row[1] as number,
      customerFullName: `${String(row[2] ?? '')} ${String(row[3] ?? '')}`.trim(),
      amount: row[4] as number,
      description: String(row[5] ?? ''),
      status: this.parseQuoteStatus(String(row[6] ?? 'Draft')),
      createdDate: String(row[7] ?? ''),
    };
  }

  private insertSeedQuotes(db: Database, customers: CustomerEntity[]): void {
    if (customers.length === 0) {
      return;
    }

    const findCustomer = (firstName: string, lastName: string): CustomerEntity | undefined =>
      customers.find(
        (customer) => customer.firstName === firstName && customer.lastName === lastName,
      );

    const thabo = findCustomer('Thabo', 'Molefe');
    const sarah = findCustomer('Sarah', 'van Wyk');
    const james = findCustomer('James', 'Naidoo');

    if (!thabo || !sarah || !james) {
      throw new Error('Seed customers were not found when inserting seed quotes');
    }

    const seedQuotes: Array<{
      customerId: number;
      amount: number;
      description: string;
      status: QuoteStatus;
      createdDate: string;
    }> = [
      {
        customerId: thabo.id,
        amount: 18500,
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
        status: 'Accepted',
        createdDate: this.daysAgoIso(45),
      },
      {
        customerId: thabo.id,
        amount: 4200.5,
        description:
          'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.',
        status: 'Sent',
        createdDate: this.daysAgoIso(12),
      },
      {
        customerId: thabo.id,
        amount: 9800,
        description:
          'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.',
        status: 'Draft',
        createdDate: this.daysAgoIso(2),
      },
      {
        customerId: sarah.id,
        amount: 67250,
        description:
          'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt.',
        status: 'Accepted',
        createdDate: this.daysAgoIso(30),
      },
      {
        customerId: sarah.id,
        amount: 15400.75,
        description:
          'Nulla facilisi morbi tempus iaculis urna id volutpat lacus laoreet non curabitur.',
        status: 'Rejected',
        createdDate: this.daysAgoIso(20),
      },
      {
        customerId: sarah.id,
        amount: 22100,
        description:
          'Gravida rutrum quisque non tellus orci ac auctor augue mauris augue neque gravida.',
        status: 'Sent',
        createdDate: this.daysAgoIso(5),
      },
      {
        customerId: james.id,
        amount: 31500,
        description:
          'Arcu non odio euismod lacinia at quis risus sed vulputate odio ut enim blandit.',
        status: 'Accepted',
        createdDate: this.daysAgoIso(60),
      },
      {
        customerId: james.id,
        amount: 8900,
        description:
          'Viverra nam libero justo laoreet sit amet cursus sit amet dictum sit amet justo.',
        status: 'Draft',
        createdDate: this.daysAgoIso(1),
      },
    ];

    for (const quote of seedQuotes) {
      db.run(
        `INSERT INTO quotes (customerId, amount, description, status, createdDate)
         VALUES (?, ?, ?, ?, ?)`,
        [
          quote.customerId,
          quote.amount,
          quote.description,
          quote.status,
          quote.createdDate,
        ],
      );
    }

    this.persist(db);
  }

  private assertQuoteDescription(description: string): void {
    if (description.length > QUOTE_DESCRIPTION_MAX_LENGTH) {
      throw new Error(
        `Description must be ${QUOTE_DESCRIPTION_MAX_LENGTH} characters or fewer`,
      );
    }
  }

  private assertQuoteStatus(status: string): void {
    if (!QUOTE_STATUSES.includes(status as QuoteStatus)) {
      throw new Error(`Invalid quote status: ${status}`);
    }
  }

  private parseQuoteStatus(status: string): QuoteStatus {
    if (QUOTE_STATUSES.includes(status as QuoteStatus)) {
      return status as QuoteStatus;
    }

    return 'Draft';
  }

  private assertCustomerNameLengths(firstName: string, lastName: string): void {
    if (firstName.length > 100 || lastName.length > 100) {
      throw new Error('Customer names must be 100 characters or fewer');
    }
  }

  private assertAddressLengths(
    address: Pick<Address, 'street' | 'suburb' | 'city' | 'postalCode'>,
  ): void {
    if (
      address.street.length > 200 ||
      address.suburb.length > 100 ||
      address.city.length > 100 ||
      address.postalCode.length > 20
    ) {
      throw new Error('Address fields exceed the allowed maximum length');
    }
  }

  private daysAgoIso(days: number): string {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString();
  }

  private getLastInsertId(db: Database): number {
    const result = db.exec('SELECT last_insert_rowid() AS id');
    return result[0].values[0][0] as number;
  }

  /** Persist only http(s) university websites; drop unsafe schemes. */
  private sanitizeStoredWebsite(website: string | null | undefined): string | null {
    return sanitizeHttpUrl(website) || null;
  }

  /**
   * Demo-only persistence: the full SQLite DB (including PII) is stored in
   * localStorage as Base64. This is not encrypted and is readable by any
   * script on this origin — do not use for sensitive production data.
   */
  private persist(db: Database): void {
    try {
      const data = db.export();
      localStorage.setItem(DB_STORAGE_KEY, this.encodeBase64(data));
    } catch (error) {
      if (
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
      ) {
        throw new Error(
          'Browser storage is full. Export or clear data before saving more records.',
        );
      }

      throw error;
    }
  }

  private downloadDatabaseFile(data: Uint8Array, filename: string): void {
    const blob = new Blob([data], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
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
