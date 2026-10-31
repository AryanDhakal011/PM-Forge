"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { Dialog } from "@/components/ui/Dialog";
import { useWorkspace } from "@/components/product/WorkspaceProvider";
import { useSettings } from "@/components/providers/SettingsProvider";
import {
  content,
  initial,
  replay,
  reduce,
  clock,
  sentence,
  projection,
  isStrong,
  conclusion,
  type Action,
  type Draft,
  type State,
  type Position,
  type Tone,
  type Receipt,
} from "@/lib/sacred-no/engine";
import {
  createRun,
  listRuns,
  loadRun,
  saveRun,
  exportRun,
  branchRun,
  type Run,
} from "@/lib/sacred-no/storage";
import { useVoice } from "./useVoice";
import TeamConversation from "./TeamConversation";
import CallComposer, { callSteps } from "./CallComposer";
import {
  conversationFor,
  conversationPreferences,
  type ConversationPlan,
} from "@/lib/sacred-no/conversations";
const Arrival = dynamic(() => import("@/components/projects/Entrance"), {
  ssr: false,
});
const arrivalProject = {
  id: "sacred-no",
  title: "The Sacred No",
  category: "strategy",
};
import s from "./SacredNo.module.css";
const BlastField = dynamic(() => import("./BlastField"), {
  ssr: false,
  loading: () => <p>Preparing audience coverage…</p>,
});
const defaultDraft: Draft = {
  position: "no",
  evidence: [],
  alternative: "data",
  ask: "tess",
  deadline: "board",
  tone: "direct",
};
const validScenes = Object.keys(content.beats);
function Portrait({
  person,
  mood = "neutral",
  large = false,
}: {
  person: string;
  mood?: string;
  large?: boolean;
}) {
  const row = content.people.findIndex((p) => p.id === person),
    col =
      mood === "approving"
        ? 3
        : mood === "annoyed"
          ? 2
          : mood === "thinking"
            ? 1
            : 0;
  return (
    <span
      className={s.portrait}
      data-large={large}
      role="img"
      aria-label={`${person}, ${mood}`}
      style={
        {
          backgroundPosition: `${(col * 100) / 3}% ${Math.max(0, row) * 25}%`,
        } as CSSProperties
      }
    />
  );
}
const personTrust = (state: State, id: string) =>
  id === "Kian"
    ? state.CT
    : id === "Priya"
      ? state.ET
      : id === "Tess"
        ? state.ST
        : state.CR;
const relationship = (n: number) =>
  n >= 75
    ? "Trusting"
    : n >= 60
      ? "Warm"
      : n >= 45
        ? "Neutral"
        : n >= 30
          ? "Cold"
          : "Angry";
export default function SacredNoExperience() {
  const { profile, loading: identityLoading } = useWorkspace(),
    { reducedMotion } = useSettings(),
    owner = profile?.id || "memory-guest";
  const [run, setRun] = useState<Run | null>(null),
    [runs, setRuns] = useState<Run[]>([]),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [panel, setPanel] = useState<
      | "people"
      | "case"
      | "settings"
      | "pause"
      | "help"
      | "evidence"
      | "resume"
      | null
    >(null),
    [receiptId, setReceiptId] = useState<string | null>(null);
  const [sound, setSound] = useState(false),
    [calm, setCalm] = useState(false),
    [autoPlay, setAutoPlay] = useState(false),
    [largeText, setLargeText] = useState(false),
    [guides, setGuides] = useState(true);
  const [draft, setDraft] = useState<Draft>(defaultDraft),
    [hours, setHours] = useState(5),
    [segments, setSegments] = useState<string[]>([]),
    [selectedEvidence, setSelectedEvidence] = useState(""),
    [lockEvidence, setLockEvidence] = useState(""),
    [lockPosition, setLockPosition] = useState<Position>("no");
  const [dealTone, setDealTone] = useState<Tone>("warm"),
    [inspectedDeal, setInspectedDeal] = useState<string[]>([]),
    [confirmCall, setConfirmCall] = useState(false),
    [confirmLock, setConfirmLock] = useState(false);
  const [preview, setPreview] = useState<{ kind: string; step: number } | null>(
      null,
    ),
    [note, setNote] = useState(""),
    [pro, setPro] = useState<string>(""),
    [caseSeen, setCaseSeen] = useState(0);
  const root = useRef<HTMLDivElement>(null),
    stage = useRef<HTMLElement>(null),
    mutation = useRef(false),
    proSeen = useRef(new Set<string>()),
    seenCoach = useRef(new Set<string>());
  const [dialogue, setDialogue] = useState<ConversationPlan | null>(null),
    [arrival, setArrival] = useState(true),
    [callStep, setCallStep] = useState(0);
  const shownScenes = useRef(new Set<string>()),
    conversationSerial = useRef(0);
  const state = useMemo(() => (run ? replay(run.events) : initial()), [run]),
    beat = content.beats[state.scene],
    effectsPaused =
      !!panel ||
      !!receiptId ||
      confirmCall ||
      confirmLock ||
      !!preview ||
      arrival,
    paused = effectsPaused || !!dialogue;
  const voice = useVoice(sound, paused),
    last = state.receipts.at(-1),
    quiet = calm || reducedMotion;
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [original, setOriginal] = useState<Run | null>(null);
  useEffect(() => {
    if (!loaded || !navigator.serviceWorker) return;
    void navigator.serviceWorker.ready
      .then((reg) => reg.active?.postMessage({ type: "CACHE_SACRED_SHELL" }))
      .catch(() => {});
  }, [loaded]);
  const lastSfx = useRef("");
  const lineId = voiceId || state.lastLine,
    line = content.lines.find((l) => l.id === lineId) || content.lines[0];
  const p = projection(state),
    coach = guides && !seenCoach.current.has(state.scene);
  useEffect(() => {
    try {
      const prefs = JSON.parse(
        localStorage.getItem("pmforge.sacred.prefs.v1") || "{}",
      );
      setSound(prefs.sound === true);
      setCalm(prefs.calm === true);
      setAutoPlay(conversationPreferences(prefs).autoPlay);
      setLargeText(prefs.largeText === true);
      setGuides(conversationPreferences(prefs).guides);
    } catch {}
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        "pmforge.sacred.prefs.v1",
        JSON.stringify({
          conversationVersion: 2,
          sound,
          calm,
          autoPlay,
          largeText,
          guides,
        }),
      );
    } catch {}
  }, [sound, calm, autoPlay, largeText, guides, loaded]);
  useEffect(() => {
    if (identityLoading) return;
    let active = true;
    setLoaded(false);
    const refresh = async () => {
      try {
        const rows = await listRuns(owner);
        if (!active) return;
        setRuns(rows);
        const id = new URLSearchParams(location.search).get("run");
        const current = id ? await loadRun(id, owner) : null;
        if (!active) return;
        setRun(current);
        setDialogue(null);
        setNote(current?.note || "");
        if (current) {
          setArrival(false);
          const st = replay(current.events);
          setHours(st.SG);
          setSegments(st.segments);
          setDraft(st.draft || defaultDraft);
          setLockPosition(st.plan === "ship" ? "guarded" : st.plan);
          if (st.inspected.length) setLockEvidence(st.inspected[0]);
          setPanel("resume");
        } else if (id)
          setError(
            "This run is not available for this workspace. Start a new run or return to your saved list.",
          );
      } catch {
        if (active)
          setError(
            "Local storage is unavailable. Enable site storage to save a run.",
          );
      } finally {
        if (active) setLoaded(true);
      }
    };
    void refresh();
    const pop = () => void refresh();
    window.addEventListener("popstate", pop);
    return () => {
      active = false;
      window.removeEventListener("popstate", pop);
    };
  }, [owner, identityLoading]);
  useEffect(() => {
    voice.stop();
    setVoiceId(null);
    if (!run) return;
    setHours(state.SG);
    setSegments(state.segments);
    if (state.inspected.length && !lockEvidence)
      setLockEvidence(state.inspected[0]);
    stage.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
    const ctx = gsap.context(() => {
      if (quiet) return;
      gsap.fromTo(
        stage.current,
        { opacity: 0.4, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, clearProps: "transform,opacity" },
      );
    }, root);
    return () => ctx.revert();
  }, [state.scene, run?.id, quiet]);
  useEffect(() => {
    if (!run || state.effect === "none") return;
    const ctx = gsap.context(() => {
      if (quiet) return;
      if (last?.scene === "deals" && state.JIT >= 3)
        gsap.fromTo(
          stage.current,
          { x: -0.8 },
          {
            x: 0.8,
            duration: 0.08,
            repeat: 5,
            yoyo: true,
            clearProps: "transform",
          },
        );
      const overlay = root.current?.querySelector("[data-spectacle]");
      if (overlay) {
        gsap.fromTo(
          overlay,
          { opacity: 0 },
          {
            opacity: state.effect === "gold" ? 0.8 : 0.5,
            duration: 0.5,
            yoyo: true,
            repeat: 1,
          },
        );
      }
      if (state.effect === "cave")
        gsap.fromTo(
          stage.current,
          { scale: 1, filter: "saturate(1)" },
          {
            scale: 1.015,
            filter: "saturate(.35)",
            duration: 2,
            yoyo: true,
            repeat: 1,
            clearProps: "all",
          },
        );
      if (state.effect === "fracture")
        gsap.fromTo(
          "[data-shard]",
          { y: 0, opacity: 0.7 },
          {
            y: 160,
            opacity: 0,
            rotation: (_, el) =>
              Number((el as HTMLElement).dataset.shard) * 3 - 30,
            duration: 1.4,
            stagger: 0.015,
          },
        );
    }, root);
    return () => ctx.revert();
  }, [run?.revision, quiet]);
  useEffect(() => {
    if (
      !run ||
      !last ||
      !["call", "priya", "deals", "rollout", "board"].includes(last.scene) ||
      proSeen.current.size >= 5 ||
      proSeen.current.has(last.concept)
    )
      return;
    proSeen.current.add(last.concept);
    setPro(last.concept);
    const t = setTimeout(() => setPro(""), 8000);
    return () => clearTimeout(t);
  }, [run?.revision]);
  useEffect(() => {
    const targets = [
      stage.current,
      ...Array.from(
        root.current?.querySelectorAll("[data-spectacle],[data-shard]") || [],
      ),
    ].filter(Boolean);
    gsap
      .getTweensOf(targets)
      .forEach((t) => (effectsPaused ? t.pause() : t.resume()));
  }, [effectsPaused]);
  useEffect(() => {
    if (!run?.parentId) {
      setOriginal(null);
      return;
    }
    let active = true;
    void loadRun(run.parentId, owner)
      .then((r) => {
        if (active) setOriginal(r);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [run?.id, owner]);
  useEffect(() => {
    if (
      !sound ||
      effectsPaused ||
      !run ||
      state.effect === "none" ||
      lastSfx.current === `${run.id}:${run.revision}`
    )
      return;
    lastSfx.current = `${run.id}:${run.revision}`;
    let ctx: AudioContext | undefined;
    try {
      ctx = new AudioContext();
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      const now = ctx.currentTime;
      o.frequency.setValueAtTime(
        state.effect === "gold"
          ? 660
          : state.effect === "cave"
            ? 90
            : state.effect === "fracture"
              ? 160
              : 440,
        now,
      );
      o.frequency.exponentialRampToValueAtTime(
        state.effect === "gold" ? 990 : 70,
        now + 0.4,
      );
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.025, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      o.start();
      o.stop(now + 0.55);
      o.onended = () => void ctx?.close();
    } catch {
      void ctx?.close();
    }
  }, [run?.revision, sound, effectsPaused]);
  function present(plan: Omit<ConversationPlan, "key">) {
    voice.stop();
    setDialogue(
      plan.ids.length
        ? {
            ...plan,
            key: `${run?.id || "new"}:${++conversationSerial.current}`,
          }
        : null,
    );
  }
  function focusTask() {
    setDialogue(null);
    requestAnimationFrame(() => {
      const selectors: Record<string, string> = {
        evidence: `.${s.evidenceGrid} button:not(:disabled)`,
        resources: 'input[type="range"]',
        rehearsal: `.${s.lensGrid} button:not(:disabled)`,
        call: `[data-call-step] .${s.composerOption},[data-call-step] input`,
        priya: `.${s.resource} .${s.quickReplies} button`,
        deals: `.${s.dealGrid} .${s.textButton}`,
        rollout: `.${s.segmentGrid} input`,
        lock: `.${s.paper} select`,
        board: `.${s.paper} button`,
        final: `.${s.quickReplies} button`,
        debrief: `.${s.conclusion}`,
      };
      const link =
        dialogue?.ids.includes("G-LINK") && state.scene === "evidence";
      const target =
        (link
          ? stage.current?.querySelector<HTMLElement>(
              "[data-claim-board] button:not(:disabled)",
            )
          : null) ||
        stage.current?.querySelector<HTMLElement>(
          selectors[state.scene] || "button:not(:disabled)",
        ) ||
        stage.current;
      if (!target) return;
      if (!target.matches("button,input,select,a")) target.tabIndex = -1;
      target.scrollIntoView({
        block: "center",
        behavior: quiet ? "instant" : "smooth",
      });
      target.focus({ preventScroll: true });
      target.classList.add(s.taskSpotlight);
      setTimeout(() => target.classList.remove(s.taskSpotlight), 2400);
    });
  }
  useEffect(() => {
    if (!run || !loaded || effectsPaused || dialogue) return;
    const key = `${run.id}:${state.scene}`;
    if (shownScenes.current.has(key)) return;
    shownScenes.current.add(key);
    present(conversationFor(state, undefined, guides));
  }, [run?.id, state.scene, loaded, effectsPaused, dialogue, guides]);
  useEffect(() => {
    setCallStep(0);
  }, [run?.id, state.scene]);
  function telemetry(name: string, detail: Record<string, unknown> = {}) {
    try {
      const key = `pmforge.sacred.analytics.v1:${owner}`;
      const events = JSON.parse(localStorage.getItem(key) || "[]");
      events.push({
        name,
        runId: run?.id,
        scene: state.scene,
        at: new Date().toISOString(),
        ...detail,
      });
      localStorage.setItem(key, JSON.stringify(events.slice(-300)));
    } catch {}
  }
  async function commit(action: Action) {
    if (!run || mutation.current) return;
    mutation.current = true;
    setBusy(true);
    setError("");
    try {
      const nextState = reduce(state, action);
      const next = {
        ...run,
        events: [...run.events, { action, at: new Date().toISOString() }],
        revision: run.revision + 1,
        updatedAt: new Date().toISOString(),
      };
      await saveRun(next, run.revision);
      setRun(next);
      setVoiceId(null);
      seenCoach.current.add(state.scene);
      telemetry(
        (
          {
            INSPECT: "evidence_opened",
            CALL: "compose_no_submitted",
            DEAL: "deal_accepted",
            DEMO: "demo_result",
          } as Record<string, string>
        )[action.type] || action.type.toLowerCase(),
        { next: nextState.scene },
      );
      if (action.type === "CALL")
        telemetry("call_outcome", { line: nextState.lastLine });
      if (nextState.effect !== "none")
        telemetry(
          (nextState.effect === "gold" ? "golden" : nextState.effect) +
            "_triggered",
        );
      if (nextState.scene !== state.scene)
        telemetry("scene_enter", { next: nextState.scene });
      if (action.type === "INSPECT") {
        setSelectedEvidence(action.id);
      }
      if (action.type === "CALL") {
        setConfirmCall(false);
        setLockPosition(nextState.plan === "ship" ? "guarded" : nextState.plan);
      }
      if (action.type === "LOCK") setConfirmLock(false);
      shownScenes.current.add(`${run.id}:${nextState.scene}`);
      present(conversationFor(nextState, action, guides));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save this choice. Your previous run is intact.",
      );
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }
  async function start() {
    if (mutation.current) return;
    mutation.current = true;
    setBusy(true);
    try {
      const r = createRun(owner);
      await saveRun(r);
      history.pushState(null, "", `?run=${r.id}`);
      setRun(r);
      setDialogue(null);
      setNote("");
      setDraft(defaultDraft);
      setPanel(null);
      setCaseSeen(0);
      proSeen.current.clear();
      setError("");
      telemetry("scene_enter", { next: "cold" });
      void navigator.storage?.persist?.();
    } catch {
      setError(
        "The run could not be saved. Enable local site storage and try again.",
      );
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }
  async function resume(r: Run) {
    try {
      const checked = await loadRun(r.id, owner);
      if (!checked) throw Error("Run is unavailable.");
      history.pushState(null, "", `?run=${r.id}`);
      setRun(checked);
      setNote(checked.note);
      const st = replay(checked.events);
      setDraft(st.draft || defaultDraft);
      setHours(st.SG);
      setSegments(st.segments);
      setLockPosition(st.plan === "ship" ? "guarded" : st.plan);
      setLockEvidence(st.inspected[0] || "");
      setPanel("resume");
    } catch (e) {
      setError(String(e));
    }
  }
  async function fork(index: number) {
    if (!run || busy) return;
    setBusy(true);
    try {
      const branch = branchRun(run, index);
      await saveRun(branch);
      history.pushState(null, "", `?run=${branch.id}`);
      setRun(branch);
      setNote("");
      setPreview(null);
      setPanel("resume");
      const st = replay(branch.events);
      setDraft(st.draft || defaultDraft);
      setLockEvidence(st.inspected[0] || "");
      setLockPosition(st.plan === "ship" ? "guarded" : st.plan);
      proSeen.current.clear();
      telemetry("branch_replayed", { index });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  const open = (next: typeof panel) => {
    if (next === "help") {
      const plan = conversationFor(state);
      present(
        state.scene === "call"
          ? {
              ...plan,
              ids: [callSteps[callStep].line],
              task: callSteps[callStep].help,
            }
          : plan,
      );
      return;
    }
    voice.stop();
    setPanel(next);
    if (next === "case" || next === "evidence")
      setCaseSeen(state.receipts.length);
    if (next === "pause") telemetry("pause");
  };
  const speak = (id: string) => {
    present({
      ...conversationFor(state),
      title: "Your team · conversation",
      ids: [id],
      reply: false,
    });
  };
  const chooseEvidence = (id: string) =>
    setDraft((d) => ({
      ...d,
      evidence: d.evidence.includes(id)
        ? d.evidence.filter((x) => x !== id)
        : d.evidence.length < 2
          ? [...d.evidence, id]
          : d.evidence,
    }));
  const toggleSegment = (id: string) =>
    setSegments((v) =>
      v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
    );
  const next = () => void commit({ type: "NEXT" });
  const callStrong = isStrong(draft.evidence),
    callCave =
      draft.position === "ship" ||
      (draft.tone === "hedged" &&
        !callStrong &&
        ["no", "guarded"].includes(draft.position));
  const lookup = (id: string) => content.evidence.find((e) => e.id === id);
  const selectedReceipt = state.receipts.find((r) => r.id === receiptId);
  const major = state.receipts.filter((r) =>
    [
      "cold",
      "call",
      "priya",
      "deals",
      "rollout",
      "lock",
      "board",
      "final",
    ].includes(r.scene),
  );
  const modelState = { ...state, segments };
  const forecast = projection(modelState);
  return (
    <div
      ref={root}
      className={s.game}
      data-sacred-scene={state.scene}
      style={
        {
          "--case-bg": "#07090a",
          "--case-ink": "#d6e8dc",
          "--case-accent": "#6cff9b",
        } as CSSProperties
      }
      data-calm={quiet}
      data-large={largeText}
      data-day={["board", "final", "debrief"].includes(state.scene) && !!run}
    >
      <div className={s.ambient} aria-hidden="true" />
      <div
        className={s.spectacle}
        data-spectacle=""
        data-effect={state.effect}
        aria-hidden="true"
      >
        {state.effect === "fracture" &&
          Array.from({ length: 24 }, (_, i) => (
            <i
              key={i}
              data-shard={i}
              style={{
                left: `${(i % 8) * 12.5}%`,
                top: `${Math.floor(i / 8) * 33}%`,
              }}
            />
          ))}
      </div>
      {loaded && arrival && (
        <Arrival
          project={arrivalProject}
          onDone={() => setArrival(false)}
          skipImmediately
          calm={quiet}
          copy={[
            "A promise already made.",
            "Now decide what you can stand behind.",
          ]}
        />
      )}
      <header className={s.topbar} inert={arrival}>
        <Link href="/app/projects" onClick={() => telemetry("exit")}>
          ← Projects
        </Link>
        <Link
          href="/app/projects/sacred-no"
          className={s.wordmark}
          onClick={(e) => {
            if (!run) return;
            e.preventDefault();
            voice.stop();
            history.pushState(null, "", "/app/projects/sacred-no");
            setRun(null);
            void listRuns(owner)
              .then(setRuns)
              .catch(() => {});
          }}
        >
          PMFORGE <span>/ THE SACRED NO</span>
        </Link>
        <div className={s.topActions}>
          {run && (
            <span className={s.clock} aria-label="Story clock">
              {clock(state)}{" "}
              <small>
                {state.TM > 0
                  ? `${Math.floor(state.TM / 60)}h ${state.TM % 60}m to board`
                  : "BOARD IN SESSION"}
              </small>
            </span>
          )}
          <button onClick={() => open("settings")}>Settings</button>
          {run && (
            <>
              <button
                className={state.receipts.length > caseSeen ? s.caseCue : ""}
                onClick={() => open("case")}
              >
                Case file{" "}
                {state.receipts.length > caseSeen && (
                  <span aria-label="New evidence or consequences">●</span>
                )}
              </button>
              <button onClick={() => open("pause")}>Pause</button>
            </>
          )}
        </div>
      </header>
      {error && (
        <div role="alert" className={s.error}>
          {error}
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}
      {!loaded ? (
        <main className={s.entrance} inert={arrival}>
          <p>Opening your workspace…</p>
        </main>
      ) : !run ? (
        <main className={s.entrance} inert={arrival}>
          <div className={s.entryCopy}>
            <p className={s.eyebrow}>
              KETTLE · A FICTIONAL STARTUP · PROJECT 02
            </p>
            <h1>
              The
              <br />
              <em>Sacred No.</em>
            </h1>
            <p className={s.lede}>
              Your CEO made a promise.
              <br />
              Your team has to survive it.
            </p>
            <p>
              A midnight demand. A board at nine. Build a decision you can stand
              behind.
            </p>
            <div className={s.entryMeta}>
              <span>3 acts</span>
              <span>Your pace</span>
              <span>Autosaves every decision</span>
            </div>
            <div className={s.entryActions}>
              <Button primary onClick={() => void start()}>
                Open the message ↗
              </Button>
              <div
                className={s.playbackChoice}
                role="group"
                aria-label="Conversation playback"
              >
                <button
                  className={sound ? s.primary : s.button}
                  aria-pressed={sound}
                  onClick={() => setSound(true)}
                >
                  Hear the team · sound + captions
                </button>
                <button
                  className={!sound ? s.primary : s.button}
                  aria-pressed={!sound}
                  onClick={() => setSound(false)}
                >
                  Read captions only
                </button>
              </div>
            </div>
            <small>
              {content.notice}. About 40 minutes intended; actual play time is
              uncalibrated. Pause anywhere.
            </small>
          </div>
          <div className={s.phone}>
            <div className={s.phoneNotch} />
            <span className={s.eyebrow}>11:47 PM</span>
            <Portrait person="Kian" large />
            <h2>Kian Mercer</h2>
            <p>CEO · voice note · urgent</p>
            <div className={s.wave} aria-hidden="true">
              {Array.from({ length: 35 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    height: `${8 + Math.abs(Math.sin(i * 1.8)) * 30}px`,
                  }}
                />
              ))}
            </div>
            <p>“Tomorrow, nine a.m. Live Drops, in front of the board.”</p>
            <span className={s.phoneBadge}>1 UNREAD MESSAGE</span>
          </div>
          {runs.length > 0 && (
            <section className={s.saved}>
              <h2>Your saved nights</h2>
              {runs.map((r) => (
                <article key={r.id}>
                  <div>
                    <strong>
                      {r.parentId ? "Branch" : "Original"} ·{" "}
                      {replay(r.events).outcome ||
                        content.beats[replay(r.events).scene].title}
                    </strong>
                    <small>{new Date(r.updatedAt).toLocaleString()}</small>
                  </div>
                  <Button onClick={() => void resume(r)}>Continue →</Button>
                  <Button onClick={() => exportRun(r)}>Export</Button>
                </article>
              ))}
            </section>
          )}
        </main>
      ) : (
        <>
          <section className={s.goal} aria-label="Current role and goal">
            <div>
              <small>YOU · HEAD OF PRODUCT / ACT {beat.act} OF 3</small>
              <strong>{beat.goal}</strong>
            </div>
            <div>
              <span>Now: {beat.now}</span>
              <small>{beat.cost}</small>
            </div>
            <button onClick={() => open("help")}>? Guide</button>
          </section>
          <div className={s.desk}>
            <aside className={s.peopleRail}>
              <p className={s.eyebrow}>KETTLE / THE NIGHT DESK</p>
              <div className={s.company}>
                <strong>38 people.</strong>
                <p>
                  14 months of runway.
                  <br />
                  210,000 monthly users.
                </p>
              </div>
              <p className={s.eyebrow}>IN THIS CONVERSATION</p>
              {content.people
                .filter((p) => p.id !== "Lena" || beat.act === 3)
                .map((person) => (
                  <button
                    key={person.id}
                    className={s.personRow}
                    onClick={() => open("people")}
                  >
                    <Portrait
                      person={person.id}
                      mood={
                        personTrust(state, person.id) < 40
                          ? "annoyed"
                          : "neutral"
                      }
                    />
                    <span>
                      <strong>{person.name}</strong>
                      <small>{person.role}</small>
                      <em>{relationship(personTrust(state, person.id))}</em>
                    </span>
                  </button>
                ))}
              <div className={s.railNote}>
                <small>COMPOSURE</small>
                <p>
                  {state.JIT >= 3
                    ? "Under pressure · your hedges invite negotiation"
                    : state.JIT
                      ? "A little unsettled"
                      : "Steady"}
                </p>
                <small>
                  Time passes through choices, never through reading.
                </small>
              </div>
            </aside>
            <main
              ref={stage}
              tabIndex={-1}
              className={s.stage}
              aria-label={beat.title}
              inert={paused}
            >
              <div className={s.sceneTitle}>
                <p className={s.eyebrow}>
                  {beat.act === 1
                    ? "MIDNIGHT REQUEST"
                    : beat.act === 2
                      ? "STAKEHOLDER SQUEEZE"
                      : "BOARDROOM VERDICT"}
                </p>
                <h1>{beat.title}</h1>
              </div>
              {coach && state.scene !== "cold" && state.scene !== "debrief" && (
                <div className={s.coach}>
                  <span>
                    {beat.now}{" "}
                    {state.scene === "evidence"
                      ? "Every drag also has a tap alternative."
                      : "Preview first. Your choice is saved when you commit."}
                  </span>
                  <button
                    onClick={() => {
                      seenCoach.current.add(state.scene);
                      setGuides(false);
                    }}
                  >
                    Hide automatic guides
                  </button>
                </div>
              )}
              {state.scene === "cold" && (
                <div className={s.coldReady}>
                  <span className={s.eyebrow}>INCOMING / KIAN MERCER</span>
                  <Portrait person="Kian" large />
                  <h2>A promise has already left the room.</h2>
                  <p>
                    You are Head of Product. Hear what the team needs, then
                    choose your reply.
                  </p>
                  <Button
                    primary
                    onClick={() => present(conversationFor(state))}
                  >
                    Answer the incoming message →
                  </Button>
                </div>
              )}
              {state.scene === "evidence" && (
                <>
                  <div className={s.claimBoard} data-claim-board="">
                    <div className={s.claimRoot}>SHIP LIVE DROPS AT 9</div>
                    {content.claims.map((claim, i) => {
                      const sources = Object.entries(state.links).filter(
                        ([, claims]) => claims.includes(i),
                      );
                      const broken = sources.some(([id]) =>
                        lookup(id)?.breaks.includes(i),
                      );
                      const supported = sources.some(([id]) =>
                        lookup(id)?.supports.includes(i),
                      );
                      return (
                        <button
                          className={s.claim}
                          key={claim}
                          data-broken={broken}
                          data-supported={supported}
                          disabled={busy || !selectedEvidence}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const id =
                              e.dataTransfer.getData("sacred-evidence");
                            if (id) void commit({ type: "LINK", id, claim: i });
                          }}
                          onClick={() =>
                            selectedEvidence &&
                            void commit({
                              type: "LINK",
                              id: selectedEvidence,
                              claim: i,
                            })
                          }
                        >
                          <span>
                            {broken
                              ? "╳ CHALLENGED"
                              : supported
                                ? "✓ SUPPORTED"
                                : "○ UNTESTED CLAIM"}
                          </span>
                          <strong>{claim}</strong>
                          <small>
                            {sources.length
                              ? sources
                                  .map(([id]) => lookup(id)?.title)
                                  .join(" · ")
                              : selectedEvidence
                                ? `Test with ${lookup(selectedEvidence)?.title}`
                                : "Choose collected evidence below"}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                  <div className={s.sectionLabel}>
                    <h2>Open a source</h2>
                    <span>{state.research} / 110 research minutes used</span>
                  </div>
                  <div className={s.evidenceGrid}>
                    {content.evidence.map((e) => (
                      <article
                        className={s.evidenceCard}
                        key={e.id}
                        data-collected={state.inspected.includes(e.id)}
                      >
                        <span className={s.fileLabel}>
                          SOURCE / {e.id.toUpperCase()}
                        </span>
                        <h3>{e.title}</h3>
                        {state.inspected.includes(e.id) ? (
                          <>
                            <p>{e.reading}</p>
                            <small>{e.detail}</small>
                            <button
                              className={
                                selectedEvidence === e.id ? s.primary : s.button
                              }
                              draggable
                              onDragStart={(ev) =>
                                ev.dataTransfer.setData("sacred-evidence", e.id)
                              }
                              onClick={() => {
                                setSelectedEvidence(e.id);
                                root.current
                                  ?.querySelector("[data-claim-board]")
                                  ?.scrollIntoView({
                                    behavior: quiet ? "instant" : "smooth",
                                    block: "start",
                                  });
                              }}
                            >
                              {selectedEvidence === e.id
                                ? "Selected · choose a claim above"
                                : "Select to test a claim"}
                            </button>
                          </>
                        ) : (
                          <>
                            <p>
                              {e.cost} story minutes · inspect before citing
                            </p>
                            <Button
                              disabled={state.research + e.cost > 110}
                              onClick={() =>
                                void commit({ type: "INSPECT", id: e.id })
                              }
                            >
                              Investigate · {e.cost} min →
                            </Button>
                          </>
                        )}
                      </article>
                    ))}
                  </div>
                  <div className={s.actionBar}>
                    <small>
                      You may continue without complete evidence. Unknowns
                      remain visible.
                    </small>
                    <Button primary onClick={next}>
                      Choose the engineering allocation →
                    </Button>
                  </div>
                </>
              )}
              {state.scene === "resources" && (
                <>
                  <div className={s.resource}>
                    <div>
                      <span className={s.eyebrow}>
                        OVERNIGHT ENGINEERING BUDGET
                      </span>
                      <h2>
                        {hours}h safeguards <span>/ {10 - hours}h feature</span>
                      </h2>
                      <p>
                        Protect the release boundary, or spend more time on Live
                        Drops.
                      </p>
                    </div>
                    <label>
                      Safeguard hours
                      <input
                        aria-label="Safeguard hours"
                        type="range"
                        min="0"
                        max={state.maxHours}
                        value={hours}
                        onChange={(e) => setHours(Number(e.target.value))}
                      />
                    </label>
                    <Capacity state={{ ...state, SG: hours }} />
                    <p className={s.muted}>
                      Live Drops needs at least two feature hours for a
                      production demonstration. Capacity is a model, not a
                      guarantee. Payments have a separate limit. A kill switch
                      contains failures; it adds no capacity.
                    </p>
                    <Button
                      primary
                      onClick={() => void commit({ type: "ALLOCATE", hours })}
                    >
                      Reserve this allocation · 10 min →
                    </Button>
                  </div>
                </>
              )}
              {state.scene === "rehearsal" && (
                <>
                  <p className={s.lede}>
                    Learn his lens. Keep your own judgment.
                  </p>
                  <p>
                    This is a private rehearsal. Kian has not heard these
                    arguments.
                  </p>
                  <div className={s.lensGrid}>
                    {content.lenses.map((l) => (
                      <button
                        key={l.id}
                        disabled={
                          busy ||
                          state.lenses.length >= 3 ||
                          state.lenses.includes(l.id)
                        }
                        onClick={() =>
                          void commit({ type: "REHEARSE", lens: l.id })
                        }
                      >
                        <span>
                          {state.lenses.includes(l.id)
                            ? "✓ TRIED"
                            : "15 MINUTES"}
                        </span>
                        <strong>{l.label}</strong>
                        <small>
                          {state.lenses.includes(l.id)
                            ? content.lines.find((x) => x.id === l.line)?.text
                            : "Try this argument →"}
                        </small>
                      </button>
                    ))}
                  </div>
                  <div className={s.actionBar}>
                    <p>
                      {state.lenses.length} / 3 rehearsals. No single argument
                      guarantees agreement.
                    </p>
                    <Button primary onClick={next}>
                      Call Kian now →
                    </Button>
                  </div>
                </>
              )}
              {state.scene === "call" && (
                <>
                  <div className={s.callHeading}>
                    <Portrait person="Kian" large mood="thinking" />
                    <div>
                      <span className={s.eyebrow}>OUTGOING / KIAN MERCER</span>
                      <h2>
                        A clear decision.
                        <br />
                        Something he can take to the board.
                      </h2>
                    </div>
                  </div>
                  <CallComposer
                    draft={draft}
                    inspected={state.inspected}
                    step={callStep}
                    busy={busy}
                    onChange={setDraft}
                    onReview={() => setConfirmCall(true)}
                    onStep={(step) => {
                      setCallStep(step);
                      present({
                        ...conversationFor(state),
                        ids: [callSteps[step].line],
                        task: callSteps[step].help,
                        finish: "Show me this part",
                        reply: false,
                      });
                    }}
                  />
                </>
              )}
              {state.scene === "priya" && (
                <>
                  <div className={s.timeJump}>
                    <span>OVERNIGHT → MORNING</span>
                    <strong>
                      {state.shortMorning
                        ? "Your long night leaves a shorter morning."
                        : "The board is still at nine."}
                    </strong>
                  </div>
                  {state.backchannel && (
                    <div className={s.warning}>
                      <b>BACK-CHANNEL</b>
                      <p>
                        {
                          content.lines.find((l) => l.id === "BACKCHANNEL")
                            ?.text
                        }
                      </p>
                      <small>
                        Kian’s trust fell after your call. Tess has heard a
                        different promise.
                      </small>
                    </div>
                  )}
                  <Message
                    person="Priya"
                    id={
                      state.plan === "ship"
                        ? "PRIYA-IGNORED"
                        : state.strong
                          ? "PRIYA-LISTENED"
                          : "PRIYA-NEUTRAL"
                    }
                    sound={sound}
                    onPlay={speak}
                  />
                  <div className={s.resource}>
                    <h2>
                      {Math.min(state.SG, state.maxHours)} safeguard hours
                      available
                    </h2>
                    <p>
                      {state.maxHours < 10
                        ? "Her release boundary caps the available safeguard allocation at five hours."
                        : "Your evidence-backed approach kept the engineering options open."}
                    </p>
                    <div className={s.quickReplies}>
                      <Button
                        primary
                        onClick={() =>
                          void commit({ type: "PRIYA", queue: true })
                        }
                      >
                        Isolate the queue + assign rollback owner
                      </Button>
                      <Button
                        onClick={() =>
                          void commit({ type: "PRIYA", queue: false })
                        }
                      >
                        Keep the current allocation
                      </Button>
                    </div>
                  </div>
                  {ReceiptCallback(state, "priya", setReceiptId)}
                </>
              )}
              {state.scene === "deals" && (
                <>
                  <Message
                    person="Tess"
                    id={state.JIT >= 3 ? "DEAL-HEDGE" : "OPEN-TESS"}
                    sound={sound}
                    onPlay={speak}
                  />
                  <TonePicker value={dealTone} onChange={setDealTone} />
                  {state.backchannel && (
                    <p className={s.warning}>
                      Kian has already approached Tess. A new commitment costs
                      more trust.
                    </p>
                  )}
                  <div className={s.dealGrid}>
                    {content.deals.map((d) => (
                      <article
                        key={d.id}
                        className={s.deal}
                        data-accepted={state.deals.includes(d.id)}
                      >
                        <span className={s.fileLabel}>
                          {state.deals.includes(d.id)
                            ? "✓ IN YOUR LEDGER"
                            : "PROPOSED TRADE"}
                        </span>
                        <h2>{d.title}</h2>
                        <p>{d.upside}</p>
                        <button
                          className={s.textButton}
                          aria-expanded={inspectedDeal.includes(d.id)}
                          onClick={() =>
                            setInspectedDeal((v) =>
                              v.includes(d.id)
                                ? v.filter((x) => x !== d.id)
                                : [...v, d.id],
                            )
                          }
                        >
                          Inspect the cost and release obligation ↓
                        </button>
                        {inspectedDeal.includes(d.id) && (
                          <div className={s.dealCost}>
                            <p>
                              <b>Cost later:</b> {d.cost}
                            </p>
                            <p>{d.risk}</p>
                          </div>
                        )}
                        <Button
                          disabled={
                            !inspectedDeal.includes(d.id) ||
                            state.deals.includes(d.id) ||
                            state.deals.length >= 2 ||
                            state.TM < 55 ||
                            (d.id === "apology" &&
                              state.deals.some((x) =>
                                ["risk", "marlo"].includes(x),
                              )) ||
                            (["risk", "marlo"].includes(d.id) &&
                              state.deals.includes("apology"))
                          }
                          onClick={() =>
                            void commit({
                              type: "DEAL",
                              id: d.id,
                              tone: dealTone,
                            })
                          }
                        >
                          Accept commitment · 20 min
                        </Button>
                      </article>
                    ))}
                  </div>
                  <div className={s.actionBar}>
                    <p>
                      {state.deals.length} / 2 commitments. You may refuse every
                      trade.
                    </p>
                    <Button primary onClick={next}>
                      Finish negotiation →
                    </Button>
                  </div>
                </>
              )}
              {state.scene === "rollout" && (
                <>
                  <p className={s.lede}>Every dot is someone’s checkout.</p>
                  <BlastField state={modelState} calm={quiet} />
                  <div className={s.segmentGrid}>
                    {content.segments.map((seg) => (
                      <label key={seg.id} className={s.segment}>
                        <input
                          type="checkbox"
                          checked={segments.includes(seg.id)}
                          onChange={() => toggleSegment(seg.id)}
                        />
                        <span>
                          <b>{seg.label}</b>
                          <small>
                            {Math.round(seg.share * 100)}% cohort · {seg.note}
                          </small>
                        </span>
                      </label>
                    ))}
                  </div>
                  <Capacity state={modelState} />
                  <p>
                    {state.deals.some((id) =>
                      ["risk", "marlo", "beta"].includes(id),
                    )
                      ? "A partner commitment sets minimum exposure even if you deselect every cohort."
                      : "Select nobody for an alternative or a deferral. Live proposals require an audience."}
                  </p>
                  <Button
                    primary
                    onClick={() => void commit({ type: "ROLLOUT", segments })}
                  >
                    Lock this exposure · 15 min →
                  </Button>
                </>
              )}
              {state.scene === "lock" && (
                <>
                  <div className={s.paper}>
                    <span className={s.eyebrow}>BOARD PROPOSAL / BEFORE 9</span>
                    <Choice
                      label="Plan to present"
                      value={lockPosition}
                      options={content.positions.filter((x) => x.id !== "ship")}
                      onChange={(value) => setLockPosition(value as Position)}
                    />
                    <label className={s.field}>
                      Strongest collected evidence
                      <select
                        value={lockEvidence}
                        onChange={(e) => setLockEvidence(e.target.value)}
                      >
                        <option value="">Choose a collected source</option>
                        {state.inspected.map((id) => (
                          <option key={id} value={id}>
                            {lookup(id)?.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Capacity state={state} />
                    {state.deals.some((id) =>
                      ["risk", "marlo"].includes(id),
                    ) && (
                      <p className={s.warning}>
                        You promised production access. The board proposal must
                        include that commitment.
                      </p>
                    )}
                    <Button
                      primary
                      disabled={!lockEvidence}
                      onClick={() => setConfirmLock(true)}
                    >
                      Review and lock the board plan →
                    </Button>
                    {!state.inspected.length && (
                      <div className={s.warning}>
                        <p>
                          You chose not to investigate. You cannot present an
                          evidence-backed proposal.
                        </p>
                        <Button
                          onClick={() =>
                            void commit({
                              type: "LOCK",
                              position: "defer",
                              evidence: "",
                              uninformed: true,
                            })
                          }
                        >
                          Record the evidence gap; hand decision to Kian
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
              {state.scene === "board" && (
                <>
                  <Message
                    person="Lena"
                    id={state.CR >= 70 ? "BOARD-WEEK" : "BOARD-OPEN"}
                    sound={sound}
                    onPlay={speak}
                  />
                  <div className={s.paper}>
                    <span className={s.eyebrow}>KETTLE / BOARD MATERIAL</span>
                    <h2>
                      {state.plan === "guarded" || state.plan === "ship"
                        ? "Live Drops · production demonstration"
                        : state.alternative === "none"
                          ? "Launch decision deferred"
                          : content.alternatives.find(
                              (a) => a.id === state.alternative,
                            )?.label}
                    </h2>
                    <p>
                      Evidence cited:{" "}
                      {lookup(state.lockedEvidence)?.title ||
                        "None — decision handed to CEO"}
                    </p>
                    {state.plan === "guarded" || state.plan === "ship" ? (
                      <Capacity state={state} />
                    ) : (
                      <div className={s.metricCard}>
                        <strong>
                          {state.alternative === "data"
                            ? "2.8s → 2.6s"
                            : "No public exposure"}
                        </strong>
                        <p>
                          {state.alternative === "data"
                            ? "Checkout p95 planning forecast · 7% faster target, not a measured result. The next step is validation."
                            : "A sandbox or postponement does not establish production capacity."}
                        </p>
                      </div>
                    )}
                    <Button
                      primary
                      onClick={() => void commit({ type: "DEMO" })}
                    >
                      {state.plan === "guarded" || state.plan === "ship"
                        ? "Start the demonstration →"
                        : "Present the alternative →"}
                    </Button>
                  </div>
                  {ReceiptCallback(state, "board", setReceiptId)}
                </>
              )}
              {state.scene === "final" && (
                <>
                  <div className={s.boardResult} data-result={state.demo}>
                    <span className={s.eyebrow}>
                      DEMONSTRATION / {state.demo?.toUpperCase()}
                    </span>
                    <h2>
                      {state.demo === "unready"
                        ? "The feature was not ready to show."
                        : state.golden
                          ? "A better question for the board."
                          : ["crash", "payments", "marlo"].includes(
                                state.demo || "",
                              )
                            ? "The promise met its limit."
                            : state.demo === "degraded"
                              ? "Containment worked. Some viewers lost access."
                              : "The room saw the decision you made."}
                    </h2>
                    <p>{last?.because}</p>
                    {["ship", "guarded"].includes(state.plan) && (
                      <DemoChart state={state} calm={quiet} />
                    )}
                    {quiet && state.effect !== "none" && (
                      <small>
                        Calm effects:{" "}
                        {state.effect === "gold"
                          ? "the deck’s alternative is acknowledged"
                          : state.effect === "fracture"
                            ? "the demonstration failed"
                            : "your decision changes the room"}
                        .
                      </small>
                    )}
                  </div>
                  <Message
                    person="Lena"
                    id={
                      state.golden
                        ? "BOARD-GOLD"
                        : ["crash", "payments", "marlo"].includes(
                              state.demo || "",
                            )
                          ? "BOARD-FAIL"
                          : ["stable", "degraded"].includes(state.demo || "")
                            ? "BOARD-STABLE"
                            : "BOARD-OPEN"
                    }
                    sound={sound}
                    onPlay={speak}
                  />
                  <p className={s.muted}>
                    Your commitments and exact call remain in the board record.
                  </p>
                  {state.deals.length > 0 && (
                    <Message
                      person="Tess"
                      id="BOARD-LEDGER"
                      sound={sound}
                      onPlay={speak}
                    />
                  )}
                  <div className={s.quickReplies}>
                    <Button
                      primary
                      onClick={() =>
                        void commit({ type: "FINAL", move: "own" })
                      }
                    >
                      Acknowledge the result and own it
                    </Button>
                    <Button
                      onClick={() =>
                        void commit({ type: "FINAL", move: "defend" })
                      }
                    >
                      Defend it; state a reversal condition
                    </Button>
                    <Button
                      onClick={() =>
                        void commit({ type: "FINAL", move: "rollback" })
                      }
                    >
                      Propose rollback and an owner
                    </Button>
                    {state.CR >= 70 && (
                      <Button
                        onClick={() =>
                          void commit({ type: "FINAL", move: "week" })
                        }
                      >
                        Ask the board for one week
                      </Button>
                    )}
                  </div>
                </>
              )}
              {state.scene === "debrief" && (
                <>
                  <div className={s.conclusion}>
                    <span className={s.eyebrow}>
                      YOUR RUN, IN BRIEF / {state.outcome}
                    </span>
                    <h2>{conclusion(state)}</h2>
                    <p>
                      {state.demo === "data"
                        ? "You presented a forecast. The next proof is a measured checkout test."
                        : state.demo === "sandbox"
                          ? "The sandbox preserved a demonstration, without proving production readiness."
                          : last?.because}
                    </p>
                    <h3>The choices that shaped it</h3>
                    {[
                      major.find((r) => r.scene === "call"),
                      major.findLast((r) => r.scene === "deals") ||
                        major.find((r) => r.scene === "priya"),
                      major.find((r) => r.scene === "board"),
                    ]
                      .filter(Boolean)
                      .map((r) => (
                        <button
                          key={r!.id}
                          className={s.causeRow}
                          onClick={() => setReceiptId(r!.id)}
                        >
                          <span>
                            {r!.scene === "call"
                              ? `Your call: ${content.positions.find((x) => x.id === state.draft?.position)?.label}; ${content.alternatives.find((x) => x.id === state.draft?.alternative)?.label}.`
                              : r!.words}
                          </span>
                          <b>→</b>
                          <span>{r!.because}</span>
                        </button>
                      ))}
                  </div>
                  <details
                    className={s.details}
                    onToggle={(e) => {
                      if (e.currentTarget.open) telemetry("debrief_trace_open");
                    }}
                  >
                    <summary>
                      Explore your decisions, missed signals and alternate paths
                    </summary>
                    <p className={s.archetype}>
                      {state.archetype}{" "}
                      <small>
                        Simulation pattern · not a calibrated assessment
                      </small>
                    </p>
                    <div className={s.trace}>
                      {major.slice(-7).map((r) => (
                        <ReceiptCard
                          key={r.id}
                          receipt={r}
                          onOpen={() => setReceiptId(r.id)}
                          onFork={() => void fork(r.eventIndex - 1)}
                        />
                      ))}
                    </div>
                    <h2>Signals worth revisiting</h2>
                    <ul>
                      {!state.inspected.includes("payments") && (
                        <li>
                          You left the payment limits email unopened. Viewer
                          capacity and payment capacity differ.
                        </li>
                      )}
                      {!state.queue && (
                        <li>
                          Priya asked for a release boundary; queue isolation
                          remained off.
                        </li>
                      )}
                      {state.JIT > 0 && (
                        <li>
                          Hedged wording let other people reinterpret your
                          commitment.
                        </li>
                      )}
                      {state.inspected.includes("tickets") && (
                        <li>
                          Demand was real. A refusal still needed an alternative
                          for customers.
                        </li>
                      )}
                      {state.JIT === 0 &&
                        state.queue &&
                        state.inspected.includes("payments") && (
                          <li>
                            You investigated the provider and named a rollback
                            boundary. Keep validating the model.
                          </li>
                        )}
                    </ul>
                    {original && (
                      <div className={s.paper}>
                        <h2>Original → this branch</h2>
                        <p>
                          {replay(original.events).outcome || "In progress"} →{" "}
                          {state.outcome}
                        </p>
                        <p>
                          Original plan: {replay(original.events).plan}. This
                          plan: {state.plan}.
                        </p>
                        <p>
                          Original commitments:{" "}
                          {replay(original.events).deals.join(", ") || "none"}.
                          This branch: {state.deals.join(", ") || "none"}.
                        </p>
                        <small>
                          These are recorded outcomes from two runs, not an
                          inferred counterfactual.
                        </small>
                      </div>
                    )}
                    <h2>Try a different decision</h2>
                    <div className={s.lensGrid}>
                      {["call", "trade", "demo"].map((kind) => (
                        <button
                          key={kind}
                          onClick={() => {
                            setPreview({ kind, step: 0 });
                            telemetry("hindsight_opened", { kind });
                          }}
                        >
                          <span>AUTHORED HINDSIGHT</span>
                          <strong>
                            {kind === "call"
                              ? "A different No"
                              : kind === "trade"
                                ? "A smaller promise"
                                : "A smaller audience"}
                          </strong>
                          <small>
                            Preview the trade-off; replay as a separate branch →
                          </small>
                        </button>
                      ))}
                    </div>
                    {run.parentId && (
                      <p>
                        Branch of {run.parentId}. Your original is unchanged.{" "}
                        <button
                          className={s.textButton}
                          onClick={() => {
                            const original = runs.find(
                              (r) => r.id === run.parentId,
                            );
                            if (original) void resume(original);
                            else
                              void loadRun(run.parentId!, owner).then(
                                (r) => r && resume(r),
                              );
                          }}
                        >
                          Open original run
                        </button>
                      </p>
                    )}
                  </details>
                  <label className={s.field}>
                    Note to self · optional
                    <input
                      value={note}
                      maxLength={500}
                      placeholder="What would you do differently?"
                      onChange={(e) => setNote(e.target.value)}
                      onBlur={() => {
                        if (note === run.note) return;
                        const updated = {
                          ...run,
                          note,
                          revision: run.revision + 1,
                        };
                        void saveRun(updated, run.revision)
                          .then(() => setRun(updated))
                          .catch((e) => setError(String(e)));
                      }}
                    />
                  </label>
                  <div className={s.actionBar}>
                    <Button primary onClick={() => exportRun({ ...run, note })}>
                      Export this run
                    </Button>
                    <Button onClick={() => void start()}>
                      Start a new night ↗
                    </Button>
                  </div>
                  <small>
                    Saved on this device. Project logs are not included in
                    account sync or general workspace backup.
                  </small>
                </>
              )}
              {run &&
                state.scene !== "cold" &&
                state.scene !== "debrief" &&
                last && (
                  <button
                    className={s.textButton}
                    onClick={() => speak(last.line)}
                  >
                    ↻ Reopen the team’s latest response
                  </button>
                )}
              {voice.status && (
                <p role="status" className={s.muted}>
                  {voice.status}
                </p>
              )}
            </main>
            <aside className={s.context}>
              <div className={s.contextCard}>
                <p className={s.eyebrow}>THE PROMISE</p>
                <h2>
                  Live Drops.
                  <br />
                  Board at nine.
                </h2>
                <p>
                  Autonomy to decide.
                  <br />
                  Responsibility to explain.
                </p>
              </div>
              <div className={s.contextCard}>
                <p className={s.eyebrow}>COMMITMENT LEDGER</p>
                {state.deals.length ? (
                  state.deals.map((id) => (
                    <div className={s.ledgerItem} key={id}>
                      <b>{content.deals.find((d) => d.id === id)?.title}</b>
                      <small>
                        {content.deals.find((d) => d.id === id)?.cost}
                      </small>
                      <button
                        className={s.textButton}
                        onClick={() =>
                          setReceiptId(
                            state.receipts.find(
                              (r) =>
                                r.scene === "deals" &&
                                r.words ===
                                  content.deals.find((d) => d.id === id)?.title,
                            )?.id || null,
                          )
                        }
                      >
                        Open receipt ↗
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No partner commitment yet.</p>
                )}
              </div>
              <div className={s.contextCard}>
                <p className={s.eyebrow}>YOUR EVIDENCE</p>
                {state.inspected.length ? (
                  state.inspected.map((id) => (
                    <button
                      key={id}
                      className={s.evidenceLink}
                      onClick={() => open("evidence")}
                    >
                      ↗ {lookup(id)?.title}
                    </button>
                  ))
                ) : (
                  <p>The assumptions are still untested.</p>
                )}
                <button className={s.textButton} onClick={() => open("case")}>
                  Open the case file →
                </button>
              </div>
              <p className={s.honesty}>
                {content.notice}. Outcomes use a deterministic model; forecasts
                are not real company results.
              </p>
            </aside>
          </div>
          <footer className={s.statusbar}>
            <span>● Saved on this device</span>
            <span>
              {state.caved
                ? "Your promise is in the record."
                : "Your choices leave receipts."}
            </span>
            <button onClick={() => open("case")}>
              Receipts & transcript ↗
            </button>
          </footer>
          <nav className={s.mobileTabs} aria-label="Project tabs">
            <button
              onClick={() => {
                stage.current?.focus();
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
            >
              Now
            </button>
            <button onClick={() => open("people")}>People</button>
            <button onClick={() => open("evidence")}>Evidence</button>
            <button onClick={() => open("case")}>Case</button>
          </nav>
        </>
      )}
      {pro && !paused && state.scene !== "debrief" && (
        <div className={s.proMove} role="status">
          <small>PRO MOVE</small>
          <p>{content.concepts[pro as keyof typeof content.concepts]}</p>
          <button onClick={() => setPro("")}>Dismiss</button>
        </div>
      )}
      {dialogue && run && (
        <TeamConversation
          key={dialogue.key}
          plan={dialogue}
          sound={sound}
          autoAdvance={autoPlay}
          paused={effectsPaused}
          calm={quiet}
          busy={busy}
          onSound={() => setSound((value) => !value)}
          onAutoAdvance={setAutoPlay}
          onPause={() => open("pause")}
          onDone={focusTask}
          onReply={(reply) => void commit({ type: "REPLY", reply })}
        />
      )}
      <Dialog
        open={!!panel}
        title={
          panel === "people"
            ? "People at Kettle"
            : panel === "case"
              ? "Your case file"
              : panel === "evidence"
                ? "Collected evidence"
                : panel === "settings"
                  ? "Experience settings"
                  : panel === "resume"
                    ? "Previously, at Kettle"
                    : panel === "help"
                      ? "Your role and next move"
                      : "Paused · your night is saved"
        }
        onClose={() => setPanel(null)}
        size="lg"
      >
        <div className={s.sheet}>
          {panel === "people" &&
            content.people.map((person) => (
              <article className={s.peopleSheet} key={person.id}>
                <Portrait person={person.id} large />
                <div>
                  <h2>{person.name}</h2>
                  <small>
                    {person.role} ·{" "}
                    {relationship(personTrust(state, person.id))}
                  </small>
                  <p>
                    <b>Wants:</b> {person.want}
                  </p>
                  <p>
                    <b>Fears:</b> {person.fear}
                  </p>
                  <p>
                    <b>Tell:</b> {person.tell}
                  </p>
                  {last && (
                    <button
                      className={s.textButton}
                      onClick={() => {
                        setPanel(null);
                        setReceiptId(last.id);
                      }}
                    >
                      See the latest recorded decision →
                    </button>
                  )}
                </div>
              </article>
            ))}
          {(panel === "case" || panel === "evidence") && (
            <>
              <div className={s.roleCard}>
                <p>
                  You are Head of Product at Kettle, a social shopping startup.
                </p>
                <p>
                  Live Drops is promised for the 9 AM board. You control the
                  recommendation; Kian can overrule it.
                </p>
                <p>
                  Inspect the evidence, make an alternative credible, and
                  account for every commitment.
                </p>
              </div>
              {content.evidence.map((e) => (
                <article className={s.contextCard} key={e.id}>
                  <h3>{e.title}</h3>
                  <p>
                    {state.inspected.includes(e.id)
                      ? e.reading
                      : "Unseen · not available to cite."}
                  </p>
                  {state.inspected.includes(e.id) && <small>{e.detail}</small>}
                </article>
              ))}
              {panel === "case" && (
                <>
                  <h2>Receipts & dialogue transcript</h2>
                  {state.receipts.map((r) => (
                    <article className={s.transcript} key={r.id}>
                      <button
                        className={s.textButton}
                        onClick={() => {
                          setPanel(null);
                          setReceiptId(r.id);
                        }}
                      >
                        {r.id} · {r.words}
                      </button>
                      <p>
                        {content.lines.find((l) => l.id === r.line)?.speaker}:{" "}
                        {content.lines.find((l) => l.id === r.line)?.text}
                      </p>
                      <small>Because: {r.because}</small>
                    </article>
                  ))}
                </>
              )}
              <Button onClick={() => run && exportRun({ ...run, note })}>
                Export run
              </Button>
            </>
          )}
          {panel === "settings" && (
            <>
              <label className={s.check}>
                <input
                  type="checkbox"
                  checked={sound}
                  onChange={(e) => setSound(e.target.checked)}
                />
                Sound + captions · prerecorded cast
              </label>
              <label className={s.check}>
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                />
                Advance conversations after the recording finishes
              </label>
              <label className={s.check}>
                <input
                  type="checkbox"
                  checked={calm}
                  onChange={(e) => setCalm(e.target.checked)}
                />
                Calm effects · no shake, zoom or fracture motion
              </label>
              <label className={s.check}>
                <input
                  type="checkbox"
                  checked={largeText}
                  onChange={(e) => setLargeText(e.target.checked)}
                />
                Larger text
              </label>
              <label className={s.check}>
                <input
                  type="checkbox"
                  checked={!guides}
                  onChange={(e) => setGuides(!e.target.checked)}
                />
                Do not show automatic guides
              </label>
              <p>
                Captions always remain. Playback never advances a decision.
                System reduced-motion preference is respected.
              </p>
              <p>
                Audition the cast with sound enabled. No lips or eyes animate.
              </p>
              <div className={s.quickReplies}>
                {content.people.map((person, i) => (
                  <button
                    key={person.id}
                    className={s.button}
                    disabled={!sound}
                    onClick={() =>
                      voice.play(
                        [
                          "OPEN",
                          "PRIYA-LISTENED",
                          "OPEN-TESS",
                          "BOARD-OPEN",
                          "EV-DASH",
                        ][i],
                      )
                    }
                  >
                    Preview {person.id}
                  </button>
                ))}
              </div>
              <small>
                Neural recordings, not human actors. Direction controls pace and
                pauses; acted emotion is limited by the model.
              </small>
            </>
          )}
          {(panel === "pause" || panel === "resume" || panel === "help") && (
            <>
              <p className={s.eyebrow}>YOU / HEAD OF PRODUCT</p>
              <h2>{beat.goal}</h2>
              <p>{beat.now}</p>
              <p>{beat.cost}</p>
              {last && (
                <div className={s.paper}>
                  <small>LAST CHOICE / {last.id}</small>
                  <p>{last.words}</p>
                  <p>{last.because}</p>
                </div>
              )}
              <p>
                {clock(state)} · {state.TM} story minutes until the board.
                Reading and pausing spend nothing.
              </p>
              <div className={s.quickReplies}>
                <Button primary onClick={() => setPanel(null)}>
                  Continue →
                </Button>
                {run && (
                  <Button onClick={() => exportRun({ ...run, note })}>
                    Export run
                  </Button>
                )}
                <Link
                  className={s.button}
                  href="/app/projects"
                  onClick={() => telemetry("exit")}
                >
                  Save & return to Projects
                </Link>
              </div>
            </>
          )}
        </div>
      </Dialog>
      <Dialog
        open={!!selectedReceipt}
        title={
          selectedReceipt
            ? `${selectedReceipt.id} · Your decision receipt`
            : "Receipt"
        }
        onClose={() => setReceiptId(null)}
        size="lg"
      >
        <div className={s.sheet}>
          {selectedReceipt && (
            <>
              <small>
                {content.beats[selectedReceipt.scene].title} ·{" "}
                {selectedReceipt.minute} story minutes after the first message
              </small>
              <blockquote>{selectedReceipt.words}</blockquote>
              <p>
                <b>What followed:</b> {selectedReceipt.because}
              </p>
              <p>
                {
                  content.concepts[
                    selectedReceipt.concept as keyof typeof content.concepts
                  ]
                }
              </p>
              {selectedReceipt.source && (
                <Button onClick={() => setReceiptId(selectedReceipt.source!)}>
                  See the earlier choice that caused this →
                </Button>
              )}
              <details>
                <summary>Exact simulation variables at this decision</summary>
                <pre>
                  {JSON.stringify(
                    (() => {
                      const snapshot = replay(
                        run!.events.slice(0, selectedReceipt.eventIndex),
                      );
                      return Object.fromEntries(
                        ["CT", "ST", "ET", "CR", "SY", "SG", "TM", "JIT"].map(
                          (k) => [k, snapshot[k as keyof State]],
                        ),
                      );
                    })(),
                    null,
                    2,
                  )}
                </pre>
              </details>
              {state.scene === "debrief" && (
                <Button
                  onClick={() => {
                    setReceiptId(null);
                    void fork(selectedReceipt.eventIndex - 1);
                  }}
                >
                  Replay from before this decision ↗
                </Button>
              )}
            </>
          )}
        </div>
      </Dialog>
      <Dialog
        open={confirmCall}
        title="Say this to Kian?"
        onClose={() => setConfirmCall(false)}
        size="lg"
      >
        <div className={s.sheet}>
          <p className={s.sentence}>{sentence(draft)}</p>
          <p>
            This spends 20 story minutes. Your exact words become a receipt.
          </p>
          <p>
            {callCave
              ? "Warning: this can be received as an unguarded launch commitment."
              : "The preview is directional; Kian still has his own interests."}
          </p>
          <div className={s.quickReplies}>
            <Button onClick={() => setConfirmCall(false)}>
              Change something
            </Button>
            <Button
              primary
              onClick={() => void commit({ type: "CALL", draft })}
            >
              Say it →
            </Button>
          </div>
        </div>
      </Dialog>
      <Dialog
        open={confirmLock}
        title="Your board plan, in one screen"
        onClose={() => setConfirmLock(false)}
        size="lg"
      >
        <div className={s.sheet}>
          <p>
            Plan: {content.positions.find((x) => x.id === lockPosition)?.label}
          </p>
          <p>Evidence: {lookup(lockEvidence)?.reading}</p>
          <p>
            Commitments:{" "}
            {state.deals
              .map((id) => content.deals.find((d) => d.id === id)?.title)
              .join("; ") || "None"}
          </p>
          <p>
            {p.load} forecast viewers / {p.cap} modelled capacity. Payment
            attempts: {p.payment} / 1,500 per minute.
          </p>
          <p>
            {state.deals.some((id) => ["risk", "marlo"].includes(id))
              ? "Your production commitment makes the final proposal a live release."
              : "The board will see the proposal exactly as recorded."}
          </p>
          <div className={s.quickReplies}>
            <Button onClick={() => setConfirmLock(false)}>
              Change something
            </Button>
            <Button
              primary
              onClick={() =>
                void commit({
                  type: "LOCK",
                  position: lockPosition,
                  evidence: lockEvidence,
                })
              }
            >
              Lock it · 10 min →
            </Button>
          </div>
        </div>
      </Dialog>
      <Dialog
        open={!!preview}
        title="An alternate night · authored preview"
        onClose={() => setPreview(null)}
        size="lg"
      >
        <div className={s.sheet}>
          {preview && (
            <>
              <small>
                Preview {preview.step + 1} of 3 · not a promise of a better
                ending
              </small>
              <h2>
                {
                  (
                    {
                      call: [
                        "Lead with the release risk.",
                        "Offer a bounded alternative.",
                        "Carry the cost into the board.",
                      ],
                      trade: [
                        "Inspect the partner obligation.",
                        "Offer three brands, not everyone.",
                        "A smaller promise still needs an owner.",
                      ],
                      demo: [
                        "Choose a narrower audience.",
                        "Check payments as well as viewers.",
                        "Containment limits damage; it is not free.",
                      ],
                    } as Record<string, string[]>
                  )[preview.kind][preview.step]
                }
              </h2>
              <p>
                The original receipts stay intact. A branch lets you test the
                actual rules with a different choice.
              </p>
              <div className={s.quickReplies}>
                {preview.step < 2 ? (
                  <Button
                    primary
                    onClick={() =>
                      setPreview({ ...preview, step: preview.step + 1 })
                    }
                  >
                    Next →
                  </Button>
                ) : (
                  <Button
                    primary
                    onClick={() => {
                      const type =
                        preview.kind === "call"
                          ? "CALL"
                          : preview.kind === "trade"
                            ? "DEAL"
                            : "ROLLOUT";
                      const index = run!.events.findIndex(
                        (e) => e.action.type === type,
                      );
                      void fork(
                        index >= 0
                          ? index
                          : run!.events.findIndex(
                              (e) =>
                                e.action.type === "NEXT" &&
                                replay(
                                  run!.events.slice(0, run!.events.indexOf(e)),
                                ).scene === "deals",
                            ),
                      );
                    }}
                  >
                    Replay from here ↗
                  </Button>
                )}
                <Button onClick={() => setPreview(null)}>Skip preview</Button>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
}
function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className={s.field}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
function TonePicker({
  value,
  onChange,
}: {
  value: Tone;
  onChange: (v: Tone) => void;
}) {
  return (
    <fieldset className={s.tones}>
      <legend>Tone · changes your phrasing and how it lands</legend>
      {(["direct", "warm", "hedged"] as const).map((t) => (
        <label key={t}>
          <input
            type="radio"
            name={"tone"}
            checked={value === t}
            onChange={() => onChange(t)}
          />
          {t}
        </label>
      ))}
    </fieldset>
  );
}
function Capacity({ state }: { state: State }) {
  const p = projection(state);
  return (
    <div className={s.capacity} data-risk={p.risk}>
      <div>
        <span>Forecast concurrent viewers</span>
        <strong>{p.load.toLocaleString()}</strong>
      </div>
      <div>
        <span>Modelled capacity</span>
        <strong>{p.cap.toLocaleString()}</strong>
      </div>
      <div className={s.loadBar} aria-hidden="true">
        <i
          style={{
            width: `${Math.min(100, (p.load / Math.max(p.cap * 1.4, 1)) * 100)}%`,
          }}
        />
        <b style={{ left: `${100 / 1.4}%` }} />
      </div>
      <p>
        {p.risk === "failure"
          ? "Failure exposure"
          : p.risk === "risky"
            ? "Near the boundary"
            : "Within the modelled boundary"}{" "}
        · {state.killSwitch ? "kill switch available" : "no kill switch"} ·{" "}
        {state.queue ? "queue isolated" : "queue not isolated"}
      </p>
      <small>
        Payments: {p.payment.toLocaleString()} forecast attempts/minute;
        provider limit 1,500.{" "}
        {p.paymentRisk ? "THROTTLING RISK" : "Inside this payment forecast"}.
      </small>
    </div>
  );
}
function Message({
  person,
  id,
  onPlay,
}: {
  person: string;
  id: string;
  sound: boolean;
  onPlay: (id: string) => void;
}) {
  return (
    <button className={s.messageReplay} onClick={() => onPlay(id)}>
      <Portrait person={person} />
      <span>
        Speak with {person}
        <small>
          {content.people.find((p) => p.id === person)?.role} · reopen
          conversation ↗
        </small>
      </span>
    </button>
  );
}
function ReceiptCallback(
  state: State,
  scene: string,
  onOpen: (id: string) => void,
) {
  const fs = state.fuses.filter((f) => f.firesAt === scene && f.fired);
  return fs.length ? (
    <div className={s.callback}>
      <small>THEN → NOW / YOUR WORDS RETURN</small>
      {fs.slice(0, 3).map((f) => (
        <button key={f.id} onClick={() => onOpen(f.receiptId)}>
          <span>{state.receipts.find((r) => r.id === f.receiptId)?.words}</span>
          <b>See original receipt ↗</b>
        </button>
      ))}
    </div>
  ) : null;
}
function ReceiptCard({
  receipt: r,
  onOpen,
  onFork,
}: {
  receipt: Receipt;
  onOpen: () => void;
  onFork: () => void;
}) {
  return (
    <article className={s.traceCard}>
      <small>
        {r.id} · {content.beats[r.scene].title}
      </small>
      <h3>{r.words}</h3>
      <p>→ {r.because}</p>
      <span>
        {content.concepts[r.concept as keyof typeof content.concepts]}
      </span>
      <div>
        <button className={s.textButton} onClick={onOpen}>
          Receipt & exact numbers
        </button>
        <button className={s.textButton} onClick={onFork}>
          Replay from here ↗
        </button>
      </div>
    </article>
  );
}

function Button({
  children,
  onClick,
  disabled = false,
  primary = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      className={primary ? s.primary : s.button}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function DemoChart({ state, calm }: { state: State; calm: boolean }) {
  const ref = useRef<SVGPathElement>(null),
    [skip, setSkip] = useState(false),
    p = projection(state);
  const y = 190 - Math.min(170, (p.load / Math.max(p.cap, 1)) * 110);
  useEffect(() => {
    if (!ref.current || calm || skip) return;
    const path = ref.current,
      len = path.getTotalLength();
    const tween = gsap.fromTo(
      path,
      { strokeDasharray: len, strokeDashoffset: len },
      { strokeDashoffset: 0, duration: 2, ease: "power2.inOut" },
    );
    return () => {
      tween.kill();
      gsap.set(path, { clearProps: "strokeDasharray,strokeDashoffset" });
    };
  }, [calm, skip]);
  return (
    <figure className={s.demoChart}>
      <figcaption>SIMULATED TRAFFIC RAMP · FINAL RELEASE MODEL</figcaption>
      <svg
        viewBox="0 0 600 220"
        role="img"
        aria-label={`Forecast traffic reaches ${p.load} viewers. Modelled capacity ${p.cap}. Result ${state.demo}.`}
      >
        <path d="M25 80H580" stroke="#ffc857" strokeDasharray="5 5" />
        <text x="30" y="68" fill="#ffc857" fontSize="12">
          Capacity {p.cap.toLocaleString()}
        </text>
        <path
          ref={ref}
          d={`M25 190 C160 190 250 ${y + 35} 580 ${y}`}
          fill="none"
          stroke={state.demo === "stable" ? "#6cff9b" : "#ff9b83"}
          strokeWidth="3"
        />
        <text x="370" y="205" fill="#d6e8dc" fontSize="12">
          Forecast {p.load.toLocaleString()} viewers
        </text>
      </svg>
      {!calm && !skip && (
        <button className={s.textButton} onClick={() => setSkip(true)}>
          Show final frame
        </button>
      )}
      <small>
        Authored simulation, not live production telemetry. The decision
        controls remain available during playback.
      </small>
    </figure>
  );
}
