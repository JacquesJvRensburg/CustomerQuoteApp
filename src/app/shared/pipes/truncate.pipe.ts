import { Pipe, PipeTransform } from '@angular/core';

import { truncateText } from '../utils/truncate.util';

@Pipe({
  name: 'truncate',
})
export class TruncatePipe implements PipeTransform {
  transform(
    value: string | number | null | undefined,
    maxLength = 35,
    maxWordLength = 20,
  ): string {
    return truncateText(value, maxLength, maxWordLength);
  }
}
