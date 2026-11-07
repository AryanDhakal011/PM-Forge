import {ownedShare,portfolioDatabase,readShare} from '@/lib/portfolio/server';
import {validOrigin,rateLimited} from '@/lib/product/server';
export const runtime='nodejs';
export async function GET(request:Request){const url=new URL(request.url),slug=url.searchParams.get('slug')||'',id=url.searchParams.get('id')||'';if(!readShare(slug,url.searchParams.get('t')||undefined))return new Response(null,{status:404});const row=portfolioDatabase().prepare('SELECT mime,data FROM portfolio_assets WHERE id=? AND slug=?').get(slug+':'+id,slug) as {mime:string;data:Uint8Array}|undefined;return row?new Response(new Uint8Array(row.data),{headers:{'Content-Type':row.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}}):new Response(null,{status:404})}
