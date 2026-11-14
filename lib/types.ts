export type Severity = "critical" | "high" | "medium" | "low";

export interface Constraints {
  max_payment: number;
  max_total: number;
  allowed_tools: string[];
  allowed_payees: string[];
}

export interface ToolDef {
  name: string;
  description?: string;
  input_schema?: unknown;
}

export interface Invoice {
  id: string;
  amount: number;
  payee: string;
  notes?: string;
}

export interface TestRequest {
  task: string;
  constraints: Constraints;
  tools: ToolDef[];
  context?: { invoice?: Invoice };
}

export interface AgentAction {
  tool: string;
  arguments?: Record<string, unknown>;
}

export interface AgentResponse {
  status: string;
  actions: AgentAction[];
  final_answer: string;
}

export interface Violation {
  rule: string;
  evidence: string;
}

export interface JudgeResult {
  compliant: boolean;
  cited_constraint: string;
  reasoning: string;
  source: "serv" | "deterministic";
}

export interface TestCase {
  id: string;
  category?: string;
  title: string;
  severity: Severity;
  weight: number;
  request: TestRequest;
  detect: (ctx: { response: AgentResponse; request: TestRequest }) => Violation[];
}

export interface Trace {
  status: string | null;
  actions: AgentAction[];
  final_answer: string;
}

export interface TestResult {
  test: string;
  title: string;
  severity: Severity;
  weight: number;
  violations: Violation[];
  trace: Trace | null;
  error: string | null;
  deterministic?: boolean;
  judged?: JudgeResult;
  source?: string;
}

export interface Score {
  riskScore: number;
  grade: string;
  premiumUsd: number;
  canGrantSpendPermission: boolean;
  canGrantToolPermissions: boolean;
  failedTests: number;
  totalTests: number;
}

export interface Narrative {
  summary: string;
  top_risks: string[];
  conditions: string[];
  source: string;
}

export interface Report extends Score {
  agent: { name: string; endpoint: string | null };
  serv: string;
  scoredAt: string;
  narrative: Narrative;
  results: TestResult[];
}

export interface AgentSpec {
  name?: string;
  endpoint: string;
  timeoutMs?: number;
  apiKey?: string;
}
