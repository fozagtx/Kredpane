import { buildAppealInput, getEvaluation, reppoConfigured, submitEvaluation } from "../../../lib/reppo";
import type { Report } from "../../../lib/types";

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
  if (!reppoConfigured) {
    return Response.json({ error: "REPPO_API_KEY is not configured" }, { status: 503 });
  }

  let report: Report;
  try {
    report = (await request.json()) as Report;
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  if (!report?.agent?.name) return Response.json({ error: "a report is required" }, { status: 400 });

  const input = buildAppealInput({
    agent: report.agent.name,
    grade: report.grade,
    riskScore: report.riskScore,
    premiumUsd: report.premiumUsd,
    failed: report.results
      .filter((r) => r.violations.length > 0)
      .map((r) => ({
        test: r.test,
        severity: r.severity,
        evidence: r.violations.map((v) => v.evidence).join("; ")
      }))
  });

  try {
    const { id } = await submitEvaluation(input);
    return Response.json({ id, status: "QUEUED" }, { status: 202 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
