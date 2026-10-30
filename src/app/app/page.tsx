import { Suspense } from "react";
import { HomeView } from "@/components/product/WorkspaceViews";
export default function Page() {
  return (
    <Suspense fallback={<p>Opening your workspace…</p>}>
      <HomeView />
    </Suspense>
  );
}
