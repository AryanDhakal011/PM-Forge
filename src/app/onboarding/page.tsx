import { Suspense } from "react";import Onboarding from "@/components/product/Onboarding";
export default function Page(){return <Suspense fallback={<p>Opening setup…</p>}><Onboarding/></Suspense>;}
