// emlog Service Worker — offline cache (cache-first for app shell)
const CACHE = 'emlog-v12';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './prototype/bundle.jsx',
  './icon-192.png',
  './icon-512.png',
  'https://unpkg.com/react@18.3.1/umd/react.development.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// プッシュ受信：今日すでに記録済みならスキップ（アプリ側が emlog-flags キャッシュに記録日を書き込む）
self.addEventListener('push', (e) => {
  e.waitUntil((async () => {
    try {
      const c = await caches.open('emlog-flags');
      const hit = await c.match('./last-recorded');
      if (hit) {
        const recorded = await hit.text();
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (recorded === today) return;
      }
    } catch (err) { /* フラグが読めなければ通知を出す側に倒す */ }
    await self.registration.showNotification('emlog', {
      body: '今日の気分、まだ残してないよ。',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'emlog-reminder',
    });
  })());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
      for (const w of ws) { if ('focus' in w) return w.focus(); }
      return clients.openWindow('./');
    })
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  e.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((res) => {
        // 同一オリジン or CDN のレスポンスをキャッシュに追加
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
