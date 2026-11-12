import { test, expect } from '@playwright/test';

test('the initial HTML displays the brand even before JavaScript starts', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 800 } });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#boot-screen')).toBeVisible();
    const image = page.locator('#boot-screen img');
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
  } finally { await context.close(); }
});

test('logo animation does not wait for the catalogue or replay on internal navigation', async ({ page }, testInfo) => {
  let releaseFonts!: () => void;
  const fontsHeld = new Promise<void>(resolve => { releaseFonts = resolve; });
  await page.route('https://fonts.googleapis.com/**', async route => {
    await fontsHeld;
    return route.fulfill({ contentType: 'text/css', body: '' });
  });
  await page.addInitScript(() => {
    (window as any).__introSeen = false;
    new MutationObserver(() => {
      if (document.getElementById('intro-screen')) (window as any).__introSeen = true;
    }).observe(document, { subtree: true, childList: true });
  });
  await page.route('**/api/**', async route => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ json: path === '/api/auth/session' ? { user: null } : path === '/api/settings' ? {} : [] });
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => (window as any).__introSeen)).toBe(true);
    await expect(page.locator('#intro-screen')).toHaveCount(0, { timeout: 1800 });
    await expect(page.getByRole('banner')).toBeVisible();
    await page.getByRole('contentinfo').getByRole('link', { name: 'Boutique', exact: true }).click();
    await expect(page).toHaveURL('/boutique');
    await expect(page.locator('#intro-screen')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('loaded-storefront.png'), animations: 'disabled' });
  } finally { releaseFonts(); }
});
