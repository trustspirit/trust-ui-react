/** Step on the fixed spacing scale. `0` removes the gap; `1`–`6` map to `--tui-gap-1`…`--tui-gap-6`. */
export type StackGap = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// 템플릿 리터럴로 조립하지 않고 전부 적는다 — 토큰 계약 검사가 정적 참조만 볼 수 있다.
// 0 에도 단위를 붙인다: Grid 가 이 값을 calc() 안에서 길이로 쓴다.
const GAP_VALUES: Record<StackGap, string> = {
  0: '0px',
  1: 'var(--tui-gap-1)',
  2: 'var(--tui-gap-2)',
  3: 'var(--tui-gap-3)',
  4: 'var(--tui-gap-4)',
  5: 'var(--tui-gap-5)',
  6: 'var(--tui-gap-6)',
};

/** CSS value for a spacing step. Falls back to `fallback` for anything off the scale. */
export function gapValue(gap: StackGap, fallback: StackGap): string {
  return GAP_VALUES[gap] ?? GAP_VALUES[fallback];
}
