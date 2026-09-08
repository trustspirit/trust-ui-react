import { useCallback, useMemo, useState } from 'react';
import { nextSortState, sortRows } from './values';
import type { SortState } from './types';

/**
 * 정렬 상태만 들고 있는 얇은 글루. 비교와 순환 규칙은 values.ts 의
 * 순수 함수가 갖고 있고 거기서 단위 테스트로 고정된다.
 */
export function useSort<T>(data: T[]) {
  const [sort, setSort] = useState<SortState>({ key: null, direction: null });

  const toggle = useCallback((key: string) => {
    setSort((prev) => nextSortState(prev, key));
  }, []);

  const sorted = useMemo(
    () => sortRows(data, sort.key, sort.direction),
    [data, sort.key, sort.direction],
  );

  return { sort, toggle, sorted };
}
