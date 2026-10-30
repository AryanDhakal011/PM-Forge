import { providersConfigured } from "@/lib/product/server";
export function GET(){return Response.json(providersConfigured(),{headers:{"Cache-Control":"no-store"}});}
