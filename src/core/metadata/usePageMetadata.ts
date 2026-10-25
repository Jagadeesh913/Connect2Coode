import { useContext, useLayoutEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { MetadataContext, type MetadataOverride } from './MetadataContext';
import type { PageMetadata } from './pageMetadata';

export const usePageMetadata = (metadata: Partial<PageMetadata> | null): void => {
  const setOverride = useContext(MetadataContext);
  const location = useLocation();
  const signature = JSON.stringify(metadata);
  const stableMetadata = useMemo<Partial<PageMetadata> | null>(
    () => (signature === 'null' ? null : JSON.parse(signature) as Partial<PageMetadata>),
    [signature]
  );

  useLayoutEffect(() => {
    if (!setOverride || !stableMetadata) return;
    const nextOverride: MetadataOverride = {
      locationKey: location.key,
      value: stableMetadata,
      signature,
    };
    setOverride(nextOverride);

    return () => {
      setOverride((current) =>
        current?.locationKey === location.key && current.signature === signature
          ? null
          : current
      );
    };
  }, [location.key, setOverride, signature, stableMetadata]);
};
