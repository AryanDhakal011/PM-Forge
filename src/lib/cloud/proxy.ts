import {createServerClient} from '@supabase/ssr';
import type {NextRequest,NextResponse} from 'next/server';
import {cloudEnabled,cloudConfigured,cloudConfig} from './config';
/** Refresh on every matched request; API handlers also validate the user independently. */
export async function refreshCloudSession(request:NextRequest,headers:Headers,response:NextResponse){
  if(!cloudEnabled()||!cloudConfigured())return;
  const c=cloudConfig(),client=createServerClient(c.url,c.key,{cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},cookies:{getAll:()=>request.cookies.getAll(),setAll:(values,extra)=>{
    for(const {name,value,options} of values){request.cookies.set(name,value);response.cookies.set(name,value,options);}
    headers.set('cookie',request.headers.get('cookie')||'');
    for(const [name,value] of Object.entries(extra||{}))response.headers.set(name,value);
  }}});
  // getClaims validates the token. getSession alone is never an authorization check.
  await client.auth.getClaims();
}
