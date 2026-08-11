import { truncateLongWords, truncateText } from './truncate.util';

describe('truncateLongWords', () => {
  it('should leave short words unchanged', () => {
    expect(truncateLongWords('hello world')).toBe('hello world');
  });

  it('should truncate words longer than the max word length', () => {
    expect(truncateLongWords('supercalifragilisticexpialidocious', 10)).toBe('supercalif…');
  });

  it('should preserve whitespace between parts', () => {
    expect(truncateLongWords('short  supercalifragilisticexpialidocious', 10)).toBe(
      'short  supercalif…',
    );
  });

  it('should use a default max word length of 20', () => {
    expect(truncateLongWords('abcdefghijklmnopqrstuvwxyz')).toBe('abcdefghijklmnopqrst…');
  });
});

describe('truncateText', () => {
  it('should return an empty string for nullish values', () => {
    expect(truncateText(null)).toBe('');
    expect(truncateText(undefined)).toBe('');
  });

  it('should coerce numbers to strings', () => {
    expect(truncateText(42)).toBe('42');
  });

  it('should leave short values unchanged', () => {
    expect(truncateText('Short name')).toBe('Short name');
  });

  it('should truncate values longer than the max length', () => {
    const value = 'University of the Western Cape of South Africa';
    expect(truncateText(value)).toBe(`${value.slice(0, 35)}…`);
  });

  it('should truncate long words before applying the overall length limit', () => {
    const value = 'Visit https://verylongdomainname.example.com/path today please';
    const result = truncateText(value);

    expect(result).toContain('https://verylongdoma…');
    expect(result.length).toBeLessThanOrEqual(36);
  });

  it('should respect custom max length and max word length', () => {
    expect(truncateText('Hello world', 5)).toBe('Hello…');
    expect(truncateText('supercalifragilistic', 50, 5)).toBe('super…');
  });
});
