import { CountryFlags } from '../../models/country.model';
import { sanitizeFlagImageUrl } from './safe-url.util';

/** Prefer allowlisted API flag images; fall back to flagcdn for a given ISO alpha-2 code. */
export function countryFlagUrl(
  countryCode: string | null | undefined,
  flags?: CountryFlags | null,
): string {
  const svg = sanitizeFlagImageUrl(flags?.svg);
  if (svg) {
    return svg;
  }

  const png = sanitizeFlagImageUrl(flags?.png);
  if (png) {
    return png;
  }

  const code = countryCode?.trim().toLowerCase() ?? '';
  if (!/^[a-z]{2}$/.test(code)) {
    return '';
  }

  return `https://flagcdn.com/${code}.svg`;
}
