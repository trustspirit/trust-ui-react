import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  snapshotDir: './tests/visual/__snapshots__',
  // 폰트 로딩·색 전환(140ms)이 끝난 뒤 찍어야 한다. 그러지 않으면
  // 전환 중간값이 스냅샷에 박혀 매번 다른 결과가 나온다.
  // 비율(maxDiffPixelRatio)이 아니라 절대 픽셀 수를 쓴다 — 전체 페이지 스크린샷에서
  // 작은 컴포넌트(뱃지 등)의 색이 통째로 바뀌어도 비율로는 1% 문턱을 넘지 못해
  // 회귀가 조용히 통과하는 구멍이 있었다. 절대 픽셀 예산은 안티에일리어싱
  // 흔들림만 흡수하고, 이미지가 커진다고 같이 커지지 않는다.
  //
  // maxDiffPixels 는 잘못된 손잡이였다 — threshold(기본 0.2)가 먼저 "이 픽셀이
  // 달라졌는가"를 색차로 판정하고, 그 문턱을 넘은 픽셀 수만 maxDiffPixels 예산과
  // 비교한다. --tui-field(#f6f6f6) → --tui-sheet(#ffffff) 같은 인접 뉴트럴 차이는
  // 기본 threshold 아래라서 애초에 "다른 픽셀"로 세어지지 않았고, 그래서
  // maxDiffPixels 를 아무리 낮춰도 SegmentedControl 헤어라인 링 회귀를 잡지
  // 못했다. threshold 를 낮춰 인접 뉴트럴 차이가 실제로 카운트되게 하고,
  // maxDiffPixels 는 안티에일리어싱 지터 예산으로만 남긴다.
  //
  // 0.05는 실측으로 부족했다 — SegmentedControl 선택 셀의 채움을 --tui-sheet →
  // --tui-field로 되돌리는 실험에서 라이트 테마(0.04에서도 미검출, 0.03에서
  // 검출)와 다크 테마(0.04에서 검출)의 임계가 서로 달라, 0.05는 두 테마 모두를
  // 놓쳤다. 여유를 두고 0.02로 낮춘다 — 두 테마 모두에서 이 회귀를 잡으면서도
  // 무변경 코드로 두 차례 전체 실행이 안정적으로 통과함을 확인했다.
  //
  // 검증 중 무관한 기존 결함 하나를 발견했다: Avatar의 with-image 스토리는
  // 실제 네트워크 이미지(i.pravatar.cc)를 불러오는데, 고정 300ms 대기가
  // 이미지 로드를 항상 기다려주지 못해 실행마다 빈 화면 · 대체 아이콘 · 실제
  // 사진 중 하나로 임의로 정착한다. 이 threshold 변경과 무관하게 재현되며
  // (0.2 기본값에서도 간헐적으로 재현됨), 이 파일에서 고칠 성격의 문제가
  // 아니라 스토리가 네트워크에 의존한다는 설계 자체의 결함이다.
  expect: {
    toHaveScreenshot: { threshold: 0.02, maxDiffPixels: 120, animations: 'disabled' },
  },
  use: { baseURL: 'http://localhost:6008' },
  webServer: {
    // 빌드는 test:visual 스크립트가 먼저 수행한다. 여기서는 서빙만 한다 —
    // 스펙 파일이 수집 시점에 storybook-static/index.json 을 읽기 때문이다.
    command: 'pnpm exec http-server storybook-static -p 6008 --silent',
    url: 'http://localhost:6008',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
