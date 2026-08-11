import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { Customer } from '../../models/customer.model';
import { QUOTE_DESCRIPTION_MAX_LENGTH } from '../../models/quote.model';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  const storageKey = 'customer-quote-app-sqlite';

  let service: DatabaseService;

  const baseCustomer: Customer = {
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
  };

  beforeEach(() => {
    localStorage.removeItem(storageKey);
    TestBed.configureTestingModule({
      providers: [DatabaseService],
    });
    service = TestBed.inject(DatabaseService);
  });

  afterEach(() => {
    localStorage.removeItem(storageKey);
  });

  it('should initialize an empty database', async () => {
    const customers = await firstValueFrom(service.getCustomers());
    const quotes = await firstValueFrom(service.getQuotes());

    expect(customers).toEqual([]);
    expect(quotes).toEqual([]);
  });

  it('should save and retrieve a customer with addresses', async () => {
    const saved = await firstValueFrom(service.saveCustomer(baseCustomer));

    expect(saved.id).toBeGreaterThan(0);
    expect(saved.firstName).toBe('Thabo');
    expect(saved.addresses.length).toBe(1);
    expect(saved.addresses[0].street).toBe('12 Long Street');

    const customers = await firstValueFrom(service.getCustomers());
    expect(customers).toEqual([saved]);

    const byId = await firstValueFrom(service.getCustomerById(saved.id));
    expect(byId).toEqual(saved);
  });

  it('should return null for a missing customer id', async () => {
    const byId = await firstValueFrom(service.getCustomerById(999));
    expect(byId).toBeNull();
  });

  it('should reject customer names longer than 100 characters', async () => {
    await expectAsync(
      firstValueFrom(
        service.saveCustomer({
          ...baseCustomer,
          firstName: 'a'.repeat(101),
        }),
      ),
    ).toBeRejectedWithError('Customer names must be 100 characters or fewer');
  });

  it('should update customer names and enrichment fields', async () => {
    const saved = await firstValueFrom(service.saveCustomer(baseCustomer));

    const updated = await firstValueFrom(
      service.updateCustomerNames(
        saved.id,
        'Teboho',
        'Molefe',
        'BW',
        'University of Botswana',
        'https://www.ub.bw/',
      ),
    );

    expect(updated.firstName).toBe('Teboho');
    expect(updated.nationalityCode).toBe('BW');
    expect(updated.universityName).toBe('University of Botswana');
    expect(updated.addresses).toEqual(saved.addresses);
  });

  it('should replace a customer and addresses via updateCustomer', async () => {
    const saved = await firstValueFrom(service.saveCustomer(baseCustomer));

    const updated = await firstValueFrom(
      service.updateCustomer(saved.id, {
        ...baseCustomer,
        firstName: 'Sarah',
        lastName: 'van Wyk',
        addresses: [
          {
            street: '45 Rivonia Road',
            city: 'Johannesburg',
            suburb: 'Sandton',
            postalCode: '2196',
          },
        ],
      }),
    );

    expect(updated.firstName).toBe('Sarah');
    expect(updated.addresses.length).toBe(1);
    expect(updated.addresses[0].city).toBe('Johannesburg');
  });

  it('should delete a customer', async () => {
    const saved = await firstValueFrom(service.saveCustomer(baseCustomer));
    await firstValueFrom(service.deleteCustomer(saved.id));

    expect(await firstValueFrom(service.getCustomers())).toEqual([]);
  });

  it('should update an address', async () => {
    const saved = await firstValueFrom(service.saveCustomer(baseCustomer));
    const address = saved.addresses[0];

    const updated = await firstValueFrom(
      service.updateAddress({
        ...address,
        city: 'Stellenbosch',
      }),
    );

    expect(updated.addresses[0].city).toBe('Stellenbosch');
  });

  it('should not allow deleting the last address', async () => {
    const saved = await firstValueFrom(service.saveCustomer(baseCustomer));

    await expectAsync(
      firstValueFrom(service.deleteAddress(saved.addresses[0].id)),
    ).toBeRejectedWithError('A customer must have at least one address');
  });

  it('should delete an address when more than one exists', async () => {
    const saved = await firstValueFrom(
      service.saveCustomer({
        ...baseCustomer,
        addresses: [
          ...baseCustomer.addresses,
          {
            street: '8 Beach Road',
            city: 'Durban',
            suburb: 'Umhlanga',
            postalCode: '4319',
          },
        ],
      }),
    );

    const updated = await firstValueFrom(service.deleteAddress(saved.addresses[0].id));
    expect(updated.addresses.length).toBe(1);
    expect(updated.addresses[0].city).toBe('Durban');
  });

  it('should save, update, and delete quotes', async () => {
    const customer = await firstValueFrom(service.saveCustomer(baseCustomer));

    const savedQuote = await firstValueFrom(
      service.saveQuote({
        customerId: customer.id,
        amount: 1500.5,
        description: 'Installation',
        status: 'Draft',
      }),
    );

    expect(savedQuote.customerFullName).toBe('Thabo Molefe');
    expect(savedQuote.amount).toBe(1500.5);
    expect(savedQuote.status).toBe('Draft');

    const updatedQuote = await firstValueFrom(
      service.updateQuote(savedQuote.id, {
        customerId: customer.id,
        amount: 2000,
        description: 'Installation updated',
        status: 'Sent',
      }),
    );

    expect(updatedQuote.amount).toBe(2000);
    expect(updatedQuote.status).toBe('Sent');

    await firstValueFrom(service.deleteQuote(savedQuote.id));
    expect(await firstValueFrom(service.getQuotes())).toEqual([]);
  });

  it('should reject invalid quote payloads', async () => {
    const customer = await firstValueFrom(service.saveCustomer(baseCustomer));

    await expectAsync(
      firstValueFrom(
        service.saveQuote({
          customerId: customer.id,
          amount: 1,
          description: 'x'.repeat(QUOTE_DESCRIPTION_MAX_LENGTH + 1),
          status: 'Draft',
        }),
      ),
    ).toBeRejectedWithError(
      `Description must be ${QUOTE_DESCRIPTION_MAX_LENGTH} characters or fewer`,
    );

    await expectAsync(
      firstValueFrom(
        service.saveQuote({
          customerId: customer.id,
          amount: 1,
          description: 'ok',
          status: 'Pending' as 'Draft',
        }),
      ),
    ).toBeRejectedWithError('Invalid quote status: Pending');

    await expectAsync(
      firstValueFrom(
        service.saveQuote({
          customerId: 999,
          amount: 1,
          description: 'ok',
          status: 'Draft',
        }),
      ),
    ).toBeRejectedWithError('Customer with id 999 not found');
  });

  it('should seed demo customers and quotes when empty', async () => {
    await firstValueFrom(service.ensureSeedData());

    const customers = await firstValueFrom(service.getCustomers());
    const quotes = await firstValueFrom(service.getQuotes());

    expect(customers.length).toBe(3);
    expect(quotes.length).toBe(8);
    expect(customers.map((c) => c.lastName).sort()).toEqual(['Molefe', 'Naidoo', 'van Wyk']);
  });

  it('should not reseed when customers already exist', async () => {
    await firstValueFrom(service.saveCustomer(baseCustomer));
    await firstValueFrom(service.ensureSeedData());

    const customers = await firstValueFrom(service.getCustomers());
    expect(customers.length).toBe(1);
    expect(await firstValueFrom(service.getQuotes())).toEqual([]);
  });

  it('should persist data across service instances', async () => {
    await firstValueFrom(service.saveCustomer(baseCustomer));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [DatabaseService],
    });
    const reloaded = TestBed.inject(DatabaseService);

    const customers = await firstValueFrom(reloaded.getCustomers());
    expect(customers.length).toBe(1);
    expect(customers[0].firstName).toBe('Thabo');
  });

  it('should export the database as a downloadable file', async () => {
    await firstValueFrom(service.saveCustomer(baseCustomer));

    const createObjectURL = spyOn(URL, 'createObjectURL').and.returnValue('blob:db');
    const revokeObjectURL = spyOn(URL, 'revokeObjectURL');
    const originalCreateElement = document.createElement.bind(document);
    const anchor = originalCreateElement('a');
    spyOn(anchor, 'click');
    spyOn(document, 'createElement').and.callFake((tagName: string) => {
      if (tagName === 'a') {
        return anchor;
      }
      return originalCreateElement(tagName);
    });

    await firstValueFrom(service.exportDatabase());

    expect(createObjectURL).toHaveBeenCalled();
    expect(anchor.click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:db');
  });
});
