import {cloudConfigured,cloudConfig} from './config';
import {cloudClient} from './server';
export async function cloudHealth(){
  if(!cloudConfigured())return Response.json({status:'not-ready',storage:'not-configured'},{status:503,headers:{'Cache-Control':'no-store'}});
  try{const client=await cloudClient(),{data,error}=await client.rpc('pmforge_health');if(error||data?.schema!==1)throw Error();const config=cloudConfig();return Response.json({...data,release:'device-practice',accounts:config.email||config.google||config.github?'configured':'not-configured',portfolio:process.env.PMFORGE_PUBLIC_PORTFOLIO_ORIGIN?'configured':'not-configured',externalAI:'off'},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({status:'not-ready',storage:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
