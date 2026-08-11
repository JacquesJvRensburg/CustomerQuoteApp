import { countryFlagUrl } from './country-flag.util';

describe('countryFlagUrl', () => {
  it('should prefer the SVG flag from an allowlisted host', () => {
    expect(
      countryFlagUrl('ZA', {
        png: 'https://flagcdn.com/za.png',
        svg: 'https://flagcdn.com/za.svg',
      }),
    ).toBe('https://flagcdn.com/za.svg');
  });

  it('should fall back to the PNG flag when SVG is missing', () => {
    expect(
      countryFlagUrl('ZA', {
        png: 'https://flagcdn.com/za.png',
        svg: '',
      }),
    ).toBe('https://flagcdn.com/za.png');
  });

  it('should ignore non-allowlisted API flag hosts and use flagcdn', () => {
    expect(
      countryFlagUrl('ZA', {
        png: 'https://evil.example/za.png',
        svg: 'https://evil.example/za.svg',
      }),
    ).toBe('https://flagcdn.com/za.svg');
  });

  it('should fall back to flagcdn for a valid alpha-2 code', () => {
    expect(countryFlagUrl('za')).toBe('https://flagcdn.com/za.svg');
  });

  it('should return an empty string for invalid codes', () => {
    expect(countryFlagUrl('Z')).toBe('');
    expect(countryFlagUrl(null)).toBe('');
  });
});
