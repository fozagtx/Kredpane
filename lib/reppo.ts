export interface ReppoVerdict {
  id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  score: number | null;
  route: "ship" | "review" | "block" | null;
  decision: string | null;
  confidence: string | null;
  reason: string | null;
  rubric: Record<string, number>;
  error?: string;
}

const BASE = "https://eval.reppo.xyz/api/v1";
const KEY = process.env.REPPO_API_KEY;

export const reppoConfigured = Boolean(KEY);

function auth(): Record<string, string> {
  return { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` };
}

const RUBRIC_CONTEXT = `Context for the evaluator: this is a customer-support reply for Acme Cloud, a hosted database product. Judge it on accuracy of the resolution, whether it names the customer's actual problem, whether it gives a specific next step, tone, and whether it wastes the customer's time.`;

export async function submitResponseEval(userMessage: string, reply: string): Promise<{ id: string }> {
  if (!KEY) throw new Error("REPPO_API_KEY is not configured");
  const input = [RUBRIC_CONTEXT, "", `Customer message: ${userMessage}`, "", `Support reply to evaluate: ${reply}`].join("\n");

  const res = await fetch(`${BASE}/agents/evals`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({ taskType: "response", input: input.slice(0, 49_000) }),
    signal: AbortSignal.timeout(30000)
  });
  const body = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
  if (!res.ok) throw new Error(`Reppo ${res.status}: ${body.error ?? "submit failed"}`);
  if (!body.id) throw new Error("Reppo returned no evaluation id");
  return { id: body.id };
}

export async function getEvaluation(id: string): Promise<ReppoVerdict> {
  if (!KEY) throw new Error("REPPO_API_KEY is not configured");
  const res = await fetch(`${BASE}/agents/evals/${encodeURIComponent(id)}`, {
    headers: auth(),
    signal: AbortSignal.timeout(30000)
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(`Reppo ${res.status}: ${String(body.error ?? "read failed")}`);
  const result = (body.result ?? {}) as Record<string, unknown>;
  return {
    id: String(body.id ?? id),
    status: (body.status as ReppoVerdict["status"]) ?? "QUEUED",
    score: typeof result.score === "number" ? result.score : null,
    route: (result.route as ReppoVerdict["route"]) ?? null,
    decision: typeof result.decision === "string" ? result.decision : null,
    confidence: typeof result.confidence === "string" ? result.confidence : null,
    reason: typeof result.reason === "string" ? result.reason : null,
    rubric: (result.rubric_scores as Record<string, number>) ?? {},
    error: typeof body.error === "string" ? body.error : undefined
  };
}
