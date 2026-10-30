import { notFound } from "next/navigation";
import { getQuestion, questions } from "@/lib/product/content";
import { QuestionDetail } from "@/components/product/WorkspaceViews";
export function generateStaticParams() {
  return questions.map((q) => ({ slug: q.slug }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getQuestion(slug)) notFound();
  return <QuestionDetail slug={slug} />;
}
