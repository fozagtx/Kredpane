import { improve } from "../../../lib/instructions";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request): Promise<Response> {
  let body: { text?: string; target?: number };
  try {
    body = (await request.json()) as { text?: string; target?: number };
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const target = Number(body.target ?? 6.5);
  if (!text || text.length < 40) return Response.json({ error: "source text is too short" }, { status: 400 });
  if (!(target >= 3 && target <= 12)) return Response.json({ error: "target must be between 3 and 12" }, { status: 400 });

  try {
    return Response.json(await improve(text, target));
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
