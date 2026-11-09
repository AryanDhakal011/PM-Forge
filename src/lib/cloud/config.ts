export const cloudEnabled=()=>process.env.PMFORGE_STORAGE_DRIVER==='supabase';
export const cloudConfigured=()=>!!process.env.SUPABASE_URL&&!!process.env.SUPABASE_PUBLISHABLE_KEY;
export function cloudConfig(){
  if(!cloudEnabled()||!cloudConfigured())throw Error('Cloud storage is not configured.');
  const url=new URL(process.env.SUPABASE_URL!);
  if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw Error('Secure cloud storage is required.');
  return {url:url.origin,key:process.env.SUPABASE_PUBLISHABLE_KEY!,email:process.env.PMFORGE_CLOUD_EMAIL_ENABLED==='true',google:process.env.PMFORGE_CLOUD_GOOGLE_ENABLED==='true',github:process.env.PMFORGE_CLOUD_GITHUB_ENABLED==='true'};
}
