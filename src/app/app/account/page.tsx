import { AccountView } from "@/components/product/SettingsView";
import { redirect } from "next/navigation";
import { showcaseMode } from "@/lib/product/showcase";
export default function Page() {
  if (showcaseMode()) redirect("/app/settings");
  return <AccountView />;
}
