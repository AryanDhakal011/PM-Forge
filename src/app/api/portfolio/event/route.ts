import {clientKey} from '@/lib/product/server';
import {readShare,trackShare,portfolioDatabase} from '@/lib/portfolio/server';
import {validOrigin,rateLimited} from '@/lib/product/server';
import {limitedBody} from '@/lib/portfolio/request';
export const runtime='nodejs';
export async function POST(request:Request){if(!validOrigin(request)||rateLimited('portfolio-event:'+clientKey(request),80))return new Response(null,{status:429});try{const raw=new TextDecoder().decode(await limitedBody(request,5000));if(raw.length>5000)return new Response(null,{status:413});const {slug,token,event,comment}=JSON.parse(raw),share=readShare(slug,token);if(!share)return new Response(null,{status:404});if(comment){if(share.mode!=='review'||typeof comment.body!=='string'||comment.body.length>3000||!share.data.cases.some(c=>c.id===comment.caseId))return new Response(null,{status:400});portfolioDatabase().prepare('INSERT INTO portfolio_comments VALUES(?,?,?,?,?,?)').run(crypto.randomUUID(),slug,comment.caseId,String(comment.author||'Reviewer').slice(0,100),comment.body,new Date().toISOString())}else trackShare(slug,event);return Response.json({saved:true})}catch{return new Response(null,{status:400})}}
