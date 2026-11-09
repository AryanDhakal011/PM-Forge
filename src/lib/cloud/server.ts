import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {cloudConfig} from './config';
export async function cloudClient(){
  const c=cloudConfig(),jar=await cookies();
  return createServerClient(c.url,c.key,{cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},cookies:{getAll:()=>jar.getAll(),setAll:values=>{for(const {name,value,options} of values)jar.set(name,value,options);}}});
}
export async function cloudMember(){
  const client=await cloudClient(),{data,error}=await client.auth.getUser();
  if(error&&(error.status===undefined||error.status>=500||error.name==='AuthRetryableFetchError'))throw Error('Cloud identity is temporarily unavailable.');
  if(error||!data.user)return null;
  const active=await client.rpc('pmforge_session_active');
  if(active.error)throw Error('Cloud session status is temporarily unavailable.');
  if(active.data!==true)return null;
  const user=data.user;
  return {user:{id:user.id,email:user.email||'',name:String(user.user_metadata?.name||user.user_metadata?.full_name||'Member').slice(0,100),emailVerified:!!user.email_confirmed_at}};
}
