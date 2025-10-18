
'use client';
import { useMemo, type DependencyList } from 'react';

type Memoized<T> = T & { __memo?: boolean };

export function useMemoized<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);

  if (typeof memoized === 'object' && memoized !== null) {
    (memoized as Memoized<T>).__memo = true;
  }

  return memoized;
}
