import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
})
export class TruncatePipe implements PipeTransform {
  transform(value: string | number | null | undefined, maxLength = 35): string {
    if (value === null || value === undefined) {
      return '';
    }

    const text = String(value);
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength)}…`;
  }
}
