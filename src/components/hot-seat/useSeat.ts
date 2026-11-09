"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { showError, friendlyRequestError } from "@/lib/ui-feedback";
import { db, IDENTITY_KEY } from "@/lib/product/db";
import {realtimeRequest} from './realtimeRequest';
import {
  createSeat,
  mergeSeat,
  guidedOutput,
  withCurveball,
  privacyIssue,
  type Options,
  type SeatSession,
  type Pending,
} from "@/lib/hot-seat/model";
export type Capability = {
  available: boolean;
  reason: string;
  mode: string;
  model: string;
  mock: boolean;
  maxTurns: number;
  regions: string[];
  geminiSpeech: boolean;
  localPilot: boolean;
  dataUse: string;
};
export const errorCopy: Record<string, string> = {
  "provider-quota":
    "Gemini has reached its quota. Your answer is saved. Retry later or continue guided.",
  "project-capacity":
    "The free pilot is at its current limit. Your answer is saved. Retry after the pause or continue guided.",
  "daily-session-limit":
    "Today’s session allowance is used. Local guided practice is still available.",
  "guest-daily-limit":
    "This device’s daily pilot allowance is used. Local guided practice is available.",
  "room-at-capacity":
    "The AI room is occupied. Retry shortly or choose local guided practice.",
  "turn-limit":
    "Your AI reply allowance is complete. Continue this conversation guided or review it.",
  "fictional-answer-required":
    "Remove personal/contact/secret details. Only fictional company answers can be sent in this pilot.",
  "guest-session-required":
    "Your server session expired or changed. Your local transcript is safe; continue guided.",
  "configuration-changed":
    "The operator changed the AI configuration. Your transcript is safe; continue guided.",
  "session-expired":
    "The private server copy expired. Your local conversation is preserved. Continue guided.",
  "revision-conflict":
    "This conversation changed in another tab. Reload the saved server version before sending.",
};
export async function seatRequest(input: Record<string, unknown>) {
  try {
    const response=await fetch("/api/hot-seat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input),signal:AbortSignal.timeout(35000)});
    const data=await response.json().catch(()=>({error:"invalid-response"}));
    if(!response.ok)throw Object.assign(Error(errorCopy[data.error]||"The AI request could not finish. Retry or use guided practice."),{code:data.error,retryAfter:Number(data.retryAfter)||0});
    return data;
  }catch(error){throw Object.assign(Error(friendlyRequestError(error,input.action==="start"?"Opening the AI room":"The AI request")),{code:(error as any)?.code||"connection-error",retryAfter:(error as any)?.retryAfter||0})}
}
export function useSeat(ownerId: string) {
  const [session, setSession] = useState<SeatSession | null>(null),
    [saved, setSaved] = useState<SeatSession[]>([]),
    [cap, setCap] = useState<Capability | null>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [retryAt, setRetryAt] = useState(0),
    [storageError, setStorageError] = useState(false);
  const current = useRef(session);
  current.current = session;
  const queue = useRef(Promise.resolve()),
    lock = useRef(false),
    draftTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const persist = useCallback(async (next: SeatSession) => {
    if(localStorage.getItem(IDENTITY_KEY)!==ownerId)throw Error("This device workspace was reset or changed. Return to sign-in before continuing.");
    clearTimeout(draftTimer.current);
    current.current = next;
    setSession(next);
    const write = queue.current
      .catch(() => {})
      .then(async () => {
        if(localStorage.getItem(IDENTITY_KEY)!==ownerId)throw Error("Device workspace changed.");
        await db.hotSeats.put(next);
        setStorageError(false);
      });
    queue.current = write;
    try {
      await write;
    } catch {
      setStorageError(true);
      throw Error(
        "Device storage did not save. Keep this page open and export your conversation.",
      );
    }
  }, [ownerId]);
  const refresh = useCallback(async () => {
    setSaved(
      (await db.hotSeats.where("ownerId").equals(ownerId).toArray()).sort(
        (a, b) => b.updatedAt.localeCompare(a.updatedAt),
      ),
    );
  }, [ownerId]);
  useEffect(() => {
    void refresh().catch(e=>{setNotice("Saved conversations could not load. Check device storage and retry.");showError("Saved conversations could not load. Check device storage and retry.")});
    void fetch("/api/hot-seat", { cache: "no-store", signal:AbortSignal.timeout(10000) })
      .then((r) => {if(!r.ok)throw Error("AI availability could not load");return r.json()})
      .then(setCap)
      .catch(() => {const message="AI availability could not load. Local guided conversations still work.";setNotice(message);showError(message);setCap({available:false,reason:message,mode:"guided",model:"",mock:false,maxTurns:8,regions:[],geminiSpeech:false,localPilot:false,dataUse:"Local guided practice"})});
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
      if (current.current && localStorage.getItem(IDENTITY_KEY)===ownerId) void db.hotSeats.put(current.current).catch(()=>{});
    };
  }, [ownerId, refresh]);
  const merge = useCallback(
    mergeSeat,
    [],
  );
  async function start(
    options: Options,
    ai: boolean,
    consent: { adult: true; fictional: true; provider: true; region: string },
  ) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setNotice("");
    try {
      let next = createSeat(
        ownerId,
        options,
        crypto.randomUUID(),
        Math.floor(Math.random() * 600),
        cap?.maxTurns || 8,
      );
      if (ai) {
        const data = await seatRequest({
          action: "start",
          id: next.id,
          localOwnerId: ownerId,
          options,
          consent,
        });
        if(data.session?.id!==next.id || data.session?.ownerId!==ownerId)throw Error("The AI room returned an incomplete response. Please retry opening it.");
        next = data.session;
      }
      await persist(next);
      return true;
    } catch (e) {
      setNotice((e as Error).message); showError((e as Error).message);
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function recover(local: SeatSession) {
    if (local.mode === "guided") return local;
    const data = await (local.mode==='realtime'?realtimeRequest:seatRequest)({ action: "status", id: local.id });
    if (data.session?.id !== local.id || data.session.ownerId !== ownerId)
      throw Error("Saved session ownership could not be verified.");
    if (data.pending) {
      setNotice("A reply is still being prepared. Retry shortly.");
      return local;
    }
    const next = merge(data.session, local);
    if (
      local.pending &&
      !next.turns.some((t) => t.id === "reply-" + local.pending!.requestId)
    )
      next.pending = local.pending;
    await persist(next);
    return next;
  }
  async function resume(local: SeatSession) {
    if (local.ownerId !== ownerId) return;
    await persist({
      ...local,
      status: local.status === "complete" ? "complete" : "paused",
    });
    if (local.mode !== "guided" && local.status !== "complete") {
      try {
        await recover({ ...local, status: "paused" });
      } catch (e) {
        setNotice((e as Error).message); showError((e as Error).message);
      }
    }
  }
  function draft(text: string) {
    const s = current.current;
    if (!s) return;
    const next = {
      ...s,
      draft: text.slice(0, 4000),
      updatedAt: new Date().toISOString(),
    };
    current.current = next;
    setSession(next);
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(
      () => void persist(next).catch((e) => {setNotice(e.message);showError(e.message)}),
      300,
    );
  }
  async function generate(s: SeatSession, p: Pending) {
    setBusy(true);
    setNotice("Your answer is saved. Preparing a follow-up…");
    try {
      const data = await seatRequest({
        action: "turn",
        id: s.id,
        requestId: p.requestId,
        turnId: p.turnId,
        expected: p.expected,
        text: p.text,
        source: p.source,
        seconds: p.seconds,
        elapsedMs: s.elapsedMs,
        fictional: true,
      });
      if (
        data.session?.id !== s.id ||
        data.session.ownerId !== ownerId ||
        data.session.revision !== p.expected + 1
      )
        throw Error("Reply binding could not be verified.");
      await persist(merge(data.session, current.current || s));
      setNotice("");
      setRetryAt(0);
    } catch (e) {
      setNotice((e as Error).message); showError((e as Error).message);
      setRetryAt(Date.now() + ((e as any).retryAfter || 15) * 1000);
    } finally {
      setBusy(false);
    }
  }
  async function send(source: "typed" | "voice" = "typed", seconds = 0) {
    const s = current.current;
    if (
      !s ||
      lock.current ||
      s.status !== "active" ||
      s.pending ||
      !s.draft.trim()
    )
      return;
    const text = s.draft.trim();
    if (s.mode !== "guided" && cap?.mode === "free-pilot") {
      const issue = privacyIssue(text);
      if (issue) {
        setNotice(issue); showError(issue);
        return;
      }
    }
    lock.current = true;
    clearTimeout(draftTimer.current);
    const p: Pending = {
      requestId: crypto.randomUUID(),
      turnId: crypto.randomUUID(),
      expected: s.revision,
      text,
      source,
      seconds,
      fictional: true,
    };
    const next = {
      ...s,
      draft: "",
      pending: s.mode === "guided" ? undefined : p,
      updatedAt: new Date().toISOString(),
      turns: [
        ...s.turns,
        {
          id: p.turnId,
          who: "user" as const,
          text,
          source,
          seconds,
          at: Date.now(),
        },
      ],
    };
    try {
      await persist(next);
      if (next.mode === "guided") {
        const world = withCurveball(next),
          out = guidedOutput(world);
        await persist({
          ...world,
          status: out.done ? "complete" : "active",
          turns: [
            ...world.turns,
            {
              id: "guided-" + p.requestId,
              who: "ai",
              source: "guided",
              intent: out.intent,
              text: out.speech,
              at: Date.now(),
            },
          ],
        });
      } else await generate(next, p);
    } catch (e) {
      setNotice((e as Error).message); showError((e as Error).message);
    } finally {
      lock.current = false;
    }
  }
  async function retry() {
    const s = current.current;
    if (!s?.pending || lock.current || Date.now() < retryAt) return;
    lock.current = true;
    try {
      const latest = await recover(s);
      if (latest.pending) await generate(latest, latest.pending);
    } catch (e) {
      setNotice((e as Error).message); showError((e as Error).message);
    } finally {
      lock.current = false;
    }
  }
  async function guided() {
    const s = current.current;
    if (!s) return;
    if (s.mode !== "guided")
      await (s.mode==='realtime'?realtimeRequest({action:'pause',id:s.id}):seatRequest({ action: "release", id: s.id })).catch(() => {});
    const next = { ...s, serverLinked: s.serverLinked || s.mode !== "guided", mode: "guided" as const, pending: undefined };
    if (s.pending) {
      const out = guidedOutput(withCurveball(next));
      next.turns = [
        ...next.turns,
        {
          id: "guided-" + s.pending.requestId,
          who: "ai",
          source: "guided",
          text: out.speech,
          intent: out.intent,
          at: Date.now(),
        },
      ];
    }
    await persist(next);
    setNotice(
      "Now in local guided conversation. New questions use authored rules, not Gemini.",
    );
  }
  async function remove(s: SeatSession) {
    if (s.ownerId !== ownerId) return;
    if (s.serverLinked || s.mode !== "guided")
      try {
        await (s.realtime?realtimeRequest:seatRequest)({ action: "delete", id: s.id });
      } catch (e) {
        const gone = ["session-not-found", "session-expired"].includes((e as any).code) || Date.now() - new Date(s.createdAt).getTime() > 86400000;
        if (!gone) {
          setNotice("The server copy could not be deleted. Retry while connected; it expires after 24 hours.");
          return false;
        }
      }
    await db.transaction("rw", db.hotSeats, db.hotSeatAudio, async () => {
      await db.hotSeats.delete(s.id);
      await db.hotSeatAudio.where("runId").equals(s.id).delete();
    });
    if (current.current?.id === s.id) {
      current.current = null;
      setSession(null);
    }
    await refresh();
    return true;
  }
  return {
    session,
    current,
    saved,
    cap,
    busy,
    notice,
    retryAt,
    storageError,
    persist,
    start,
    resume,
    draft,
    send,
    retry,
    guided,
    remove,
    refresh,
    setNotice,
    setSession,
  };
}
