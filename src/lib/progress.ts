import { modules } from "@/lib/content";

export const LEARNING_KEY = "pmforge.learning.v1";

export type LearningState = {
  completed: string[];
  drills: Record<string, number[]>;
};

export type ProgressSnapshot = {
  signal: { verdict: string; strength: string; impact: string } | null;
  interview: { overall: number; band: string; missing: string } | null;
  projects: {
    decisions: Record<string, string>;
    checks: Record<string, string[]>;
  };
  blueprint: boolean;
  career: { role: string; linkedin: string } | null;
  learning: LearningState;
};

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function readLearning(): LearningState {
  const stored = read<Partial<LearningState>>(LEARNING_KEY);
  return {
    completed: Array.isArray(stored?.completed)
      ? stored.completed.filter((slug) =>
          modules.some((module) => module.slug === slug),
        )
      : [],
    drills:
      stored && typeof stored.drills === "object" && stored.drills !== null
        ? stored.drills
        : {},
  };
}

export function writeLearning(next: LearningState) {
  try {
    window.localStorage.setItem(LEARNING_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("pmforge:progress"));
  } catch {
    // The lesson still works when storage is unavailable.
  }
}

export function readProgress(): ProgressSnapshot {
  const signal = read<{ verdict?: string; strength?: string; impact?: string }>(
    "pmforge.signal.v1",
  );
  const interview = read<{ overall?: number; band?: string; missing?: string }>(
    "pmforge.interview.v1",
  );
  const projects = read<{
    decisions?: Record<string, string>;
    checks?: Record<string, string[]>;
  }>("pmforge.projects.v1");
  const blueprint = read<{ fields?: Record<string, string> }>(
    "pmforge.blueprint.v1",
  );
  const career = read<{ role?: string; linkedin?: string }>(
    "pmforge.career.v1",
  );

  return {
    signal:
      signal?.verdict && signal?.strength
        ? {
            verdict: signal.verdict,
            strength: signal.strength,
            impact: signal.impact ?? "—",
          }
        : null,
    interview:
      typeof interview?.overall === "number"
        ? {
            overall: interview.overall,
            band: interview.band ?? "Reviewed",
            missing: interview.missing ?? "",
          }
        : null,
    projects: {
      decisions: projects?.decisions ?? {},
      checks: projects?.checks ?? {},
    },
    blueprint: Boolean(blueprint?.fields?.decision),
    career: career ? { role: career.role ?? "", linkedin: career.linkedin ?? "" } : null,
    learning: readLearning(),
  };
}

export function completedCount(snapshot: ProgressSnapshot) {
  return snapshot.learning.completed.length;
}

export function nextAction(snapshot: ProgressSnapshot): {
  label: string;
  body: string;
  href: string;
  cta: string;
} {
  if (!snapshot.signal) {
    return {
      label: "Start with signal",
      body: "Ten conflicting inputs, one hour, and no labels. Find the evidence that actually moves the decision.",
      href: "/#signal",
      cta: "Take the signal test",
    };
  }
  if (snapshot.learning.completed.length < 3) {
    const next = modules.find(
      (module) => !snapshot.learning.completed.includes(module.slug),
    );
    return {
      label: "Build the frame",
      body: next
        ? `${next.number} · ${next.title}. ${next.short}`
        : "Continue the curriculum and mark the drills you have finished.",
      href: next ? `/learn/${next.slug}` : "/learn",
      cta: next ? "Open the next module" : "Browse the curriculum",
    };
  }
  if (Object.values(snapshot.projects.decisions).filter(Boolean).length === 0) {
    return {
      label: "Make a call",
      body: "Work a project scenario, document the trade-off, then stress-test it when new evidence arrives.",
      href: "/projects",
      cta: "Open the workbench",
    };
  }
  if (!snapshot.interview) {
    return {
      label: "Say it out loud",
      body: "Two minutes, optional browser speech dictation, and a deterministic rubric on the answer you gave.",
      href: "/practice",
      cta: "Run an interview",
    };
  }
  if (!snapshot.blueprint) {
    return {
      label: "Make it defensible",
      body: "Turn your evidence and project call into a one-page blueprint with a named next check.",
      href: "/#blueprint",
      cta: "Build the blueprint",
    };
  }
  return {
    label: "Keep the streak",
    body: "Your workspace has the full loop. Revisit a project with fresh evidence or tighten the interview answer.",
    href: "/learn/job-ready",
    cta: "Turn practice into a portfolio",
  };
}
