import 'server-only';
import {z} from 'zod';
import {cookies} from 'next/headers';
import {cloudClient,cloudMember} from './server';
import {cloudConfig} from './config';
import {safeNext} from '../product/routes';
import {limitedBody} from '../portfolio/request';
import {randomBytes} from 'node:crypto';
const headers={'Cache-Control':'no-store'};
const email=z.string().email().max(254),password=z.string().min(12).max(128);
const error=(message:string,status=400,code='ACCOUNT_REQUEST_FAILED')=>Response.json({message,code},{status,headers});
function nextFrom(value:unknown,origin:string){try{const u=new URL(String(value||'/app'),origin);if(u.origin!==origin)return '/app';return safeNext(u.searchParams.get('next')||u.pathname);}catch{return '/app';}}
export async function handleCloudAuth(request:Request){
  const url=new URL(request.url),origin=new URL(process.env.SITE_URL||request.url).origin,path=url.pathname.replace(/^\/api\/auth\//,'');
  if(request.method==='POST'&&request.headers.get('origin')!==origin)return error('Origin rejected.',403);
  try{
    const c=cloudConfig(),client=await cloudClient(),jar=await cookies();
    if(request.method==='GET'&&path.startsWith('callback/')){
      const code=url.searchParams.get('code'),next=safeNext(url.searchParams.get('next'));
      if(!code)return Response.redirect(origin+'/auth/error');
      const result=await client.auth.exchangeCodeForSession(code);
      if(result.error||!result.data.user)return Response.redirect(origin+'/auth/error');
      if(url.searchParams.get('recovery')==='1'){
        const nonce=jar.get('pmforge-recovery')?.value;
        if(!nonce||!/^[a-f0-9]{48}$/.test(nonce))return Response.redirect(origin+'/auth/error');
        const prepared=await client.rpc('pmforge_begin_password_reset',{nonce});
        if(prepared.error)return Response.redirect(origin+'/auth/error');
        return Response.redirect(origin+'/auth/reset-password?token=cloud-recovery&next='+encodeURIComponent(next));
      }
      return Response.redirect(origin+'/auth/callback?next='+encodeURIComponent(next));
    }
    if(request.method==='GET'&&['get-session','list-sessions'].includes(path)){
      const member=await cloudMember();if(!member)return Response.json(path==='list-sessions'?[]:null,{headers});
      const {data}=await client.auth.getClaims(),id=String(data?.claims?.session_id||'current');
      const session={id,token:id,userAgent:'Current browser · other devices are not listed',createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+3600000).toISOString()};
      return Response.json(path==='list-sessions'?[session]:{user:member.user,session},{headers});
    }
    if(request.method!=='POST')return error('Account action unavailable.',404);
    let body:Record<string,unknown>;try{body=JSON.parse(new TextDecoder().decode(await limitedBody(request,32000)));}catch{return error('Invalid account request.');}
    if(path==='sign-up/email'){
      if(!c.email)return error('Email signup is not enabled. Use device practice or a configured sign-in provider.',503);
      const input=z.object({name:z.string().trim().min(1).max(100),email,password,callbackURL:z.string().optional()}).strict().parse(body);
      const {data,error:e}=await client.auth.signUp({email:input.email,password:input.password,options:{data:{name:input.name},emailRedirectTo:origin+'/api/auth/callback/cloud?next='+encodeURIComponent(nextFrom(input.callbackURL,origin))}});
      if(e)return error('Account creation could not finish. Check your details or retry shortly.',e.status===429?429:400);
      return Response.json({user:data.user?{id:data.user.id,email:input.email,name:input.name}:null,session:null},{headers});
    }
    if(path==='sign-in/email'){
      if(!c.email)return error('Email sign-in is not enabled.',503);
      const input=z.object({email,password:z.string().min(1).max(128),callbackURL:z.string().optional(),rememberMe:z.boolean().optional()}).strict().parse(body);
      const {error:e}=await client.auth.signInWithPassword({email:input.email,password:input.password});
      if(e)return error(e.code==='email_not_confirmed'?'Verify your email before signing in.':'Email or password was not accepted.',e.status===429?429:401,e.code==='email_not_confirmed'?'EMAIL_NOT_VERIFIED':'INVALID_CREDENTIALS');
      return Response.json({success:true},{headers});
    }
    if(path==='sign-in/social'){
      const input=z.object({provider:z.enum(['google','github']),callbackURL:z.string().optional(),errorCallbackURL:z.string().optional()}).strict().parse(body);
      if(!c[input.provider])return error('This sign-in provider is not enabled.',503);
      const {data,error:e}=await client.auth.signInWithOAuth({provider:input.provider,options:{redirectTo:origin+'/api/auth/callback/cloud?next='+encodeURIComponent(nextFrom(input.callbackURL,origin))}});
      if(e||!data.url)return error('Sign-in could not start.',503);
      return Response.json({url:data.url,redirect:true},{headers});
    }
    if(path==='send-verification-email'){
      if(!c.email)return error('Email accounts are not enabled.',503);
      const input=z.object({email,callbackURL:z.string().optional()}).strict().parse(body);
      const result=await client.auth.resend({type:'signup',email:input.email,options:{emailRedirectTo:origin+'/api/auth/callback/cloud?next='+encodeURIComponent(nextFrom(input.callbackURL,origin))}});
      if(result.error&&result.error.status===429)return error('Please wait before requesting another email.',429);
      return Response.json({status:true},{headers});
    }
    if(path==='request-password-reset'){
      if(!c.email)return error('Email accounts are not enabled.',503);
      const input=z.object({email,redirectTo:z.string().optional()}).strict().parse(body),nonce=randomBytes(24).toString('hex');
      jar.set('pmforge-recovery',nonce,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:1800});
      const result=await client.auth.resetPasswordForEmail(input.email,{redirectTo:origin+'/api/auth/callback/cloud?recovery=1&next='+encodeURIComponent(nextFrom(input.redirectTo,origin))});
      if(result.error?.status===429)return error('Please wait before requesting another email.',429);
      return Response.json({status:true},{headers});
    }
    if(path==='reset-password'){
      const input=z.object({newPassword:password,token:z.literal('cloud-recovery')}).strict().parse(body),nonce=jar.get('pmforge-recovery')?.value;
      if(!nonce)return error('Request a fresh password recovery link.');
      const claimed=await client.rpc('pmforge_claim_password_reset',{nonce});
      if(claimed.error||claimed.data!==true)return error('This recovery link expired or was already used.');
      const updated=await client.auth.updateUser({password:input.newPassword});
      if(updated.error)return error('Password recovery could not finish. Request a fresh link.');
      await client.auth.signOut({scope:'global'});jar.delete('pmforge-recovery');
      return Response.json({status:true},{headers});
    }
    if(path==='sign-out'){const result=await client.auth.signOut({scope:'local'});return result.error?error('Sign-out could not finish. Retry.',503):Response.json({success:true},{headers});}
    if(path==='revoke-session'){
      const input=z.object({token:z.string().max(200)}).strict().parse(body),{data}=await client.auth.getClaims();
      if(input.token!==String(data?.claims?.session_id||'current'))return error('Only the current browser session can be revoked here.',403);
      await client.auth.signOut({scope:'local'});return Response.json({status:true},{headers});
    }
    if(path==='delete-user'){
      z.object({callbackURL:z.string().optional(),password:z.string().optional(),token:z.string().optional()}).strict().parse(body);
      const {cloudEdge}=await import('./edge');await cloudEdge({action:'delete-account'},true);
      await client.auth.signOut({scope:'local'});return Response.json({success:true},{headers});
    }
    return error('Account action unavailable.',404);
  }catch(e){if(e instanceof z.ZodError)return error('Check your account details and try again.');return error('The account service could not finish. Your device work is unchanged.',503);}
}
