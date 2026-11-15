import { getEvaluation, reppoConfigured, submitResponseEval } from "../../../lib/reppo";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  if (!reppoConfigured) return Response.json({ error: "REPPO_API_KEY is not configured" }, { status: 503 });
  try {
    return Response.json(await getEvaluation(id));
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!reppoConfigured) return Response.json({ error: "REPPO_API_KEY is not configured" }, { status: 503 });
  let body: { userMessage?: string; reply?: string };
  try {
    body = (await request.json()) as { userMessage?: string; reply?: string };
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  if (!body.userMessage || !body.reply) {
    return Response.json({ error: "userMessage and reply are required" }, { status: 400 });
  }
  try {
    return Response.json(await submitResponseEval(body.userMessage, body.reply), { status: 202 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
