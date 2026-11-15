import { AuthPage } from "@/components/product/EntryGate";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/product/routes";
import { showcaseMode } from "@/lib/product/showcase";
export const metadata:Metadata={title:"Enter PMForge",description:"Open a private PMForge practice workspace with a connected account or on this device."};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const params=await searchParams;
  if (showcaseMode()) redirect(safeNext(params.next));
  return <AuthPage next={typeof params.next==="string"?params.next:undefined} mode="login"/>;
}
