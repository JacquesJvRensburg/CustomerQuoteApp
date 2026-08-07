export interface Address {
  street: string;
  city: string;
  suburb: string;
  postalCode: string;
}

/** Persisted address row including generated primary key. */
export interface AddressEntity extends Address {
  id: number;
}
