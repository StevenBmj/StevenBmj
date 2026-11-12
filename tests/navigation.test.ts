import test from 'node:test';
import assert from 'node:assert/strict';
import { fallbackRoute, initialHistoryRoutes, readRoute, routeHref } from '../src/lib/navigation';

test('direct entry builds a finite native-back history without losing the selected language or checkout', () => {
  const steps = initialHistoryRoutes({ view: 'produit', productId: 'watch', panel: 'commande', language: 'EN' });
  assert.deepEqual(steps.map(routeHref), ['/?lang=en', '/?lang=en', '/boutique?lang=en', '/produit/watch?lang=en', '/produit/watch?lang=en&panel=commande']);
  assert.equal(initialHistoryRoutes({ view: 'home', panel: null }).length, 2);
});

test('deep links restore the selected product and shopping step', () => {
  assert.deepEqual(readRoute({ href: 'https://stevenbmj.vercel.app/produit/watch%20one?panel=panier' }), {
    view: 'produit', productId: 'watch one', panel: 'panier',
  });
  assert.equal(routeHref({ view: 'produit', productId: 'watch one', panel: 'commande' }), '/produit/watch%20one?panel=commande');
  assert.deepEqual(readRoute({ href: 'https://stevenbmj.vercel.app/#/god' }), { view: 'god', panel: null });
});

test('FAQ deep links retain their anchor when seeding native history and changing language', () => {
  const route = readRoute({ href: 'https://stevenbmj.vercel.app/aide?lang=en#faq' });
  assert.equal(routeHref(route), '/aide?lang=en#faq');
  assert.equal(routeHref(initialHistoryRoutes(route).at(-1)!), '/aide?lang=en#faq');
  assert.equal(routeHref(readRoute({ href: 'https://stevenbmj.vercel.app/contact#unexpected' })), '/contact');
});

test('administration restores the advisor and its own API configuration from deep links', () => {
  for (const path of ['/god?section=advisor', '/god?lang=en&section=assistants&scope=admin']) {
    assert.equal(routeHref(readRoute({ href: `https://stevenbmj.vercel.app${path}` })), path);
  }
  assert.equal(routeHref(readRoute({ href: 'https://stevenbmj.vercel.app/?scope=admin' })), '/');
  assert.equal(routeHref(readRoute({ href: 'https://stevenbmj.vercel.app/god?section=assistants&scope=invalid' })), '/god?section=assistants');
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
