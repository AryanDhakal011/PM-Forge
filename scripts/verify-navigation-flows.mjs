// Reuse the transport and isolation setup, replacing only the route sweep.
import {readFileSync} from 'node:fs';
let source=readFileSync(new URL('./verify-navigation.mjs',import.meta.url),'utf8');
source=source.replace("const out='docs/navigation-verification'+(process.env.NAVIGATION_SMOKE_ONLY==='1'?'/clicks':'')", "const out='docs/navigation-verification/flows'").replace('9294:9293','9295:9295');
const first=source.indexOf(" await visit('/',12000);");
const last=source.indexOf('}catch(e){report.errors.push',first);
source=source.slice(0,first)+`
 await visit('/app');
 const clickText=async(text)=>{const clicked=await ev('(()=>{const e=[...document.querySelectorAll("button,a")].find(e=>e.textContent.includes('+JSON.stringify(text)+')&&!e.disabled);e?.click();return !!e})()');await wait(650);await settle();return clicked;};
 for(const text of ['Try without an account','Skip setup'])await clickText(text);
 for(const path of ['/help','/app/settings','/app/account']){await visit('/app');const clicked=await ev('(()=>{const e=[...document.querySelectorAll("a")].find(e=>e.getAttribute("href")==='+JSON.stringify(path)+');e?.click();return !!e})()');if(!clicked&&path==='/app/account'){await visit('/app/settings');await ev('(()=>{const e=[...document.querySelectorAll("a")].find(e=>e.getAttribute("href")==="/app/account");e?.click()})()');}await wait(650);const s=await settle();report.clicks.push({path,url:s.url,pass:s.url===path});}
 await visit('/app/practice/'+JSON.parse(readFileSync('.data/navigation-routes.json','utf8')).questionSlugs[0]);
 const started=await clickText('Start 8-minute guided Easy');const run=await state();report.clicks.push({path:'create real interview run',url:run.url,pass:started&&run.url.startsWith('/app/run/')&&!run.text.includes('unavailable')});
 const runURL=run.url;await visit('/app/practice');await ev('history.back()');await wait(700);report.clicks.push({path:'back to actual run',pass:(await state()).url===runURL});await ev('history.forward()');await wait(700);report.clicks.push({path:'forward to library',pass:(await state()).url==='/app/practice'});
 for(const path of ['/app/bookmarks','/app/history','/dashboard','/career','/learn']){const s=await visit(path);report.clicks.push({path,url:s.url,pass:s.url!==path});}
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:860,deviceScaleFactor:1,mobile:true});await visit('/app');const controls=await ev('[...document.querySelectorAll("button")].map(b=>({text:b.textContent,label:b.getAttribute("aria-label")}))');report.mobileControls=controls;
 const opened=await ev('(()=>{const b=[...document.querySelectorAll("nav")].find(n=>n.getAttribute("aria-label")==="Mobile workspace")?.querySelector("button");b?.click();return !!b})()');await wait(450);report.clicks.push({path:'mobile navigation menu',pass:opened&&await ev('!!document.querySelector("[role=dialog]")')});
 const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(join(out,'mobile-navigation.png'),Buffer.from(shot.data,'base64'));
`+source.slice(last);
process.env.NAVIGATION_SMOKE_ONLY='1';
// Run the shared harness in this process so failures retain their exit code.
await import('data:text/javascript;base64,'+Buffer.from(source+'\n//# sourceURL=pmforge-navigation-flows.mjs').toString('base64'));
