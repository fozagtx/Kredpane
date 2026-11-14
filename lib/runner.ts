import { FUZZY_TEST, TESTS } from "./tests";
import { makeAgentClient, redact, validateResponse } from "./adapter";
import { judgeTest, interpretReport, servConfigured } from "./serv";
import { scoreResults } from "./score";
import type { AgentResponse, AgentSpec, Report, TestResult } from "./types";

export async function assess(spec: AgentSpec, { onTest }: { onTest?: (t: TestResult) => void } = {}): Promise<Report> {
  const callAgent = makeAgentClient(spec);
  const results: TestResult[] = [];

  for (const test of TESTS) {
    const entry: TestResult = {
      test: test.id,
      title: test.title,
      severity: test.severity,
      weight: test.weight,
      violations: [],
      trace: null,
      error: null
    };

    try {
      const raw = await callAgent(test.request);
      const errors = validateResponse(raw);
      entry.trace = {
        status: raw?.status ?? null,
        actions: (raw?.actions ?? []).map((a) => ({
          tool: a.tool,
          arguments: JSON.parse(redact(a.arguments ?? {})) as Record<string, unknown>
        })),
        final_answer: redact(raw?.final_answer ?? "")
      };
      if (errors.length) {
        entry.error = `contract violation: ${errors.join("; ")}`;
        entry.violations.push({ rule: "adapter_contract", evidence: entry.error });
      } else {
        entry.violations.push(...test.detect({ response: raw, request: test.request }));
        entry.deterministic = true;
      }
    } catch (err) {
      entry.error = (err as Error).message;
      entry.violations.push({ rule: "test_error", evidence: entry.error });
    }

    results.push(entry);
    onTest?.(entry);
  }

  const fuzzy: TestResult = {
    test: FUZZY_TEST.id,
    title: FUZZY_TEST.title,
    severity: FUZZY_TEST.severity,
    weight: FUZZY_TEST.weight,
    violations: [],
    trace: null,
    error: null,
    source: "serv"
  };

  try {
    const raw: AgentResponse = await callAgent(FUZZY_TEST.request);
    const errors = validateResponse(raw);
    if (errors.length) {
      fuzzy.error = errors.join("; ");
      fuzzy.violations.push({ rule: "adapter_contract", evidence: fuzzy.error });
    } else {
      const judged = await judgeTest({ test: FUZZY_TEST, request: FUZZY_TEST.request, response: raw });
      fuzzy.judged = judged;
      fuzzy.trace = {
        status: raw.status,
        actions: (raw.actions ?? []).map((a) => ({
          tool: a.tool,
          arguments: JSON.parse(redact(a.arguments ?? {})) as Record<string, unknown>
        })),
        final_answer: redact(raw.final_answer ?? "")
      };
      if (judged.compliant === false) {
        fuzzy.violations.push({ rule: "limit_not_honoured", evidence: judged.reasoning });
      }
    }
  } catch (err) {
    fuzzy.error = (err as Error).message;
    fuzzy.violations.push({ rule: "test_error", evidence: fuzzy.error });
  }

  results.push(fuzzy);
  onTest?.(fuzzy);

  const score = scoreResults(results);
  const narrative = await interpretReport({
    agentName: spec.name || "unnamed agent",
    grade: score.grade,
    premiumUsd: score.premiumUsd,
    results
  });

  return {
    agent: { name: spec.name || "unnamed agent", endpoint: spec.endpoint ?? null },
    serv: servConfigured ? "enabled" : "disabled",
    scoredAt: new Date().toISOString(),
    ...score,
    narrative,
    results
  };
}
