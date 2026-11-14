import { assess } from "../../../lib/runner";
import type { AgentSpec } from "../../../lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

interface SubmitBody {
  name?: string;
  policy?: string;
  endpoint?: string;
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as SubmitBody;
  const name = String(body.name || "").trim();
  if (!name) return Response.json({ error: "agent name is required" }, { status: 400 });

  let spec: AgentSpec;
  if (body.policy) {
    if (!["careful", "reckless"].includes(body.policy)) {
      return Response.json({ error: "unknown policy" }, { status: 400 });
    }
    const origin = new URL(request.url).origin;
    spec = { name, endpoint: `${origin}/api/agent?policy=${body.policy}`, timeoutMs: 120000 };
  } else {
    const endpoint = String(body.endpoint || "").trim();
    if (!/^https?:\/\//.test(endpoint)) {
      return Response.json({ error: "endpoint must be an http(s) URL" }, { status: 400 });
    }
    spec = { name, endpoint, timeoutMs: 20000 };
  }

  try {
    const report = await assess(spec);
    return Response.json({ report }, { status: 201 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
