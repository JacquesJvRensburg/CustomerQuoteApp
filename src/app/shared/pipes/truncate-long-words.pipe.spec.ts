import { TruncateLongWordsPipe } from './truncate-long-words.pipe';

describe('TruncateLongWordsPipe', () => {
  const pipe = new TruncateLongWordsPipe();

  it('returns empty string for nullish values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should truncate only long words', () => {
    expect(pipe.transform('short supercalifragilisticexpialidocious', 10)).toBe(
      'short supercalif…',
    );
  });
});
