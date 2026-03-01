self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = {
      title: 'RiderConnect',
      body: event.data ? event.data.text() : 'You have a new update.',
    };
  }

  const title = payload.title || 'RiderConnect';
  const options = {
    body: payload.body || 'You have a new update.',
    icon: payload.icon || '/placeholder-logo.png',
    badge: payload.badge || '/placeholder-logo.png',
    tag: payload.tag || 'riderconnect-default',
    renotify: true,
    vibrate: [120, 40, 120],
    data: {
      url: payload.url || '/dashboard',
      timestamp: payload.timestamp || Date.now(),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
