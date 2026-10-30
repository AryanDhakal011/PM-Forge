"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Download,
  ExternalLink,
  LogOut,
  RefreshCw,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { Dialog } from "@/components/ui/Dialog";
import {
  db,
  downloadFile,
  exportWorkspace,
  IDENTITY_KEY,
  importWorkspace,
  clearLocalProfile,
} from "@/lib/product/db";
import { exportSchema } from "@/lib/product/schema";
import { authClient } from "@/lib/product/auth-client";
import { entryHref } from "@/lib/product/routes";
import type { WorkspaceExport } from "@/lib/product/types";
import { useWorkspace } from "./WorkspaceProvider";
import ActivationSummary from "./ActivationSummary";
import styles from "./Product.module.css";

function Toggle({
  label,
  detail,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  detail: string;
  value: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.settingRow}>
      <div>
        <h3>{label}</h3>
        <p>{detail}</p>
      </div>
      <button
        className={styles.switch}
        role="switch"
        aria-label={label}
        aria-checked={value}
        disabled={disabled}
        onClick={onChange}
      >
        <span />
      </button>
    </div>
  );
}
export function SettingsView() {
  const { profile, setProfile, sync, reload } = useWorkspace();
  const prefs = useSettings();
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    setDebug(
      new URLSearchParams(location.search).get("debug") === "1" ||
        localStorage.getItem("pmforge.debug") === "1",
    );
  }, []);
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en-US");
  const [status, setStatus] = useState("");
  const [reset, setReset] = useState(false);
  const [resetText, setResetText] = useState("");
  const [pending, setPending] = useState<WorkspaceExport | null>(null);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setTheme(localStorage.getItem("pmforge.theme") || "light");
    setLanguage(localStorage.getItem("pmforge.voiceLanguage") || "en-US");
  }, []);
  const exportData = async () => {
    if (!profile) return;
    try {
      downloadFile(
        `pmforge-backup-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(await exportWorkspace(profile), null, 2),
        "application/json",
      );
      setStatus("Your device workspace has been exported.");
    } catch {
      setStatus("Could not export the workspace. Retry before clearing data.");
    }
  };
  const importFile = async (selected: File | undefined) => {
    if (!selected) return;
    if (selected.size > 1024 * 1024) {
      setStatus(
        "This file is over the 1 MB import limit. Your current data has not changed.",
      );
      return;
    }
    try {
      const parsed = exportSchema.parse(JSON.parse(await selected.text()));
      setPending(parsed);
    } catch {
      setStatus("This is not a valid PMForge v1 backup. Nothing was imported.");
    } finally {
      if (file.current) file.current.value = "";
    }
  };
  return (
    <>
      <div className={styles.pageHead} data-enter>
        <div>
          <span className={styles.eyebrow}>A space that works for you</span>
          <h1>Settle into your workspace.</h1>
          <p>
            Small preferences. Clear data controls. Everything with an obvious
            way back.
          </p>
        </div>
      </div>
      {debug && (
        <details>
          <summary>Developer diagnostics</summary>
          <ActivationSummary />
        </details>
      )}
      <div className={styles.grid2}>
        <div className={styles.stack}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Your practice profile</h2>
              <Link href="/onboarding?next=/app/settings">Revisit setup ↗</Link>
            </div>
            <div className={styles.stack}>
              <label className={styles.field}>
                First name
                <input
                  maxLength={60}
                  value={profile?.name || ""}
                  onChange={(e) =>
                    profile &&
                    void setProfile({
                      ...profile,
                      name: e.target.value,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                />
              </label>
              <label className={styles.field}>
                Target role
                <select
                  value={profile?.role}
                  onChange={(e) =>
                    profile &&
                    void setProfile({
                      ...profile,
                      role: e.target.value,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                >
                  {[
                    "Aspiring PM",
                    "Product Manager",
                    "Career switcher",
                    "Senior PM / Lead",
                  ].map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                Recommended challenge level
                <select
                  value={profile?.level}
                  onChange={(e) =>
                    profile &&
                    void setProfile({
                      ...profile,
                      level: e.target.value as "easy" | "medium" | "hard",
                      updatedAt: new Date().toISOString(),
                    })
                  }
                >
                  {["easy", "medium", "hard"].map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Feel & focus</h2>
            </div>
            <div className={styles.settingRow}>
              <div>
                <h3>Workspace theme</h3>
                <p>A light desk or a quieter evening room.</p>
              </div>
              <select
                aria-label="Workspace theme"
                className={styles.input}
                style={{ width: 100 }}
                value={theme}
                onChange={(e) => {
                  setTheme(e.target.value);
                  localStorage.setItem("pmforge.theme", e.target.value);
                  window.dispatchEvent(new Event("pmforge:theme"));
                }}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <Toggle
              label="Reduced motion"
              detail={
                prefs.osReducedMotion
                  ? "Your system preference is respected. Change it in your device settings."
                  : "Still scenes and shorter transitions; the same information."
              }
              value={prefs.reducedMotion}
              onChange={prefs.toggleReducedMotion}
              disabled={prefs.osReducedMotion}
            />
            <Toggle
              label="Sound cues"
              detail="Subtle cues after you act. Off by default."
              value={prefs.sound}
              onChange={prefs.toggleSound}
            />
            <Toggle
              label="Haptics"
              detail={
                prefs.hapticsSupported
                  ? "Light feedback on supported touch devices."
                  : "Not supported by this browser."
              }
              value={prefs.haptics}
              onChange={prefs.toggleHaptics}
              disabled={!prefs.hapticsSupported}
            />
            <div className={styles.settingRow}>
              <div>
                <h3>Voice typing language</h3>
                <p>Optional in behavioral stories.</p>
              </div>
              <select
                className={styles.input}
                style={{ width: 125 }}
                aria-label="Voice typing language"
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  localStorage.setItem("pmforge.voiceLanguage", e.target.value);
                }}
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="hi-IN">Hindi</option>
                <option value="ne-NP">Nepali</option>
              </select>
            </div>
          </section>
        </div>
        <div className={styles.stack}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Your data, in plain sight</h2>
              <ShieldCheck size={17} />
            </div>
            <p className={styles.prose} style={{ fontSize: ".82rem" }}>
              {profile?.identity === "guest"
                ? "Guest data is stored in this browser’s IndexedDB. It does not become an account by entering an email, and it is not uploaded."
                : "Your device copy remains usable offline. Account sync requires a valid server session."}
            </p>
            <p className={styles.notice} style={{ marginTop: 18 }}>
              {sync}
            </p>
            <div className={styles.stack} style={{ marginTop: 20 }}>
              <button
                className={styles.secondary}
                onClick={() => void exportData()}
              >
                <Download size={15} />
                Export my workspace
              </button>
              <button
                className={styles.secondary}
                onClick={() => file.current?.click()}
              >
                <Upload size={15} />
                Import a backup
              </button>
              <input
                type="file"
                ref={file}
                accept="application/json,.json"
                hidden
                onChange={(e) => void importFile(e.target.files?.[0])}
              />
              <button className={styles.secondary} onClick={reload}>
                <RefreshCw size={15} />
                Retry connection / reload identity
              </button>
              <button className={styles.danger} onClick={() => setReset(true)}>
                <Trash2 size={15} />
                Reset this device profile
              </button>
            </div>
            <p className={styles.finePrint} style={{ marginTop: 18 }}>
              Guest data stays on this device. Configured account data is stored
              by the PMForge server. Browser voice typing may send audio to its
              speech provider; PMForge does not record or store audio.
            </p>
          </section>
          <section className={styles.panel}>
            <h2>Account & privacy</h2>
            <p
              className={styles.prose}
              style={{ fontSize: ".8rem", margin: "14px 0" }}
            >
              Your work is useful without an account. Connected accounts can
              sync across devices.
            </p>
            <Link href="/app/account" className={styles.textButton}>
              Open account settings
              <ExternalLink size={14} />
            </Link>
            <div className={styles.row}>
              <Link href="/privacy" className={styles.small}>
                Privacy
              </Link>
              <Link href="/content-policy" className={styles.small}>
                Content policy
              </Link>
            </div>
          </section>
        </div>
      </div>
      {status && (
        <p className={styles.notice} role="status" style={{ marginTop: 20 }}>
          {status}
        </p>
      )}
      <Dialog
        open={!!pending}
        onClose={() => setPending(null)}
        title="Import this device backup?"
        description={
          pending
            ? `${pending.runs.length} sessions, ${pending.projectRuns?.length || 0} project campaigns, ${pending.records.length} records, and ${pending.bookmarks.length} bookmarks. Existing newer items are kept. Imported items will belong to your current profile.`
            : ""
        }
        size="sm"
      >
        <div className={styles.row}>
          <button className={styles.secondary} onClick={() => setPending(null)}>
            Not now
          </button>
          <button
            className={styles.primary}
            onClick={async () => {
              if (pending && profile)
                try {
                  await importWorkspace(pending, profile);
                  setStatus("Backup imported. Existing newer items were kept.");
                  setPending(null);
                } catch {
                  setStatus(
                    "Import failed. Your original workspace is safe. Retry.",
                  );
                }
            }}
          >
            Import backup
          </button>
        </div>
      </Dialog>
      <Dialog
        open={reset}
        onClose={() => setReset(false)}
        title="Reset this device profile?"
        description="This deletes this profile’s local sessions, snapshots, bookmarks, and records. It does not delete a server account. Export a backup first."
        size="sm"
      >
        <div className={styles.stack}>
          <label className={styles.field}>
            Type RESET to continue
            <input
              value={resetText}
              onChange={(e) => setResetText(e.target.value)}
              autoComplete="off"
            />
          </label>
          <div className={styles.row}>
            <button
              className={styles.secondary}
              onClick={() => setReset(false)}
            >
              Keep my data
            </button>
            <button
              className={styles.danger}
              disabled={resetText !== "RESET"}
              onClick={async () => {
                if (!profile) return;
                await clearLocalProfile(profile.id);
                localStorage.removeItem(IDENTITY_KEY);
                location.assign("/");
              }}
            >
              Reset profile
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
export function AccountView() {
  const { profile, sync } = useWorkspace();
  const [status, setStatus] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [signoutOpen, setSignoutOpen] = useState(false);
  const [removeLocal, setRemoveLocal] = useState(true);
  const [sessions, setSessions] = useState<
    { id: string; token: string; userAgent?: string | null; createdAt: Date }[]
  >([]);
  useEffect(() => {
    if (profile?.identity === "member")
      void authClient.listSessions().then((result) => {
        if (result.data) setSessions(result.data);
      });
  }, [profile?.identity]);
  if (profile?.identity !== "member")
    return (
      <>
        <div className={styles.pageHead}>
          <div>
            <span className={styles.eyebrow}>An account is optional</span>
            <h1>Your work already has a home.</h1>
            <p>
              An account adds cross-device sync. Guest practice stays fully
              usable on this device.
            </p>
          </div>
        </div>
        <section className={styles.panel} style={{ maxWidth: 650 }}>
          <ShieldCheck size={30} color="var(--p-green)" />
          <h2 style={{ margin: "18px 0" }}>
            Keep practising without a password.
          </h2>
          <p className={styles.prose}>
            Google and GitHub sign-in are enabled when the server’s provider
            credentials are configured. Until then, use the device workspace and
            keep an export of the work you care about.
          </p>
          <div className={styles.row} style={{ marginTop: 24 }}>
            <Link
              href={entryHref("/app/account", "account-upgrade") + "&upgrade=1"}
              className={styles.primary}
            >
              View account options
            </Link>
            <Link href="/app/settings" className={styles.secondary}>
              Export device work
            </Link>
          </div>
        </section>
      </>
    );
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <span className={styles.eyebrow}>Your PMForge identity</span>
          <h1>Account settings.</h1>
          <p>
            {profile.name} · {sync}
          </p>
        </div>
      </div>
      <div className={styles.grid2}>
        <section className={styles.panel}>
          <h2>Active sessions</h2>
          {sessions.map((session) => (
            <div key={session.id} className={styles.settingRow}>
              <div>
                <h3>{session.userAgent?.slice(0, 80) || "Browser session"}</h3>
                <p>{new Date(session.createdAt).toLocaleDateString()}</p>
              </div>
              <button
                className={styles.secondary}
                onClick={async () => {
                  const result = await authClient.revokeSession({
                    token: session.token,
                  });
                  setStatus(
                    result.error
                      ? "Could not revoke this session. Retry after signing in again."
                      : "Session revoked.",
                  );
                }}
              >
                Revoke
              </button>
            </div>
          ))}
          <p className={styles.finePrint} style={{ marginTop: 18 }}>
            Session actions require a valid account session. Refresh the page
            after revoking access.
          </p>
        </section>
        <section className={styles.panel}>
          <h2>Account data</h2>
          <div className={styles.stack} style={{ marginTop: 22 }}>
            <Link href="/app/settings" className={styles.secondary}>
              <Download size={15} />
              Export your workspace
            </Link>
            <button
              className={styles.secondary}
              onClick={() => setSignoutOpen(true)}
            >
              <LogOut size={15} />
              Sign out
            </button>
            <button
              className={styles.danger}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={15} />
              Delete account
            </button>
          </div>
        </section>
      </div>
      {status && (
        <p className={styles.notice} role="status">
          {status}
        </p>
      )}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete your PMForge account?"
        description="This permanently removes your server account and workspace. Export first. You may need to sign in again to confirm a fresh session."
        size="sm"
      >
        <label className={styles.field}>
          Type DELETE
          <input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </label>
        <button
          style={{ marginTop: 18 }}
          className={styles.danger}
          disabled={confirmation !== "DELETE"}
          onClick={async () => {
            const result = await authClient.deleteUser();
            if (result.error) {
              setStatus(
                "Deletion needs a fresh sign-in. Sign out and sign in again, then retry. Your data has not been deleted.",
              );
              setDeleteOpen(false);
            } else {
              await clearLocalProfile(profile.id);
              localStorage.removeItem(IDENTITY_KEY);
              location.assign("/");
            }
          }}
        >
          Delete my account
        </button>
      </Dialog>
      <Dialog
        open={signoutOpen}
        onClose={() => setSignoutOpen(false)}
        title="Leave this account’s workspace?"
        description="Your synced work stays in your account. Choose whether this device should keep a local copy."
        size="sm"
      >
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={removeLocal}
            onChange={(event) => setRemoveLocal(event.target.checked)}
          />
          Remove this account’s data from this device (recommended on shared
          computers).
        </label>
        <div className={styles.row} style={{ marginTop: 20 }}>
          <button
            className={styles.secondary}
            onClick={() => setSignoutOpen(false)}
          >
            Stay here
          </button>
          <button
            className={styles.primary}
            onClick={async () => {
              const result = await authClient.signOut();
              if (result.error) {
                setStatus("Sign-out failed. Retry; your work is safe.");
                setSignoutOpen(false);
                return;
              }
              if (removeLocal) await clearLocalProfile(profile.id);
              localStorage.removeItem(IDENTITY_KEY);
              location.assign("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </Dialog>
    </>
  );
}
