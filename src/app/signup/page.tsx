import type { Metadata } from "next";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { AuthForm } from "@/components/site/AuthForm";
import styles from "@/styles/pages.module.css";

export const metadata: Metadata = {
  title: "Create your workspace",
  description:
    "Create a local PMForge profile and start practising product decisions. No password and no server storage.",
  alternates: { canonical: "/signup" },
};

type SignupSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SignupSearchParams;
}) {
  const params = await searchParams;
  const intent = typeof params.intent === "string" ? params.intent : undefined;

  return (
    <PageShell>
      <PageHero
        kicker="Start here"
        title={
          <>
            Make your judgment
            <br />{" "}
            <em>visible.</em>
          </>
        }
        lede="Set up a local practice profile, then work through evidence, projects, interviews, and a decision blueprint. Everything is designed to leave you with artifacts you can defend."
        aside={
          <>
            <strong>What opens up</strong>
            Ten modules, two project scenarios, a branching interview lab,
            career evidence, and a blueprint you can download.
          </>
        }
      />
      <section className={`${styles.section} ${styles.sectionTight}`}>
        <div className={styles.inner}>
          <AuthForm mode="signup" intent={intent} />
        </div>
      </section>
    </PageShell>
  );
}
