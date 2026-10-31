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
import Arrival from "@/components/projects/Entrance";
import { Dialog } from "@/components/ui/Dialog";
import { useWorkspace } from "@/components/product/WorkspaceProvider";
import { useSettings } from "@/components/providers/SettingsProvider";
import {
  people,
  drawers,
  layers,
  guides,
  headlines,
  asks,
  metricOptions,
  type DrawerId,
  type Person,
} from "@/lib/ghost-metric/content";
import { conversation, type Line } from "@/lib/ghost-metric/dialogue";
import {
  initial,
  replay,
  reduce,
  band,
  capacity,
  definition,
  metricPreview,
  defaultMetric,
  conclusion,
  type Action,
  type Metric,
  type State,
  type Framing,
  type Exploit,
} from "@/lib/ghost-metric/engine";
import {
  createRun,
  loadRun,
  listRuns,
  saveRun,
  branchRun,
  exportRun,
  type Run,
} from "@/lib/ghost-metric/storage";
import Portrait from "./Portrait";
import JoinPicker from "./JoinPicker";
import Conversation, { type ConversationPlan } from "./Conversation";
import AnimatedNumber from "./AnimatedNumber";
import MissedTells from "./MissedTells";
import UnitSample from "./UnitSample";
import ResourceChip from "./ResourceChip";
import UncertaintyBand from "./UncertaintyBand";
import { useAmbient } from "./useAmbient";
import {
  openingSequence,
  guideCard,
  guideGroups,
  remainingActions,
  currentCost,
  chooseVariant,
  sourceColumns,
  type VariantHistory,
} from "@/lib/ghost-metric/presentation";
import { useVoice } from "./useVoice";
import s from "./GhostMetric.module.css";
const Bubble = dynamic(() => import("./MetricBubble"), {
  ssr: false,
  loading: () => <BubblePoster />,
});
const arrivalProject = {
  id: "ghost-metric",
  title: "The Ghost Metric",
  category: "execution-metrics",
};
function BubblePoster() {
  return (
    <svg viewBox="0 0 360 270" aria-hidden="true">
      <defs>
        <radialGradient id="ghost-poster">
          <stop stopColor="#faf9f6" />
          <stop offset=".7" stopColor="#d7eee5" />
          <stop offset=".9" stopColor="#e4d3ed" />
          <stop offset="1" stopColor="#cfe3ff" />
        </radialGradient>
      </defs>
      <circle
        cx="180"
        cy="133"
        r="111"
        fill="url(#ghost-poster)"
        stroke="#bcb4c0"
        strokeWidth=".8"
      />
      <ellipse
        cx="180"
        cy="133"
        rx="117"
        ry="29"
        fill="none"
        stroke="#a45205"
        opacity=".4"
        transform="rotate(-24 180 133)"
      />
      <path
        d="M112 61q37-25 72-22"
        fill="none"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
const chapter = (scene: string) =>
  ["cold", "unit", "audit", "estimate", "carry", "promise"].includes(scene)
    ? 1
    : ["stakeholders", "slides"].includes(scene)
      ? 2
      : 3;
const titles: Record<string, [string, string]> = {
  cold: [
    "A number everyone believes.",
    "You are three weeks into the job. The CEO has just announced 340% growth.",
  ],
  unit: [
    "One call. Or four?",
    "A request times out. The client retries it. Is that a new unit of customer demand?",
  ],
  audit: [
    "Open the number.",
    "Six drawers. Twelve audit hours. You cannot inspect everything.",
  ],
  estimate: [
    "Put uncertainty on the record.",
    "Estimate the share of reported growth that is counting noise, not new demand.",
  ],
  carry: [
    "What leaves this room?",
    "You know enough to make a choice. You do not know everything.",
  ],
  promise: [
    "A question that will return.",
    "Elena is closing the board pack. Choose words you can stand behind later.",
  ],
  stakeholders: [
    "Truth travels through people.",
    "Who hears the concern first, and how do you bring it into the room?",
  ],
  slides: [
    "Three slides. One decision.",
    "An opening, the evidence behind it, and a clear ask.",
  ],
  metric: [
    "Define something worth growing.",
    "Write a reproducible rule. The preview follows every counting choice.",
  ],
  redteam: [
    "Now try to game it.",
    "The red team uses your definition exactly as written. You have three fix hours.",
  ],
  secondSource: [
    "One more source.",
    "Ravi needs independent validation after the earlier confrontation.",
  ],
  rollout: [
    "The work after the decision.",
    "A new definition means dashboards, targets, and a migration people must deliver.",
  ],
  board: [
    "Put your name to it.",
    "Anders wants a claim he can reproduce. The room remembers your earlier words.",
  ],
};
const loopholeInfo: Record<Exploit, [string, string, string]> = {
  dedupe: [
    "Repeated completions",
    "“Every completion event counted.”",
    "Retry a request and count the repeated event as growth.",
  ],
  streams: [
    "Streaming chunks",
    "“Streams counted per chunk.”",
    "Make responses longer. More chunks become more “calls”.",
  ],
  exclusions: [
    "Mutable traffic tags",
    "“Exclude traffic tags only” or no exclusions.",
    "Rename a test tag and internal traffic returns to the numerator.",
  ],
  segments: [
    "A total without a cohort view",
    "“All customer cohorts.”",
    "The total hides that enterprise customers account for most real growth.",
  ],
  quality: [
    "Quality can fall while volume grows",
    "Only latency, or no quality guardrail.",
    "Increase throughput while errors grow. Add both quality guardrails.",
  ],
};
type Panel =
  | "people"
  | "case"
  | "help"
  | "settings"
  | "pause"
  | "resume"
  | "rule"
  | null;
export default function GhostMetricExperience() {
  const { profile, loading: identityLoading } = useWorkspace(),
    { reducedMotion } = useSettings();
  const owner = profile?.id || "";
  const [run, setRun] = useState<Run | null>(null),
    [runs, setRuns] = useState<Run[]>([]),
    [loaded, setLoaded] = useState(false),
    [arrival, setArrival] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [panel, setPanel] = useState<Panel>(null);
  const [sound, setSound] = useState(false),
    [ambient, setAmbient] = useState(true),
    [calm, setCalm] = useState(false),
    [soft, setSoft] = useState(false),
    [guidance, setGuidance] = useState(true),
    [auto, setAuto] = useState(false),
    [prefsReady, setPrefsReady] = useState(false),
    [dismissed, setDismissed] = useState<string[]>([]),
    [tab, setTab] = useState("now");
  const [dialogue, setDialogue] = useState<ConversationPlan | null>(null),
    [joinSource, setJoinSource] = useState<DrawerId | null>(null),
    [joinReading, setJoinReading] = useState<Line | undefined>(),
    [activeDrawer, setActiveDrawer] = useState<DrawerId | null>(null),
    [point, setPoint] = useState(70),
    [low, setLow] = useState(40),
    [high, setHigh] = useState(95),
    [evidence, setEvidence] = useState<DrawerId[]>([]),
    [spec, setSpec] = useState<Metric>(defaultMetric),
    [verifyId, setVerifyId] = useState<DrawerId>("sdk"),
    [note, setNote] = useState(""),
    [confirm, setConfirm] = useState<Action | null>(null),
    [recovery, setRecovery] = useState(0);
  const stage = useRef<HTMLElement>(null),
    root = useRef<HTMLDivElement>(null),
    mutation = useRef(false),
    lastPresented = useRef(""),
    variantHistory = useRef<VariantHistory>({}),
    serial = useRef(0),
    briefingSeen = useRef(new Set<string>()),
    freshReveal = useRef(false);
  const state = useMemo(() => (run ? replay(run.events) : initial()), [run]),
    b = band(state),
    quiet = calm || reducedMotion;
  const paused = !!panel || arrival || !!confirm;
  const voice = useVoice(sound, paused || !!activeDrawer);
  const ambientStatus = useAmbient(
    ambient,
    arrival || panel === "pause" || panel === "resume",
  );
  useEffect(() => {
    try {
      const p = JSON.parse(
        localStorage.getItem("pmforge.ghost.prefs.v1") || "{}",
      );
      setSound(p.sound === true);
      setAmbient(p.ambient !== false);
      setDismissed(
        Array.isArray(p.seenGuides)
          ? p.seenGuides.filter((v: unknown) => typeof v === "string")
          : [],
      );
      const variants = JSON.parse(
        localStorage.getItem("pmforge.ghost.variants.v2") || "{}",
      );
      if (variants && typeof variants === "object" && !Array.isArray(variants))
        variantHistory.current = variants;
      setCalm(p.calm === true);
      setSoft(p.soft === true);
      setGuidance(p.guidance !== false);
      setAuto(p.auto === true);
    } catch {}
    setPrefsReady(true);
  }, []);
  useEffect(() => {
    if (prefsReady)
      try {
        localStorage.setItem(
          "pmforge.ghost.prefs.v1",
          JSON.stringify({
            sound,
            ambient,
            calm,
            soft,
            guidance,
            auto,
            seenGuides: dismissed,
          }),
        );
      } catch {}
  }, [sound, ambient, calm, soft, guidance, auto, dismissed, prefsReady]);
  useEffect(() => {
    if (identityLoading || !owner) return;
    let active = true,
      request = 0;
    async function load() {
      const ticket = ++request;
      setLoaded(false);
      setRun(null);
      setDialogue(null);
      voice.stop();
      try {
        const saved = await listRuns(owner);
        const id = new URL(location.href).searchParams.get("run");
        const selected = id ? await loadRun(id, owner) : null;
        if (id && !selected)
          throw Error(
            "This run is not saved for this workspace. Return to the project and start a new audit.",
          );
        if (active && ticket === request) {
          setRuns(saved);
          setRun(selected);
          setNote(selected?.note || "");
          if (selected) setPanel("resume");
        }
      } catch (e) {
        if (active && ticket === request) setError((e as Error).message);
      } finally {
        if (active && ticket === request) setLoaded(true);
      }
    }
    void load();
    const pop = () => {
      lastPresented.current = "";
      void load();
    };
    window.addEventListener("popstate", pop);
    return () => {
      active = false;
      window.removeEventListener("popstate", pop);
    };
  }, [owner, identityLoading, recovery]);
  useEffect(() => {
    if (!run || arrival || !loaded || panel) return;
    const key = run.id + ":" + run.revision;
    if (lastPresented.current === key) return;
    lastPresented.current = key;
    const lastAction = run.events.at(-1)?.action.type;
    let rows = pickLines(state.lastConversation);
    if (lastAction === "JOIN") {
      setJoinReading(rows[0]);
      return;
    }
    if (!run.events.length) {
      let seen = briefingSeen.current.has(run.id);
      try {
        seen =
          seen ||
          localStorage.getItem("pmforge.ghost.briefed.v2:" + run.id) === "yes";
      } catch {}
      if (!seen) {
        setDialogue({ key, lines: openingSequence(), kind: "intro" });
        return;
      }
      return;
    }
    if (lastAction === "CLASSIFY")
      rows = [...rows, ...conversation("invitation")];
    if (!rows.length) return;
    if (
      run.events.at(-1)?.action.type === "BOARD" &&
      freshReveal.current &&
      !quiet
    ) {
      const t = setTimeout(
        () => setDialogue({ key, lines: rows, kind: "story" }),
        1400,
      );
      return () => clearTimeout(t);
    }
    setDialogue({ key, lines: rows, kind: "story" });
  }, [
    run?.id,
    run?.revision,
    arrival,
    loaded,
    panel,
    state.lastConversation,
    quiet,
  ]);
  useEffect(() => {
    if (quiet || !loaded || !stage.current) return;
    const ctx = gsap.context(
      () =>
        gsap.fromTo(
          stage.current,
          { opacity: 0.35, y: 12 },
          { opacity: 1, y: 0, duration: 0.35, clearProps: "transform,opacity" },
        ),
      stage,
    );
    return () => ctx.revert();
  }, [state.scene, quiet, loaded]);
  useEffect(() => {
    if (!root.current) return;
    const tween = gsap.to(root.current, {
      backgroundColor:
        state.DEF >= 3 ? "#f3e4ca" : soft ? "#f3efe6" : "#faf9f6",
      duration: quiet ? 0 : 0.6,
    });
    return () => {
      tween.kill();
    };
  }, [state.DEF, soft, quiet]);
  useEffect(() => {
    if (quiet || !root.current) return;
    const ctx = gsap.context(() => {
      if (state.scene === "redteam")
        gsap.fromTo(
          "[data-red-agent]",
          { x: 0 },
          { x: 120, duration: 1.2, ease: "power2.inOut" },
        );
      gsap.fromTo(
        `.${s.layer}:last-child`,
        { opacity: 0.2, y: 8 },
        { opacity: 1, y: 0, duration: 0.6 },
      );
    }, root);
    return () => ctx.revert();
  }, [state.scene, state.proved.length, quiet]);
  useEffect(() => {
    setSpec(state.spec || defaultMetric);
    setEvidence([]);
    setActiveDrawer(null);
    setJoinSource(null);
    setJoinReading(undefined);
    freshReveal.current = false;
  }, [run?.id]);
  function analytics(name: string, detail: Record<string, unknown> = {}) {
    try {
      const key = "pmforge.ghost.analytics.v1:" + owner;
      const log = JSON.parse(localStorage.getItem(key) || "[]");
      log.push({
        name,
        runId: run?.id,
        scene: state.scene,
        at: new Date().toISOString(),
        ...detail,
      });
      localStorage.setItem(key, JSON.stringify(log.slice(-400)));
    } catch {}
  }
  function pickLines(group: string) {
    const rows = chooseVariant(group, variantHistory.current);
    try {
      localStorage.setItem(
        "pmforge.ghost.variants.v2",
        JSON.stringify(variantHistory.current),
      );
    } catch {}
    return rows;
  }
  function beginJoin(id: DrawerId) {
    setActiveDrawer(null);
    setJoinSource(id);
    setError("");
    setJoinReading(undefined);
    showGuide("join");
  }
  function showGuide(key: string, force = false) {
    if (
      !guideCard(key) ||
      !guideGroups[key] ||
      (!force && (!guidance || dismissed.includes(key)))
    )
      return false;
    setDialogue({
      key: "guide:" + key + ":" + ++serial.current,
      kind: "guide",
      guideKey: key,
      lines: pickLines(guideGroups[key]),
    });
    return true;
  }
  function focusTask() {
    if (dialogue?.kind === "intro" && run) {
      briefingSeen.current.add(run.id);
      try {
        localStorage.setItem("pmforge.ghost.briefed.v2:" + run.id, "yes");
      } catch {}
      setDialogue(null);
      void commit({ type: "OPEN" });
      return;
    }
    if (dialogue?.kind === "guide") {
      const key = dialogue.guideKey!;
      setDismissed((v) => (v.includes(key) ? v : [...v, key]));
    } else if (showGuide(state.scene)) return;
    setDialogue(null);
    requestAnimationFrame(() => {
      const e = stage.current?.querySelector<HTMLElement>(
        "button:not(:disabled),input,select",
      );
      e?.focus({ preventScroll: true });
    });
  }
  async function commit(action: Action) {
    if (!run || mutation.current) return;
    mutation.current = true;
    setBusy(true);
    setError("");
    try {
      const next = reduce(state, action);
      const updated = {
        ...run,
        events: [...run.events, { action, at: new Date().toISOString() }],
        revision: run.revision + 1,
        updatedAt: new Date().toISOString(),
      };
      await saveRun(updated, run.revision);
      voice.stop();
      if (action.type === "BOARD") freshReveal.current = true;
      if (
        !quiet &&
        (action.type === "BOARD" || (action.type === "FRAMING" && next.leak))
      )
        navigator.vibrate?.(18);
      setRun(updated);
      setActiveDrawer(null);
      if (action.type !== "JOIN") {
        setJoinSource(null);
        setJoinReading(undefined);
      }
      setConfirm(null);
      setTab("now");
      const names: Partial<Record<Action["type"], string>> = {
        DRAWER: "drawer_opened",
        JOIN: "join_attempted",
        ESTIMATE: "estimate_submitted",
        TELL: "told_first",
        FRAMING: "framing_chosen",
        HEADLINE: "slide_built",
        EVIDENCE: "slide_built",
        ASK: "slide_built",
        METRIC: "metric_built",
        FIX: "loophole_fixed",
        BOARD: "bubble_popped",
      };
      analytics(names[action.type] || action.type.toLowerCase(), { action });
      if (band(next).low > b.low)
        analytics("band_narrowed", {
          low: band(next).low,
          high: band(next).high,
        });
      if (action.type === "METRIC")
        next.loopholes.forEach((id) => analytics("loophole_found", { id }));
      if (action.type === "HEADLINE")
        analytics("room_temp_peak", { defensiveness: next.DEF });
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }
  async function begin() {
    if (!owner || mutation.current) return;
    mutation.current = true;
    setBusy(true);
    try {
      const next = createRun(owner);
      await saveRun(next);
      history.pushState(null, "", "?run=" + next.id);
      setRun(next);
      setNote("");
      setPanel(null);
      setError("");
      lastPresented.current = "";
    } catch (e) {
      setError((e as Error).message);
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }
  async function resume(id: string) {
    try {
      const r = await loadRun(id, owner);
      if (!r) throw Error("Run unavailable.");
      setRun(r);
      setNote(r.note);
      history.pushState(null, "", "?run=" + id);
      setPanel("resume");
      lastPresented.current = "";
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function branch(index: number) {
    if (!run || mutation.current) return;
    mutation.current = true;
    setBusy(true);
    try {
      const next = branchRun(run, index);
      await saveRun(next);
      history.pushState(null, "", "?run=" + next.id);
      setRun(next);
      setNote("");
      setPanel("resume");
      setDialogue(null);
      lastPresented.current = "";
      analytics("branch_replayed", { parentId: run.id, index });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }
  async function saveNote() {
    if (!run || mutation.current) return;
    mutation.current = true;
    try {
      const next = {
        ...run,
        note: note.slice(0, 1000),
        updatedAt: new Date().toISOString(),
      };
      await saveRun(next, run.revision);
      setRun(next);
      setError("");
      analytics("reflection_saved");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      mutation.current = false;
    }
  }
  const actionButton = (text: string, action: Action, secondary = false) => (
    <button
      key={text}
      className={secondary ? undefined : s.primary}
      disabled={busy}
      onClick={() => {
        if (action.type === "METRIC" || action.type === "BOARD")
          setConfirm(action);
        else void commit(action);
      }}
    >
      {text}
    </button>
  );
  const section = (children: ReactNode) => (
    <div className={s.choices}>{children}</div>
  );
  const plan = guides[state.scene];
  const collected = drawers.filter((d) => state.opened.includes(d.id));
  const knownPeople = people.filter(
    (p) => p.id !== "Anders" || chapter(state.scene) === 3,
  );
  const rightRail = (
    <aside className={`${s.rail} ${s.rightRail}`}>
      <p className={s.eyebrow}>THE REPORTED NUMBER</p>
      <div className={s.bubbleReactive}>
        <Bubble
          proved={b.mass}
          calm={quiet}
          reveal={state.scene === "debrief"}
        />
        {b.mass > 0 && !quiet && (
          <span
            key={b.mass}
            className={s.bubbleAcknowledgement}
            aria-hidden="true"
          />
        )}
      </div>
      <div className={s.gauge} aria-live="polite">
        <p className={s.eyebrow}>PROVED, NOT ASSUMED</p>
        <strong>
          <AnimatedNumber value={b.mass} decimals={1} suffix="M" calm={quiet} />{" "}
          <span className={s.muted}>/ 8.5M growth</span>
        </strong>
        <p className={s.muted}>Confirmed counting noise per day.</p>
        <UncertaintyBand low={b.low} high={b.high} calm={quiet} />
        <div className={s.legend}>
          <span>{Math.round(b.low)}% confirmed</span>
          <span>{Math.round(b.high)}% upper bound</span>
        </div>
        <div className={s.layers}>
          {layers
            .filter((l) => state.proved.includes(l.id))
            .map((l) => (
              <div className={s.layer} key={l.id}>
                <span>
                  <i style={{ background: l.color }} />
                  {l.label}
                </span>
                <b>{l.mass.toFixed(1)}M</b>
              </div>
            ))}
        </div>
        <p className={s.notes}>
          Unproved causes stay hidden. The final audit reveals the complete
          anatomy.
        </p>
      </div>
    </aside>
  );
  function stageContent() {
    switch (state.scene) {
      case "cold":
        return (
          <>
            <div className={s.introArt}>
              <div className={s.confetti} aria-hidden="true">
                {Array.from({ length: 24 }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      left: `${(i * 37) % 100}%`,
                      animationDelay: `${i * 0.035}s`,
                    }}
                  />
                ))}
              </div>
              <strong>
                +340<span style={{ fontSize: ".55em" }}>%</span>
              </strong>
              <p className={s.eyebrow}>DAILY MODEL CALLS · THIS QUARTER</p>
              <button
                className={s.coldBubble}
                onClick={() => void commit({ type: "OPEN" })}
                aria-label="Inspect the metric bubble"
              >
                <BubblePoster />
                <span className={s.badge}>
                  Tap the bubble · what counts as one?
                </span>
              </button>
            </div>
            <div className={s.role}>
              <strong>You: PM, Platform Growth · three weeks in.</strong>You own
              the dashboard and roadmap. Ravi owns the metric definition.
            </div>
          </>
        );
      case "unit":
        return (
          <UnitSample
            busy={busy}
            onClassify={(counts) => void commit({ type: "CLASSIFY", counts })}
          />
        );
      case "audit":
        return (
          <>
            <div className={s.grid}>
              {drawers.map((d) => (
                <article
                  className={s.card}
                  data-open={state.opened.includes(d.id)}
                  key={d.id}
                >
                  <span className={s.eyebrow}>{d.kind}</span>
                  <h3>{d.title}</h3>
                  <p>{state.opened.includes(d.id) ? d.reading : d.preview}</p>
                  <div className={s.actions}>
                    <span className={s.badge}>
                      {state.opened.includes(d.id)
                        ? "COLLECTED"
                        : d.cost + " AUDIT HOURS"}
                    </span>
                    <button
                      disabled={
                        busy ||
                        (!state.opened.includes(d.id) && state.AH < d.cost)
                      }
                      onClick={() => {
                        if (state.opened.includes(d.id)) setActiveDrawer(d.id);
                        else void commit({ type: "DRAWER", id: d.id });
                      }}
                    >
                      {state.opened.includes(d.id)
                        ? "Inspect rows"
                        : "Open drawer"}
                    </button>
                  </div>
                  {state.opened.includes(d.id) && (
                    <button
                      className={s.joinFromDrawer}
                      disabled={busy || state.AH < 1}
                      onClick={() => beginJoin(d.id)}
                    >
                      Join this with…
                    </button>
                  )}
                </article>
              ))}
            </div>
            <section className={s.join} data-join-bench="">
              <span className={s.eyebrow}>JOIN BENCH</span>
              <h3>Start from a drawer you understand.</h3>
              <p>
                Open a drawer and inspect its columns. Choose “Join this with…”
                to compare it with another dataset. Review both keys before
                confirming the one-hour attempt.
              </p>
              {state.joinsUsed.length > 0 && (
                <div className={s.result} role="status">
                  {
                    state.receipts.filter((r) => r.id.startsWith("J")).at(-1)
                      ?.because
                  }
                </div>
              )}
              <button onClick={() => showGuide("join", true)}>
                Hear the join guide
              </button>
            </section>
            <div className={s.sectionEnd}>
              <span className={s.muted}>
                {state.AH} hours left become preparation time.
              </span>
              {actionButton("Make my estimate →", { type: "FINISH_AUDIT" })}
            </div>
          </>
        );
      case "estimate":
        return (
          <>
            <div className={s.callout}>
              <span className={s.eyebrow}>YOUR EVIDENCE BOUND</span>
              <h2 style={{ marginTop: 10 }}>
                {Math.round(b.low)}–{Math.round(b.high)}%
              </h2>
              <p className={s.muted}>
                At least {b.mass.toFixed(1)}M of the 8.5M added events are
                confirmed counting noise. This is the share of growth, not the
                share of all current calls.
              </p>
            </div>
            <div className={s.rangeGrid}>
              <label>
                My low bound (%)
                <input
                  aria-label="Estimate low bound"
                  type="number"
                  min="0"
                  max="100"
                  value={low}
                  onChange={(e) => setLow(Number(e.target.value))}
                />
              </label>
              <label>
                My estimate (%)
                <input
                  aria-label="Point estimate"
                  type="number"
                  min="0"
                  max="100"
                  value={point}
                  onChange={(e) => setPoint(Number(e.target.value))}
                />
              </label>
              <label>
                My high bound (%)
                <input
                  aria-label="Estimate high bound"
                  type="number"
                  min="0"
                  max="100"
                  value={high}
                  onChange={(e) => setHigh(Number(e.target.value))}
                />
              </label>
            </div>
            <label className={s.muted}>
              Move your estimate · keyboard arrows also work
              <input
                type="range"
                min="0"
                max="100"
                value={point}
                onChange={(e) => setPoint(Number(e.target.value))}
              />
            </label>
            {actionButton("Record my range", {
              type: "ESTIMATE",
              point,
              low,
              high,
            })}
          </>
        );
      case "carry":
        return section(
          <>
            <button
              className={s.choice}
              disabled={busy}
              onClick={() => void commit({ type: "CARRY", mode: "now" })}
            >
              <strong>Bring it to the executive team now</strong>
              <small>Protect time. Carry the uncertainty with you.</small>
            </button>
            <div className={s.card}>
              <h3>Verify one more source first</h3>
              <p>
                Two prep hours and one day. A targeted check, not another full
                drawer.
              </p>
              <select
                aria-label="Source to verify"
                value={verifyId}
                onChange={(e) => setVerifyId(e.target.value as DrawerId)}
              >
                {drawers
                  .filter((d) => !state.opened.includes(d.id))
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
              </select>
              <button
                style={{ marginTop: 12 }}
                disabled={busy || state.AH < 2}
                onClick={() =>
                  void commit({ type: "CARRY", mode: "verify", verifyId })
                }
              >
                Verify first · 2 prep hours
              </button>
            </div>
            <button
              className={s.choice}
              disabled={busy}
              onClick={() => void commit({ type: "CARRY", mode: "quiet" })}
            >
              <strong>Say nothing yet. Keep the roadmap moving.</strong>
              <small>Elena will ask what she can tell the board.</small>
            </button>
          </>,
        );
      case "promise":
        return (
          <>
            <div className={s.thread}>
              <Portrait id="Elena" mood="thinking" />
              <p>“Can I tell the board it’s solid?”</p>
            </div>
            {section(
              <>
                {actionButton(
                  "Yes. You can tell the board it is solid.",
                  { type: "PROMISE", wording: "confident" },
                  true,
                )}
                {actionButton(
                  "Activity grew. Customer demand is not verified.",
                  { type: "PROMISE", wording: "qualified" },
                )}
                {actionButton(
                  "The dashboard reports the number we have.",
                  { type: "PROMISE", wording: "evasive" },
                  true,
                )}
              </>,
            )}
          </>
        );
      case "stakeholders":
        return (
          <>
            <div className={s.grid}>
              {people
                .filter((p) => p.id !== "Anders")
                .map((p) => (
                  <article
                    key={p.id}
                    className={s.card}
                    style={{
                      borderTop: `${p.id === "Ravi" ? 5 : p.id === "Marcus" ? 4 : 2}px solid ${p.color}`,
                    }}
                  >
                    <Portrait id={p.id} />
                    <h3>{p.name}</h3>
                    <p>{p.want}</p>
                    <p className={s.muted}>
                      {p.id === "Ravi"
                        ? "Built the definition"
                        : p.id === "Marcus"
                          ? "Targets and bonuses depend on AMC"
                          : p.id === "Elena"
                            ? "Announced the number"
                            : "Raised the discrepancy"}
                    </p>
                    <button
                      disabled={busy || state.toldOrder.includes(p.id)}
                      onClick={() =>
                        void commit({ type: "TELL", person: p.id as "Ravi" })
                      }
                    >
                      {state.toldOrder.includes(p.id)
                        ? `Told ${state.toldOrder.indexOf(p.id) + 1}${state.toldOrder.indexOf(p.id) === 0 ? " · first" : ""}`
                        : state.toldOrder.length
                          ? "Tell next"
                          : "Tell first"}
                    </button>
                  </article>
                ))}
            </div>
            <div className={s.sectionEnd}>
              <span className={s.muted}>
                You can brief more than one person before proceeding.
              </span>
            </div>
            <h3>How will you bring it into the room?</h3>
            {section(
              (
                [
                  [
                    "direct",
                    "Direct executive meeting",
                    "Fast correction. Ravi may feel publicly challenged.",
                  ],
                  [
                    "evolution",
                    "Evolution: “Metric v2”",
                    "A gentler framing, with six days before adoption.",
                  ],
                  [
                    "privateFirst",
                    "Private-first with Ravi",
                    "Start with the owner. Remember Marcus before you move on.",
                  ],
                  [
                    "dataRoom",
                    "Shared data room",
                    "A checkable record, but three days without a live conversation.",
                  ],
                ] as [Framing, string, string][]
              ).map(([framing, label, hint]) => (
                <button
                  key={framing}
                  className={s.choice}
                  disabled={
                    busy ||
                    !state.toldOrder.length ||
                    (framing === "privateFirst" &&
                      state.toldOrder[0] !== "Ravi")
                  }
                  onClick={() => void commit({ type: "FRAMING", framing })}
                >
                  <strong>{label}</strong>
                  <small>{hint}</small>
                </button>
              )),
            )}
          </>
        );
      case "slides":
        return (
          <>
            <div className={s.temperature}>
              <span>Room temperature</span>
              <i />
              <strong>
                {state.DEF >= 4
                  ? "Defensive"
                  : state.DEF >= 2
                    ? "Guarded"
                    : "Listening"}
              </strong>
            </div>
            <p className={s.eyebrow}>
              SLIDE {state.slideStep + 1} / 3 ·{" "}
              {state.slideStep === 0
                ? "OPENING"
                : state.slideStep === 1
                  ? "EVIDENCE"
                  : "ASK"}
            </p>
            <div className={s.slide}>
              {state.slideStep === 0 ? (
                <>
                  <h3>What do they hear first?</h3>
                  {section(
                    headlines.map((h) => (
                      <button
                        className={s.choice}
                        disabled={busy}
                        key={h.id}
                        onClick={() =>
                          void commit({ type: "HEADLINE", id: h.id })
                        }
                      >
                        <strong>{h.label}</strong>
                        <small>{h.words}</small>
                      </button>
                    )),
                  )}
                </>
              ) : state.slideStep === 1 ? (
                <>
                  <h3>The sources behind the claim.</h3>
                  <p className={s.muted}>
                    Choose up to {capacity(state)}. Selection order becomes
                    presentation order.
                    {state.scramble
                      ? " You used most of the audit time: this is a one-card scramble."
                      : ""}
                  </p>
                  {collected.length ? (
                    collected.map((d) => (
                      <label key={d.id}>
                        <input
                          type="checkbox"
                          checked={evidence.includes(d.id)}
                          disabled={
                            !evidence.includes(d.id) &&
                            evidence.length >= capacity(state)
                          }
                          onChange={() =>
                            setEvidence((v) =>
                              v.includes(d.id)
                                ? v.filter((x) => x !== d.id)
                                : [...v, d.id],
                            )
                          }
                        />
                        <span>
                          {d.title}
                          {evidence.includes(d.id)
                            ? ` · ${evidence.indexOf(d.id) + 1}`
                            : ""}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p>
                      No drawers were opened. You can present the limitation
                      honestly.
                    </p>
                  )}
                  <div className={s.sectionEnd}>
                    {actionButton("Keep these sources →", {
                      type: "EVIDENCE",
                      ids: evidence,
                    })}
                  </div>
                </>
              ) : (
                <>
                  <h3>What needs to change?</h3>
                  {section(
                    asks.map((a) =>
                      actionButton(a.label, { type: "ASK", id: a.id }, true),
                    ),
                  )}
                </>
              )}
            </div>
          </>
        );
      case "metric":
        return (
          <>
            <div className={s.metricFields}>
              {Object.entries(metricOptions).map(([key, options]) => (
                <label key={key}>
                  {
                    (
                      {
                        unit: "Unit",
                        dedupe: "Counting rule",
                        streams: "Streaming rule",
                        exclusions: "Exclusions",
                        segment: "Segment",
                        window: "Reporting window",
                        guardrails: "Quality guardrails",
                      } as Record<string, string>
                    )[key]
                  }
                  <select
                    aria-label={"Metric " + key}
                    value={
                      key === "dedupe"
                        ? spec.dedupe
                          ? "yes"
                          : "no"
                        : key === "streams"
                          ? spec.streams
                            ? "many"
                            : "one"
                          : String(spec[key as keyof Metric])
                    }
                    onChange={(e) =>
                      setSpec((v) => ({
                        ...v,
                        [key]:
                          key === "dedupe"
                            ? e.target.value === "yes"
                            : key === "streams"
                              ? e.target.value === "many"
                              : e.target.value,
                      }))
                    }
                  >
                    {options.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <MetricPreview spec={spec} />
            <div className={s.sectionEnd}>
              {actionButton("Let the red team try it →", {
                type: "METRIC",
                spec,
              })}
            </div>
          </>
        );
      case "redteam":
        return (
          <>
            <div className={s.preview}>
              <div className={s.actions}>
                <span className={s.eyebrow}>THE RULE YOU WROTE</span>
                <button className={s.editRule} onClick={() => setPanel("rule")}>
                  Edit rule
                </button>
              </div>
              <code>
                {state.spec
                  ? definition(state.spec)
                  : state.receipts.find((r) => r.id === "G_METRIC")?.words}
              </code>
            </div>
            {state.spec && <MetricPreview spec={state.spec} />}
            <p className={s.eyebrow}>
              {state.fixHours} FIX HOURS · {state.loopholes.length} OPEN
              LIMITATIONS
            </p>
            {state.loopholes.map((id) => (
              <article className={s.redteam} key={id}>
                <h3>{loopholeInfo[id][0]}</h3>
                <code>{loopholeInfo[id][1]}</code>
                <p>{loopholeInfo[id][2]}</p>
                <button
                  disabled={busy || (id !== "segments" && state.fixHours < 1)}
                  onClick={() => void commit({ type: "FIX", id })}
                >
                  {id === "segments"
                    ? "Add a cohort breakdown · no engineering hour"
                    : "Patch definition · 1 fix hour"}
                </button>
              </article>
            ))}
            {!state.loopholes.length && (
              <div className={s.result}>
                No authored loopholes remain. Keep validating the metric after
                launch.
              </div>
            )}
            <div className={s.sectionEnd}>
              {actionButton("Carry this definition forward →", {
                type: "FINISH_REDTEAM",
              })}
            </div>
          </>
        );
      case "secondSource":
        return (
          <>
            <div className={s.thread}>
              <Portrait id="Ravi" mood="thinking" />
              <p>
                “I need an independent source before I sign off on another
                definition.”
              </p>
            </div>
            {section(
              <>
                {actionButton("Ask Joyce to independently review the source", {
                  type: "SECOND_SOURCE",
                  source: "independent",
                })}
                {actionButton(
                  "Mark the claim unverified pending validation",
                  { type: "SECOND_SOURCE", source: "limits" },
                  true,
                )}
              </>,
            )}
          </>
        );
      case "rollout":
        return (
          <>
            <div className={s.card}>
              <span className={s.eyebrow}>THE MIGRATION</span>
              <h3>
                {state.CTOt >= 60 && state.DL <= 3
                  ? "A safe, three-week transition"
                  : state.CEOt >= 60 && state.DL > 3
                    ? "A change mandated today"
                    : "A staged transition"}
              </h3>
              <p>
                {state.CTOt >= 60
                  ? "Ravi is willing to own the definition."
                  : "The team still needs confidence in the definition."}{" "}
                {state.DL} forecast days of continued old-metric reporting.
              </p>
            </div>
            {state.TE < 55 && (
              <div className={s.result}>
                The team is stretched. A new dashboard does not erase existing
                commitments.
              </div>
            )}
            {section(
              <>
                {actionButton("Protect migration capacity · add one day", {
                  type: "ROLLOUT",
                  support: true,
                })}
                {actionButton(
                  "Keep every existing commitment too",
                  { type: "ROLLOUT", support: false },
                  true,
                )}
              </>,
            )}
          </>
        );
      case "board":
        return (
          <>
            <div className={s.thread}>
              <Portrait id="Anders" mood="thinking" />
              <h3>“What would you stake your reputation on?”</h3>
            </div>
            {state.promise && (
              <div className={s.result}>
                <span className={s.eyebrow}>DAY 1 / YOUR WORDS RETURN</span>
                <p>{state.receipts.find((r) => r.id === "G_PROMISE")?.words}</p>
                <button onClick={() => setPanel("case")}>
                  See the original reply
                </button>
              </div>
            )}
            <div className={s.card}>
              <h3>The record in front of the board</h3>
              <p>
                Your estimate: {state.estimate?.point}% · range{" "}
                {state.estimate?.low}–{state.estimate?.high}%.
              </p>
              <p>
                {state.DL} forecast days of delay. {state.loopholes.length}{" "}
                known limitations in the replacement.
              </p>
              <p>
                {state.ask === "pause"
                  ? "The threefold infrastructure scale-up was paused."
                  : state.carry === "quiet"
                    ? "The threefold scale-up continued on the unverified number."
                    : "The infrastructure plan still needs an explicit correction."}
              </p>
              {state.leak && (
                <p>
                  Marcus learned of your private audit through Slack before you
                  told him.
                </p>
              )}
            </div>
            {state.TE < 40 && (
              <div className={s.result}>
                <strong>The engineers push back.</strong>
                <p>
                  “We still have the roadmap you committed to. Which work
                  stops?”
                </p>
                <p>
                  Your earlier delivery:{" "}
                  {state.receipts.find((r) => r.id === "G_FRAME")?.words}
                </p>
              </div>
            )}
            {section(
              <>
                {actionButton("Own the correction and the uncertainty", {
                  type: "BOARD",
                  move: "own",
                })}
                {actionButton(
                  "Put the failure on the process",
                  { type: "BOARD", move: "blame" },
                  true,
                )}
                {actionButton(
                  "Leave the old headline in place",
                  { type: "BOARD", move: "bury" },
                  true,
                )}
              </>,
            )}
          </>
        );
      default:
        return null;
    }
  }
  return (
    <div
      ref={root}
      className={s.lab}
      data-ghost-scene={state.scene}
      data-calm={quiet}
      data-soft={soft}
      style={
        {
          "--case-bg": "#faf9f6",
          "--case-ink": "#1b1b1f",
          "--case-accent": "#a45205",
        } as CSSProperties
      }
    >
      {arrival && (
        <Arrival
          project={arrivalProject}
          onDone={() => setArrival(false)}
          skipImmediately
          calm={quiet}
          copy={[
            "A perfect number. An imperfect story.",
            "Find what the growth is made of.",
          ]}
        />
      )}
      <div inert={arrival}>
        <header className={s.topbar}>
          <Link href="/app/projects">← Projects</Link>
          <span className={s.brand}>PMFORGE / THE GHOST METRIC</span>
          <div className={s.actions}>
            {run && (
              <ResourceChip
                value={chapter(state.scene) === 1 ? state.AH : state.PH}
                label={
                  chapter(state.scene) === 1 ? "AUDIT HOURS" : "PREP HOURS"
                }
                day={chapter(state.scene)}
                calm={quiet}
              />
            )}
            <button
              role="switch"
              aria-label="Ambient sound"
              aria-checked={ambient}
              onClick={() => setAmbient((v) => !v)}
              title={
                ambientStatus === "ready"
                  ? "Room tone starts after your first interaction."
                  : ambientStatus === "unavailable"
                    ? "Room tone unavailable; the lab remains usable."
                    : "Ambient room tone ducks beneath dialogue."
              }
            >
              Ambient: {ambient ? "On" : "Off"}
            </button>
            <button onClick={() => setPanel("help")}>Guide</button>
            <button
              onClick={() => {
                voice.stop();
                setPanel("settings");
              }}
            >
              Settings
            </button>
            {run && (
              <>
                <button
                  data-new={state.receipts.length > 0}
                  onClick={() => {
                    analytics("case_file_opened");
                    setPanel("case");
                  }}
                >
                  Case file · {state.receipts.length}
                </button>
                <button onClick={() => setPanel("pause")}>Pause</button>
              </>
            )}
          </div>
        </header>
        {run && (
          <nav
            className={`${s.progressHeader} ${s.toolShell}`}
            aria-label="Project chapters"
          >
            <ol className={s.tracker}>
              {["The Mirage", "The Truth", "The Realignment"].map((name, i) => (
                <li
                  key={name}
                  aria-current={
                    chapter(state.scene) === i + 1 ? "step" : undefined
                  }
                  data-current={chapter(state.scene) === i + 1}
                >
                  <b>{String(i + 1).padStart(2, "0")}</b> {name}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {error && (
          <div className={s.error} role="alert">
            {error}{" "}
            <button
              onClick={() => {
                setError("");
                setRecovery((v) => v + 1);
              }}
            >
              Try again
            </button>{" "}
            <Link
              href="/app/projects/ghost-metric"
              onClick={(event) => {
                event.preventDefault();
                history.pushState(null, "", "/app/projects/ghost-metric");
                setRun(null);
                setError("");
                setDialogue(null);
                setPanel(null);
              }}
            >
              Back to project
            </Link>
          </div>
        )}
        {!loaded ? (
          <main className={s.intro}>
            <h2>Opening your lab…</h2>
          </main>
        ) : !run ? (
          <main className={s.intro}>
            <div>
              <p className={s.eyebrow}>
                APERTURE CLOUD · A SIMULATED COMPANY · CASE 04
              </p>
              <h1>
                The Ghost
                <br />
                <em>Metric.</em>
              </h1>
              <p className={s.lede}>
                Everyone is celebrating the number.
                <br />
                You’re the one who has to trust it.
              </p>
              <div className={s.role}>
                <strong>You are the PM for Platform Growth.</strong>A three-day
                audit. One board meeting. A number that does not quite add up.
              </div>
              <div className={s.actions}>
                <button
                  className={s.primary}
                  disabled={busy || !owner}
                  onClick={() => void begin()}
                >
                  Enter the all-hands →
                </button>
                <button onClick={() => setPanel("help")}>
                  What will I do?
                </button>
              </div>
              <p className={s.notes}>
                About 40 minutes · pause at any beat · authored simulation ·
                expert review pending
              </p>
              {runs.length > 0 && (
                <div className={s.callout}>
                  <h3>Your saved audits</h3>
                  {runs.slice(0, 4).map((r) => (
                    <div className={s.sectionEnd} key={r.id}>
                      <span className={s.muted}>
                        {replay(r.events).scene === "debrief"
                          ? "Completed audit"
                          : "Continue · " + replay(r.events).scene}
                        {r.parentId ? " · replay branch" : ""}
                      </span>
                      <button onClick={() => void resume(r.id)}>
                        Resume audit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={s.introArt}>
              <span className={s.eyebrow}>THE COMPANY’S NORTH STAR</span>
              <BubblePoster />
              <strong>+340%</strong>
              <p className={s.muted}>
                Active Model Calls · “daily model calls served”
              </p>
            </div>
          </main>
        ) : state.scene === "debrief" ? (
          <main className={`${s.debrief} ${s.pageShell}`}>
            <p className={s.eyebrow}>
              THE RECORD / {state.outcome.toUpperCase()}
            </p>
            <h2>Your audit, in brief.</h2>
            <p className={s.lede}>{conclusion(state)}</p>
            <div className={s.conclusion}>
              <strong>{state.archetype}</strong>
              <p>{state.receipts.find((r) => r.id === "G_BOARD")?.because}</p>
              <p className={s.muted}>
                Your pattern describes this run. It is not a measure of real PM
                ability.
              </p>
            </div>
            <div className={s.reveal}>
              <section>
                <Bubble
                  proved={b.mass}
                  reveal
                  calm={quiet}
                  animateReveal={freshReveal.current}
                />
                <h3>The complete anatomy.</h3>
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <caption>
                      Additional daily calls behind the +340% headline
                    </caption>
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th>Daily mass</th>
                        <th>Your audit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {layers.map((l) => (
                        <tr key={l.id}>
                          <td>{l.label}</td>
                          <td>{l.mass.toFixed(1)}M</td>
                          <td>
                            {state.proved.includes(l.id)
                              ? "Proved"
                              : "Not proved"}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td>Real new demand</td>
                        <td>1.0M</td>
                        <td>
                          {state.opened.includes("cohorts")
                            ? "0.8M enterprise proved"
                            : "Not segmented"}
                        </td>
                      </tr>
                      <tr>
                        <th>Total increase</th>
                        <th>8.5M</th>
                        <th>2.5M → 11.0M</th>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
              <section className={s.card}>
                <span className={s.eyebrow}>THE DISTINCTION THAT MATTERS</span>
                <h2 style={{ marginTop: 18 }}>
                  +40% real growth.
                  <br />
                  Not +340%.
                </h2>
                <p>
                  7.5M of the 8.5M increase — 88.2% — came from counting noise.
                  The company was growing; the headline described a different
                  thing.
                </p>
                <h3>Your estimate</h3>
                <p>
                  {state.estimate?.point}%, range {state.estimate?.low}–
                  {state.estimate?.high}%. Calibration:{" "}
                  <strong>{state.calibration}</strong>.
                </p>
                <p className={s.muted}>
                  The full-data answer is revealed here. Your earlier sources
                  showed only what you investigated.
                </p>
                <p>
                  The adopted counting rule:{" "}
                  {state.spec
                    ? definition(state.spec)
                    : "No replacement definition."}
                </p>
              </section>
            </div>
            <h3>What your choices changed.</h3>
            {[
              "G_EST",
              "G_CARRY",
              "G_FRAME",
              "G_HEADLINE",
              "G_ASK",
              "G_METRIC",
              "G_BOARD",
            ].map((id) => {
              const r = state.receipts.find((r) => r.id === id);
              return (
                r && (
                  <article className={s.receipt} key={id}>
                    <strong>{r.words}</strong>
                    <p>{r.because}</p>
                    <small>{r.concept}</small>
                  </article>
                )
              );
            })}
            <details>
              <summary>Open the decision trace and replay a moment</summary>
              {state.receipts.map((r) => (
                <article className={s.receipt} key={r.id}>
                  <strong>{r.words}</strong>
                  <p>{r.because}</p>
                  <small>{r.concept}</small>
                  <br />
                  <button
                    disabled={busy}
                    onClick={() => void branch(r.eventIndex)}
                  >
                    Replay from here · new branch
                  </button>
                </article>
              ))}
            </details>
            <MissedTells
              opened={state.opened}
              sound={sound}
              paused={paused || !!dialogue}
            />
            <h3>Try a different decision.</h3>
            <div className={s.actions}>
              {[
                ["The audit", "G_CARRY"],
                ["The framing", "G_FRAME"],
                ["The metric", "G_METRIC"],
              ].map(([label, id]) => {
                const r = state.receipts.find((r) => r.id === id);
                return (
                  r && (
                    <button
                      key={id}
                      disabled={busy}
                      onClick={() => void branch(r.eventIndex)}
                    >
                      {label} ↗
                    </button>
                  )
                );
              })}
            </div>
            <section className={s.callout}>
              <h3>One question for your next dashboard.</h3>
              <p>
                What will you ask before publishing a number? What would make
                you change your mind?
              </p>
              <textarea
                aria-label="Reflection note"
                placeholder="What would you ask about the unit before publishing this number again?"
                maxLength={1000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className={s.sectionEnd}>
                <button className={s.primary} onClick={() => void saveNote()}>
                  Save reflection
                </button>
                <button onClick={() => exportRun(run)}>
                  Export this audit
                </button>
                <button disabled={busy} onClick={() => void begin()}>
                  Start a new audit
                </button>
              </div>
            </section>
          </main>
        ) : (
          <>
            <div className={s.goal}>
              <div className={s.goalItems}>
                <span>
                  <strong>Goal</strong>{" "}
                  {chapter(state.scene) === 1
                    ? "Decide how much of the growth you can trust."
                    : chapter(state.scene) === 2
                      ? "Tell the right people before the board."
                      : "Replace the number with a rule people can trust."}
                </span>
                <span>
                  <strong>Now</strong> {titles[state.scene][1]}
                </span>
                <span>
                  <strong>Costs</strong> {currentCost(state)}
                </span>
              </div>
              <p className={s.remainingActions} role="status">
                {remainingActions(state)}
              </p>
            </div>
            <div className={`${s.workspace} ${s.toolShell}`} data-tab={tab}>
              <aside className={`${s.rail} ${s.leftRail}`}>
                <span className={s.eyebrow}>APERTURE / TEAM THREAD</span>
                <div className={s.thread}>
                  <small>JOYCE · ANALYST</small>
                  <p>
                    {state.scene === "cold" || state.scene === "unit"
                      ? "Billing and the activity dashboard do not quite agree."
                      : "“Can you look at something? It’s probably nothing.”"}
                  </p>
                  <small>YOU · PLATFORM GROWTH</small>
                  <p>
                    {state.receipts.at(-1)?.words ||
                      "You have not made a commitment yet."}
                  </p>
                </div>
                <h3>The people in the number.</h3>
                <div className={s.people}>
                  {knownPeople.map((p) => (
                    <button
                      className={s.person}
                      key={p.id}
                      onClick={() => setPanel("people")}
                    >
                      <Portrait id={p.id} />
                      <span>
                        {p.name}
                        <small>{p.role}</small>
                      </span>
                    </button>
                  ))}
                </div>
                <p className={s.notes}>
                  A number can be wrong without someone being a villain.
                </p>
                <button onClick={() => setPanel("help")}>
                  Guide & transcript
                </button>
              </aside>
              <main
                ref={stage}
                className={s.stage}
                tabIndex={-1}
                aria-label="Current investigation"
              >
                <div className={s.stageHead}>
                  <span className={s.eyebrow}>
                    DAY {chapter(state.scene)} /{" "}
                    {state.scene === "slides"
                      ? `SLIDE ${state.slideStep + 1}`
                      : state.scene.toUpperCase()}
                  </span>
                  <h2>{titles[state.scene][0]}</h2>
                  <p>{titles[state.scene][1]}</p>
                </div>
                {plan && guidance && !dismissed.includes(state.scene) && (
                  <aside className={s.coach}>
                    <span className={s.eyebrow}>YOUR NEXT MOVE</span>
                    <dl className={s.guideReference}>
                      <div>
                        <dt>Goal</dt>
                        <dd>{guideCard(state.scene)?.goal}</dd>
                      </div>
                      <div>
                        <dt>Do this</dt>
                        <dd>{guideCard(state.scene)?.do}</dd>
                      </div>
                      <div>
                        <dt>Watch for</dt>
                        <dd>{guideCard(state.scene)?.watch}</dd>
                      </div>
                    </dl>
                    <div className={s.guidePrimary}>
                      <button
                        className={s.primary}
                        onClick={() => setDismissed((v) => [...v, state.scene])}
                      >
                        Got it
                      </button>
                    </div>
                    <div className={s.conversationUtilities}>
                      <button onClick={() => showGuide(state.scene, true)}>
                        Replay spoken guide
                      </button>
                      <label>
                        <input
                          type="checkbox"
                          checked={!guidance}
                          onChange={(e) => setGuidance(!e.target.checked)}
                        />
                        Don’t show guides again
                      </label>
                    </div>
                  </aside>
                )}
                {stageContent()}
              </main>
              {rightRail}
            </div>
          </>
        )}
        {run && (
          <nav className={s.mobileTabs} aria-label="Project tools">
            <button aria-pressed={tab === "now"} onClick={() => setTab("now")}>
              Now
            </button>
            <button onClick={() => setPanel("people")}>People</button>
            <button
              aria-pressed={tab === "bubble"}
              onClick={() => setTab("bubble")}
            >
              Evidence
            </button>
            <button onClick={() => setPanel("case")}>
              Case · {state.receipts.length}
            </button>
            <button onClick={() => setPanel("pause")}>Pause</button>
          </nav>
        )}
      </div>
      {dialogue && (
        <Conversation
          key={dialogue.key}
          plan={dialogue}
          sound={sound}
          auto={auto}
          paused={paused || !!activeDrawer}
          calm={quiet}
          guidance={guidance}
          guide={guideCard(dialogue.guideKey || "")}
          onDone={focusTask}
          onPause={() => setPanel("pause")}
          onSound={() => setSound((v) => !v)}
          onAuto={setAuto}
          onGuidance={setGuidance}
          ambient={ambient}
          onAmbient={() => setAmbient((v) => !v)}
        />
      )}
      {joinSource && (
        <JoinPicker
          source={joinSource}
          open={!dialogue && !panel && !arrival}
          state={state}
          busy={busy}
          error={error}
          calm={quiet}
          sound={sound}
          reading={joinReading}
          ambient={ambient}
          onAmbient={() => setAmbient((v) => !v)}
          onSound={() => setSound((v) => !v)}
          onClose={() => {
            setJoinSource(null);
            setError("");
          }}
          onGuide={() => showGuide("join", true)}
          onJoin={commit}
        />
      )}
      <Dialog
        open={!!panel && !arrival}
        onClose={() => setPanel(null)}
        title={
          panel === "resume"
            ? "Previously, at Aperture"
            : panel === "case"
              ? "Your case file"
              : panel === "people"
                ? "The people behind the number"
                : panel === "settings"
                  ? "Lab preferences"
                  : panel === "pause"
                    ? "Audit paused"
                    : "Your next move"
        }
        size="lg"
      >
        <div className={s.sheet}>
          {panel === "people" &&
            knownPeople.map((p) => (
              <article key={p.id} className={s.receipt}>
                <div className={s.person}>
                  <Portrait
                    id={p.id}
                    mood={
                      p.id === "Ravi" && state.DEF >= 3 ? "annoyed" : "neutral"
                    }
                  />
                  <div>
                    <h3>{p.name}</h3>
                    <p className={s.muted}>{p.role}</p>
                  </div>
                </div>
                <p>
                  <strong>Wants:</strong> {p.want}
                </p>
                <p>
                  <strong>Fears:</strong> {p.fear}
                </p>
                <p>
                  <strong>Tell:</strong> {p.tell}
                </p>
                <small>
                  {p.id === "Ravi"
                    ? state.CTOt >= 60
                      ? "Relationship: willing to collaborate"
                      : state.CTOt < 40
                        ? "Relationship: needs independent validation"
                        : "Relationship: guarded but listening"
                    : p.id === "Marcus" && state.leak
                      ? "Relationship: feels left out of the conversation"
                      : "Relationship: waiting to see your evidence"}
                </small>
              </article>
            ))}
          {panel === "case" && (
            <>
              <p>
                Exact words, sources, and consequences. Saved on this device.
              </p>
              {collected.length > 0 && (
                <>
                  <h3>Collected evidence</h3>
                  {collected.map((d) => (
                    <div className={s.receipt} key={d.id}>
                      <strong>{d.title}</strong>
                      <p>{d.reading}</p>
                      <button
                        onClick={() => {
                          setPanel(null);
                          setActiveDrawer(d.id);
                        }}
                      >
                        Inspect original rows
                      </button>
                    </div>
                  ))}
                </>
              )}
              {state.receipts.map((r) => (
                <article className={s.receipt} key={r.id}>
                  <strong>{r.words}</strong>
                  <p>{r.because}</p>
                  <small>{r.concept}</small>
                </article>
              ))}
              {run && (
                <button onClick={() => exportRun(run)}>
                  Export audit and receipts
                </button>
              )}
            </>
          )}
          {panel === "settings" && (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={ambient}
                  onChange={(e) => setAmbient(e.target.checked)}
                />
                Ambient room tone · ducks during dialogue
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={sound}
                  onChange={(e) => setSound(e.target.checked)}
                />
                Recorded voices + captions
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={auto}
                  onChange={(e) => setAuto(e.target.checked)}
                />
                Advance after recording finishes
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={guidance}
                  onChange={(e) => setGuidance(e.target.checked)}
                />
                First-use guides
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={calm}
                  onChange={(e) => setCalm(e.target.checked)}
                />
                Calm motion · use the static bubble
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={soft}
                  onChange={(e) => setSoft(e.target.checked)}
                />
                Soft light · reduce glare
              </label>
              <p className={s.muted}>
                Sound starts off. Captions stay available. Portraits use four
                static expressions, with no mouth animation.
              </p>
              <button onClick={() => setPanel(null)}>Back to the lab</button>
            </>
          )}
          {(panel === "pause" || panel === "resume") && (
            <>
              <h2>
                {panel === "resume"
                  ? titles[state.scene]?.[0] || "Your audit is complete."
                  : "The number can wait."}
              </h2>
              <p>
                {run?.events.length
                  ? state.receipts.at(-1)?.words
                  : "You are three weeks into the role. The headline is still unverified."}
              </p>
              <p>
                {state.AH} audit hours remain. {collected.length} sources
                collected. Your choices are saved.
              </p>
              <div className={s.actions}>
                <button className={s.primary} onClick={() => setPanel(null)}>
                  Continue →
                </button>
                {run && (
                  <button onClick={() => exportRun(run)}>Export run</button>
                )}
                <Link href="/app/projects">Leave the lab</Link>
              </div>
            </>
          )}
          {panel === "help" && (
            <>
              <h2>Audit. Tell. Red-team.</h2>
              <p>
                You are a PM at a simulated AI infrastructure company. Your
                dashboard counts activity; you must find out whether it
                represents useful customer demand.
              </p>
              <p>
                <strong>1.</strong> Open data drawers with your twelve audit
                hours. Join matching identifiers to quantify a cause.
              </p>
              <p>
                <strong>2.</strong> Record an estimate and range. Decide who
                hears it and build a three-slide conversation.
              </p>
              <p>
                <strong>3.</strong> Write a replacement metric, test its
                loopholes, and take the consequences to the board.
              </p>
              <p>
                There is no reflex timer. Unspent audit hours become preparation
                time. Every drag-style task has select, button and keyboard
                controls.
              </p>
              {run && (
                <p className={s.result}>
                  Right now:{" "}
                  {titles[state.scene]?.[1] ||
                    "Reflect, export, or replay a decision."}
                </p>
              )}
              <details>
                <summary>Dialogue heard in this scene</summary>
                <div className={s.transcript}>
                  {(
                    dialogue?.lines || conversation(state.lastConversation)
                  ).map((l) => (
                    <p key={l.id}>
                      <strong>{l.speaker}:</strong> {l.text}
                    </p>
                  ))}
                </div>
              </details>
              <button
                onClick={() => {
                  setGuidance(true);
                  setDismissed((v) => v.filter((x) => x !== state.scene));
                  setPanel(null);
                  showGuide(state.scene, true);
                }}
              >
                Show this task’s guide
              </button>
            </>
          )}
          {panel === "rule" && (
            <>
              <h2>Edit the rule.</h2>
              <p>{state.spec && definition(state.spec)}</p>
              <p>
                Keep the recorded definition and patch its known controls.
                Engineering changes use one fix hour; the cohort breakdown is
                free.
              </p>
              {state.loopholes.map((id) => (
                <div className={s.receipt} key={id}>
                  <strong>{loopholeInfo[id][0]}</strong>
                  <p>{loopholeInfo[id][2]}</p>
                  <button
                    disabled={busy || (id !== "segments" && state.fixHours < 1)}
                    onClick={() => void commit({ type: "FIX", id })}
                  >
                    {id === "segments"
                      ? "Add cohort breakdown"
                      : "Apply patch · 1 fix hour"}
                  </button>
                </div>
              ))}
              {!state.loopholes.length && <p>No authored loopholes remain.</p>}
              <div className={s.conversationPrimary}>
                <button className={s.primary} onClick={() => setPanel(null)}>
                  Done editing
                </button>
              </div>
              <p className={s.muted}>
                Changing the unit, window or original scope creates a separate
                replay branch.
              </p>
              <button
                onClick={() => {
                  const r = state.receipts.find((r) => r.id === "G_METRIC");
                  if (r) void branch(r.eventIndex);
                }}
              >
                Rebuild the definition · new branch
              </button>
            </>
          )}
        </div>
      </Dialog>
      <Dialog
        open={!!activeDrawer && !arrival}
        onClose={() => setActiveDrawer(null)}
        title={drawers.find((d) => d.id === activeDrawer)?.title || "Evidence"}
        size="lg"
      >
        <div className={s.sheet}>
          {(() => {
            const d = drawers.find((d) => d.id === activeDrawer);
            return (
              d && (
                <>
                  <p>{d.reading}</p>
                  <div
                    className={s.columnChips}
                    aria-label="Available identifying columns"
                  >
                    {sourceColumns(d.id).map((column) => (
                      <code key={column}>{column}</code>
                    ))}
                  </div>
                  <div className={s.tableWrap}>
                    <table className={s.table}>
                      <caption>Authored sample rows · simulated data</caption>
                      <tbody>
                        {d.rows.map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td key={j}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className={s.result}>{d.hint}</p>
                  {state.scene === "audit" && (
                    <button
                      className={s.primary}
                      disabled={busy || state.AH < 1}
                      onClick={() => beginJoin(d.id)}
                    >
                      Join this with…
                    </button>
                  )}
                  <button
                    className={s.primary}
                    onClick={() => setActiveDrawer(null)}
                  >
                    Return to the task
                  </button>
                </>
              )
            );
          })()}
        </div>
      </Dialog>
      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Put this on the record?"
        footer={
          <>
            <button onClick={() => setConfirm(null)}>Change something</button>
            <button
              disabled={busy}
              onClick={() => confirm && void commit(confirm)}
            >
              Confirm
            </button>
          </>
        }
      >
        <div className={s.sheet}>
          {confirm?.type === "METRIC" ? (
            <>
              <h3>Your exact metric definition</h3>
              <p>{definition(confirm.spec)}</p>
              <p>
                The red team will test this wording. Three fix hours remain.
              </p>
            </>
          ) : (
            <>
              <h3>
                {confirm?.type === "BOARD" && confirm.move === "own"
                  ? "Own the correction"
                  : confirm?.type === "BOARD" && confirm.move === "blame"
                    ? "Blame the process"
                    : "Keep the old headline in circulation"}
              </h3>
              <p>
                {state.loopholes.length} known limitations reach the board. Your
                original estimate and any promise remain on the record.
              </p>
            </>
          )}
          <p className={s.muted}>
            This choice is saved as a receipt. You can replay it later in a
            separate branch.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
function MetricPreview({ spec }: { spec: Metric }) {
  const preview = metricPreview(spec),
    path =
      preview.growth === null
        ? "M0 90H360"
        : `M0 95C70 95 115 82 180 75S290 ${Math.max(5, 90 - preview.growth / 4)} 360 ${Math.max(5, 90 - preview.growth / 4)}`;
  const ref = useRef<SVGPathElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const tween = gsap.to(ref.current, {
      attr: { d: path },
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 0.5,
      ease: "power2.out",
    });
    return () => {
      tween.kill();
    };
  }, [path]);
  return (
    <div className={s.preview} aria-live="polite">
      <span className={s.eyebrow}>RETROSPECTIVE MODEL / SIMULATED QUARTER</span>
      <strong>
        {preview.growth === null ? (
          preview.label
        ) : (
          <>
            <span>+</span>
            <AnimatedNumber value={preview.growth} suffix="%" />
          </>
        )}
      </strong>
      <svg
        viewBox="0 0 360 110"
        role="img"
        aria-label={
          preview.growth === null
            ? "Comparable history unavailable"
            : `Modelled growth ${Math.round(preview.growth)} percent`
        }
      >
        <path d="M0 100H360M0 50H360" stroke="#dbc9ab" fill="none" />
        <path ref={ref} d={path} stroke="#a45205" strokeWidth="3" fill="none" />
      </svg>
      <p className={s.muted}>{preview.note}</p>
      <code>{definition(spec)}</code>
    </div>
  );
}
