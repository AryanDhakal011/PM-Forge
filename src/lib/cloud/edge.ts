import 'server-only';
import {cloudConfig} from './config';
import {cloudClient} from './server';
export class CloudError extends Error{constructor(message:string,readonly status=503){super(message);}}
export async function cloudEdge(body:Record<string,unknown>,authenticated=false){
  const c=cloudConfig(),headers:Record<string,string>={'Content-Type':'application/json',apikey:c.key};
  if(authenticated){
    const client=await cloudClient(),{data:{user}}=await client.auth.getUser();
    if(!user)throw new CloudError('Sign in to manage your portfolio.',401);
    // Session is used only to transport credentials. Identity is verified again by the function.
    const {data:{session}}=await client.auth.getSession();
    if(!session?.access_token)throw new CloudError('Sign in again to continue.',401);
    headers.Authorization='Bearer '+session.access_token;
  }
  let response:Response;
  try{response=await fetch(c.url+'/functions/v1/pmforge-backend',{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(20000),cache:'no-store'});}catch{throw new CloudError('Cloud storage could not connect. Your device work is safe.');}
  let data;try{data=await response.json();}catch{throw new CloudError('Cloud storage returned an incomplete reply. Your device work is safe.');}if(!response.ok)throw new CloudError(data.error||'Cloud storage could not finish.',response.status);return data;
}
