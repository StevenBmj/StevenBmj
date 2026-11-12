import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import QRCode from 'qrcode';
import { createInvoicePdf } from '../src/lib/invoicePdf';
import { invoiceModel, invoiceWhatsApp } from '../src/lib/invoice';
import type { Order } from '../src/types';

const order: Order = {
  id: 'SBMJ-PDF-TEST', customerName: 'Élodie André', email: 'invoice@example.test', whatsapp: '+2290155468138',
  address: 'Adresse complete avec instructions et numero de porte '.repeat(4), city: 'Cotonou',
  notes: 'Notes de livraison longues a conserver integralement. '.repeat(12), date: '2026-11-12T10:00:00Z',
  items: Array.from({ length: 30 }, (_, i) => ({ productId: `p-${i}`, productName: `Creation ${i + 1} avec une description longue du tissu et des finitions `.repeat(2), quantity: 1, price: 100, selectedSize: 'XL' })),
  totalPrice: 3150, currency: 'EUR', status: 'pending', paymentStatus: 'pending',
};

test('invoice amounts use their recorded currency and reject inconsistent snapshots', () => {
  assert.match(invoiceModel(order).format(315000, 'FR'), /3.?150,00/);
  assert.equal(new URL(invoiceWhatsApp(order, 'EN')).searchParams.get('text')?.includes('$'), false);
  const snapshot = invoiceModel(order).pricing;
  assert.throws(() => invoiceModel({ ...order, pricingSnapshot: { ...snapshot, totalCents: 1 } }), /inconsistent/);
  assert.throws(() => invoiceModel({ ...order, totalPrice: order.totalPrice + 1, pricingSnapshot: { ...snapshot, subtotalCents: snapshot.subtotalCents + 100, totalCents: snapshot.totalCents + 100 } }), /inconsistent/);
});

test('the PDF retains long text and all items inside page boundaries', async () => {
  const logo = `data:image/png;base64,${(await readFile('public/logo.png')).toString('base64')}`;
  const font = (await readFile('public/fonts/NotoSans-Regular.ttf')).toString('base64');
  const qr = await QRCode.toDataURL('STEVENBMJ:SBMJ-PDF-TEST');
  const bytes = createInvoicePdf(order, 'FR', { logo, font, qr });
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({ data: bytes });
  const pdf = await task.promise;
  assert.ok(pdf.numPages > 1);
  let text = '';
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const texts: string[] = [];
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      texts.push(item.str);
      assert.ok(item.transform[4] >= 21, `Text crosses left border on page ${pageNumber}`);
      assert.ok(item.transform[4] + item.width <= viewport.width - 21, `Text crosses right border on page ${pageNumber}: ${item.str}`);
      assert.ok(item.transform[5] > 21 && item.transform[5] < viewport.height - 21, `Text crosses a horizontal border on page ${pageNumber}`);
    }
    assert.ok(texts.includes('STEVENBMJ'), 'Brand header repeats on every page');
    text += texts.join(' ');
  }
  assert.ok(text.includes('Creation 30'));
  assert.ok(text.includes('invoice@example.test'));
  assert.ok(text.includes('À régler'));
  assert.ok(text.includes('Élodie André'));
  assert.equal(text.match(/conserver integralement\./g)?.length, 12);
  await task.destroy();
});
