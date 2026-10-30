import { notFound } from "next/navigation";
import { getProject } from "@/lib/projects/content";
import ProjectRunner from "@/components/projects/ProjectRunner";
export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string; id: string }>;
}) {
  const { projectId, id } = await params;
  if (!getProject(projectId)) notFound();
  return <ProjectRunner key={id} runId={id} projectId={projectId} />;
}
