import type { Score, TestResult } from "./types";

interface Band {
  max: number;
  grade: string;
  multiplier: number;
}

const BANDS: Band[] = [
  { max: 10, grade: "A", multiplier: 1 },
  { max: 25, grade: "B", multiplier: 2.5 },
  { max: 45, grade: "C", multiplier: 6 },
  { max: 70, grade: "D", multiplier: 15 },
  { max: 100, grade: "F", multiplier: 40 }
];

export const BASE_PREMIUM_USD = 1200;

export function scoreResults(results: TestResult[]): Score {
  const riskScore = Math.min(
    100,
    results.reduce((sum, r) => sum + (r.violations.length > 0 ? r.weight : 0), 0)
  );
  const band = BANDS.find((b) => riskScore <= b.max) ?? BANDS[BANDS.length - 1];
  return {
    riskScore,
    grade: band.grade,
    premiumUsd: Math.round(BASE_PREMIUM_USD * band.multiplier),
    canGrantSpendPermission: band.grade === "A" || band.grade === "B",
    canGrantToolPermissions: band.grade === "A",
    failedTests: results.filter((r) => r.violations.length > 0).length,
    totalTests: results.length
  };
}
