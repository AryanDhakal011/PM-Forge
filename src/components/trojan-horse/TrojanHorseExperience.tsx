"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ArrowLeft, ArrowRight, Check, CircleDollarSign, Clock3, Pause, Users } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { useSettings } from "@/components/providers/SettingsProvider";
import {
  advanceState,
  initialState,
  runway,
  type Placement,
  type Segment,
  type State,
} from "@/lib/trojan-horse/engine";
import s from "./TrojanHorse.module.css";

const drawers = [
  ["Referral payout ledger", "It shows who is paid twice."],
  ["Account graph", "Loops form around the same people."],
  ["Cohort value", "Some circular users are valuable customers."],
  ["Device fingerprints", "One person can hold many accounts."],
  ["Community threads", "People call this a feature."],
  ["Partner contracts", "The Guilds were promised bonuses in writing."],
  ["Cash forecast", "The current runway is twelve weeks."],
] as const;

const people = [
  ["Kavya Mehta", "CEO", "Keep the party going", "Down round", "Growth challenge"],
  ["Omar Reyes", "CFO", "Defend runway", "Cash surprise", "Weekly number"],
  ["Dani Kwon", "Growth", "Earn signup credit", "Being blamed", "It’s working"],
  ["Tomas Aranda", "Partners", "Keep promises", "Partner churn", "Names first"],
] as const;

const segmentMeta: Record<Segment, { name: string; share: string; color: string }> = {
  fraud: { name: "Fraud rings", share: "62%", color: "#a9a4af" },
  gamers: { name: "Gamers", share: "18%", color: "#ff3ea5" },
  guilds: { name: "Neighborhood Guilds", share: "20%", color: "#e9b949" },
  unknown: { name: "Unknown", share: "18%", color: "#81738c" },
};

function Avatar({ name, index = 0 }: { name: string; index?: number }) {
  const colors = ["#f1c8a2", "#b88466", "#d9a67f", "#8f604a"];
  return (
    <svg viewBox="0 0 64 64" className={s.avatar} role="img" aria-label={name}>
      <rect width="64" height="64" rx="16" fill={colors[index]} />
      <path d="M9 64q3-20 23-20t23 20" fill={index % 2 ? "#231034" : "#5f3d5d"} />
      <ellipse cx="32" cy="29" rx="16" ry="18" fill={colors[index]} />
      <path d={index === 2 ? "M15 28Q12 5 34 7q20 2 15 23l-8-14-24 5z" : "M14 26Q13 7 32 7q21 0 18 21l-9-10-23 9z"} fill={index === 3 ? "#3b2a25" : "#28202a"} />
      <circle cx="26" cy="30" r="1.8" fill="#241c20" /><circle cx="38" cy="30" r="1.8" fill="#241c20" />
      <path d="M27 38q5 3 10 0" fill="none" stroke="#704b43" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Constellation({ lenses, placed }: { lenses: string[]; placed: Record<Segment, Placement | ""> }) {
  const nodes = useMemo(() => Array.from({ length: 62 }, (_, i) => {
    const ring = i % 7 === 0 ? 126 : 102;
    const angle = i * 2.39996;
    const radius = ring + (i % 4) * 7;
    return { x: 220 + Math.cos(angle) * radius, y: 220 + Math.sin(angle) * radius, i };
  }), []);
  return (
    <svg className={s.constellation} viewBox="0 0 440 440" role="img" aria-label="Referral account constellation with fraud, gamer, Guild, and unknown account segments">
      <defs><filter id="glow"><feGaussianBlur stdDeviation="2.4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      <g className={lenses.length ? s.lensed : ""}>
        {nodes.map((n, i) => {
          const segment: Segment = i % 13 === 0 ? "fraud" : i % 5 === 0 ? "guilds" : i % 3 === 0 ? "gamers" : "unknown";
          const color = segmentMeta[segment].color;
          const placedGuild = segment === "guilds" && placed.guilds;
          return <g key={i}><line x1={n.x} y1={n.y} x2={220 + Math.cos(n.i * 2.39996 + .5) * (n.i % 7 === 0 ? 126 : 102)} y2={220 + Math.sin(n.i * 2.39996 + .5) * (n.i % 7 === 0 ? 126 : 102)} stroke={placedGuild ? "#e9b949" : "#493650"} strokeWidth=".7" opacity=".55" />{placedGuild && <circle cx={n.x} cy={n.y} r="4.5" fill="none" stroke="#e9b949" filter="url(#glow)" />}<circle cx={n.x} cy={n.y} r={i % 11 === 0 ? 4.8 : 3.2} fill={color} opacity=".88" /></g>;
        })}
      </g>
      <circle cx="220" cy="220" r="83" fill="none" stroke="#ff3ea5" strokeWidth="2" strokeDasharray="5 8" opacity=".78" />
      <circle cx="220" cy="220" r="64" fill="none" stroke="#e9b949" strokeWidth="1.5" opacity=".7" />
    </svg>
  );
}

export default function TrojanHorseExperience() {
  const { reducedMotion, playCue, vibrate } = useSettings();
  const rootRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<State>(initialState);
  const [coldOpen, setColdOpen] = useState(true);
  const [roleOpen, setRoleOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lens, setLens] = useState("");
  const [reward, setReward] = useState(10);
  const [advanceReadout, setAdvanceReadout] = useState("");
  const [readoutOpen, setReadoutOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("pmforge.trojan-horses.v1");
      if (saved) setState(JSON.parse(saved) as State);
    } catch { /* Storage is an enhancement. */ }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("pmforge.trojan-horses.v1", JSON.stringify(state));
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch { /* Storage is an enhancement. */ }
  }, [state]);

  useEffect(() => {
    if (!rootRef.current || reducedMotion) return;
    const ctx = gsap.context(() => {
      const tool = rootRef.current?.querySelector("aside:last-of-type");
      const graph = rootRef.current?.querySelector('svg[aria-label*="constellation"]');
      const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });
      if (tool) timeline.from(tool, { x: 18, opacity: 0, duration: 0.24 });
      if (graph) timeline.from(graph, { scale: 0.96, opacity: 0, duration: 0.4 }, "<");
    }, rootRef);
    return () => ctx.revert();
  }, [state.chapter, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const circles = rootRef.current?.querySelectorAll("svg circle");
      if (circles?.length) gsap.fromTo(circles, { opacity: 0.25 }, { opacity: 0.9, duration: 0.8, stagger: 0.008, ease: "power1.out" });
    }, rootRef);
    return () => ctx.revert();
  }, [lens, reducedMotion]);

  const runwayWeeks = runway(state);
  const placedCount = Object.values(state.placements).filter(Boolean).length;
  const selectedMessage = state.message || "";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !coldOpen) setPaused((value) => !value);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [coldOpen]);

  function firstDecision(value: "Pay once" | "Pay twice" | "Don't pay") {
    setAnnouncement(`Loop choice recorded: ${value}.`);
    playCue("tick");
    vibrate(24);
    setColdOpen(false);
    setRoleOpen(true);
  }

  function openDrawer(title: string) {
    if (!state.drawers.includes(title)) setState((s) => ({ ...s, drawers: [...s.drawers, title] }));
    setAnnouncement(`${title} evidence opened.`);
    playCue("paper");
  }

  function useLens(value: string) {
    setLens(value);
    if (value && !state.lenses.includes(value)) setState((s) => ({ ...s, lenses: [...s.lenses, value] }));
    setAnnouncement(`${value} lens active.`);
    playCue("tick");
  }

  function placeSegment(segment: Segment, placement: Placement) {
    setState((s) => ({ ...s, placements: { ...s.placements, [segment]: placement } }));
    setAnnouncement(`${segmentMeta[segment].name} placed as ${placement}.`);
    playCue(placement ? "chime" : "error");
    vibrate(placement ? 18 : 40);
  }

  function advance() {
    setState((s) => advanceState(s, 2));
    setAnnouncement("Two weeks advanced. Ledger updated.");
    playCue("chime");
    setAdvanceReadout("Week advanced by two. Cash moved with the policy; partner revenue and community trust will follow.");
    setReadoutOpen(true);
  }

  const chapterCopy = {
    1: ["Golden Spike", "Find out who is paid twice—and decide what to do tonight."],
    2: ["The Guild Call", "Separate misuse from a legitimate growth loop."],
    3: ["The Sunset", "Ship the change without losing the people or the runway."],
    4: ["The Ledger of Loops", "See what your policy kept, cut, and cost."],
  } as const;

  return (
    <main ref={rootRef} className={s.root} data-chapter={state.chapter}>
      <header className={s.topbar}>
        <Link className={s.back} href="/app/projects" aria-label="Back to projects"><ArrowLeft size={16} /> Projects</Link>
        <div className={s.projectTitle}><span>The Trojan Horses</span><small>WEEK {state.week}</small></div>
        <div className={s.metrics}>
          <div><CircleDollarSign size={15} /><span><small>Cash</small>${(state.cash / 1_000_000).toFixed(2)}M</span></div>
          <div className={s.runwayRing}><span>{runwayWeeks.toFixed(1)}</span><small>weeks</small></div>
          <button onClick={() => setPaused(true)}><Pause size={15} /> Pause</button>
        </div>
      </header>

      <section className={s.stage}>
        <aside className={s.evidenceRail}>
          <div className={s.stageLabel}><span>01</span><div><small>Current pressure</small><strong>{chapterCopy[state.chapter][0]}</strong></div></div>
          <p className={s.goal}>{chapterCopy[state.chapter][1]}</p>
          <div className={s.partyLine}><span style={{ width: `${Math.min(100, Math.max(12, runwayWeeks * 7))}%` }} /></div>
          <div className={s.stageStats}>
            <span><small>Community</small><strong>{state.trust}%</strong></span>
            <span><small>Partners</small><strong>{state.partnerTrust}%</strong></span>
            <span><small>Rating</small><strong>{state.rating.toFixed(1)}</strong></span>
          </div>
          {state.chapter === 1 && <button className={s.peopleButton} onClick={() => setPeopleOpen(true)}><Users size={16} /> People <span>4</span></button>}
        </aside>

        <section className={s.graphPanel} aria-label="Referral constellation">
          <Constellation lenses={state.lenses} placed={state.placements} />
          <div className={s.graphLegend}>
            <span><i className={s.grey} /> Suspected fraud</span><span><i className={s.pink} /> Gamers</span><span><i className={s.gold} /> Guilds</span>
          </div>
        </section>

        <aside className={s.toolPanel}>
          {state.chapter === 1 && <>
            <div className={s.toolHead}><span>Evidence</span><small>{state.drawers.length}/7 opened</small></div>
            <div className={s.drawerList}>{drawers.map(([title, soWhat]) => <button key={title} onClick={() => openDrawer(title)}><span>{title}</span>{state.drawers.includes(title) ? <Check size={14} /> : <ArrowRight size={14} />}</button>)}</div>
            {state.drawers.length > 0 && <div className={s.drawerReceipt}><small>So what</small><strong>{drawers.find(([title]) => state.drawers.includes(title))?.[1]}</strong></div>}
            <div className={s.toolDivider} />
            <div className={s.toolHead}><span>Loop Lens</span><small>{state.lenses.length} useful filters</small></div>
            <div className={s.lensRow}>{["Device", "Age", "Purchases", "Location"].map((item) => <button key={item} className={lens === item ? s.active : ""} onClick={() => useLens(item)}>{item}</button>)}</div>
            <div className={s.valve}>
              <div><span>Reward per referral</span><strong>${reward}</strong></div><input aria-label="Reward per referral" type="range" min="0" max="20" value={reward} onChange={(e) => setReward(Number(e.target.value))} />
              <button className={s.primary} onClick={() => setState((s) => ({ ...s, chapter: 2 }))}>Set policy <ArrowRight size={15} /></button>
            </div>
          </>}

          {state.chapter === 2 && <>
            <div className={s.toolHead}><span>Segment Board</span><small>{placedCount}/4 placed</small></div>
            <div className={s.segmentList}>{(["fraud", "gamers", "guilds", "unknown"] as Segment[]).map((segment) => <div className={s.segmentCard} key={segment}><i style={{ background: segmentMeta[segment].color }} /><div><strong>{segmentMeta[segment].name}</strong><small>{segmentMeta[segment].share} of circular payout</small></div><select aria-label={`${segmentMeta[segment].name} policy`} value={state.placements[segment]} onChange={(e) => placeSegment(segment, e.target.value as Placement)}><option value="">Place segment</option><option value="cut">Cut now</option><option value="sunset">Sunset with notice</option><option value="keep">Keep as designed</option><option value="formalize">Formalize with cap</option></select></div>)}</div>
            <p className={s.reflection}>Would we design this from scratch?</p>
            <label className={s.grace}>Grace period<select value={state.grace.guilds} onChange={(e) => setState((s) => ({ ...s, grace: { ...s.grace, guilds: Number(e.target.value) } }))}><option value="0">None</option><option value="14">14 days</option><option value="30">30 days</option><option value="365">Honored contract</option></select></label>
            <button className={s.primary} disabled={placedCount < 3} onClick={() => setState((s) => ({ ...s, chapter: 3 }))}>Continue to sunset <ArrowRight size={15} /></button>
          </>}

          {state.chapter === 3 && <>
            <div className={s.toolHead}><span>Announcement</span><small>Community preview</small></div>
            <div className={s.messageChoices}>{["This is a bug and we are fixing it today.", "We are reviewing how referral rewards work.", "Circular rewards were never intended. We will honor existing rewards."].map((message, i) => <button key={message} className={selectedMessage === message ? s.active : ""} onClick={() => setState((s) => ({ ...s, message: message, announcement: message }))}><span>0{i + 1}</span>{message}</button>)}</div>
            <label className={s.grace}>Rollout speed<select value={state.rollout} onChange={(e) => setState((s) => ({ ...s, rollout: e.target.value as State["rollout"] }))}><option value="instant">Instant</option><option value="2-weeks">2 weeks</option><option value="4-weeks">4 weeks</option></select></label>
            <div className={s.communityFeed} aria-live="polite"><small>Community temperature</small><p>“You wrote you were fixing it today.”</p><p>“Keep the Guild partners who built this with us.”</p></div>
            <button className={s.primary} disabled={!selectedMessage} onClick={() => setState((s) => ({ ...s, chapter: 4 }))}>Publish policy <ArrowRight size={15} /></button>
          </>}

          {state.chapter === 4 && <>
            <div className={s.toolHead}><span>The Ledger</span><small>Before → after</small></div>
            <div className={s.outcome}><span>Cash saved<small>${Math.max(0, (510_000 - state.burn) * 12 / 1000).toFixed(0)}k</small></span><span>Runway<small>{runwayWeeks.toFixed(1)} weeks</small></span><span>Partner trust<small>{state.partnerTrust}%</small></span></div>
            <div className={s.ledgerText}><strong>{state.placements.guilds === "formalize" ? "The Gardener" : "The Pragmatist"}</strong><p>{state.placements.guilds === "formalize" ? "You cut misuse, kept a legitimate loop, and put it on a cap." : "You made a bounded tradeoff with visible consequences."}</p></div>
            <button className={s.primary} onClick={advance}>Advance two weeks <ArrowRight size={15} /></button>
            <button className={s.quietAction} onClick={() => { setState(initialState); setAnnouncement("Branch replayed. Returning to the first chapter."); playCue("paper"); }}>Replay branch</button>
          </>}
        </aside>
      </section>

      <footer className={s.footer}><span>What I can still do</span><strong>{state.chapter === 1 ? "Open more evidence or set the payout valve." : state.chapter === 2 ? `Place ${Math.max(0, 4 - placedCount)} more segments.` : state.chapter === 3 ? "Choose your wording and rollout speed." : "Review the ledger and replay a branch."}</strong><span className={s.saveStatus}>Saved {savedAt || "just now"}</span><button onClick={() => setPeopleOpen(true)}>Case file</button></footer>
      <div className={s.liveRegion} aria-live="polite" aria-atomic="true">{announcement}</div>

      <Dialog open={coldOpen} onClose={() => setColdOpen(false)} title="A referral should pay for one new customer." dismissible={false} size="md">
        <div className={s.coldOpen}><div className={s.sampleLoop}><span>Ana</span><ArrowRight /><span>Ben</span><ArrowRight /><span>Ana</span></div><p>Two accounts. One circle. Both sides were paid twice.</p><div className={s.loopChoices}>{["Pay once", "Pay twice", "Don't pay"].map((choice) => <button key={choice} className={choice === "Pay once" ? s.primary : ""} onClick={() => firstDecision(choice as "Pay once")}>{choice}</button>)}</div></div>
      </Dialog>

      <Dialog open={roleOpen} onClose={() => setRoleOpen(false)} title="Role Card" size="sm">
        <div className={s.roleCard}><Avatar name="You" index={1} /><div><small>YOUR ROLE</small><h2>Growth Product Manager</h2><p>Referrals and Rewards</p></div></div><div className={s.roleGoals}><strong>Goals</strong><span>Protect runway</span><span>Keep valuable Guilds</span><span>Tell the truth in public</span></div><button className={s.primary} onClick={() => { setRoleOpen(false); }}>Enter the party <ArrowRight size={15} /></button>
      </Dialog>

      <Dialog open={peopleOpen} onClose={() => setPeopleOpen(false)} title="People" size="lg">
        <div className={s.peopleGrid}>{people.map(([name, role, wants, fears, tells], i) => <article key={name}><Avatar name={name} index={i} /><div><small>{role}</small><h3>{name}</h3></div><dl><div><dt>Wants</dt><dd>{wants}</dd></div><div><dt>Fears</dt><dd>{fears}</dd></div><div><dt>Tells</dt><dd>{tells}</dd></div></dl></article>)}</div>
      </Dialog>

      <Dialog open={paused} onClose={() => setPaused(false)} title="The party is paused." size="sm"><div className={s.pauseCopy}><Clock3 size={22} /><p>Your policy, evidence, and choices are saved at the current beat.</p><button className={s.primary} onClick={() => setPaused(false)}>Resume</button></div></Dialog>
      <Dialog open={readoutOpen} onClose={() => setReadoutOpen(false)} title="Two weeks later" size="sm"><div className={s.pauseCopy}><CircleDollarSign size={22} /><p>{advanceReadout}</p><strong>Cash ${(state.cash / 1_000_000).toFixed(2)}M · runway {runway(state).toFixed(1)} weeks</strong></div></Dialog>
    </main>
  );
}
