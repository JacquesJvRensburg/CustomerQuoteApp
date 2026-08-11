/** Single country prediction from the Nationalize API. */
export interface NationalizeCountry {
  country_id: string;
  probability: number;
}

/** Nationalize API response for a name query. */
export interface NationalizeResponse {
  count: number;
  name: string;
  country: NationalizeCountry[];
}
