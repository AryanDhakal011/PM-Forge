import {limitedBody} from '@/lib/portfolio/request';
import {AIError} from '@/lib/interview-ai/provider';
import {realtimeConfig} from '@/lib/hot-seat/realtime/config';
import {validWorkerSignature} from '@/lib/hot-seat/realtime/signature';
import {workerEvent} from '@/lib/hot-seat/realtime/contracts';
import {RealtimeLedger} from '@/lib/hot-seat/realtime/ledger';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request) {
  try {
    const body=new TextDecoder().decode(await limitedBody(request,22000)),c=realtimeConfig();
    if(!validWorkerSignature(body,request.headers.get('x-pmforge-timestamp'),request.headers.get('x-pmforge-signature'),c.workerSecret))throw new AIError('worker-authentication-required',401);
    const input=workerEvent.parse(JSON.parse(body)),result=new RealtimeLedger().event(input,c);
    return Response.json(result,{headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    const e=error instanceof AIError?error:new AIError('invalid-worker-event',400);
    return Response.json({error:e.code},{status:e.status,headers:{'Cache-Control':'no-store'}});
  }
}
