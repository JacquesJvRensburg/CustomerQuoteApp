import { EditFieldInvalidPipe } from './edit-field-invalid.pipe';

describe('EditFieldInvalidPipe', () => {
  const pipe = new EditFieldInvalidPipe();

  it('returns false when edit has not been attempted', () => {
    expect(pipe.transform('', false)).toBeFalse();
    expect(pipe.transform(-1, false, 'amount')).toBeFalse();
  });

  it('flags empty required values after attempt', () => {
    expect(pipe.transform('  ', true)).toBeTrue();
    expect(pipe.transform('ok', true)).toBeFalse();
  });

  it('flags invalid amounts after attempt', () => {
    expect(pipe.transform('', true, 'amount')).toBeTrue();
    expect(pipe.transform('-1', true, 'amount')).toBeTrue();
    expect(pipe.transform('abc', true, 'amount')).toBeTrue();
    expect(pipe.transform('0', true, 'amount')).toBeFalse();
    expect(pipe.transform('12.5', true, 'amount')).toBeFalse();
  });
});
