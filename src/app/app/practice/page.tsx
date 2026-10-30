import { Suspense } from "react";
import { LibraryView } from "@/components/product/WorkspaceViews";
export default function Page() {
  return (
    <Suspense fallback={<p>Opening your workspace…</p>}>
      <LibraryView />
    </Suspense>
  );
}
