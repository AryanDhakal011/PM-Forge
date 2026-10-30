import { redirect, notFound } from "next/navigation";
import { getProject } from "@/lib/projects/content";
import { ProjectLanding } from "@/components/projects/ProjectViews";
export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string; ch: string }>;
}) {
  const { projectId, ch } = await params;
  if (projectId === "deadlock") redirect("/app/projects/deadlock");
  if (!getProject(projectId) || !["1", "2", "3"].includes(ch)) notFound();
  return <ProjectLanding projectId={projectId} chapterPreview={Number(ch)} />;
}
