import ProjectRunner from "@/components/projects/ProjectRunner";
export default async function Page({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  return <ProjectRunner key={runId} runId={runId} debrief />;
}
