const VERSION = 'v1.0.7';
const APP_CACHE_NAME = `ecomarket-${VERSION}`;

// Archivos esenciales, no podemos agregar mas, ya que si no, saturariamos(llenariamos) el cache
const appShell = [
    '/',
    '/offline.html',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/login.js',
    '/js/register.js',
    '/img/logo-EcoMarket.png',
    '/manifest.json'
];

// Instalar el Service Worker (guardar en caché)
self.addEventListener('install', event => {
    console.log('SW Instalando...');
    // Guardar en caché los archivos esenciales
    event.waitUntil(
        // Abrir la caché y agregar los archivos
        caches.open(APP_CACHE_NAME).then(cache => {
            console.log('SW Cacheando App Shell...');
            // Agregar todos los archivos al caché
            return cache.addAll(appShell);
        })
    );
});

// Activar el Service Worker (borrar versiones viejas)
self.addEventListener('activate', event => {
    console.log('SW Activando...');
    // Borrar cachés antiguas
    event.waitUntil(
        // Obtener todas las claves de caché
        caches.keys().then(keys =>
            // para cada clave, si no es la actual, borrarla
            Promise.all(
                // Iterar sobre las claves
                keys.map(key => {
                    // Si la clave no es la actual, borrarla
                    if (key !== APP_CACHE_NAME) {
                        console.log('SW Borrando caché antigua:', key);
                        // Borrar la caché
                        return caches.delete(key);
                    }
                })
            )
        )
    );
});

// Interceptar peticiones y servir desde caché dinámico
// self.addEventListener('fetch', event => {
//     // Responder con el recurso en caché o buscar en la red
//     event.respondWith(
//         // Buscar en caché
//         caches.match(event.request).then(cachedResponse => {
//             if (cachedResponse) {
//                 // Si está en caché, lo usamos
//                 return cachedResponse;
//             }

//             // Si no está, lo obtenemos de la red y lo guárdamos
//             return fetch(event.request)
//             // Si la respuesta es correcta, la guardamos en caché
//                 .then(networkResponse => {
//                     // Abrir la caché
//                     return caches.open(APP_CACHE_NAME).then(cache => {
//                         // Evitar cachear peticiones que no sean GET
//                         if (event.request.method === 'GET') {
//                             // Guardar la respuesta en caché
//                             cache.put(event.request, networkResponse.clone());
//                         }
//                         // Devolver la respuesta de la red
//                         return networkResponse;
//                     });
//                 })
//                 // Si falla la red, mostramos la página offline
//                 .catch(() => caches.match('/offline.html'));
//         })
//     );
// });


self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Ignorar llamadas a la API (no cachearlas)
  if (requestUrl.pathname.startsWith('/api/') || requestUrl.pathname.endsWith('.json')) {
    return; // Permitir que vaya directo al servidor
  }

  // Ignorar JS dinámicos (como misEntregas.js, solicitudes.js, etc.)
  if (requestUrl.pathname.startsWith('/pages/') || requestUrl.pathname.includes('misEntregas.js')) {
    return; // No interferir con los scripts dinámicos
  }

  // Resto del comportamiento de caché
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then(networkResponse => {
          return caches.open(APP_CACHE_NAME).then(cache => {
            if (event.request.method === 'GET' && requestUrl.origin === location.origin) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        })
        .catch(() => caches.match('/offline.html'));
    })
  );
});




// Probando el background Sync
// Sincronización en segundo plano
//abre una base de datos IndexedDB local (ecomarket-db), busca las donaciones guardadas y las intenta enviar cuando vuelve la conexión.
// self.addEventListener('sync', event => {
//   if (event.tag === 'sync-donaciones') {
//     console.log('[SW] Intentando sincronizar donaciones pendientes...');
//     event.waitUntil(enviarDonacionesPendientes());
//   }
// });

// async function enviarDonacionesPendientes() {
//   const db = await openDB('ecomarket-db', 1);
//   const tx = db.transaction('donaciones', 'readonly');
//   const store = tx.objectStore('donaciones');
//   const todas = await store.getAll();

//   for (const donacion of todas) {
//     try {
//       const res = await fetch('http://localhost:3000/donaciones', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(donacion),
//       });

//       if (res.ok) {
//         console.log('[SW] Donación sincronizada:', donacion);
//         const deleteTx = db.transaction('donaciones', 'readwrite');
//         deleteTx.objectStore('donaciones').delete(donacion.id);
//       } else {
//         console.warn('[SW] Error al subir donación:', donacion);
//       }
//     } catch (err) {
//       console.warn('[SW] Sin conexión todavía, se reintentará...', err);
//     }
//   }
// }
