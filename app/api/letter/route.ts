import { chatText } from "../../../lib/serv";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You write short emails from a consumer to a company before signing an agreement.
Rules:
- plain text only, no markdown, no bullet lists, no subject line
- 90 words maximum
- name the specific clause and what you want changed
- firm and polite; never threaten, never claim to be a lawyer
- end with a request for written confirmation`;

export async function POST(request: Request): Promise<Response> {
  let body: { company?: string; label?: string; clause?: string; ask?: string };
  try {
    body = (await request.json()) as { company?: string; label?: string; clause?: string; ask?: string };
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  if (!body.label) return Response.json({ error: "label is required" }, { status: 400 });

  const prompt = [
    `Company: ${body.company || "the company named in the agreement"}`,
    `Clause problem: ${body.label}`,
    `What I want: ${body.ask || "that clause to be changed"}`,
    body.clause ? `Clause text: ${body.clause.slice(0, 1200)}` : "",
    `Write the email.`
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const text = await chatText({ system: SYSTEM, messages: [{ role: "user", content: prompt }], temperature: 0.3 });
    return Response.json({ text });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
