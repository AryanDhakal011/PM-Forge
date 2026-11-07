import {loadCatalog,readFlags,validationArtifact} from '../../../../platform/devtools/server';
export const dynamic='force-dynamic';
export async function GET(){return Response.json({manifests:loadCatalog(),flags:readFlags(),lint:validationArtifact()},{headers:{'Cache-Control':'no-store'}})}
