import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// All account/order responses are isolated in this browser; no production writes are allowed.
const origin = 'https://stevenbmj.vercel.app';
const output = '.codex-private/media/client-demo';
const catalogue = await (await fetch(`${origin}/api/products`)).json();
const settings = await (await fetch(`${origin}/api/settings`)).json();
const product = catalogue.find(item => item.stock > 0 && item.images?.length);
if (!product) throw new Error('No real public product available for the demonstration');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 450, height: 640 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
const page = await context.newPage();
const recorderPage = await browser.newPage();
const client = { id: 'isolated-video-demo', name: 'Alex Martin', email: 'demonstration@example.test', whatsapp: '+2290100000000', isAdmin: false, vipPoints: 0 };
let signedIn = false;
let handoff = false;
let createdOrder;
let caption = 'Bienvenue chez StevenBmj';
let running = true;
let pump;
try {
  await context.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let json = [];
    if (path === '/api/products') json = catalogue;
    else if (path === '/api/settings') json = settings;
    else if (path === '/api/auth/session') json = { user: signedIn ? client : null };
    else if (path === '/api/auth/register') json = { requiresActivation: true, email: client.email, expiresInSeconds: 300 };
    else if (path === '/api/auth/activate') { signedIn = true; json = { success: true, user: client }; }
    else if (path === '/api/orders' && request.method() === 'POST') {
      const body = request.postDataJSON();
      const items = body.items.map(item => {
        const source = catalogue.find(product => product.id === item.productId);
        return { ...item, productName: source.name, price: source.promoPrice || source.price };
      });
      const subtotal = items.reduce((total, item) => total + Math.round(item.price * 100) * item.quantity, 0);
      const shipping = subtotal >= 300000 ? 0 : 15000;
      createdOrder = { ...body, items, id: 'SBMJ-DEMONSTRATION', date: new Date().toISOString(), status: 'pending', paymentStatus: 'pending', totalPrice: (subtotal + shipping) / 100,
        pricingSnapshot: { version: 1, currency: 'EUR', subtotalCents: subtotal, discountCents: 0, discountPercent: 0, promoCode: '', shippingCents: shipping, totalCents: subtotal + shipping,
          seller: { name: 'StevenBmj', address: 'Cotonou, Benin', email: 'stevenbmj202@gmail.com', phone: '+2290155468138' } } };
      json = { order: createdOrder };
    } else if (request.method() !== 'GET') return route.fulfill({ status: 403, json: { error: 'Production writes disabled in demonstration' } });
    return route.fulfill({ json });
  });
  await context.route('https://wa.me/**', route => { handoff = true; return route.abort(); });
  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await expect(page.locator('#btn-mobile-menu-toggle')).toBeVisible({ timeout: 30000 });
  await page.waitForTimeout(1500);
  await recorderPage.setContent('<canvas width="720" height="1280"></canvas>');
  await recorderPage.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, 720, 1280);
    const mime = 'video/mp4;codecs=avc1.42E01E';
    if (!MediaRecorder.isTypeSupported(mime)) throw new Error('MP4 encoder is unavailable');
    const chunks = [];
    const recorder = new MediaRecorder(canvas.captureStream(12), { mimeType: mime, videoBitsPerSecond: 2000000 });
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    window.finishRecording = () => new Promise(resolve => {
      recorder.onstop = () => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(new Blob(chunks, { type: 'video/mp4' }));
      };
      recorder.stop();
    });
    recorder.start(1000);
  });
  const frame = async () => {
      const data = (await page.screenshot({ type: 'jpeg', quality: 85 })).toString('base64');
      await recorderPage.evaluate(async ({ data, caption }) => {
        const canvas = document.querySelector('canvas'); const ctx = canvas.getContext('2d');
        const image = new Image(); image.src = `data:image/jpeg;base64,${data}`; await image.decode();
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, 720, 1280); ctx.drawImage(image, 0, 96, 720, 1024);
        ctx.textAlign = 'center'; ctx.fillStyle = '#fbbf24'; ctx.font = '600 30px Arial'; ctx.fillText('STEVENBMJ', 360, 42);
        ctx.fillStyle = '#d4d4d4'; ctx.font = '17px Arial'; ctx.fillText('DEMONSTRATION - AUCUNE TRANSACTION REELLE', 360, 74);
        ctx.fillStyle = '#fafafa'; ctx.font = '24px Arial';
        const words = caption.split(' '); let line = ''; let y = 1170;
        for (const word of words) { const next = `${line}${word} `; if (ctx.measureText(next).width > 640) { ctx.fillText(line.trim(), 360, y); y += 32; line = `${word} `; } else line = next; }
        ctx.fillText(line.trim(), 360, y); ctx.fillStyle = '#fbbf24'; ctx.font = '20px Arial'; ctx.fillText('stevenbmj.vercel.app', 360, 1250);
      }, { data, caption });
  };
  pump = (async () => { while (running) { await frame(); await new Promise(resolve => setTimeout(resolve, 250)); } })();
  await page.waitForTimeout(3000);
  caption = 'Choisissez vos articles dans le catalogue';
  await page.locator('#btn-mobile-menu-toggle').click();
  await page.getByRole('button', { name: 'Catalogue', exact: true }).last().click();
  await page.locator(`#product-card-${product.id}`).scrollIntoViewIfNeeded();
  await page.waitForTimeout(3000);
  await page.locator(`#product-card-${product.id}`).click();
  await expect(page.locator('#btn-add-to-cart-detail')).toBeVisible();
  await page.waitForTimeout(3000);
  await page.locator('#btn-add-to-cart-detail').click();
  await page.locator('#btn-cart').click();
  caption = 'Votre panier reste disponible pendant la navigation';
  await page.waitForTimeout(3000);
  await page.locator('#btn-checkout-trigger').click();
  await expect(page.locator('#auth-input-email')).toBeVisible();
  await page.getByRole('button', { name: 'Créer un compte', exact: true }).click();
  caption = 'Créez votre compte avec votre e-mail et votre pays';
  await page.locator('#auth-input-fullname').fill(client.name);
  await page.locator('#auth-input-whatsapp').fill('0100000000');
  await page.locator('#auth-input-email').fill(client.email);
  await page.locator('#auth-input-password').fill('Demo-Only!4826');
  await page.waitForTimeout(2500);
  await page.locator('#btn-auth-submit').click();
  caption = 'Validation par code à usage unique - ici simulée';
  await page.locator('#activation-input-code').fill('DEMO2345');
  await page.waitForTimeout(2500);
  await page.locator('#btn-activation-submit').click();
  await expect(page.locator('#checkout-address')).toBeVisible({ timeout: 60000 });
  caption = 'Renseignez les informations de livraison';
  await page.locator('#checkout-whatsapp').fill('0100000000');
  await page.locator('#checkout-city').fill('Cotonou');
  await page.locator('#checkout-address').fill('Adresse de démonstration, Cotonou');
  await page.locator('#checkout-notes').fill('Démonstration sans achat ni paiement réel.');
  await page.waitForTimeout(3000);
  await page.locator('#btn-submit-order-form').click();
  caption = 'Une facture PDF identique à son aperçu';
  await expect(page.locator('canvas[data-rendered="true"]').first()).toBeVisible({ timeout: 60000 });
  await page.locator('#invoice-card').scrollIntoViewIfNeeded();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${output}/invoice.png` });
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#btn-print-invoice-complete').click();
  const download = await downloadPromise;
  await download.saveAs(`${output}/facture-demonstration.pdf`);
  await expect.poll(() => handoff).toBe(true);
  caption = 'PDF téléchargé ; ouverture de WhatsApp pour un envoi manuel';
  await page.waitForTimeout(5000);
  running = false; await pump;
  await frame(); await page.waitForTimeout(2000);
  const base64 = await recorderPage.evaluate(() => window.finishRecording());
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length < 50000 || !bytes.subarray(0, 64).includes(Buffer.from('ftyp'))) throw new Error('Invalid MP4 output');
  await writeFile(`${output}/stevenbmj-parcours-client-demo.mp4`, bytes);
  await writeFile(`${output}/verification.json`, JSON.stringify({ origin, demonstration: true, realProductionWrites: 0, realEmailsSent: 0, whatsappMessagesSent: 0, pdfDownloaded: true, handoffPrepared: handoff, bytes: bytes.length, recordedAt: new Date().toISOString() }, null, 2));
  console.log(JSON.stringify({ video: `${output}/stevenbmj-parcours-client-demo.mp4`, bytes: bytes.length, productionWrites: 0 }));
} finally {
  running = false; await pump?.catch(() => {});
  await browser.close();
}
