import { buildConstraint, generateReply } from "../../../lib/support";
import type { SupportMessage } from "../../../lib/support";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  messages: SupportMessage[];
  feedback?: {
    score: number;
    route: string;
    reason: string;
    rubric: Record<string, number>;
  };
}

export async function POST(request: Request): Promise<Response> {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "messages are required" }, { status: 400 });
  }

  const constraint = body.feedback ? buildConstraint(body.feedback) : undefined;

  try {
    const { reply } = await generateReply(body.messages, constraint);
    return Response.json({ reply, constraint: constraint ?? null });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
