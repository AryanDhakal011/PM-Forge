"use client";

import { ArrowUpRight } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import styles from "./Product.module.css";

export function HostedAccessDialog({ open, onClose, feature }: {
  open: boolean;
  onClose: () => void;
  feature: "Hot Seat" | "Portfolio publishing";
}) {
  const request = new URL("https://github.com/AryanDhakal011/PM-Forge/issues/new");
  request.searchParams.set("title", `Walkthrough request · ${feature}`);
  request.searchParams.set("body", `I'd like to see the full ${feature} experience.\n\nWhat I would like to see:\n`);
  return <Dialog
    open={open}
    onClose={onClose}
    title={feature === "Hot Seat" ? "That’s the opening round." : "Ask about hosted publishing."}
    description={feature === "Hot Seat"
      ? "You’ve seen how the room begins. Follow-up questions and the full debrief use hosted services. Ask about a full walkthrough."
      : "A hosted link uses server storage. Ask for a walkthrough of the publishing flow, or download your reviewed cases from Career Studio."}
    size="sm"
    initialFocus="[data-access-contact]"
  >
    <div className={styles.row}>
      <a data-access-contact className={styles.primary} href={request.href} target="_blank" rel="noopener noreferrer">
        Ask about a walkthrough <ArrowUpRight size={16} aria-hidden="true" />
      </a>
      <button type="button" className={styles.secondary} onClick={onClose}>Back to preview</button>
    </div>
    <p className={styles.finePrint}>GitHub opens a public thread. Leave out private details.</p>
  </Dialog>;
}
