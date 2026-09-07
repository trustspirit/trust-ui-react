import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  snapshotDir: './tests/visual/__snapshots__',
  // 폰트 로딩·색 전환(140ms)이 끝난 뒤 찍어야 한다. 그러지 않으면
  // 전환 중간값이 스냅샷에 박혀 매번 다른 결과가 나온다.
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' } },
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
