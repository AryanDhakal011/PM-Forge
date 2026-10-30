"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ClipboardCopy,
  Download,
  Edit3,
  FilePenLine,
  LockKeyhole,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useSettings } from "@/components/providers/SettingsProvider";
import {
  blueprintExample,
  evidenceCards,
  onboardingPressureOutcomes,
  pressureChoices,
  pressureOutcomes,
  projectScenarios,
} from "@/lib/content";
import { copyText } from "@/lib/clipboard";
import { track } from "@/lib/analytics";
import { scrollState } from "@/lib/scrollState";
import {
  ensureScrollTrigger,
  resolveCalm,
  setCalmVar,
  bindStoryTargets,
} from "@/lib/scrollStory";
import styles from "./DecisionBlueprint.module.css";

const BLUEPRINT_KEY = "pmforge.blueprint.v1";
const MIN = 8;

type FieldId =
  | "problem"
  | "evidence"
  | "assumptions"
  | "options"
  | "tradeoffs"
  | "decision"
  | "metric"
  | "nextCheck";

type Fields = Record<FieldId, string>;

const EMPTY: Fields = {
  problem: "",
  evidence: "",
  assumptions: "",
  options: "",
  tradeoffs: "",
  decision: "",
  metric: "",
  nextCheck: "",
};

const FIELD_DEFS: {
  id: FieldId;
  label: string;
  placeholder: string;
  hint?: string;
}[] = [
  {
    id: "problem",
    label: "Problem",
    placeholder: "Who is stuck, where, and in what time window?",
  },
  {
    id: "evidence",
    label: "Evidence",
    placeholder: "What is measured, and what is still an assumption?",
  },
  {
    id: "assumptions",
    label: "Assumptions",
    placeholder: "Which belief would make this decision wrong?",
  },
  {
    id: "options",
    label: "Options considered",
    placeholder: "Name at least two alternatives you rejected.",
  },
  {
    id: "tradeoffs",
    label: "Trade-offs",
    placeholder: "What does this choice cost, and why is that acceptable?",
  },
  {
    id: "decision",
    label: "Decision",
    placeholder: "Make the call in one clear sentence.",
  },
  {
    id: "metric",
    label: "Success metric",
    placeholder: "Primary metric, baseline, target, and guardrail.",
  },
  {
    id: "nextCheck",
    label: "Next check",
    placeholder: "When will you review it, and with what evidence?",
  },
];

function buildPrefill(): Fields {
  const fields = { ...EMPTY };
  try {
    const signalRaw = window.localStorage.getItem("pmforge.signal.v1");
    if (signalRaw) {
      const signal = JSON.parse(signalRaw) as {
        id: number;
        strength: string;
        verdict: string;
      };
      const card = evidenceCards.find((item) => item.id === signal.id);
      if (card) {
        fields.evidence = `Signal test selected “${card.content}” (${card.source}; ${signal.strength.toLowerCase()} evidence strength). Additional evidence still needs a baseline check.`;
      }
    }

    const projectsRaw = window.localStorage.getItem("pmforge.projects.v1");
    if (projectsRaw) {
      const projects = JSON.parse(projectsRaw) as {
        decisions?: Record<string, string>;
      };
      const entry = Object.entries(projects.decisions ?? {}).find(([, value]) =>
        Boolean(value),
      );
      if (entry) {
        const scenario = projectScenarios.find((item) => item.id === entry[0]);
        const choice = pressureChoices.find((item) => item.id === entry[1]);
        const outcome =
          entry[0] === "onboarding"
            ? onboardingPressureOutcomes[entry[1]]
            : pressureOutcomes[entry[1]];
        if (scenario && outcome) {
          fields.problem = scenario.brief;
          fields.decision = outcome.title;
          fields.tradeoffs = choice
            ? `Chose “${choice.label}”: ${choice.note} ${outcome.consequence}`
            : outcome.consequence;
          fields.nextCheck = outcome.review;
          fields.metric =
            scenario.id === "checkout"
              ? "Retry success rate and Android checkout conversion against the pre-release baseline; guardrail: payment error rate."
              : "First-project creation within session one, from 32% to 45%; guardrail: week-two retention and support contacts.";
        }
      }
    }
  } catch {
    // Prefill is a convenience; empty fields are valid input state.
  }
  return fields;
}

function formatBlueprint(fields: Fields) {
  const lines = [
    "PMFORGE / DECISION BLUEPRINT",
    "============================",
    "",
    "PROBLEM",
    fields.problem,
    "",
    "EVIDENCE",
    fields.evidence,
    "",
    "ASSUMPTIONS",
    fields.assumptions,
    "",
    "OPTIONS CONSIDERED",
    fields.options,
    "",
    "TRADE-OFFS",
    fields.tradeoffs,
    "",
    "DECISION",
    fields.decision,
    "",
    "SUCCESS METRIC",
    fields.metric,
    "",
    "NEXT CHECK",
    fields.nextCheck,
    "",
    "---",
    "Generated with PMForge. Stored in this browser only.",
  ];
  return lines.join("\n");
}

export function DecisionBlueprint() {
  const { reducedMotion, playCue } = useSettings();
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [savedFields, setSavedFields] = useState<Fields | null>(null);
  const [form, setForm] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldId, string>>>({});
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [note, setNote] = useState("");
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BLUEPRINT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { fields?: Fields };
        if (parsed.fields) {
          setSavedFields(parsed.fields);
          setForm(parsed.fields);
        }
      }
    } catch {
      // Ignore a corrupted record.
    }
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setDrawn(true);
      return;
    }
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setDrawn(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  /**
   * Final beat: the landscape, copy, and model settle as the section arrives.
   * The blueprint's own draw-in still owns the moment of the reveal; this only
   * sets the resting frame.
   */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    bindStoryTargets(
      section,
      "--calm",
      `.${styles.copy},.${styles.model},.${styles.landscape},.${styles.clouds},.${styles.blueprintActions},.${styles.start}`,
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
      end: "center 50%",
      invalidateOnRefresh: true,
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });
    apply(trigger.progress);

    return () => trigger.kill();
  }, [reducedMotion]);

  useEffect(() => {
    const firstInvalid = FIELD_DEFS.find((field) => errors[field.id]);
    if (!firstInvalid) return;
    document.getElementById(`bp-${firstInvalid.id}`)?.focus();
  }, [errors]);

  const openForm = () => {
    setForm(savedFields ?? buildPrefill());
    setErrors({});
    setFormOpen(true);
    track("blueprint_open");
  };

  const update = (id: FieldId, value: string) => {
    setForm((current) => ({ ...current, [id]: value }));
    setErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const generate = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Partial<Record<FieldId, string>> = {};
    for (const field of FIELD_DEFS) {
      if (form[field.id].trim().length < MIN) {
        nextErrors[field.id] = `Write at least ${MIN} characters.`;
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      track("blueprint_validation_failed", {
        count: Object.keys(nextErrors).length,
      });
      return;
    }
    setErrors({});
    setSavedFields(form);
    setCopied(false);
    setCopyFailed(false);
    setNote("Blueprint saved in this browser.");
    try {
      window.localStorage.setItem(
        BLUEPRINT_KEY,
        JSON.stringify({ fields: form, at: Date.now() }),
      );
    } catch {
      setNote(
        "Blueprint generated. Browser storage is unavailable, so it will not persist.",
      );
    }
    setFormOpen(false);
    playCue("chime");
    track("blueprint_created");
    window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "center",
      });
    }, 120);
  };

  const copyBlueprint = async () => {
    if (!savedFields) return;
    const ok = await copyText(formatBlueprint(savedFields));
    setCopied(ok);
    setCopyFailed(!ok);
    if (ok) {
      playCue("chime");
      track("blueprint_copy");
    }
  };

  const downloadBlueprint = () => {
    if (!savedFields) return;
    const blob = new Blob([formatBlueprint(savedFields)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pmforge-decision-blueprint.txt";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    track("blueprint_download");
  };

  const clearBlueprint = () => {
    try {
      window.localStorage.removeItem(BLUEPRINT_KEY);
    } catch {
      // No persistence to clear.
    }
    setSavedFields(null);
    setForm(EMPTY);
    setNote("Saved blueprint cleared. The example is back.");
    setCopied(false);
    setCopyFailed(false);
    track("blueprint_cleared");
  };

  const startLearning = (event: React.MouseEvent<HTMLAnchorElement>) => {
    track("start_learning", { source: "blueprint" });
  };

  const rationale = savedFields
    ? [savedFields.evidence, savedFields.tradeoffs, savedFields.metric]
    : blueprintExample.rationale;
  const risks = savedFields
    ? savedFields.assumptions
        .split(/[;\n]+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3)
    : blueprintExample.risks;

  return (
    <section
      id="blueprint"
      ref={sectionRef}
      className={`${styles.section} ${drawn ? styles.drawn : ""}`}
      aria-labelledby="final-title"
    >
      <div className={styles.landscape} aria-hidden="true" />
      <div className={styles.clouds} aria-hidden="true" />
      <div className={styles.table} aria-hidden="true">
        <span className={styles.tableSheen} />
      </div>

      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className="eyebrow">The final blueprint</p>
          <h2 id="final-title" className={`${styles.title} display`}>
            <span>Build your</span>
            <span className={styles.titleAccent}>instincts.</span>
          </h2>
          <p className={styles.body}>
            Stop practicing on your career. Start practicing decisions with
            evidence, a rationale, and a named next check.
          </p>
          <Link
            href="/signup?intent=start-learning"
            className={`${styles.start} btn btnPrimary`}
            onClick={startLearning}
          >
            Start Learning
            <ArrowRight size={17} strokeWidth={1.8} aria-hidden="true" />
          </Link>
          <p className={styles.startNote}>
            Free practice workspace. No credit card. Your blueprint stays in
            your browser unless you create an account.
          </p>
          <p className={styles.handNote}>
            The decision is the portfolio.
            <svg viewBox="0 0 148 16" aria-hidden="true">
              <path d="M2 11c36-6 92-8 144-4" />
            </svg>
          </p>
        </div>

        <div className={styles.model} aria-hidden="true">
          <span className={styles.modelShadow} />
          <span className={styles.modelBase} />
          <span className={styles.modelHouse}>
            <span className={styles.modelRoof} />
            <span className={styles.modelDoor} />
            <span className={styles.modelWindowA} />
            <span className={styles.modelWindowB} />
          </span>
          <span className={styles.modelWing} />
          <span className={`${styles.modelTree} ${styles.treeA}`} />
          <span className={`${styles.modelTree} ${styles.treeB}`} />
          <span className={`${styles.modelTree} ${styles.treeC}`} />
        </div>

        <div
          className={`${styles.blueprint} ${savedFields ? styles.yours : ""}`}
          role="group"
          aria-label={
            savedFields
              ? "Your decision blueprint"
              : "Example decision blueprint"
          }
        >
          <svg
            className={styles.techLines}
            viewBox="0 0 520 420"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M16 30h74v56h-74zM430 24h70v120h-70zM26 330h100v64H26z" />
            <path d="M90 58h40M446 84h30M126 362h70" />
            <circle cx="470" cy="270" r="34" />
            <circle cx="470" cy="270" r="20" />
            <path d="M470 236v68M436 270h68" />
            <path d="M16 196h70M16 210h48M392 360h104M392 374h72" />
          </svg>
          <span className={styles.blueprintBorderA} aria-hidden="true" />
          <span className={styles.blueprintBorderB} aria-hidden="true" />

          <div className={styles.blueprintHead}>
            <span className={styles.blueprintKicker}>Final decision</span>
            <span className={styles.sourceBadge}>
              {savedFields ? "Your blueprint" : "Example"}
            </span>
          </div>

          <h3 className={styles.decision}>
            {savedFields ? savedFields.decision : blueprintExample.decision}
          </h3>

          <div className={styles.blueprintGrid}>
            <div className={styles.blueprintCol}>
              <h4>Rationale</h4>
              <ul className={styles.checkList}>
                {rationale.map((item, index) => (
                  <li key={`${item}-${index}`}>
                    <Check size={11} strokeWidth={2.1} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.blueprintCol}>
              <h4>
                {savedFields ? "Assumptions to watch" : "Remaining risks"}
              </h4>
              <ul className={styles.riskList}>
                {risks.length > 0 ? (
                  risks.map((item, index) => (
                    <li key={`${item}-${index}`}>
                      <TriangleAlert
                        size={11}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li>
                    <TriangleAlert
                      size={11}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                    <span>No assumption written yet.</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className={styles.blueprintFoot}>
            <span className={styles.lamp} aria-hidden="true" />
            <span>
              {savedFields
                ? "Saved locally · next check documented"
                : "Decision justified · evidence strength high"}
            </span>
            {savedFields ? <span className={styles.footMeta}>v1.0</span> : null}
          </div>

          <div className={styles.blueprintActions}>
            {savedFields ? (
              <>
                <button
                  type="button"
                  className={`${styles.action} btn btnOutline btnSm`}
                  onClick={copyBlueprint}
                >
                  <ClipboardCopy
                    size={13}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                  {copied ? "Copied" : copyFailed ? "Copy failed" : "Copy"}
                </button>
                <button
                  type="button"
                  className={`${styles.action} btn btnOutline btnSm`}
                  onClick={downloadBlueprint}
                >
                  <Download size={13} strokeWidth={1.7} aria-hidden="true" />
                  Download
                </button>
                <button
                  type="button"
                  className={styles.textAction}
                  onClick={openForm}
                >
                  <Edit3 size={12} strokeWidth={1.7} aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  className={styles.textAction}
                  onClick={clearBlueprint}
                >
                  <RotateCcw size={12} strokeWidth={1.7} aria-hidden="true" />
                  Clear
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`${styles.action} btn btnOutline btnSm`}
                  onClick={openForm}
                >
                  <FilePenLine size={13} strokeWidth={1.7} aria-hidden="true" />
                  Make this yours
                </button>
                <span className={styles.formMeta}>
                  <LockKeyhole size={11} strokeWidth={1.6} aria-hidden="true" />
                  Eight fields · validated · local only
                </span>
              </>
            )}
          </div>
          <span className="srOnly" aria-live="polite">
            {note}
            {copyFailed
              ? "Copying is blocked here. Select the blueprint text and copy it manually."
              : ""}
          </span>
        </div>
      </div>

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Document the rationale"
        description="Eight fields, eight characters minimum each. The blueprint is stored in this browser only."
        size="lg"
        footer={
          <>
            <button
              type="button"
              className="btn btnOutline btnSm"
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="blueprint-form"
              className="btn btnPrimary btnSm"
            >
              Generate blueprint
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </>
        }
      >
        <form id="blueprint-form" className={styles.form} onSubmit={generate}>
          <div className={styles.formNote}>
            <LockKeyhole size={12} strokeWidth={1.6} aria-hidden="true" />
            Prefilled from your saved signal test and project decision where
            available. Nothing leaves this browser.
          </div>
          <div className={styles.formGrid}>
            {FIELD_DEFS.map((field) => (
              <div
                key={field.id}
                className={`${styles.field} ${
                  field.id === "decision" ? styles.fieldWide : ""
                }`}
              >
                <label htmlFor={`bp-${field.id}`}>
                  {field.label}
                  <span>{form[field.id].trim().length}/8 min</span>
                </label>
                <textarea
                  id={`bp-${field.id}`}
                  value={form[field.id]}
                  onChange={(event) => update(field.id, event.target.value)}
                  placeholder={field.placeholder}
                  rows={field.id === "decision" ? 2 : 3}
                  aria-invalid={errors[field.id] ? true : undefined}
                  aria-describedby={
                    errors[field.id] ? `bp-error-${field.id}` : undefined
                  }
                />
                {errors[field.id] ? (
                  <p
                    className={styles.fieldError}
                    id={`bp-error-${field.id}`}
                    role="alert"
                  >
                    {errors[field.id]}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </form>
      </Dialog>
    </section>
  );
}
