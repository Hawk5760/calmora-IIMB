// Temporary app-shell service worker cleanup.
// The previous worker cached Vite dependency chunks in preview/dev, which can mix old and new
// React bundles and trigger invalid-hook-call errors. Keep this same path so returning
// browsers receive the replacement worker, clear only Calmora app-shell caches, then unregister.
const isCalmoraAppCache = (name) =>
  name.startsWith("calmora-") ||
  (/((^|-)(precache-v\d+-|runtime-|googleAnalytics-))/.test(name) && name.endsWith(self.registration.scope));

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.allSettled(cacheNames.filter(isCalmoraAppCache).map((name) => caches.delete(name)));
        await self.clients.claim();

        const windowClients = await self.clients.matchAll({ type: "window" });
        await Promise.allSettled(windowClients.map((client) => client.navigate(client.url)));
      } finally {
        await self.registration.unregister();
      }
    })()
  );
});
