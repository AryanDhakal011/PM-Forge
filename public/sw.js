/* Only static assets and anonymous app shells are cached. APIs/auth are never cached. */
const CACHE='pmforge-offline-v1';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(['/offline','/app','/app/practice'].map(url=>cache.add(url)))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('pmforge-offline-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data?.type!=='CACHE_VISITED_ASSETS')return;event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(event.data.urls.slice(0,120).filter(url=>{const u=new URL(url);return u.origin===self.location.origin&&u.pathname.startsWith('/_next/static/');}).map(url=>cache.add(url)))));});
self.addEventListener('fetch',event=>{
 const request=event.request;const url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/auth/')||url.searchParams.has('_rsc'))return;
 if(url.pathname.startsWith('/_next/static/'))event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response;}));
 else if(request.mode==='navigate'&&(url.pathname.startsWith('/app')||url.pathname==='/offline'))event.respondWith(caches.open(CACHE).then(async cache=>{try{const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response;}catch{return await cache.match(request)||await cache.match('/offline')||Response.error();}}));
});
