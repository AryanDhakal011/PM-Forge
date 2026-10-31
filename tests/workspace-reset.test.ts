import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const source = readFileSync("public/reset-workspace.js", "utf8");
async function simulate(full: boolean, signout = 200) {
  const nodes = new Map<string, any>(
    ["status", "origin", "continue", "fresh", "cache"].map((id) => [
      id,
      {
        textContent: "",
        hidden: true,
        disabled: false,
        click: () => {},
        addEventListener(_name: string, fn: () => void) {
          this.click = fn;
        },
      },
    ]),
  );
  const data = new Map([
    ["pmforge.product.identity", "guest-test"],
    ["pmforge.sacred.prefs.v1", "{}"],
    ["unrelated-app", "keep"],
  ]);
  const store = new Proxy(
    {},
    {
      ownKeys: () => [...data.keys()],
      getOwnPropertyDescriptor: () => ({
        configurable: true,
        enumerable: true,
      }),
      get: (_, key) =>
        key === "removeItem" ? (name: string) => data.delete(name) : undefined,
    },
  );
  const deleted: string[] = [],
    cacheDeleted: string[] = [],
    requests: string[] = [],
    dbNames = new Set([
      "pmforge-workspace-v1",
      "pmforge-deadlock-v1",
      "pmforge-sacred-no-v1",
      "unrelated-db",
    ]);
  const sandbox = {
    document: {
      getElementById: (id: string) => nodes.get(id),
      querySelectorAll: () => [nodes.get("fresh"), nodes.get("cache")],
    },
    location: { origin: "http://localhost:3001" },
    navigator: {
      serviceWorker: {
        getRegistrations: async () => [{ unregister: async () => true }],
      },
    },
    window: { caches: {} },
    caches: {
      keys: async () => ["pmforge-offline-v5", "unrelated-cache"],
      delete: async (name: string) => cacheDeleted.push(name),
    },
    localStorage: store,
    sessionStorage: store,
    indexedDB: {
      databases: async () => [...dbNames].map((name) => ({ name })),
      deleteDatabase(name: string) {
        const request: any = {};
        setTimeout(() => {
          deleted.push(name);
          dbNames.delete(name);
          request.onsuccess();
        }, 0);
        return request;
      },
    },
    fetch: async (url: string) => {
      requests.push(url);
      return {
        ok: signout === 200,
        status: signout,
        json: async () => ({ user: null }),
      };
    },
    setTimeout,
    clearTimeout,
  };
  runInNewContext(source, sandbox);
  nodes.get(full ? "fresh" : "cache").click();
  for (let i = 0; i < 100 && nodes.get("fresh").disabled; i++)
    await new Promise((r) => setTimeout(r, 2));
  return { nodes, data, deleted, cacheDeleted, requests };
}
test("full reset removes PMForge test data and databases only, and signs out first", async () => {
  const r = await simulate(true);
  assert.equal(r.data.has("pmforge.product.identity"), false);
  assert.equal(r.data.get("unrelated-app"), "keep");
  assert.equal(r.deleted.length, 3);
  assert.ok(!r.deleted.includes("unrelated-db"));
  assert.deepEqual(r.cacheDeleted, ["pmforge-offline-v5"]);
  assert.equal(r.requests[0], "/api/auth/sign-out");
  assert.match(r.nodes.get("status").textContent, /0 PMForge databases remain/);
  assert.equal(r.nodes.get("continue").hidden, false);
});
test("cache-only recovery preserves identity and run databases", async () => {
  const r = await simulate(false);
  assert.equal(r.data.has("pmforge.product.identity"), true);
  assert.equal(r.deleted.length, 0);
  assert.equal(r.requests.length, 0);
  assert.deepEqual(r.cacheDeleted, ["pmforge-offline-v5"]);
  assert.match(r.nodes.get("status").textContent, /saved work was kept/);
});
test("failed sign-out does not silently delete local work or claim a successful reset", async () => {
  const r = await simulate(true, 403);
  assert.equal(r.deleted.length, 0);
  assert.equal(r.cacheDeleted.length, 0);
  assert.equal(r.data.has("pmforge.product.identity"), true);
  assert.match(r.nodes.get("status").textContent, /Reset not complete/);
  assert.equal(r.nodes.get("continue").hidden, true);
});
