// sw.js — Service worker TEFD : rend l'appli installable, met en cache la COQUILLE
// uniquement (HTML/CSS/JS/icônes). Ne cache JAMAIS app_data.json : la donnée doit
// toujours être fraîche (décision actée : pas de hors-ligne pour les données).
//
// À chaque évolution du code de l'appli (pas des données Baserow), incrémenter
// CACHE_VERSION pour forcer les appareils déjà installés à récupérer la nouvelle
// coquille — sinon un hôtel qui a installé l'icône reste bloqué sur une vieille
// version de l'interface indéfiniment.

const CACHE_VERSION = 'tefd-shell-v1';

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting(); // active la nouvelle version sans attendre la fermeture de tous les onglets
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim(); // prend le contrôle immédiatement, y compris des onglets déjà ouverts
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Règle anti-hallucination : app_data.json (et tout appel ORS/Tisséo en direct)
  // ne passe jamais par le cache — toujours le réseau, jamais de donnée périmée servie.
  if (url.includes('app_data.json') || url.includes('openrouteservice') || url.includes('tisseo')) {
    return; // laisse passer la requête réseau normale, sans interception
  }

  // Coquille : cache d'abord, réseau en secours (rapide à l'ouverture, fonctionne
  // même si le réseau est momentanément indisponible au lancement de l'icône).
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
