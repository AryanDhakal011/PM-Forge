"use client";
import { useEffect } from "react";
export default function OfflineSupport() {
  useEffect(() => {
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
