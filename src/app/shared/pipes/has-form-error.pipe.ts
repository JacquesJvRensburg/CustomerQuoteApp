import { Pipe, PipeTransform } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

@Pipe({
  name: 'hasFormError',
})
export class HasFormErrorPipe implements PipeTransform {
  transform(
    errors: ValidationErrors | null,
    errorCode: string,
    touched: boolean,
    submitted: boolean
  ): boolean {
    return !!errors?.[errorCode] && (touched || submitted);
  }
}
