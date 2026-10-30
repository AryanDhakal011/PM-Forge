import type { Metadata } from "next";
import { WorkspaceProvider } from "@/components/product/WorkspaceProvider";
import { ProductShell } from "@/components/product/ProductShell";
export const metadata: Metadata = {
  title: "Your practice workspace",
  robots: { index: false, follow: false },
};
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <ProductShell>{children}</ProductShell>
    </WorkspaceProvider>
  );
}
