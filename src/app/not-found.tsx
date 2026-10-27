import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
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
        <p className="eyebrow">404</p>
        <h1 className="display h2" style={{ marginTop: "1.35rem" }}>
          This page is <em>missing evidence.</em>
        </h1>
        <p className="lede" style={{ marginTop: "1.35rem" }}>
          The route does not exist, or it moved. Nothing was lost from your
          local workspace. Pick a real destination below.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.95rem",
            marginTop: "2rem",
          }}
        >
          <Link href="/" className="btn btnPrimary">
            Back to the landing page
            <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </Link>
          <Link href="/learn" className="btn btnOutline">
            Browse modules
          </Link>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15rem), 1fr))",
            gap: "1rem",
            marginTop: "3rem",
          }}
        >
          {[
            {
              category: "Practice",
              title: "Take the signal test",
              description: "Ten conflicting inputs. One defensible call.",
              href: "/#signal",
              action: "Open the test",
            },
            {
              category: "Practice",
              title: "Run an interview",
              description:
                "Two minutes, optional browser speech dictation, and a local rubric.",
              href: "/practice",
              action: "Open the lab",
            },
            {
              category: "Support",
              title: "Read the help page",
              description: "Local data, microphone behaviour, and how to reset.",
              href: "/help",
              action: "Open help",
            },
          ].map((item) => (
            <article
              key={item.href}
              style={{
                display: "grid",
                alignContent: "start",
                gap: "0.8rem",
                padding: "1.25rem",
                border: "1px solid var(--line)",
                background: "var(--paper)",
              }}
            >
              <p className="eyebrow">{item.category}</p>
              <h2 className="display h3">{item.title}</h2>
              <p style={{ color: "var(--ink-soft)" }}>{item.description}</p>
              <Link href={item.href} className="btn btnOutline">
                {item.action}
                <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
