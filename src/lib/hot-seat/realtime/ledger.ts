import 'server-only';
import {randomInt,randomUUID} from 'node:crypto';
import type {z} from 'zod';
import {AILedger,digest} from '@/lib/interview-ai/ledger';
import {AIError} from '@/lib/interview-ai/provider';
import {createSeat,withCurveball,type SeatSession} from '../model';
import {guardSpokenSentence} from './prompt';
import {REALTIME_CONSENT,REALTIME_PROMPT_VERSION,realtimeStack,realtimeBlocker,type RealtimeConfig} from './config';
import type {rtRequest,workerEvent} from './contracts';
type RoomRow={run_id:string;room:string;status:string;deadline:number;heartbeat:number;started:number;last_tick:number;month:string;reserved_micro:number;worker_id:string|null};
export class RealtimeLedger {
  constructor(readonly ledger=new AILedger()) {
    ledger.db.exec(`CREATE TABLE IF NOT EXISTS hotseat_rt_rooms(run_id TEXT PRIMARY KEY,room TEXT NOT NULL UNIQUE,status TEXT NOT NULL,deadline INTEGER NOT NULL,heartbeat INTEGER NOT NULL DEFAULT 0,started INTEGER NOT NULL DEFAULT 0,last_tick INTEGER NOT NULL DEFAULT 0,month TEXT NOT NULL,reserved_micro INTEGER NOT NULL,worker_id TEXT);
      CREATE TABLE IF NOT EXISTS hotseat_rt_events(event_id TEXT PRIMARY KEY,run_id TEXT NOT NULL,hash TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS hotseat_rt_metrics(event_id TEXT PRIMARY KEY,run_id TEXT NOT NULL,stage TEXT NOT NULL,ms REAL NOT NULL,input_tokens INTEGER NOT NULL,output_tokens INTEGER NOT NULL,characters INTEGER NOT NULL,at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS hotseat_rt_daily(owner_hash TEXT NOT NULL,day TEXT NOT NULL,n INTEGER NOT NULL,PRIMARY KEY(owner_hash,day));`);
    const expired=ledger.db.prepare('SELECT a.run_id FROM ai_sessions a JOIN hotseat_rt_rooms r ON r.run_id=a.run_id WHERE a.expires<=?').all(Date.now()) as {run_id:string}[];
    for(const row of expired)this.erase(row.run_id,(ledger.db.prepare('SELECT owner FROM ai_sessions WHERE run_id=?').get(row.run_id) as {owner:string}).owner,true);
    ledger.db.prepare('DELETE FROM hotseat_rt_metrics WHERE at<?').run(Date.now()-90*86400000);
    ledger.db.prepare('DELETE FROM hotseat_rt_daily WHERE day<?').run(new Date(Date.now()-90*86400000).toISOString().slice(0,10));
  }
  assertEnabled(c:RealtimeConfig) {
    if(realtimeBlocker(c)||this.ledger.control('kill')==='true'||this.ledger.control('rt-kill')==='true')throw new AIError('realtime-unavailable',503);
  }
  room(id:string){const row=this.ledger.db.prepare('SELECT * FROM hotseat_rt_rooms WHERE run_id=?').get(id) as RoomRow|undefined;if(!row)throw new AIError('session-not-found',404);return row;}
  state(id:string,owner:string){const row=this.ledger.row(id,owner);this.room(id);return this.ledger.read<SeatSession>(row.state);}
  save(s:SeatSession){this.ledger.db.prepare('UPDATE ai_sessions SET state=?,revision=? WHERE run_id=?').run(this.ledger.seal(s),s.revision,s.id);}
  start(input:Extract<z.infer<typeof rtRequest>,{action:'start'}>,owner:string,quotaOwner:string|undefined,c:RealtimeConfig) {
    this.assertEnabled(c);
    return this.ledger.transaction(()=>{
      const old=this.ledger.db.prepare('SELECT owner FROM ai_sessions WHERE run_id=?').get(input.id) as {owner:string}|undefined;
      if(old){if(old.owner!==owner)throw new AIError('session-not-owned',404);const s=this.state(input.id,owner);if(s.ownerId!==input.localOwnerId||JSON.stringify(s.options)!==JSON.stringify(input.options))throw new AIError('idempotency-conflict',409);return s;}
      if(input.options.persona==='ellis')throw new AIError('persona-retired',400);
      const now=Date.now(),day=new Date(now).toISOString().slice(0,10),month=day.slice(0,7);
      if(this.ledger.db.prepare("SELECT 1 FROM hotseat_rt_rooms r JOIN ai_sessions s ON s.run_id=r.run_id WHERE s.owner=? AND r.deadline>? AND r.status IN ('reserved','connecting','live')").get(owner,now))throw new AIError('active-session-exists',409);
      const active=this.ledger.db.prepare("SELECT COUNT(*) n FROM hotseat_rt_rooms WHERE deadline>? AND status IN ('reserved','connecting','live')").get(now) as {n:number};
      if(active.n>=c.concurrent)throw new AIError('room-at-capacity',429,30);
      for(const hash of [digest(owner),quotaOwner].filter(Boolean) as string[]) {
        const row=this.ledger.db.prepare('SELECT n FROM hotseat_rt_daily WHERE owner_hash=? AND day=?').get(hash,day) as {n:number}|undefined;
        if((row?.n||0)>=c.daily)throw new AIError('daily-session-limit',429,3600);
      }
      const reserve=Math.ceil(c.reservation*1e6),used=this.ledger.db.prepare('SELECT COALESCE(SUM(reserved_micro),0) n FROM hotseat_rt_rooms WHERE month=?').get(month) as {n:number};
      if(used.n+reserve>Math.floor(c.budget*1e6))throw new AIError('budget-limit',429,3600);
      for(const hash of [digest(owner),quotaOwner].filter(Boolean) as string[])this.ledger.db.prepare('INSERT INTO hotseat_rt_daily VALUES(?,?,1) ON CONFLICT(owner_hash,day) DO UPDATE SET n=n+1').run(hash,day);
      const s=createSeat(input.localOwnerId,input.options,input.id,randomInt(0,600),c.maxTurns,'realtime');
      s.realtime={version:1,consentVersion:REALTIME_CONSENT,promptVersion:REALTIME_PROMPT_VERSION,stack:realtimeStack(c,s.options.persona)};
      this.ledger.db.prepare('INSERT INTO ai_sessions(run_id,owner,local_owner,state,revision,turns,mode,style,expires,active_until) VALUES(?,?,?,?,0,0,?,?,?,?)').run(s.id,owner,s.ownerId,this.ledger.seal(s),'production','assessment',now+86400000,now+c.maxSeconds*1000+120000);
      this.ledger.db.prepare('INSERT INTO hotseat_rt_rooms(run_id,room,status,deadline,month,reserved_micro) VALUES(?,?,?,?,?,?)').run(s.id,'rt-'+randomUUID(),'reserved',now+c.maxSeconds*1000+120000,month,reserve);
      return s;
    });
  }
  claim(id:string,owner:string,c:RealtimeConfig) {
    this.assertEnabled(c);return this.ledger.transaction(()=>{
      const s=this.state(id,owner),r=this.room(id);
      if(s.realtime?.promptVersion!==REALTIME_PROMPT_VERSION||JSON.stringify(s.realtime.stack)!==JSON.stringify(realtimeStack(c,s.options.persona)))throw new AIError('configuration-changed',409);
      if(s.status==='complete'||r.deadline<Date.now()||r.status==='ended')throw new AIError('conversation-complete',409);
      if(r.status==='connecting')throw new AIError('room-connecting',409,3);
      if(r.status==='live')return {session:s,room:r,dispatch:false};
      if(r.status==='paused') {
        if(this.ledger.db.prepare("SELECT 1 FROM hotseat_rt_rooms r JOIN ai_sessions s ON s.run_id=r.run_id WHERE s.owner=? AND r.run_id<>? AND r.deadline>? AND r.status IN ('reserved','connecting','live')").get(owner,id,Date.now()))throw new AIError('active-session-exists',409);
        const active=this.ledger.db.prepare("SELECT COUNT(*) n FROM hotseat_rt_rooms WHERE deadline>? AND status IN ('reserved','connecting','live')").get(Date.now()) as {n:number};
        if(active.n>=c.concurrent)throw new AIError('room-at-capacity',429,30);
        r.room='rt-'+randomUUID();s.status='active';s.revision++;this.save(s);
        this.ledger.db.prepare('UPDATE hotseat_rt_rooms SET room=?,worker_id=NULL,last_tick=0 WHERE run_id=?').run(r.room,id);
      }
      this.ledger.db.prepare("UPDATE hotseat_rt_rooms SET status='connecting' WHERE run_id=?").run(id);
      return {session:s,room:r,dispatch:true};
    });
  }
  disconnected(id:string,owner:string,end:boolean) {
    return this.ledger.transaction(()=>{
      const s=this.state(id,owner),r=this.room(id);
      s.status=end?'complete':'paused';s.revision++;s.updatedAt=new Date().toISOString();this.save(s);
      this.ledger.db.prepare('UPDATE hotseat_rt_rooms SET status=? WHERE run_id=?').run(end?'ended':'paused',id);
      this.ledger.db.prepare('UPDATE ai_sessions SET active_until=0 WHERE run_id=?').run(id);
      return {session:s,room:r.room};
    });
  }
  event(input:z.infer<typeof workerEvent>,c:RealtimeConfig) {
    this.assertEnabled(c);return this.ledger.transaction(()=>{
      const r=this.room(input.id);
      if(input.room!==r.room||r.deadline<Date.now()||!['connecting','live'].includes(r.status))throw new AIError('worker-lease-ended',409);
      if(r.worker_id&&r.worker_id!==input.workerId)throw new AIError('worker-already-claimed',409);
      if(input.kind==='bootstrap')this.ledger.db.prepare('UPDATE hotseat_rt_rooms SET worker_id=? WHERE run_id=?').run(input.workerId,input.id);
      else if(!r.worker_id)throw new AIError('worker-not-claimed',409);
      const owner=(this.ledger.db.prepare('SELECT owner FROM ai_sessions WHERE run_id=?').get(input.id) as {owner:string}).owner;
      const s=this.state(input.id,owner),now=Date.now();
      if(s.realtime?.promptVersion!==REALTIME_PROMPT_VERSION||JSON.stringify(s.realtime.stack)!==JSON.stringify(realtimeStack(c,s.options.persona)))throw new AIError('configuration-changed',409);
      if(input.kind==='heartbeat'||input.kind==='bootstrap') {
        if(input.kind==='heartbeat') {
          if(r.last_tick)s.elapsedMs+=Math.min(30000,now-r.last_tick);
          s.updatedAt=new Date().toISOString();this.save(s);
          this.ledger.db.prepare("UPDATE hotseat_rt_rooms SET status='live',heartbeat=?,last_tick=?,started=CASE WHEN started=0 THEN ? ELSE started END WHERE run_id=?").run(now,now,now,input.id);
        }
        return {session:s,deadline:r.deadline,participant:'candidate-'+digest(owner+input.id).slice(0,20)};
      }
      const hash=digest(JSON.stringify(input)),old=this.ledger.db.prepare('SELECT hash FROM hotseat_rt_events WHERE event_id=?').get(input.eventId) as {hash:string}|undefined;
      if(old){if(old.hash!==hash)throw new AIError('idempotency-conflict',409);return {session:s,duplicate:true};}
      if(input.kind==='turn') {
        if(input.role==='ai')guardSpokenSentence(input.text,s);
        const n=s.turns.filter(t=>t.who==='user').length;
        if(input.role==='user'&&n>=s.maxTurns)throw new AIError('turn-limit',429);
        s.turns.push({id:input.eventId,who:input.role,text:input.text,source:input.role==='user'?'voice':'realtime',at:now,interrupted:input.interrupted});
        if(input.role==='user')Object.assign(s,withCurveball(s));
        s.revision++;s.updatedAt=new Date(now).toISOString();this.save(s);
      } else if(input.kind==='observations') {
        for(const observation of input.observations) {
          const candidate=s.turns.find(t=>t.id===observation.turnId&&t.who==='user');
          if(!candidate||!candidate.text.includes(observation.quote)||observation.quote.split(/\s+/).length>20||observation.note.split(/\s+/).length>12)throw new AIError('unsupported-observation',502);
        }
        s.observations.push(...input.observations);s.revision++;this.save(s);
      } else this.ledger.db.prepare('INSERT INTO hotseat_rt_metrics VALUES(?,?,?,?,?,?,?,?)').run(input.eventId,input.id,input.stage,input.ms,input.inputTokens,input.outputTokens,input.characters,now);
      this.ledger.db.prepare('INSERT INTO hotseat_rt_events VALUES(?,?,?)').run(input.eventId,input.id,hash);
      return {session:s,duplicate:false};
    });
  }
  erase(id:string,owner:string,expired=false) {
    if(!expired)this.state(id,owner);
    this.ledger.transaction(()=>{
      this.ledger.db.prepare('DELETE FROM hotseat_rt_metrics WHERE run_id=?').run(id);
      this.ledger.db.prepare('DELETE FROM hotseat_rt_events WHERE run_id=?').run(id);
      // Keep anonymous budget reservations, never the transcript/owner, after deletion.
      this.ledger.db.prepare("UPDATE hotseat_rt_rooms SET status='ended' WHERE run_id=?").run(id);
    });
    this.ledger.erase(id);
  }
}
