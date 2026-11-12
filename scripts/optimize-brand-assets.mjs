import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

// Generate display-size derivatives; the original brand file is never modified.
const source = (await readFile('public/logo.png')).toString('base64');
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  const files = await page.evaluate(async source => {
    const image = new Image(); image.src = `data:image/png;base64,${source}`; await image.decode();
    return [[512, 'webp'], [192, 'png'], [512, 'png']].map(([size, format]) => {
      const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
      const context = canvas.getContext('2d'); context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, size, size);
      return { name: `logo-${size}.${format}`, data: canvas.toDataURL(`image/${format}`, 0.86).split(',')[1] };
    });
  }, source);
  await mkdir('public/brand', { recursive: true });
  for (const file of files) {
    const bytes = Buffer.from(file.data, 'base64');
    await writeFile(`public/brand/${file.name}`, bytes);
    console.log(`${file.name}: ${bytes.length} bytes`);
  }
} finally { await browser.close(); }
