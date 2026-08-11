/** Selected university stored on a customer record. */
export interface University {
  name: string;
  website: string;
}

/** Raw university record from the hipolabs API. */
export interface HipolabsUniversity {
  name: string;
  web_pages: string[];
  country: string;
}
