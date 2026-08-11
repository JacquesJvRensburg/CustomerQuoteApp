import { AddressEntity } from '../../../models/address.model';
import { Country } from '../../../models/country.model';
import { CustomerEntity } from '../../../models/customer.model';
import {
  selectCustomerById,
  selectCustomerTableRows,
  selectFilteredCustomerTableRows,
} from './customer.selectors';

describe('customer selectors', () => {
  const address: AddressEntity = {
    id: 10,
    street: '12 Long Street',
    city: 'Cape Town',
    suburb: 'City Centre',
    postalCode: '8001',
  };

  const customer: CustomerEntity = {
    id: 1,
    firstName: 'Thabo',
    lastName: 'Molefe',
    nationalityCode: 'za',
    universityName: 'University of Cape Town',
    universityWebsite: 'http://www.uct.ac.za/',
    addresses: [address],
  };

  const country: Country = {
    name: 'South Africa',
    flag: '🇿🇦',
    flags: { png: 'https://flagcdn.com/za.png', svg: 'https://flagcdn.com/za.svg' },
    alpha2Code: 'ZA',
  };

  it('should map customers to table rows with nationality metadata', () => {
    const rows = selectCustomerTableRows.projector([customer], [country]);

    expect(rows).toEqual([
      {
        id: 1,
        firstName: 'Thabo',
        lastName: 'Molefe',
        nationalityCode: 'ZA',
        nationalityName: 'South Africa',
        nationalityFlagUrl: 'https://flagcdn.com/za.svg',
        universityName: 'University of Cape Town',
        universityWebsite: 'http://www.uct.ac.za/',
        addressSearchText: '12 Long Street City Centre Cape Town 8001',
      },
    ]);
  });

  it('should fall back to the nationality code when the country is unknown', () => {
    const rows = selectCustomerTableRows.projector(
      [{ ...customer, nationalityCode: 'XX' }],
      [],
    );

    expect(rows[0].nationalityCode).toBe('XX');
    expect(rows[0].nationalityName).toBe('XX');
    expect(rows[0].nationalityFlagUrl).toBe('https://flagcdn.com/xx.svg');
  });

  it('should leave nationality fields empty when no code is set', () => {
    const rows = selectCustomerTableRows.projector(
      [{ ...customer, nationalityCode: null }],
      [country],
    );

    expect(rows[0].nationalityCode).toBeNull();
    expect(rows[0].nationalityName).toBeNull();
    expect(rows[0].nationalityFlagUrl).toBe('');
  });

  it('should return all rows when the filter is blank', () => {
    const rows = selectCustomerTableRows.projector([customer], [country]);
    expect(selectFilteredCustomerTableRows.projector(rows, '   ')).toEqual(rows);
  });

  it('should filter rows by name, nationality, university, or address text', () => {
    const rows = selectCustomerTableRows.projector([customer], [country]);

    expect(selectFilteredCustomerTableRows.projector(rows, 'thabo')).toEqual(rows);
    expect(selectFilteredCustomerTableRows.projector(rows, 'south africa')).toEqual(rows);
    expect(selectFilteredCustomerTableRows.projector(rows, 'cape town')).toEqual(rows);
    expect(selectFilteredCustomerTableRows.projector(rows, 'missing')).toEqual([]);
  });

  it('should select a customer by id', () => {
    expect(selectCustomerById(1).projector([customer])).toEqual(customer);
    expect(selectCustomerById(99).projector([customer])).toBeNull();
  });
});
