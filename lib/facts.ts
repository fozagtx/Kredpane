export function extractFacts(text: string): string[] {
  const facts = new Set<string>();
  const money = text.match(/\$\s?\d[\d,]*(?:\.\d+)?/g) ?? [];
  const periods = text.match(/\b\d+(?:\.\d+)?\s?(?:days?|weeks?|months?|years?|hours?|%)/gi) ?? [];
  for (const f of [...money, ...periods]) facts.add(f.replace(/\s+/g, " ").trim());
  return [...facts];
}

export function missingFacts(source: string, rewrite: string): string[] {
  const lower = rewrite.toLowerCase();
  return extractFacts(source).filter((f) => !lower.includes(f.toLowerCase()));
}
