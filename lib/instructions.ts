import { analyse, extractFacts, missingFacts } from "./readability";
import type { Metrics } from "./readability";
import { chatText } from "./serv";

export const ABBREVIATIONS = ["BID", "TID", "QID", "q6h", "q8h", "q4h", "PRN", "PO", "IM", "IV", "SpO2", "RR", "CBC", "ED", "PNA", "Dx"];

export const CLINICAL_TERMS = [
  "community-acquired",
  "pneumonia",
  "amoxicillin-clavulanate",
  "acetaminophen",
  "saturation",
  "respiratory",
  "pulmonology",
  "emergency department",
  "after-visit",
  "dyspnea",
  "pyrexia",
  "hemodynamic",
  "comorbidity"
];

export interface Pass {
  n: number;
  metrics: Metrics;
  missed: string[];
  text: string;
}

export interface Improvement {
  target: number;
  source: string;
  passes: Pass[];
  before: Metrics;
  after: Metrics;
  facts: number;
  hit: boolean;
}

const SYSTEM = `You are a patient-education editor. You rewrite hospital instructions so a patient with limited health literacy can follow them.
Hard rules:
- plain words for clinical terms, but never change a number, dose, time or phone number
- average sentence under 12 words
- keep every instruction: medicines, doses, timing, follow-up, activity limits, warning signs, contacts
- never merge or drop an instruction
- no abbreviations such as PO, BID, q6h, SpO2, RR, PRN
- keep drug names but explain plainly what they are for (for example "the antibiotic amoxicillin-clavulanate")`;

function feedback(pass: Pass, target: number, missed: string[], abbreviations: string[]): string {
  const lines = [`Previous attempt scored grade ${pass.metrics.grade} (target ${target} or lower), average sentence ${pass.metrics.avgSentence} words.`];
  if (abbreviations.length) lines.push(`Remove these abbreviations: ${abbreviations.join(", ")}.`);
  if (missed.length) lines.push(`These facts went missing and must appear verbatim: ${missed.join(", ")}.`);
  if (pass.metrics.grade > target) lines.push(`Shorten sentences and simplify words further. Target ${target} or lower.`);
  lines.push(`Rewrite now. Output only the instructions.`);
  return lines.join("\n");
}

function abbreviationsIn(metrics: Metrics): string[] {
  return metrics.jargon.filter((j) => ABBREVIATIONS.some((a) => a.toLowerCase() === j.toLowerCase()));
}

export async function improve(source: string, target: number, maxPasses = 3): Promise<Improvement> {
  const before = analyse(source, [...ABBREVIATIONS, ...CLINICAL_TERMS]);
  const passes: Pass[] = [{ n: 0, metrics: before, missed: [], text: source }];
  const facts = extractFacts(source).length;

  let current = source;
  for (let n = 1; n <= maxPasses; n++) {
    const last = passes[passes.length - 1];
    const missed = missingFacts(source, current);
    const instruction =
      n === 1
        ? `Target grade level: ${target} or lower.\n\nSource instructions:\n\n${source}`
        : `${feedback(last, target, missed, abbreviationsIn(last.metrics))}\n\nCurrent version:\n\n${current}`;

    const text = await chatText({ system: SYSTEM, messages: [{ role: "user", content: instruction }], temperature: 0.2 });
    const pass: Pass = { n, metrics: analyse(text, [...ABBREVIATIONS, ...CLINICAL_TERMS]), missed: missingFacts(source, text), text };
    passes.push(pass);
    current = text;

    const clean = pass.metrics.grade <= target && abbreviationsIn(pass.metrics).length === 0 && pass.missed.length === 0;
    if (clean) break;
    if (last.n > 0 && pass.text === last.text) break;
    if (last.n > 0 && Math.abs(pass.metrics.grade - last.metrics.grade) < 0.05 && pass.missed.length === last.missed.length) break;
  }

  const finalPass = passes[passes.length - 1];
  const after = finalPass.metrics;
  return {
    target,
    source,
    passes,
    before,
    after,
    facts,
    hit: after.grade <= target && abbreviationsIn(after).length === 0 && finalPass.missed.length === 0
  };
}
