import { corrected, loadDefinition, readFlags, validationArtifact } from '../../../../../platform/devtools/server';
import { validate } from '../../../../../platform/devtools/validate';
import { compatible, mayEnter } from '../../../../../platform/services';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ levelId: string }> }) {
  const { levelId } = await params;
  if (!corrected.includes(levelId)) {
    return Response.json({ error: 'This level uses its preserved runtime.' }, { status: 404 });
  }

  const flags = readFlags();
  const flag = flags.levels[levelId];
  if (!flag?.enabled) {
    return Response.json({ error: 'Temporarily unavailable. Your saves remain on this device.' }, { status: 503 });
  }

  const definition = loadDefinition(levelId);
  const { manifest } = definition;
  const lint = process.env.NODE_ENV === 'production' ? validationArtifact() : { [levelId]: validate(definition).valid };
  if (lint[levelId] !== true || !compatible(flags.version, manifest.minPlatformVersion)) {
    return Response.json({ error: 'This level is awaiting content validation.' }, { status: 503 });
  }

  if (!mayEnter(manifest, lint, flags) && !flag.preview) {
    return Response.json({ error: 'This level is not publicly available. Existing saves remain on this device.' }, { status: 403 });
  }

  return Response.json({ definition, preview: manifest.status !== 'ready' }, { headers: { 'Cache-Control': 'no-store' } });
}
