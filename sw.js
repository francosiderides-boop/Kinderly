const CACHE='kinderly-shell-v189';
const LIBS='kinderly-libs-1'; // jszip y epub.js (versión fija): sin esto, un libro guardado no abre sin conexión si el navegador vació su caché
const CATALOG=['top','reir','emocion','aventura','intriga','pensar','sonar','susto','breve','historia','teatro','poesia','chicos'].map(c=>'./catalog/'+c+'.json');
const SHELL=['./','./index.html','./manifest.webmanifest','./descubrir.html','./social.js','./reader.js','./discover.js','./instalar.html','./extras.js','./pets.js','./k2-icon.svg','./k2-180.png','./k2-192.png','./k2-512.png',...CATALOG];
const LIB_RX=/^https:\/\/(cdnjs\.cloudflare\.com\/ajax\/libs\/jszip\/3\.10\.1\/|cdn\.jsdelivr\.net\/npm\/epubjs@0\.3\.93\/|unpkg\.com\/epubjs@0\.3\.93\/)/;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('kinderly-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET')return;
  // librerías del lector: primero la copia guardada (nunca cambian)
  if(LIB_RX.test(request.url)){event.respondWith(caches.open(LIBS).then(c=>c.match(request).then(hit=>hit||fetch(request).then(res=>{if(res.ok||res.type==='opaque')c.put(request,res.clone());return res}))));return}
  if(url.origin!==location.origin)return;
  // la app: primero la red; sin conexión, lo guardado (los .js?v=N también encuentran su copia sin el ?v)
  // 'no-cache': siempre pregunta al servidor si hay versión nueva (GitHub Pages deja el navegador reusar archivos 10 min)
  const fresh=request.mode==='navigate'?new Request(request.url,{cache:'no-cache',credentials:'same-origin'}):new Request(request,{cache:'no-cache'});
  event.respondWith(fetch(fresh).then(response=>{if(response.ok&&url.pathname.includes('/Kinderly/')){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response})
    .catch(()=>caches.match(request).then(hit=>hit||caches.match(request,{ignoreSearch:true})).then(hit=>hit||(request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
