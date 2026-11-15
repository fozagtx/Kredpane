export const runtime = "nodejs";

export function GET(): Response {
  return Response.json({
    serv: Boolean(process.env.SERV_API_KEY),
    reppo: Boolean(process.env.REPPO_API_KEY),
    passScore: 80
  });
}
