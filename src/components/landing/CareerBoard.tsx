"use client";

import Link from "next/link";
import gsap from "gsap";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  ClipboardCopy,
  Check,
  ChevronDown,
  GraduationCap,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/clipboard";
import { useSettings } from "@/components/providers/SettingsProvider";
import { scrollState } from "@/lib/scrollState";
import {
  ensureScrollTrigger,
  resolveCalm,
  setCalmVar,
  bindStoryTargets,
} from "@/lib/scrollStory";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { track } from "@/lib/analytics";
import styles from "./CareerBoard.module.css";

const CAREER_KEY = "pmforge.career.v1";

const ROLES = [
  "Associate Product Manager",
  "Product Manager",
  "Senior Product Manager",
  "Group Product Manager / Lead",
];

const roleLabel = (value: string) =>
  value === "Group Product Manager / Lead" ? "Group PM / Lead" : value;

const ARTIFACT_TILES = [
  {
    title: "Decision record",
    detail: "Ship the Android workaround",
    href: "#decision-record",
  },
  { title: "PRD excerpt", detail: "Guided onboarding" },
  { title: "Metric tree", detail: "Activation" },
  { title: "Experiment brief", detail: "Checkout copy test" },
  { title: "Journey map", detail: "First week" },
  { title: "Roadmap slice", detail: "Q3 themes" },
];

const ROLE_DATA: Record<
  string,
  {
    target: number;
    benchmark: string;
    cadence: number;
    interviews: number;
    decisions: number;
    skills: { label: string; value: number }[];
    focus: string;
  }
> = {
  "Associate Product Manager": {
    target: 65,
    benchmark: "Top 40% of practice cohort",
    cadence: 4,
    interviews: 6,
    decisions: 5,
    skills: [
      { label: "Discovery", value: 8 },
      { label: "Data basics", value: 6 },
      { label: "Prioritization", value: 5 },
      { label: "Writing specs", value: 7 },
      { label: "Stakeholder", value: 3 },
    ],
    focus: "Frame the problem before proposing.",
  },
  "Product Manager": {
    target: 72,
    benchmark: "Top 30% of practice cohort",
    cadence: 4,
    interviews: 9,
    decisions: 8,
    skills: [
      { label: "Prioritization", value: 9 },
      { label: "Experimentation", value: 7 },
      { label: "Stakeholder", value: 6 },
      { label: "Roadmapping", value: 6 },
      { label: "Execution", value: 8 },
    ],
    focus: "Connect evidence to the customer outcome.",
  },
  "Senior Product Manager": {
    target: 78,
    benchmark: "Top 20% of practice cohort",
    cadence: 3,
    interviews: 12,
    decisions: 14,
    skills: [
      { label: "Strategy", value: 9 },
      { label: "Stakeholder", value: 9 },
      { label: "Trade-offs", value: 9 },
      { label: "Metrics design", value: 8 },
      { label: "Mentoring", value: 5 },
    ],
    focus: "Price the alternative and state what you will not do.",
  },
  "Group Product Manager / Lead": {
    target: 82,
    benchmark: "Top 15% of practice cohort",
    cadence: 3,
    interviews: 14,
    decisions: 18,
    skills: [
      { label: "Portfolio strategy", value: 9 },
      { label: "Org design", value: 7 },
      { label: "Cross-team alignment", value: 9 },
      { label: "Narrative", value: 9 },
      { label: "Hiring", value: 6 },
    ],
    focus: "Make the portfolio trade-off legible across teams.",
  },
};

function TileArt({ index }: { index: number }) {
  return (
    <svg
      className={styles.tileArt}
      viewBox="0 0 120 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {index === 0 ? (
        <>
          <rect x="34" y="8" width="52" height="48" rx="1" />
          <path d="M42 18h22M42 24h30M42 30h18" />
          <path d="M42 42h13M42 48h20" />
          <circle cx="76" cy="44" r="7" />
          <path d="M73 44l2 2 4-5" />
        </>
      ) : index === 1 ? (
        <>
          <path d="M36 8h34l14 14v34H36z" />
          <path d="M70 8v14h14" />
          <path d="M44 32h28M44 38h20M44 44h24" />
        </>
      ) : index === 2 ? (
        <>
          <circle cx="60" cy="14" r="6" />
          <circle cx="33" cy="42" r="6" />
          <circle cx="87" cy="42" r="6" />
          <path d="M60 20v10M60 30H38v6M60 30h22v6" />
          <path d="M29 56h8M83 56h8" opacity="0.55" />
        </>
      ) : index === 3 ? (
        <>
          <path d="M22 52h76M28 52V14" />
          <rect x="38" y="36" width="10" height="16" />
          <rect x="55" y="28" width="10" height="24" />
          <rect x="72" y="20" width="10" height="32" />
          <path d="M38 30l17-7 17-7" opacity="0.55" />
        </>
      ) : index === 4 ? (
        <>
          <path
            d="M24 46c12-2 15-22 28-22s16 18 30 14 12-10 16-16"
            strokeDasharray="3 4"
          />
          <circle cx="24" cy="46" r="4" fill="currentColor" />
          <circle cx="52" cy="24" r="4" />
          <circle cx="82" cy="38" r="4" />
          <circle cx="98" cy="22" r="4" fill="currentColor" />
        </>
      ) : (
        <>
          <path d="M22 16h76M22 32h76M22 48h76" opacity="0.4" />
          <rect x="26" y="11" width="24" height="10" rx="1" />
          <rect x="54" y="26" width="32" height="10" rx="1" />
          <rect x="42" y="42" width="38" height="10" rx="1" />
        </>
      )}
    </svg>
  );
}

type PracticeState = {
  signal: { strength: string; verdict: string } | null;
  interview: { overall: number; band: string; missing: string } | null;
  decisions: number;
  sprintChecks: number;
};

type UserState = { name: string; email: string } | null;

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function isLinkedIn(value: string) {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return (
      /(^|\.)linkedin\.com$/i.test(url.hostname) &&
      /^\/in\/[^/]+/i.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export function CareerBoard() {
  const { playCue, reducedMotion } = useSettings();
  const [role, setRole] = useState("Product Manager");
  const [linkedin, setLinkedin] = useState("");
  const [linkedinInput, setLinkedinInput] = useState("");
  const [linkedinError, setLinkedinError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [practice, setPractice] = useState<PracticeState>({
    signal: null,
    interview: null,
    decisions: 0,
    sprintChecks: 0,
  });
  const [user, setUser] = useState<UserState>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [savedNote, setSavedNote] = useState("");
  const linkedinRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const rolePickerRef = useRef<HTMLDivElement>(null);
  const roleTriggerRef = useRef<HTMLButtonElement>(null);
  const roleOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const typeaheadRef = useRef("");
  const typeaheadTimerRef = useRef(0);
  const [roleOpen, setRoleOpen] = useState(false);
  const [roleAbove, setRoleAbove] = useState(false);
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);
  const [animateRoleBars, setAnimateRoleBars] = useState(false);

  const readProgress = () => {
    const signal = readJson<{ strength: string; verdict: string }>(
      "pmforge.signal.v1",
    );
    const interview = readJson<{
      overall: number;
      band: string;
      missing: string;
    }>("pmforge.interview.v1");
    const projects = readJson<{
      checks?: Record<string, string[]>;
      decisions?: Record<string, string>;
    }>("pmforge.projects.v1");
    const decisions = projects?.decisions
      ? Object.values(projects.decisions).filter(Boolean).length
      : 0;
    const sprintChecks = projects?.checks
      ? Object.values(projects.checks).reduce(
          (sum, items) => sum + items.length,
          0,
        )
      : 0;
    setPractice({ signal, interview, decisions, sprintChecks });
  };

  useEffect(() => {
    const career = readJson<{ role?: string; linkedin?: string }>(CAREER_KEY);
    if (career?.role && ROLES.includes(career.role)) setRole(career.role);
    if (career?.linkedin) {
      setLinkedin(career.linkedin);
      setLinkedinInput(career.linkedin);
    }
    setUser(readJson<UserState>("pmforge.user"));
    readProgress();
    setLoaded(true);

    const onChange = () => readProgress();
    window.addEventListener("pmforge:progress", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("pmforge:progress", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(
        CAREER_KEY,
        JSON.stringify({ role, linkedin }),
      );
    } catch {
      // The board remains usable without persistence.
    }
  }, [role, linkedin, loaded]);

  const hasPractice = Boolean(
    practice.signal || practice.interview || practice.decisions > 0,
  );
  const strength = hasPractice
    ? Math.min(
        100,
        Math.round(
          30 +
            (practice.signal ? 14 : 0) +
            practice.decisions * 12 +
            (practice.interview ? practice.interview.overall * 0.36 : 0) +
            (linkedin ? 6 : 0),
        ),
      )
    : 78;
  const displayName = user?.name?.trim() || "Sarah Chen";
  const roleData = ROLE_DATA[role] ?? ROLE_DATA["Product Manager"];
  const rubricScore = practice.interview?.overall ?? roleData.target;
  const projectCount = hasPractice ? practice.decisions : 3;
  const stats = [
    { label: "Modules", value: "10" },
    {
      label: "Decisions",
      value: String(hasPractice ? projectCount : roleData.decisions),
    },
    { label: "Rubric", value: `${rubricScore}` },
  ];
  const skillRows = roleData.skills;
  const counterValues = stats.map((stat) => stat.value).join(":");

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) return;
    const ScrollTrigger = ensureScrollTrigger();
    let animation: gsap.core.Tween | undefined;
    const counters = section.querySelectorAll<HTMLElement>(
      "[data-career-count]",
    );
    const context = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section.querySelector(`.${styles.stats}`),
        start: "top 90%",
        invalidateOnRefresh: true,
        once: true,
        onEnter: () => {
          animation = gsap.fromTo(
            counters,
            { textContent: 0 },
            {
              textContent: (_index: number, element: HTMLElement) =>
                Number(element.dataset.careerCount),
              snap: { textContent: 1 },
              duration: 0.55,
              stagger: 0.06,
              ease: "power2.out",
            },
          );
        },
      });
      return () => {
        trigger.kill();
        animation?.kill();
      };
    }, section);
    return () => {
      context.revert();
      // React retains ownership of the real, accessible values.
      counters.forEach((counter) => {
        counter.textContent = counter.dataset.careerCount ?? "";
      });
    };
  }, [counterValues, reducedMotion]);

  useEffect(() => {
    if (!roleOpen) return;
    const trigger = roleTriggerRef.current;
    const selectedIndex = ROLES.indexOf(role);
    const index = selectedIndex < 0 ? 0 : selectedIndex;
    setActiveRoleIndex(index);
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setRoleAbove(window.innerHeight - rect.bottom < 190 && rect.top > 190);
    }
    roleOptionRefs.current[index]?.focus();
  }, [roleOpen, role]);

  useEffect(() => {
    if (!roleOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rolePickerRef.current?.contains(event.target)
      ) {
        setRoleOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [roleOpen]);

  useEffect(() => {
    return () => window.clearTimeout(typeaheadTimerRef.current);
  }, []);

  /**
   * The profile card lifts into place as the board enters: the last step of
   * the story, where practice becomes a presentable record. Pass-through
   * trigger only; the card stays fully usable while it settles.
   */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    bindStoryTargets(
      section,
      "--calm",
      `.${styles.copy},.${styles.profile},.${styles.plantShadows},.${styles.tile},.${styles.stats} strong`,
    );

    if (reducedMotion) {
      scrollState.calm = 1;
      setCalmVar(section, 1);
      return;
    }

    const ScrollTrigger = ensureScrollTrigger();
    const apply = (value: number) => {
      const calm = resolveCalm(value);
      scrollState.calm = calm;
      setCalmVar(section, calm);
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top 82%",
      end: "center 46%",
      invalidateOnRefresh: true,
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });
    apply(trigger.progress);

    return () => trigger.kill();
  }, [reducedMotion]);

  const selectRole = (nextRole: string) => {
    if (nextRole !== role) setAnimateRoleBars(true);
    setRole(nextRole);
    setRoleOpen(false);
    roleTriggerRef.current?.focus();
    playCue("tick");
    track("career_role", { role: nextRole });
  };

  const handleRoleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const current = roleOpen ? activeRoleIndex : ROLES.indexOf(role);
    let next = current;
    if (event.key === "ArrowDown") next = (current + 1) % ROLES.length;
    else if (event.key === "ArrowUp")
      next = (current - 1 + ROLES.length) % ROLES.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = ROLES.length - 1;
    else if (event.key === "Escape") {
      if (roleOpen) {
        event.preventDefault();
        setRoleOpen(false);
        roleTriggerRef.current?.focus();
      }
      return;
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (roleOpen && ROLES[activeRoleIndex]) {
        selectRole(ROLES[activeRoleIndex]);
      } else {
        setRoleOpen(true);
      }
      return;
    } else if (event.key.length === 1 && /\S/.test(event.key)) {
      typeaheadRef.current += event.key.toLowerCase();
      window.clearTimeout(typeaheadTimerRef.current);
      typeaheadTimerRef.current = window.setTimeout(() => {
        typeaheadRef.current = "";
      }, 600);
      const match = ROLES.findIndex((item) =>
        item.toLowerCase().startsWith(typeaheadRef.current),
      );
      if (match >= 0) {
        selectRole(ROLES[match]);
        return;
      } else return;
    } else {
      return;
    }
    event.preventDefault();
    setActiveRoleIndex(next);
    setRoleOpen(true);
  };

  const handleRoleListKeyDown = (
    event: React.KeyboardEvent<HTMLUListElement>,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setRoleOpen(false);
      roleTriggerRef.current?.focus();
      return;
    }
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Home" ||
      event.key === "End"
    ) {
      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? ROLES.length - 1
            : event.key === "ArrowDown"
              ? (activeRoleIndex + 1) % ROLES.length
              : (activeRoleIndex - 1 + ROLES.length) % ROLES.length;
      setActiveRoleIndex(next);
      roleOptionRefs.current[next]?.focus();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectRole(ROLES[activeRoleIndex]);
    }
  };

  const saveLinkedIn = (event: React.FormEvent) => {
    event.preventDefault();
    const value = linkedinInput.trim();
    if (!value) {
      setLinkedin("");
      setLinkedinError("");
      setSavedNote("LinkedIn field cleared.");
      track("career_linkedin", { action: "clear" });
      return;
    }
    if (!isLinkedIn(value)) {
      setLinkedinError(
        "Enter a profile URL like linkedin.com/in/your-name. Nothing was saved.",
      );
      setSavedNote("");
      track("career_linkedin", { action: "invalid" });
      return;
    }
    const normalised = value.startsWith("http") ? value : `https://${value}`;
    setLinkedin(normalised);
    setLinkedinInput(normalised);
    setLinkedinError("");
    setSavedNote("LinkedIn URL saved in this browser.");
    playCue("tick");
    track("career_linkedin", { action: "save" });
  };

  const handleCopy = async () => {
    const summary = [
      `${displayName} — ${role}`,
      hasPractice ? "Practice profile" : "Example profile",
      `Portfolio strength: ${strength}/100`,
      practice.interview
        ? `Last interview rubric: ${practice.interview.overall}/100 (${practice.interview.band})`
        : "Interview rubric: not attempted",
      `Documented project decisions: ${projectCount}`,
      `Signal test: ${practice.signal?.verdict ?? "not attempted"}`,
      `LinkedIn: ${linkedin || "not added"}`,
      "",
      "Built with PMForge — practice the decisions, not the pitch.",
    ].join("\n");
    const ok = await copyText(summary);
    setCopied(ok);
    setCopyFailed(!ok);
    if (ok) {
      playCue("chime");
      track("profile_copy");
    }
  };

  const handleTilt = (event: React.PointerEvent<HTMLElement>) => {
    const card = cardRef.current;
    if (!card || event.pointerType === "touch") return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty("--tilt-x", `${(-y * 2.4).toFixed(2)}deg`);
    card.style.setProperty("--tilt-y", `${(x * 3).toFixed(2)}deg`);
  };

  const resetTilt = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <section
      id="career"
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="career-title"
    >
      <div className={styles.plantShadows} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.copy}>
            <p className="eyebrow">Career tools</p>
            <h2 id="career-title" className={`${styles.title} display`}>
              Showcase your potential.
            </h2>
            <p className={styles.body}>
              Build a portfolio, track your progress, and get matched with
              opportunities.
            </p>
            <Link href="/career" className={`${styles.view} btn btnOutline`}>
              View Career Tools
              <ArrowRight size={16} strokeWidth={1.7} aria-hidden="true" />
            </Link>

            <div className={styles.stateNote}>
              <span
                className={hasPractice ? styles.stateOn : ""}
                aria-hidden="true"
              />
              {hasPractice
                ? "This card is reading the practice saved in this browser."
                : "No practice saved yet. The card below is labelled as an example."}
            </div>
            <p className={styles.privacy}>
              <LockKeyhole size={12} strokeWidth={1.6} aria-hidden="true" />
              Local only. Your role, link, and practice stay in this browser.
            </p>
          </div>

          <article
            ref={cardRef}
            className={styles.profile}
            onPointerMove={handleTilt}
            onPointerLeave={resetTilt}
            aria-label={
              hasPractice ? "Your practice profile" : "Example profile card"
            }
          >
            <div className={styles.profileHead}>
              <div className={styles.avatar}>
                <svg
                  viewBox="0 0 96 96"
                  role="img"
                  aria-label="Illustrated profile avatar"
                >
                  <rect width="96" height="96" rx="4" fill="#dfd3bd" />
                  <circle
                    cx="48"
                    cy="57"
                    r="35"
                    fill="#e8dcc6"
                    opacity="0.55"
                  />
                  <path d="M21 92c2-18 13-27 27-27s25 9 27 27" fill="#58654e" />
                  <path d="M34 64c2 10 8 16 14 16s12-6 14-16" fill="#d9b99b" />
                  <ellipse cx="48" cy="43" rx="18" ry="21" fill="#e5c4a4" />
                  <path
                    d="M30 42c-1-14 7-23 19-23 13 0 20 10 18 24-4-5-7-9-9-14-5 6-16 9-28 9v4Z"
                    fill="#4b392c"
                  />
                  <path
                    d="M40 43h2M56 43h2"
                    stroke="#4b392c"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M43 53c3 2 7 2 10 0"
                    stroke="#9c6f55"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M37 36c2-1 4-1 5 0M55 36c2-1 4-1 5 0"
                    stroke="#4b392c"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M32 92h32"
                    stroke="#e9dfce"
                    strokeWidth="1"
                    opacity="0.4"
                  />
                </svg>
              </div>
              <div className={styles.identity}>
                <div className={styles.nameRow}>
                  <h3>{displayName}</h3>
                  <span className={styles.exampleTag}>
                    {hasPractice ? "Your profile" : "Example profile"}
                  </span>
                </div>
                <div className={styles.roleRow}>
                  <div className={styles.rolePicker} ref={rolePickerRef}>
                    <button
                      ref={roleTriggerRef}
                      type="button"
                      className={styles.roleSelect}
                      role="combobox"
                      aria-label="Target role"
                      aria-haspopup="listbox"
                      aria-expanded={roleOpen}
                      aria-controls="career-role-listbox"
                      aria-activedescendant={
                        roleOpen ? `career-role-${activeRoleIndex}` : undefined
                      }
                      onClick={() => setRoleOpen((open) => !open)}
                      onKeyDown={handleRoleKeyDown}
                    >
                      <span>{roleLabel(role)}</span>
                      <ChevronDown
                        size={16}
                        className={roleOpen ? styles.roleChevronOpen : ""}
                        aria-hidden="true"
                      />
                    </button>
                    {roleOpen ? (
                      <ul
                        id="career-role-listbox"
                        className={`${styles.roleListbox} ${roleAbove ? styles.roleListboxAbove : ""}`}
                        role="listbox"
                        aria-label="Target role"
                        onKeyDown={handleRoleListKeyDown}
                      >
                        {ROLES.map((item, index) => (
                          <li key={item} role="presentation">
                            <button
                              ref={(node) => {
                                roleOptionRefs.current[index] = node;
                              }}
                              id={`career-role-${index}`}
                              type="button"
                              role="option"
                              aria-selected={role === item}
                              tabIndex={activeRoleIndex === index ? 0 : -1}
                              className={styles.roleOption}
                              onFocus={() => setActiveRoleIndex(index)}
                              onClick={() => selectRole(item)}
                            >
                              <span>{roleLabel(item)}</span>
                              {role === item ? (
                                <Check size={15} aria-hidden="true" />
                              ) : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <span className={styles.weekTag}>Week 6</span>
                </div>
              </div>
            </div>

            <div className={styles.strength}>
              <div className={styles.strengthHead}>
                <span>Portfolio strength</span>
                <strong>{strength}%</strong>
              </div>
              <div
                className={styles.strengthTrack}
                role="progressbar"
                aria-label={`Portfolio strength: ${strength} out of 100`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={strength}
              >
                <span style={{ width: `${strength}%` }} />
              </div>
              <small>
                {hasPractice
                  ? "Computed from your signal test, decisions, rubric, and profile."
                  : "Example value. Complete a practice to replace it."}
              </small>
            </div>

            <div className={styles.stats}>
              {stats.map((stat) => (
                <div key={stat.label}>
                  <strong data-career-count={stat.value} aria-hidden="true">
                    {stat.value}
                  </strong>
                  <span className="srOnly">{stat.value}</span>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.skills}>
              <span className={styles.skillsLabel}>Skills practised</span>
              <div className={styles.chips}>
                {skillRows.map((skill) => (
                  <span
                    key={skill.label}
                    title={`Illustrative target: ${skill.value}/10`}
                  >
                    {skill.label} · {skill.value}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.profileActions}>
              <button
                type="button"
                className={`${styles.copyButton} btn btnPrimary btnSm`}
                onClick={handleCopy}
              >
                <ClipboardCopy size={13} strokeWidth={1.7} aria-hidden="true" />
                {copied
                  ? "Copied"
                  : copyFailed
                    ? "Copy failed"
                    : "Copy profile summary"}
              </button>
              <Link
                href="/signup?intent=portfolio&src=career-board&next=%2Fapp%2Fportfolio"
                className={styles.profileLink}
              >
                Open my portfolio
                <ArrowRight size={12} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </div>
            <span className="srOnly" aria-live="polite">
              {copied ? "Profile summary copied to clipboard." : ""}
              {copyFailed
                ? "Copying is blocked here. Select the card text and copy it manually."
                : ""}
            </span>
          </article>
        </div>

        <div className={styles.side}>
          <div className={styles.shelf}>
            <div className={styles.shelfHead}>
              <h3>Artifact shelf</h3>
              <span className={styles.exampleLabel}>Example</span>
            </div>
            <div
              className={styles.tiles}
              role="group"
              aria-label="Example project artifacts"
            >
              {ARTIFACT_TILES.map((artifact, index) =>
                artifact.href ? (
                  <a
                    key={artifact.title}
                    href={artifact.href}
                    className={styles.tile}
                    aria-label={`Example artifact: ${artifact.title}, ${artifact.detail}`}
                  >
                    <span className={styles.exampleMark}>Example</span>
                    <TileArt index={index} />
                    <small>{artifact.title}</small>
                    <strong>{artifact.detail}</strong>
                    <span className={styles.tileOpen}>Open example →</span>
                  </a>
                ) : (
                  <div
                    key={artifact.title}
                    className={styles.tile}
                    role="img"
                    aria-label={`Example artifact: ${artifact.title}, ${artifact.detail}`}
                  >
                    <span className={styles.exampleMark}>Example</span>
                    <TileArt index={index} />
                    <small>{artifact.title}</small>
                    <strong>{artifact.detail}</strong>
                  </div>
                ),
              )}
            </div>
            <p className={styles.tileLabel}>
              <Sparkles size={11} strokeWidth={1.6} aria-hidden="true" />
              Example artifacts. Your practice work stays private.
            </p>
          </div>

          <div className={styles.benchmark}>
            <div className={styles.benchmarkHead}>
              <div>
                <h3>Career benchmark</h3>
                <span className={styles.exampleLabel}>
                  Illustrative targets, not market data
                </span>
              </div>
              <span className={styles.target}>
                Target {practice.interview?.overall ?? roleData.target}/100
              </span>
            </div>
            <div
              key={role}
              className={`${styles.chart} ${animateRoleBars ? styles.chartAnimate : ""}`}
              role="img"
              aria-label="Illustrative role skill targets out of ten"
            >
              {skillRows.map((item, index) => (
                <div className={styles.barRow} key={item.label}>
                  <span className={styles.barLabel}>{item.label}</span>
                  <div className={styles.barTrack} aria-hidden="true">
                    <span
                      style={
                        {
                          width: `${item.value * 10}%`,
                          "--bar-index": index,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                  <span className={styles.barValue}>{item.value}</span>
                </div>
              ))}
            </div>
            <p className={styles.benchmarkNote}>
              {roleData.benchmark} · {roleData.cadence} practice sessions weekly
              ·{` ${roleData.interviews} interview reps. ${roleData.focus}`}
              {practice.interview
                ? ` Your latest rubric score of ${practice.interview.overall}/100 replaces the role target.`
                : ""}
            </p>
          </div>

          <div className={styles.detailsHead}>
            <h3>Card details</h3>
            <span>Open a row to edit</span>
          </div>
          <div className={styles.evidenceRows}>
            <details className={styles.evidenceDetail} open>
              <summary className={styles.evidenceRow}>
                <span className={styles.rowIcon}>
                  <SocialIcon name="linkedin" size={15} />
                </span>
                <span className={styles.rowBody}>
                  <strong>LinkedIn Profile</strong>
                  <small>{linkedin || "Not added yet"}</small>
                </span>
              </summary>
              <form
                className={styles.editor}
                onSubmit={saveLinkedIn}
                noValidate
              >
                <span className={styles.editorTitle}>Make the card yours</span>
                <label htmlFor="linkedin-url" className={styles.editorLabel}>
                  LinkedIn profile
                </label>
                <div className={styles.inputRow}>
                  <input
                    ref={linkedinRef}
                    id="linkedin-url"
                    type="url"
                    value={linkedinInput}
                    onChange={(event) => {
                      setLinkedinInput(event.target.value);
                      if (linkedinError) setLinkedinError("");
                    }}
                    placeholder="linkedin.com/in/your-name"
                    aria-invalid={linkedinError ? true : undefined}
                    aria-describedby="linkedin-help"
                    autoComplete="url"
                  />
                  <button type="submit" className={styles.saveButton}>
                    {linkedin ? "Update" : "Save"}
                  </button>
                </div>
                <p
                  id="linkedin-help"
                  className={`${styles.editHelp} ${linkedinError ? styles.editError : ""}`}
                  role={linkedinError ? "alert" : "status"}
                >
                  {linkedinError ||
                    savedNote ||
                    "Validated locally. No network request is made."}
                </p>
              </form>
            </details>

            <details className={styles.evidenceDetail}>
              <summary className={styles.evidenceRow}>
                <span className={styles.rowIcon}>
                  <GraduationCap
                    size={15}
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />
                </span>
                <span className={styles.rowBody}>
                  <strong>Academic Background</strong>
                  <small>Example profile · MS, HCI</small>
                </span>
                <span className={styles.rowBadge}>Example</span>
              </summary>
              <p className={styles.detailCopy}>
                Academic details are illustrative and can be replaced with your
                own.
              </p>
            </details>

            <details className={styles.evidenceDetail}>
              <summary className={styles.evidenceRow}>
                <span className={styles.rowIcon}>
                  <BriefcaseBusiness
                    size={15}
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />
                </span>
                <span className={styles.rowBody}>
                  <strong>Projects</strong>
                  <small>
                    {projectCount} documented decision
                    {projectCount === 1 ? "" : "s"}
                    {hasPractice ? "" : " · example"}
                  </small>
                </span>
              </summary>
              <div className={styles.detailCopy}>
                <Link href="/projects" className={styles.rowAction}>
                  View projects <ArrowRight size={12} aria-hidden="true" />
                </Link>
              </div>
            </details>
          </div>

          <p className={styles.matchNote}>
            <BadgeCheck size={12} strokeWidth={1.7} aria-hidden="true" />
            Matched to your target role, not a leaderboard.
          </p>
        </div>
      </div>
      <span className="srOnly" aria-live="polite">
        {savedNote || (linkedin ? "LinkedIn profile saved." : "")}
      </span>
    </section>
  );
}
