import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { projects } from "../src/lib/projects/content";
import {
  createProjectRun,
  validProjectTrail,
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
    "--remote-debugging-port=9255",
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "pmf-project-ux-"))}`,
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
        target = await fetch("http://127.0.0.1:9255/json/new?about:blank", {
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
      await evaluate(`(()=>{const el=${el};el.focus();el.click()})()`);
      await wait(300);
    };
    const nav = async (path: string) => {
      await send("Page.navigate", { url: url + path });
      await wait(250);
    };
    const shot = async (name: string) => {
      const r = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });
      writeFileSync(join(out, `ux-${name}.png`), Buffer.from(r.data, "base64"));
    };
    const readRun = async (id: string) =>
      evaluate(
        `(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('pmforge-workspace-v1');r.onsuccess=()=>resolve(r.result)});const run=await new Promise(resolve=>{const r=db.transaction('projectRuns').objectStore('projectRuns').get('${id}');r.onsuccess=()=>resolve(r.result)});db.close();return run})()`,
      );
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await nav("/app/projects");
    await click("Try without an account");
    await click("Skip setup");
    await until("document.querySelectorAll('article').length===12");
    const owner = await evaluate(
      "localStorage.getItem('pmforge.product.identity')",
    );
    await nav("/app/projects/sacred-no");
    await click("Enter project");
    await until(
      "!!document.querySelector('[aria-label=\"Project decision choices\"]')",
    );
    const id = await evaluate("location.pathname.split('/').at(-1)");
    const lockButton = `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Review & lock decision'))`;
    check(
      await evaluate(`${lockButton}.disabled`),
      "lock is initially disabled with an explicit readiness explanation",
    );
    await evaluate(
      "document.querySelector('[aria-label=\"Project decision choices\"] button').click()",
    );
    await until(
      "!!document.querySelector('[aria-label=\"Project decision choices\"] button[aria-pressed=true]')",
    );
    check(
      await evaluate(
        `${lockButton}.disabled && document.getElementById('project-lock-requirements').textContent.includes('evidence')`,
      ),
      "selecting a direction alone cannot bypass evidence readiness",
    );
    await evaluate("document.querySelector('details summary').click()");
    await until(`!${lockButton}.disabled`);
    await evaluate(
      `(()=>{const field=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(field,'Reasoning before an intentional storage-failure fixture.');field.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
    check(
      await evaluate(
        "document.querySelector('[role=status]').textContent.includes('Unsaved changes')",
      ),
      "pending draft is not labelled saved",
    );
    await until(
      "document.querySelector('[role=status]').textContent.includes('Saved')",
    );
    await click("Review & lock decision");
    await evaluate(
      `(()=>{window.__originalProjectPut=IDBObjectStore.prototype.put;window.__failProjectWrites=true;IDBObjectStore.prototype.put=function(...args){if(this.name==='projectRuns'&&window.__failProjectWrites)throw new DOMException('Intentional quota failure fixture','QuotaExceededError');return window.__originalProjectPut.apply(this,args)}})()`,
    );
    await click("Lock decision & see consequence");
    await until("!!document.querySelector('[data-project-save-error]')");
    const failed = await readRun(id);
    check(
      failed.decisions.length === 0 &&
        failed.phase === "decision" &&
        !(await evaluate("!!document.querySelector('[data-world-reaction]')")),
      "failed decision persistence never advances the world or claims a locked consequence",
    );
    check(
      await evaluate(
        "document.activeElement.hasAttribute('data-project-save-error') && document.querySelector('[role=status]').textContent.includes('Not saved')",
      ),
      "save failure is announced and moves focus to visible recovery controls",
    );
    await shot("save-recovery");
    await evaluate(
      "window.__failProjectWrites=false;IDBObjectStore.prototype.put=window.__originalProjectPut",
    );
    await click("Retry save");
    await until("!document.querySelector('[data-project-save-error]')");
    await click("Review & lock decision");
    await evaluate(
      `(()=>{const button=Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Lock decision & see consequence'));button.focus();button.click();Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;})()`,
    );
    await until("!!document.querySelector('[data-world-reaction]')");
    await wait(350);
    check(
      !(await evaluate(
        "!!document.querySelector('[data-project-save-error]')",
      )),
      "background flush during a lock does not enqueue an obsolete decision snapshot",
    );
    check(
      (await readRun(id)).decisions.length === 1,
      "retry then explicit confirmation locks exactly one decision",
    );
    check(
      await evaluate(
        "document.activeElement.hasAttribute('data-project-heading') && document.activeElement.getBoundingClientRect().top>=document.querySelector('header').getBoundingClientRect().bottom",
      ),
      "successful consequence receives keyboard focus clear of the header",
    );
    await click("Continue to chapter 2");
    await until(
      "document.body.innerText.includes('Stakeholder Squeeze')&&!!document.querySelector('[aria-label=\"Project decision choices\"]')",
    );
    check(
      await evaluate(
        "document.querySelector('[aria-label=\"Campaign chapters\"] [aria-current=step]').getAttribute('aria-label').includes('chapter 2')",
      ),
      "chapter tracker identifies the current chapter",
    );
    await evaluate(
      "document.querySelector('[aria-label^=\"Review chapter 1\"]').focus();document.querySelector('[aria-label^=\"Review chapter 1\"]').click()",
    );
    await until("!!document.querySelector('[role=dialog]')");
    check(
      await evaluate(
        "document.querySelector('[role=dialog]').textContent.includes('Your chapter 1 commitment') && !document.querySelector('[role=dialog] textarea')",
      ),
      "completed chapter opens a read-only commitment review",
    );
    await send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Escape",
      code: "Escape",
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Escape",
      code: "Escape",
    });
    await until("!document.querySelector('[role=dialog]')");
    check(
      await evaluate(
        "document.activeElement.getAttribute('aria-label')?.startsWith('Review chapter 1')",
      ),
      "closing review restores keyboard focus to its chapter control",
    );
    await shot("desktop-chapter-tracker");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await evaluate("scrollTo({top:0,behavior:'instant'})");
    await wait(400);
    check(
      await evaluate(
        "document.querySelector('[aria-controls=\"project-state-meters\"]').getAttribute('aria-expanded')==='false'&&document.getElementById('project-state-meters').getBoundingClientRect().height===0",
      ),
      "mobile begins with a compact operating-state summary",
    );
    check(
      await evaluate(
        "document.querySelector('[data-project-heading]').getBoundingClientRect().top<innerHeight",
      ),
      "mobile brief is visible without traversing five expanded meters",
    );
    await shot("mobile-compact");
    await click("Operating state");
    check(
      await evaluate(
        "document.querySelector('[aria-controls=\"project-state-meters\"]').getAttribute('aria-expanded')==='true' && [...document.querySelectorAll('[role=meter]')].every(e=>e.getBoundingClientRect().height>0)",
      ),
      "mobile operating-state disclosure reveals every meter",
    );
    await click("Operating state");
    const fixtures = projects.map((p) => {
      const run = createProjectRun(p, owner);
      run.phase = "decision";
      run.entranceSeen = true;
      return run;
    });
    await evaluate(
      `(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('pmforge-workspace-v1');r.onsuccess=()=>resolve(r.result)});await new Promise(resolve=>{const tx=db.transaction('projectRuns','readwrite');for(const run of ${JSON.stringify(fixtures)})tx.objectStore('projectRuns').put(run);tx.oncomplete=resolve});db.close()})()`,
    );
    if (process.env.PROJECT_UX_SMOKE) {
      let deadlock = fixtures.find((run) => run.projectId === "deadlock")!;
      deadlock.draft = {
        choiceId: "c1-b",
        rationale: "",
        evidence: ["0"],
        ranking: [],
      };
      deadlock = nextProjectChapter(lockProjectDecision(deadlock));
      await evaluate(
        `(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('pmforge-workspace-v1');r.onsuccess=()=>resolve(r.result)});await new Promise(resolve=>{const tx=db.transaction('projectRuns','readwrite');tx.objectStore('projectRuns').put(${JSON.stringify(deadlock)});tx.oncomplete=resolve});db.close()})()`,
      );
      await nav(`/app/projects/deadlock/run/${deadlock.id}`);
      await until("!!document.querySelector('[data-stakeholder]')");
      check(
        await evaluate(
          "[...document.querySelectorAll('[data-stakeholder]')].find(e=>e.textContent.includes('Software resentment')).querySelector('small').textContent.includes('Guarded')",
        ),
        "high resentment renders as guarded capacity in the live stakeholder panel",
      );
      check(
        validProjectTrail(deadlock),
        "stakeholder smoke fixture retains canonical authored state",
      );
      check(
        report.errors.length === 0,
        "final build smoke has no runtime exceptions",
        report.errors,
      );
      console.log(JSON.stringify(report, null, 2));
      return;
    }
    for (const width of [1440, 390, 320]) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: width === 1440 ? 1000 : 844,
        deviceScaleFactor: 1,
        mobile: width < 700,
      });
      for (const run of fixtures) {
        await nav(`/app/projects/${run.projectId}/run/${run.id}`);
        await until(
          "!!document.querySelector('[aria-label=\"Campaign chapters\"]')&&!!document.querySelector('[data-project-heading]')",
        );
        const result = await evaluate(
          "({overflow:document.documentElement.scrollWidth>innerWidth,tracker:document.querySelectorAll('[aria-label=\"Campaign chapters\"]>div').length,smallTargets:[...document.querySelectorAll('[aria-label=\"Campaign chapters\"] button')].some(b=>b.getBoundingClientRect().height<44),headingFocused:document.activeElement.hasAttribute('data-project-heading')})",
        );
        check(
          !result.overflow && result.tracker === 3 && !result.smallTargets,
          `${run.projectId} at ${width}px: chapter navigation and responsive decision surface`,
          result,
        );
      }
    }
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
    writeFileSync(
      join(out, process.env.PROJECT_UX_SMOKE ? "ux-smoke.json" : "ux.json"),
      JSON.stringify(report, null, 2),
    );
    ws!?.close();
    chrome.kill();
  }
}
void main();
