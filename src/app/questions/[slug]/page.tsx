import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/PageShell";
import { getQuestion, questions } from "@/lib/product/content";
import PublicLibrary from "@/components/product/PublicLibrary";
export function generateStaticParams() {
  return questions.map((q) => ({ slug: q.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const question = getQuestion(slug);
  return {
    title: question?.title || "Scenario not found",
    description: question?.primer[0],
    robots: { index: false, follow: true },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getQuestion(slug)) notFound();
  return (
    <PageShell>
      <PublicLibrary slug={slug} />
    </PageShell>
  );
}
