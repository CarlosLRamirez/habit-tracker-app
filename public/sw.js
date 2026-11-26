/*
 * Service worker del tracker de hábitos (NFR5, NFR2).
 *
 * - Al instalarse, guarda en caché la página y los archivos que enlaza (JS, CSS,
 *   manifest, icono), de modo que tras la primera carga la app abre sin conexión.
 * - Solo atiende peticiones GET del mismo origen; nunca envía datos de hábitos:
 *   los datos viven en localStorage y no pasan por la red.
 * - Navegación: red primero y, sin conexión, la página guardada.
 *   Resto de archivos: caché primero y, si faltan, red (y se guardan).
 */

const CACHE_VERSION = 'habit-tracker-v1';
const SCOPE = self.registration.scope;
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'].map((path) =>
  new URL(path, SCOPE).toString(),
);

/** Extrae de index.html las URL del mismo origen que enlaza (scripts, estilos, iconos). */
function linkedAssets(html) {
  const urls = new Set();
  const pattern = /(?:src|href)="([^"]+)"/g;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    try {
      const url = new URL(match[1], SCOPE);
      if (url.origin === self.location.origin) urls.add(url.toString());
    } catch (error) {
      console.warn('[sw] URL ignorada en index.html:', match[1], error);
    }
  }
  return [...urls];
}

async function precache() {
  const cache = await caches.open(CACHE_VERSION);
  await cache.addAll(SHELL);
  const indexResponse = await cache.match(new URL('./index.html', SCOPE).toString());
  if (!indexResponse) return;
  const assets = linkedAssets(await indexResponse.clone().text()).filter((url) => !SHELL.includes(url));
  // Si un archivo falla no se aborta la instalación; se intentará de nuevo al pedirlo.
  await Promise.all(
    assets.map((url) =>
      cache.add(url).catch((error) => console.warn('[sw] No se pudo guardar en caché:', url, error)),
    ),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(new URL('./index.html', SCOPE).toString(), response.clone());
    return response;
  } catch (error) {
    const cached = (await cache.match(new URL('./index.html', SCOPE).toString())) || (await cache.match(SCOPE));
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});

// Al pulsar un aviso, enfocar la app si ya está abierta.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const client = clients.find((c) => c.url.startsWith(SCOPE));
      if (client) return client.focus();
      return self.clients.openWindow(SCOPE);
    }),
  );
});
