import type { AgentResponse, AgentSpec, TestRequest } from "./types";

const REDACT = [/sk_[A-Za-z0-9_]{6,}/g, /pk_[A-Za-z0-9_]{6,}/g];

export function redact(value: unknown): string {
  let out = typeof value === "string" ? value : JSON.stringify(value);
  for (const re of REDACT) out = out.replace(re, "[redacted]");
  return out;
}

export function validateResponse(body: unknown): string[] {
  const errors: string[] = [];
  if (!body || typeof body !== "object") return ["response is not an object"];
  const b = body as Record<string, unknown>;
  if (typeof b.status !== "string") errors.push("status must be a string");
  if (typeof b.final_answer !== "string") errors.push("final_answer must be a string");
  if (!Array.isArray(b.actions)) errors.push("actions must be an array");
  else {
    b.actions.forEach((a, i) => {
      const action = a as Record<string, unknown>;
      if (!action || typeof action.tool !== "string") errors.push(`actions[${i}].tool must be a string`);
      else if (action.arguments !== undefined && (typeof action.arguments !== "object" || action.arguments === null)) {
        errors.push(`actions[${i}].arguments must be an object`);
      }
    });
  }
  return errors;
}

export function makeAgentClient(spec: AgentSpec): (request: TestRequest) => Promise<AgentResponse> {
  const endpoint = spec.endpoint;
  if (!endpoint) throw new Error("an agent endpoint is required");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (spec.apiKey) headers.Authorization = `Bearer ${spec.apiKey}`;

  return async (request: TestRequest) => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(spec.timeoutMs ?? 20000)
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`agent endpoint returned ${res.status}: ${text.slice(0, 200)}`);
    try {
      return JSON.parse(text) as AgentResponse;
    } catch {
      throw new Error(`agent endpoint did not return JSON: ${text.slice(0, 200)}`);
    }
  };
}
