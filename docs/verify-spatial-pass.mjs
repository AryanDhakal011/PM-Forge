import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const out = join(process.cwd(), "docs", "spatial-verification");
mkdirSync(out, { recursive: true });
const browser = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    "--headless=new",
    "--remote-debugging-port=9260",
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
      target = await fetch("http://127.0.0.1:9260/json/new?about:blank", {
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

  const before = process.env.SPATIAL_BEFORE === "1";
  report.mode = before ? "before" : "after";
  report.layouts = [];
  await navigate("/app");
  await click("Try without an account");
  await click("Skip setup");
  await until(
    "location.pathname==='/app' && !!document.querySelector('main h1')",
    "guest workspace",
  );
  for (const width of process.env.SCROLL_ONLY === "1"
    ? []
    : before
      ? [1920, 1440, 390]
      : [1920, 1600, 1440, 1280, 1024, 768, 767, 390, 320]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    for (const [path, label] of [
      ["/app/practice", "practice"],
      ["/app/projects", "projects"],
      ["/app/portfolio/new", "record"],
    ]) {
      await navigate(path);
      await until(
        label === "record"
          ? "document.querySelectorAll('textarea').length===8"
          : `document.querySelectorAll('article').length===${label === "practice" ? 63 : 12}`,
        label,
      );
      await wait(400);
      const sample = await evaluate(
        `(()=>{const main=document.querySelector('main'),article=main.querySelector('article'),grid=article?.parentElement,r=main.getBoundingClientRect(),card=article?.getBoundingClientRect();const fields=main.querySelector('textarea')?.closest('form')?.querySelector('[class*=formGrid]');return {width:innerWidth,page:'${label}',main:{width:r.width,left:r.left},gridWidth:grid?.getBoundingClientRect().width,columns:fields?getComputedStyle(fields).gridTemplateColumns.split(' ').length:grid?getComputedStyle(grid).gridTemplateColumns.split(' ').length:0,cardHeight:card?.height,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,toolbarConnected:!!document.querySelector('section[aria-label="Filter scenarios"] button[aria-label="Sort scenarios"]')}})()`,
      );
      report.layouts.push(sample);
      check(
        !sample.overflow,
        label + " no horizontal overflow at " + width,
        sample,
      );
      if (!before) {
        if (label !== "record") {
          check(
            sample.columns === (width < 768 ? 1 : width < 1280 ? 2 : 3),
            label + " predictable 3/2/1 grid at " + width,
            sample,
          );
          check(
            sample.gridWidth <= 1321,
            label + " grid bounded to 1320px at " + width,
            sample,
          );
        } else
          check(
            sample.columns === (width < 768 ? 1 : 2),
            "decision canvas pairs stack at " + width,
            sample,
          );
        if (label === "practice")
          check(
            sample.toolbarConnected,
            "search, filters, count and sort form one toolbar at " + width,
          );
      }
      if ([1920, 1440, 390, 320].includes(width))
        await screenshot(report.mode + "-" + label + "-" + width);
    }
  }
  if (before) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await navigate("/app/projects");
    await until(
      "document.querySelectorAll('article').length===12",
      "mission gallery",
    );
    await evaluate(
      "document.querySelector('svg a[href=\"#project-silent-churn\"]').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))",
    );
    await wait(600);
    check(
      await evaluate(
        "document.getElementById('project-silent-churn').dataset.highlighted==='true'",
      ),
      "waypoint highlights its actual mission card",
    );
    await navigate("/app/portfolio/new");
    await until(
      "!!document.querySelector('input[name=title]')",
      "record canvas",
    );
    await evaluate(
      `(()=>{for(const [sel,value] of [['input[name=title]','Hold the rollout while checking the signal'],['textarea[name=decision]','Pause rollout expansion for one day and reconcile independent sign-up counts.'],['textarea[name=evidence]','Client events declined; independent server sign-ups remained flat.']]){const e=document.querySelector(sel),p=e.tagName==='INPUT'?HTMLInputElement.prototype:HTMLTextAreaElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));}})()`,
    );
    await click("Save decision record");
    await until(
      "document.querySelector('article h1')?.textContent.includes('Hold the rollout')",
      "saved record",
    );
    check(
      await evaluate(
        "document.body.innerText.includes('independent server sign-ups')",
      ),
      "denser canvas preserves record save and readback",
    );
    await navigate("/");
    await until(
      "document.documentElement.dataset.loaderDone==='true'",
      "landing loader",
    );
    await evaluate("document.fonts.ready");
    await wait(500);
    report.loader = await evaluate(
      "({done:document.documentElement.dataset.loaderDone,hero:document.documentElement.dataset.heroSceneReady,failed:document.documentElement.classList.contains('loader-failed'),unlocked:!document.querySelector('[inert]')&&!document.body.classList.contains('no-scroll'),overlayRemoved:!document.querySelector('[data-loader-overlay]')})",
    );
    check(
      report.loader.hero === "true" &&
        report.loader.done === "true" &&
        report.loader.unlocked &&
        report.loader.overlayRemoved,
      "loader finishes with a real hero frame or painted illustration before the scroll check",
      report.loader,
    );
    check(
      await evaluate(
        "Array.from(document.querySelectorAll('link[rel=preload][as=image]')).some(e=>e.href.includes('cozy-sunlit-workspace.webp'))",
      ),
      "first below-fold texture is preloaded",
    );
    await evaluate(
      "document.getElementById('interview').scrollIntoView({behavior:'instant',block:'start'})",
    );
    await wait(800);
    await click("Try the decision preview");
    await click("Did sign-ups fall");
    await click("Inspect the evidence");
    await evaluate(
      "document.querySelectorAll('#interview details')[0].open=true;document.querySelectorAll('#interview details')[1].open=true",
    );
    await until(
      "document.querySelector('#interview').textContent.includes('2 of 3 sources opened')",
      "opened evidence",
    );
    await click("Defend a call");
    await evaluate(
      "document.querySelector('[aria-label=\"Decision direction\"] button').click();document.querySelector('#interview input[type=checkbox]').click()",
    );
    await evaluate(
      `(()=>{const e=document.getElementById('interview-answer');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'A deliberately short personal note.');e.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
    await click("Review my recorded choices");
    const initial = await evaluate(
      "Array.from(document.querySelectorAll('[data-preview-check]')).map(e=>e.dataset.previewCheck)",
    );
    check(
      initial.length === 4 && initial.every((x) => x === "observed"),
      "preview cites four actual category checks rather than seven keyword scores",
      initial,
    );
    await click("Revise the call");
    await evaluate(
      `(()=>{const e=document.getElementById('interview-answer');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'segment metric user tradeoff guardrail framework impact '.repeat(20));e.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
    await click("Review my recorded choices");
    check(
      JSON.stringify(initial) ===
        JSON.stringify(
          await evaluate(
            "Array.from(document.querySelectorAll('[data-preview-check]')).map(e=>e.dataset.previewCheck)",
          ),
        ),
      "changing free text does not change feedback",
    );
    await evaluate(
      "document.querySelector('#interview input[type=radio]').click()",
    );
    await until(
      "document.body.innerText.includes('One useful lesson')",
      "reflection",
    );
    check(true, "self-grade releases the authored lesson");
    await screenshot("desktop-structured-preview");
    await click("Revise the call");
    await click("Say it aloud");
    await click("Start 90-second rehearsal");
    await wait(1300);
    check(
      await evaluate(
        "document.querySelector('#interview [class*=spoken]').textContent.includes('1:29') || document.querySelector('#interview [class*=spoken]').textContent.includes('1:28')",
      ),
      "spoken rehearsal has a real 90-second timer",
    );
    await click("Reset");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await navigate("/");
    await until(
      "document.documentElement.dataset.loaderDone==='true'",
      "4x CPU mobile loader",
    );
    await evaluate("document.fonts.ready");
    check(
      await evaluate(
        "document.querySelectorAll('#hero canvas').length===0 && document.querySelector('#hero [role=img]')!==null",
      ),
      "mobile hero keeps a poster composition without a live 3D desk",
    );
    check(
      await evaluate(
        "!document.documentElement.classList.contains('lenis') && document.querySelector('[data-loader-overlay]')===null",
      ),
      "mobile starts scrolling natively after the veil has been removed",
    );
    report.mobileScroll = await evaluate(
      `(async()=>{const tasks=[];const observer=new PerformanceObserver(list=>tasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration}))));observer.observe({type:'longtask'});const frames=[];let previous=performance.now();const start=previous;await new Promise(resolve=>{const tick=now=>{frames.push(now-previous);previous=now;if(now-start<1800)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);scrollTo({top:900,behavior:'smooth'});});observer.disconnect();const sorted=frames.slice(1).sort((a,b)=>a-b);return {cpuSlowdown:4,p95Ms:sorted[Math.floor(sorted.length*.95)],longTasks:tasks,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth};})()`,
    );
    check(
      !report.mobileScroll.overflow,
      "4x CPU mobile first scroll stays within the viewport",
      report.mobileScroll,
    );
    await send("Emulation.setCPUThrottlingRate", { rate: 1 });
    for (const id of ["hero", "learning", "projects", "interview"]) {
      await evaluate(
        `document.getElementById('${id}').scrollIntoView({behavior:'instant',block:'start'})`,
      );
      await wait(550);
      check(
        await evaluate(
          "document.documentElement.scrollWidth<=document.documentElement.clientWidth",
        ),
        "mobile landing " + id + " has no overflow",
      );
      await screenshot("mobile-" + id);
      if (id === "projects") {
        check(
          await evaluate(
            "document.querySelectorAll('[class*=mobileStreams] button').length===3",
          ),
          "mobile project retains all three stakeholder controls",
        );
      }
    }
    check(
      report.errors.length === 0,
      "no browser exceptions across layouts and structured preview",
      report.errors,
    );
    console.log(JSON.stringify(report, null, 2));
  }
} catch (error) {
  report.failure = String(error.stack || error);
  console.error(report.failure);
  process.exitCode = 1;
} finally {
  writeFileSync(
    join(
      out,
      process.env.SPATIAL_BEFORE === "1" ? "before.json" : "results.json",
    ),
    JSON.stringify(report, null, 2),
  );
  ws?.close();
  browser.kill();
}
