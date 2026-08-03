/* Beş Vakit — servis işçisi
   Amaç: uygulama kabuğunu çevrimdışı açılabilir tutmak.
   Vakitler zaten cihazda hesaplandığı için kabuk açıldığında uygulama tam çalışır.
   Harita karoları ve Overpass sorguları bilinçli olarak önbelleğe alınmaz;
   onlar zaten isteğe bağlı ve büyük. */
const SURUM = 'besvakit-v3';
const KABUK = ['./', './index.html', './logos.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(SURUM).then(c=> c.addAll(KABUK)).then(()=> self.skipWaiting()));
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys()
      .then(a=> Promise.all(a.filter(k=> k !== SURUM).map(k=> caches.delete(k))))
      .then(()=> self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  const istek = e.request;
  if(istek.method !== 'GET') return;
  const url = new URL(istek.url);

  // harita karosu / cami sorgusu: dokunma, doğrudan ağa gitsin
  if(/tile|arcgisonline|overpass/.test(url.hostname + url.pathname)) return;

  // uygulama kabuğu: önce ağ, olmazsa önbellek (güncellemeyi kaçırmamak için)
  if(url.origin === location.origin){
    e.respondWith(
      fetch(istek)
        .then(y=>{
          if(y && y.ok){ const kopya = y.clone(); caches.open(SURUM).then(c=> c.put(istek, kopya)); }
          return y;
        })
        .catch(()=> caches.match(istek).then(y=> y || caches.match('./index.html')))
    );
    return;
  }

  // yazı tipi, Leaflet gibi dış varlıklar: önce önbellek, arkadan tazele
  e.respondWith(
    caches.match(istek).then(onbellek=>{
      const ag = fetch(istek).then(y=>{
        if(y && (y.ok || y.type === 'opaque')){ const kopya = y.clone(); caches.open(SURUM).then(c=> c.put(istek, kopya)); }
        return y;
      }).catch(()=> onbellek);
      return onbellek || ag;
    })
  );
});
