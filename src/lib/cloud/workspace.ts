import 'server-only';
import {z} from 'zod';
import {exportSchema} from '../product/schema';
import {limitedBody} from '../portfolio/request';
import {cloudClient,cloudMember} from './server';
const headers={'Cache-Control':'no-store'};
export async function cloudWorkspace(request:Request){
  try{
    if(request.method==='PUT'&&request.headers.get('origin')!==new URL(process.env.SITE_URL||request.url).origin)return Response.json({error:'Origin rejected.'},{status:403,headers});
    const member=await cloudMember();if(!member)return Response.json({error:'Sign in to sync.'},{status:401,headers});
    const client=await cloudClient();
    const {data:limited,error:limitError}=request.method==='GET'?await client.rpc('pmforge_take_request',{bucket:'workspace',maximum:120}):{data:true,error:null};
    if(limitError)throw Error();if(limited===false)return Response.json({error:'Please retry shortly.'},{status:429,headers:{...headers,'Retry-After':'60'}});
    if(request.method==='GET'){
      const {data,error}=await client.from('pmforge_workspaces').select('version,data').eq('owner_id',member.user.id).maybeSingle();if(error)throw Error();
      return Response.json({version:data?.version||0,data:data?.data||null},{headers});
    }
    let body;
    try{body=z.object({version:z.number().int().nonnegative(),data:exportSchema}).strict().parse(JSON.parse(new TextDecoder().decode(await limitedBody(request,1024*1024))));}catch{return Response.json({error:'Invalid workspace or sync payload exceeds 1 MB. Export a device backup.'},{status:400,headers});}
    const d=body.data;
    if(d.profile.id!==member.user.id||[...d.runs,...d.records,...d.bookmarks,...(d.projectRuns||[]),...(d.career?.profiles||[]),...(d.career?.cases||[]),...(d.career?.resumes||[]),...(d.career?.jobs||[])].some(row=>row.ownerId!==member.user.id))return Response.json({error:'Ownership mismatch.'},{status:403,headers});
    d.projectRuns=d.projectRuns?.map(run=>run.includeNotes?run:{...run,draft:{...run.draft,rationale:''},decisions:run.decisions.map(decision=>({...decision,rationale:''}))});
    const {data:version,error}=await client.rpc('pmforge_save_workspace',{expected:body.version,document:d});
    if(error){if(error.message.includes('request-limit'))return Response.json({error:'Please retry in a minute.'},{status:429,headers});if(error.message.includes('workspace-conflict'))return Response.json({error:'Your account changed in another tab. Retry sync to merge the latest version.'},{status:409,headers});throw Error();}
    return Response.json({version},{headers});
  }catch{return Response.json({error:'Cloud sync could not connect. Your device work is unchanged.'},{status:503,headers});}
}
