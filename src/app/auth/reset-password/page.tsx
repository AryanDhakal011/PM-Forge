import {ResetPasswordForm} from '@/components/product/AccountForm';
export const metadata={title:'Reset password | PMForge',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function Page({searchParams}:{searchParams:Promise<{token?:string;next?:string;error?:string}>}){const p=await searchParams;return <ResetPasswordForm token={p.token||''} invalid={!!p.error} next={p.next||'/app'}/>}
