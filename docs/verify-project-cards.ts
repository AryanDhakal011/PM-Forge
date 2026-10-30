import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { projects } from "../src/lib/projects/content";
import {
  createProjectRun,
  lockProjectDecision,
  nextProjectChapter,
} from "../src/lib/projects/engine";
const out = join(process.cwd(), "docs", "project-verification");
mkdirSync(out, { recursive: true });
const report: { checks: unknown[]; errors: string[]; failure?: string } = {
  checks: [],
  errors: [],
};
const chrome = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    "--headless=new",
    "--remote-debugging-port=9254",
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "pmf-cards-"))}`,
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
        target = await fetch("http://127.0.0.1:9254/json/new?about:blank", {
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
    const url = process.env.PRODUCT_URL || "http://localhost:3001";
    const check = (ok: unknown, label: string, details?: unknown) => {
      report.checks.push({ label, pass: !!ok, details });
      if (!ok) throw Error(label);
    };
    const click = async (text: string) => {
      const el = `Array.from(document.querySelectorAll('button,a')).find(e=>e.textContent.trim().includes(${JSON.stringify(text)})&&!e.disabled)`;
      await until(`!!(${el})`);
      await evaluate(`(${el}).click()`);
      await wait(350);
    };
    const nav = async (path: string) => {
      await send("Page.navigate", { url: url + path });
      await wait(200);
    };
    const shot = async (name: string) => {
      const r = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });
      writeFileSync(
        join(out, `cards-${name}.png`),
        Buffer.from(r.data, "base64"),
      );
    };
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await nav("/app/projects");
    await click("Try without an account");
    await click("Skip setup");
    await until(
      "location.pathname==='/app/projects'&&document.querySelectorAll('article').length===12",
    );
    const owner = await evaluate(
      "localStorage.getItem('pmforge.product.identity')",
    );
    for (const width of [1440, 390, 320]) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: width === 1440 ? 1000 : 844,
        deviceScaleFactor: 1,
        mobile: width < 700,
      });
      for (const p of projects) {
        await nav(`/app/projects/${p.id}`);
        await until(`!!document.querySelector('h1[aria-label="${p.title}"]')`);
        await wait(650);
        const state = await evaluate(
          `(()=>{const h=document.querySelector('h1[aria-label]'),surface=h.closest('section'),r=surface.getBoundingClientRect(),cards=[...document.querySelectorAll('[data-status]')],btn=Array.from(surface.querySelectorAll('button')).find(b=>b.textContent.includes('Enter project'));const luminance=c=>{const rgb=c.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};const a=luminance(getComputedStyle(btn).backgroundColor),b=luminance(getComputedStyle(btn).color);return {overflow:document.documentElement.scrollWidth>innerWidth,titleFits:[...h.children].filter(e=>e.tagName==='SPAN').every(e=>e.getBoundingClientRect().right<=r.right-12),titleLines:h.querySelectorAll(':scope > span').length,status:cards.map(c=>c.dataset.status),lockedLinks:cards.filter(c=>c.dataset.status==='locked').reduce((n,c)=>n+c.querySelectorAll('a').length,0),uniqueTeasers:new Set(cards.filter(c=>c.dataset.status==='locked').map(c=>c.querySelector('p').textContent)).size,detailsClosed:!surface.querySelector('details').open,technicalHidden:!surface.innerText.includes('8.5 seconds'),buttonContrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),surfaceBackground:getComputedStyle(surface).backgroundImage,settingWidth:surface.querySelector('p').getBoundingClientRect().width}})()`,
        );
        check(
          !state.overflow &&
            state.titleFits &&
            state.titleLines === 2 &&
            state.status.join(",") === "available,locked,locked" &&
            state.lockedLinks === 0 &&
            state.uniqueTeasers === 2 &&
            state.detailsClosed &&
            state.technicalHidden &&
            state.buttonContrast >= 4.5,
          `${p.title} at ${width}px: hierarchy, two-line title, locked cards, disclosure and contrast`,
          state,
        );
        if (["legacy-fracture", "last-mile"].includes(p.id) && width !== 320)
          await shot(`${p.id}-${width}`);
      }
    }
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await nav("/app/projects/last-mile");
    await until("!!document.querySelector('[data-status]')");
    await evaluate("document.querySelector('main details summary').click()");
    check(
      await evaluate(
        "document.querySelector('main details').open && document.querySelector('main details').innerText.includes('8.5 seconds')",
      ),
      "mechanics disclosure opens with complete timing information",
    );
    await click("Save project");
    check(
      await evaluate(
        "Array.from(document.querySelectorAll('button')).some(b=>b.getAttribute('aria-pressed')==='true'&&b.textContent.includes('Saved'))",
      ),
      "save action retains its persistent pressed state",
    );
    const legacy = projects.find((p) => p.id === "legacy-fracture")!,
      last = projects.find((p) => p.id === "last-mile")!;
    let active = createProjectRun(legacy, owner);
    active.phase = "decision";
    active.entranceSeen = true;
    active.draft = {
      choiceId: "c1-a",
      rationale: "",
      evidence: ["0"],
      ranking: [],
    };
    active = nextProjectChapter(lockProjectDecision(active));
    let done = createProjectRun(last, owner);
    done.phase = "decision";
    done.entranceSeen = true;
    for (let c = 0; c < 3; c++) {
      done.draft = {
        choiceId: last.chapters[c].choices[0].id,
        rationale: "",
        evidence: ["0"],
        ranking: ["0", "1", "2"],
      };
      done = nextProjectChapter(lockProjectDecision(done));
    }
    await evaluate(
      `(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('pmforge-workspace-v1');r.onsuccess=()=>resolve(r.result)});await new Promise(resolve=>{const tx=db.transaction('projectRuns','readwrite');for(const r of ${JSON.stringify([active, done])})tx.objectStore('projectRuns').put(r);tx.oncomplete=resolve});db.close()})()`,
    );
    await nav("/app/projects/legacy-fracture");
    await until("document.querySelector('[data-status=completed]')!==null");
    check(
      await evaluate(
        "Array.from(document.querySelectorAll('[data-status]')).map(e=>e.dataset.status).join(',')==='completed,available,locked' && document.querySelector('[data-status=completed] a').textContent.includes('Review')",
      ),
      "active campaign shows Completed, Available, Locked with a review action",
    );
    await shot("legacy-progress");
    await click("Resume chapter 2");
    await until(
      `location.pathname.endsWith('${active.id}')&&document.body.innerText.includes('Coalition War')`,
    );
    check(true, "resume action still enters the exact saved chapter");
    await nav("/app/projects/last-mile");
    await until(
      "document.querySelectorAll('[data-status=completed]').length===3",
    );
    check(
      await evaluate(
        "document.querySelectorAll('[data-status=completed] a').length===3 && document.body.innerText.includes('3 of 3 completed')",
      ),
      "completed campaign shows three reviewable completed chapters",
    );
    await shot("last-mile-completed");
    check(
      report.errors.length === 0,
      "no browser runtime exceptions",
      report.errors,
    );
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    report.failure = String(error);
    console.error(report.failure);
    process.exitCode = 1;
  } finally {
    writeFileSync(join(out, "cards.json"), JSON.stringify(report, null, 2));
    ws!?.close();
    chrome.kill();
  }
}
void main();
