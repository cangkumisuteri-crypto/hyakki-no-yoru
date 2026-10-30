/* Hyakki no Yoru service worker: offline play. Registered only over http(s). Cache-first for own files; ad SDKs go to network. Bump VERSION on changes. */
const VERSION = 'hyakki-v3';
const FILES = ["./", "./ads.js", "./arakami.webp", "./audio.js", "./battle.js", "./bg_camp.webp", "./bg_forest.webp", "./bg_shrine.webp", "./bg_storm.webp", "./bg_title.webp", "./data.js", "./e_chochin.webp", "./e_karakasa.webp", "./e_kitsunebi.webp", "./e_kogaki.webp", "./fx.js", "./i18n.js", "./icon-192.png", "./icon-512.png", "./icon-maskable.png", "./index.html", "./kagutsuchi.webp", "./kappa.webp", "./karasuba.webp", "./main.js", "./manifest.webmanifest", "./mumei.webp", "./mumei_oni.webp", "./mumei_tiger.webp", "./oboro.webp", "./raijin.webp", "./ryujin.webp", "./shuramaru.webp", "./stage25.js", "./state.js", "./story.js", "./style.css", "./tamamo.webp", "./ui.js", "./w_fore.svg", "./w_toro.svg", "./w_trees.svg", "./yukihana.webp"];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin) return;
  e.respondWith(caches.match(r, { ignoreSearch: true }).then((hit) => hit || fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(VERSION).then((c) => c.put(r, cp)); } return res; }).catch(() => caches.match('./index.html'))));
});
