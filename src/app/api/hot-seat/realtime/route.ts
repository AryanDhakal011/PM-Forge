import {AccessToken,AgentDispatchClient,RoomServiceClient,TrackSource} from 'livekit-server-sdk';
import {validOrigin} from '@/lib/product/server';
import {limitedBody} from '@/lib/portfolio/request';
import {AILedger,digest} from '@/lib/interview-ai/ledger';
import {AIError} from '@/lib/interview-ai/provider';
import {seatAccess,seatRequestLimit} from '@/lib/hot-seat/access';
import {rtRequest} from '@/lib/hot-seat/realtime/contracts';
import {realtimeConfig,realtimeBlocker,REALTIME_CONSENT} from '@/lib/hot-seat/realtime/config';
import {RealtimeLedger} from '@/lib/hot-seat/realtime/ledger';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function GET() {
  const c=realtimeConfig(),ledger=new AILedger();
  const reason=realtimeBlocker(c)||(ledger.control('kill')==='true'||ledger.control('rt-kill')==='true'?'Realtime voice is paused by the operator.':null);
  return Response.json({available:!reason,reason,providers:'LiveKit (voice transport), Deepgram (transcription), Cerebras (conversation), Inworld (synthetic speech)',consentVersion:REALTIME_CONSENT,region:c.region,maxTurns:c.maxTurns,maxSeconds:c.maxSeconds},{headers});
}
export async function POST(request:Request) {
  let cookie:string|undefined;
  try {
    if(!validOrigin(request))throw new AIError('origin-rejected',403);
    const input=rtRequest.parse(JSON.parse(new TextDecoder().decode(await limitedBody(request,12000))));
    const base=new AILedger(),store=new RealtimeLedger(base),c=realtimeConfig();
    seatRequestLimit(request,base);
    const identity=await seatAccess(request,base,input.action==='start',input.action==='start'?undefined:input.id);
    cookie=identity.cookie;
    const ok=(body:unknown)=>Response.json(body,{headers:{...headers,...(cookie?{'Set-Cookie':cookie}:{})}});
    if(input.action==='start')return ok({session:store.start(input,identity.owner,identity.quotaOwner,c)});
    const session=store.state(input.id,identity.owner);
    if(input.action==='status')return ok({session});
    const host=c.url.replace(/^wss:/,'https:');
    if(input.action==='pause'||input.action==='end'||input.action==='delete') {
      const result=store.disconnected(input.id,identity.owner,input.action!=='pause');
      // Revoking the application lease happens first. Worker heartbeat then fails closed even if room deletion is unavailable.
      if(c.key&&c.secret&&c.url)await new RoomServiceClient(host,c.key,c.secret,{requestTimeout:8}).deleteRoom(result.room).catch(()=>{});
      if(input.action==='delete'){store.erase(input.id,identity.owner);return ok({deleted:true});}
      return ok({session:result.session});
    }
    const claim=store.claim(input.id,identity.owner,c);
    if(claim.dispatch) {
      try {
        await new RoomServiceClient(host,c.key,c.secret,{requestTimeout:8}).createRoom({name:claim.room.room,maxParticipants:2,emptyTimeout:60,departureTimeout:20});
        const dispatcher=new AgentDispatchClient(host,c.key,c.secret,{requestTimeout:8});
        const existing=await dispatcher.listDispatch(claim.room.room);
        if(!existing.some(d=>d.agentName===c.agentName))await dispatcher.createDispatch(claim.room.room,c.agentName,{metadata:JSON.stringify({id:session.id,room:claim.room.room})});
        base.db.prepare("UPDATE hotseat_rt_rooms SET status='live' WHERE run_id=? AND status='connecting'").run(session.id);
      } catch {
        base.db.prepare("UPDATE hotseat_rt_rooms SET status='reserved' WHERE run_id=? AND status='connecting'").run(session.id);
        throw new AIError('voice-room-unavailable',503,5);
      }
    }
    const participant='candidate-'+digest(identity.owner+session.id).slice(0,20);
    const token=new AccessToken(c.key,c.secret,{identity:participant,ttl:120});
    token.addGrant({roomJoin:true,room:claim.room.room,canSubscribe:true,canPublish:true,canPublishSources:[TrackSource.MICROPHONE],canPublishData:true,canUpdateOwnMetadata:false});
    return ok({url:c.url,token:await token.toJwt(),room:claim.room.room,participant,deadline:claim.room.deadline,session:claim.session});
  }catch(error){
    const e=error instanceof AIError?error:new AIError('invalid-request',400);
    return Response.json({error:e.code,retryAfter:e.retryAfter},{status:e.status,headers:{...headers,...(cookie?{'Set-Cookie':cookie}:{}),...(e.retryAfter?{'Retry-After':String(e.retryAfter)}:{})}});
  }
}
