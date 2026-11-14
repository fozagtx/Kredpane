import { assess } from "./lib/runner";
import type { AgentSpec, Report } from "./lib/types";

const args = process.argv.slice(2);
const base = process.env.KREDPANE_BASE || "http://localhost:3000";
const compare = args.includes("--compare");
const nameFlag = args.indexOf("--name");
const endpointFlag = args.indexOf("--endpoint");

function line(c = "─"): string {
  return c.repeat(64);
}

function printReport(report: Report): void {
  console.log("");
  console.log(line());
  console.log(`  ${report.agent.name}`);
  console.log(line());
  console.log(`  grade ${report.grade}   risk ${report.riskScore}/100   premium $${report.premiumUsd.toLocaleString()}/yr`);
  console.log(`  ${report.failedTests}/${report.totalTests} tests tripped   judge: ${report.serv}`);
  console.log(`  ${report.canGrantSpendPermission ? "PERMISSIONS: spend allowed" : "PERMISSIONS: spend denied"}`);
  console.log(line());
  for (const r of report.results) {
    const mark = r.violations.length ? "FAIL" : "pass";
    console.log(`  [${mark}] ${r.test.padEnd(20)} ${r.severity.padEnd(9)} ${r.violations.map((v) => v.rule).join(", ")}`);
  }
  if (report.narrative?.summary) {
    console.log(line());
    console.log(`  ${report.narrative.summary}`);
    for (const risk of report.narrative.top_risks ?? []) console.log(`   - ${risk}`);
  }
  console.log(line());
}

async function runOne(spec: AgentSpec): Promise<Report> {
  const report = await assess(spec, {
    onTest: (t) => process.stderr.write(`  ${t.violations.length ? "x" : "."}`)
  });
  process.stderr.write("\n");
  printReport(report);
  return report;
}

const specs: AgentSpec[] = compare
  ? [
      { name: "InvoiceBot (disciplined policy)", endpoint: `${base}/api/agent?policy=careful`, timeoutMs: 120000 },
      { name: "InvoiceBot (reckless policy)", endpoint: `${base}/api/agent?policy=reckless`, timeoutMs: 120000 }
    ]
  : [
      {
        name: nameFlag !== -1 ? String(args[nameFlag + 1]) : "submitted agent",
        endpoint: endpointFlag !== -1 ? String(args[endpointFlag + 1]) : `${base}/api/agent?policy=careful`,
        timeoutMs: 120000
      }
    ];

const reports: Report[] = [];
for (const spec of specs) reports.push(await runOne(spec));

if (reports.length === 2) {
  const [a, b] = reports;
  console.log("");
  console.log(
    `  spread: grade ${a.grade} vs ${b.grade}   premium $${a.premiumUsd.toLocaleString()} vs $${b.premiumUsd.toLocaleString()}   ratio ${(b.premiumUsd / a.premiumUsd).toFixed(1)}x`
  );
  console.log("");
}
