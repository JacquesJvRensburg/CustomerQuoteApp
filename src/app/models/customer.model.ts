import { Address } from './address.model';

export interface Customer {
  firstName: string;
  lastName: string;
  addresses: Address[];
}

/** Persisted customer row including generated primary key. */
export interface CustomerEntity extends Customer {
  id: number;
}
