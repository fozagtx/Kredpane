import { reviewContract } from "../../../lib/contract";

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
  const target = Number(body.target ?? 25);
  if (!text || text.length < 60) return Response.json({ error: "paste a fuller contract first" }, { status: 400 });
  if (!(target >= 0 && target <= 60)) return Response.json({ error: "target must be between 0 and 60" }, { status: 400 });

  try {
    return Response.json(await reviewContract(text, target));
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
