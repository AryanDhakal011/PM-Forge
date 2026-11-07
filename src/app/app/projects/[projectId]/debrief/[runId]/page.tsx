import {notFound} from 'next/navigation';
import {isRegisteredProject} from '@/lib/projects/platform-registry';
export default async function Page({params}:{params:Promise<{projectId:string;runId:string}>}){const {projectId}=await params;if(!isRegisteredProject(projectId))notFound();return null}
