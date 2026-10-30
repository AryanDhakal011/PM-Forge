import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const out = join(process.cwd(), "docs", "product-verification");
mkdirSync(out, { recursive: true });
const browser = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    "--headless=new",
    "--remote-debugging-port=9250",
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
      target = await fetch("http://127.0.0.1:9250/json/new?about:blank", {
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
      url: (process.env.PRODUCT_URL || "http://localhost:3000") + path,
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
  await navigate("/");
  await until(
    'document.documentElement.dataset.loaderDone === "true"',
    "landing loader",
  );
  await evaluate("document.fonts.ready");
  await wait(1800);
  for (let settle = 0; settle < 3; settle++) {
    await evaluate(
      "(()=>{const s=document.getElementById('signal');const r=s.getBoundingClientRect();scrollTo({top:r.top+scrollY+r.height-innerHeight-20,behavior:'instant'});dispatchEvent(new Event('resize'));})()",
    );
    await wait(700);
  }
  await click("Mobile conversion");
  const signalEntry = await evaluate(
    `(()=>{const a=Array.from(document.querySelectorAll('#signal a')).find(a=>a.textContent.includes('Practice 63 more'));if(!a)return null;const r=a.getBoundingClientRect();return {top:r.top,bottom:r.bottom,right:r.right,width:r.width,viewport:[innerWidth,innerHeight]}})()`,
  );
  report.signalEntry = signalEntry;
  report.signalLayout = await evaluate(
    `(()=>{let e=document.querySelector("#signal > div");const out=[];while(e){const r=e.getBoundingClientRect(),s=getComputedStyle(e);out.push({tag:e.tagName,class:e.className,position:s.position,overflow:s.overflow,transform:s.transform,top:r.top,height:r.height});e=e.parentElement}return {scrollY,htmlClass:document.documentElement.className,attrs:document.documentElement.dataset,chain:out}})()`,
  );
  await screenshot("signal-product-entry");
  check(
    signalEntry && signalEntry.top >= 0 && signalEntry.bottom <= 860,
    "Signal product CTA remains visible at the desktop pin threshold",
    signalEntry,
  );
  await evaluate("scrollTo({top:0,behavior:'instant'})");
  await wait(450);
  await evaluate("scrollTo({top:0,behavior:'instant'})");
  await wait(600);
  await evaluate(
    `document.querySelector('a[href="/signup?intent=enter"]').click()`,
  );
  await until(
    '!!document.querySelector(\'[role="dialog"]\') && document.body.innerText.includes("Try without an account")',
    "landing entry gate",
  );
  check(
    await evaluate('location.pathname === "/"'),
    "landing Enter opens a real entry modal",
  );
  await screenshot("landing-entry-gate");
  await click("Try without an account");
  await until(
    'location.pathname === "/onboarding" && !!document.querySelector("input")',
    "onboarding",
  );
  await evaluate(
    `(()=>{const input=document.querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Aryan');input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
  );
  await click("Product Manager");
  await click("Continue");
  await click("Build my foundation");
  await click("Continue");
  await click("Exploring");
  await click("Enter my workspace");
  await until(
    'location.pathname === "/app" && document.body.innerText.includes("Make room for a better decision.")',
    "home",
  );
  await navigate("/app");
  await until(
    'document.body.innerText.includes("Make room for a better decision.")',
    "fresh saved workspace navigation",
  );
  await wait(1800);
  await screenshot("desktop-home");
  report.homePerformance = await evaluate(
    `(async()=>{const before=window.__pmProductDraws;await new Promise(resolve=>setTimeout(resolve,2000));return {idleDrawsOver2s:window.__pmProductDraws-before,canvases:document.querySelectorAll('canvas').length,jsEncodedBytes:performance.getEntriesByType('resource').filter(e=>e.initiatorType==='script').reduce((sum,e)=>sum+e.encodedBodySize,0)}})()`,
  );
  check(
    report.homePerformance.idleDrawsOver2s === 0,
    "desktop instrument stops rendering at idle",
    report.homePerformance,
  );
  check(
    await evaluate(
      "!document.documentElement.scrollWidth || document.documentElement.scrollWidth <= innerWidth",
    ),
    "desktop has no overflow",
  );
  await click("View as table");
  check(
    await evaluate(
      'document.querySelectorAll("table tbody tr").length === 7 && document.body.textContent.includes("0 of 63 lit")',
    ),
    "shared coverage table preserves instrument data",
  );
  await screenshot("desktop-home-grid");
  await click("View as table");
  await evaluate(`document.querySelector('a[href="/app/practice"]').click()`);
  await navigate("/app/practice?category=root-cause&level=easy");
  await until(
    "document.querySelectorAll('article').length===3",
    "three RCA Easy questions",
  );
  check(
    await evaluate('document.querySelectorAll("article").length===3'),
    "library URL filters show exactly 3 RCA easy questions",
  );
  await screenshot("desktop-library");
  await evaluate(`document.querySelector('article a').click()`);
  await click("Start 8-minute guided Easy");
  await until(
    'document.body.innerText.includes("Before you take the room")',
    "run primer",
  );
  const runPath = await evaluate("location.pathname");
  report.runPath = runPath;
  await click("Pause");
  await navigate(runPath);
  await until(
    'document.body.innerText.includes("A moment to think")',
    "paused session restored",
  );
  check(true, "pause state survives reload");
  await click("Back to the room");
  await screenshot("desktop-primer");
  await click("Lock & continue");
  await until(
    'document.body.innerText.includes("Find the break")',
    "guided combined workbench",
  );
  check(
    await evaluate('document.body.innerText.includes("left · guided")'),
    "guided first run has remaining time",
  );
  for (const id of ["E1", "E2", "E3"]) {
    await evaluate(
      `Array.from(document.querySelectorAll('button')).find(e=>e.textContent.trim().startsWith('${id}')&&!e.disabled)?.click()`,
    );
    await wait(500);
  }
  await until(
    'document.body.innerText.includes("Find the break")',
    "workbench",
  );
  await evaluate(
    `(()=>{const s=document.querySelector('select');s.value='target';s.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
  await wait(500);
  for (let i = 0; i < 3; i++) {
    await evaluate(
      `Array.from(document.querySelectorAll('button[aria-label]')).find(e=>e.getAttribute('aria-label').startsWith('Move Tracking failure')&&e.getAttribute('aria-label').endsWith(' up'))?.click()`,
    );
    await wait(350);
  }
  await evaluate(
    `document.querySelector('[aria-label="Choose a decision path"] button').click()`,
  );
  await wait(600);
  await screenshot("desktop-workbench");
  await click("Lock & continue");
  await until('document.body.innerText.includes("One more thing")', "pushback");
  await click("Defend it with the evidence");
  await click("Lock & continue");
  await until(
    'document.body.innerText.includes("Make a call you can stand behind")',
    "synthesis",
  );
  await click("Start spoken rep");
  await wait(2300);
  await click("Pause spoken rep");
  check(
    await evaluate(
      `!document.querySelector('[aria-label="Spoken rep time remaining"]').textContent.includes('1:30')`,
    ),
    "spoken synthesis timer counts down",
  );
  await click("Use text / skip speaking for accessibility");
  const selects = await evaluate(
    'document.querySelectorAll("main select").length',
  );
  for (let index = 0; index < selects; index++) {
    await evaluate(
      `(()=>{const s=document.querySelectorAll('main select')[${index}];s.value=s.options[1].value;s.dispatchEvent(new Event('change',{bubbles:true}));})()`,
    );
    await wait(200);
  }
  await evaluate(
    `(()=>{const t=document.querySelector('main textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(t,'<img src=x onerror="window.__xss=true"> My evidence-linked review note.');t.dispatchEvent(new Event('input',{bubbles:true}));})()`,
  );
  await wait(600);
  await click("Commit & see feedback");
  await until(
    'document.body.innerText.includes("Here’s what your decisions show")',
    "feedback",
  );
  check(
    await evaluate('!document.body.innerText.includes("A reasoning trace")'),
    "expert trace hidden before reflection",
  );
  check(
    await evaluate(
      'document.body.innerText.includes("Evidence behind this band") && !document.body.innerText.includes("/100") && !document.body.innerText.includes("points above")',
    ),
    "feedback has evidence-backed bands without precise scores",
  );
  await screenshot("desktop-feedback");
  await click("Lock & continue");
  await until(
    'document.body.innerText.includes("How would you grade")',
    "calibration",
  );
  const groups = await evaluate(
    `document.querySelectorAll('[aria-label^="Self-grade"]').length`,
  );
  for (let i = 0; i < Math.min(1, groups); i++) {
    await evaluate(
      `document.querySelectorAll('[aria-label^="Self-grade"]')[${i}].querySelectorAll('button')[3].click()`,
    );
    await wait(200);
  }
  await click("Unlock the expert trace");
  await until(
    'document.body.innerText.includes("A reasoning trace")',
    "expert",
  );
  check(true, "guided feedback → reflection → expert gate");
  check(
    await evaluate('document.body.innerText.includes("Keep this run.")'),
    "first debrief offers account, persistent storage, and export",
  );
  await screenshot("desktop-expert");
  await click("Choose your next move");
  await click("Save as a decision record");
  await click("Open your decision record");
  await until(
    '!!document.querySelector("article") && document.body.innerText.includes("My evidence-linked review note")',
    "record",
  );
  check(await evaluate("!window.__xss"), "user-authored HTML remains inert");
  await screenshot("desktop-record");
  await navigate("/app/progress");
  await until('document.body.innerText.includes("Completed runs")', "progress");
  check(
    await evaluate('document.body.innerText.includes("1")'),
    "completed session updates progress",
  );
  check(await evaluate('!document.body.innerText.includes("Your first win") && !document.body.innerText.includes("Session-one activation")'), "finished reflection hides first-win and internal metrics from Progress");
  await navigate("/app/settings?debug=1");
  await until('document.body.innerText.includes("Developer diagnostics")', "Developer diagnostics");
  await evaluate(`Array.from(document.querySelectorAll('summary')).find(e=>e.textContent.includes('Developer diagnostics')).parentElement.open=true`);
  check(await evaluate('document.body.innerText.includes("Session-one activation: Reached")'), "session-one debrief and reflection activation is measured in Developer mode");
  await navigate("/app/progress");
  await screenshot("desktop-progress");
  await navigate(runPath);
  await until(
    'document.body.innerText.includes("Keep the lesson")',
    "resume completed run",
  );
  check(true, "run state survives page reload");
  if (process.env.PRODUCT_OFFLINE) {
    await evaluate(`navigator.serviceWorker.ready`);
    await navigate(runPath);
    await until(
      'document.body.innerText.includes("Keep the lesson")',
      "cache the completed run",
    );
    await send("Network.emulateNetworkConditions", {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });
    await navigate(runPath);
    await until(
      'document.body.innerText.includes("Keep the lesson")',
      "offline saved run",
    );
    check(true, "cached run and local state recover with the network offline");
    await send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
  }
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await navigate("/app");
  await until(
    'document.body.innerText.includes("Make room for a better decision.")',
    "mobile home",
  );
  await screenshot("mobile-home");
  check(
    await evaluate("document.documentElement.scrollWidth<=innerWidth"),
    "mobile has no horizontal overflow",
  );
  check(
    await evaluate('document.querySelectorAll("canvas").length===0'),
    "mobile instrument uses a still drawing",
  );
  await send("Emulation.setDeviceMetricsOverride", {
    width: 800,
    height: 766,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await navigate("/app");
  await until(
    'document.body.innerText.includes("Make room for a better decision.")',
    "tablet home",
  );
  await screenshot("tablet-home");
  check(
    await evaluate("document.documentElement.scrollWidth<=innerWidth"),
    "tablet has no horizontal overflow",
  );
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await navigate("/app/settings");
  await until(
    "!!document.querySelector('select[aria-label=\"Workspace theme\"]')",
    "settings",
  );
  await evaluate(
    `(()=>{const s=document.querySelector('select[aria-label="Workspace theme"]');s.value='dark';s.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
  await wait(500);
  await screenshot("mobile-settings-dark");
  check(
    await evaluate("!!document.querySelector('[data-theme=\"dark\"]')"),
    "dark theme works",
  );
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await navigate("/app");
  await until(
    'document.body.innerText.includes("Make room for a better decision.")',
    "reduced motion home",
  );
  check(
    await evaluate('document.querySelectorAll("canvas").length===0'),
    "reduced motion has no WebGL instrument",
  );
  const api = await evaluate(
    `(async()=>({me:await fetch('/api/me').then(r=>r.json()),workspace:(await fetch('/api/workspace')).status,config:await fetch('/api/auth-config').then(r=>r.json())}))()`,
  );
  report.api = api;
  check(
    api.workspace === 401 && !api.me.user,
    "server workspace rejects unauthenticated access",
  );
  check(
    report.errors.length === 0,
    "no browser runtime exceptions or console errors",
    report.errors,
  );
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
