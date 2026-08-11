import { QuoteEntity } from '../../../models/quote.model';
import { selectFilteredQuotes } from './quote.selectors';

describe('quote selectors', () => {
  const quotes: QuoteEntity[] = [
    {
      id: 1,
      customerId: 10,
      customerFullName: 'Thabo Molefe',
      amount: 18500,
      description: 'Network installation',
      status: 'Accepted',
      createdDate: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      customerId: 20,
      customerFullName: 'Sarah van Wyk',
      amount: 4200.5,
      description: 'Consulting retainer',
      status: 'Draft',
      createdDate: '2026-02-01T00:00:00.000Z',
    },
  ];

  it('should return all quotes when no filters are set', () => {
    expect(selectFilteredQuotes.projector(quotes, '', null)).toEqual(quotes);
    expect(selectFilteredQuotes.projector(quotes, '   ', null)).toEqual(quotes);
  });

  it('should prefer the customer id filter over the text filter', () => {
    expect(selectFilteredQuotes.projector(quotes, 'sarah', 10)).toEqual([quotes[0]]);
  });

  it('should filter quotes by searchable text fields', () => {
    expect(selectFilteredQuotes.projector(quotes, 'thabo', null)).toEqual([quotes[0]]);
    expect(selectFilteredQuotes.projector(quotes, 'draft', null)).toEqual([quotes[1]]);
    expect(selectFilteredQuotes.projector(quotes, '4200.5', null)).toEqual([quotes[1]]);
    expect(selectFilteredQuotes.projector(quotes, 'missing', null)).toEqual([]);
  });
});
