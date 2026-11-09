import 'server-only';
import {cache} from 'react';
import {limitedBody} from '../portfolio/request';
import {publicPortfolioSchema} from '../portfolio/publication';
import {cloudEdge,CloudError} from './edge';
const headers={'Cache-Control':'no-store'};
const failure=(e:unknown)=>Response.json({error:e instanceof CloudError?e.message:'Cloud publishing could not finish. Your local work is safe.'},{status:e instanceof CloudError?e.status:400,headers});
export const cloudReadShare=cache(async(slug:string,token?:string)=>{
  try{const result=await cloudEdge({action:'read',slug,token});return {...result.share,data:publicPortfolioSchema.parse(result.share.data)} as {slug:string;mode:'public'|'link'|'review';data:ReturnType<typeof publicPortfolioSchema.parse>;expires:number;fingerprint:string};}
  catch(error){if(error instanceof CloudError&&error.status===404)return null;throw error;}
});
export async function cloudShareRoute(request:Request){
  try{
    const url=new URL(request.url),origin=new URL(process.env.SITE_URL||request.url).origin;
    if(request.method!=='GET'&&request.headers.get('origin')!==origin)return Response.json({error:'Origin rejected.'},{status:403,headers});
    if(request.method==='GET'){const availability=url.searchParams.get('availability');return Response.json(await cloudEdge({action:availability!==null?'handle':'owner',slug:availability??url.searchParams.get('slug')},true),{headers});}
    if(request.method==='DELETE')return Response.json(await cloudEdge({action:'revoke',slug:url.searchParams.get('slug')},true),{headers});
    if(!process.env.PMFORGE_PUBLIC_PORTFOLIO_ORIGIN)return Response.json({error:'Public portfolio hosting is not configured yet. Your drafts remain private.'},{status:503,headers});
    const bytes=await limitedBody(request,3_300_000),contentType=request.headers.get('content-type')||'',multipart=contentType.includes('multipart/form-data');
    const form=multipart?await new Response(bytes,{headers:{'Content-Type':contentType}}).formData():null;
    const snapshot=JSON.parse(form?String(form.get('snapshot')):new TextDecoder().decode(bytes)),assets=[];
    for(const [name,file] of form||[]){if(!name.startsWith('asset:'))continue;if(!(file instanceof Blob)||file.size>1048576)return Response.json({error:'Free hosted artifacts must each be under 1 MB; choose a shorter clip or resize the image.'},{status:413,headers});assets.push({id:name.slice(6),data:Buffer.from(await file.arrayBuffer()).toString('base64')});}
    const result=await cloudEdge({action:'publish',slug:snapshot.slug,snapshot,assets},true);
    return Response.json(result,{headers});
  }catch(error){return failure(error);}
}
export async function cloudAssetRoute(request:Request){
  try{const url=new URL(request.url),result=await cloudEdge({action:'asset',slug:url.searchParams.get('slug'),id:url.searchParams.get('id'),token:url.searchParams.get('t')});return new Response(Buffer.from(result.data,'base64'),{headers:{...headers,'Content-Type':result.mime,'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});}catch(error){return failure(error);}
}
export async function cloudEventRoute(request:Request){
  try{const origin=request.headers.get('origin'),site=new URL(process.env.SITE_URL||request.url).origin,portfolio=process.env.PMFORGE_PUBLIC_PORTFOLIO_ORIGIN;if(origin!==site&&(!portfolio||origin!==portfolio))return Response.json({error:'Origin rejected.'},{status:403,headers});const raw=JSON.parse(new TextDecoder().decode(await limitedBody(request,6000)));return Response.json(await cloudEdge({...raw,action:'event'}),{headers});}catch(error){return failure(error);}
}
