import type { Metadata } from "next";
import { WorkspaceProvider } from "@/components/product/WorkspaceProvider";
import { ProductShell } from "@/components/product/ProductShell";
import {WorkspaceNavigation} from '@/components/product/WorkspaceArrival';
import { showcaseMode } from "@/lib/product/showcase";
export const metadata: Metadata = {
  title: "Your practice workspace",
  robots: { index: false, follow: false },
};
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider showcase={showcaseMode()}>
      <WorkspaceNavigation/><ProductShell>{children}</ProductShell>
    </WorkspaceProvider>
  );
}
