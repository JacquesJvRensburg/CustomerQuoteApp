import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'editFieldInvalid',
})
export class EditFieldInvalidPipe implements PipeTransform {
  transform(
    value: string | number | null | undefined,
    editAttempted: boolean,
    kind: 'required' | 'amount' = 'required',
  ): boolean {
    if (!editAttempted) {
      return false;
    }

    const text = value == null ? '' : String(value).trim();

    if (kind === 'amount') {
      if (!text) {
        return true;
      }

      const amount = Number(text);
      return !Number.isFinite(amount) || amount < 0;
    }

    return !text;
  }
}
