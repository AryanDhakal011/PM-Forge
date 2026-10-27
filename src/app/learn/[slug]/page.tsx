import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { LessonView } from "@/components/site/LessonView";
import { modules } from "@/lib/content";
import styles from "@/styles/pages.module.css";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return modules.map((module) => ({ slug: module.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const module = modules.find((item) => item.slug === slug);
  if (!module) return { title: "Module not found" };
  return {
    title: `${module.number} · ${module.title}`,
    description: module.short,
    alternates: { canonical: `/learn/${module.slug}` },
  };
}

export default async function ModulePage({ params }: { params: Params }) {
  const { slug } = await params;
  const index = modules.findIndex((item) => item.slug === slug);
  if (index === -1) notFound();
  const module = modules[index];
  const previous = modules[index - 1];
  const next = modules[index + 1];

  return (
    <PageShell>
      <PageHero
        kicker={`Module ${module.number} of ${modules.length}`}
        title={module.title}
        lede={module.short}
        aside={
          <>
            <strong>Outcome</strong>
            {module.outcome}
            <div style={{ marginTop: "0.8rem" }}>
              <Link href="/learn">
                <ArrowLeft
                  size={12}
                  strokeWidth={1.8}
                  aria-hidden="true"
                  style={{ display: "inline", marginRight: "0.35rem" }}
                />
                Back to all modules
              </Link>
            </div>
          </>
        }
      />
      <section className={`${styles.section} ${styles.sectionTight}`}>
        <div className={styles.inner}>
          <LessonView module={module} previous={previous} next={next} />
        </div>
      </section>
    </PageShell>
  );
}
