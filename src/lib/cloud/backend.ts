import type {SupabaseClient} from '@supabase/supabase-js';
import {z} from 'zod';
import {validateCloudPublication} from '../portfolio/publication';
import {limitedBody} from '../portfolio/request';
import {cleanPublicArtifact} from './artifacts';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const slug=z.string().regex(/^[a-z0-9][a-z0-9-]{2,29}$/),identifier=z.string().regex(/^[-\w]{1,150}$/);
const hash=async(text:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(n=>n.toString(16).padStart(2,'0')).join('');
const encoded=(bytes:Uint8Array)=>{let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);};
const equal=(a:string,b:string)=>{let difference=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)difference|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return difference===0;};
export function createCloudBackend(admin:SupabaseClient){
  return async(request:Request)=>{
    if(request.method!=='POST')return reply({error:'Use POST.'},405);
    try{
      const input=JSON.parse(new TextDecoder().decode(await limitedBody(request,4_100_000))),action=z.enum(['health','read','asset','event','handle','publish','revoke','owner','delete-account']).parse(input.action);
      if(action==='health'){const r=await admin.from('pmforge_workspaces').select('version').limit(1);return r.error?reply({error:'Cloud schema unavailable.'},503):reply({status:'ready',storage:'postgres'});}
      let member:{id:string;email_confirmed_at?:string}|null=null;
      if(['handle','publish','revoke','owner','delete-account'].includes(action)){
        const token=request.headers.get('authorization')?.replace(/^Bearer /i,'');
        if(!token)return reply({error:'Sign in to continue.'},401);
        const verified=await admin.auth.getUser(token);if(verified.error||!verified.data.user)return reply({error:'Sign in again to continue.'},401);
        member=verified.data.user;
        const claims=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
        const live=await admin.rpc('pmforge_validate_session',{actor:member.id,session:claims.session_id});
        if(live.error||live.data!==true)return reply({error:'This session has ended. Sign in again.'},401);
      }
      if(action==='delete-account'){
        const deleted=await admin.auth.admin.deleteUser(member!.id);if(deleted.error)throw deleted.error;return reply({deleted:true});
      }
      const handle=slug.parse(input.slug??input.snapshot?.slug);
      const budget=await admin.rpc('pmforge_service_limit',{actor:member?.id||null,bucket:action==='publish'?'publish':member?'workspace':action==='event'?'public-event':'public-read',maximum:action==='publish'?10:member?120:1000});
      if(budget.error)throw budget.error;if(budget.data!==true)return reply({error:'Capacity reached. Please retry in a minute.'},429);
      if(action==='handle'){
        const r=await admin.from('pmforge_portfolios').select('owner_id').eq('slug',handle).maybeSingle();if(r.error)throw r.error;return reply({available:!r.data||r.data.owner_id===member!.id});
      }
      if(action==='publish'){
        if(!member!.email_confirmed_at)return reply({error:'Verify your email before publishing.'},403);
        let publication;try{publication=validateCloudPublication(input.snapshot);}catch(error){return reply({error:error instanceof Error?error.message:'Review the publication details.'},400);}
        const supplied=z.array(z.object({id:identifier,data:z.string().max(1398104)}).strict()).max(20).parse(input.assets);
        const required=publication.data.cases.flatMap(c=>[...c.artifactIds,...(c.audioConsent?[c.id+'-audio']:[])]);
        if(required.length!==supplied.length||new Set(supplied.map(a=>a.id)).size!==supplied.length||required.some(id=>!supplied.some(a=>a.id===id)))return reply({error:'Include exactly the selected, approved artifacts.'},400);
        const assets=[];
        for(const asset of supplied){
          const bytes=Uint8Array.from(atob(asset.data),char=>char.charCodeAt(0));if(!bytes.length||bytes.length>1048576)return reply({error:'Each published artifact must be at most 1 MB.'},413);
          let clean;try{clean=cleanPublicArtifact(bytes);}catch{return reply({error:'Use a valid PNG of at most four megapixels or a WAV snippet, each under 1 MB.'},400);}
          assets.push({id:asset.id,mime:clean.mime,data:encoded(clean.bytes),bytes:clean.bytes.length});
        }
        if(assets.reduce((sum,a)=>sum+a.bytes,0)>2097152)return reply({error:'A free hosted portfolio can include up to 2 MB of approved artifacts. Your originals stay on this device.'},413);
        const fingerprint=await hash(JSON.stringify(publication.data)),requestHash=await hash(JSON.stringify({publication,assets})),random=new Uint8Array(32);crypto.getRandomValues(random);const capability=encoded(random).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
        const saved=await admin.rpc('pmforge_publish_portfolio',{actor:member!.id,handle,visibility:publication.mode,snapshot:publication.data,capability,fingerprint_value:fingerprint,request_value:requestHash,expiry:new Date(Date.now()+publication.days*86400000).toISOString(),assets});
        if(saved.error){const reason=saved.error.message;return reply({error:reason.includes('handle-owned')?'That handle belongs to another account.':reason.includes('capacity')||reason.includes('storage-limit')?'Cloud storage capacity reached. Export or reduce the selected artifacts.':reason.includes('portfolio-limit')?'Revoke an earlier portfolio before creating another handle.':'Publishing could not finish. Your local portfolio is safe.'},reason.includes('handle-owned')?409:503);}
        const result=saved.data;return reply({...result,path:'/p/'+handle+(publication.mode==='public'?'':'?t='+result.token)});
      }
      const found=await admin.from('pmforge_portfolios').select('*').eq('slug',handle).maybeSingle();if(found.error)throw found.error;const share=found.data;
      if(!share||new Date(share.expires).getTime()<=Date.now())return reply({error:'Portfolio unavailable.'},404);
      if(action==='owner'||action==='revoke'){
        if(share.owner_id!==member!.id)return reply({error:'Owner account required.'},403);
        if(action==='revoke'){const r=await admin.from('pmforge_portfolios').delete().eq('slug',handle).eq('owner_id',member!.id);if(r.error)throw r.error;return reply({revoked:true});}
        const [events,comments]=await Promise.all([admin.from('pmforge_portfolio_events').select('event,n').eq('slug',handle),admin.from('pmforge_portfolio_comments').select('id,case_id,author,body,created_at').eq('slug',handle).order('created_at',{ascending:false}).limit(100)]);
        if(events.error||comments.error)throw Error();const counts=new Map<string,number>();for(const row of events.data||[])counts.set(row.event,(counts.get(row.event)||0)+row.n);return reply({events:[...counts].map(([event,count])=>({event,count})),comments:comments.data});
      }
      if(share.mode!=='public'&&!equal(await hash(String(input.token||'')),share.token_hash))return reply({error:'Portfolio unavailable.'},404);
      if(action==='read')return reply({share:{slug:handle,mode:share.mode,data:share.data,expires:new Date(share.expires).getTime(),fingerprint:share.fingerprint}});
      if(action==='asset'){const id=identifier.parse(input.id),asset=await admin.from('pmforge_portfolio_assets').select('mime,data').eq('slug',handle).eq('id',id).maybeSingle();if(asset.error)throw asset.error;return asset.data?reply(asset.data):reply({error:'Artifact unavailable.'},404);}
      if(action==='event'){
        if(input.comment){
          const comment=z.object({body:z.string().trim().min(1).max(3000),caseId:identifier,author:z.string().max(100).optional()}).strict().parse(input.comment);
          if(share.mode!=='review'||!share.data.cases.some((c:{id:string})=>c.id===comment.caseId))return reply({error:'Review link required.'},403);
          const r=await admin.rpc('pmforge_add_comment',{handle,case_identifier:comment.caseId,message:comment.body,reviewer:comment.author||'Reviewer'});if(r.error)throw r.error;
        }else if(share.data.activityEnabled){const r=await admin.rpc('pmforge_record_event',{handle,kind:input.event});if(r.error)throw r.error;}
        return reply({saved:true});
      }
      return reply({error:'Action unavailable.'},400);
    }catch(error){if(error instanceof z.ZodError)return reply({error:'Check the portfolio details and use a 3–30 character handle.'},400);if(error instanceof Error&&error.message==='Upload exceeds the size limit.')return reply({error:'The upload exceeds the size limit. Reduce the selected media.'},413);return reply({error:'Cloud storage could not finish. Your device work is unchanged.'},503);}
  };
}
