import {readFileSync} from 'node:fs';
let source=readFileSync(new URL('./verify-navigation.mjs',import.meta.url),'utf8')
 .replace(/^const routes=.*$/m,'const routes=[];')
 .replace("const out='docs/navigation-verification'+(process.env.NAVIGATION_SMOKE_ONLY==='1'?'/clicks':'')","const out='docs/silent-churn-verification'")
 .replace("const debugPort=process.env.NAVIGATION_SMOKE_ONLY==='1'?9294:9293","const debugPort=9303");
const first=source.indexOf(" await visit('/',12000);");
const last=source.indexOf('}catch(e){report.errors.push',first);
source=source.slice(0,first)+String.raw`
 const checks=[];
 const check=(v,label)=>{checks.push({label,pass:!!v});if(!v)throw Error('Check failed: '+label)};
 const until=async(expr,label)=>{for(let i=0;i<160;i++){if(await ev(expr))return;await wait(100)}throw Error('Timeout '+label+' '+(await state()).text.slice(-500))};
 const click=async(text)=>{const hit=await ev('(()=>{const scope=document.querySelector("[role=dialog]")||document;const e=[...scope.querySelectorAll("button,a")].find(e=>!e.disabled&&(e.textContent+" "+(e.getAttribute("aria-label")||"")).includes('+JSON.stringify(text)+'));if(!e)return false;e.click();return true})()');check(hit,'find '+text);await wait(100)};
 const choose=async(type,data={})=>{await ev('window.__projectTest.chooseCard('+JSON.stringify(type)+','+JSON.stringify(data)+')');await wait(70)};
 const snapshot=async(name)=>{const r=await send('Page.captureScreenshot',{format:'png'});writeFileSync(join(out,name+'.png'),Buffer.from(r.data,'base64'))};
 const stage=()=>ev('window.__projectTest.state()?.stage');
 await visit('/app/projects/silent-churn/play?qa=1');
 await until('document.body.innerText.includes("Take the elevator")','entrance');
 check(!(await state()).text.includes('Try without an account'),'standalone entrance');
 await snapshot('entrance-desktop');
 for(const width of [390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await wait(120);check(await ev('document.documentElement.scrollWidth<=innerWidth+1'),'entrance '+width+' fits');if(width===390)await snapshot('entrance-mobile')}
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await click('Take the elevator');await until('window.__projectTest?.state()?.stage==="intro"','intro');
 check((await state()).text.includes('Before the clock'),'intro does not spend a day');
 await snapshot('intro');
 for(let i=0;i<3;i++)await choose('next');
 check((await stage())==='sort','lost account');
 await click('Unknown');await until('window.__projectTest.state().stage==="sponsor"','sponsor');
 await click('Back to the task');
 for(let i=0;i<3;i++)await choose('next');
 check((await stage())==='sandbox','day zero');
 await snapshot('sandbox');
 for(const id of ['request','rapport','listen','cap'])await choose('sandbox',{id});
 check((await stage())==='committee','committee introductions');
 for(let i=0;i<7;i++)await choose('next');
 await until('window.__projectTest.state().stage==="desk"','desk');
 await snapshot('desk');
 await click('Marta');await snapshot('people');await click('Close dialog');
 await click('Dredger');await snapshot('dredger');
 await choose('request',{id:'segment',depth:'quick'});
 check(await ev('window.__projectTest.state().requests.length===1'),'real request queued');
 await choose('end-day');check((await stage())==='recap','day recap');await snapshot('recap');
 await choose('next');check(await ev('window.__projectTest.state().findings.length>=1'),'extract arrives on due day');
 await click('Pattern');await snapshot('pattern');
 for(const width of [390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await wait(120);check(await ev('document.documentElement.scrollWidth<=innerWidth+1'),'desk '+width+' fits');if(width===390)await snapshot('desk-mobile')}
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await choose('chapter');check(await ev('window.__projectTest.state().chapter===2'),'coalition same clock');
 await click('Coalition');await snapshot('coalition');
 await click('Pre-read');await snapshot('preread');
 for(const block of ['problem','evidence','proposal','ask','risks'])await choose('preread-edit',{block,ids:['pilot']});await choose('save-preread');check(await ev('window.__projectTest.state().preread.saved'),'five-block pre-read saved');await choose('gauntlet');check((await stage())==='gauntlet','committee opens');await snapshot('gauntlet');let rounds=0;while((await stage())==='gauntlet'&&rounds++<30)await choose('answer',{id:'pass:gap'});check((await stage())==='mandate','committee reaches mandate');await snapshot('mandate');
 const result=await ev('window.__projectTest.loadPolicy("Coalition-first")');
 check(result.stage==='review'&&result.day<=21,'full coalition policy reaches review');
 await until('!!document.querySelector("[class*=recoveryCharts] svg")','computed comparisons');
 await snapshot('review');
 for(const width of [390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await wait(120);check(await ev('document.documentElement.scrollWidth<=innerWidth+1'),'review '+width+' fits');if(width===390)await snapshot('review-mobile')}
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await choose('reflection',{text:'I would secure the rollback owner before promising the first window.'});
 check(await ev('window.__projectTest.state().completed'),'reflection completes run');
 await click('Pause');check((await state()).text.includes('Export run backup'),'save/export available');await snapshot('pause');
 await click('Save & return to entrance');check(!(await ev('window.__projectTest.state()')),'returns to entrance');
 await click('Resume ·');check(await ev('window.__projectTest.state().completed'),'resume completed run');
 await click('Projects');await until('location.pathname==="/app/projects"','gallery');for(let i=0;i<30;i++){if(await ev('!!document.querySelector("#project-silent-churn a")'))break;await ev('(()=>{for(const t of ["Try without an account","Skip setup"])[...document.querySelectorAll("button,a")].find(e=>e.textContent.includes(t))?.click()})()');await wait(120)}check(await ev('!!document.querySelector("#project-silent-churn a")'),'gallery card exists');await ev('document.querySelector("#project-silent-churn a").click()');await until('location.pathname==="/app/projects/silent-churn/play"','gallery card enters level');await until('!!document.querySelector("[data-testid=silent-churn]")','gallery opens standalone level');check(true,'gallery opens standalone level');
 const listenerCount=async()=>{let count=0;for(const expression of ['window','document']){const r=await send('Runtime.evaluate',{expression,objectGroup:'sc-listeners'});count+=(await send('DOMDebugger.getEventListeners',{objectId:r.result.objectId})).listeners.length}await send('Runtime.releaseObjectGroup',{objectGroup:'sc-listeners'});return count};const listenersBefore=await listenerCount();const loads=await ev('Number(sessionStorage.__qaLoads)');for(let i=0;i<20;i++){await click('Projects');await until('location.pathname==="/app/projects"','gallery cycle');check(await ev('!window.__projectTest'),'QA hook removed cycle '+(i+1));await ev('document.querySelector("#project-silent-churn a").click()');await until('location.pathname==="/app/projects/silent-churn/play"','project cycle');await until('!!document.querySelector("[data-testid=silent-churn]")','level cycle')}check(await ev('Number(sessionStorage.__qaLoads)==='+loads),'soft navigation does not reload document');const listenersAfter=await listenerCount();check(listenersAfter===listenersBefore,'twenty entries leave global listener count stable');report.resources={cycles:20,listenersBefore,listenersAfter};await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await visit('/app/projects/silent-churn/play?qa=1');await until('document.querySelector("[data-testid=silent-churn]")?.dataset.still==="true"','reduced motion');check(true,'system reduced motion uses still presentation');
 report.checks=checks;console.log('SILENT CHURN BROWSER CHECKS',checks.length);
`+source.slice(last);
source=source.replace('report.errors.push(e.stack)','report.errors.push(e.message)');
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
