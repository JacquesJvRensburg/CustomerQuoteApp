import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'editFieldInvalid',
})
export class EditFieldInvalidPipe implements PipeTransform {
  transform(value: string | null | undefined, editAttempted: boolean): boolean {
    return editAttempted && !(value ?? '').trim();
  }
}
