/** Flag image URLs from countries.dev. */
export interface CountryFlags {
  png: string;
  svg: string;
}

/** Country record from countries.dev (name, codes, and flags). */
export interface Country {
  name: string;
  flag: string;
  flags: CountryFlags;
  alpha2Code: string;
}

/** Nationalize prediction joined with countries.dev metadata. */
export interface CountryPrediction extends Country {
  probability: number;
}
