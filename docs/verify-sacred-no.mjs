import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const out = join(process.cwd(), "docs", "sacred-no-verification");
mkdirSync(out, { recursive: true });
const browser = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    "--headless=new",
    "--remote-debugging-port=9283",
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "pmf-mvp-"))}`,
    "--no-first-run",
    "--enable-unsafe-swiftshader",
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true },
);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
const report = { at: new Date().toISOString(), checks: [], errors: [] };
const smoke = process.env.DEADLOCK_FAST_SMOKE === "1";
const previewOnly = process.env.DEADLOCK_PREVIEW_ONLY === "1";
try {
  let target;
  for (let i = 0; i < 50; i++) {
    try {
      target = await fetch("http://127.0.0.1:9283/json/new?about:blank", {
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
      `Array.from(document.querySelectorAll('button,a,summary')).some(e=>e.textContent.trim().includes(${JSON.stringify(text)})&&!e.disabled)`,
      `button ${text}`,
    );
    await evaluate(
      `(()=>{const e=Array.from(document.querySelectorAll('button,a,summary')).find(e=>e.textContent.trim().includes(${JSON.stringify(text)})&&!e.disabled);e.click()})()`,
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
      url: (process.env.PRODUCT_URL || "http://localhost:3002") + path,
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

  const trustedClick=async(text)=>{const point=await evaluate(`(()=>{const e=[...document.querySelectorAll('button,a,summary')].find(e=>e.textContent.includes(${JSON.stringify(text)})&&!e.disabled);e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});await wait(400);};
  const body=()=>evaluate('document.body.innerText');
  const has=async(text)=>until(`document.body.innerText.toLowerCase().includes(${JSON.stringify(text.toLowerCase())})`,text);
  const mobile=async(name)=>{for(const width of [390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:860,deviceScaleFactor:1,mobile:true});await wait(250);check(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),`${name} fits ${width}px`);if(width===390)await screenshot(name+'-mobile');}await send('Emulation.setDeviceMetricsOverride',{width:1440,height:960,deviceScaleFactor:1,mobile:false});};
  const setInput=async(selector,value)=>{await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await wait(200);};
  const articleButton=async(title,text)=>{await evaluate(`(()=>{const a=[...document.querySelectorAll('main article')].find(e=>e.querySelector('h2,h3')?.textContent===${JSON.stringify(title)});const b=[...a.querySelectorAll('button')].find(e=>e.textContent.includes(${JSON.stringify(text)}));b.click()})()`);await wait(350);};
  await navigate('/app');await click('Try without an account');await click('Skip setup');
  await navigate('/app/projects');await until("!!document.querySelector('#project-sacred-no a')",'project card');
  await clickSel('#project-sacred-no a');await has('Open the message');await screenshot('entrance');await mobile('entrance');
  await click('Open the message');await has('Your phone lights up');check((await body()).includes('You are Head of Product'),'role is clear before first reply');await screenshot('cold');await mobile('cold');
  await click('Walk me through');await has('Five claims');
  await articleButton('Load test log','Investigate');await articleButton('Checkout dashboard','Investigate');
  await articleButton('Load test log','Select to test');await click('Servers can handle it');await articleButton('Checkout dashboard','Select to test');await click('Checkout stays fast');
  check((await body()).includes('CHALLENGED'),'relevant evidence breaks a claim');await screenshot('evidence');await mobile('evidence');
  await click('Choose the engineering');await setInput('input[type=range]','6');await click('Reserve this allocation');
  await click('Board optics');await has('A controlled demonstration');await click('Call Kian now');
  await evaluate(`(()=>{for(const l of document.querySelectorAll('fieldset label')){if(l.textContent.includes('Load test log')||l.textContent.includes('Checkout dashboard'))l.querySelector('input')?.click();}})()`);await wait(250);
  await screenshot('call');await mobile('call');await click('Review before saying it');await has('Your exact words become a receipt');await click('Say it');await has('6:30 AM');
  check((await body()).includes('You used my numbers'),'strong refusal returns a specific Priya callback');
  await click('Isolate the queue');await has('Tess needs something');
  await articleButton('Three-brand private beta','Inspect the cost');await articleButton('Three-brand private beta','Accept commitment');
  check((await body()).includes('A beta review next week'),'accepted trade exposes its debt');await click('Finish negotiation');await has('Who carries the risk');
  await evaluate(`(()=>{const l=[...document.querySelectorAll('main label')].find(l=>l.textContent.includes('Power users'));l.querySelector('input').click()})()`);await wait(1200);
  check(await evaluate("document.querySelectorAll('canvas').length<=1"),'at most one WebGL context surface');check(await evaluate("window.__pmProductDraws>0"),'coverage shader renders actual draw calls');await screenshot('rollout');await mobile('rollout');
  await click('Lock this exposure');await has('Before the room opens');await click('Review and lock');await click('Lock it');await has('9:00 AM. Show');
  check((await body()).includes('Three-brand private beta'),'board remembers accepted deal');await screenshot('board');await mobile('board');await click('Present the alternative');await has('Lena asks');
  check((await body()).includes('forecast'),'alternative never pretends forecast is measured');await screenshot('result');await click('Acknowledge the result');await has('Your run, in brief');
  check(await evaluate("document.querySelectorAll('main details')[0]?.open===false"),'detailed debrief starts collapsed');check(await evaluate("document.querySelectorAll('main button').length>0"),'debrief remains interactive');await screenshot('debrief');await mobile('debrief');
  const originalURL=await evaluate('location.href');
  await send('Page.reload');await has('Previously, at Kettle');await click('Continue →');await has('Your run, in brief');check(true,'reload restores the completed run with a recap');
  await click('Explore your decisions');await click('A different No');await click('Next →');await click('Next →');await click('Replay from here');await has('Previously, at Kettle');await click('Continue →');await has('Say what you mean');
  check(await evaluate('location.href')!==originalURL,'replay creates a new branch URL');await navigate(new URL(originalURL).pathname+new URL(originalURL).search);await has('Previously, at Kettle');await click('Continue →');await has('Your run, in brief');check(true,'original remains completed after branch');
  await click('Start a new night');await has('Your phone lights up');await click('On it.');await has('Five claims');
  await articleButton('Load test log','Investigate');await click('Choose the engineering');await click('Reserve this allocation');await click('Call Kian now');
  await select('main select','ship');await click('Review before saying it');await click('Say it');await has('The team remembers');await click('Keep the current allocation');
  await articleButton('Full launch, risk acknowledged','Inspect the cost');await articleButton('Full launch, risk acknowledged','Accept commitment');await click('Finish negotiation');
  await click('Lock this exposure');await click('Review and lock');await click('Lock it');await click('Start the demonstration');await has('The promise met its limit');
  check((await body()).includes('payment provider')||(await body()).includes('Forecast load'),'failure names the release boundary that was exceeded');await screenshot('failure');await mobile('failure');await click('Propose rollback');await has('Your run, in brief');
  check((await body()).includes('The live promise exceeded'),'unsafe route reaches a causal crash conclusion');await click('Explore your decisions');check((await body()).includes('The Echo'),'cave-in is remembered in the outcome pattern');
  await click('Settings');await evaluate(`(()=>{const l=[...document.querySelectorAll('[role=dialog] label')].find(e=>e.textContent.includes('Sound + captions'));l.querySelector('input').click()})()`);await wait(200);
  for(const speaker of ['Kian','Priya','Tess','Lena','Noor']){await trustedClick('Preview '+speaker);await wait(450);check(await evaluate("window.__audioEvents.some(e=>e.type==='playing')"),speaker+' preview plays');}
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});check(await evaluate("!!document.activeElement.closest('[role=dialog]')"),'keyboard focus stays inside settings dialog');
  await send('Network.setBypassServiceWorker',{bypass:true});await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Network.setBlockedURLs',{urls:['*sacred-no/audio/OPEN.mp3*']});await trustedClick('Preview Kian');await until("document.body.innerText.includes('Recording unavailable')||document.body.innerText.includes('Tap Replay')",'audio failure recovery');check(await evaluate("document.querySelector('[data-sacred-scene]')?.dataset.sacredScene==='debrief'"),'blocked recording leaves captions and completed scene intact');await send('Network.setBlockedURLs',{urls:[]});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});check(await evaluate("getComputedStyle(document.querySelector('[data-spectacle]')).display==='none'"),'system reduced motion suppresses spectacle');
  await evaluate("[...document.querySelectorAll('[role=dialog] button')].find(e=>e.getAttribute('aria-label')==='Close dialog' || e.getAttribute('aria-label')==='Close')?.click()");await wait(250);
  const manifest=JSON.parse(readFileSync('content/projects/sacred-no/audio-manifest.json','utf8'));
  if(process.env.SACRED_FAST_SMOKE!=='1')report.audio=await evaluate(`(async()=>{const results=[];for(const [id,clip]of Object.entries(${JSON.stringify(manifest.lines)})){const a=new Audio(clip.file+'?v='+clip.signature.slice(0,12));a.volume=.01;results.push(await new Promise(resolve=>{const t=setTimeout(()=>resolve({id,error:'timeout'}),10000);a.onloadedmetadata=()=>{a.currentTime=Math.max(0,a.duration-.1);a.play().catch(e=>{clearTimeout(t);resolve({id,error:String(e)})});};a.onended=()=>{clearTimeout(t);resolve({id,played:true,duration:a.duration})};a.onerror=()=>{clearTimeout(t);resolve({id,error:'media'})};}));a.pause();}return results})()`);
  if(process.env.SACRED_FAST_SMOKE!=='1')check(report.audio.length===Object.keys(manifest.lines).length&&report.audio.every(a=>a.played),'all recorded MP3s play to ended');
  check(report.errors.length===0,'zero browser exceptions',report.errors);
  console.log(JSON.stringify(report,null,2));
} catch(error){report.failure=String(error.stack||error);console.error(report.failure);process.exitCode=1;} finally {writeFileSync(join(out,process.env.SACRED_FAST_SMOKE==='1'?'smoke.json':'browser.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();}
