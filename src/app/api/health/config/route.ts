import { configReadiness } from "@/lib/cloud/config-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return Response.json(await configReadiness(new URL(request.url).origin), {
    headers: { "Cache-Control": "no-store" },
  });
}
