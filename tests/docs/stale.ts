/**
 * 아직 v1 잔재(삭제된 토큰/prop/파일 안내)를 담고 있는 문서 파일들.
 * 문서 작업(Task 3~7)이 한 파일을 정리할 때마다 해당 줄을 지운다.
 * 이 배열이 비면 문서 마이그레이션이 끝난 것이다.
 *
 * 2026-09-09 실측: 43개 대상 파일(docs-site/docs/**\/*.mdx 37개 +
 * docs-site/src/**\/*.{tsx,ts,css} 6개) 중 29개가 검사 1~3 중 하나 이상에 걸렸다.
 *
 * 예외 — migration-v1-to-v2.mdx (Task 4 신설): 위 "정리하면 지운다" 규칙이
 * 적용되지 않는 유일한 항목이다. 이 페이지의 존재 이유 자체가 삭제된 v1
 * 토큰·prop·파일 이름을 정확히 나열하는 것이라, 검사 1~3을 절대 통과할 수
 * 없다 — 예를 들어 토큰 대응표 하나만으로 검사 1이 70개 넘게 걸린다.
 * "정리해서 뺀다"가 원천적으로 불가능하므로 영구 예외로 남긴다.
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
  'docs-site/docs/getting-started/migration-v1-to-v2.mdx',
  'docs-site/docs/guides/mobile-patterns.mdx',
  'docs-site/src/css/custom.css',
  'docs-site/src/pages/index.tsx',
];
