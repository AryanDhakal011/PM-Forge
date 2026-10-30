import RunnerLoader from "@/components/product/RunnerLoader";
import { notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  if (!/^[a-z0-9-]{10,80}$/.test(runId)) notFound();
  return <RunnerLoader runId={runId} />;
}
