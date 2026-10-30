import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CATEGORIES, questions } from "../src/lib/product/content";
import { createRun } from "../src/lib/product/engine";
const out = join(process.cwd(), "docs", "product-verification");
mkdirSync(out, { recursive: true });
const report: { checks: unknown[]; errors: string[]; failure?: string } = {
  checks: [],
  errors: [],
};
const chrome = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    "--headless=new",
    "--remote-debugging-port=9251",
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "pmf-benches-"))}`,
    "--no-first-run",
    "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true },
);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let ws: WebSocket;
async function main() {
  try {
    let target;
    for (let i = 0; i < 50; i++) {
      try {
        target = await fetch("http://127.0.0.1:9251/json/new?about:blank", {
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
    const pending = new Map<
      number,
      { resolve: (data: any) => void; reject: (error: Error) => void }
    >();
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const p = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) p?.reject(Error(JSON.stringify(message.error)));
        else p?.resolve(message.result);
      }
      if (message.method === "Runtime.exceptionThrown")
        report.errors.push(
          message.params.exceptionDetails.exception?.description ||
            message.params.exceptionDetails.text,
        );
    };
    const send = (method: string, params = {}) =>
      new Promise<any>((resolve, reject) => {
        const id = ++seq;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    const evaluate = async (expression: string) => {
      const result = await send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (result.exceptionDetails)
        throw Error(result.exceptionDetails.exception?.description || "eval");
      return result.result.value;
    };
    const until = async (expression: string) => {
      for (let i = 0; i < 120; i++) {
        if (await evaluate(expression)) return;
        await wait(200);
      }
      throw Error(
        "Timeout " +
          expression +
          " / " +
          (await evaluate("document.body.innerText.slice(-900)")),
      );
    };
    const url = process.env.PRODUCT_URL || "http://localhost:3000";
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 960,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: url + "/app" });
    await until(
      `Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('Try without'))`,
    );
    await evaluate(
      `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Try without')).click()`,
    );
    await until(
      `Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('Skip setup'))`,
    );
    await evaluate(
      `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Skip setup')).click()`,
    );
    await until(
      `location.pathname==='/app' && !!localStorage.getItem('pmforge.product.identity')`,
    );
    const owner = await evaluate(
      `localStorage.getItem('pmforge.product.identity')`,
    );
    const prepared = questions
      .filter((q) => q.level === "easy" && q.id.endsWith("-1"))
      .map((q) => {
        const run = createRun(q, owner);
        run.stage = "workbench";
        run.objectivePinned = true;
        run.locked = ["primer", "fundamentals", "clarify"];
        return run;
      });
    await evaluate(
      `(async()=>{const data=${JSON.stringify(prepared)};const database=await new Promise((resolve,reject)=>{const r=indexedDB.open('pmforge-workspace-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});await new Promise((resolve,reject)=>{const t=database.transaction('runs','readwrite');for(const run of data)t.objectStore('runs').put(run);t.oncomplete=resolve;t.onerror=()=>reject(t.error)});database.close()})()`,
    );
    for (const category of CATEGORIES) {
      const run = prepared.find(
        (run) =>
          questions.find((q) => q.id === run.questionId)!.category ===
          category.id,
      )!;
      await send("Page.navigate", { url: url + `/app/run/${run.id}` });
      await until(`!!document.querySelector('[data-stage-content]')`);
      await wait(600);
      if (category.id === "estimation")
        await evaluate(
          `(()=>{const input=document.querySelector('input[type=number]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'70');input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
        );
      if (category.id === "ai-technical")
        await evaluate(
          `document.querySelector('[class*="architecture"] button')?.click()`,
        );
      if (category.id === "root-cause")
        await evaluate(
          `(()=>{const select=document.querySelector('main select');select.value='target';select.dispatchEvent(new Event('change',{bubbles:true}));})()`,
        );
      if (category.id === "strategy")
        await evaluate(
          `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('One evidence-backed segment'))?.click()`,
        );
      if (category.id === "product-sense")
        await evaluate(
          `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Set this path aside'))?.click()`,
        );
      await wait(500);
      const image = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(
        join(out, `workbench-${category.id}.png`),
        Buffer.from(image.data, "base64"),
      );
      report.checks.push({
        category: category.id,
        overflow: await evaluate(
          "document.documentElement.scrollWidth>innerWidth",
        ),
        controls: await evaluate(
          "document.querySelectorAll('main button, main input, main select, main textarea').length",
        ),
      });
    }
    const q = prepared.find((run) => run.questionId === "EST-E-1")!;
    const story = prepared.find((run) => run.questionId === "BEH-E-1")!;
    await send("Page.navigate", { url: url + `/app/run/${story.id}` });
    await until(`!!document.querySelector('main textarea')`);
    await evaluate(
      `(()=>{const input=document.querySelector('main textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,'Pending draft saved while navigating away.');input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('header a').click();})()`,
    );
    await until(`location.pathname==='/app'`);
    await wait(500);
    const savedDraft = await evaluate(
      `(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('pmforge-workspace-v1');r.onsuccess=()=>resolve(r.result)});const run=await new Promise(resolve=>{const r=db.transaction('runs').objectStore('runs').get('${story.id}');r.onsuccess=()=>resolve(r.result)});db.close();return run.story.stakes})()`,
    );
    if (savedDraft !== "Pending draft saved while navigating away.")
      throw Error("Navigation discarded a pending draft");
    report.checks.push({
      edge: "pending draft persists on SPA navigation",
      pass: true,
    });
    await send("Emulation.setDeviceMetricsOverride", {
      width: 320,
      height: 740,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: url + `/app/run/${q.id}` });
    await until(`!!document.querySelector('[data-stage-content]')`);
    await wait(500);
    const image = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(
      join(out, "mobile-estimation-320.png"),
      Buffer.from(image.data, "base64"),
    );
    report.checks.push({
      viewport: 320,
      overflow: await evaluate(
        "document.documentElement.scrollWidth>innerWidth",
      ),
    });
    await evaluate(
      `(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('pmforge-workspace-v1');r.onsuccess=()=>resolve(r.result)});await new Promise(resolve=>{const tx=db.transaction('runs','readwrite');const store=tx.objectStore('runs');const r=store.get('${q.id}');r.onsuccess=()=>store.put({...r.result,revision:r.result.revision+1});tx.oncomplete=resolve});db.close();document.querySelector('input[type="checkbox"]').click()})()`,
    );
    await until(`document.body.innerText.includes('changed in another tab')`);
    report.checks.push({
      edge: "external revision conflict is detected",
      pass: true,
    });
    if (
      report.checks.some((check: any) => check.overflow) ||
      report.errors.length
    )
      throw Error("Overflow or runtime errors");
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    report.failure = String(error);
    console.error(report.failure);
    process.exitCode = 1;
  } finally {
    writeFileSync(
      join(out, "workbenches.json"),
      JSON.stringify(report, null, 2),
    );
    ws!?.close();
    chrome.kill();
  }
}
void main();
