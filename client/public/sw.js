const CACHE_NAME = 'foodshare-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/offline.html',
];

// 1. Install event: Cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚡ [ServiceWorker] Pre-caching offline app shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🧹 [ServiceWorker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch event: Network-first with cache/offline fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and exclude API requests from SW cache
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache valid static responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If offline and requesting document navigation, return cached app shell or offline.html
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// 4. Push event: Receive Web Push from backend & display native browser notification
self.addEventListener('push', (event) => {
  console.log('🔔 [ServiceWorker] Push Event Received');

  let data = {
    title: 'FoodShare Notification 🌿',
    message: 'You have a new update on FoodShare!',
    url: '/',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.message = event.data.text();
    }
  }

  const title = data.title || 'FoodShare Notification 🌿';
  const options = {
    body: data.message || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: data.donationId ? `foodshare-donation-${data.donationId}` : `foodshare-notif-${Date.now()}`,
    data: {
      url: data.url || (data.donationId ? `/donor/donations/${data.donationId}` : '/'),
      donationId: data.donationId || null,
    },
    vibrate: [100, 50, 100, 50, 100],
    requireInteraction: false,
    actions: [
      { action: 'open', title: '👁️ View Details' },
      { action: 'close', title: '✕ Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 5. Notification Click event: Focus existing window or open target URL
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ [ServiceWorker] Notification clicked:', event.notification);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
