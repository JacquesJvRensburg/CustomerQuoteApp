/** Truncates individual words longer than maxWordLength. */
export function truncateLongWords(value: string, maxWordLength = 20): string {
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

/** Truncates long words, then the full string to maxLength. */
export function truncateText(
  value: string | number | null | undefined,
  maxLength = 35,
  maxWordLength = 20,
): string {
  if (value === null || value === undefined) {
    return '';
  }

  const withTruncatedWords = truncateLongWords(String(value), maxWordLength);

  if (withTruncatedWords.length <= maxLength) {
    return withTruncatedWords;
  }

  return `${withTruncatedWords.slice(0, maxLength)}…`;
}
