import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

test('startup assets avoid a render-blocking external font import and the original oversized logo', () => {
  assert.doesNotMatch(readFileSync('src/index.css', 'utf8'), /@import\s+url\(['"]?https:\/\/fonts\.googleapis/);
  const html = readFileSync('index.html', 'utf8');
  assert.match(html, /id="boot-screen"/);
  assert.match(html, /rel="preload" href="\/brand\/logo-512\.webp"/);
  assert.ok(statSync('public/brand/logo-512.webp').size < 100000);
  const worker = readFileSync('public/sw.js', 'utf8');
  assert.doesNotMatch(worker, /cache\.addAll\(\[[^\]]*'\/logo\.png'/);
});
