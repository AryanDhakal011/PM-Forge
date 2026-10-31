/* Standalone recovery: deliberately no framework, database instance, or imports. */
(() => {
  const status = document.getElementById("status");
  document.getElementById("origin").textContent = location.origin;
  const buttons = [...document.querySelectorAll("button")];
  const owned = (name) => /^pmforge(?:[.:-]|$)/i.test(name);
  async function clearFiles() {
    const registrations =
      "serviceWorker" in navigator
        ? await navigator.serviceWorker.getRegistrations()
        : [];
    await Promise.all(
      registrations.map((registration) => registration.unregister()),
    );
    const keys = "caches" in window ? await caches.keys() : [];
    await Promise.all(keys.filter(owned).map((key) => caches.delete(key)));
  }
  function deleteDatabase(name) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name);
      const timer = setTimeout(
        () =>
          reject(
            Error(
              "Another PMForge tab is holding local storage open. Close the other tabs, then retry here.",
            ),
          ),
        8000,
      );
      request.onsuccess = () => {
        clearTimeout(timer);
        resolve();
      };
      request.onerror = () => {
        clearTimeout(timer);
        reject(request.error || Error("Could not clear local storage."));
      };
      request.onblocked = () => {
        status.textContent =
          "Waiting for another PMForge tab to release storage. Close other PMForge tabs if this continues.";
      };
    });
  }
  async function reset(full) {
    buttons.forEach((button) => (button.disabled = true));
    document.getElementById("continue").hidden = true;
    status.textContent = full
      ? "Signing out and clearing local test data…"
      : "Removing cached app files…";
    try {
      if (full) {
        const response = await fetch("/api/auth/sign-out", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok && ![401, 404, 503].includes(response.status))
          throw Error(
            "Sign-out did not complete. Retry so account sync cannot restore the workspace.",
          );
        const identity = await fetch("/api/me", { cache: "no-store" }).then(
          (r) => (r.ok ? r.json() : null),
        );
        if (identity?.user)
          throw Error(
            "You are still signed in. Sign out, then retry the reset.",
          );
      }
      await clearFiles();
      if (full) {
        // Clear identity before deleting databases so other app tabs stop querying.
        for (const store of [localStorage, sessionStorage])
          for (const key of Object.keys(store))
            if (owned(key)) store.removeItem(key);
        const known = [
          "pmforge-workspace-v1",
          "pmforge-deadlock-v1",
          "pmforge-sacred-no-v1",
        ];
        const listed = indexedDB.databases ? await indexedDB.databases() : [];
        const names = [
          ...new Set([
            ...known,
            ...listed
              .map((db) => db.name)
              .filter((name) => name && owned(name)),
          ]),
        ];
        await Promise.all(names.map(deleteDatabase));
        const remaining = indexedDB.databases
          ? (await indexedDB.databases()).filter(
              (db) => db.name && owned(db.name),
            ).length
          : null;
        if (remaining)
          throw Error(
            "Some local databases are still open. Close other PMForge tabs and retry.",
          );
        status.textContent = `Fresh start ready.\nLocal PMForge data, preferences, caches and offline workers cleared for ${location.origin}.\n${remaining === 0 ? "0 PMForge databases remain. " : "Known PMForge databases deleted. "}You are signed out. No new test run has been created.`;
      } else
        status.textContent =
          "App cache and offline workers cleared. Your saved work was kept. Open the workspace to load the latest app.";
      document.getElementById("continue").hidden = false;
    } catch (error) {
      status.textContent =
        "Reset not complete: " + (error.message || String(error));
    } finally {
      buttons.forEach((button) => (button.disabled = false));
    }
  }
  document
    .getElementById("cache")
    .addEventListener("click", () => void reset(false));
  document
    .getElementById("fresh")
    .addEventListener("click", () => void reset(true));
})();
