export const runtime = "nodejs";

export function GET(): Response {
  return Response.json({ reppo: Boolean(process.env.REPPO_API_KEY) });
}
