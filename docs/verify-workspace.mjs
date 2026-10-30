import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const out = join(process.cwd(), "docs", "workspace-verification");
mkdirSync(out, { recursive: true });
const browser = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    "--headless=new",
    "--remote-debugging-port=9256",
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "pmf-mvp-"))}`,
    "--no-first-run",
    "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true },
);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
const report = { at: new Date().toISOString(), checks: [], errors: [] };
try {
  let target;
  for (let i = 0; i < 50; i++) {
    try {
      target = await fetch("http://127.0.0.1:9256/json/new?about:blank", {
        method: "PUT",
      }).then((r) => r.json());
      break;
    } catch {
      await wait(200);
    }
  }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let seq = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const m = JSON.parse(event.data);
    if (m.id) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      m.error
        ? p?.reject(Error(JSON.stringify(m.error)))
        : p?.resolve(m.result);
    }
    if (m.method === "Runtime.exceptionThrown")
      report.errors.push(
        m.params.exceptionDetails.exception?.description ||
          m.params.exceptionDetails.text,
      );
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error")
      report.errors.push(
        m.params.args.map((a) => a.value || a.description).join(" "),
      );
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails)
      throw Error(
        r.exceptionDetails.exception?.description || "Evaluation failed",
      );
    return r.result.value;
  };
  const until = async (expression, label) => {
    for (let i = 0; i < 150; i++) {
      try {
        if (await evaluate(expression)) return;
      } catch {}
      await wait(200);
    }
    throw Error(
      `Timeout: ${label}; ` +
        (await evaluate("document.body.innerText.slice(-1800)")),
    );
  };
  const click = async (text) => {
    await until(
      `Array.from(document.querySelectorAll('button,a')).some(e=>e.textContent.trim().includes(${JSON.stringify(text)})&&!e.disabled)`,
      `button ${text}`,
    );
    await evaluate(
      `(()=>{const e=Array.from(document.querySelectorAll('button,a')).find(e=>e.textContent.trim().includes(${JSON.stringify(text)})&&!e.disabled);e.click()})()`,
    );
    await wait(450);
  };
  const screenshot = async (name) => {
    const image = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(out, name + ".png"), Buffer.from(image.data, "base64"));
  };
  const check = (ok, label, details) => {
    report.checks.push({ label, pass: !!ok, details });
    if (!ok) throw Error(`Check failed: ${label}`);
  };
  const navigate = async (path) => {
    await send("Page.navigate", {
      url: (process.env.PRODUCT_URL || "http://localhost:3001") + path,
    });
    await wait(1000);
    await until('document.readyState === "complete"', "page load");
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `window.__pmProductDraws=0;for(const C of [window.WebGLRenderingContext,window.WebGL2RenderingContext]){if(!C)continue;for(const name of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){const original=C.prototype[name];if(original)C.prototype[name]=function(...args){window.__pmProductDraws++;return original.apply(this,args)}}}`,
  });
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 860,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await navigate("/app");
  await click("Try without an account");
  await click("Skip setup");
  await until(
    "location.pathname === '/app' && document.body.innerText.includes('Make room for a better decision.')",
    "Today",
  );
  await wait(2400);
  check(
    await evaluate(
      "document.querySelectorAll('nav[aria-label=Workspace] a').length===5",
    ),
    "five primary workspace destinations",
  );
  check(
    await evaluate(
      "document.querySelectorAll('summary').length===2 && !document.body.innerText.includes('Saved on this device only')",
    ),
    "storage and account menus replace repeated guest notices",
  );
  check(
    await evaluate(
      "document.querySelectorAll('svg a[href*=practice]').length===63",
    ),
    "63 named scenario beads in the fallback",
  );
  report.instrument = await evaluate(
    "(async()=>{const n=window.__pmProductDraws;await new Promise(r=>setTimeout(r,2000));return {idleDraws:window.__pmProductDraws-n,contexts:document.querySelectorAll('canvas').length}})()",
  );
  check(
    report.instrument.idleDraws === 0 && report.instrument.contexts <= 1,
    "single instrument context stops drawing at idle",
    report.instrument,
  );
  await click("View as table");
  check(
    await evaluate(
      "document.querySelectorAll('table tbody tr').length===7 && document.querySelectorAll('th[scope=col]').length===4",
    ),
    "coverage table uses shared seven by three data",
  );
  for (const width of [1920, 1440, 768, 390, 320]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 700,
    });
    await wait(650);
    check(
      await evaluate("document.documentElement.scrollWidth<=innerWidth"),
      "Today no overflow at " + width,
    );
    await screenshot("today-" + width);
  }
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await evaluate(
    `document.querySelector('button[aria-label="Collapse sidebar"]').click()`,
  );
  await navigate("/app/practice");
  await until(
    "document.querySelectorAll('article').length===63",
    "63 scenario cards",
  );
  check(
    await evaluate("document.querySelector('[data-collapsed=true]')!==null"),
    "sidebar choice survives navigation",
  );
  report.firstCategories = await evaluate(
    "Array.from(document.querySelectorAll('article')).slice(0,7).map(e=>e.querySelector('div>span').textContent)",
  );
  check(
    new Set(report.firstCategories).size === 7,
    "recommended order starts with one Easy scenario from each room",
    report.firstCategories,
  );
  check(
    await evaluate(
      "!document.querySelector('select') && document.querySelectorAll('[aria-label=Categories] button').length===7",
    ),
    "custom filters and category multiselect",
  );
  await navigate("/app/practice?category=root-cause&level=easy");
  await until(
    "document.querySelectorAll('article').length===3",
    "three RCA Easy cards",
  );
  await wait(900);
  await evaluate(
    "document.querySelector('button[aria-label^=Bookmark]').click()",
  );
  await until(
    `!!document.querySelector('button[aria-pressed=true][aria-label^="Remove bookmark"]')`,
    "bookmark saved",
  );
  await click("View saved");
  await until(
    "location.search.includes('view=saved') && document.querySelectorAll('article').length===1",
    "Saved",
  );
  check(
    await evaluate("!document.querySelector('input[placeholder*=Search]')"),
    "empty and small Saved lists omit filters",
  );
  await navigate("/app/bookmarks");
  await until(
    "location.pathname==='/app/practice'&&location.search.includes('view=saved')",
    "legacy saved redirect",
  );
  check(true, "legacy Bookmarks redirects to Practice Saved");
  await navigate("/app/history");
  await until(
    "location.pathname==='/app/progress'&&location.search.includes('tab=history')",
    "legacy history redirect",
  );
  check(true, "legacy History redirects to Progress History");
  await navigate("/app/progress");
  await until(
    "document.body.innerText.includes('Your first win')",
    "first-win",
  );
  check(
    await evaluate(
      "!document.body.innerText.includes('Session-one activation') && document.querySelectorAll('svg a[href*=projects]').length===12",
    ),
    "Progress uses real constellation and first-win without diagnostics",
  );
  await navigate("/app/settings?debug=1");
  await until(
    "document.body.innerText.includes('Developer diagnostics')",
    "developer settings",
  );
  check(true, "diagnostics available only through explicit Developer mode");
  await navigate("/app/projects");
  await until(
    "document.querySelectorAll('article').length===12",
    "project posters",
  );
  check(
    await evaluate(
      "!document.body.innerText.includes('Recommended from') && document.querySelector('[data-room=projects]')!==null",
    ),
    "fresh project posters are honest and the workspace takes walnut palette",
  );
  check(
    await evaluate(
      "new Set(Array.from(document.querySelectorAll('article svg path')).map(x=>x.getAttribute('d'))).size>=12",
    ),
    "twelve distinct mission illustrations",
  );
  for (const width of [1920, 1440, 768, 390, 320]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 700,
    });
    await wait(500);
    check(
      await evaluate("document.documentElement.scrollWidth<=innerWidth"),
      "Projects no overflow at " + width,
    );
    await screenshot("projects-" + width);
  }
  await navigate("/app/practice?layout=list");
  await until("document.querySelectorAll('article').length===63", "list view");
  check(true, "list view preserves all 63");
  await navigate("/app/practice?layout=map");
  await until(
    "document.querySelectorAll('main a[title]').length>=63",
    "map view",
  );
  check(true, "map has every brief as a named link");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await navigate("/app");
  await until(
    "document.body.innerText.includes('Make room')",
    "Today keyboard",
  );
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "k",
    code: "KeyK",
    modifiers: 2,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "k",
    code: "KeyK",
    modifiers: 2,
  });
  await until("!!document.querySelector('[role=dialog]')", "command palette");
  check(
    await evaluate(
      "document.querySelector('[role=dialog]').contains(document.activeElement)",
    ),
    "command palette traps focus",
  );
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
  });
  await until("!document.querySelector('[role=dialog]')", "close palette");
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await navigate("/app");
  await until(
    "document.body.innerText.includes('Make room')",
    "reduced motion Today",
  );
  await wait(1200);
  check(
    await evaluate(
      "document.querySelectorAll('canvas').length===0 && document.querySelectorAll('svg a[href*=practice]').length===63",
    ),
    "reduced motion retains full SVG coverage without WebGL",
  );
  await screenshot("today-reduced");
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });
  await navigate("/");
  await until(
    "document.documentElement.dataset.loaderDone==='true'",
    "landing",
  );
  await evaluate("document.fonts.ready");
  await wait(1500);
  for (const width of [1440, 768, 390, 320]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 700,
    });
    await wait(500);
    report.footer = await evaluate(
      "(()=>{const f=document.querySelector('fieldset'),next=f.nextElementSibling;f.scrollIntoView({behavior:'instant',block:'center'});const a=f.getBoundingClientRect(),b=next.getBoundingClientRect();return {fieldsetBottom:a.bottom,nextTop:b.top,childrenFit:Array.from(f.querySelectorAll('button,p')).every(e=>{const r=e.getBoundingClientRect();return r.top>=a.top&&r.bottom<=a.bottom+1}),overflow:document.documentElement.scrollWidth>innerWidth}})()",
    );
    check(
      report.footer.childrenFit &&
        report.footer.nextTop >= report.footer.fieldsetBottom &&
        !report.footer.overflow,
      "Preferences and following container do not overlap at " + width,
      report.footer,
    );
    await screenshot("footer-" + width);
  }
  check(report.errors.length === 0, "no browser runtime errors", report.errors);
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.failure = String(error.stack || error);
  console.error(report.failure);
  process.exitCode = 1;
} finally {
  writeFileSync(join(out, "results.json"), JSON.stringify(report, null, 2));
  ws?.close();
  browser.kill();
}
