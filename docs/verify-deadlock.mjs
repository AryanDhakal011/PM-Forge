import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const out = join(process.cwd(), "docs", "deadlock-verification");
mkdirSync(out, { recursive: true });
const browser = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    "--headless=new",
    "--remote-debugging-port=9277",
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
      target = await fetch("http://127.0.0.1:9277/json/new?about:blank", {
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
  await navigate("/app");
  await click("Try without an account");
  await click("Skip setup");
  await navigate("/app/projects/deadlock");
  await until(
    `!!document.querySelector('[data-deadlock] .switch-placeholder') || document.body.innerText.includes('SILENT + CAPTIONS')`,
    "entry",
  );
  await screenshot("entry-desktop");
  await click("SILENT + CAPTIONS");
  await scene("intro");
  await click("SKIP INTRO");
  await scene("floor");
  const runId = await evaluate('location.pathname.split("/").at(-1)');
  report.runId = runId;
  await clickSel("[data-object=E1]");
  await click("flagged by I.");
  await click("PIN TO CASE FILE");
  await clickSel('[aria-label="Lab zones"] button:nth-child(3)');
  await clickSel("[data-object=E2]");
  for (let n = 1; n <= 3; n++)
    await clickSel('[aria-label="Reveal incident slip ' + n + '"]');
  await click("PIN TO CASE FILE");
  await clickSel('[aria-label="Lab zones"] button:nth-child(2)');
  await clickSel("[data-object=E3]");
  await click("PULL FREEZE LEVER");
  await click("Capping speed kills");
  await click("Confirmation prompts cost");
  await click("PIN TO CASE FILE");
  check(
    await evaluate(
      `document.querySelector('[aria-label="0 of 3 Focus bolts remaining"]')!==null`,
    ),
    "three manipulated objects spend exactly three Focus bolts",
  );
  await screenshot("floor-desktop");
  await click("GO TO THE TABLE");
  await scene("table");
  for (const [lane, card, res] of [
    ["speed", "E3", "B"],
    ["recovery", "E3", "B"],
    ["learning", "E2", "S"],
  ]) {
    await select('[aria-label="' + lane + ' defense clamp"]', card);
    const q = "[data-socket][data-lane=" + lane + "][data-res=" + res + "]";
    await evaluate(`document.querySelector(${JSON.stringify(q)}).focus()`);
    await wait(900);
    await clickSel(q);
  }
  check(
    await evaluate(
      `Array.from(document.querySelectorAll('[data-lane][data-selected=true]')).length===3`,
    ),
    "all three physical tokens resolve their conflict lanes",
  );
  check(
    await evaluate(
      `document.querySelectorAll('textarea,input[type=text]').length===0`,
    ),
    "no free-text input in the decision act",
  );
  await screenshot("table-desktop");
  await click("FLIP GUARD");
  await click("LOCK THE PLAN");
  await scene("consequence1");
  await skipReaction();
  await click("CONTINUE");
  await scene("opening2");
  await click("CONTINUE");
  await scene("data");
  for (const d of ["D2", "D3"]) {
    await clickSel("[data-folder=" + d + "]");
    await click("PROJECT SELECTED FOLDER");
  }
  await screenshot("data-desktop");
  check(
    await evaluate(`document.body.innerText.includes('BROKEN')`),
    "shared datasets visibly break the authored assumptions",
  );
  await click("END BRIEFING");
  await scene("forge");
  await click("1.0 + curtain");
  await click("ASSISTED · one tap");
  await click("WHEN UNCERTAIN");
  await select('[aria-label="speed dial defense"]', "D3");
  await select('[aria-label="recovery dial defense"]', "E2");
  await select('[aria-label="learning dial defense"]', "D2");
  await screenshot("forge-desktop");
  await click("FLIP GUARD");
  await click("PROPOSE BUILD");
  await scene("consequence2");
  await skipReaction();
  await click("CONTINUE");
  await scene("run");
  for (let event = 1; event <= 5; event++) {
    await skipReaction();
    await until(
      `Array.from(document.querySelectorAll('button')).some(e=>e.textContent.includes('LET IT RUN')&&!e.disabled)`,
      "frozen run event " + event,
    );
    if (event === 2) await screenshot("run-desktop");
    await click("LET IT RUN");
  }
  await scene("ending");
  check(
    await evaluate(`document.body.innerText.includes('SHARED GROUND')`),
    "informed UI path earns the golden ending",
  );
  await screenshot("ending-desktop");
  await skipReaction();
  await click("SKIP TO THE TRACE");
  await scene("debrief");
  await until('location.pathname.includes("/debrief/")', "debrief route");
  await screenshot("debrief-desktop");
  await click("THE LEVERS");
  await screenshot("levers-desktop");
  await click("THE TRACE");
  await click("EXACT NUMBERS");
  await click("REPLAY FROM HERE");
  await scene("table");
  check(
    await evaluate(
      'location.pathname.split("/").at(-1)!==' + JSON.stringify(runId),
    ),
    "fork restores an earlier decision in a new run",
  );
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await wait(700);
  check(
    await evaluate(
      "document.documentElement.scrollWidth<=document.documentElement.clientWidth",
    ),
    "mobile decision table has no horizontal overflow",
  );
  await screenshot("table-mobile");
  check(
    await evaluate(
      `document.querySelectorAll('textarea,input[type=text]').length===0`,
    ),
    "fork remains playable with no typing",
  );
  await navigate("/app/projects/deadlock/debrief/" + runId);
  await scene("debrief");
  await click("THE COMPARE");
  check(
    await evaluate(`document.body.innerText.includes('FORK AT')`),
    "original retains the branch for comparison",
  );
  await screenshot("compare-mobile");
  const readRun = async (id) =>
    evaluate(
      `new Promise((resolve,reject)=>{const request=indexedDB.open('pmforge-deadlock-v1');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result;const tx=db.transaction('runs','readonly');const get=tx.objectStore('runs').get(${JSON.stringify(id)});get.onsuccess=()=>resolve(get.result);get.onerror=()=>reject(get.error);tx.oncomplete=()=>db.close();};})`,
    );
  const original = await readRun(runId);
  const originalLog = JSON.stringify(original.events);
  const fixtures = JSON.parse(readFileSync(join(out, "fixtures.json"), "utf8"));
  for (const value of Object.values(fixtures)) value.ownerId = original.ownerId;
  await evaluate(
    `new Promise((resolve,reject)=>{const q=indexedDB.open('pmforge-deadlock-v1');q.onsuccess=()=>{const db=q.result,tx=db.transaction('runs','readwrite');for(const run of ${JSON.stringify(Object.values(fixtures))})tx.objectStore('runs').put(run);tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>reject(tx.error);};})`,
  );
  report.layouts = [];
  for (const width of [1440, 1024, 768, 390, 320]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    for (const name of ["floor", "table", "forge", "run", "debrief"]) {
      await navigate(
        "/app/projects/deadlock/" +
          (name === "debrief" ? "debrief/" : "play/") +
          fixtures[name].id,
      );
      await scene(name);
      await wait(250);
      const sample = await evaluate(
        `(()=>{const m=document.querySelector('main'),c=document.querySelector('footer'),h=document.querySelector('header');return {width:${width},scene:'${name}',pageOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,sceneOverflow:m.scrollWidth>m.clientWidth+1,mainBottom:m.getBoundingClientRect().bottom,captionTop:c.getBoundingClientRect().top,headerFit:[...h.children].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=document.documentElement.clientWidth})}})()`,
      );
      report.layouts.push(sample);
      check(
        !sample.pageOverflow && !sample.sceneOverflow && sample.headerFit,
        "all stage controls fit " + name + " at " + width,
        sample,
      );
      check(
        sample.mainBottom <= sample.captionTop + 1,
        "captions reserve space outside " + name + " at " + width,
        sample,
      );
      if (width === 390 || width === 1440) await screenshot(name + "-" + width);
    }
  }
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  report.endings = [];
  for (const name of [
    "QUIET ROOM",
    "FRACTURE",
    "SHARED GROUND",
    "STANDING GUARD",
    "BABYSITTER",
    "STEADY HANDS",
  ]) {
    await navigate(
      "/app/projects/deadlock/play/" +
        fixtures["ending-" + name.replaceAll(" ", "-")].id,
    );
    await scene("ending");
    check(
      await evaluate(
        `document.body.innerText.includes(${JSON.stringify(name)})`,
      ),
      "authored ending renders " + name,
    );
    report.endings.push(name);
    await screenshot("ending-" + name.replaceAll(" ", "-"));
  }
  report.performance = [];
  for (const config of [
    { width: 1440, cpu: 1 },
    { width: 390, cpu: 4 },
  ]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width: config.width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: config.width < 768,
    });
    await send("Emulation.setCPUThrottlingRate", { rate: config.cpu });
    await navigate("/app/projects/deadlock/play/" + fixtures.ending.id);
    await scene("ending");
    const sample = await evaluate(
      `(async()=>{const tasks=[],frames=[];const observer=new PerformanceObserver(l=>tasks.push(...l.getEntries().map(e=>e.duration)));observer.observe({type:'longtask'});const start=performance.now();let previous=start;await new Promise(resolve=>{const frame=now=>{frames.push(now-previous);previous=now;if(now-start<1600)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});observer.disconnect();const values=frames.slice(1).sort((a,b)=>a-b);return {p95Ms:values[Math.floor(values.length*.95)],longTasks:tasks,heapMB:performance.memory?performance.memory.usedJSHeapSize/1048576:null};})()`,
    );
    report.performance.push({ ...config, ...sample });
  }
  await send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  report.rooms = [];
  for (const room of [
    "ALIGNED_BURN",
    "ROBOTICS_WIN",
    "SOFTWARE_WIN",
    "STALLED",
    "MIXED",
  ]) {
    await navigate(
      "/app/projects/deadlock/play/" + fixtures["room-" + room].id,
    );
    await scene("opening2");
    await wait(650);
    const value = await evaluate(
      `(()=>{const p=document.querySelector('[data-room="${room}"] [class*=plates]');return {room:document.querySelector('[data-deadlock]').dataset.room,warm:getComputedStyle(p).getPropertyValue('--warm'),cool:getComputedStyle(p).getPropertyValue('--cool'),props:[...p.querySelectorAll('span')].map(e=>e.textContent)}})()`,
    );
    report.rooms.push(value);
    check(value.room === room, "opening inherits " + room, value);
    await screenshot("room-" + room);
  }
  check(
    new Set(report.rooms.map((r) => r.warm + ":" + r.cool)).size === 5,
    "five room states have distinct light grades",
  );
  for (const width of [390, 320]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await navigate("/app/projects/deadlock/play/" + fixtures["run-final"].id);
    await scene("run");
    check(
      await evaluate(
        `document.querySelector('main').scrollWidth<=document.querySelector('main').clientWidth`,
      ),
      "five-person final gallery fits " + width,
    );
    await screenshot("final-gallery-" + width);
  }
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await navigate("/app/projects/deadlock/play/" + fixtures["extra-floor"].id);
  await scene("floor");
  await clickSel('[aria-label="Lab zones"] button:nth-child(3)');
  await clickSel("[data-object=E4]");
  await click("PULL SHARE TAB");
  check(
    await evaluate(
      `document.body.innerText.includes('first Chapter 2 folder is free')`,
    ),
    "sealed bench cover grants the headstart without exposing data",
  );
  await click("PIN TO CASE FILE");
  await clickSel('[aria-label="Lab zones"] button:nth-child(2)');
  await clickSel("[data-object=E5]");
  await click("TEAR OPEN ENVELOPE");
  await click("We want a demonstration");
  await click("Our safety auditor requires");
  check(
    await evaluate(`document.body.innerText.includes('BOTH REQUIRED')`),
    "both letter requirements must be highlighted",
  );
  await click("PIN TO CASE FILE");
  check(
    JSON.stringify((await readRun(runId)).events) === originalLog,
    "original run event log remains unchanged after fork and matrix checks",
  );
  await evaluate(
    `new Promise((resolve,reject)=>{const open=indexedDB.open('pmforge-deadlock-v1');open.onsuccess=()=>{const db=open.result;const tx=db.transaction('runs','readwrite'),store=tx.objectStore('runs');const count=store.index('parentId').count(${JSON.stringify(runId)});count.onsuccess=()=>{for(let n=count.result;n<6;n++){const parent=${JSON.stringify(original)},seq=parent.events.find(e=>e.type==='SOCKET').seq;store.put({...parent,id:crypto.randomUUID(),parentId:parent.id,forkSeq:seq,revision:0,events:parent.events.slice(0,seq)});}};tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>reject(tx.error);};})`,
  );
  await navigate("/app/projects/deadlock/debrief/" + runId);
  await scene("debrief");
  await click("EXACT NUMBERS");
  await click("REPLAY FROM HERE");
  check(
    await evaluate(
      `document.body.innerText.includes('six branches')&&location.pathname.includes(${JSON.stringify(runId)})`,
    ),
    "seventh fork is rejected without changing the original",
  );
  await navigate("/app/projects/deadlock");
  await until("!!navigator.serviceWorker.controller", "offline worker");
  await until(
    `caches.open('pmforge-offline-v2').then(c=>c.match('/app/projects/deadlock')).then(Boolean)`,
    "cached simulation shell",
  );
  await send("Network.emulateNetworkConditions", {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
  });
  await click("SILENT + CAPTIONS");
  await scene("intro");
  await click("SKIP INTRO");
  await scene("floor");
  await click("GO TO THE TABLE");
  await evaluate(
    "Array.from(document.querySelectorAll('[role=dialog] button')).find(e=>e.textContent.trim()==='THE TABLE →').click()",
  );
  await wait(250);
  await scene("table");
  await skipReaction();
  await evaluate(
    `document.querySelector('[aria-label^="Lift speed decision token"]').focus()`,
  );
  for (const key of ["Enter", "ArrowRight", "ArrowRight"]) {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key, code: key });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key });
    await wait(150);
  }
  await wait(850);
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Enter",
    code: "Enter",
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Enter",
    code: "Enter",
  });
  await wait(350);
  check(
    await evaluate(
      `!!document.querySelector('[data-lane=speed][data-res=B][data-selected=true]')`,
    ),
    "keyboard token lift, arrows and drop work offline",
  );
  await send("Page.reload");
  await scene("table");
  check(
    await evaluate(
      `!!document.querySelector('[data-lane=speed][data-res=B][data-selected=true]')`,
    ),
    "offline reload restores the same socket from its saved log",
  );
  await screenshot("offline-resume");
  await click("▤ CASE FILE");
  await click("TRANSCRIPT");
  check(
    await evaluate(
      `!!document.querySelector('[role=dialog]')&&document.body.innerText.includes('You still have looks left. Go to the table anyway?')`,
    ),
    "caption transcript survives an offline reload",
  );
  await clickSel('[aria-label="Close dialog"]');
  await clickSel("[data-lane=recovery][data-res=S]");
  await clickSel("[data-lane=learning][data-res=R]");
  await until(
    `Array.from(document.querySelectorAll('button')).some(e=>e.textContent.trim()==='FLIP GUARD'&&!e.disabled)`,
    "saved plan enables guarded lever",
  );
  await evaluate(
    `Array.from(document.querySelectorAll('button')).find(e=>e.textContent.trim()==='FLIP GUARD').focus()`,
  );
  for (let n = 0; n < 2; n++) {
    await send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Enter",
      code: "Enter",
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13,
      text: "\r",
      unmodifiedText: "\r",
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Enter",
      code: "Enter",
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13,
    });
    await wait(250);
    report.guardKeyboard ??= [];
    report.guardKeyboard.push(
      await evaluate(
        `({active:document.activeElement?.textContent,scene:document.querySelector('[data-deadlock]')?.dataset.scene,guard:[...document.querySelectorAll('button')].find(e=>e.textContent.includes('GUARD'))?.textContent})`,
      ),
    );
  }
  await scene("consequence1");
  check(
    true,
    "guarded plan lever commits with Enter twice and no extra pointer input",
  );
  await send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
  await navigate("/app/projects/deadlock");
  await evaluate(
    `window.__realDeadlockPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.transaction.db.name==='pmforge-deadlock-v1')throw new DOMException('Test quota exhausted','QuotaExceededError');return window.__realDeadlockPut.apply(this,args)}`,
  );
  await click("SILENT + CAPTIONS");
  await scene("intro");
  check(
    await evaluate(
      `document.body.innerText.includes('This device can’t save your run')`,
    ),
    "quota failure declares memory-only play",
  );
  await click("SKIP INTRO");
  await scene("floor");
  await click("GO TO THE TABLE");
  await evaluate(
    "Array.from(document.querySelectorAll('[role=dialog] button')).find(e=>e.textContent.trim()==='THE TABLE →').click()",
  );
  await wait(250);
  await scene("table");
  await clickSel("[data-lane=speed][data-res=B]");
  check(
    await evaluate(
      `!!document.querySelector('[data-lane=speed][data-res=B][data-selected=true]')`,
    ),
    "memory-only fallback continues across subsequent events",
  );
  await evaluate("IDBObjectStore.prototype.put=window.__realDeadlockPut");
  await evaluate(
    `window.__voiceState={paused:false,resumes:0,text:''};window.__speak=speechSynthesis.speak.bind(speechSynthesis);window.__resume=speechSynthesis.resume.bind(speechSynthesis);window.__pause=speechSynthesis.pause.bind(speechSynthesis);Object.defineProperty(speechSynthesis,'paused',{configurable:true,get:()=>window.__voiceState.paused});speechSynthesis.pause=()=>{window.__voiceState.paused=true;};speechSynthesis.resume=()=>{window.__voiceState.paused=false;window.__voiceState.resumes++;};speechSynthesis.speak=u=>{window.__voiceState.text=u.text;u.onend?.();};`,
  );
  await click("PAUSE");
  await click("SETTINGS");
  await click("TEST DEVICE VOICE");
  check(
    await evaluate(
      `window.__voiceState.resumes>0&&window.__voiceState.text.includes('Twelve weeks')&&window.__voiceState.paused`,
    ),
    "explicit voice test resumes and restores pause state (speech API stub)",
  );
  await evaluate(
    `speechSynthesis.speak=window.__speak;speechSynthesis.resume=window.__resume;speechSynthesis.pause=window.__pause;delete speechSynthesis.paused;`,
  );
  check(
    report.errors.length === 0,
    "no browser exceptions during complete run, forks, responsive and offline checks",
    report.errors,
  );
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.failure = String(error.stack || error);
  console.error(report.failure);
  process.exitCode = 1;
} finally {
  writeFileSync(join(out, "browser.json"), JSON.stringify(report, null, 2));
  ws?.close();
  browser.kill();
}
