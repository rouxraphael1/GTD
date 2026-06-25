// sw.js — Service Worker TEFD (coquille uniquement, pas de données)
// Cache la coquille HTML/CSS/JS/icônes pour l'installation PWA.
// app_data.json est volontairement exclu → toujours servi frais (règle anti-hallucination).
//
// IMPORTANT : incrémenter CACHE_VERSION à chaque mise à jour du code (HTML/CSS/JS),
// sinon les appareils déjà installés restent bloqués sur l'ancienne interface.

const CACHE_VERSION = 'tefd-shell-v1';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Stratégie network-first pour app_data.json (jamais caché)
  if (event.request.url.includes('app_data.json')) {
    event.respondWith(fetch(event.request));
    return;
  }
  // Stratégie cache-first pour la coquille
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
