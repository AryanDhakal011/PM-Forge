/** Public artifacts are served by a deployment with no account routes. */
export function portfolioBoundary(url:URL,env:Record<string,string|undefined>=process.env):{status:307;location:string}|{status:404|503}|null{
  if(env.PMFORGE_STORAGE_DRIVER!=='supabase')return null;
  const publicOnly=env.PMFORGE_PUBLIC_PORTFOLIO_ONLY==='true';
  const path=url.pathname;
  if(publicOnly){
    if(/^\/(?:p\/|api\/portfolio\/(?:asset|event)$|api\/health$|_next\/|brand\/)/.test(path))return null;
    if(path==='/'||['/privacy','/terms','/signup'].includes(path)){
      try{const main=new URL(env.SITE_URL||'');if(main.origin!==url.origin)return {status:307,location:new URL(path,main).href};}catch{}
    }
    return {status:404};
  }
  if(path.startsWith('/p/')||path==='/api/portfolio/asset'){
    try{const destination=new URL(env.PMFORGE_PUBLIC_PORTFOLIO_ORIGIN||'');if(destination.protocol!=='https:'||destination.origin===url.origin)return {status:503};return {status:307,location:new URL(path+url.search,destination.origin).href};}catch{return {status:503};}
  }
  return null;
}
