"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowRight,
  Check,
  ClipboardCopy,
  Download,
  FileText,
  Plus,
  Printer,
  Save,
  Trash2,
} from "lucide-react";
import {
  db,
  downloadFile,
  EMPTY_FIELDS,
  markDirty,
  recordMarkdown,
} from "@/lib/product/db";
import { recordFieldsSchema } from "@/lib/product/schema";
import { copyText } from "@/lib/clipboard";
import type { DecisionRecord, RecordFields } from "@/lib/product/types";
import { Dialog } from "@/components/ui/Dialog";
import { useWorkspace } from "./WorkspaceProvider";
import { useWorkspaceData } from "./useWorkspaceData";
import { EmptyState } from "./WorkspaceUI";
import styles from "./Product.module.css";
const labels: Record<keyof RecordFields, string> = {
  problem: "The problem",
  evidence: "Evidence",
  assumptions: "Assumptions",
  options: "Options considered",
  tradeoffs: "Trade-offs accepted",
  decision: "The decision",
  metric: "Success metric & guardrails",
  nextCheck: "The next check",
};
export function PortfolioView() {
  const { records } = useWorkspaceData();
  return (
    <>
      <div className={styles.pageHead} data-enter>
        <div>
          <span className={styles.eyebrow}>
            A shelf of decisions, not just outcomes
          </span>
          <h1>Keep the thinking that matters.</h1>
          <p>
            Your decision records turn practice into something you can revisit,
            refine, and explain.
          </p>
        </div>
        <Link className={styles.primary} href="/app/portfolio/new">
          <Plus size={15} />
          New decision record
        </Link>
      </div>
      {records.length ? (
        <div className={styles.grid3}>
          {records.map((record) => (
            <article key={record.id} className={styles.questionCard}>
              <div className={styles.spread}>
                <span className={styles.badge}>
                  {record.source === "Demo"
                    ? "Demo · excluded from progress"
                    : record.source === "run"
                      ? "From a practice session"
                      : "Your decision"}
                </span>
                <FileText size={17} color="var(--p-brass)" />
              </div>
              <h3>
                <Link href={`/app/portfolio/${record.id}`}>{record.title}</Link>
              </h3>
              <p>
                {record.fields.decision.slice(0, 140) ||
                  "A decision waiting to be made explicit."}
              </p>
              <div className={styles.cardFoot}>
                <span>{new Date(record.updatedAt).toLocaleDateString()}</span>
                <Link href={`/app/portfolio/${record.id}`}>
                  Open record
                  <ArrowRight size={13} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          kind="portfolio"
          title="Your first record starts with a call."
          href="/app/portfolio/new"
          action="Write a record"
        >
          Keep the evidence, options and tradeoffs behind a real decision.
        </EmptyState>
      )}
      <p className={styles.finePrint} style={{ marginTop: 25 }}>
        Private to this workspace. Copy, download Markdown, or print a record at
        any time. No public sharing links are created.
      </p>
    </>
  );
}
export function RecordEditor({ id }: { id?: string }) {
  const { profile } = useWorkspace();
  const router = useRouter();
  const record = useLiveQuery(
    async () => (id ? (await db.records.get(id)) || null : undefined),
    [id],
  );
  const [fields, setFields] = useState<RecordFields>({ ...EMPTY_FIELDS });
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState(!id);
  const [status, setStatus] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (record && record.ownerId === profile?.id) {
      setTitle(record.title);
      setFields(record.fields);
    }
  }, [record, profile?.id]);
  if (id && record === undefined)
    return (
      <div className={styles.notice}>
        Opening this decision record…{" "}
        <Link href="/app/portfolio">Back to your portfolio</Link>
      </div>
    );
  if (id && (!record || record.ownerId !== profile?.id))
    return (
      <div className={styles.empty}>
        <h1>This record isn’t in your workspace.</h1>
        <Link href="/app/portfolio" className={styles.primary}>
          Back to portfolio
        </Link>
      </div>
    );
  const save = async () => {
    if (!profile) return;
    const checked = recordFieldsSchema.safeParse(fields);
    if (!checked.success || !title.trim() || !fields.decision.trim()) {
      setStatus(
        "Give the record a title and a decision. Keep each field under 20,000 characters.",
      );
      return;
    }
    if (Object.values(fields).join("").length > 50000) {
      setStatus("Keep the complete record under 50,000 characters.");
      return;
    }
    setBusy(true);
    try {
      const at = new Date().toISOString();
      const next: DecisionRecord = {
        id: id || crypto.randomUUID(),
        ownerId: profile.id,
        title: title.trim(),
        source: record?.source || "manual",
        ...(record?.runId ? { runId: record.runId } : {}),
        fields: checked.data,
        createdAt: record?.createdAt || at,
        updatedAt: at,
      };
      await db.records.put(next);
      await markDirty(profile.id);
      setStatus("Saved on this device.");
      if (!id) router.replace(`/app/portfolio/${next.id}`);
      setEditing(false);
    } catch {
      setStatus("Could not save. Your edits are still here; retry.");
    } finally {
      setBusy(false);
    }
  };
  const current: DecisionRecord = record || {
    id: "draft",
    ownerId: profile!.id,
    title: title || "Decision record",
    source: "manual",
    fields,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return (
    <>
      <div className={`${styles.pageHead} ${styles.screenOnly}`}>
        <div>
          <span className={styles.eyebrow}>
            {record?.source === "Demo"
              ? "Demo artifact · excluded from official progress"
              : "Your decision blueprint"}
          </span>
          <h1>
            {editing
              ? id
                ? "Refine the reasoning."
                : "Make the decision explicit."
              : "A record you can stand behind."}
          </h1>
        </div>
        <div className={styles.row}>
          {!editing && (
            <>
              <button
                className={styles.secondary}
                onClick={() => setEditing(true)}
              >
                Edit record
              </button>
              <button
                className={styles.iconButton}
                aria-label="Print decision record"
                onClick={() => window.print()}
              >
                <Printer size={16} />
              </button>
              <button
                className={styles.iconButton}
                aria-label="Download Markdown"
                onClick={() =>
                  downloadFile(
                    `${current.title.replace(/[^a-z0-9]/gi, "-")}.md`,
                    recordMarkdown(current),
                  )
                }
              >
                <Download size={16} />
              </button>
              <button
                className={styles.iconButton}
                aria-label="Copy record"
                onClick={async () =>
                  setStatus(
                    (await copyText(recordMarkdown(current)))
                      ? "Record copied."
                      : "Copy blocked. Download Markdown instead.",
                  )
                }
              >
                <ClipboardCopy size={16} />
              </button>
            </>
          )}
          {id && (
            <button
              className={styles.iconButton}
              aria-label="Delete record"
              onClick={() => setConfirm(true)}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      <article className={`${styles.panel} ${styles.recordSheet}`}>
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
            className={styles.stack}
          >
            <label className={styles.field}>
              Record title
              <input
                required
                maxLength={140}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A specific decision, in a sentence"
              />
            </label>
            <div className={styles.formGrid}>
              {(Object.keys(labels) as (keyof RecordFields)[]).map((key) => (
                <label
                  key={key}
                  className={`${styles.field} ${key === "decision" || key === "problem" ? styles.wide : ""}`}
                >
                  {labels[key]}
                  {key === "decision" ? " *" : ""}
                  <textarea
                    required={key === "decision"}
                    maxLength={20000}
                    value={fields[key]}
                    onChange={(e) =>
                      setFields({ ...fields, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
            </div>
            <div className={styles.row}>
              <button className={styles.primary} type="submit" disabled={busy}>
                <Save size={15} />
                {busy ? "Saving…" : "Save decision record"}
              </button>
              {id && (
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => {
                    setFields(record!.fields);
                    setTitle(record!.title);
                    setEditing(false);
                  }}
                >
                  Cancel edits
                </button>
              )}
            </div>
          </form>
        ) : (
          <>
            <span className={styles.eyebrow}>PMForge / decision record</span>
            <h1>{record?.title}</h1>
            <div className={styles.row} style={{ marginTop: 18 }}>
              <span className={styles.badge}>{record?.source}</span>
              <span className={styles.small}>
                {record && new Date(record.updatedAt).toLocaleDateString()}
              </span>
            </div>
            {(Object.keys(labels) as (keyof RecordFields)[]).map((key) => (
              <section key={key}>
                <h2>{labels[key]}</h2>
                <p>{record?.fields[key] || "Not documented yet."}</p>
              </section>
            ))}
          </>
        )}
      </article>
      {status && (
        <p className={styles.notice} role="status" style={{ marginTop: 18 }}>
          {status}
        </p>
      )}
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete this decision record?"
        description="Download a copy first if you want to keep it. The practice session it came from will remain."
        size="sm"
      >
        <div className={styles.row}>
          <button
            className={styles.secondary}
            onClick={() => setConfirm(false)}
          >
            Keep record
          </button>
          <button
            className={styles.danger}
            onClick={async () => {
              if (record && profile && record.ownerId === profile.id) {
                await db.records.delete(record.id);
                await markDirty(profile!.id);
                router.replace("/app/portfolio");
              }
            }}
          >
            Delete record
          </button>
        </div>
      </Dialog>
    </>
  );
}
