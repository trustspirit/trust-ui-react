import type { Column } from './types';

export interface MobileLayout<T> {
  primary?: Column<T>;
  value?: Column<T>;
  secondary: Column<T>[];
  delta: Column<T>[];
}

/**
 * 한 줄에 값을 몇 개까지 이어 붙일지. 375px 폭에서 세 개를 넣으면
 * 가운데 값이 잘리기 시작한다.
 */
const MAX_GROUP = 2;

/**
 * 모바일 요약 2행에서 각 열이 앉을 자리를 정한다.
 *
 * 명시적 mobileSlot 이 언제나 이기고, 남은 열을 추론이 채운다. 부분 지정을
 * 허용하는 이유는 여섯 열 표에서 한 열만 승격하려는 가장 흔한 요구에
 * 여섯 개를 전부 적게 만들지 않기 위해서다.
 */
export function resolveMobileSlots<T>(columns: Column<T>[]): MobileLayout<T> {
  const layout: MobileLayout<T> = { secondary: [], delta: [] };
  const taken = new Set<Column<T>>();

  // 1) 명시적 지정. 'hidden' 도 taken 에 넣어 추론이 되살리지 못하게 한다.
  for (const col of columns) {
    if (!col.mobileSlot) continue;
    taken.add(col);
    if (col.mobileSlot === 'primary') layout.primary ??= col;
    else if (col.mobileSlot === 'value') layout.value ??= col;
    else if (col.mobileSlot === 'secondary' && layout.secondary.length < MAX_GROUP)
      layout.secondary.push(col);
    else if (col.mobileSlot === 'delta' && layout.delta.length < MAX_GROUP)
      layout.delta.push(col);
  }

  const remaining = () => columns.filter((col) => !taken.has(col));

  // 2) primary — 첫 번째 비수치 열. 이름이나 제목이 여기 온다.
  if (!layout.primary) {
    const rest = remaining();
    const pick = rest.find((col) => !col.numeric) ?? rest[0];
    if (pick) {
      layout.primary = pick;
      taken.add(pick);
    }
  }

  // 3) delta — tone 이 붙은 수치 열. 등락을 나타내는 열이 여기 온다.
  for (const col of remaining()) {
    if (layout.delta.length >= MAX_GROUP) break;
    if (col.numeric && col.tone && col.tone !== 'none') {
      layout.delta.push(col);
      taken.add(col);
    }
  }

  // 4) value — 남은 수치 열의 마지막(가장 결과에 가까운 값).
  //    수치 열이 없으면 남은 열의 마지막을 쓴다.
  if (!layout.value) {
    const rest = remaining();
    const pick = [...rest].reverse().find((col) => col.numeric) ?? rest[rest.length - 1];
    if (pick) {
      layout.value = pick;
      taken.add(pick);
    }
  }

  // 5) secondary — 그래도 남은 열을 선언 순서로. 넘치는 것은 감춘다.
  for (const col of remaining()) {
    if (layout.secondary.length >= MAX_GROUP) break;
    layout.secondary.push(col);
    taken.add(col);
  }

  return layout;
}
