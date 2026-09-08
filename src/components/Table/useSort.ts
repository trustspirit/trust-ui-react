import { useCallback, useMemo, useState } from 'react';
import { nextSortSelection, nextSortState, sortRows } from './values';
import type { SortState } from './types';

/**
 * 정렬 상태만 들고 있는 얇은 글루. 비교와 순환 규칙은 values.ts 의
 * 순수 함수가 갖고 있고 거기서 단위 테스트로 고정된다.
 */
export function useSort<T>(data: T[]) {
  const [sort, setSort] = useState<SortState>({ key: null, direction: null });

  /** 열 머리용 — 오름 → 내림 → 해제 */
  const toggle = useCallback((key: string) => {
    setSort((prev) => nextSortState(prev, key));
  }, []);

  /** 목록 선택용 — 방향만 뒤집고 해제하지 않는다 */
  const select = useCallback((key: string) => {
    setSort((prev) => nextSortSelection(prev, key));
  }, []);

  const clear = useCallback(() => {
    setSort({ key: null, direction: null });
  }, []);

  const sorted = useMemo(
    () => sortRows(data, sort.key, sort.direction),
    [data, sort.key, sort.direction],
  );

  return { sort, toggle, select, clear, sorted };
}
