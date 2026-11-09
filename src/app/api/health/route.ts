import {cloudEnabled} from '@/lib/cloud/config';
import {cloudHealth} from '@/lib/cloud/health';
import {getAuth,providersConfigured,serverDatabase} from '@/lib/product/server';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){if(cloudEnabled())return cloudHealth();try{serverDatabase().prepare('SELECT 1').get();const configured=providersConfigured(),auth=await getAuth(),strict=process.env.PMFORGE_DEPLOYMENT==='production',ready=!!auth&&(configured.email||configured.google||configured.github);return Response.json({status:strict&&!ready?'not-ready':ready?'ready':'preview',storage:'ok'},{status:strict&&!ready?503:200,headers:{'Cache-Control':'no-store'}})}catch{return Response.json({status:'not-ready'},{status:503,headers:{'Cache-Control':'no-store'}})}}
