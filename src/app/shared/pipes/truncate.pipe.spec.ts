import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  const pipe = new TruncatePipe();

  it('should return empty string for nullish values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should leave short values unchanged', () => {
    expect(pipe.transform('Short name')).toBe('Short name');
    expect(pipe.transform(42)).toBe('42');
  });

  it('should truncate values longer than 35 characters by default', () => {
    const value = 'University of the Western Cape of South Africa';
    expect(value.length).toBeGreaterThan(35);
    expect(pipe.transform(value)).toBe(`${value.slice(0, 35)}…`);
  });

  it('should respect a custom max length', () => {
    expect(pipe.transform('Hello world', 5)).toBe('Hello…');
  });
});
