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
    "--remote-debugging-port=9281",
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
const smoke = process.env.DEADLOCK_FAST_SMOKE === "1";
const previewOnly=process.env.DEADLOCK_PREVIEW_ONLY==='1';
try {
  let target;
  for (let i = 0; i < 50; i++) {
    try {
      target = await fetch("http://127.0.0.1:9281/json/new?about:blank", {
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
    source:
      "window.__audioInstances=[];window.__audioEvents=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(!window.__audioInstances.includes(this))window.__audioInstances.push(this);this.addEventListener('playing',()=>window.__audioEvents.push({type:'playing',src:this.src}));this.addEventListener('ended',()=>window.__audioEvents.push({type:'ended',src:this.src}));return play.apply(this,arguments)}",
  });
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
  const snapshots = async (name) => {
    await screenshot(name);
    if (!name.endsWith("-silent")) return;
    for (const width of [390, 320]) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 844,
        deviceScaleFactor: 1,
        mobile: true,
      });
      await wait(250);
      const overflow = await evaluate(
        `({page:document.documentElement.scrollWidth>innerWidth+1,dialog:[...document.querySelectorAll('[role=dialog]')].some(e=>e.scrollWidth>e.clientWidth+1)})`,
      );
      check(
        !overflow.page && !overflow.dialog,
        name + " fits " + width + "px",
        overflow,
      );
      await screenshot(name + "-" + width);
    }
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 860,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await wait(200);
  };
  const trustedClick = async (selector) => {
    await until(
      `!!document.querySelector(${JSON.stringify(selector)})`,
      "trusted target",
    );
    const r = await evaluate(
      `(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`,
    );
    await send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      ...r,
      button: "left",
      clickCount: 1,
    });
    await send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      ...r,
      button: "left",
      clickCount: 1,
    });
    await wait(500);
  };
  const next = async (scope = "[data-dialogue-id]") => {
    await until(
      `!!document.querySelector(${JSON.stringify(scope)})`,
      "conversation",
    );
    await evaluate(
      `document.querySelector(${JSON.stringify(scope)}).querySelector('button').click()`,
    );
    await wait(350);
  };
  const responses = async () => {
    for (let n = 0; n < 12; n++) {
      if (
        !(await evaluate(
          `!!document.querySelector('section[aria-label="Team response"]')`,
        ))
      )
        return;
      await next('section[aria-label="Team response"]');
    }
    throw Error("response did not close");
  };
  const guide = async (manual = false) => {
    if (
      !(await evaluate(
        `!!document.querySelector('section[aria-label="Step guide"]')`,
      ))
    ) {
      if (!manual) return;
      await clickSel('[aria-label="Open step guide"]');
    }
    await until(
      `!!document.querySelector('section[aria-label="Step guide"]')`,
      "guide",
    );
    check(
      await evaluate(
        `['goal','do this','watch for'].every(t=>document.querySelector('[role=dialog]').innerText.toLowerCase().includes(t))`,
      ),
      "guide contains goal, action and consequence",
    );
    await next('section[aria-label="Step guide"]');
    await wait(300);
  };
  const sceneConversation = async () => {
    for (let n = 0; n < 16; n++) {
      if (
        !(await evaluate(`!!document.querySelector('main [data-dialogue-id]')`))
      )
        return;
      await next("main [data-dialogue-id]");
      if (await evaluate(`!!document.querySelector('[data-review]')`)) return;
    }
    throw Error("scene conversation did not end");
  };
  await navigate("/app");
  await click("Try without an account");
  await click("Skip setup");
  report.modes = [];
  if(previewOnly){
    await navigate('/app/projects/deadlock');await evaluate("localStorage.setItem('pmforge.deadlock.settings.v1',JSON.stringify({mode:'silent',voice:'off',characters:true,skipGuides:true}))");await navigate('/app/projects/deadlock');await click('SETTINGS');
    check(await evaluate(`!document.querySelector('[role=dialog]').innerText.includes('DEVICE VOICE')`),'legacy device voice control is removed');
    for(const [speaker,id] of [['Mara','INT-01'],['Dev','INT-03'],['Ines','INT-05']]){
      await evaluate(`{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Preview ${speaker}');b.dataset.previewTarget='yes'}`);await trustedClick('[data-preview-target=yes]');await until(`document.documentElement.dataset.deadlockSpeaker==='${speaker}'&&window.__audioEvents.some(e=>e.type==='playing'&&e.src.includes('${id}'))`,'recorded '+speaker+' preview');check(true,speaker+' preview plays its own recording while captions-only is selected');await evaluate(`document.querySelector('[data-preview-target=yes]').removeAttribute('data-preview-target')`);
    }
    await clickSel('[aria-label="Close dialog"]');check(await evaluate("JSON.parse(localStorage.getItem('pmforge.deadlock.settings.v1')).mode==='silent'"),'auditioning does not change the selected playback mode');
    await evaluate(`{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Sound + captions'));b.click()}`);await trustedClick('[data-enter-lab]');await scene('intro');await until(`document.documentElement.dataset.deadlockSpeaker==='Mara'`,'sound works with migrated off preference');check(true,'old device voice off preference cannot block the recorded cast');
  }
  for (const mode of previewOnly?[]:smoke ? ["silent"] : ["silent", "sound"]) {
    await navigate("/app/projects/deadlock");
    await evaluate(
      `localStorage.setItem('pmforge.deadlock.settings.v1',JSON.stringify({mode:'${mode}',autoAdvance:false,skipGuides:false}))`,
    );
    await navigate("/app/projects/deadlock");
    await until(
      `!!Array.from(document.querySelectorAll('button')).find(e=>e.textContent.includes('${mode === "silent" ? "Captions only" : "Sound + captions"}')&&!e.disabled)`,
      "entry",
    );
    const selector = await evaluate(
      `(()=>{const buttons=Array.from(document.querySelectorAll('button'));const b=buttons.find(e=>e.textContent.includes('${mode === "silent" ? "Captions only" : "Sound + captions"}'));b.dataset.testStart='true';return '[data-test-start=true]'})()`,
    );
    await clickSel(selector);
    await trustedClick("[data-enter-lab]");
    await scene("intro");
    await until(
      `document.querySelector('[data-dialogue-id]')?.dataset.dialogueId==='INT-01'`,
      "first intro",
    );
    await snapshots("intro-" + mode);
    if (mode === "sound") {
      await until(
        `window.__audioInstances.some(a=>a.src.includes('INT-01')&&!a.paused&&a.duration>0)`,
        "real recorded Mara playback",
      );
      await until(
        `document.documentElement.dataset.deadlockSpeaker==='Mara'`,
        "Mara playing callback",
      );
      check(
        await evaluate(
          `document.documentElement.dataset.deadlockSpeaker==='Mara'`,
        ),
        "recorded voice activates Mara portrait",
      );
      await evaluate(
        `{const a=window.__audioInstances.findLast(a=>a.src.includes('INT-01'));a.currentTime=Math.max(0,a.duration-.12)}`,
      );
      await wait(1000);
    } else await wait(2000);
    check(
      await evaluate(
        `document.querySelector('[data-dialogue-id]')?.dataset.dialogueId==='INT-01'`,
      ),
      mode + " never advances an intro line without Next",
    );
    const observed = [];
    for (let i = 1; i <= 9; i++) {
      const id = "INT-" + String(i).padStart(2, "0");
      await until(
        `document.querySelector('main [data-dialogue-id]')?.dataset.dialogueId==='${id}'`,
        id,
      );
      observed.push(id);
      await next("main [data-dialogue-id]");
    }
    await until(
      `document.querySelector('main [data-dialogue-id]')?.dataset.dialogueId==='BRF-01'`,
      "briefing",
    );
    await snapshots("briefing-" + mode);
    check(
      await evaluate(
        `!!document.querySelector('[aria-label="Case overview"]')`,
      ),
      "briefing has illustrated situation map",
    );
    for (let i = 1; i <= 7; i++) {
      const id = "BRF-" + String(i).padStart(2, "0");
      await until(
        `document.querySelector('main [data-dialogue-id]')?.dataset.dialogueId==='${id}'`,
        id,
      );
      observed.push(id);
      await next("main [data-dialogue-id]");
    }
    await scene("floor");
    await guide();
    await screenshot("floor-" + mode);
    check(
      observed.length === 16 && new Set(observed).size === 16,
      mode +
        " all nine introductions and seven briefing lines appear exactly in order",
    );
    await clickSel("[data-object=E1]");
    await snapshots("evidence-" + mode);
    await click("0:47 · inspect");
    await until(
      `!document.querySelector('[role=dialog]')`,
      "discovery auto closes",
    );
    await responses();
    check(
      await evaluate(`document.body.innerText.includes('near-miss at 0:47')`),
      "discovery appears immediately without a pin screen",
    );
    await clickSel('[aria-label="Lab zones"] button:nth-child(3)');
    await clickSel("[data-object=E2]");
    for (let i = 1; i <= 3; i++)
      await clickSel('[aria-label="Reveal incident slip ' + i + '"]');
    await responses();
    await clickSel('[aria-label="Lab zones"] button:nth-child(2)');
    await clickSel("[data-object=E3]");
    await click("Capping speed kills");
    await click("Confirmation prompts cost");
    await responses();
    check(
      await evaluate(
        `!!document.querySelector('[aria-label="Investigations left: 0 of 3"]')`,
      ),
      "three short investigations spend exactly three investigations",
    );
    await click("GO TO THE TABLE");
    await scene("table");
    await guide();
    check(
      await evaluate(
        `document.body.innerText.includes('Leave this for later. It costs nothing now, but the problem is still there.')`,
      ),
      "leave-for-later explanation is always visible",
    );
    for (const [lane, card, res] of [
      ["speed", "E3", "B"],
      ["recovery", "E3", "B"],
      ["learning", "E2", "S"],
    ]) {
      await select('[aria-label="' + lane + ' defense clamp"]', card);
      await responses();
      await clickSel("[data-lane=" + lane + "][data-res=" + res + "]");
      await responses();
    }
    await snapshots("table-" + mode);
    await click("Review and lock the plan");
    await screenshot("plan-confirmation-" + mode);
    check(
      await evaluate(
        `['YOU CHOSE','Speed','Recovery','Confirmation','Projected consequences','Change something','Lock it'].every(t=>document.querySelector('[role=dialog]').innerText.toLowerCase().includes(t.toLowerCase()))`,
      ),
      "plan confirmation explains all choices and projected changes",
    );
    await click("Change something");
    check(
      await evaluate(
        `document.querySelector('[data-deadlock]').dataset.scene==='table'`,
      ),
      "plan can return to editing",
    );
    await click("Review and lock the plan");
    await click("Lock it");
    await scene("consequence1");
    await responses();
    await guide();
    await sceneConversation();
    await until(
      `!!document.querySelector('[data-review="1"]')`,
      "chapter one review",
    );
    await snapshots("review-" + mode);
    await click("Continue →");
    await scene("opening2");
    await sceneConversation();
    await scene("data");
    await guide();
    await clickSel("[data-folder=D2]");
    await responses();
    await clickSel("[data-folder=D3]");
    await responses();
    await click("Finish");
    await scene("forge");
    await guide();
    await clickSel(
      '[role=radiogroup][aria-label="SPEED CAP stops"] button:nth-child(3)',
    );
    await clickSel(
      '[role=radiogroup][aria-label="RECOVERY stops"] button:nth-child(2)',
    );
    await clickSel(
      '[role=radiogroup][aria-label="LEARNING stops"] button:nth-child(2)',
    );
    await select('[aria-label="speed dial defense"]', "D3");
    await select('[aria-label="recovery dial defense"]', "E3");
    await select('[aria-label="learning dial defense"]', "D2");
    await click("Submit proposal");
    await responses();
    await scene("consequence2");
    await sceneConversation();
    await until(
      `!!document.querySelector('[data-review="2"]')`,
      "chapter two review",
    );
    await click("Continue →");
    await scene("run");
    await guide();
    for (let event = 1; event <= 5; event++) {
      await until(
        `!!document.querySelector('[role=dialog]')&&document.querySelector('[role=dialog]').innerText.includes('Event ${event} ·')`,
        "event " + event,
      );
      check(
        await evaluate(
          `document.querySelector('[role=dialog]').innerText.includes('Time is paused. Take your time.')`,
        ),
        "event " + event + " has a paused explanation",
      );
      if (event === 2) await snapshots("event-popup-" + mode);
      if (event === 1 || event === 5) {
        check(
          !(await evaluate(
            `Array.from(document.querySelector('[role=dialog]').querySelectorAll('button')).some(b=>b.textContent.trim()==='Let it run')`,
          )),
          "event " + event + " is strictly watch-only",
        );
        await next("[role=dialog] [data-dialogue-id]");
        await wait(3600);
        await responses();
        if (event === 1) await click("Next event →");
      } else {
        await next("[role=dialog] [data-dialogue-id]");
        await click("Let it run");
        await responses();
        await click("Next event →");
      }
    }
    await scene("ending");
    await guide();
    await sceneConversation();
    await until(
      `!!document.querySelector('[data-review="3"]')`,
      "chapter three review",
    );
    await click("Continue →");
    await scene("debrief");
    await guide();
    check(
      await evaluate(`document.querySelectorAll('[data-review]').length===3`),
      "final debrief reuses three chapter review cards",
    );
    await screenshot("debrief-" + mode);
    report.modes.push({ mode, observed, complete: true });
  }
  if (!smoke&&!previewOnly) {
    // Returning players can suppress guides without losing the manual help action.
    await clickSel('[aria-label="Open step guide"]');
    await until(
      `!!document.querySelector('[aria-label="Step guide"]')`,
      "manual guide",
    );
    await clickSel("[role=dialog] input[type=checkbox]");
    await next('section[aria-label="Step guide"]');
    check(
      await evaluate(
        "JSON.parse(localStorage.getItem('pmforge.deadlock.settings.v1')).skipGuides===true",
      ),
      "skip-all guide preference is persistent",
    );
    await navigate("/app/projects/deadlock");
    await trustedClick("[data-enter-lab]");
    await scene("intro");
    await evaluate(
      `document.querySelector('main [data-dialogue-id]').querySelector('button').focus()`,
    );
    await send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Enter",
      code: "Enter",
      text: "\r",
      unmodifiedText: "\r",
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13,
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Enter",
      code: "Enter",
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13,
    });
    await wait(300);
    check(
      (await evaluate(
        `document.querySelector('main [data-dialogue-id]').dataset.dialogueId`,
      )) === "INT-02",
      "keyboard Enter advances exactly one dialogue line",
    );
    for (let n = 0; n < 15; n++) await next("main [data-dialogue-id]");
    await scene("floor");
    await wait(400);
    check(
      !(await evaluate(
        `!!document.querySelector('section[aria-label="Step guide"]')`,
      )),
      "returning run suppresses automatic guides",
    );
    await clickSel('[aria-label="Open step guide"]');
    check(
      await evaluate(
        `!!document.querySelector('section[aria-label="Step guide"]')`,
      ),
      "manual guide still works after skip all",
    );
    await next('section[aria-label="Step guide"]');
    await send("Page.reload");
    await scene("floor");
    check(
      !(await evaluate(
        `!!document.querySelector('section[aria-label="Step guide"]')`,
      )),
      "skip guides survives a page reload",
    );
    // Auto-advance is opt-in, and must use real media completion rather than time estimates.
    await navigate("/app/projects/deadlock");
    await evaluate(
      "localStorage.setItem('pmforge.deadlock.settings.v1',JSON.stringify({mode:'sound',autoAdvance:true,skipGuides:true}))",
    );
    await navigate("/app/projects/deadlock");
    await trustedClick("[data-enter-lab]");
    await scene("intro");
    await until(
      "window.__audioInstances.some(a=>a.src.includes('INT-01')&&!a.paused&&a.duration>0)",
      "auto voice starts",
    );
    await evaluate(
      "window.__completed=window.__audioInstances.findLast(a=>a.src.includes('INT-01'));window.__completed.currentTime=window.__completed.duration-.1",
    );
    await wait(250);
    await evaluate(
      "window.__completed.dispatchEvent(new Event('ended'));window.__completed.dispatchEvent(new Event('ended'))",
    );
    await wait(150);
    check(
      await evaluate(
        "document.querySelector('main [data-dialogue-id]').dataset.dialogueId==='INT-01'",
      ),
      "auto dialogue waits the extra 600ms after audio ends",
    );
    await wait(500);
    check(
      await evaluate(
        "document.querySelector('main [data-dialogue-id]').dataset.dialogueId==='INT-02'",
      ),
      "duplicate audio-end events advance exactly once",
    );
    await evaluate(
      "window.__failed=window.__audioInstances.at(-1);window.__failed.dispatchEvent(new Event('error'))",
    );
    await wait(1000);
    check(
      await evaluate(
        "document.querySelector('main [data-dialogue-id]').dataset.dialogueId==='INT-02'&&document.body.innerText.includes('Audio could not load')",
      ),
      "audio failure keeps the caption in place and offers replay",
    );
    await clickSel('[aria-label="Replay this line"]');
    await until(
      "window.__audioInstances.at(-1)!==window.__failed",
      "replay creates a fresh recording",
    );
    await click("PAUSE");
    // Every MP3 is decoded and actually played through its final sample in Chrome.
    report.audio = await evaluate(
      `(async()=>{const manifest=${JSON.stringify(JSON.parse(readFileSync("content/projects/deadlock/audio-manifest.json", "utf8")))};const results=[];for(const [id,entry] of Object.entries(manifest.lines)){const a=new Audio(entry.file);a.volume=.01;const result=await new Promise(resolve=>{const timeout=setTimeout(()=>resolve({id,error:'timeout'}),7000);a.onerror=()=>{clearTimeout(timeout);resolve({id,error:'media error'})};a.onloadedmetadata=()=>{a.currentTime=Math.max(0,a.duration-.08);a.play().catch(e=>{clearTimeout(timeout);resolve({id,error:String(e)})})};a.onended=()=>{clearTimeout(timeout);resolve({id,duration:a.duration,played:true})}});a.pause();a.removeAttribute('src');a.load();results.push(result)}return results})()`,
    );
    check(
      report.audio.length === 185 &&
        report.audio.every((a) => a.played && a.duration > 0),
      "all 185 pre-rendered audio files decode and play to ended",
    );
  }
  check(
    report.errors.length === 0,
    "zero console errors or browser exceptions",
    report.errors,
  );
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.failure = String(error.stack || error);
  console.error(report.failure);
  process.exitCode = 1;
} finally {
  writeFileSync(
    join(out, previewOnly?'voices.json':smoke ? "smoke.json" : "browser.json"),
    JSON.stringify(report, null, 2),
  );
  ws?.close();
  browser.kill();
}
