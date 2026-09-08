/**
 * 아직 v1 잔재(삭제된 토큰/prop/파일 안내)를 담고 있는 문서 파일들.
 * 문서 작업(Task 3~7)이 한 파일을 정리할 때마다 해당 줄을 지운다.
 * 이 배열이 비면 문서 마이그레이션이 끝난 것이다.
 *
 * 2026-09-09 실측: 43개 대상 파일(docs-site/docs/**\/*.mdx 37개 +
 * docs-site/src/**\/*.{tsx,ts,css} 6개) 중 29개가 검사 1~3 중 하나 이상에 걸렸다.
 *
 * migration-v1-to-v2.mdx 는 여기 없다 — 아래 EXEMPT 를 본다.
 */
export const STALE: string[] = [
  'docs-site/docs/components/action-sheet.mdx',
  'docs-site/docs/components/avatar.mdx',
  'docs-site/docs/components/bottom-sheet.mdx',
  'docs-site/docs/components/button.mdx',
  'docs-site/docs/components/checkbox.mdx',
  'docs-site/docs/components/date-picker.mdx',
  'docs-site/docs/components/dialog.mdx',
  'docs-site/docs/components/expander.mdx',
  'docs-site/docs/components/keyboard-avoiding-view.mdx',
  'docs-site/docs/components/progress.mdx',
  'docs-site/docs/components/safe-area-view.mdx',
  'docs-site/docs/components/segmented-control.mdx',
  'docs-site/docs/components/select.mdx',
  'docs-site/docs/components/slider.mdx',
  'docs-site/docs/components/sticky-footer.mdx',
  'docs-site/docs/components/switch.mdx',
  'docs-site/docs/components/table.mdx',
  'docs-site/docs/components/tabs.mdx',
  'docs-site/docs/components/text-field.mdx',
  'docs-site/docs/components/toast.mdx',
  'docs-site/src/css/custom.css',
  'docs-site/src/pages/index.tsx',
];

/**
 * STALE 과 구분되는 영구 예외 — "아직 안 고친 것"이 아니라 "원리상 못 고치는 것".
 *
 * migration-v1-to-v2.mdx (Task 4 신설): 이 문서의 일은 제거된 토큰과 prop 을
 * 이름으로 부르는 것이다. 검사 1~3 이 원리상 적용될 수 없으므로 STALE(아직 안
 * 고친 것)과 구분해 영구 예외로 둔다 — 예를 들어 토큰 대응표 하나만으로 검사
 * 1이 70개 넘게 걸린다. STALE 에 넣으면 언젠가 "정리해서 뺀다"를 약속하는
 * 셈인데, 이 페이지는 그럴 수 없다. STALE 이 0이 되어도 이 배열은 비지 않는다.
 */
export const EXEMPT: string[] = ['docs-site/docs/getting-started/migration-v1-to-v2.mdx'];
