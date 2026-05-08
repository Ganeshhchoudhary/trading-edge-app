const CACHE_NAME = 'trading-edge-v1';
const urlsToCache = [
  './',
  './index.html',
  './insights.html',
  './engine.html',
  './portfolio.html',
  './settings.html',
  './styles.css',
  './api_client.js',
  './charts.js',
  './dashboard.js',
  './data.js',
  './engine.js',
  './insights.js',
  './portfolio.js',
  './settings.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
