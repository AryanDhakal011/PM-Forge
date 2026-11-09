/** Only configured origins enter CSP; malformed, credentialed and insecure URLs fail closed. */
export function hotSeatConnectSources(url:string|undefined){
  const sources=['https://huggingface.co','https://*.huggingface.co','https://*.hf.co'];
  if(url){try{const parsed=new URL(url);if(parsed.protocol==='wss:'&&!parsed.username&&!parsed.password&&parsed.pathname==='/'&&!parsed.search&&!parsed.hash){sources.push(parsed.origin,parsed.origin.replace(/^wss:/,'https:'));}}catch{}}
  return sources.join(' ');
}
