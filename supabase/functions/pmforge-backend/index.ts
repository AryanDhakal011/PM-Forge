import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
import {createCloudBackend} from './backend.ts';
const keys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');
const key=keys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if(!key)throw Error('Backend credentials are not available.');
const admin=createClient(Deno.env.get('SUPABASE_URL')!,key,{auth:{autoRefreshToken:false,persistSession:false}});
// Public reads validate capability links; every privileged action validates user + live session.
Deno.serve(createCloudBackend(admin));
