// Service worker de l'application Solfège. Le numéro de version et la liste des fichiers sont ajoutés par tools/build-app.mjs.
//  - le code, la feuille de style, les polices et l'icône sont pré-chargés : l'application s'ouvre sans réseau ;
//  - les SoundFonts (hébergées sur GitHub) sont gardées dans un cache à part, conservé d'une version à l'autre : après le premier ▶, le son riche marche aussi hors-ligne.
const VERSION = 'd6bbfda6';
const CACHE = `solfege-${VERSION}`;
const SONS = 'solfege-sons';
const PRECACHE = ["./","./index.html","./main.js?v=d6bbfda6","./app.css?v=d6bbfda6","./manifest.json","./icon.svg","./fonts/Inter-Variable-latin.woff2","./fonts/Fraunces-wght-normal.woff2","./fonts/Fraunces-wght-italic.woff2","./chunks/chunk-B4PFCCND.js","./chunks/chunk-IHRIUEAN.js","./chunks/chunk-JYYRXKK6.js","./chunks/chunk-W3JR4FXL.js","./chunks/chunk-WSUMZ6U7.js","./chunks/controle-ZXG2UW5G.js","./chunks/jeux-FII5GE54.js","./chunks/lecon-BONPBQVF.js","./chunks/oreille-ZKY3HLSU.js","./chunks/outils-QS37KIME.js","./chunks/sound-4ZFQU25E.js"];

self.addEventListener('install', (event) => {
  // `cache: 'reload'` : chaque fichier est demandé au serveur, jamais lu dans le cache HTTP du navigateur (sinon une nouvelle version pourrait se retrouver avec d'anciens fichiers)
  event.waitUntil(caches.open(CACHE).then((c) => Promise.all(PRECACHE.map((u) => c.add(new Request(u, { cache: 'reload' }))))));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('solfege-') && k !== CACHE && k !== SONS).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {
    // SoundFonts : cache d'abord, puis réseau (et on garde la copie)
    if (/\.sf3?$/i.test(url.pathname)) {
      event.respondWith(caches.open(SONS).then(async (c) => {
        const hit = await c.match(req); if (hit) return hit;
        const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res;
      }));
    }
    return;
  }
  event.respondWith(caches.match(req, { ignoreSearch: false }).then((hit) => hit || caches.match(req, { ignoreSearch: true })).then((hit) => hit || fetch(req)).catch(() => caches.match('./index.html')));
});
