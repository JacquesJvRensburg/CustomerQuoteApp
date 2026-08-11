import { HasFormErrorPipe } from './has-form-error.pipe';

describe('HasFormErrorPipe', () => {
  const pipe = new HasFormErrorPipe();

  it('returns true only when the error exists and the field is touched or submitted', () => {
    expect(pipe.transform({ required: true }, 'required', false, false)).toBeFalse();
    expect(pipe.transform({ required: true }, 'required', true, false)).toBeTrue();
    expect(pipe.transform({ required: true }, 'required', false, true)).toBeTrue();
    expect(pipe.transform({ maxlength: true }, 'required', true, true)).toBeFalse();
    expect(pipe.transform(null, 'required', true, true)).toBeFalse();
  });
});
