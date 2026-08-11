import { Address, AddressEntity } from './address.model';

export interface Customer {
  firstName: string;
  lastName: string;
  nationalityCode: string | null;
  universityName: string | null;
  universityWebsite: string | null;
  addresses: Address[];
}

/** Persisted customer row including generated primary key. */
export interface CustomerEntity {
  id: number;
  firstName: string;
  lastName: string;
  nationalityCode: string | null;
  universityName: string | null;
  universityWebsite: string | null;
  addresses: AddressEntity[];
}
