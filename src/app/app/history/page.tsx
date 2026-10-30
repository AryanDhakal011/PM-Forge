import { permanentRedirect } from "next/navigation";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) { const params=await searchParams; const next=new URLSearchParams({tab:"history"}); for(const key of ["type","status"]) if(typeof params[key]==="string") next.set(key,params[key]); permanentRedirect(`/app/progress?${next}`); }
