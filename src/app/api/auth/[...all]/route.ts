import { getAuth } from "@/lib/product/server";
import {cloudEnabled} from '@/lib/cloud/config';
export const runtime="nodejs";
async function handle(request:Request){
 if(cloudEnabled()){const {handleCloudAuth}=await import('@/lib/cloud/auth');return handleCloudAuth(request);}
 const auth=await getAuth();
 if(!auth)return Response.json({error:"Accounts are not configured. You can continue as a guest."},{status:503});
 if(request.method==='POST'){const origin=request.headers.get('origin');if(origin&&origin!==new URL(process.env.BETTER_AUTH_URL||request.url).origin)return Response.json({error:'Origin rejected.'},{status:403});const {limitedBody}=await import('@/lib/portfolio/request');try{const body=await limitedBody(request,32000);request=new Request(request.url,{method:'POST',headers:request.headers,body:new Uint8Array(body)})}catch{return Response.json({error:'Request too large.'},{status:413})}}
 const response=await auth.handler(request);response.headers.set('Cache-Control','no-store');return response;
}
export const GET=handle;
export const POST=handle;
