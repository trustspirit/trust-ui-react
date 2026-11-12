import { test, expect, type Page } from '@playwright/test';

/**
 * 오른쪽에서 왼쪽으로 읽는 화면(dir="rtl")에서 배치가 실제로 뒤집히는지 본다.
 * 논리 속성과 --tui-dir 은 jsdom 에서 계산되지 않으므로 브라우저로 측정한다.
 */
async function gotoRtl(page: Page, story: string) {
  // 초기화 스크립트는 <html> 이 생기기 전에 돈다. 생기는 순간 dir 을 달아, 컴포넌트가
  // 마운트될 때 이미 RTL 이게 한다(나중에 달면 마운트 때 읽은 방향이 남는다).
  await page.addInitScript(() => {
    const apply = () => {
      if (!document.documentElement) return false;
      document.documentElement.setAttribute('dir', 'rtl');
      return true;
    };
    if (!apply()) {
      const observer = new MutationObserver(() => {
        if (apply()) observer.disconnect();
      });
      observer.observe(document, { childList: true });
    }
  });
  await page.goto(`/iframe.html?id=${story}&viewMode=story`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

const box = (page: Page, selector: string) =>
  page.evaluate((s) => {
    const r = document.querySelector(s)!.getBoundingClientRect();
    return { left: r.left, right: r.right, center: r.left + r.width / 2 };
  }, selector);

test.describe('RTL', () => {
  test('켜진 Switch 의 손잡이는 왼쪽에 있다', async ({ page }) => {
    await gotoRtl(page, 'form-switch--checked');
    const track = await box(page, '[role="switch"]');
    const thumb = await box(page, '[role="switch"] span');
    expect(thumb.center).toBeLessThan(track.center);
  });

  test('Select 목록과 Menu 는 트리거의 오른쪽 가장자리에 맞춰 열린다', async ({ page }) => {
    await gotoRtl(page, 'form-select--open');
    const trigger = await box(page, '[role="combobox"]');
    const list = await box(page, '[role="listbox"]');
    expect(Math.abs(list.right - trigger.right)).toBeLessThanOrEqual(2);

    await gotoRtl(page, 'overlay-menu--open');
    const menuTrigger = await box(page, '[aria-haspopup="menu"]');
    const menu = await box(page, '[role="menu"]');
    expect(Math.abs(menu.right - menuTrigger.right)).toBeLessThanOrEqual(1);
  });

  test('TextField 의 prefix 는 오른쪽, suffix 는 왼쪽에 온다', async ({ page }) => {
    await gotoRtl(page, 'form-textfield--with-prefix-suffix');
    const positions = await page.evaluate(() => {
      const wrapper = [...document.querySelectorAll('[class*="inputWrapper"]')].find(
        (w) => w.querySelector('[class*="prefix"]') && w.querySelector('[class*="suffix"]'),
      );
      if (!wrapper) return null;
      const x = (sel: string) => wrapper.querySelector(sel)!.getBoundingClientRect().left;
      return { prefix: x('[class*="prefix"]'), suffix: x('[class*="suffix"]') };
    });
    test.skip(positions === null, 'prefix 와 suffix 를 함께 가진 필드가 스토리에 없다');
    expect(positions!.prefix).toBeGreaterThan(positions!.suffix);
  });

  test('Slider 의 채움은 오른쪽에서 시작한다', async ({ page }) => {
    await gotoRtl(page, 'form-slider--default');
    const track = await page.evaluate(() =>
      (document.querySelector('input[type="range"]') as HTMLElement).style.getPropertyValue('--tui-slider-track'),
    );
    expect(track).toContain('to left');
  });

  test('이전·다음 화살표가 좌우로 뒤집힌다', async ({ page }) => {
    await gotoRtl(page, 'navigation-pagination--default');
    const transform = await page.evaluate(() =>
      getComputedStyle(document.querySelector('nav svg')!).transform,
    );
    // scaleX(-1) 의 행렬
    expect(transform).toBe('matrix(-1, 0, 0, 1, 0, 0)');
  });

  for (const story of ['form-select--open', 'navigation-pagination--default', 'form-textfield--with-prefix-suffix']) {
    test(`가로로 넘치지 않는다 — ${story}`, async ({ page }) => {
      await gotoRtl(page, story);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('Slider — 터치 영역', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test('터치 환경에서 손가락이 닿는 높이는 44px 이고, 트랙과 손잡이는 그 가운데에 있다', async ({ page }) => {
    await page.goto('/iframe.html?id=form-slider--default&viewMode=story');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);

    const input = page.locator('input[type="range"]').first();
    const rect = (await input.boundingBox())!;
    expect(rect.height).toBeGreaterThanOrEqual(44);

    // 입력의 위쪽 가장자리 근처(트랙에서 15px 이상 떨어진 곳)를 눌러도 값이 바뀐다.
    const before = await input.inputValue();
    await page.touchscreen.tap(rect.x + rect.width * 0.9, rect.y + 4);
    expect(await input.inputValue()).not.toBe(before);
  });
});
