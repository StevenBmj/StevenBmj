import { test, expect } from '@playwright/test';

const product = { id: 'advisor-watch', name: 'Montre Conseiller', nameEn: 'Advisor Watch', price: 100, stock: 5,
  images: ['/logo.png'], category: 'watches', specs: [], description: '', descriptionEn: '', rating: 5 };

test('the advisor keeps conversation context and proposes confirmed cart and contact actions', async ({ page }, testInfo) => {
  const requests: any[] = [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/assistant') {
      requests.push(route.request().postDataJSON());
      return route.fulfill({ json: { reply: requests.length === 1 ? 'Cette montre correspond à votre budget.' : 'Voici votre message à vérifier.',
        recommendations: requests.length === 1 ? [product.id, 'invented-id'] : [],
        contactDraft: requests.length === 2 ? { name: 'Client Essai', email: 'client@example.test', message: 'Bonjour, je souhaite des informations sur cette montre.' } : null,
        speechToken: 'fixture-no-real-audio' } });
    }
    return route.fulfill({ json: path === '/api/products' ? [product] : path === '/api/auth/session' ? { user: { id: 'advisor-client', name: 'Client Essai', email: 'client@example.test' } } : {} });
  });
  await page.goto('/boutique');
  await page.locator('#btn-chatbot-launch').click();
  await page.locator('#assistant-input-client').fill('Une montre avec un budget de 150 euros');
  await page.locator('#btn-chatbot-send').click();
  await expect(page.getByText('Cette montre correspond à votre budget.')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sbmj_cart') || '[]'))).toEqual([]);
  await page.getByRole('button', { name: 'Ajouter au panier', exact: true }).last().click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sbmj_cart') || '[]')[0].product.id)).toBe(product.id);
  await page.locator('#assistant-input-client').fill('Prépare un message de contact');
  await page.locator('#btn-chatbot-send').click();
  await expect(page.getByText('Voici votre message à vérifier.')).toBeVisible();
  expect(requests[1].history).toEqual([{ role: 'user', content: 'Une montre avec un budget de 150 euros' }, { role: 'assistant', content: 'Cette montre correspond à votre budget.' }]);
  const bounds = await page.getByRole('region', { name: 'Votre conseiller' }).boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({ path: testInfo.outputPath('advisor.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Vérifier le message de contact' }).click();
  await expect(page).toHaveURL('/contact');
  await expect(page.locator('#contact-form-name')).toHaveValue('Client Essai');
  await expect(page.locator('#contact-form-email')).toHaveValue('client@example.test');
  await expect(page.locator('#contact-form-msg')).toHaveValue('Bonjour, je souhaite des informations sur cette montre.');
  expect(requests).toHaveLength(2);
});

test('admin key settings keep client and administrator credentials distinct', async ({ page }) => {
  const actions: any[] = [];
  await page.route('**/api/**', route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/assistant/keys') {
      if (request.method() !== 'GET') actions.push(request.postDataJSON());
      return route.fulfill({ json: request.method() !== 'GET' ? { ok: true } : { configured: true, keys: [
        { id: 'client-key', scope: 'client', label: 'Client One', suffix: '1234', model: 'test/model', enabled: true },
        { id: 'admin-key', scope: 'admin', label: 'Admin One', suffix: '5678', model: 'test/model', enabled: true },
      ] } });
    }
    return route.fulfill({ json: path === '/api/auth/session' ? { user: { id: 'admin', name: 'Admin Essai', email: 'admin@example.test', isAdmin: true } }
      : path === '/api/settings' ? {} : [] });
  });
  await page.goto('/god');
  await page.getByRole('button', { name: 'ASSISTANTS & API' }).click();
  await expect(page.getByText('Client One', { exact: false })).toBeVisible();
  await expect(page.getByText('Admin One', { exact: false })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Assistant administrateur' }).click();
  await expect(page.getByText('Admin One', { exact: false })).toBeVisible();
  await expect(page.getByText('Client One', { exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tester la clé' }).click();
  await expect.poll(() => actions).toEqual([{ id: 'admin-key', action: 'test', scope: 'admin' }]);
});

test('the administrator opens the AI agent directly and keeps its own scope after reload', async ({ page }, testInfo) => {
  const requests: any[] = [];
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/assistant') {
      requests.push(route.request().postDataJSON());
      return route.fulfill({ json: { reply: 'Voici votre rapport de ventes.', recommendations: [] } });
    }
    return route.fulfill({ json: path === '/api/auth/session'
      ? { user: { id: 'admin', name: 'Admin Essai', email: 'admin@example.test', isAdmin: true } }
      : path === '/api/assistant/keys' ? { configured: true, keys: [] }
      : path === '/api/settings' ? {} : [] });
  });
  await page.goto('/god');
  await page.locator('#btn-admin-advisor-shortcut').click();
  await expect(page).toHaveURL('/god?section=advisor');
  const agent = page.getByRole('region', { name: 'Assistant de gestion', exact: true });
  await expect(agent).toBeVisible();
  await page.locator('#assistant-input-admin').fill('Montre le rapport de ventes');
  await agent.locator('#btn-chatbot-send').click();
  await expect(agent.getByText('Voici votre rapport de ventes.')).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0].scope).toBe('admin');
  const bounds = await agent.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({ path: testInfo.outputPath('admin-agent.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Configurer les clés de cet agent' }).click();
  await expect(page.getByRole('tab', { name: 'Assistant administrateur' })).toHaveAttribute('aria-selected', 'true');
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Assistant administrateur' })).toHaveAttribute('aria-selected', 'true');
  await page.locator('#btn-admin-tab-advisor').click();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Assistant de gestion', exact: true })).toBeVisible();
  if (testInfo.project.name === 'mobile') {
    await page.locator('#btn-mobile-menu-toggle').click();
    await page.getByRole('button', { name: /^LANGUE:\s*FR$/ }).click();
    await page.locator('#btn-mobile-menu-toggle').click();
  } else await page.locator('#btn-lang').click();
  await expect(page.getByRole('region', { name: 'Management assistant', exact: true })).toBeVisible();
  await expect(page.locator('#btn-admin-advisor-shortcut')).toHaveText('AI agent');
});
