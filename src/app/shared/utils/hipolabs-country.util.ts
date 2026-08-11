/**
 * countries.dev official names often don't match hipolabs country filters.
 * Map known aliases (lowercased) to the hipolabs `country` query value.
 */
const HIPOLABS_COUNTRY_ALIASES: Readonly<Record<string, string>> = {
  'united states of america': 'United States',
  'united states': 'United States',
  usa: 'United States',
  'u.s.a.': 'United States',
  'u.s.': 'United States',
  'united kingdom of great britain and northern ireland': 'United Kingdom',
  'united kingdom': 'United Kingdom',
  'great britain': 'United Kingdom',
  'korea (republic of)': 'Korea, Republic of',
  'republic of korea': 'Korea, Republic of',
  'south korea': 'Korea, Republic of',
  'korea (democratic people\'s republic of)': "Korea, Democratic People's Republic of",
  'north korea': "Korea, Democratic People's Republic of",
  'russian federation': 'Russian Federation',
  russia: 'Russian Federation',
  'viet nam': 'Viet Nam',
  vietnam: 'Viet Nam',
  'taiwan, province of china': 'Taiwan',
  taiwan: 'Taiwan',
  'iran (islamic republic of)': 'Iran',
  iran: 'Iran',
  'syria arab republic': 'Syrian Arab Republic',
  syria: 'Syrian Arab Republic',
  'tanzania, united republic of': 'Tanzania, United Republic of',
  tanzania: 'Tanzania, United Republic of',
  'bolivia (plurinational state of)': 'Bolivia, Plurinational State of',
  bolivia: 'Bolivia, Plurinational State of',
  'venezuela (bolivarian republic of)': 'Venezuela, Bolivarian Republic of',
  venezuela: 'Venezuela, Bolivarian Republic of',
  'moldova (republic of)': 'Moldova, Republic of',
  moldova: 'Moldova, Republic of',
  'palestine, state of': 'Palestine, State of',
  palestine: 'Palestine, State of',
  'czech republic': 'Czech Republic',
  czechia: 'Czech Republic',
};

/** Converts a countries.dev (or free-text) country name to a hipolabs-compatible value. */
export function toHipolabsCountryName(countryName: string): string {
  const trimmed = countryName.trim();
  if (!trimmed) {
    return trimmed;
  }

  return HIPOLABS_COUNTRY_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}
