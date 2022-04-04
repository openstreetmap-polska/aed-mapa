const cacheName = 'aed-map';
const resToPrecache = [
 '/',
 '/index.html',
 '/css/main.css'
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


self.addEventListener('fetch', event => {
    event.respondWith(
        // try get response from network
        
        fetch(event.request).then(async response => {
            // if network success, cache it for all GET requests
            var responseClone = response.clone(); 

            if(event.request.method == 'GET'){
                await caches.open(cacheName)
                .then(cache => {
                    cache.put(event.request, responseClone);
                });
            }
            return response;
        }).catch(function(){
        // if network fails, try get response from cache

            return caches.match(event.request);
        })
    );
});
