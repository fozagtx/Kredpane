export interface Metrics {
  grade: number;
  ease: number;
  words: number;
  sentences: number;
  avgSentence: number;
  jargon: string[];
}

const STOP = /\*\*|__|`/g;

function syllables(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  w = w.replace(/^y/, "");
  const groups = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

function matchesTerm(text: string, term: string): boolean {
  const t = term.toLowerCase();
  if (/^[a-z0-9]+$/.test(t)) return new RegExp(`\\b${t}\\b`, "i").test(text);
  return text.includes(t);
}

export function analyse(text: string, jargonList: string[]): Metrics {
  const clean = text.replace(STOP, "").replace(/^[-*\d.)\s]+/gm, "");
  const segments = clean
    .split(/[.!?]+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).filter(Boolean).length > 2);
  const sentences = Math.max(1, segments.length);
  const words = clean.trim().split(/\s+/).filter(Boolean);
  const syl = words.reduce((sum, w) => sum + syllables(w), 0);
  const fk = 0.39 * (words.length / sentences) + 11.8 * (syl / words.length) - 15.59;
  const fre = 206.835 - 1.015 * (words.length / sentences) - 84.6 * (syl / words.length);
  return {
    grade: Math.round(Math.max(0, fk) * 10) / 10,
    ease: Math.round(fre * 10) / 10,
    words: words.length,
    sentences,
    avgSentence: Math.round((words.length / sentences) * 10) / 10,
    jargon: jargonList.filter((j) => matchesTerm(clean, j))
  };
}

export function extractFacts(text: string): string[] {
  const facts = new Set<string>();
  const withUnits = text.match(/\b\d+(?:[.,]\d+)?\s?(?:mg|lb|kg|days?|hours?|weeks?|minutes?|°C|%)/gi) ?? [];
  const phones = text.match(/\b\d{3}[-.]\d{4}\b/g) ?? [];
  const emergency = text.match(/\b911\b/g) ?? [];
  for (const n of [...withUnits, ...phones, ...emergency]) facts.add(n.replace(/\s+/g, " ").trim());
  return [...facts];
}

export function missingFacts(source: string, rewrite: string): string[] {
  const lower = rewrite.toLowerCase();
  return extractFacts(source).filter((f) => !lower.includes(f.toLowerCase()));
}
