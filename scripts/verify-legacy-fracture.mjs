import {readFileSync} from 'node:fs';
let source=readFileSync(new URL('./verify-navigation.mjs',import.meta.url),'utf8')
 .replace(/^const routes=.*$/m,'const routes=[];')
 .replace("const out='docs/navigation-verification'+(process.env.NAVIGATION_SMOKE_ONLY==='1'?'/clicks':'')","const out='docs/legacy-fracture-verification'")
 .replace("const debugPort=process.env.NAVIGATION_SMOKE_ONLY==='1'?9294:9293","const debugPort=9304");
const first=source.indexOf(" await visit('/',12000);");
const last=source.indexOf('}catch(e){report.errors.push',first);
source=source.slice(0,first)+String.raw`
 const checks=[];
 const check=(value,label)=>{checks.push({label,pass:!!value});if(!value)throw Error('Check failed: '+label)};
 const until=async(expr,label)=>{for(let i=0;i<160;i++){if(await ev(expr))return;await wait(100)}throw Error('Timeout '+label+' '+(await state()).text.slice(-500))};
 const click=async(label)=>{const hit=await ev('(()=>{const scope=document.querySelector("[role=dialog]")||document;const e=[...scope.querySelectorAll("button,a")].find(e=>!e.disabled&&(e.textContent+" "+(e.getAttribute("aria-label")||"")).includes('+JSON.stringify(label)+'));if(!e)return false;e.click();return true})()');if(!hit)throw Error('find '+label+'; '+(await state()).text.slice(0,850));check(hit,'find '+label);await wait(90)};
 const choose=async(type,id,extra={})=>{await ev('window.__projectTest.choose('+JSON.stringify(type)+','+JSON.stringify({id,...extra})+')');await wait(50)};
 const snap=async(name)=>{const r=await send('Page.captureScreenshot',{format:'png'});writeFileSync(join(out,name+'.png'),Buffer.from(r.data,'base64'))};
 const scene=()=>ev('window.__projectTest.state()?.scene');
 await visit('/app/projects/legacy-fracture/play?qa=1');
 await until('!!document.querySelector("[data-testid=legacy-fracture]")','entrance');
 check((await state()).text.includes('Ring the bell'),'entrance copy');
 check(!(await state()).text.includes('Try without an account'),'standalone entry');
 await snap('entrance-desktop');
 for(const width of [390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await wait(100);check(await ev('document.documentElement.scrollWidth<=innerWidth+1'),'entrance fits '+width);if(width===390)await snap('entrance-mobile')}
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await click('Ring the bell');await until('window.__projectTest?.state()?.scene==="S01"','opening');
 check((await state()).text.includes('Before the clock'),'opening shows no campaign cost');
 await snap('opening');
 await click('Case file');check((await state()).text.includes('Evidence held'),'case file opens');await click('Close dialog');
 await ev('window.__projectTest.setSeed(41)');
 await choose('skip-lines');await choose('next');check((await scene())==='S02','first task opens');
 await snap('sort');await choose('skip-lines');await click('Unknown');check((await scene())==='S03','sort reacts');
 await choose('reaction');await choose('skip-lines');await choose('reply','already');check((await scene())==='S04','Cora reply');
 await choose('reaction');await choose('skip-lines');await choose('question','protect');check((await scene())==='S05','Oswald question');
 await choose('reaction');await choose('skip-lines');await choose('walk','renata');check((await scene())==='S06','depot walk');
 await choose('reaction');for(const id of ['reel','tape','wave','shadow'])await choose('practice',id);check((await scene())==='S07','Day Zero complete');
 await choose('reaction');await choose('planner','logs');check((await scene())==='S08','audit opens');await snap('reel');
 await click('Decision Log');check((await state()).text.includes('First hypothesis'),'decision log has receipt');await click('Close dialog');
 for(const [id,cause] of [['D4401','road'],['D4402','override'],['D4403','window']])await choose('mark',id,{text:cause});check((await scene())==='S09','three audit causes lead to oral history');
 await choose('border-question');await choose('tape','border');check(await ev('window.__projectTest.state().discovered.includes("LEDGER_SYNC")'),'hidden thread revealed');
 await choose('to-map');await choose('inspect','CUSTOMS_X');await snap('dependency-map');await choose('to-move');await choose('move','poc');check((await scene())==='S12a','POC choice opens scope');await choose('poc-scope','routing');await choose('poc-scope','road');await choose('poc');
 for(const id of ['late','thread','poc'])await choose('board-card',id);await choose('board');check((await scene())==='S13','evidence board held');await choose('consequence');await choose('reaction');await choose('skip-lines');await choose('next');check((await scene())==='S15','chapter two starts');await choose('ally','ops');
 await choose('reaction');await choose('skip-lines');await snap('migration');for(const [id,value] of [['ROAD_TABLE',1],['TIME_WINDOWS',2],['OVERRIDE_UI',3],['LEDGER_SYNC',4]])await choose('wave',id,{value});await choose('method','strangler');await choose('shadow','on');await choose('migration');check((await scene())==='S17','migration locked');await choose('consequence');await choose('reaction');await choose('skip-lines');await choose('next');check((await scene())==='S19','cutover opens');
 await choose('cutover-method','phased-shadow');for(const id of ['Backups','Rollback script','Dispatch override line','Depot communications'])await choose('check',id,{status:'ready'});await choose('reaction');await choose('skip-lines');await snap('cutover');await choose('switch');check((await scene())==='S20','fleet live');await choose('reaction');await choose('skip-lines');await snap('fleet');for(let i=0;i<5;i++)await choose('fleet',i===0||i===4?'watch':'hold',i===0||i===4?{}:{text:['','pause','call','rollback'][i]});check((await scene())==='S21','fleet result');await choose('outcome');await choose('final','driver');
 check((await scene())==='S23','review reached by real choices');check(await ev('window.__projectTest.state().outcome==="Clean handoff"'),'clean ending');await choose('reaction');await until('document.body.innerText.includes("Two other paths")','review comparisons');await wait(450);await snap('review-desktop');
 for(const width of [390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await wait(100);check(await ev('document.documentElement.scrollWidth<=innerWidth+1'),'review fits '+width);if(width===390)await snap('review-mobile')}
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await choose('reflection',undefined,{text:'I would prove ledger parity before migration and protect the drivers.'});check(await ev('window.__projectTest.state().completed'),'reflection completes');
 await click('Pause');check((await state()).text.includes('Export run backup'),'pause export');await snap('pause');await click('Save & return to entrance');check(!(await ev('window.__projectTest.state()')),'back to entrance');await click('Resume ·');check(await ev('window.__projectTest.state().completed'),'resume persisted');await until('!!document.querySelector("[data-scene=S23]")','resumed UI');
 await click('Projects');await until('location.pathname==="/app/projects"','gallery');for(let i=0;i<30;i++){if(await ev('!!document.querySelector("#project-legacy-fracture a")'))break;await ev('(()=>{for(const t of ["Try without an account","Skip setup"])[...document.querySelectorAll("button,a")].find(e=>e.textContent.includes(t))?.click()})()');await wait(100)}check(await ev('!!document.querySelector("#project-legacy-fracture a")'),'gallery card');await ev('document.querySelector("#project-legacy-fracture a").click()');await until('location.pathname==="/app/projects/legacy-fracture/play"','gallery enters level');await until('!!document.querySelector("[data-testid=legacy-fracture]")','gallery level ready');
 const loads=await ev('Number(sessionStorage.__qaLoads)');for(let i=0;i<10;i++){await click('Projects');await until('location.pathname==="/app/projects"','gallery cycle');await until('!!document.querySelector("#project-legacy-fracture a")','gallery card cycle');check(await ev('!window.__projectTest'),'QA hook removed '+i);await ev('document.querySelector("#project-legacy-fracture a").click()');await until('location.pathname==="/app/projects/legacy-fracture/play"','level cycle');await until('!!document.querySelector("[data-testid=legacy-fracture]")','level ready cycle')}
 check(await ev('Number(sessionStorage.__qaLoads)==='+loads),'soft navigation avoids reload');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await visit('/app/projects/legacy-fracture/play?qa=1');await until('document.querySelector("[data-testid=legacy-fracture]")?.dataset.still==="true"','reduced motion');
 report.checks=checks;console.log('LEGACY FRACTURE BROWSER CHECKS',checks.length);
`+source.slice(last);
source=source.replace('report.errors.push(e.stack)','report.errors.push(e.message)');
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));



