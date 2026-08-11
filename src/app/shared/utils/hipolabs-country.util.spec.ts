import { toHipolabsCountryName } from './hipolabs-country.util';

describe('toHipolabsCountryName', () => {
  it('should map United States of America to United States', () => {
    expect(toHipolabsCountryName('United States of America')).toBe('United States');
  });

  it('should map the United Kingdom long form', () => {
    expect(
      toHipolabsCountryName('United Kingdom of Great Britain and Northern Ireland'),
    ).toBe('United Kingdom');
  });

  it('should leave unmatched country names unchanged', () => {
    expect(toHipolabsCountryName('South Africa')).toBe('South Africa');
  });

  it('should trim whitespace', () => {
    expect(toHipolabsCountryName('  United States of America  ')).toBe('United States');
  });
});
