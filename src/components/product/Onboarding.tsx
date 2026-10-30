"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Compass, FileText, Check } from "lucide-react";
import {
  db,
  importLandingCarry,
  discardLandingCarry,
  getLocalProfile,
  readLandingCarry,
} from "@/lib/product/db";
import { safeNext } from "@/lib/product/routes";
import type { Profile } from "@/lib/product/types";
import styles from "./Product.module.css";

export default function Onboarding() {
  const router = useRouter();
  const params = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [step, setStep] = useState(0);
  const [carry, setCarry] = useState(false);
  const [decision, setDecision] = useState<"keep" | "discard" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    void getLocalProfile()
      .then((p) => {
        if (!p) {
          router.replace(
            `/signup?next=${encodeURIComponent(safeNext(params.get("next")))}`,
          );
          return;
        }
        setProfile(p);
        const data = readLandingCarry();
        setCarry(
          Boolean(
            data.interview ||
            data.blueprint ||
            Object.values(data.project?.decisions || {}).some(Boolean),
          ),
        );
      })
      .catch(() =>
        setError(
          "Device storage is unavailable. Enable site storage and reload.",
        ),
      );
  }, [router, params]);
  const finish = async () => {
    if (!profile) return;
    if (carry && !decision) {
      setStep(2);
      setError(
        "Choose whether to keep or discard the landing-page preview work.",
      );
      return;
    }
    setBusy(true);
    try {
      if (decision === "keep") await importLandingCarry(profile);
      if (decision === "discard") discardLandingCarry();
      await db.profiles.put({
        ...profile,
        onboardingComplete: true,
        updatedAt: new Date().toISOString(),
      });
      window.dispatchEvent(new Event("pmforge:identity"));
      router.push(safeNext(params.get("next")));
    } catch {
      setError(
        "Could not finish setup. Your existing work is safe. Retry before leaving.",
      );
      setBusy(false);
    }
  };
  return (
    <div className={styles.product}>
      <main className={styles.onboarding} id="main">
        <Link href="/" className={styles.brand}>
          <Compass size={25} />
          PMForge
        </Link>
        <div className={styles.spread}>
          <span className={styles.eyebrow}>Make yourself at home</span>
          <span className={`${styles.small} ${styles.muted}`}>
            {step + 1} / 3
          </span>
        </div>
        <div className={styles.steps}>
          {[0, 1, 2].map((i) => (
            <i key={i} data-on={i <= step} />
          ))}
        </div>
        <h1>
          {
            [
              "What are you working toward?",
              "Find your starting point.",
              "Give your practice a little space.",
            ][step]
          }
        </h1>
        <p className={styles.prose}>
          Three small choices to make the recommendations useful. Every scenario
          stays open.
        </p>
        {profile ? (
          <>
            <section className={styles.panel}>
              {step === 0 ? (
                <div className={styles.stack}>
                  <label className={styles.field}>
                    What should we call you?{" "}
                    <span className={styles.muted}>(optional)</span>
                    <input
                      maxLength={60}
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      placeholder="Your first name"
                      autoComplete="given-name"
                    />
                  </label>
                  <div className={styles.choiceGrid}>
                    {[
                      "Aspiring PM",
                      "Product Manager",
                      "Career switcher",
                      "Senior PM / Lead",
                    ].map((role) => (
                      <button
                        key={role}
                        className={styles.choice}
                        aria-pressed={profile.role === role}
                        onClick={() => setProfile({ ...profile, role })}
                      >
                        {role}
                        {profile.role === role && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              ) : step === 1 ? (
                <div className={styles.stack}>
                  {[
                    {
                      id: "easy",
                      label: "Build my foundation",
                      text: "Focused decisions. A clear objective. Time to get comfortable.",
                    },
                    {
                      id: "medium",
                      label: "Stretch my judgment",
                      text: "Competing signals, trade-offs, and an interviewer who pushes back.",
                    },
                    {
                      id: "hard",
                      label: "Put me in the difficult room",
                      text: "Ambiguity, cascading constraints, and decisions with a real cost.",
                    },
                  ].map((level) => (
                    <button
                      key={level.id}
                      className={styles.choice}
                      aria-pressed={profile.level === level.id}
                      onClick={() =>
                        setProfile({
                          ...profile,
                          level: level.id as Profile["level"],
                        })
                      }
                    >
                      {level.label}
                      <small>{level.text}</small>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.stack}>
                  {[
                    "Exploring",
                    "Interview in 2 weeks",
                    "Interview in 1 month",
                    "Building a weekly practice",
                  ].map((timeline) => (
                    <button
                      className={styles.choice}
                      key={timeline}
                      aria-pressed={profile.timeline === timeline}
                      onClick={() => setProfile({ ...profile, timeline })}
                    >
                      {timeline}
                    </button>
                  ))}
                  {carry && (
                    <div className={styles.notice}>
                      <FileText size={20} />
                      <h3 style={{ margin: "12px 0" }}>
                        Keep the work you started on the landing page?
                      </h3>
                      <p>
                        Import the saved preview artifacts as clearly labelled
                        Demo records. They won’t affect coverage or scores.
                        Nothing is uploaded for guests.
                      </p>
                      <div className={styles.row} style={{ marginTop: 15 }}>
                        <button
                          aria-pressed={decision === "keep"}
                          className={
                            decision === "keep"
                              ? styles.primary
                              : styles.secondary
                          }
                          onClick={() => setDecision("keep")}
                        >
                          Keep it
                        </button>
                        <button
                          aria-pressed={decision === "discard"}
                          className={
                            decision === "discard"
                              ? styles.primary
                              : styles.secondary
                          }
                          onClick={() => setDecision("discard")}
                        >
                          Discard preview work
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
            <div className={styles.spread}>
              <button
                className={styles.textButton}
                onClick={() => (step ? setStep(step - 1) : void finish())}
                disabled={busy}
              >
                {step ? (
                  <>
                    <ArrowLeft size={14} />
                    Back
                  </>
                ) : (
                  "Skip setup"
                )}
              </button>
              <button
                className={styles.primary}
                disabled={busy}
                onClick={() => (step < 2 ? setStep(step + 1) : void finish())}
              >
                {busy
                  ? "Opening…"
                  : step === 2
                    ? "Enter my workspace"
                    : "Continue"}
                <ArrowRight size={15} />
              </button>
            </div>
            <p className={styles.finePrint} style={{ marginTop: 26 }}>
              You can change these choices in Settings. Your profile stays on
              this device unless you sign in and sync.
            </p>
          </>
        ) : (
          <p className={styles.notice}>
            {error || "Opening your device profile…"}
          </p>
        )}
      </main>
    </div>
  );
}
