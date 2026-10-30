"use client";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { db, exportWorkspace, importWorkspace } from "@/lib/product/db";
import type { WorkspaceExport } from "@/lib/product/types";
import { useWorkspace } from "./WorkspaceProvider";
import styles from "./Product.module.css";
export default function GuestImportPrompt() {
  const { profile } = useWorkspace();
  const [data, setData] = useState<WorkspaceExport | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (profile?.identity !== "member") return;
    const id = sessionStorage.getItem("pmforge.pendingGuest");
    if (!id || id === profile.id) return;
    let active = true;
    void db.profiles.get(id).then(async (guest) => {
      if (!guest || guest.identity !== "guest") {
        sessionStorage.removeItem("pmforge.pendingGuest");
        window.dispatchEvent(new Event("pmforge:carry"));
        return;
      }
      const payload = await exportWorkspace(guest);
      if (
        active &&
        (payload.runs.length ||
          payload.projectRuns?.length ||
          payload.records.length ||
          payload.bookmarks.length)
      )
        setData(payload);
      else {
        sessionStorage.removeItem("pmforge.pendingGuest");
        window.dispatchEvent(new Event("pmforge:carry"));
      }
    });
    return () => {
      active = false;
    };
  }, [profile?.id, profile?.identity]);
  const close = () => {
    sessionStorage.removeItem("pmforge.pendingGuest");
    setData(null);
    window.dispatchEvent(new Event("pmforge:carry"));
  };
  return (
    <Dialog
      open={!!data}
      onClose={close}
      title="Bring your guest work into this account?"
      description={
        data
          ? `${data.runs.length} sessions, ${data.projectRuns?.length || 0} project campaigns, ${data.records.length} records, and ${data.bookmarks.length} bookmarks. Nothing is copied or uploaded until you choose Bring it.`
          : ""
      }
      size="sm"
    >
      <div className={styles.row}>
        <button className={styles.secondary} onClick={close}>
          Start fresh
        </button>
        <button
          className={styles.primary}
          onClick={async () => {
            if (data && profile)
              try {
                await importWorkspace(data, profile);
                close();
              } catch {
                setError(
                  "Import did not finish. Your guest copy is safe. Retry.",
                );
              }
          }}
        >
          Bring it
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </Dialog>
  );
}
