import { memberSession } from "@/lib/product/server";
export async function GET(request:Request){
 const session=await memberSession(request);
 return Response.json({user:session?{id:session.user.id,name:session.user.name,email:session.user.email}:null},{headers:{"Cache-Control":"no-store"}});
}
