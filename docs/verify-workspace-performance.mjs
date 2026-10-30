import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const out = join(process.cwd(), "docs", "workspace-verification");
mkdirSync(out, { recursive: true });
const browser = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    "--headless=new",
    "--remote-debugging-port=9258",
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
      target = await fetch("http://127.0.0.1:9258/json/new?about:blank", {
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

  await send('Performance.enable');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.__gl={created:0,lost:0,textures:0,buffers:0,programs:0};window.__long=[];
    new PerformanceObserver(list=>{for(const e of list.getEntries())window.__long.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:true});
    const contextState=new WeakMap(),resources=new WeakSet();const originalGet=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){const gl=originalGet.call(this,type,...args);if(gl&&/webgl/.test(type)&&!contextState.has(gl)){const state={alive:true,textures:0,buffers:0,programs:0};contextState.set(gl,state);window.__gl.created++;this.addEventListener('webglcontextlost',()=>{if(!state.alive)return;state.alive=false;window.__gl.lost++;for(const k of ['textures','buffers','programs'])window.__gl[k]-=state[k];});}return gl;};
    for(const C of [WebGLRenderingContext,WebGL2RenderingContext])for(const [create,del,key] of [['createTexture','deleteTexture','textures'],['createBuffer','deleteBuffer','buffers'],['createProgram','deleteProgram','programs']]){const original=C.prototype[create],remove=C.prototype[del];C.prototype[create]=function(...args){const resource=original.apply(this,args);const s=contextState.get(this);if(resource&&s?.alive){resources.add(resource);s[key]++;window.__gl[key]++;}return resource;};C.prototype[del]=function(resource){const s=contextState.get(this);if(s?.alive&&resource&&resources.has(resource)){resources.delete(resource);s[key]--;window.__gl[key]--;}return remove.call(this,resource);};}
  `});
  await navigate('/');await until("document.documentElement.dataset.loaderDone==='true'",'landing ready');await evaluate('document.fonts.ready');await wait(2000);
  report.scroll=[];
  for(const id of ['hero','signal','learning','projects','interview','career','blueprint']){
    await evaluate(`(()=>{const e=document.getElementById('${id}');scrollTo({top:e.getBoundingClientRect().top+scrollY+Math.min(100,e.offsetHeight/4),behavior:'instant'});})()`);await wait(1000);
    const start=await evaluate('performance.now()');const before=await send('Performance.getMetrics');
    await evaluate("window.__sample=[];window.__previous=performance.now();window.__sampling=true;requestAnimationFrame(function tick(t){window.__sample.push(t-window.__previous);window.__previous=t;if(window.__sampling)requestAnimationFrame(tick);})");
    for(let j=0;j<10;j++){await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:1100,y:650,deltaY:65,deltaX:0});await wait(65);}await wait(1000);
    const result=await evaluate(`(()=>{window.__sampling=false;const frames=window.__sample.slice(1).sort((a,b)=>a-b);return {id:'${id}',frames:frames.length,medianMs:frames[Math.floor(frames.length*.5)],p95Ms:frames[Math.floor(frames.length*.95)],longTasks:window.__long.filter(t=>t.start>=${start}),gl:window.__gl,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
    const after=await send('Performance.getMetrics');result.cpu={};for(const name of ['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration']){result.cpu[name+'Ms']=Math.round(((after.metrics.find(m=>m.name===name)?.value||0)-(before.metrics.find(m=>m.name===name)?.value||0))*1000*10)/10;}report.scroll.push(result);console.log(JSON.stringify(result));
  }
  await navigate('/app');await click('Try without an account');await click('Skip setup');await until("document.body.innerText.includes('Make room')",'workspace');await wait(2000);
  report.gpuLifecycle=[];const started=Date.now();let cycle=0;
  while(Date.now()-started<Number(process.env.PERF_DURATION_MS||300000)){
    for(const destination of ['/app/practice','/app/projects','/app/progress','/app']){await evaluate(`document.querySelector('nav[aria-label="Workspace"] a[href="${destination}"]').click()`);await until(`location.pathname==='${destination}'`,'SPA '+destination);await wait(900);}
    cycle++;if(cycle%3===0){await send('HeapProfiler.collectGarbage');const row={cycle,elapsedSeconds:Math.round((Date.now()-started)/1000),gl:await evaluate('window.__gl'),dom:await send('Memory.getDOMCounters'),heap:await send('Runtime.getHeapUsage')};report.gpuLifecycle.push(row);console.log(JSON.stringify({cycle,elapsedSeconds:row.elapsedSeconds,gl:row.gl}));}
  }
  await evaluate("document.querySelector('nav[aria-label=Workspace] a[href=\"/app/progress\"]').click()");await wait(2200);report.afterUnmount=await evaluate('window.__gl');
  check(report.afterUnmount.created-report.afterUnmount.lost<=1,'capability probes and retired renderers release their WebGL contexts',report.afterUnmount);
  check(report.afterUnmount.textures===0&&report.afterUnmount.buffers===0&&report.afterUnmount.programs===0,'instrument GPU resources return to zero after unmount',report.afterUnmount);
  check(report.errors.length===0,'no runtime errors during scroll and repeated navigation',report.errors);
}catch(error){report.failure=String(error.stack||error);console.error(report.failure);process.exitCode=1;}finally{writeFileSync(join(out,process.env.PERF_OUTPUT||'performance.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();}
