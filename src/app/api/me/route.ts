import { memberSession } from "@/lib/product/server";
export async function GET(request:Request){
 try{const session=await memberSession(request);
 return Response.json({user:session?{id:session.user.id,name:session.user.name,email:session.user.email}:null},{headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:'Account status is temporarily unavailable. Your device work is safe.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
