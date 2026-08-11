import { Pipe, PipeTransform } from '@angular/core';

import { truncateLongWords } from '../utils/truncate.util';

@Pipe({
  name: 'truncateLongWords',
})
export class TruncateLongWordsPipe implements PipeTransform {
  transform(value: string | null | undefined, maxWordLength = 20): string {
    if (!value) {
      return '';
    }

    return truncateLongWords(value, maxWordLength);
  }
}
