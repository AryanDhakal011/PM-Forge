/* Only static assets and anonymous app shells are cached. Never APIs/auth/RSC. */
const CACHE = "pmforge-offline-v5";
const staticAsset = (url) =>
  url.origin === self.location.origin &&
  (url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/deadlock/fonts/") ||
    url.pathname.startsWith("/deadlock/characters/") ||
    url.pathname.startsWith("/deadlock/audio/") ||
    url.pathname.startsWith("/sacred-no/audio/") ||
    url.pathname === "/sacred-no/cast-v1.webp");
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.allSettled(
          ["/offline", "/app", "/app/practice"].map((url) => cache.add(url)),
        ),
      )
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("pmforge-offline-") && key !== CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_SACRED_SHELL") {
    event.waitUntil(caches.open(CACHE).then(cache => Promise.allSettled(["/app/projects/sacred-no", "/sacred-no/cast-v1.webp"].map(url => cache.add(url)))));
    return;
  }
  if (event.data?.type === "CACHE_DEADLOCK_SHELL") {
    event.waitUntil(
      caches
        .open(CACHE)
        .then((cache) =>
          Promise.allSettled(
            [
              "/app/projects/deadlock",
              "/deadlock/fonts/barlow-condensed-latin-600-normal.woff2",
              "/deadlock/fonts/ibm-plex-mono-latin-400-normal.woff2",
            ].map((url) => cache.add(url)),
          ),
        ),
    );
    return;
  }
  if (
    event.data?.type !== "CACHE_VISITED_ASSETS" ||
    !Array.isArray(event.data.urls)
  )
    return;
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(
        event.data.urls
          .slice(0, 160)
          .filter((url) => {
            try {
              return staticAsset(new URL(url));
            } catch {
              return false;
            }
          })
          .map((url) => cache.add(url)),
      ),
    ),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.searchParams.has("_rsc")
  )
    return;
  if (staticAsset(url))
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        // Store complete short voice clips, never a 206 fragment. A full 200
        // response is valid for a Range request and can be replayed offline.
        const response = await fetch(
          request.headers.has("range") ? url.href : request,
        );
        if (response.ok)
          try {
            await cache.put(request, response.clone());
          } catch {
            /* Playback must survive storage quota errors. */
          }
        return response;
      }),
    );
  else if (
    request.mode === "navigate" &&
    (url.pathname.startsWith("/app") || url.pathname === "/offline")
  )
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response.ok) await cache.put(request, response.clone());
          return response;
        } catch {
          return (
            (await cache.match(request)) ||
            (url.pathname.startsWith("/app/projects/deadlock")
              ? await cache.match("/app/projects/deadlock")
              : null) ||
            (url.pathname === "/app/projects/sacred-no" ? await cache.match("/app/projects/sacred-no") : null) ||
            (await cache.match("/offline")) ||
            Response.error()
          );
        }
      }),
    );
});
