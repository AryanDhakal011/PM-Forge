"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main"
      tabIndex={-1}
      style={{ minHeight: "100svh", paddingTop: "var(--nav-h)" }}
    >
      <section
        style={{
          maxWidth: "var(--max)",
          marginInline: "auto",
          padding: "clamp(3.4rem, 7vw, 6.4rem) var(--gutter)",
        }}
      >
        <p className="eyebrow">Something broke</p>
        <h1 className="display h2" style={{ marginTop: "1.35rem" }}>
          We could not <em>complete that.</em>
        </h1>
        <p className="lede" style={{ marginTop: "1.35rem" }}>
          An unexpected error stopped this view. Your local practice data is
          still in the browser. Try the view again, or head somewhere real.
        </p>
        <p style={{ maxWidth: "58ch", marginTop: "1rem", color: "var(--muted)" }}>
          Errors do not clear localStorage. If the problem persists, use the
          help page to reset practice data deliberately.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.95rem",
            marginTop: "2rem",
          }}
        >
          <button type="button" className="btn btnPrimary" onClick={reset}>
            <RotateCcw size={15} strokeWidth={1.8} aria-hidden="true" />
            Try again
          </button>
          <Link href="/" className="btn btnOutline">
            Back to the landing page
            <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>
        <p
          style={{
            maxWidth: "58ch",
            marginTop: "3rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--line)",
            color: "var(--muted)",
          }}
        >
          If this keeps happening, open the browser console and note the route
          and the error message. No error details are sent anywhere by this
          build.
        </p>
      </section>
    </main>
  );
}
