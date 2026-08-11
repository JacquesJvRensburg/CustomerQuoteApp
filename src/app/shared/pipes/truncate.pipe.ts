import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
})
export class TruncatePipe implements PipeTransform {
  transform(
    value: string | number | null | undefined,
    maxLength = 35,
    maxWordLength = 20,
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    const withTruncatedWords = this.truncateLongWords(String(value), maxWordLength);

    if (withTruncatedWords.length <= maxLength) {
      return withTruncatedWords;
    }

    return `${withTruncatedWords.slice(0, maxLength)}…`;
  }

  private truncateLongWords(value: string, maxWordLength: number): string {
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
