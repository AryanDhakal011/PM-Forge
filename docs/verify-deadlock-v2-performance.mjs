import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const out = join(process.cwd(), "docs", "deadlock-v2-verification");
mkdirSync(out, { recursive: true });
const browser = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    "--headless=new",
    "--remote-debugging-port=9282",
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
      target = await fetch("http://127.0.0.1:9282/json/new?about:blank", {
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

  const clickSel = async (selector) => {
    await until(
      `!!document.querySelector(${JSON.stringify(selector)})&&!document.querySelector(${JSON.stringify(selector)}).disabled`,
      "control " + selector,
    );
    await evaluate(
      `document.querySelector(${JSON.stringify(selector)}).click()`,
    );
    await wait(250);
  };
  const select = async (selector, value) => {
    await until(
      `!!document.querySelector(${JSON.stringify(selector)})`,
      "select",
    );
    await evaluate(
      `(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`,
    );
    await wait(250);
  };
  const skipReaction = async () => {
    await evaluate(
      `Array.from(document.querySelectorAll('button')).find(e=>e.textContent.includes('SKIP REACTION'))?.click()`,
    );
    await wait(150);
  };
  const scene = async (name) =>
    until(
      `document.querySelector('[data-deadlock]')?.dataset.scene==='${name}'`,
      "scene " + name,
    );

 await navigate('/app');await click('Try without an account');await click('Skip setup');await navigate('/app/projects/deadlock');await click('Captions only');await click('Enter the lab');await scene('intro');await evaluate("localStorage.setItem('pmforge.deadlock.settings.v1',JSON.stringify({mode:'silent',skipGuides:true}))");const id=await evaluate('location.pathname.split("/").at(-1)');const owner=await evaluate(`new Promise(resolve=>{const q=indexedDB.open('pmforge-deadlock-v1');q.onsuccess=()=>{const db=q.result,get=db.transaction('runs','readonly').objectStore('runs').get(${JSON.stringify(id)});get.onsuccess=()=>{resolve(get.result.ownerId);db.close();}}})`);const fixture=JSON.parse(readFileSync(join(process.cwd(),'docs','deadlock-verification','fixtures.json'),'utf8')).ending;fixture.ownerId=owner;await evaluate(`new Promise(resolve=>{const q=indexedDB.open('pmforge-deadlock-v1');q.onsuccess=()=>{const db=q.result,tx=db.transaction('runs','readwrite');tx.objectStore('runs').put(${JSON.stringify(fixture)});tx.oncomplete=()=>{db.close();resolve(true)}}})`);
 report.performance=[];for(const config of [{width:1440,cpu:1},{width:390,cpu:4}]){await send('Emulation.setDeviceMetricsOverride',{width:config.width,height:900,deviceScaleFactor:1,mobile:config.width<768});await send('Emulation.setCPUThrottlingRate',{rate:config.cpu});await navigate('/app/projects/deadlock/play/'+fixture.id);await scene('ending');const sample=await evaluate(`(async()=>{const tasks=[],frames=[];const observer=new PerformanceObserver(l=>tasks.push(...l.getEntries().map(e=>e.duration)));observer.observe({type:'longtask'});const start=performance.now();let last=start;await new Promise(resolve=>{const frame=now=>{frames.push(now-last);last=now;if(now-start<1600)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame)});observer.disconnect();frames.shift();frames.sort((a,b)=>a-b);return {p95Ms:frames[Math.floor(frames.length*.95)],longTasks:tasks,heapMB:performance.memory.usedJSHeapSize/1048576,tier:document.querySelector('[data-deadlock]').dataset.tier};})()`);report.performance.push({...config,...sample});}
 console.log(JSON.stringify(report,null,2));
}catch(error){report.failure=String(error.stack||error);console.error(report.failure);process.exitCode=1;}finally{writeFileSync(join(out,'performance.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();}
