import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { AuthForm } from "@/components/site/AuthForm";
import styles from "@/styles/pages.module.css";

export const metadata: Metadata = {
  title: "Log in",
  description:
    "Open the PMForge practice profile saved in this browser. Local-only, no password, no server session.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <PageShell>
      <PageHero
        kicker="Return to practice"
        title={
          <>
            Pick up where
            <br />
            <em>you left off.</em>
          </>
        }
        lede="PMForge keeps your profile and progress in this browser. Enter the same email you used when you created it, or preview the workspace with a demo profile."
        aside={
          <>
            <strong>Looking for a fresh start?</strong>
            Create a new local profile. Your existing practice data stays in the
            browser until you clear it.{" "}
            <Link href="/help">How to reset data</Link>
          </>
        }
      />
      <section className={`${styles.section} ${styles.sectionTight}`}>
        <div className={styles.inner}>
          <AuthForm mode="login" />
        </div>
      </section>
    </PageShell>
  );
}
