import { getAuth } from "@/lib/product/server";
export const runtime="nodejs";
async function handle(request:Request){
 const auth=await getAuth();
 if(!auth)return Response.json({error:"Accounts are not configured. You can continue as a guest."},{status:503});
 return auth.handler(request);
}
export const GET=handle;
export const POST=handle;
