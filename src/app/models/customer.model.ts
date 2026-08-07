import { Address, AddressEntity } from './address.model';

export interface Customer {
  firstName: string;
  lastName: string;
  addresses: Address[];
}

/** Persisted customer row including generated primary key. */
export interface CustomerEntity {
  id: number;
  firstName: string;
  lastName: string;
  addresses: AddressEntity[];
}
