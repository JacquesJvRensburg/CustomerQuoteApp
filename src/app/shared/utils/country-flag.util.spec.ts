import { countryFlagUrl } from './country-flag.util';

describe('countryFlagUrl', () => {
  it('should prefer the SVG flag from the API', () => {
    expect(
      countryFlagUrl('ZA', {
        png: 'https://example.com/za.png',
        svg: 'https://example.com/za.svg',
      }),
    ).toBe('https://example.com/za.svg');
  });

  it('should fall back to the PNG flag when SVG is missing', () => {
    expect(
      countryFlagUrl('ZA', {
        png: 'https://example.com/za.png',
        svg: '',
      }),
    ).toBe('https://example.com/za.png');
  });

  it('should fall back to flagcdn for a valid alpha-2 code', () => {
    expect(countryFlagUrl('za')).toBe('https://flagcdn.com/za.svg');
  });

  it('should return an empty string for invalid codes', () => {
    expect(countryFlagUrl('Z')).toBe('');
    expect(countryFlagUrl(null)).toBe('');
  });
});
