import {sceneById,people} from './content';
import {createState,type State} from './engine';
export const PREFIX='pmforge.legacy-fracture.v1';
export function checksum(text:string){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
export function encode(s:State){const payload=JSON.stringify(s);return JSON.stringify({version:1,payload,checksum:checksum(payload)})}
export function decode(raw:string|null):State|null{try{
 const envelope=JSON.parse(raw||'null');if(envelope?.version!==1||typeof envelope.payload!=='string'||checksum(envelope.payload)!==envelope.checksum)return null;
 const s=JSON.parse(envelope.payload) as State;
 if(s.version!==1||typeof s.id!=='string'||!Number.isInteger(s.seed)||!Number.isInteger(s.week)||s.week<1||s.week>9||!sceneById[s.scene]||![1,2,3].includes(s.chapter)||!['guided','standard','sharp'].includes(s.difficulty))return null;
 for(const k of ['marks','rapportActions','tapes','discovered','pocScopes','boardCards','holds','recap','eventsSeen','history','receipts','telemetry','rewinds'])if(!Array.isArray(s[k as keyof State]))return null;
 for(const k of ['attention','credibility','mandate','parity','friction','rng','budget','adoption'])if(!Number.isFinite(s[k as keyof State]))return null;
 if(s.attention<0||s.attention>6||!s.waves||!s.checklist||!s.trust)return null;
 for(const p of people)if(!Number.isFinite(s.trust[p.id]))return null;
 if(s.undo?.undo||s.undo?.checkpoint||s.checkpoint?.undo||s.checkpoint?.checkpoint)return null;
 return {...createState(s.seed,s.difficulty),...s}
}catch{return null}}
export function save(s:State,storage:Storage=localStorage){const key=PREFIX+':'+s.id,old=storage.getItem(key),raw=encode(s);storage.setItem(key+':pending',raw);if(old)storage.setItem(key+':backup',old);storage.setItem(key,raw);storage.removeItem(key+':pending');storage.setItem(PREFIX+':latest',s.id)}
export function load(id:string,storage:Storage=localStorage){const key=PREFIX+':'+id;return decode(storage.getItem(key))||decode(storage.getItem(key+':backup'))||decode(storage.getItem(key+':pending'))}
export function list(storage:Storage=localStorage){const result:State[]=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(PREFIX+':')&&!/:(latest|backup|pending)$/.test(key)){const s=load(key.slice(PREFIX.length+1),storage);if(s)result.push(s)}}const latest=storage.getItem(PREFIX+':latest');return result.sort((a,b)=>a.id===latest?-1:b.id===latest?1:0)}
