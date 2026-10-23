import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  fetchReferenceGroup,
  normalizeReferenceGroupCode,
} from '../redux/referenceSlice';
import type { ReferenceItem } from '../../../core/types/domain';

const EMPTY_ITEMS: ReferenceItem[] = [];

export const useReferenceGroup = (groupCode: string, enabled = true) => {
  const dispatch = useAppDispatch();
  const normalizedCode = useMemo(
    () => normalizeReferenceGroupCode(groupCode),
    [groupCode]
  );
  const items = useAppSelector(
    (state) => state.references.groups[normalizedCode] || EMPTY_ITEMS
  );
  const loading = useAppSelector(
    (state) => Boolean(state.references.loading[normalizedCode])
  );
  const error = useAppSelector(
    (state) => state.references.errors[normalizedCode] || null
  );

  useEffect(() => {
    if (!enabled || !normalizedCode) return;
    void dispatch(fetchReferenceGroup(normalizedCode));
  }, [dispatch, enabled, normalizedCode]);

  const retry = useCallback(
    () => dispatch(fetchReferenceGroup({ groupCode: normalizedCode, force: true })),
    [dispatch, normalizedCode]
  );

  return { items, loading, error, retry };
};
