"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  Armchair,
  ArrowRight,
  Mic,
  Keyboard,
  Volume2,
  VolumeX,
  Pause,
  Square,
  RotateCcw,
  Download,
  Trash2,
  Layers,
  CreditCard,
  ArrowLeftRight,
  HeartPulse,
  Code2,
  Sparkles,
  ShoppingBag,
  Landmark,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Logo } from "@/components/ui/Logo";
import { useWorkspace } from "@/components/product/WorkspaceProvider";
import { db, downloadFile } from "@/lib/product/db";
import { blankCase } from "@/lib/portfolio/model";
import {
  companies,
  personas,
  company,
  persona,
  HOT_SEAT_NAME,
} from "@/lib/hot-seat/content";
import {
  debrief,
  sessionExport,
  type Options,
  type SeatSession,
} from "@/lib/hot-seat/model";
import { showError } from "@/lib/ui-feedback";
import { lockPageScroll } from "@/lib/page-scroll";
import { useSeat } from "./useSeat";
import { SeatVoice, type VoiceMode } from "./voice";
import { useMicrophone } from "./useMicrophone";
import { Presence } from "./Presence";
import s from "./HotSeat.module.css";
const icons = [
  Layers,
  CreditCard,
  ArrowLeftRight,
  HeartPulse,
  Code2,
  Sparkles,
  ShoppingBag,
  Landmark,
];
const labels = {
  structure: "Structure",
  assumptions: "Assumptions named",
  metrics: "Metrics defined",
  tradeoffs: "Trade-offs",
  clarity: "Clarity under pressure",
};
const stamp = () => new Date().toISOString();
export default function HotSeat() {
  const { profile } = useWorkspace();
  return profile ? <Seat ownerId={profile.id} /> : null;
}
function Seat({ ownerId }: { ownerId: string }) {
  const seat = useSeat(ownerId),
    run = seat.session,
    runRef = useRef(run);
  runRef.current = run;
  const [options, setOptions] = useState<Options>({
      company: "saas",
      persona: "nora",
      minutes: 10,
      pressure: "direct",
    }),
    [ai, setAI] = useState(true),
    [adult, setAdult] = useState(false),
    [fictional, setFictional] = useState(false),
    [region, setRegion] = useState(""),
    [input, setInput] = useState<"typed" | "voice">("typed"),
    [micConsent, setMicConsent] = useState(false),
    [voiceMode] = useState<VoiceMode>("browser"),
    [voiceState, setVoiceState] = useState("idle"),
    [voiceProgress, setVoiceProgress] = useState(""),
    [voiceOn, setVoiceOn] = useState(true),
    [amplitude, setAmplitude] = useState(0),
    [char, setChar] = useState(0),
    [spoken, setSpoken] = useState(""),
    [transcript, setTranscript] = useState(false),
    [endDialog, setEndDialog] = useState(false),
    [deleteTarget, setDeleteTarget] = useState<SeatSession | null>(null),
    [now, setNow] = useState(Date.now()),
    [deliverySeconds, setDeliverySeconds] = useState(0),
    [source, setSource] = useState<"typed" | "voice">("typed"),
    [moment, setMoment] = useState(false);
  const voice = useRef<SeatVoice | null>(null),
    composer = useRef<HTMLTextAreaElement>(null),
    lastSpoken = useRef(""),
    activeSpeech = useRef(""),
    busyRef = useRef(false),
    nudgedTurn = useRef(""),
    acknowledgedTurn = useRef("");
  busyRef.current = seat.busy;
  useEffect(() => {
    const v = new SeatVoice({
      state: setVoiceState,
      progress: setVoiceProgress,
      level: (amp, index) => {
        setAmplitude(amp);
        setChar(index);
      },
      notice: text => {seat.setNotice(text);showError(text)},
    });
    voice.current = v;
    return () => {
      v.dispose();
      voice.current = null;
    };
  }, []);
  const c = company(run?.options.company || options.company),
    p = persona(run?.options.persona || options.persona),
    lastAI = run?.turns.filter((t) => t.who === "ai").at(-1),
    remaining = run
      ? Math.max(0, run.options.minutes * 60 - Math.floor(run.elapsedMs / 1000))
      : options.minutes * 60,
    paused = run?.status === "paused",
    finished = run?.status === "complete";
  useEffect(() => {
    if (!run || finished) return;
    const releaseScroll = lockPageScroll();
    const main = document.getElementById("main");
    let root: HTMLElement | null = main;
    while (root?.parentElement && root.parentElement !== document.body) root = root.parentElement;
    const oldInert = root?.inert || false;
    if (root) root.inert = true;
    return () => { releaseScroll(); if (root) root.inert = oldInert; };
  }, [!!run, finished]);
  async function say(text: string, turnId?: string, force = false) {
    if (!voiceOn && !force) return;
    setSpoken(text);
    setChar(0);
    activeSpeech.current = turnId || "";
    await voice.current?.speak(
      text,
      p.id,
      voiceMode,
      run ? { id: run.id, ownerId } : { id: "preview-" + ownerId, ownerId },
      turnId,
    );
  }
  function interrupt() {
    voice.current?.stop();
    const r = runRef.current;
    if (
      !r ||
      !activeSpeech.current ||
      !["speaking", "preparing"].includes(voiceState)
    )
      return;
    void seat
      .persist({
        ...r,
        turns: r.turns.map((t) =>
          t.id === activeSpeech.current
            ? { ...t, interrupted: true, spokenChars: char }
            : t,
        ),
      })
      .catch((e) => {seat.setNotice(e.message);showError(e.message)});
  }
  const mic = useMicrophone((text, seconds) => {
    const r = runRef.current;
    if (r) {
      seat.draft([r.draft, text].filter(Boolean).join(" "));
      setDeliverySeconds((n) => n + seconds);
      setSource("voice");
    }
  }, interrupt);
  useEffect(() => {
    if (
      run &&
      lastAI &&
      run.status === "active" &&
      lastSpoken.current !== lastAI.id
    ) {
      lastSpoken.current = lastAI.id;
      if (voiceOn) void say(lastAI.text, lastAI.id);
    }
  }, [lastAI?.id, run?.status, voiceOn]);
  useEffect(() => {
    const id = run?.pending?.turnId;
    if (!id || !seat.busy || paused || voiceMode !== "neural" || acknowledgedTurn.current === id) return;
    acknowledgedTurn.current = id;
    void say("Mm-hm.", "authored-ack-" + id);
  }, [run?.pending?.turnId, seat.busy, paused]);
  useEffect(()=>{
    if(!run||run.status!=='complete'||run.debriefRead)return;
    void say('The conversation is complete. Let’s look at the reasoning you documented. This review is provisional, not a hiring verdict.','debrief-intro');
    void seat.persist({...run,debriefRead:true}).catch(e=>seat.setNotice(e.message));
  },[run?.id,run?.status]);
  useEffect(() => {
    if (!run || run.status !== "active") return;
    let previous = Date.now();
    const timer = setInterval(() => {
      const at = Date.now(),
        delta = at - previous;
      previous = at;
      setNow(at);
      const current = runRef.current;
      if (!current || current.status !== "active") return;
      void seat
        .persist({
          ...current,
          elapsedMs: current.elapsedMs + delta,
          updatedAt: stamp(),
        })
        .catch((e) => {seat.setNotice(e.message);showError(e.message)});
    }, 1000);
    return () => clearInterval(timer);
  }, [run?.id, run?.status]);
  useEffect(() => {
    if (
      !run ||
      run.status !== "active" ||
      seat.busy ||
      mic.active ||
      moment ||
      run.draft ||
      voiceState !== "idle"
    )
      return;
    const turn = lastAI?.id;
    if (!turn || nudgedTurn.current === turn) return;
    const first = setTimeout(() => {
      if (
        runRef.current?.turns.filter((t) => t.who === "ai").at(-1)?.id === turn
      )
        { nudgedTurn.current = turn; void say("Take your time. You can also ask me to rephrase."); }
    }, 12000);
    return () => clearTimeout(first);
  }, [
    run?.id,
    lastAI?.id,
    run?.status,
    seat.busy,
    mic.active,
    moment,
    !!run?.draft,
    voiceState,
  ]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  async function pause() {
    if (!run) return;
    mic.stop();
    voice.current?.pause();
    await seat.persist({ ...run, status: "paused" });
  }
  async function resume() {
    if (!run) return;
    voice.current?.resume();
    await seat.persist({ ...run, status: "active" });
  }
  async function end() {
    if (!run) return;
    mic.stop();
    voice.current?.stop();
    setEndDialog(false);
    await seat.persist({ ...run, status: "complete", updatedAt: stamp() });
    if (run.mode !== "guided") {
      const { seatRequest } = await import("./useSeat");
      await seatRequest({ action: "release", id: run.id }).catch(() => {});
    }
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("textarea,input,select,button,[role=dialog]") ||
        !run ||
        finished
      )
        return;
      if (e.key === "Escape") {
        e.preventDefault();
        void (paused ? resume() : pause());
      } else if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        mic.stop();
        setInput("typed");
        composer.current?.focus();
      } else if (e.key.toLowerCase() === "r" && lastAI) {
        e.preventDefault();
        void say(lastAI.text, lastAI.id);
      } else if (
        e.code === "Space" &&
        !e.repeat &&
        micConsent &&
        input === "voice" &&
        !paused
      ) {
        e.preventDefault();
        void mic.start();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space" && mic.active) {
        e.preventDefault();
        mic.stop();
      }
    };
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", up);
    };
  }, [run?.id, paused, finished, lastAI?.id, mic.active, micConsent, input]);
  async function begin(guided = false) {
    voice.current?.unlock();
    const started = await seat.start(
      options,
      !guided && ai && !!seat.cap?.available,
      { adult: true, fictional: true, provider: true, region },
    );
    if (started) {
      setSource("typed");
      setDeliverySeconds(0);
      setMoment(false);
      lastSpoken.current = "";
      if (input === "voice" && !mic.supported) setInput("typed");
    }
  }
  async function send() {
    interrupt();
    setMoment(false);
    await seat.send(source, deliverySeconds);
    setDeliverySeconds(0);
    setSource("typed");
  }
  async function saveCase() {
    if (!run) return;
    const users = run.turns.filter((t) => t.who === "user"),
      existing = await db.caseStudies
        .where("sourceId")
        .equals("hot-seat:" + run.id)
        .first();
    if (existing) {
      seat.setNotice(
        "A case draft from this conversation already exists in Career Studio.",
      );
      return;
    }
    const caseStudy = {
      ...blankCase(ownerId),
      title: `${c.name}: a Hot Seat decision`,
      kind: "simulation" as const,
      origin: "interview" as const,
      sourceId: "hot-seat:" + run.id,
      context: `Fictional ${c.label} conversation with ${p.name}. ${c.situation}`,
      problem: c.situation,
      metric: c.metric,
      decision: users.at(-1)?.text || "",
      evidence: run.observations
        .map((o) => `“${o.quote}” — ${labels[o.dimension]}`)
        .join("\n"),
      learning: "Review this transcript-based draft and add your reflection.",
      outcome: "Simulated practice; no production impact is claimed.",
      skills: [],
      reviewed: false,
      ready: false,
      provenance: {
        questionId: "hot-seat:" + run.id,
        band: "Provisional conversation",
        timed: false,
        spokenSeconds: users.reduce((n, t) => n + (t.seconds || 0), 0),
        initial: users[0]?.text || "",
        pushback: run.turns
          .filter((t) => t.who === "ai" && t.intent === "cross")
          .map((t) => t.text)
          .join("\n"),
        rationale: users.at(-1)?.text || "",
      },
    };
    await db.caseStudies.put(caseStudy);
    seat.setNotice(
      "Simulated case draft saved in Career Studio. Review it before sharing.",
    );
  }
  async function saveTrail(){
    if(!run)return;
    const answers=run.turns.filter(t=>t.who==='user');
    await db.records.put({id:'hot-seat-'+run.id,ownerId,title:`${c.name} · simulated Hot Seat`,source:'manual',createdAt:run.createdAt,updatedAt:stamp(),fields:{problem:c.situation,evidence:run.observations.map(o=>`“${o.quote}” — ${o.note}`).join('\n'),assumptions:'Review the original conversation; assumptions are not inferred as facts.',options:'Document your considered alternatives in the case editor.',tradeoffs:'Review the recorded challenges and add your explicit trade-off.',decision:answers.at(-1)?.text||'',metric:c.metric,nextCheck:'Add a reconsideration trigger after reviewing your original transcript.'}});
    await seat.persist({...run,trailSaved:true});seat.setNotice('Saved a labeled simulation decision record to your workspace.');
  }
  const notice = (
    <>
      {seat.notice && (
        <p className={s.notice} role="status">
          {seat.notice}
        </p>
      )}
      {seat.storageError && (
        <p role="alert" className={s.notice}>
          Device storage failed. Keep this tab open and export your
          conversation.
        </p>
      )}
    </>
  );
  if (!run)
    return (
      <div className={s.lobby}>
        <div className={s.intro}>
          <span className={s.eyebrow}>
            <Armchair size={17} /> {HOT_SEAT_NAME} · AI conversation
          </span>
          <h1>
            Pull up a chair.
            <br />
            <em>Anything can be asked.</em>
          </h1>
          <p>
            Pick a fictional company. Meet a different mind. Talk through the
            next decision, out loud or typed.
          </p>
        </div>
        <div className={s.lobbyGrid}>
          <div>
            <section className={s.step}>
              <span className={s.eyebrow}>Step 1</span>
              <h2>Which kind of company?</h2>
              <div
                className={s.companies}
                role="group"
                aria-label="Company type"
              >
                {companies.map((co, i) => {
                  const Icon = icons[i];
                  return (
                    <button
                      key={co.id}
                      className={s.company}
                      aria-pressed={options.company === co.id}
                      style={{ "--accent": co.color } as React.CSSProperties}
                      onClick={() => setOptions({ ...options, company: co.id })}
                    >
                      <Icon size={30} />
                      <strong>{co.label}</strong>
                      <span>{co.description}</span>
                      <small>{co.stage}</small>
                      <b aria-hidden="true">
                        {options.company === co.id ? "✓" : "○"}
                      </b>
                    </button>
                  );
                })}
              </div>
            </section>
            <section className={s.step}>
              <span className={s.eyebrow}>Step 2</span>
              <h2>Who is across the desk?</h2>
              <div className={s.people}>
                {personas.filter(person => person.id !== "ellis").map((person) => (
                  <article
                    key={person.id}
                    data-selected={options.persona === person.id}
                  >
                    <button
                      className={s.personChoice}
                      aria-pressed={options.persona === person.id}
                      onClick={() =>
                        setOptions({ ...options, persona: person.id })
                      }
                    >
                      <span style={{ background: person.color }}>
                        {person.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                      <div>
                        <strong>{person.name}</strong>
                        <small>{person.role}</small>
                      </div>
                    </button>
                    <button
                      className={s.textButton}
                      onClick={() => {
                        setOptions({ ...options, persona: person.id });
                        voice.current?.unlock();
                        void voice.current?.speak(
                          person.sample,
                          person.id,
                          voiceMode === "gemini" ? "browser" : voiceMode,
                          { id: "preview-" + ownerId, ownerId },
                        );
                      }}
                    >
                      Hear a line <Volume2 size={14} />
                    </button>
                  </article>
                ))}
              </div>
            </section>
            <section className={s.step}>
              <span className={s.eyebrow}>Step 3</span>
              <h2>How do you want to play?</h2>
              <div className={s.options}>
                <fieldset>
                  <legend>Length · soft timebox</legend>
                  <div className={s.segment}>
                    {([10, 20, 30] as const).map((minutes) => (
                      <button
                        key={minutes}
                        aria-pressed={options.minutes === minutes}
                        onClick={() => setOptions({ ...options, minutes })}
                      >
                        {minutes} min
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend>Answer by</legend>
                  <div className={s.segment}>
                    <button
                      aria-pressed={input === "typed"}
                      onClick={() => {
                        mic.stop();
                        setInput("typed");
                      }}
                    >
                      <Keyboard size={15} />
                      Typing
                    </button>
                    <button
                      aria-pressed={input === "voice"}
                      onClick={() => setInput("voice")}
                    >
                      <Mic size={15} />
                      Voice
                    </button>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>Pressure</legend>
                  <div className={s.segment}>
                    {(["friendly", "direct", "tough"] as const).map(
                      (pressure) => (
                        <button
                          key={pressure}
                          aria-pressed={options.pressure === pressure}
                          onClick={() => setOptions({ ...options, pressure })}
                        >
                          {pressure}
                        </button>
                      ),
                    )}
                  </div>
                </fieldset>
              </div>
              {input === "voice" && (
                <div className={s.micCheck}>
                  <label>
                    <input
                      type="checkbox"
                      checked={micConsent}
                      onChange={(e) => {
                        mic.stop();
                        setMicConsent(e.target.checked);
                      }}
                    />
                    Allow microphone input. Browser dictation may process audio
                    with your browser’s provider. Raw audio is not retained.
                  </label>
                  <button
                    className={s.secondary}
                    disabled={!micConsent || mic.active}
                    onClick={() => void mic.start(true)}
                  >
                    Test microphone · 3 seconds
                  </button>
                  <meter
                    min={0}
                    max={100}
                    value={mic.level}
                    aria-label="Real microphone input"
                  />
                  {!mic.supported && (
                    <p>
                      Dictation is unavailable in this browser. Typing still
                      works.
                    </p>
                  )}
                </div>
              )}
            </section>
            <aside className={s.notice} aria-label="Speech note">
              <strong>Note about voices</strong>
              <p>Speech uses the voices already available on your device. There is no large download or paid speech service. Nora and Kai use different voices when available; some devices provide only one. Captions and typing always work.</p>
            </aside>
          </div>
          <aside className={s.summary}>
            <span className={s.eyebrow}>Your session</span>
            <h2>Ready when you are.</h2>
            <dl>
              <div>
                <dt>Company</dt>
                <dd>
                  {c.name} · {c.label}
                </dd>
              </div>
              <div>
                <dt>Across the desk</dt>
                <dd>{p.name}</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>
                  {options.minutes} minutes · {options.pressure} ·{" "}
                  {input === "typed" ? "typed answers" : "voice answers"}
                </dd>
              </div>
            </dl>
            <label className={s.check}>
              <input
                type="checkbox"
                checked={ai && !!seat.cap?.available}
                disabled={!seat.cap?.available}
                onChange={(e) => setAI(e.target.checked)}
              />
              Gemini conversation{seat.cap?.mock ? " · test double" : ""}
            </label>
            <p className={s.fine}>
              {seat.cap?.available
                ? `Up to ${seat.cap.maxTurns} AI replies, including challenges and close. Continue guided after the allowance; time never lowers feedback.`
                : seat.cap?.reason || "Checking AI availability…"}{" "}
              {!seat.cap?.available &&
                "Local guided conversations remain available."}
            </p>
            {ai && seat.cap?.available && (
              <>
                <label className={s.check}>
                  <input
                    type="checkbox"
                    checked={adult}
                    onChange={(e) => setAdult(e.target.checked)}
                  />
                  I am 18 or older.
                </label>
                <label className={s.check}>
                  <input
                    type="checkbox"
                    checked={fictional}
                    onChange={(e) => setFictional(e.target.checked)}
                  />
                  I will send only fictional company answers. I understand
                  Google may review unpaid-service inputs and use them to
                  improve its products.
                </label>
                <label className={s.region}>
                  My current region
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  >
                    <option value="">Choose an approved region</option>
                    {seat.cap.regions.map((r) => (
                      <option key={r} value={r}>
                        {new Intl.DisplayNames(["en"], { type: "region" }).of(
                          r,
                        ) || r}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <button
              className={s.primary}
              disabled={
                seat.busy || !seat.cap ||
                (ai &&
                  !!seat.cap?.available &&
                  (!adult || !fictional || !region))
              }
              onClick={() => void begin()}
            >
              {seat.busy ? "Opening your room…" : "Take the seat"}
              <ArrowRight size={18} />
            </button>
            <button
              className={s.textButton}
              disabled={seat.busy}
              onClick={() => void begin(true)}
            >
              Start a local guided conversation instead
            </button>
            <p className={s.fine}>
              Simulated company. Synthetic persona. Your transcript stays on
              this device; committed AI answers also have an encrypted server
              recovery copy for up to 24 hours.{" "}
              <Link href="/privacy">Privacy details</Link>.
            </p>
            {notice}
          </aside>
        </div>
        {savedList()}
        {deleteDialog()}
      </div>
    );
  function savedList() {
    return (
      seat.saved.length > 0 && (
        <section className={s.saved}>
          <h2>Your previous seats</h2>
          <p className={s.fine}>
            Stored on this browser. Export conversations you want to keep.
          </p>
          {seat.saved.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{company(item.options.company).name}</strong>
                <span>
                  {persona(item.options.persona).name} ·{" "}
                  {item.mode === "guided" ? "Guided" : "AI"} · {item.status}
                </span>
              </div>
              <button
                className={s.secondary}
                onClick={() => void seat.resume(item)}
              >
                {item.status === "complete" ? "Review" : "Resume"}
              </button>
              <button
                className={s.iconButton}
                aria-label={
                  "Delete " + company(item.options.company).name + " session"
                }
                onClick={() => setDeleteTarget(item)}
              >
                <Trash2 size={17} />
              </button>
            </article>
          ))}
        </section>
      )
    );
  }
  if (finished) {
    const review = debrief(run),
      voiceUsers = run.turns.filter(
        (t) => t.who === "user" && t.source === "voice",
      ),
      voiceWords = voiceUsers.reduce(
        (n, t) => n + t.text.split(/\s+/).length,
        0,
      );
    return (
      <div className={s.debrief}>
        <span className={s.eyebrow}>
          Provisional · transcript based · not a hiring verdict
        </span>
        <h1>
          Here is how it
          <br />
          <em>sounded.</em>
        </h1>
        <p>
          {c.name} · {p.name} ·{" "}
          {run.turns.filter((t) => t.who === "user").length} answers ·{" "}
          {run.mode === "guided"
            ? "local guided conversation"
            : "AI conversation"}
        </p>
        <h2>Patterns in your reasoning</h2>
        <p className={s.fine}>
          Ranges summarize sparse quoted observations, not calibrated scores. An
          unobserved dimension is left unassessed.
        </p>
        <div className={s.bands}>
          {review.bands.map((b) => (
            <div key={b.dimension}>
              <strong>{labels[b.dimension]}</strong>
              <div className={s.track}>
                {b.assessed && (
                  <span
                    style={{ left: b.low + "%", width: b.high - b.low + "%" }}
                  />
                )}
              </div>
              <span>
                {b.assessed
                  ? `${b.low}–${b.high} · ${b.count} observations`
                  : "Not enough evidence"}
              </span>
            </div>
          ))}
        </div>
        <h2>Moments worth a second look</h2>
        <div className={s.moments}>
          {review.moments.map((m, i) => (
            <article key={i}>
              <span className={s.eyebrow}>
                {labels[m.dimension]} · {m.polarity}
              </span>
              <q>{m.quote}</q>
              <p>{m.note}</p>
              <button className={s.textButton} onClick={() => void say(`${m.quote}. ${m.note}`, undefined, true)}>Hear this feedback <Volume2 size={14}/></button>
              <button
                className={s.textButton}
                onClick={() => setTranscript(true)}
              >
                Inspect original turn ↗
              </button>
            </article>
          ))}
        </div>
        {!review.moments.length && (
          <p>
            No supported model observations were recorded. Inspect your
            transcript and compare your assumptions, evidence and final
            decision; no score has been invented.
          </p>
        )}
        <h2>Delivery · diagnostic only</h2>
        <div className={s.stats}>
          <div>
            <b>
              {review.voiceSeconds
                ? Math.round(voiceWords / (review.voiceSeconds / 60))
                : "—"}
            </b>
            <span>Words/min · voice only</span>
          </div>
          <div>
            <b>{review.fillers}</b>
            <span>Transcript filler matches</span>
          </div>
          <div>
            <b>{review.longest ? Math.round(review.longest) + "s" : "—"}</b>
            <span>Longest dictated answer</span>
          </div>
          <div>
            <b>{review.interruptions}</b>
            <span>Marked interruptions</span>
          </div>
        </div>
        <p className={s.fine}>
          Dictation may omit fillers and alter wording. These figures do not
          assess accent, fluency, honesty or readiness.
        </p>
        <div className={s.actions}>
          <button
            className={s.primary}
            onClick={() => void saveTrail()}
          >
            Save to decision trail
          </button>
          <button className={s.secondary} onClick={() => void saveCase()}>
            Turn it into a simulated case
          </button>
          <button className={s.secondary} onClick={() => setTranscript(true)}>
            Inspect transcript
          </button>
          <button
            className={s.secondary}
            onClick={() => {
              voice.current?.stop();
              seat.setSession(null);
              runRef.current = null;
              void seat.refresh();
            }}
          >
            Try another company
          </button>
          <button
            className={s.secondary}
            onClick={() =>
              downloadFile(
                "pmforge-hot-seat-" + run.id + ".json",
                sessionExport(run),
                "application/json",
              )
            }
          >
            <Download size={17} />
            Export conversation
          </button>
          <button
            className={s.iconButton}
            aria-label="Delete this conversation"
            onClick={() => setDeleteTarget(run)}
          >
            <Trash2 size={17} />
          </button>
        </div>
        <p>
          <Link href="/app/portfolio">Open Career Studio →</Link> ·{" "}
          <Link href="/app/practice?category=execution-metrics">
            Practise defining metrics →
          </Link>
        </p>
        {notice}
        {transcriptDialog()}
        {deleteDialog()}
      </div>
    );
  }
  function transcriptDialog() {
    return (
      <Dialog
        open={transcript}
        onClose={() => setTranscript(false)}
        title="Original conversation"
        size="lg"
      >
        <p className={s.fine}>
          Original committed words; no generated outline replaces your answers.
          Browser dictation may contain recognition errors.
        </p>
        <ol className={s.transcript}>
          {run?.turns.map((t) => (
            <li key={t.id} data-who={t.who}>
              <strong>
                {t.who === "ai" ? persona(run.options.persona).name : "You"} ·{" "}
                {t.source === "gemini" ? "AI" : t.source}
              </strong>
              <p>{t.text}</p>
              {t.interrupted && (
                <small>
                  You interrupted this line; the full generated text remains
                  inspectable.
                </small>
              )}
              {t.who === "ai" && (
                <button
                  className={s.textButton}
                  onClick={() => void say(t.text, t.id, true)}
                >
                  Replay <Volume2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ol>
        <button
          className={s.secondary}
          onClick={() =>
            run &&
            downloadFile(
              "pmforge-hot-seat-" + run.id + ".json",
              sessionExport(run),
              "application/json",
            )
          }
        >
          Export original conversation
        </button>
      </Dialog>
    );
  }
  function deleteDialog() {
    return (
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete this Hot Seat?"
        size="sm"
      >
        <p>
          The transcript and cached session speech will be removed from this
          browser. Its private server copy is also deleted when reachable.
          Existing exported files or case drafts are separate copies.
        </p>
        <button
          className={s.primary}
          onClick={() => {
            const target = deleteTarget;
            if (target)
              void seat.remove(target).then((ok) => {
                if (ok) setDeleteTarget(null);
              });
          }}
        >
          Delete conversation
        </button>
        <button className={s.secondary} onClick={() => setDeleteTarget(null)}>
          Keep it
        </button>
      </Dialog>
    );
  }
  const status = paused
    ? "Paused"
    : seat.busy
      ? "Thinking"
      : mic.active
        ? "Listening"
        : voiceState === "preparing"
          ? "Preparing voice"
          : voiceState === "speaking"
            ? "Speaking"
            : run.mode === "guided"
              ? "Guided conversation"
              : "Your turn";
  const caption =
    ["speaking", "preparing"].includes(voiceState) && spoken
      ? spoken
      : lastAI?.text || "";
  return createPortal(
    <section className={s.room} aria-label="Hot Seat conversation room">
      <div className={s.lamp} aria-hidden="true" />
      <header className={s.roomBar}>
        <div>
          <span className={s.chip}>{c.name} · simulated</span>
          <span className={s.chip}>
            {Math.floor(remaining / 60)}:
            {String(remaining % 60).padStart(2, "0")}
          </span>
          <span className={s.state} role="status">
            {status}
          </span>
        </div>
        <div>
          <button
            aria-pressed={voiceOn}
            onClick={() => {
              if (voiceOn) voice.current?.stop();
              else if (lastAI) void say(lastAI.text, lastAI.id, true);
              setVoiceOn(!voiceOn);
            }}
          >
            {voiceOn ? <Volume2 size={17} /> : <VolumeX size={17} />}Voice{" "}
            {voiceOn ? "on" : "off"}
          </button>
          <button onClick={() => setTranscript(true)}>Transcript</button>
          <button onClick={() => void pause()}>
            <Pause size={16} />
            Pause
          </button>
          <button onClick={() => setEndDialog(true)}>End</button>
        </div>
      </header>
      <div className={s.center}>
        <Presence
          state={
            paused
              ? "paused"
              : seat.busy
                ? "thinking"
                : mic.active
                  ? "listening"
                  : voiceState
          }
          level={mic.active ? mic.level / 100 : amplitude}
          color={p.color}
        />
        <span className={s.who}>
          {p.name} ·{" "}
          {run.mode === "guided" ? "guided synthetic persona" : "AI persona"} ·{" "}
          {voiceMode === "neural"
            ? "local neural voice"
            : voiceMode === "browser"
              ? "device voice"
              : "Gemini voice"}
        </span>
        <p className={s.caption} aria-live="polite">
          {caption.split(/(\s+)/).map((word, i, all) => {
            const offset = all.slice(0, i).join("").length;
            return (
              <span key={i} data-spoken={offset < char}>
                {word}
              </span>
            );
          })}
        </p>
        {voiceMode !== "browser" && voiceState === "speaking" && (
          <span className={s.fine}>
            Word timing is approximate; levels follow the audio.
          </span>
        )}
        <div className={s.wave} aria-hidden="true">
          {Array.from({ length: 19 }, (_, i) => (
            <i
              key={i}
              style={{
                height: Math.max(
                  3,
                  (mic.active ? mic.level / 100 : amplitude) *
                    32 *
                    (0.4 + (i % 5) / 5),
                ),
              }}
            />
          ))}
        </div>
        {mic.interim && (
          <p className={s.interim}>Draft dictation: {mic.interim}</p>
        )}
        {remaining === 0 && (
          <p className={s.roomNotice}>
            Your soft timebox is up. Conclude when ready; your answer will not
            be cut off.
          </p>
        )}
        {seat.notice && (
          <p className={s.roomNotice} role="status">
            {seat.notice}
          </p>
        )}
        {mic.notice && (
          <p className={s.roomNotice} role={/denied|could not|unavailable|no clear input/i.test(mic.notice) ? "alert" : "status"}>
            {mic.notice}
          </p>
        )}
        {voiceState === "error" && <div className={s.recovery}><button onClick={()=>lastAI && void say(lastAI.text,lastAI.id,true)}>Retry speech</button><span>Captions and typing remain available.</span></div>}
        {run.pending && !seat.busy && (
          <div className={s.recovery}>
            <button
              disabled={now < seat.retryAt}
              onClick={() => void seat.retry()}
            >
              {now < seat.retryAt
                ? `Retry in ${Math.ceil((seat.retryAt - now) / 1000)}s`
                : "Check reply / Retry"}
            </button>
            <button onClick={() => void seat.guided()}>Continue guided</button>
          </div>
        )}
      </div>
      <footer className={s.dock}>
        <div className={s.nextMove}>
          {seat.busy
            ? "Your answer is saved. A follow-up is being prepared."
            : mic.active
              ? "Speak naturally. Press the microphone again when you are done."
              : "Your next move: explain your decision, ask for clarification, or challenge the premise."}
        </div>
        {input === "voice" && (
          <div className={s.micRow}>
            <button
              className={s.mic}
              aria-label={mic.active ? "Finish dictation" : "Start dictation"}
              aria-pressed={mic.active}
              disabled={!micConsent || paused || seat.busy || !!run.pending}
              onClick={() => (mic.active ? mic.stop() : void mic.start())}
            >
              {mic.active ? <Square /> : <Mic />}
            </button>
            <span>
              {mic.supported
                ? "Dictation stays a draft until Send."
                : "Dictation unavailable here. Use typing."}
            </span>
          </div>
        )}
        <div className={s.composer}>
          <label className={s.srOnly} htmlFor="hot-seat-answer">
            Your answer
          </label>
          <textarea
            id="hot-seat-answer"
            ref={composer}
            value={run.draft}
            maxLength={4000}
            rows={2}
            placeholder="Think it through. Ask for context. Make a call."
            onChange={(e) => {
              seat.draft(e.target.value);
              setMoment(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button
            disabled={
              paused ||
              seat.busy ||
              !!run.pending ||
              !run.draft.trim() ||
              seat.storageError
            }
            onClick={() => void send()}
          >
            {run.mode === "guided" ? "Send answer" : "Send fictional answer"}
            <ArrowRight size={18} />
          </button>
        </div>
        <div className={s.quick}>
          <button
            onClick={() => {
              mic.stop();
              setInput(input === "typed" ? "voice" : "typed");
            }}
          >
            {input === "typed" ? "Use dictation" : "Type instead"}
          </button>
          {input === "voice" && !micConsent && (
            <label>
              <input
                type="checkbox"
                checked={micConsent}
                onChange={(e) => setMicConsent(e.target.checked)}
              />
              Allow mic and browser dictation
            </label>
          )}
          <button onClick={() => lastAI && void say(lastAI.text, lastAI.id)}>
            Repeat that
          </button>
          <button
            disabled={seat.busy || !!run.pending}
            onClick={() => {
              seat.draft(
                "Could you rephrase your last question without adding new facts?",
              );
              composer.current?.focus();
            }}
          >
            Can you rephrase?
          </button>
          <button
            aria-pressed={moment}
            onClick={() => {
              setMoment(true);
              voice.current?.stop();
              seat.setNotice(
                "Take a moment. Nudges are paused; the soft timebox still runs.",
              );
            }}
          >
            I need a moment
          </button>
        </div>
        <span className={s.hint}>
          Ctrl/⌘ Enter sends · T types · R repeats · Esc pauses · PMForge does not retain microphone audio; synthetic speech is cached for replay
        </span>
      </footer>
      <Dialog
        open={paused}
        onClose={() => void resume()}
        title="Your seat is waiting."
        size="sm"
      >
        <div className={s.pauseContent}>
          <Armchair size={40} />
          <p>The clock and speech are paused. Your draft is saved.</p>
          <button className={s.primary} onClick={() => void resume()}>
            Resume conversation
          </button>
          <button className={s.secondary} onClick={() => void end()}>
            End and review
          </button>
          <button
            className={s.textButton}
            onClick={() => {
              mic.stop();
              voice.current?.stop();
              seat.setSession(null);
              runRef.current = null;
              void seat.refresh();
            }}
          >
            Save and return to lobby
          </button>
        </div>
      </Dialog>
      <Dialog
        open={endDialog}
        onClose={() => setEndDialog(false)}
        title="Ready to leave the seat?"
        size="sm"
      >
        <p>
          Your transcript stays saved. Any unsent draft is retained and marked
          as uncommitted in your export.
        </p>
        <button
          className={s.primary}
          disabled={seat.busy}
          onClick={() => void end()}
        >
          {seat.busy ? "Wait for the saved reply to finish" : "End and review"}
        </button>
        <button className={s.secondary} onClick={() => setEndDialog(false)}>
          Keep going
        </button>
      </Dialog>
      {transcriptDialog()}
      {deleteDialog()}
    </section>, document.body
  );
}
