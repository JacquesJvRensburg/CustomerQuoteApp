import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'editFieldInvalid',
})
export class EditFieldInvalidPipe implements PipeTransform {
  transform(value: string | number | null | undefined, editAttempted: boolean): boolean {
    const text = value == null ? '' : String(value);
    return editAttempted && !text.trim();
  }
}
