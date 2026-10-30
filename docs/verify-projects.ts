import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { projects } from "../src/lib/projects/content";
import { validProjectTrail } from "../src/lib/projects/engine";
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
    "--remote-debugging-port=9252",
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "pmf-projects-"))}`,
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
        target = await fetch("http://127.0.0.1:9252/json/new?about:blank", {
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
    const click = async (text: string) => {
      const selector = `Array.from(document.querySelectorAll('button,a')).find(e=>e.textContent.trim().includes(${JSON.stringify(text)})&&!e.disabled)`;
      await until(`!!(${selector})`);
      await evaluate(`(${selector}).click()`);
      await wait(250);
    };
    const navigate = async (path: string) => {
      await send("Page.navigate", { url: url + path });
      await wait(350);
    };
    const shot = async (name: string) => {
      const r = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });
      writeFileSync(join(out, name + ".png"), Buffer.from(r.data, "base64"));
    };
    const check = (ok: unknown, label: string, details?: unknown) => {
      report.checks.push({ label, pass: !!ok, details });
      if (!ok) throw Error(label);
    };
    const readRun = async (id: string) =>
      evaluate(
        `(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('pmforge-workspace-v1');r.onsuccess=()=>resolve(r.result)});const run=await new Promise(resolve=>{const r=db.transaction('projectRuns').objectStore('projectRuns').get('${id}');r.onsuccess=()=>resolve(r.result)});db.close();return run})()`,
      );
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 960,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await navigate("/app/projects");
    await click("Try without an account");
    await click("Skip setup");
    await until(
      `location.pathname==='/app/projects'&&document.querySelectorAll('article').length===12`,
    );
    check(true, "guest entry reaches all twelve project cards");
    await shot("gallery-desktop");
    await click("Crisis");
    check(
      await evaluate("document.querySelectorAll('article').length===3"),
      "gallery crisis filter matches three campaigns",
    );
    await click("All");
    const completed: any[] = [];
    for (const [index, p] of (process.env.PROJECT_SMOKE
      ? projects.slice(0, 1)
      : projects
    ).entries()) {
      await navigate(`/app/projects/${p.id}`);
      await click("Enter project");
      await until(
        `location.pathname.includes('/run/')&&!!document.querySelector('[aria-label="Entering ${p.title}"]')`,
      );
      const id = await evaluate("location.pathname.split('/').at(-1)");
      if (index === 0) {
        check(
          !(await evaluate(
            `Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('Skip entrance'))`,
          )),
          "entrance does not expose skip immediately",
        );
        await shot("entrance-sacred-no");
      }
      await click("Skip entrance");
      await until(
        `!!document.querySelector('[aria-label="Project decision choices"]')`,
      );
      if (index === 0) {
        await navigate(`/app/projects/${p.id}/run/${id}`);
        await until(
          `!!document.querySelector('[aria-label="Project decision choices"]')`,
        );
        check(
          !(await evaluate(
            `!!document.querySelector('[aria-label="Entering ${p.title}"]')`,
          )),
          "entrance is not replayed after saved reload",
        );
      }
      for (let chapter = 1; chapter <= 3; chapter++) {
        await until(
          `document.body.innerText.includes('Chapter ${chapter} of 3')`,
        );
        await evaluate("document.querySelector('details summary').click()");
        await wait(180);
        if (p.chapters[chapter - 1].pattern === "rank")
          await click("Use this evidence order");
        await evaluate(
          `document.querySelector('[aria-label="Project decision choices"] button').click()`,
        );
        await wait(250);
        if (index === 0 && chapter === 1) {
          await evaluate(
            `(()=>{const t=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(t,'<img src=x onerror="window.__projectXss=true"> A bounded rationale.');t.dispatchEvent(new Event('input',{bubbles:true}));})()`,
          );
          await wait(450);
          check(
            !(await readRun(id)).includeNotes,
            "free-form rationale is not opted into sync by default",
          );
          await shot("sacred-no-decision");
        }
        await click("Review & lock decision");
        await until("!!document.querySelector('[role=dialog]')");
        await click("Lock decision & see consequence");
        await until("!!document.querySelector('[data-world-reaction]')");
        if (index === 0 && chapter === 1) {
          const state = (await readRun(id)).state;
          await click("Pause");
          await navigate(`/app/projects/${p.id}/run/${id}`);
          await until(
            "document.body.innerText.includes('Your commitments are held')",
          );
          check(
            JSON.stringify((await readRun(id)).state) === JSON.stringify(state),
            "pause and reload freeze exact chapter state",
          );
          await click("Resume");
          await until("!!document.querySelector('[data-world-reaction]')");
        }
        if (index === 0 && chapter === 3) await shot("sacred-no-fracture");
        await click(
          chapter === 3
            ? "Open the debrief laboratory"
            : `Continue to chapter ${chapter + 1}`,
        );
      }
      await until("document.body.innerText.includes('the room you left')");
      const saved = await readRun(id);
      completed.push(saved);
      check(
        validProjectTrail(saved) && saved.decisions.length === 3,
        `${p.title}: three browser-locked chapters match authored state rules`,
      );
      check(
        !(await evaluate("window.__projectXss")),
        `${p.title}: rationale stays inert`,
      );
      if (index === 0) {
        await shot("sacred-no-debrief");
        check(
          saved.decisions[2].reaction.includes("fails during the demo"),
          "earlier Sacred No promise creates the authored board-demo fracture",
        );
        await click("Replay from chapter 2");
        await until(
          `location.pathname.includes('/run/')&&!location.pathname.includes('${id}')&&!!document.querySelector('[aria-label="Project decision choices"]')`,
        );
        const forkId = await evaluate("location.pathname.split('/').at(-1)"),
          fork = await readRun(forkId);
        check(
          fork.parentRunId === id &&
            fork.chapter === 2 &&
            JSON.stringify(fork.state) ===
              JSON.stringify(saved.decisions[0].after) &&
            fork.draft.choiceId !== saved.decisions[1].choiceId,
          "chapter replay preserves prefix state and preselects a real alternative",
        );
        check(
          JSON.stringify((await readRun(id)).decisions) ===
            JSON.stringify(saved.decisions),
          "replay leaves original decision log unchanged",
        );
        await shot("alternate-timeline");
      }
    }
    if (process.env.PROJECT_SMOKE) {
      await navigate(`/app/projects/debrief/${completed[0].id}`);
      await until("document.body.innerText.includes('the room you left')");
      await click("Save this decision point");
      await until("document.body.innerText.includes('Decision point saved.')");
      check(true, "bookmark save gives visible confirmation");
      await click("Train ai-technical reasoning");
      await until(
        "location.pathname==='/app/practice'&&location.search.includes('category=ai-technical')",
      );
      check(
        true,
        "debrief links to practice for the exposed operating tradeoff",
      );
      const identity = await evaluate(
        "localStorage.getItem('pmforge.product.identity')",
      );
      const foreign = {
        ...completed[0],
        id: "foreign-fixture-campaign",
        ownerId: "guest-import-fixture",
      };
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        profile: {
          id: "guest-import-fixture",
          name: "",
          role: "test",
          level: "easy",
          timeline: "test",
          identity: "guest",
          onboardingComplete: true,
          updatedAt: new Date().toISOString(),
        },
        runs: [],
        records: [],
        bookmarks: [],
        projectRuns: [foreign],
      };
      const filePath = join(
        mkdtempSync(join(tmpdir(), "pmf-project-import-")),
        "backup.json",
      );
      writeFileSync(filePath, JSON.stringify(payload));
      await navigate("/app/settings");
      await until("!!document.querySelector('input[type=file]')");
      const dom = await send("DOM.getDocument");
      const input = await send("DOM.querySelector", {
        nodeId: dom.root.nodeId,
        selector: "input[type=file]",
      });
      await send("DOM.setFileInputFiles", {
        nodeId: input.nodeId,
        files: [filePath],
      });
      await until("document.body.innerText.includes('1 project campaigns')");
      await click("Import backup");
      await until("document.body.innerText.includes('Backup imported')");
      const imported = await evaluate(
        `(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('pmforge-workspace-v1');r.onsuccess=()=>resolve(r.result)});const rows=await new Promise(resolve=>{const r=db.transaction('projectRuns').objectStore('projectRuns').getAll();r.onsuccess=()=>resolve(r.result)});db.close();return rows.filter(r=>r.id.startsWith('m-'))})()`,
      );
      check(
        imported.length === 1 &&
          imported[0].ownerId === identity &&
          validProjectTrail(imported[0]),
        "consented backup import scopes and validates a foreign project campaign without overwriting original",
      );
      const response = await fetch(url + "/projects"),
        html = await response.text();
      check(
        response.status === 200 &&
          (html.match(/<article/g) || []).length === 12,
        "public gallery renders twelve campaigns without JavaScript",
      );
      check(
        report.errors.length === 0,
        "final build smoke has no runtime exceptions",
        report.errors,
      );
      console.log(JSON.stringify(report, null, 2));
      return;
    }
    await navigate("/app/history?type=project");
    await until("document.body.innerText.includes('Project campaigns')");
    check(
      await evaluate(
        "document.body.innerText.includes('12 completed campaigns')",
      ),
      "history project filter includes all twelve completions",
    );
    await shot("project-history");
    await navigate("/app/progress");
    await until(
      "document.body.innerText.includes('Your project constellation')",
    );
    check(
      await evaluate(
        "document.body.innerText.includes('12/12 worlds explored')",
      ),
      "progress constellation includes twelve completed worlds",
    );
    await navigate(`/app/projects/debrief/${completed[0].id}`);
    await until("document.body.innerText.includes('the room you left')");
    await click("Save this decision point");
    await navigate("/app/practice?view=saved&savedTab=projects");
    await until(
      "document.body.innerText.includes('Saved project decision points')",
    );
    check(
      await evaluate("document.body.innerText.includes('Chapter 1')"),
      "bookmarks include a campaign decision point",
    );
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await navigate("/app/projects");
    await until("document.querySelectorAll('article').length===12");
    check(
      await evaluate("document.documentElement.scrollWidth<=innerWidth"),
      "mobile gallery has no horizontal overflow",
    );
    await shot("gallery-mobile");
    const run = completed[2];
    await navigate(`/app/projects/${run.projectId}/run/${run.id}`);
    await until("document.body.innerText.includes('the room you left')");
    await click("Replay from chapter 2");
    await until(
      "!!document.querySelector('[aria-label=\"Project decision choices\"]')",
    );
    check(
      await evaluate("document.documentElement.scrollWidth<=innerWidth"),
      "mobile rank decision surface has no horizontal overflow",
    );
    await shot("mobile-feature-factory");
    await send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await navigate("/app/projects/last-mile");
    await click("Enter project");
    await until(
      "!!document.querySelector('[aria-label=\"Project decision choices\"]')",
    );
    check(
      !(await evaluate(
        "!!document.querySelector('[aria-label^=\"Entering\"]')",
      )),
      "reduced-motion entrance settles without a forced sequence",
    );
    const activeId = await evaluate("location.pathname.split('/').at(-1)");
    await evaluate(
      `(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('pmforge-workspace-v1');r.onsuccess=()=>resolve(r.result)});await new Promise(resolve=>{const tx=db.transaction('projectRuns','readwrite'),store=tx.objectStore('projectRuns'),r=store.get('${activeId}');r.onsuccess=()=>store.put({...r.result,revision:r.result.revision+1});tx.oncomplete=resolve});db.close();document.querySelector('[aria-label="Project decision choices"] button').click()})()`,
    );
    await until("document.body.innerText.includes('changed in another tab')");
    check(true, "competing-tab revision produces an explicit save conflict");
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
      join(out, process.env.PROJECT_SMOKE ? "smoke.json" : "results.json"),
      JSON.stringify(report, null, 2),
    );
    ws!?.close();
    chrome.kill();
  }
}
void main();
