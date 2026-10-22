// Nom de la mémoire cache de l'application Soukassou
const CACHE_NAME = 'soukassou-v1';

// Liste des fichiers indispensables à mettre en cache pour le mode hors-ligne
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js'
];

// 1. ÉTAPE D'INSTALLATION : Mise en cache initiale des ressources
self.addEventListener('install', (event) => {
  console.log('[Soukassou SW] Installation du Service Worker et mise en cache...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting(); // Active immédiatement le nouveau Service Worker
    })
  );
});

// 2. ÉTAPE D'ACTIVATION : Nettoyage des anciennes versions de cache
self.addEventListener('activate', (event) => {
  console.log('[Soukassou SW] Activation du Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Soukassou SW] Suppression du vieux cache :', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Prend le contrôle de toutes les pages immédiatement
    })
  );
});

// 3. ÉTAPE D'INTERCEPTION (FETCH) : Stratégie Cache-First (Priorité au Cache Hors-Ligne)
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET ou externes (comme l'API WhatsApp)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si la ressource existe dans le cache, on la sert immédiatement (Mode Hors-Ligne)
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Sinon, on tente de la récupérer sur le réseau
      return fetch(event.request).catch(() => {
        // En cas d'échec réseau complet (Pas d'internet), retourner la page d'accueil en cache
        return caches.match('./index.html');
      });
    })
  );
});
