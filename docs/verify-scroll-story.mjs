// Production Chromium regression harness. Run after `npm run build` and
// `npm run start -- --port 3001`. No application test hooks are required.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const output = join(process.cwd(), 'docs', 'scroll-story-verification');
mkdirSync(output, { recursive: true });
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--remote-debugging-port=9246',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'pmforge-story-'))}`,
  '--no-first-run', '--disable-extensions', '--disable-background-networking',
  '--enable-unsafe-swiftshader', '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore', windowsHide: true });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws;
const report = { capturedAt: new Date().toISOString(), runs: [] };
try {
  let target;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      target = await fetch('http://127.0.0.1:9246/json/new?about:blank', { method: 'PUT' }).then(r => r.json());
      break;
    } catch { await wait(200); }
  }
  if (!target) throw new Error('Chromium CDP unavailable');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  let errors = [];
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const callback = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) callback?.reject(new Error(JSON.stringify(message.error)));
      else callback?.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      errors.push(message.params.args.map(a => a.value ?? a.description).join(' '));
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? 'Evaluation failed');
    return result.result.value;
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__storyDraws = {};
    window.__storyFrames = {};
    window.__storyContexts = new Set();
    for (const Constructor of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      if (!Constructor) continue;
      for (const name of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
        const original = Constructor.prototype[name];
        if (!original) continue;
        Constructor.prototype[name] = function(...args) {
          const id = this.canvas.closest('section')?.id || 'unattached';
          window.__storyContexts.add(this.canvas);
          window.__storyDraws[id] = (window.__storyDraws[id] || 0) + 1;
          return original.apply(this, args);
        };
      }
    }
  ` });
  const shot = async name => {
    if (process.env.STORY_NO_SHOTS) return;
    const result = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(output, `${name}.png`), Buffer.from(result.data, 'base64'));
  };
  const scroll = async y => {
    await evaluate(`scrollTo({top:${Math.round(y)},behavior:'instant'})`);
    await wait(350);
    await evaluate(`scrollTo({top:${Math.round(y)},behavior:'instant'});window.dispatchEvent(new Event('resize'))`);
    await wait(950);
  };
  const section = id => evaluate(`(() => {
    const s = document.getElementById(${JSON.stringify(id)}); const r = s.getBoundingClientRect();
    return {top:r.top+scrollY,height:r.height,calm:getComputedStyle(s).getPropertyValue('--calm').trim(),stage:s.dataset.signalStage??null,bindings:Array.from(s.querySelectorAll('[style*="--calm"]')).map(e=>({class:e.className,value:getComputedStyle(e).getPropertyValue('--calm').trim()}))};
  })()`);
  const measure = () => evaluate(`(async () => {
    const before = {...window.__storyDraws}; const start = performance.now();
    const intervals = []; let previous = start;
    await new Promise(resolve => {
      const tick = now => { intervals.push(now-previous); previous=now;
        if(now-start<2000) requestAnimationFrame(tick); else resolve(); };
      requestAnimationFrame(tick);
    });
    const elapsed = (performance.now()-start)/1000;
    const draws = Object.fromEntries(Object.keys(window.__storyDraws).map(id => [id,Math.round(((window.__storyDraws[id]||0)-(before[id]||0))/elapsed)]));
    const sorted = intervals.slice(1).sort((a,b)=>a-b);
    return {draws, fps:Math.round(intervals.length/elapsed*10)/10, medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],
      contexts:window.__storyContexts.size,overflow:document.documentElement.scrollWidth>innerWidth,
      sceneVisibility:Object.fromEntries(['hero','signal','learning'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return [id,r.bottom>0&&r.top<innerHeight]})),
      perf:window.__pmPerfReport?.()??null};
  })()`);
  for (const config of [
    { name: 'desktop', width: 1440, height: 860, reduced: false },
    { name: 'tablet', width: 800, height: 766, reduced: false },
    { name: 'mobile', width: 390, height: 844, reduced: false },
    { name: 'reduced', width: 1440, height: 860, reduced: true },
  ].filter(config => !process.env.STORY_PROFILES || process.env.STORY_PROFILES.split(',').includes(config.name))) {
    errors = [];
    await send('Emulation.setDeviceMetricsOverride', { width:config.width,height:config.height,deviceScaleFactor:1.25,mobile:false });
    await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:config.reduced?'reduce':'no-preference'}] });
    await send('Page.navigate', { url: process.env.STORY_URL || 'http://localhost:3001/' });
    await wait(1000);
    for (let attempt=0;attempt<100;attempt++) {
      if (await evaluate(`document.documentElement.dataset.loaderDone === 'true'`)) break;
      await wait(200);
    }
    await wait(700);
    await scroll(0);
    const run = { ...config, loaderDone:await evaluate(`document.documentElement.dataset.loaderDone`), sections:[], samples:[] };
    report.runs.push(run);
    for (const id of ['hero','signal','learning','projects','interview','career','blueprint']) {
      let bounds = await section(id);
      let target = id === 'hero' ? 0 : bounds.top + Math.max(0,(bounds.height-config.height)*0.5);
      if (id === 'signal' && config.name === 'desktop') target = bounds.top + bounds.height-config.height;
      await scroll(target);
      bounds = await section(id);
      run.sections.push({id,...bounds});
      const measured = await measure();
      run.samples.push({id,scrollY:await evaluate('scrollY'),...measured});
      await shot(`${config.name}-${id}`);
      if (id === 'career') run.counters = await evaluate(`Array.from(document.querySelectorAll('[data-career-count]')).map(e=>({expected:e.dataset.careerCount,actual:e.textContent}))`);
      if (id === 'signal') {
        run.signalBefore = await evaluate(`document.getElementById('signal').textContent.includes('Decision justified.')`);
        await evaluate(`Array.from(document.querySelectorAll('#signal button')).find(b=>b.textContent.includes('Mobile conversion'))?.click()`);
        await wait(500);
        run.signalSelected = await section(id);
        run.signalJustified = await evaluate(`document.getElementById('signal').textContent.includes('Decision justified.')`);
        await evaluate(`window.dispatchEvent(new Event('resize'))`);
        await wait(250);
        run.signalAfterResize = await section(id);
      }
      if (id === 'learning') {
        run.learningProgress = [];
        for (const progress of [0,0.5,1]) {
          const start = bounds.top-config.height*.88;
          const end = bounds.top+bounds.height/2-config.height*.52;
          await scroll(start+(end-start)*progress);
          run.learningProgress.push({progress,...await section(id)});
          await shot(`${config.name}-learning-${progress}`);
        }
        const signalBounds = await section('signal');
        const overlap = (signalBounds.top+signalBounds.height+bounds.top-config.height)/2;
        await scroll(overlap);
        run.overlap = await measure();
      }
      if (id === 'projects') {
        await evaluate(`document.querySelector('#projects [aria-label="Pressure decision"] button')?.click()`);
        await wait(400);
        run.projectWritten = await evaluate(`document.getElementById('decision-record').dataset.written`);
      }
      if (id === 'interview') {
        const demoClick = async (text) => { await evaluate(`Array.from(document.querySelectorAll('#interview button')).find(b=>b.textContent.includes(${JSON.stringify(text)})&&!b.disabled).click()`); await wait(180); };
        await demoClick('Try the decision preview');
        await demoClick('Did sign-ups fall');
        await demoClick('Inspect the evidence');
        await evaluate(`document.querySelector('#interview details').open=true`); await wait(250);
        await demoClick('Defend a call');
        await evaluate(`document.querySelector('[aria-label="Decision direction"] button').click();document.querySelector('#interview input[type="checkbox"]').click()`); await wait(200);
        await demoClick('Review my recorded choices');
        run.interviewAfter = await evaluate(`({phase:document.querySelector('#interview-card').dataset.phase,feedback:!!document.getElementById('interview-feedback'),timer:document.querySelector('#interview [role="timer"]').textContent,checks:document.querySelectorAll('[data-preview-check]').length})`);
        await shot(`${config.name}-interview-feedback`);
      }
    }
    await scroll(0);
    run.returnToHero = await measure();
    run.errors = errors;
    writeFileSync(join(output,process.env.STORY_RESULTS || 'results.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({name:run.name,draws:run.samples.map(s=>({id:s.id,...s.draws})),overlap:run.overlap,signalAfterResize:run.signalAfterResize,learningProgress:run.learningProgress,interview:run.interviewAfter,counters:run.counters,errors:run.errors}));
  }
  report.failures = [];
  for (const run of report.runs) {
    const check = (ok, message) => { if (!ok) report.failures.push(`${run.name}: ${message}`); };
    for(const section of run.sections)check(section.bindings?.length>0&&section.bindings.every(b=>Math.abs(Number(b.value)-Number(section.calm))<.002), section.id+' painted objects retain the full scroll state');
    check(run.loaderDone === 'true', 'loader did not finish');
    check(run.errors.length === 0, 'runtime errors');
    check(!run.signalBefore && run.signalJustified, 'Signal selection gating');
    check(Number(run.signalAfterResize.calm) === 1, 'Signal selection lost after resize');
    check(run.projectWritten === 'true', 'real decision record did not appear');
    check(run.interviewAfter.phase === 'review' && run.interviewAfter.feedback, 'interview feedback missing');
    check(run.counters.every(c=>c.actual === c.expected), 'career counter values');
    const samples = [...run.samples,run.overlap,run.returnToHero];
    for (const sample of samples) {
      check(!sample.overflow,'horizontal overflow');
      check(Object.values(sample.draws).filter(n=>n>0).length<=2,'three scenes rendering');
      for (const [id,draws] of Object.entries(sample.draws)) {
        check(draws===0 || sample.sceneVisibility[id],`offscreen ${id} rendering`);
        if(run.reduced) check(draws===0,`reduced-motion ${id} not idle`);
      }
    }
    const calm = run.learningProgress.map(s=>Number(s.calm));
    check(run.reduced ? calm.every(c=>c===1) : calm[0]===0 && calm[1]>0 && calm[1]<1 && calm[2]===1,'learning progression');
  }
  writeFileSync(join(output,process.env.STORY_RESULTS || 'results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({failures:report.failures}));
  if(report.failures.length) process.exitCode = 1;
} finally { ws?.close(); chrome.kill(); }
