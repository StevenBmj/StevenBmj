const PUBLIC_CACHE = 'stevenbmj-public-v1';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(PUBLIC_CACHE).then(cache => cache.addAll(['/offline.html', '/logo.png'])));
});
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/offline.html')));
  } else if (/^\/assets\/[a-zA-Z0-9_.-]+\.(js|css|woff2)$/.test(url.pathname)) {
    event.respondWith(caches.open(PUBLIC_CACHE).then(async cache => {
      const previous = await cache.match(event.request);
      if (previous) return previous;
      const response = await fetch(event.request);
      if (response.ok && response.type === 'basic') {
        await cache.put(event.request, response.clone());
        const entries = await cache.keys();
        if (entries.length > 100) await cache.delete(entries.find(entry => new URL(entry.url).pathname.startsWith('/assets/')) || entries[0]);
      }
      return response;
    }));
  }
});
self.addEventListener('message', event => {
  if (event.data?.type === 'CLEAR_BADGE') event.waitUntil(self.navigator.clearAppBadge?.().catch(() => null) || Promise.resolve());
});
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let payload;
    try { payload = event.data?.json(); } catch { return; }
    if (!payload || typeof payload.userId !== 'string' || typeof payload.notificationId !== 'string') return;
    let response = await fetch('/api/shop?resource=notifications', { credentials: 'same-origin', cache: 'no-store' });
    if (response.status === 401) {
      const renewed = await fetch('/api/auth/session', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'refresh' }) });
      if (renewed.ok) response = await fetch('/api/shop?resource=notifications', { credentials: 'same-origin', cache: 'no-store' });
    }
    if (!response.ok) return;
    const inbox = await response.json();
    if (inbox.userId !== payload.userId || !Number.isSafeInteger(inbox.unreadCount) || inbox.unreadCount <= 0) return;
    await self.navigator.setAppBadge?.(inbox.unreadCount).catch(() => null);
    await self.registration.showNotification('StevenBmj', { body: payload.language === 'EN' ? 'A notification is waiting in your account.' : 'Une notification vous attend dans votre compte.', icon: '/logo.png', badge: '/logo.png', tag: payload.notificationId, data: { path: '/compte' } });
    for (const client of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) client.postMessage({ type: 'NOTIFICATIONS_CHANGED' });
  })().catch(() => null));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = clients.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) { await existing.navigate('/compte'); await existing.focus(); }
    else await self.clients.openWindow('/compte');
  })());
});
