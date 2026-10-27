"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, LockKeyhole, ShieldCheck } from "lucide-react";
import {
  GOAL_LABELS,
  USER_KEY,
  loginSchema,
  readUser,
  saveUser,
  signupSchema,
} from "@/lib/user";
import { track } from "@/lib/analytics";
import styles from "@/styles/pages.module.css";

type Mode = "signup" | "login";
type FieldKey = "name" | "email" | "goal" | "consent" | "form";

const INTENT_COPY: Record<string, string> = {
  enter: "You clicked Enter. Create a local profile and the workspace opens immediately.",
  learn: "Start with the fundamentals, then practise a real decision.",
  "start-learning": "Your first module is ready. Everything you save stays in this browser.",
};

export function AuthForm({ mode, intent }: { mode: Mode; intent?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<number | null>(null);
  const [existingName, setExistingName] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("aspiring-pm");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = readUser();
    if (user) {
      setExistingName(user.name);
      setName(user.name);
      setEmail(user.email);
      setGoal(user.goal in GOAL_LABELS ? user.goal : "aspiring-pm");
    }
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const openWorkspace = () => {
    setSubmitting(true);
    setStatus("Opening your workspace…");
    timerRef.current = window.setTimeout(() => {
      router.push("/dashboard");
    }, 320);
  };

  const focusFirstError = (fields: FieldKey[]) => {
    const first = fields.find((field) => field !== "form" && field !== "goal" && field !== "consent");
    if (first) {
      const node = formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`);
      node?.focus();
      return;
    }
    if (fields.includes("consent")) {
      formRef.current?.querySelector<HTMLElement>('[name="consent"]')?.focus();
    }
  };

  const submitSignup = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = signupSchema.safeParse({ name, email, goal, consent });
    if (!parsed.success) {
      const next: Partial<Record<FieldKey, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = (issue.path[0] as FieldKey) ?? "form";
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setStatus("Check the highlighted fields. Nothing has been saved yet.");
      focusFirstError(Object.keys(next) as FieldKey[]);
      track("signup_submitted", { result: "validation_error" });
      return;
    }

    setErrors({});
    saveUser({
      name: parsed.data.name,
      email: parsed.data.email,
      goal: parsed.data.goal,
      createdAt: new Date().toISOString(),
    });
    track("signup_submitted", { result: "success", intent: intent ?? "direct" });
    openWorkspace();
  };

  const submitLogin = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ email });
    if (!parsed.success) {
      setErrors({ email: parsed.error.issues[0]?.message });
      setStatus("Enter a valid email address.");
      focusFirstError(["email"]);
      track("login_submitted", { result: "validation_error" });
      return;
    }

    const user = readUser();
    if (!user) {
      setErrors({
        form: "There is no profile in this browser yet. Create one, or preview with the demo profile.",
      });
      setStatus("No local profile found.");
      track("login_submitted", { result: "no_profile" });
      return;
    }

    if (user.email !== parsed.data.email) {
      setErrors({
        email: `That email does not match the profile saved here (${user.email}).`,
      });
      setStatus("That email does not match the local profile.");
      focusFirstError(["email"]);
      track("login_submitted", { result: "email_mismatch" });
      return;
    }

    saveUser({
      name: user.name,
      email: user.email,
      goal: user.goal,
      createdAt: user.createdAt,
    });
    setErrors({});
    track("login_submitted", { result: "success" });
    openWorkspace();
  };

  const useDemo = () => {
    saveUser({
      name: "Alex Morgan",
      email: "demo@pmforge.local",
      goal: "aspiring-pm",
      createdAt: new Date().toISOString(),
    });
    track(mode === "signup" ? "signup_submitted" : "login_submitted", {
      result: "demo",
    });
    openWorkspace();
  };

  const resetProfile = () => {
    window.localStorage.removeItem(USER_KEY);
    setExistingName(null);
    setName("");
    setEmail("");
    setConsent(false);
    setErrors({});
    setStatus("Local profile removed. You can create a new one.");
    formRef.current?.querySelector<HTMLInputElement>('[name="name"]')?.focus();
  };

  const heading = mode === "signup" ? "Create your workspace" : "Open your workspace";
  const intro =
    mode === "signup"
      ? "One local profile. No password, no server, no mystery about where your practice goes."
      : "Use the email attached to the profile saved in this browser.";

  return (
    <div className={styles.authLayout}>
      <div className={styles.formCard}>
        {existingName && mode === "signup" ? (
          <div className={styles.note} role="status" style={{ marginBottom: "1.2rem" }}>
            You already have a local profile for <strong>{existingName}</strong>.{" "}
            <Link href="/dashboard" className={styles.inlineLink}>
              Continue to your dashboard
            </Link>{" "}
            or{" "}
            <button type="button" className={styles.inlineLink} onClick={resetProfile}>
              start a different profile
            </button>
            .
          </div>
        ) : null}

        {intent && INTENT_COPY[intent] ? (
          <p className={styles.fieldHint} style={{ marginBottom: "1rem" }}>
            {INTENT_COPY[intent]}
          </p>
        ) : null}

        <h2
          className={styles.sectionTitle}
          style={{ fontSize: "clamp(1.7rem, 2.6vw, 2.3rem)", marginBottom: "0.4rem" }}
        >
          {heading}
        </h2>
        <p className={styles.fieldHint} style={{ marginBottom: "1.4rem" }}>
          {intro}
        </p>

        <form
          ref={formRef}
          className={styles.form}
          onSubmit={mode === "signup" ? submitSignup : submitLogin}
          noValidate
        >
          {errors.form ? (
            <p className={styles.fieldError} role="alert">
              {errors.form}
            </p>
          ) : null}

          {mode === "signup" ? (
            <div className={styles.field}>
              <label htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                name="name"
                className={styles.input}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                autoComplete="name"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? "auth-name-error" : undefined}
                placeholder="Your name"
                required
              />
              {errors.name ? (
                <p className={styles.fieldError} id="auth-name-error" role="alert">
                  {errors.name}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className={styles.field}>
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "auth-email-error" : undefined}
              placeholder="you@company.com"
              required
            />
            {errors.email ? (
              <p className={styles.fieldError} id="auth-email-error" role="alert">
                {errors.email}
              </p>
            ) : null}
          </div>

          {mode === "signup" ? (
            <div className={styles.field}>
              <label htmlFor="auth-goal">Where are you now?</label>
              <select
                id="auth-goal"
                name="goal"
                className={styles.select}
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
              >
                <option value="aspiring-pm">Aspiring product manager</option>
                <option value="product-manager">Practising product manager</option>
                <option value="career-switcher">Career switcher</option>
                <option value="founder">Founder or operator</option>
              </select>
              <p className={styles.fieldHint}>
                This only changes the language on your dashboard.
              </p>
            </div>
          ) : null}

          {mode === "signup" ? (
            <div className={styles.field}>
              <label className={styles.check} htmlFor="auth-consent">
                <input
                  id="auth-consent"
                  name="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => {
                    setConsent(event.target.checked);
                    if (errors.consent) {
                      setErrors((prev) => ({ ...prev, consent: undefined }));
                    }
                  }}
                  aria-invalid={errors.consent ? true : undefined}
                  aria-describedby={errors.consent ? "auth-consent-error" : undefined}
                />
                <span>
                  I understand that this preview stores my profile and practice in
                  this browser only. Read the{" "}
                  <Link href="/privacy" className={styles.inlineLink}>
                    privacy note
                  </Link>
                  .
                </span>
              </label>
              {errors.consent ? (
                <p className={styles.fieldError} id="auth-consent-error" role="alert">
                  {errors.consent}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className={styles.formActions}>
            <button type="submit" className="btn btnPrimary" disabled={submitting}>
              {submitting
                ? "Opening workspace…"
                : mode === "signup"
                  ? "Create local profile"
                  : "Open workspace"}
              <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <button type="button" className="btn btnOutline" onClick={useDemo} disabled={submitting}>
              Use demo profile
            </button>
          </div>

          <p className={styles.formNote}>
            <LockKeyhole size={12} strokeWidth={1.6} aria-hidden="true" /> No
            password and no network request. A hosted account system is not
            connected in this build.
          </p>

          <p className={styles.formNote} aria-live="polite" role="status">
            {status}
          </p>
        </form>

        <p className={styles.formNote}>
          {mode === "signup" ? (
            <>
              Already have a local profile?{" "}
              <Link href="/login" className={styles.inlineLink}>
                Log in
              </Link>
              .
            </>
          ) : (
            <>
              No profile yet?{" "}
              <Link href="/signup" className={styles.inlineLink}>
                Create one
              </Link>
              .
            </>
          )}
        </p>
      </div>

      <div className={styles.authAside}>
        <p className={styles.quote}>
          The decision is the portfolio.
        </p>
        <ul className={styles.asideList}>
          <li>
            <Check size={15} strokeWidth={2} aria-hidden="true" />
            A real signal test, project workbench, interview lab, and blueprint.
          </li>
          <li>
            <Check size={15} strokeWidth={2} aria-hidden="true" />
            Progress is saved as you work, so you can leave and return.
          </li>
          <li>
            <Check size={15} strokeWidth={2} aria-hidden="true" />
            No card, no onboarding maze, no sales call.
          </li>
        </ul>
        <div className={styles.note}>
          <ShieldCheck size={14} strokeWidth={1.6} aria-hidden="true" /> This is
          a local-first preview. Clearing site data removes the profile and all
          practice.{" "}
          <Link href="/help" className={styles.inlineLink}>
            How local data works
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
