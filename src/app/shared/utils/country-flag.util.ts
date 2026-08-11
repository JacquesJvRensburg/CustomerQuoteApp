import { CountryFlags } from '../../models/country.model';

/** Prefer API flag images; fall back to flagcdn for a given ISO alpha-2 code. */
export function countryFlagUrl(
  countryCode: string | null | undefined,
  flags?: CountryFlags | null,
): string {
  if (flags?.svg) {
    return flags.svg;
  }

  if (flags?.png) {
    return flags.png;
  }

  const code = countryCode?.trim().toLowerCase() ?? '';
  if (!/^[a-z]{2}$/.test(code)) {
    return '';
  }

  return `https://flagcdn.com/${code}.svg`;
}
