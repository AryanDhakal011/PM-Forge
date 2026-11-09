import {cloudEnabled} from '@/lib/cloud/config';
import {cloudReadShare} from '@/lib/cloud/portfolio';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {readShare} from '@/lib/portfolio/server';
import {PublicPortfolio} from '@/components/portfolio/PublicPortfolio';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string}>;searchParams:Promise<{t?:string}>};
export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{const {slug}=await params,{t}=await searchParams,share=cloudEnabled()?await cloudReadShare(slug,t):readShare(slug,t);if(!share)return {title:'Portfolio unavailable | PMForge',robots:{index:false,follow:false}};const publicPage=share.mode==='public',title=publicPage?`${share.data.name} · ${share.data.targetTitle}`:'Private portfolio | PMForge',description=publicPage?share.data.valueProp:'A private candidate portfolio. Open the signed link to review it.';return {title,description,robots:{index:false,follow:false},openGraph:{title,description,type:'profile',...(publicPage?{images:[`/p/${slug}/preview`]}:{})},referrer:'no-referrer'}}
export default async function Page({params,searchParams}:Props){const {slug}=await params,{t}=await searchParams,share=cloudEnabled()?await cloudReadShare(slug,t):readShare(slug,t);if(!share)notFound();return <PublicPortfolio data={share.data} slug={slug} token={t} review={share.mode==='review'} expires={share.expires}/>}
