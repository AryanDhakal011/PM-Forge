import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const base=process.env.PRODUCT_URL||'http://localhost:3001';
const routes=process.env.NAVIGATION_SMOKE_ONLY==='1'?[]:JSON.parse(readFileSync('.data/navigation-routes.json','utf8')).routes;
const out='docs/navigation-verification'+(process.env.NAVIGATION_SMOKE_ONLY==='1'?'/clicks':'');mkdirSync(out,{recursive:true});
const report={at:new Date().toISOString(),base,http:[],assets:[],pages:[],clicks:[],errors:[]};
const assets=new Set(),queue=[...routes];
await Promise.all(Array.from({length:5},async()=>{while(queue.length){const path=queue.shift();try{const r=await fetch(base+path);const html=await r.text();report.http.push({path,status:r.status,url:r.url});for(const m of html.matchAll(/(?:src|href)="([^"<>]+\.(?:js|css)(?:\?[^"<>]*)?)"/g))if(m[1].startsWith('/'))assets.add(m[1].replaceAll('&amp;','&'));}catch(e){report.http.push({path,error:e.message});}}}));
for(const path of assets){const r=await fetch(base+path);report.assets.push({path,status:r.status,type:r.headers.get('content-type')});await r.arrayBuffer();}
writeFileSync(join(out,'http.json'),JSON.stringify(report,null,2));
console.log('HTTP',report.http.length,'assets',report.assets.length,'failures',report.http.filter(r=>r.status!==200).length);
const debugPort=process.env.NAVIGATION_SMOKE_ONLY==='1'?9294:9293;
const browser=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${mkdtempSync(join(tmpdir(),'pmf-navigation-'))}`,'--no-first-run','--enable-unsafe-swiftshader','about:blank'],{stdio:'ignore',windowsHide:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try{
 let target;for(let i=0;i<50;i++){try{target=await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`,{method:'PUT'}).then(r=>r.json());break;}catch{await wait(200);}}
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let seq=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 await send('Page.enable');await send('Runtime.enable');await send('Page.addScriptToEvaluateOnNewDocument',{source:"try { sessionStorage.__qaLoads=String(Number(sessionStorage.__qaLoads||0)+1) } catch {}"});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:960,deviceScaleFactor:1,mobile:false});
 const state=()=>ev(`({url:location.pathname+location.search,text:document.body.innerText,loads:Number(sessionStorage.__qaLoads),ready:document.readyState,links:[...document.querySelectorAll('a[href]')].map(a=>({href:a.getAttribute('href'),text:a.textContent.trim()}))})`);
 async function settle(){for(let i=0;i<60;i++){try{const s=await state();if(s.ready==='complete'&&s.text.length>30&&!s.text.includes('Opening your workspace'))return s;}catch{}await wait(150);}return state();}
 async function visit(path,idle=350){await send('Page.navigate',{url:base+path});await wait(350);let s=await settle();const before=s.loads;await wait(idle);s=await state();const result={path,url:s.url,loads:s.loads,unexpectedReloads:s.loads-before,text:s.text.slice(0,220),failed:/Let’s get your desk back|Application error:|Opening your workspace|Internal Server Error/.test(s.text)};report.pages.push(result);return s;}
 await visit('/',12000);
 await visit('/app');
 for(const label of ['Try without an account','Skip setup']){await ev(`(()=>{const e=[...document.querySelectorAll('button,a')].find(e=>e.textContent.includes(${JSON.stringify(label)}));e?.click();})()`);await wait(600);}
 await settle();
 const sidebar=['/app/practice','/app/projects','/app/progress','/app/portfolio','/app/settings','/app'];
 for(const path of sidebar){const clicked=await ev(`(()=>{const e=[...document.querySelectorAll('a')].find(e=>e.getAttribute('href')===${JSON.stringify(path)});if(!e)return false;e.click();return true})()`);let s;for(let i=0;i<60;i++){await wait(150);s=await settle();if(s.url.split('?')[0]===path)break;}report.clicks.push({path,clicked,url:s.url,pass:clicked&&s.url.split('?')[0]===path});}
 await visit('/app',12000);
 for(const path of routes){if(path==='/'||path==='/app')continue;await visit(path);if(report.pages.length%25===0){writeFileSync(join(out,'browser-progress.json'),JSON.stringify(report,null,2));console.log('Rendered',report.pages.length,'of',routes.length);}}
 await visit('/');const landingLinks=[...new Set((await state()).links.map(l=>l.href).filter(h=>h?.startsWith('/')&&!h.startsWith('//')))];
 for(const href of landingLinks){await visit('/');const clicked=await ev(`(()=>{const e=[...document.querySelectorAll('a')].find(a=>a.getAttribute('href')===${JSON.stringify(href)});e?.click();return !!e})()`);const link=new URL(href,base);let expected=await fetch(base+href).then(r=>new URL(r.url));if(link.pathname==='/signup')expected=new URL(link.searchParams.get('next')||'/app',base);let s;for(let i=0;i<60;i++){await wait(150);s=await settle();if(s.url===expected.pathname+expected.search)break;}report.clicks.push({path:href,clicked,url:s.url,pass:clicked&&s.url===expected.pathname+expected.search});}
 await visit('/app/projects');const projectLinks=(await state()).links.filter(l=>/^\/app\/projects\/[^/?]+$/.test(l.href||''));
 for(const l of projectLinks){await visit('/app/projects');const clicked=await ev(`(()=>{const a=[...document.querySelectorAll('a')].find(a=>a.getAttribute('href')===${JSON.stringify(l.href)});a?.click();return !!a})()`);await wait(600);const s=await settle();report.clicks.push({path:l.href,clicked,url:s.url,pass:clicked&&s.url.startsWith(l.href)});}
 await visit('/app/practice');await ev("history.pushState({},'', '/app/practice?view=saved');history.back()");await wait(500);report.clicks.push({path:'back',pass:(await state()).url==='/app/practice'});await ev('history.forward()');await wait(500);report.clicks.push({path:'forward',pass:(await state()).url.includes('view=saved')});
 for(const width of [390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:860,deviceScaleFactor:1,mobile:true});for(const path of ['/','/app','/app/practice','/app/projects','/app/settings']){await visit(path);report.clicks.push({path,width,pass:await ev('document.documentElement.scrollWidth<=innerWidth+1')});}}
 await send('Page.navigate',{url:base+'/app'});await wait(700);const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(join(out,'workspace-mobile.png'),Buffer.from(shot.data,'base64'));
}catch(e){report.errors.push(e.stack);}finally{writeFileSync(join(out,'browser.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();}
const failures={http:report.http.filter(x=>x.status!==200),assets:report.assets.filter(x=>x.status!==200),pages:report.pages.filter(x=>x.failed||x.unexpectedReloads),clicks:report.clicks.filter(x=>!x.pass),errors:report.errors};
console.log(JSON.stringify({counts:{http:report.http.length,assets:report.assets.length,pages:report.pages.length,clicks:report.clicks.length},failures},null,2));if(Object.values(failures).some(x=>x.length))process.exitCode=1;
