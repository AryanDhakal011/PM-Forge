"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, GitBranch, ShieldCheck, Compass } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { safeNext } from "@/lib/product/routes";
import { InstrumentDrawing } from "./InstrumentDrawing";
import styles from "./Product.module.css";

export function GatePanel({
  next = "/app",
  mode = "signup",
}: {
  next?: string;
  mode?: string;
}) {
  const router = useRouter();
  const [providers, setProviders] = useState({ google: false, github: false });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const target = safeNext(next);
  useEffect(() => {
    let active = true;
    void fetch("/api/auth-config")
      .then((r) => r.json())
      .then((p) => {
        if (active) setProviders(p);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const guest = async () => {
    setBusy("guest");
    setError("");
    try {
      const { startGuest, stageLandingCarry } =
        await import("@/lib/product/db");
      stageLandingCarry();
      const profile = await startGuest();
      window.dispatchEvent(new Event("pmforge:gate-close"));
      router.push(
        profile.onboardingComplete
          ? target
          : `/onboarding?next=${encodeURIComponent(target)}`,
      );
    } catch {
      setError(
        "Your browser blocked device storage. Enable storage for this site and retry.",
      );
      setBusy("");
    }
  };
  const signIn = async (provider: "google" | "github") => {
    setBusy(provider);
    setError("");
    try {
      const { authClient } = await import("@/lib/product/auth-client");
      const { getLocalProfile } = await import("@/lib/product/db");
      const local = await getLocalProfile();
      if (local?.identity === "guest")
        sessionStorage.setItem("pmforge.pendingGuest", local.id);
      const result = await authClient.signIn.social({
        provider,
        callbackURL: `/auth/callback?next=${encodeURIComponent(target)}`,
        errorCallbackURL: "/auth/error",
      });
      if (result.error) throw Error(result.error.message);
    } catch {
      setBusy("");
      setError(
        "Sign-in could not start. Nothing changed; retry or use the device workspace.",
      );
    }
  };
  return (
    <div className={styles.gate}>
      <span className={styles.eyebrow}>Your next good decision</span>
      <h2>{mode === "login" ? "Welcome back." : "Enter PMForge."}</h2>
      <p>
        Real scenarios. Decisions you can defend. A practice space that
        remembers where you left off.
      </p>
      <button
        className={styles.primary}
        disabled={!providers.google || !!busy}
        onClick={() => void signIn("google")}
      >
        <span
          aria-hidden="true"
          style={{ fontWeight: 600, width: 19, textAlign: "center" }}
        >
          G
        </span>
        Continue with Google
      </button>
      <details>
        <summary className={styles.textButton}>Other sign-in options</summary>
        <button
          className={styles.secondary}
          disabled={!providers.github || !!busy}
          onClick={() => void signIn("github")}
        >
          <GitBranch size={18} />
          Continue with GitHub
        </button>
      </details>
      {!providers.google && !providers.github && (
        <p className={styles.finePrint}>
          Accounts aren’t connected in this preview. The complete device
          workspace is available below.
        </p>
      )}
      <span className={styles.divider}>or start here</span>
      <button
        className={styles.primary}
        onClick={() => void guest()}
        disabled={!!busy}
      >
        {busy === "guest"
          ? "Opening your workspace…"
          : "Try without an account"}
        <ArrowRight size={16} />
      </button>
      <p className={styles.finePrint}>
        <ShieldCheck
          size={13}
          style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }}
        />
        Guest work stays on this device. No email required. You can export it
        whenever you like.
      </p>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <p className={styles.finePrint}>
        By continuing, you agree to the{" "}
        <Link href="/terms" target="_blank">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" target="_blank">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
export function AuthPage({ next, mode }: { next?: string; mode?: string }) {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    void fetch("/api/me", { cache: "no-store" })
      .then((response) => response.json())
      .then(async (result) => {
        if (!result.user) return;
        const { db } = await import("@/lib/product/db");
        const profile = await db.profiles.get(result.user.id);
        if (active)
          router.replace(
            profile?.onboardingComplete
              ? safeNext(next)
              : `/auth/callback?next=${encodeURIComponent(safeNext(next))}`,
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [next, router]);
  return (
    <div className={styles.product}>
      <div className={styles.authPage}>
        <div className={styles.authArt}>
          <Link href="/" className={styles.brand}>
            <Compass size={25} />
            PMForge
          </Link>
          <span className={styles.eyebrow} style={{ color: "#c9d6bc" }}>
            A practice ground for product minds
          </span>
          <h1>
            Good judgment.
            <br />
            Built one decision at a time.
          </h1>
          <p>
            A little uncertainty. A room full of evidence. The space to make
            your call, learn from it, and try again.
          </p>
          <div className={styles.instrument}>
            <InstrumentDrawing />
          </div>
        </div>
        <div className={styles.authPanel}>
          <GatePanel next={next} mode={mode} />
        </div>
      </div>
    </div>
  );
}
export function EntryGate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState("/app");
  const [mode, setMode] = useState("signup");
  useEffect(() => {
    const close = () => setOpen(false);
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element)?.closest("a");
      if (!anchor || anchor.target === "_blank") return;
      const url = new URL(anchor.href, location.href);
      if (
        url.origin !== location.origin ||
        !["/signup", "/login"].includes(url.pathname)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      const target = safeNext(
        url.searchParams.get("next") ||
          ((url.searchParams.get("intent") || "").includes("practice")
            ? "/app/practice"
            : "/app"),
      );
      void import("@/lib/product/db")
        .then((module) => {
          module.stageLandingCarry();
          return module.getLocalProfile();
        })
        .then((profile) => {
          if (
            profile &&
            url.pathname !== "/login" &&
            url.searchParams.get("upgrade") !== "1"
          ) {
            router.push(
              profile.onboardingComplete
                ? target
                : `/onboarding?next=${encodeURIComponent(target)}`,
            );
            return;
          }
          setNext(target);
          setMode(url.pathname === "/login" ? "login" : "signup");
          setOpen(true);
        })
        .catch(() => {
          setNext(target);
          setOpen(true);
        });
    };
    document.addEventListener("click", click, true);
    window.addEventListener("pmforge:gate-close", close);
    return () => {
      document.removeEventListener("click", click, true);
      window.removeEventListener("pmforge:gate-close", close);
    };
  }, [router]);
  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      title="Enter PMForge"
      size="sm"
    >
      <div
        className={styles.product}
        style={{ minHeight: 0, background: "none" }}
      >
        <GatePanel next={next} mode={mode} />
      </div>
    </Dialog>
  );
}
