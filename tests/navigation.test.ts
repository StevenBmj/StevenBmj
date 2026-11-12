import test from 'node:test';
import assert from 'node:assert/strict';
import { fallbackRoute, readRoute, routeHref } from '../src/lib/navigation';

test('deep links restore the selected product and shopping step', () => {
  assert.deepEqual(readRoute({ href: 'https://stevenbmj.vercel.app/produit/watch%20one?panel=panier' }), {
    view: 'produit', productId: 'watch one', panel: 'panier',
  });
  assert.equal(routeHref({ view: 'produit', productId: 'watch one', panel: 'commande' }), '/produit/watch%20one?panel=commande');
  assert.deepEqual(readRoute({ href: 'https://stevenbmj.vercel.app/#/god' }), { view: 'god', panel: null });
});

test('malformed or unknown destinations do not restore arbitrary views', () => {
  for (const path of ['/missing', '/produit/%E0%A4%A', '/?panel=https://evil.invalid']) {
    assert.deepEqual(readRoute({ href: `https://stevenbmj.vercel.app${path}` }), { view: 'home', panel: null });
  }
});

test('direct entry back stays on the site and closes a panel before leaving its page', () => {
  assert.deepEqual(fallbackRoute({ view: 'produit', productId: 'watch', panel: 'panier' }), {
    view: 'produit', productId: 'watch', panel: null,
  });
  assert.deepEqual(fallbackRoute({ view: 'produit', productId: 'watch', panel: null }), { view: 'boutique', panel: null });
  assert.deepEqual(fallbackRoute({ view: 'contact', panel: null }), { view: 'home', panel: null });
});
