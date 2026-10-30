"use client";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import {
  discardLandingCarry,
  importLandingCarry,
  readLandingCarry,
} from "@/lib/product/db";
import { useWorkspace } from "./WorkspaceProvider";
import styles from "./Product.module.css";
export default function LandingCarryPrompt() {
  const { profile } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const check = () => {
      if(sessionStorage.getItem("pmforge.pendingGuest"))return;
      if (!localStorage.getItem("pmf.carry") || !profile?.onboardingComplete)
        return;
      const data = readLandingCarry();
      setOpen(
        Boolean(
          data.interview ||
          data.blueprint ||
          Object.values(data.project?.decisions || {}).some(Boolean),
        ),
      );
    };
    check();
    window.addEventListener("pmforge:carry", check);
    return () => window.removeEventListener("pmforge:carry", check);
  }, [profile?.id, profile?.onboardingComplete]);
  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      title="Keep the work you started on the landing page?"
      description="Bring the saved preview into your portfolio as Demo records. They will never change official coverage or scores. Nothing is imported until you choose Keep it."
      size="sm"
    >
      <div className={styles.row}>
        <button
          className={styles.secondary}
          onClick={() => {
            discardLandingCarry();
            setOpen(false);
          }}
        >
          Discard preview work
        </button>
        <button
          className={styles.primary}
          disabled={busy}
          onClick={async () => {
            if (!profile) return;
            setBusy(true);
            try {
              await importLandingCarry(profile);
              setOpen(false);
            } catch {
              setError(
                "The import did not finish. Your preview copy is safe; retry.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Importing…" : "Keep it"}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </Dialog>
  );
}
