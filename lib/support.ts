import { chatText } from "./serv";

export const PASS_SCORE = 80;

export interface SupportMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SupportAttempt {
  n: number;
  reply: string;
  score: number | null;
  route: string | null;
  reason: string | null;
  rubric: Record<string, number>;
  constraint: string | null;
}

export interface SupportTurn {
  user: string;
  attempts: SupportAttempt[];
  before: number | null;
  after: number | null;
}

const BASE_SYSTEM = `You are a customer support agent for Acme Cloud, a hosted database product.
Reply in two sentences or fewer. Be polite.
Do not ask questions, do not diagnose, and do not commit to a specific action.`;

export function accepted(score: number | null, route: string | null): boolean {
  return route === "ship" && (score ?? 0) >= PASS_SCORE;
}

export function buildConstraint(input: {
  score: number;
  route: string;
  reason: string;
  rubric: Record<string, number>;
}): string {
  const rubric = Object.entries(input.rubric)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
  return [
    `Your previous reply scored ${input.score}/100 and was routed "${input.route}".`,
    input.reason ? `Panel critique: ${input.reason}` : "",
    rubric ? `Rubric: ${rubric}.` : "",
    `Rewrite the reply so it addresses every point of that critique. Hard requirements:`,
    `- open by naming the customer's actual problem in their own terms`,
    `- give a specific resolution, not a generic offer to help`,
    `- state the concrete next step the customer should take, or the exact escalation you are making`,
    `- if you need information, ask exactly one precise question`,
    `- under 120 words, no filler, never repeat the wording of the previous attempt.`
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateReply(
  messages: SupportMessage[],
  constraint?: string
): Promise<{ reply: string; constraint: string | null }> {
  const system = constraint
    ? `You are a customer support agent for Acme Cloud, a hosted database product.\n\nCONSTRAINT FROM QUALITY REVIEW:\n${constraint}\n\nFollow the constraint exactly. Never mention the review, the score, or that you were corrected.`
    : BASE_SYSTEM;
  const reply = await chatText({ system, messages, temperature: constraint ? 0.2 : 0.8 });
  return { reply, constraint: constraint ?? null };
}

export function summarise(turns: SupportTurn[]): { before: number | null; after: number | null; delta: number | null; scored: number } {
  const scored = turns.filter((t) => t.before !== null && t.after !== null);
  if (!scored.length) return { before: null, after: null, delta: null, scored: 0 };
  const mean = (pick: (t: SupportTurn) => number | null) =>
    scored.reduce((s, t) => s + (pick(t) ?? 0), 0) / scored.length;
  const before = Math.round(mean((t) => t.before));
  const after = Math.round(mean((t) => t.after));
  return { before, after, delta: after - before, scored: scored.length };
}
