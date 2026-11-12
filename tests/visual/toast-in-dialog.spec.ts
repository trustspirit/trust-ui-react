import { test, expect } from '@playwright/test';

/**
 * showModal() 로 열린 dialog 는 top layer 에 있고 바깥을 비활성화한다. 그 상태에서
 * 띄운 토스트가 (1) dialog 안에 놓이고 (2) 백드롭에 가려지지 않으며 (3) 실제로
 * 눌러서 닫을 수 있는지를 본다. jsdom 에는 top layer 가 없어 단위 테스트로는 볼 수 없다.
 */
test('모달 Dialog 가 열린 채 띄운 토스트는 보이고 닫을 수 있다', async ({ page }) => {
  await page.goto('/iframe.html?id=overlay-dialog--toast-in-dialog&viewMode=story');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  await page.getByRole('button', { name: 'Save' }).click();
  const toast = page.getByRole('status');
  await expect(toast).toBeVisible();

  // (1) dialog 안에 있다
  expect(await toast.evaluate((el) => el.closest('dialog') !== null)).toBe(true);

  // (2) 토스트 한가운데를 찍으면 토스트 자신이 나온다 — 백드롭에 가려지지 않았다
  const hitsToast = await toast.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && el.contains(hit);
  });
  expect(hitsToast).toBe(true);

  // (3) 닫기 버튼이 실제로 눌린다 (비활성 상태라면 클릭이 닿지 않는다)
  await toast.getByRole('button', { name: 'Close notification' }).click();
  await expect(toast).toHaveCount(0);

  // dialog 를 닫은 뒤 띄운 토스트는 body 에 놓인다
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('status')).toBeVisible();
  expect(await page.getByRole('status').evaluate((el) => el.closest('dialog') === null)).toBe(true);
});
