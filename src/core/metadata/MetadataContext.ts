import { createContext, type Dispatch, type SetStateAction } from 'react';
import type { PageMetadata } from './pageMetadata';

export interface MetadataOverride {
  locationKey: string;
  value: Partial<PageMetadata>;
  signature: string;
}

export type SetMetadataOverride = Dispatch<SetStateAction<MetadataOverride | null>>;

export const MetadataContext = createContext<SetMetadataOverride | null>(null);
