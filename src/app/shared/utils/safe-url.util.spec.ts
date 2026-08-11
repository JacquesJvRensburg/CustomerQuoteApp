import { sanitizeFlagImageUrl, sanitizeHttpUrl } from './safe-url.util';

describe('safe-url.util', () => {
  describe('sanitizeHttpUrl', () => {
    it('should allow http and https URLs', () => {
      expect(sanitizeHttpUrl('https://www.uct.ac.za/')).toBe('https://www.uct.ac.za/');
      expect(sanitizeHttpUrl('http://www.uct.ac.za/')).toBe('http://www.uct.ac.za/');
    });

    it('should reject non-http schemes and invalid values', () => {
      expect(sanitizeHttpUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeHttpUrl('data:text/html,hi')).toBe('');
      expect(sanitizeHttpUrl('not a url')).toBe('');
      expect(sanitizeHttpUrl('')).toBe('');
      expect(sanitizeHttpUrl(null)).toBe('');
    });
  });

  describe('sanitizeFlagImageUrl', () => {
    it('should allow https flagcdn URLs', () => {
      expect(sanitizeFlagImageUrl('https://flagcdn.com/za.svg')).toBe(
        'https://flagcdn.com/za.svg',
      );
      expect(sanitizeFlagImageUrl('https://cdn.flagcdn.com/za.png')).toBe(
        'https://cdn.flagcdn.com/za.png',
      );
    });

    it('should reject non-allowlisted hosts and non-https schemes', () => {
      expect(sanitizeFlagImageUrl('https://evil.example/za.svg')).toBe('');
      expect(sanitizeFlagImageUrl('http://flagcdn.com/za.svg')).toBe('');
      expect(sanitizeFlagImageUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeFlagImageUrl(null)).toBe('');
    });
  });
});
