import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncateLongWords',
})
export class TruncateLongWordsPipe implements PipeTransform {
  transform(value: string | null | undefined, maxWordLength = 50): string {
    if (!value) {
      return '';
    }

    return value
      .split(/(\s+)/)
      .map((part) => {
        if (/^\s+$/.test(part) || part.length <= maxWordLength) {
          return part;
        }

        return `${part.slice(0, maxWordLength)}…`;
      })
      .join('');
  }
}
