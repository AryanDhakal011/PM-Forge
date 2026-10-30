"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  exportWorkspace,
  getLocalProfile,
  IDENTITY_KEY,
  importWorkspace,
  markDirty,
} from "@/lib/product/db";
import type { Profile } from "@/lib/product/types";

type Workspace = {
  profile: Profile | null;
  loading: boolean;
  error: string;
  sync: string;
  setProfile: (p: Profile) => Promise<void>;
  reload: () => void;
};
const Context = createContext<Workspace | null>(null);
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [profile, setCurrent] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sync, setSync] = useState("Saved on this device");
  const [revision, setRevision] = useState(0);
  const dirty = useLiveQuery(
    () => (profile ? db.meta.get(`dirty:${profile.id}`) : undefined),
    [profile?.id],
  );
  const initialSync = useRef("");
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const local = await getLocalProfile();
        const response = await fetch("/api/me", { cache: "no-store" });
        const member = response.ok ? await response.json() : null;
        if (member?.user) {
          const id = member.user.id;
          const saved = await db.profiles.get(id);
          const next: Profile = saved || {
            id,
            name: member.user.name || "",
            role: "Aspiring PM",
            level: "easy",
            timeline: "Exploring",
            onboardingComplete: false,
            identity: "member",
            updatedAt: new Date().toISOString(),
          };
          await db.profiles.put(next);
          localStorage.setItem(IDENTITY_KEY, id);
          if (!cancelled) setCurrent(next);
        } else if (!cancelled) {
          setCurrent(local || null);
          if (local?.identity === "member")
            setSync("Session expired · work saved on this device");
        }
      } catch {
        try {
          const local = await getLocalProfile();
          if (!cancelled) {
            setCurrent(local || null);
            setSync(
              local?.identity === "member"
                ? "Not synced · offline"
                : "Saved on this device",
            );
          }
        } catch {
          if (!cancelled)
            setError(
              "Device storage is unavailable. Enable site storage, then retry. Existing saved data has not been changed.",
            );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [revision]);
  useEffect(() => {
    if (!profile || profile.identity !== "member") return;
    if (!dirty && initialSync.current === profile.id) return;
    let cancelled = false;
    let timer = 0;
    const syncWorkspace = async () => {
      if (!navigator.onLine) {
        setSync("Not synced · offline");
        return;
      }
      try {
        setSync("Syncing…");
        const response = await fetch("/api/workspace", { cache: "no-store" });
        if (response.status === 401) {
          setSync("Session expired · work saved on this device");
          return;
        }
        if (!response.ok) throw Error("sync");
        const remote = await response.json();
        if (cancelled) return;
        if (remote.data && remote.data.profile.id !== profile.id)
          throw Error(
            "The signed-in account changed. Reload identity before syncing.",
          );
        if (remote.data) await importWorkspace(remote.data, profile, false);
        const data = await exportWorkspace(profile);
        data.projectRuns = data.projectRuns?.map((run) =>
          run.includeNotes
            ? run
            : {
                ...run,
                draft: { ...run.draft, rationale: "" },
                decisions: run.decisions.map((d) => ({ ...d, rationale: "" })),
              },
        );
        if (cancelled) return;
        const result = await fetch("/api/workspace", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data, version: remote.version }),
        });
        if (!result.ok) throw Error("sync");
        if (cancelled) return;
        initialSync.current = profile.id;
        const latest = await db.meta.get(`dirty:${profile.id}`);
        if (latest?.value === dirty?.value)
          await db.meta.delete(`dirty:${profile.id}`);
        if (!cancelled) setSync("Synced to your account");
      } catch {
        if (!cancelled) setSync("Not synced · retry when online");
      }
    };
    timer = window.setTimeout(() => void syncWorkspace(), 900);
    const online = () => void syncWorkspace();
    window.addEventListener("online", online);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("online", online);
    };
  }, [profile, dirty?.value]);
  const setProfile = useCallback(async (next: Profile) => {
    await db.profiles.put(next);
    await markDirty(next.id);
    setCurrent(next);
    window.dispatchEvent(new Event("pmforge:identity"));
  }, []);
  return (
    <Context.Provider
      value={{
        profile,
        loading,
        error,
        sync,
        setProfile,
        reload: () => setRevision((v) => v + 1),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw Error("WorkspaceProvider is required");
  return context;
}
