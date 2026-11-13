// おかえりの灯：ホーム画面に置いたあと、電波のない所でも開けるようにする。
// 処理と台本（html/js/css）は、つながる時は新しいものを取りに行く。絵と音は、一度取ったものを使い回す。
const CACHE='okaeri-v1';
const SHELL=['./','index.html','style.css','battle.css','opening-film.css','manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
 const req=e.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==location.origin)return;
 const media=/\.(png|webp|jpg|ogg|mp3|wav)$/.test(url.pathname);
 const keep=res=>{if(res&&res.ok&&res.status===200){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});}return res;};
 if(media)e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(keep)));
 else e.respondWith(fetch(req).then(keep).catch(()=>caches.match(req).then(hit=>hit||caches.match('index.html'))));
});
