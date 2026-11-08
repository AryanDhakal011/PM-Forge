import 'server-only';
import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import {serverDatabase} from '../product/server';
import {AIError} from './provider';
import type {AIConfig} from './config';
import type {Run} from '../product/types';
import {PROMPT_VERSION} from './model';

export type SessionRow={run_id:string;owner:string;local_owner:string;state:string;revision:number;turns:number;mode:string;style:'practice'|'assessment';expires:number;active_until:number;lease_until:number;lease_key:string|null};
export type RequestRow={id:string;run_id:string;turn_id:string;hash:string;expected:number;status:string;result:string|null;attempts:number;retry_at:number;created:number};
export const digest=(text:string)=>createHash('sha256').update(text).digest('hex');
export class AILedger{
 constructor(readonly db:DatabaseSync=serverDatabase()){
  db.exec(`PRAGMA busy_timeout=5000;
   CREATE TABLE IF NOT EXISTS ai_control (key TEXT PRIMARY KEY,value TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS ai_guests (token_hash TEXT PRIMARY KEY,owner TEXT NOT NULL,expires INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS ai_sessions (run_id TEXT PRIMARY KEY,owner TEXT NOT NULL,local_owner TEXT NOT NULL,state TEXT NOT NULL,revision INTEGER NOT NULL,turns INTEGER NOT NULL,mode TEXT NOT NULL,style TEXT NOT NULL,expires INTEGER NOT NULL,active_until INTEGER NOT NULL,lease_until INTEGER NOT NULL DEFAULT 0,lease_key TEXT);
   CREATE TABLE IF NOT EXISTS ai_requests (id TEXT PRIMARY KEY,run_id TEXT NOT NULL,turn_id TEXT NOT NULL,hash TEXT NOT NULL,expected INTEGER NOT NULL,status TEXT NOT NULL,result TEXT,attempts INTEGER NOT NULL,retry_at INTEGER NOT NULL,created INTEGER NOT NULL,UNIQUE(run_id,turn_id));
   CREATE TABLE IF NOT EXISTS ai_turns (run_id TEXT NOT NULL,id TEXT NOT NULL,role TEXT NOT NULL,payload TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(run_id,id));
   CREATE TABLE IF NOT EXISTS ai_usage (id TEXT PRIMARY KEY,run_id TEXT NOT NULL,owner_hash TEXT NOT NULL,day TEXT NOT NULL,month TEXT NOT NULL,at INTEGER NOT NULL,tokens_reserved INTEGER NOT NULL,cost_micro INTEGER NOT NULL,input_tokens INTEGER NOT NULL DEFAULT 0,output_tokens INTEGER NOT NULL DEFAULT 0,thought_tokens INTEGER NOT NULL DEFAULT 0,latency_ms INTEGER NOT NULL DEFAULT 0,outcome TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS ai_daily (owner_hash TEXT NOT NULL,day TEXT NOT NULL,sessions INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(owner_hash,day));
   CREATE TABLE IF NOT EXISTS ai_native (id TEXT PRIMARY KEY,run_id TEXT NOT NULL,expected INTEGER NOT NULL,result TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS ai_policies (run_id TEXT PRIMARY KEY,fingerprint TEXT NOT NULL,model TEXT NOT NULL,transport TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS ai_consents (run_id TEXT PRIMARY KEY,accepted_at INTEGER NOT NULL,region TEXT NOT NULL,adult INTEGER NOT NULL,terms_version TEXT NOT NULL);
   CREATE INDEX IF NOT EXISTS ai_usage_at ON ai_usage(at);
   CREATE INDEX IF NOT EXISTS ai_sessions_owner ON ai_sessions(owner);
  `);
  db.prepare("INSERT OR IGNORE INTO ai_control VALUES('encryption',?)").run(randomBytes(32).toString('hex'));
 }
 transaction<T>(fn:()=>T):T{this.db.exec('BEGIN IMMEDIATE');try{const result=fn();this.db.exec('COMMIT');return result}catch(error){this.db.exec('ROLLBACK');throw error}}
 key(){return Buffer.from((this.db.prepare("SELECT value FROM ai_control WHERE key='encryption'").get() as {value:string}).value,'hex')}
 seal(value:unknown){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',this.key(),iv);const body=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),body]).toString('base64')}
 read<T>(value:string):T{const b=Buffer.from(value,'base64'),cipher=createDecipheriv('aes-256-gcm',this.key(),b.subarray(0,12));cipher.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([cipher.update(b.subarray(28)),cipher.final()]).toString()) as T}
 control(key:string){return (this.db.prepare('SELECT value FROM ai_control WHERE key=?').get(key) as {value:string}|undefined)?.value||''}
 setControl(key:string,value:string){this.db.prepare('INSERT INTO ai_control VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,value)}
 row(run:string,owner:string){const row=this.db.prepare('SELECT * FROM ai_sessions WHERE run_id=?').get(run) as SessionRow|undefined;if(!row||row.owner!==owner)throw new AIError('session-not-owned',404);if(row.expires<Date.now())throw new AIError('session-expired',410);return row}
 cleanup(now=Date.now()){
  const expired=this.db.prepare('SELECT run_id FROM ai_sessions WHERE expires<?').all(now) as {run_id:string}[];
  for(const row of expired)this.erase(row.run_id);
  this.db.prepare('DELETE FROM ai_guests WHERE expires<?').run(now);
  this.db.prepare('DELETE FROM ai_usage WHERE at<?').run(now-90*86400000);
  this.db.prepare('DELETE FROM ai_daily WHERE day<?').run(new Date(now-90*86400000).toISOString().slice(0,10));
 }
 erase(run:string){for(const table of ['ai_requests','ai_turns','ai_native','ai_policies','ai_consents','ai_sessions'])this.db.prepare(`DELETE FROM ${table} WHERE run_id=?`).run(run)}
 policy(c:AIConfig){return digest(JSON.stringify({prompt:PROMPT_VERSION,model:c.model,transport:c.transport,mode:c.mode,maxTurns:c.maxTurns,timebox:c.timebox}))}
 assertPolicy(row:SessionRow,c:AIConfig){const policy=this.db.prepare('SELECT fingerprint FROM ai_policies WHERE run_id=?').get(row.run_id) as {fingerprint:string}|undefined;if(!policy||policy.fingerprint!==this.policy(c))throw new AIError('configuration-changed',409)}
 start(run:Run,owner:string,c:AIConfig,style:'practice'|'assessment',quotaOwner?:string,region=''){
  return this.transaction(()=>{this.cleanup();const existing=this.db.prepare('SELECT * FROM ai_sessions WHERE run_id=?').get(run.id) as SessionRow|undefined;
   if(existing){if(existing.owner!==owner)throw new AIError('session-not-owned',404);this.assertPolicy(existing,c);this.admit(c);this.ensureRoom(existing,c);return this.row(run.id,owner)}
   this.admit(c);
   const day=this.day(),hash=digest(owner),daily=this.db.prepare('SELECT sessions FROM ai_daily WHERE owner_hash=? AND day=?').get(hash,day) as {sessions:number}|undefined;
   if((daily?.sessions||0)>=c.dailySessions)throw new AIError('daily-session-limit',429,3600);
   if(quotaOwner){const bucket=this.db.prepare('SELECT sessions FROM ai_daily WHERE owner_hash=? AND day=?').get(quotaOwner,day) as {sessions:number}|undefined;if((bucket?.sessions||0)>=c.dailySessions)throw new AIError('guest-daily-limit',429,3600)}
   const count=this.db.prepare('SELECT COUNT(*) n FROM ai_sessions WHERE active_until>?').get(Date.now()) as {n:number};
   if(count.n>=c.concurrent)throw new AIError('room-at-capacity',429,30);
   this.db.prepare('INSERT INTO ai_daily VALUES(?,?,1) ON CONFLICT(owner_hash,day) DO UPDATE SET sessions=sessions+1').run(hash,day);
   if(quotaOwner)this.db.prepare('INSERT INTO ai_daily VALUES(?,?,1) ON CONFLICT(owner_hash,day) DO UPDATE SET sessions=sessions+1').run(quotaOwner,day);
   this.db.prepare('INSERT INTO ai_sessions(run_id,owner,local_owner,state,revision,turns,mode,style,expires,active_until) VALUES(?,?,?,?,0,0,?,?,?,?)').run(run.id,owner,run.ownerId,this.seal(run),c.mode,style,Date.now()+86400000,Date.now()+900000);
   this.db.prepare('INSERT INTO ai_policies VALUES(?,?,?,?)').run(run.id,this.policy(c),c.model,c.transport);
   this.db.prepare('INSERT INTO ai_consents VALUES(?,?,?,?,?)').run(run.id,Date.now(),region,1,'gemini-terms-reviewed-2026-11-08');
   return this.row(run.id,owner);
  });
 }
 day(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
 admit(c:AIConfig){if(c.killed||this.control('kill')==='true')throw new AIError('operator-paused',503);const until=Number(this.control('circuit-until'))||0;if(until>Date.now())throw new AIError('provider-cooling-down',503,Math.ceil((until-Date.now())/1000))}
 ensureRoom(row:SessionRow,c:AIConfig){if(row.active_until<=Date.now()){const active=this.db.prepare('SELECT COUNT(*) n FROM ai_sessions WHERE active_until>? AND run_id<>?').get(Date.now(),row.run_id) as {n:number};if(active.n>=c.concurrent)throw new AIError('room-at-capacity',429,30);this.db.prepare('UPDATE ai_sessions SET active_until=? WHERE run_id=?').run(Date.now()+900000,row.run_id)}}
 saveState(row:SessionRow,run:Run,advance=false){if(row.lease_until>Date.now())throw new AIError('turn-in-flight',409,2);this.db.prepare('UPDATE ai_sessions SET state=?,revision=revision+?,active_until=? WHERE run_id=?').run(this.seal(run),advance?1:0,Date.now()+900000,row.run_id);return this.row(row.run_id,row.owner)}
 history(run:string){return (this.db.prepare('SELECT id,role,payload FROM ai_turns WHERE run_id=? ORDER BY created,rowid').all(run) as {id:string;role:'candidate'|'interviewer';payload:string}[]).map(t=>({id:t.id,role:t.role,text:this.read<string>(t.payload)}))}
 reserve(row:SessionRow,input:{requestId:string;turnId:string;hash:string;expected:number;candidate:string;state:Run;tokens:number},c:AIConfig){
  return this.transaction(()=>{
   this.admit(c);row=this.row(row.run_id,row.owner);
   const request=this.db.prepare('SELECT * FROM ai_requests WHERE id=? OR (run_id=? AND turn_id=?)').get(input.requestId,row.run_id,input.turnId) as RequestRow|undefined;
   if(request&&(request.run_id!==row.run_id||request.hash!==input.hash||request.id!==input.requestId))throw new AIError('idempotency-conflict',409);
   if(request?.status==='complete')return {cached:this.read<unknown>(request.result!),attemptId:''};
   this.assertPolicy(row,c);
   if(row.mode!==c.mode)throw new AIError('configuration-changed',409);
   if(row.revision!==input.expected)throw new AIError('revision-conflict',409);
   if(row.lease_until>Date.now())throw new AIError('turn-in-flight',409,2);
   this.ensureRoom(row,c);
   if(request?.retry_at&&request.retry_at>Date.now())throw new AIError('retry-later',429,Math.ceil((request.retry_at-Date.now())/1000));
   if(request&&request.attempts>=2)throw new AIError('retry-limit',429);
   if(!request&&row.turns>=c.maxTurns)throw new AIError('turn-limit',429);
   const now=Date.now(),minute=this.db.prepare('SELECT COUNT(*) n,COALESCE(SUM(tokens_reserved),0) tokens FROM ai_usage WHERE at>?').get(now-60000) as {n:number;tokens:number};
   const requests=this.db.prepare('SELECT COUNT(*) n FROM ai_usage WHERE day=?').get(this.day()) as {n:number};
   if(!c.mock&&(minute.n>=Math.max(1,Math.floor(c.rpm*.7))||minute.tokens+input.tokens>Math.floor(c.tpm*.7)||requests.n>=Math.max(1,Math.floor(c.rpd*.7))))throw new AIError('project-capacity',429,60);
   const cost=c.mode==='production'?Math.ceil(input.tokens*c.inputRate+c.billableOutputReserve*c.outputRate):0;
   const month=new Date().toISOString().slice(0,7),spent=this.db.prepare('SELECT COALESCE(SUM(cost_micro),0) cost FROM ai_usage WHERE month=?').get(month) as {cost:number};
   if(cost&&spent.cost+cost>Math.floor(c.monthlyBudget*1e6))throw new AIError('budget-limit',429,3600);
   const attemptId=crypto.randomUUID();
   this.db.prepare('INSERT INTO ai_usage(id,run_id,owner_hash,day,month,at,tokens_reserved,cost_micro,outcome) VALUES(?,?,?,?,?,?,?,?,?)').run(attemptId,row.run_id,digest(row.owner),this.day(),month,now,input.tokens,cost,'reserved');
   if(!request){this.db.prepare('INSERT INTO ai_requests VALUES(?,?,?,?,?,?,NULL,1,0,?)').run(input.requestId,row.run_id,input.turnId,input.hash,input.expected,'pending',now);this.db.prepare('INSERT INTO ai_turns VALUES(?,?,?,?,?)').run(row.run_id,input.turnId,'candidate',this.seal(input.candidate),now)}
   else this.db.prepare("UPDATE ai_requests SET status='pending',attempts=attempts+1 WHERE id=?").run(input.requestId);
   this.db.prepare('UPDATE ai_sessions SET state=?,turns=turns+?,lease_until=?,lease_key=?,active_until=? WHERE run_id=?').run(this.seal(input.state),request?0:1,now+c.timeoutMs+8000,attemptId,now+900000,row.run_id);
   return {attemptId,cached:null};
  });
 }
 finish(run:string,owner:string,requestId:string,attemptId:string,result:unknown,usage:{inputTokens:number;outputTokens:number;thoughtTokens:number;latencyMs:number},failure?:AIError){
  return this.transaction(()=>{const row=this.row(run,owner);if(row.lease_key!==attemptId)throw new AIError('lease-expired',409);
   this.db.prepare('UPDATE ai_usage SET input_tokens=?,output_tokens=?,thought_tokens=?,latency_ms=?,outcome=? WHERE id=?').run(usage.inputTokens,usage.outputTokens,usage.thoughtTokens,usage.latencyMs,failure?.code||'success',attemptId);
   // Reservations stay charged when usage is unknown, including timeouts and rejected output.
   this.db.prepare('UPDATE ai_sessions SET lease_until=0,lease_key=NULL,revision=revision+? WHERE run_id=?').run(failure?0:1,run);
   if(failure){this.db.prepare("UPDATE ai_requests SET status='failed',retry_at=? WHERE id=?").run(Date.now()+failure.retryAfter*1000,requestId);const n=Number(this.control('failures'))+1;this.setControl('failures',String(n));if(n>=3||failure.code==='provider-quota')this.setControl('circuit-until',String(Date.now()+Math.max(60,failure.retryAfter)*1000))}
   else{this.db.prepare("UPDATE ai_requests SET status='complete',result=? WHERE id=?").run(this.seal(result),requestId);const message=(result as {message:string}).message;this.db.prepare('INSERT OR IGNORE INTO ai_turns VALUES(?,?,?,?,?)').run(run,'reply-'+requestId,'interviewer',this.seal(message),Date.now());this.setControl('failures','0')}
  });
 }
}
