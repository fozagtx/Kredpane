export interface Clause {
  n: number;
  text: string;
}

export function splitClauses(text: string): Clause[] {
  const parts = text.split(/(?=^\s*\d+[.)]\s)/m);
  const out: Clause[] = [];
  for (const part of parts) {
    const match = part.match(/^\s*(\d+)[.)]\s/);
    if (!match) continue;
    out.push({ n: Number(match[1]), text: part.trim() });
  }
  return out;
}

export function linkable(original: string, rewritten: string): boolean {
  const a = splitClauses(original);
  const b = splitClauses(rewritten);
  return a.length >= 2 && a.length === b.length && a.every((c, i) => c.n === b[i].n);
}
