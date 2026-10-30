import { Suspense } from "react";import AuthReturn from "@/components/product/AuthReturn";
export default function Page(){return <Suspense fallback={<p>Finishing sign-in…</p>}><AuthReturn/></Suspense>;}
