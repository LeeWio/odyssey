export const dynamic = "force-dynamic";

export function GET() {
  const revision = process.env.ODYSSEY_REVISION ?? "";
  const ready = /^[a-f0-9]{40}$/.test(revision);

  return new Response(ready ? revision : "Revision unavailable", {
    status: ready ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
