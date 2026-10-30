/* Hyakki no Yoru service worker: offline play. Registered only over http(s). Cache-first for own files; ad SDKs go to network. Bump VERSION on changes. */
const VERSION = 'hyakki-v8';
const FILES = ["./", "./ads.js", "./arakami.webp", "./audio.js", "./battle.js", "./bg_camp.webp", "./bg_forest.webp", "./bg_shrine.webp", "./bg_storm.webp", "./bg_title.webp", "./chest.js", "./data.js", "./e_chochin.webp", "./e_karakasa.webp", "./e_kitsunebi.webp", "./e_kogaki.webp", "./fonts/brush.woff2", "./fonts/cinzel.woff2", "./fonts/mincho.woff2", "./fonts/mincho_xb.woff2", "./fx.js", "./i18n.js", "./icon-192.png", "./icon-512.png", "./icon-maskable.png", "./index.html", "./kagutsuchi.webp", "./kappa.webp", "./karasuba.webp", "./main.js", "./manifest.webmanifest", "./map.js", "./mumei.webp", "./mumei_oni.webp", "./mumei_tiger.webp", "./oboro.webp", "./raijin.webp", "./ryujin.webp", "./shuramaru.webp", "./stage25.js", "./state.js", "./story.js", "./style.css", "./tamamo.webp", "./theme.css", "./ui.js", "./ui/c_bl.svg", "./ui/c_br.svg", "./ui/c_tl.svg", "./ui/c_tr.svg", "./ui/chest_bronze.webp", "./ui/chest_gold.webp", "./ui/chest_legend.webp", "./ui/chest_wood.webp", "./ui/map_land.webp", "./ui/map_port.webp", "./ui/washi.png", "./ui/washi_dark.png", "./w_fore.svg", "./w_toro.svg", "./w_trees.svg", "./yukihana.webp"];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then(async (c) => { for (let i = 0; i < FILES.length; i += 6) await Promise.all(FILES.slice(i, i + 6).map((f) => c.add(f).catch(() => {}))); }).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
/* code (html/js/css/manifest) is network-first with a 3 s timeout so a fix reaches phones on the next load even if the cache version was not bumped; art/audio/fonts stay cache-first */
const CODE = /(\.(html|js|css|webmanifest)|\/)$/;
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin) return;
  const store = (res) => { if (res && res.ok) { const cp = res.clone(); caches.open(VERSION).then((c) => c.put(r, cp)); } return res; };
  if (r.mode === 'navigate' || CODE.test(u.pathname)) {
    e.respondWith(new Promise((ok) => {
      let done = false; const fall = () => caches.match(r, { ignoreSearch: true }).then((h) => h || caches.match('./index.html'));
      const t = setTimeout(() => { if (!done) { done = true; fall().then(ok); } }, 3000);
      fetch(r).then((res) => { if (done) { store(res); return; } done = true; clearTimeout(t); ok(store(res)); }).catch(() => { if (!done) { done = true; clearTimeout(t); fall().then(ok); } });
    }));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then((hit) => hit || fetch(r).then(store).catch(() => caches.match('./index.html'))));
});
