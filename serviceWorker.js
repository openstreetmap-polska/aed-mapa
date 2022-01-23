const cacheName = 'aed-map';
const resToPrecache = [
 '/',
 '/index.html',
 '/src/css/main.css'
];

self.addEventListener('install', event => {
    console.log('SW install event!');
    event.waitUntil(
        caches.open(cacheName)
        .then(cache => {
            return cache.addAll(resToPrecache);
        })
    );
});

self.addEventListener('activate', event => {
    console.log('SW now ready to handle fetches!');
  });

self.addEventListener('fetch', (event) => {
    console.log('SW fetch: ' + event.request.url);
        event.respondWith(
            caches.match(event.request).then((resp) => {
            return resp || fetch(event.request).then((response) => {
                return caches.open(cacheName).then((cache) => {
                cache.put(event.request, response.clone());
                return response;
                });
            });
        })
    );
});
