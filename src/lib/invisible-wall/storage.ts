import { createState, type State } from "./engine";
import { sceneById, clueInfo } from "./content";
export const PREFIX="pmforge.invisible-wall.v1";
type Envelope={version:1;payload:string;checksum:string};
export function checksum(text:string){let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(16);}
export function encode(state:State):string{const payload=JSON.stringify(state);return JSON.stringify({version:1,payload,checksum:checksum(payload)});}
export function decode(raw:string|null):State|null{
 try{const e:Envelope=JSON.parse(raw||"null");if(!e||e.version!==1||typeof e.payload!=="string"||checksum(e.payload)!==e.checksum)return null;const s=JSON.parse(e.payload);
 if(s.version!==1||typeof s.id!=="string"||!sceneById[s.scene]||!['brief','act','react'].includes(s.phase)||!Array.isArray(s.clues)||!s.clues.every((c:string)=>c in clueInfo)||!Array.isArray(s.trace)||!Array.isArray(s.history)||!s.flags||!s.trust||!s.sim||!Number.isFinite(s.clock)||!Number.isFinite(s.heat)||s.heat<0||s.heat>100||!Number.isInteger(s.line)||s.line<0||s.line>10)return null;
 for(const key of ['compute','clearance','velocity','capability','stability','seed'])if(!Number.isFinite(s[key]))return null;
 if(!Array.isArray(s.tests)||!Array.isArray(s.marks)||!Array.isArray(s.route)||!Array.isArray(s.sim.samples)||!s.sim.controls||typeof s.reflection!=="string")return null;
 return {...createState(s.seed),...s};
 }catch{return null;}
}
export function save(state:State,storage:Storage=localStorage){const key=`${PREFIX}:${state.id}`,pending=key+':pending',previous=storage.getItem(key);const encoded=encode(state);storage.setItem(pending,encoded);if(previous)storage.setItem(key+':backup',previous);storage.setItem(key,encoded);storage.removeItem(pending);storage.setItem(PREFIX+':latest',state.id);}
export function load(id:string,storage:Storage=localStorage){const key=PREFIX+':'+id;return decode(storage.getItem(key))||decode(storage.getItem(key+':backup'))||decode(storage.getItem(key+':pending'));}
export function list(storage:Storage=localStorage){const result:State[]=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(!key?.startsWith(PREFIX+':')||key.endsWith(':latest')||key.endsWith(':backup')||key.endsWith(':pending'))continue;const s=load(key.slice(PREFIX.length+1),storage);if(s)result.push(s);}const latest=storage.getItem(PREFIX+':latest');return result.sort((a,b)=>a.id===latest?-1:b.id===latest?1:0);}
