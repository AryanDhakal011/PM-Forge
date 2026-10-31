"use client";
import { useEffect } from "react";
export default function OfflineSupport() {
  useEffect(() => {
    // Production builds are replaced frequently during local testing. Never
    // keep an old local app shell or its chunks alive in a service worker.
    if (["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)) {
      void Promise.allSettled([
        navigator.serviceWorker
          ?.getRegistrations()
          .then((rows) =>
            Promise.all(rows.map((registration) => registration.unregister())),
          ),
        "caches" in window
          ? caches
              .keys()
              .then((keys) =>
                Promise.all(
                  keys
                    .filter((key) => key.startsWith("pmforge-"))
                    .map((key) => caches.delete(key)),
                ),
              )
          : Promise.resolve(),
      ]);
      return;
    }
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return;
    let disposed = false;
    void navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        if (disposed) return;
        const urls = performance
          .getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((url) => {
            const parsed = new URL(url);
            return (
              parsed.origin === location.origin &&
              (parsed.pathname.startsWith("/_next/static/") ||
                parsed.pathname.includes(".woff2"))
            );
          });
        registration.active?.postMessage({
          type: "CACHE_VISITED_ASSETS",
          urls,
        });
      })
      .catch(() => {});
    return () => {
      disposed = true;
    };
  }, []);
  return null;
}
