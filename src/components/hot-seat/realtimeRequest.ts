import {friendlyRequestError} from '@/lib/ui-feedback';
export async function realtimeRequest(input:Record<string,unknown>) {
  try {
    const response=await fetch('/api/hot-seat/realtime',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(25000)});
    const data=await response.json();
    if(!response.ok)throw Object.assign(Error(data.error==='verified-account-required'?'Sign in with a verified account to use realtime voice. Local guided practice is still available.':`Realtime voice could not finish (${data.error}). Your saved conversation is safe.`),{code:data.error});
    return data;
  }catch(error){throw Object.assign(Error(friendlyRequestError(error,'Realtime voice')),{code:(error as {code?:string}).code});}
}
