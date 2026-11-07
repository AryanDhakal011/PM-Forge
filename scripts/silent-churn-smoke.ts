import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {objections,type Dataset,type Event} from '../src/lib/silent-churn/content';
import {ending,simulatePolicy} from '../src/lib/silent-churn/engine';

async function main(){
 const catalog=JSON.parse(readFileSync('content/silent-churn/datasets/chapter-3.json','utf8')) as Dataset[];
 const deck=JSON.parse(readFileSync('content/silent-churn/events/deck.json','utf8')) as Event[];
 const seenEvents=new Set<string>(),seenObjections=new Set<string>(),paths=[];
 for(const seed of [41,21812,577,9081,314159])for(const policy of ['Coalition-first','Bold'] as const){
  const s=await simulatePolicy(seed,policy,catalog,deck,false);
  assert.equal(s.stage,'review');
  assert.ok(s.day<=21);
  assert.ok(s.queue.length===15||s.queue.length===23);
  assert.ok(s.receipts.every(r=>r.effects.every(e=>Number.isFinite(e.before)&&Number.isFinite(e.after))));
  for(const e of s.eventSeen)seenEvents.add(e);
  for(const q of s.queue)seenObjections.add(q.id);
  paths.push({seed,policy,day:s.day,approval:s.approval,ending:ending(s),deployed:s.window.deployed,crashed:s.window.crashed,events:s.eventSeen.length,objections:s.queue.length,receipts:s.receipts.length});
 }
 const report={paths,coverage:{eventsFired:[...seenEvents].sort(),eventsUnfired:deck.map(e=>e.id).filter(id=>!seenEvents.has(id)),objectionsShown:[...seenObjections].sort(),objectionsUnshown:objections.map(o=>o.id).filter(id=>!seenObjections.has(id))}};
 mkdirSync('docs/silent-churn-verification',{recursive:true});
 writeFileSync('docs/silent-churn-verification/balance.json',JSON.stringify(report,null,2));
 console.log(`Silent Churn: ${paths.length} complete seeded paths; ${seenEvents.size}/${deck.length} event types, ${seenObjections.size}/${objections.length} objections observed. Unfired IDs recorded.`);
}
void main().catch(e=>{console.error(e);process.exitCode=1});
