import { notFound } from "next/navigation";
import { getProject, projects } from "@/lib/projects/content";
import { ProjectLanding } from "@/components/projects/ProjectViews";
export function generateStaticParams() {
  return projects.map((p) => ({ projectId: p.id }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!getProject(projectId)) notFound();
  return <ProjectLanding projectId={projectId} />;
}
