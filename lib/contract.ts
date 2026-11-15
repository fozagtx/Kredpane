import { extractFacts, missingFacts } from "./facts";
import { chatText } from "./serv";

export interface Finding {
  id: string;
  label: string;
  severity: "critical" | "high" | "medium";
  weight: number;
  evidence: string;
  ask: string;
}

export interface Analysis {
  riskScore: number;
  band: "low" | "medium" | "high";
  findings: Finding[];
}

export interface Pass {
  n: number;
  analysis: Analysis;
  missed: string[];
  text: string;
}

export interface Review {
  target: number;
  passes: Pass[];
  before: Analysis;
  after: Analysis;
  facts: number;
  fixed: number;
}

interface Check {
  id: string;
  label: string;
  severity: Finding["severity"];
  weight: number;
  ask: string;
  pattern: RegExp;
}

const CHECKS: Check[] = [
  {
    id: "arbitration",
    label: "You give up your right to sue or join a class action",
    severity: "critical",
    weight: 25,
    ask: "Ask for arbitration to be optional, or for a small-claims carve-out.",
    pattern: /waive[^.]{0,80}(?:class\s+action|jury|right\s+to\s+sue)|class\s+action\s+waiver/i
  },
  {
    id: "unilateral_change",
    label: "They can change the terms later without asking you",
    severity: "high",
    weight: 20,
    ask: "Ask for written notice and the right to cancel if the change hurts you.",
    pattern: /may\s+(?:change|modify|update|amend)[^.]{0,80}without\s+(?:prior\s+)?notice|at\s+any\s+time\s+without\s+notice/i
  },
  {
    id: "auto_renewal",
    label: "It renews itself automatically",
    severity: "high",
    weight: 15,
    ask: "Ask for renewal to be opt-in, or for a reminder before it renews.",
    pattern: /automatically\s+renew|auto-?renew|renew[^.]{0,40}(?:successive|another|additional)\s+(?:term|period|year)/i
  },
  {
    id: "one_sided_indemnity",
    label: "You indemnify them; they do not indemnify you",
    severity: "high",
    weight: 20,
    ask: "Ask for the indemnity to be mutual, or limited to your own negligence.",
    pattern: /member[^.]{0,60}indemnif|indemnif[^.]{0,60}hold\s+harmless/i
  },
  {
    id: "termination_without_cause",
    label: "They can end the agreement for any reason, you cannot",
    severity: "high",
    weight: 20,
    ask: "Ask for the same termination right on both sides.",
    pattern: /(?:we|company|provider|club)\s+may\s+terminate[^.]{0,80}(?:any\s+time|for\s+any\s+reason|without\s+cause)/i
  },
  {
    id: "late_fees",
    label: "Late fees and interest on top",
    severity: "medium",
    weight: 10,
    ask: "Ask for a grace period, and a cap on the late fee.",
    pattern: /late\s+(?:fee|charge)|interest[^.]{0,30}\d+\s?%|per\s+annum/i
  },
  {
    id: "non_refundable",
    label: "Fees that are never refunded",
    severity: "medium",
    weight: 10,
    ask: "Ask for a pro-rata refund when you cancel early.",
    pattern: /non-?refundable|no\s+refunds?|not\s+be\s+refunded/i
  },
  {
    id: "distant_venue",
    label: "Disputes are heard far from where you live",
    severity: "medium",
    weight: 5,
    ask: "Ask for your home county, or for remote hearings.",
    pattern: /venue[^.]{0,60}(?:county|state|city)\s+of|exclusive\s+jurisdiction/i
  },
  {
    id: "data_sharing",
    label: "Your data can be shared or sold",
    severity: "medium",
    weight: 10,
    ask: "Ask for an opt-in, and for a list of who receives it.",
    pattern: /(?:sell|share)[^.]{0,50}(?:personal\s+)?(?:data|information)[^.]{0,40}(?:third\s+part|affiliat|partner)/i
  },
  {
    id: "early_termination_fee",
    label: "You pay a penalty to leave early",
    severity: "medium",
    weight: 10,
    ask: "Ask for the fee to be capped, or removed after the first year.",
    pattern: /early\s+termination\s+(?:fee|charge|penalt)|cancellation\s+fee/i
  }
];

function evidenceFor(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  if (!match) return null;
  const at = match.index ?? 0;
  const start = Math.max(0, at - 40);
  const snippet = text.slice(start, Math.min(text.length, at + 90)).replace(/\s+/g, " ").trim();
  return `…${snippet}…`;
}

export function analyzeContract(text: string): Analysis {
  const findings: Finding[] = [];
  for (const check of CHECKS) {
    const evidence = evidenceFor(text, check.pattern);
    if (evidence) {
      findings.push({
        id: check.id,
        label: check.label,
        severity: check.severity,
        weight: check.weight,
        evidence,
        ask: check.ask
      });
    }
  }
  const riskScore = Math.min(100, findings.reduce((sum, f) => sum + f.weight, 0));
  const band = riskScore >= 50 ? "high" : riskScore >= 21 ? "medium" : "low";
  return { riskScore, band, findings };
}

const SYSTEM = `You are a consumer contract editor. You revise a one-sided contract so a normal person can sign it without being trapped.
Hard rules:
- remove or soften the specific unfair terms listed by the reviewer
- keep every amount, percentage, notice period and date exactly as written
- keep the structure and the numbering
- do not add new obligations for the consumer
- if a term cannot be made fair, delete it entirely rather than leaving a softened version
- do not write legal advice, commentary or a summary; output the revised contract text only`;

function feedback(pass: Pass, target: number, missed: string[]): string {
  const lines = [`Current risk score is ${pass.analysis.riskScore}; target is ${target} or lower.`];
  if (pass.analysis.findings.length) {
    lines.push(`Still unfair:`);
    for (const f of pass.analysis.findings) lines.push(`- ${f.label}. ${f.ask}`);
  }
  if (missed.length) lines.push(`Restore these numbers verbatim: ${missed.join(", ")}.`);
  lines.push(`Rewrite the whole contract now. Output the contract text only.`);
  return lines.join("\n");
}

export async function reviewContract(source: string, target = 25, maxPasses = 3): Promise<Review> {
  const before = analyzeContract(source);
  const passes: Pass[] = [{ n: 0, analysis: before, missed: [], text: source }];
  const facts = extractFacts(source).length;

  let current = source;
  for (let n = 1; n <= maxPasses; n++) {
    const last = passes[passes.length - 1];
    const missed = missingFacts(source, current);
    const prompt =
      n === 1
        ? `Review the contract below and revise it.\nUnfair terms found: ${before.findings.map((f) => f.label).join("; ") || "none"}.\nTarget risk score: ${target} or lower.\n\n${source}`
        : `${feedback(last, target, missed)}\n\nCurrent version:\n\n${current}`;

    const text = await chatText({ system: SYSTEM, messages: [{ role: "user", content: prompt }], temperature: 0.2 });
    const pass: Pass = { n, analysis: analyzeContract(text), missed: missingFacts(source, text), text };
    passes.push(pass);
    current = text;

    if (pass.analysis.riskScore <= target && pass.missed.length === 0) break;
    if (last.n > 0 && pass.text === last.text) break;
  }

  const finalPass = passes[passes.length - 1];
  return {
    target,
    passes,
    before,
    after: finalPass.analysis,
    facts,
    fixed: Math.max(0, before.findings.length - finalPass.analysis.findings.length)
  };
}
