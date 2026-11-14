"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import "./globals.css";
import type { Report } from "../lib/types";

const TARGETS = [
  { value: "careful", label: "Live agent — disciplined policy" },
  { value: "reckless", label: "Live agent — reckless policy" },
  { value: "endpoint", label: "My own agent endpoint" }
];

export default function Page() {
  const [mode, setMode] = useState<string>("careful");
  const [name, setName] = useState<string>("InvoiceBot");
  const [endpoint, setEndpoint] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [report, setReport] = useState<Report | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body: { name: string; policy?: string; endpoint?: string } = { name };
      if (mode === "endpoint") body.endpoint = endpoint;
      else body.policy = mode;

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = (await res.json()) as { report?: Report; error?: string };
      if (!res.ok) throw new Error(data.error || "assessment failed");
      setReport(data.report ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const narrative = report?.narrative;

  return (
    <>
      <header>
        <div className="logo">
          KRED<span>PANE</span>
        </div>
        <div className="tag">Independent underwriting for AI agents · assessed with SERV Reasoning</div>
      </header>

      <main>
        <section className="panel form-panel">
          <h1>Submit your AI agent</h1>
          <p className="lede">Evaluate your agent before you give it real-world permissions.</p>

          <form onSubmit={submit}>
            <label htmlFor="name">Agent name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />

            <label htmlFor="mode">Assessment target</label>
            <select id="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
              {TARGETS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="hint">
              Both policies run the same agent on SERV with the same tools and limits. Only the instructions differ.
            </div>

            {mode === "endpoint" && (
              <div>
                <label htmlFor="endpoint">Agent API endpoint</label>
                <input
                  id="endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://your-agent.example/run"
                />
              </div>
            )}

            <button type="submit" disabled={busy}>
              {busy ? "Assessing… running 7 tests" : "Submit for assessment"}
            </button>
            {error ? <div className="err">{error}</div> : null}
          </form>
        </section>

        <section className="panel">
          {!report ? (
            <div className="empty">No assessment yet. Submit an agent to issue a risk certificate.</div>
          ) : (
            <>
              <h2>Risk certificate · {report.agent.name}</h2>
              <div className="grade-row">
                <div className={`grade ${report.grade}`}>{report.grade}</div>
                <div className="metric">
                  risk score<b>{report.riskScore}/100</b>
                </div>
                <div className="metric">
                  annual premium<b>${Number(report.premiumUsd).toLocaleString()}</b>
                </div>
                <div className="metric">
                  tests tripped
                  <b>
                    {report.failedTests}/{report.totalTests}
                  </b>
                </div>
              </div>

              <div className={`allow ${report.canGrantSpendPermission ? "yes" : "no"}`}>
                {report.canGrantSpendPermission ? "Spend permission: granted" : "Spend permission: denied"} ·{" "}
                {report.canGrantToolPermissions ? "tool permissions: granted" : "tool permissions: withheld"}
              </div>

              <table>
                <thead>
                  <tr>
                    <th>result</th>
                    <th>test</th>
                    <th>severity</th>
                    <th>finding</th>
                  </tr>
                </thead>
                <tbody>
                  {report.results.map((r) => (
                    <tr key={r.test}>
                      <td>
                        <span className={`pill ${r.violations.length ? "fail" : "pass"}`}>
                          {r.violations.length ? "fail" : "pass"}
                        </span>
                      </td>
                      <td>
                        <strong>{r.test}</strong>
                        <br />
                        <span className="hint">{r.title}</span>
                      </td>
                      <td>{r.severity}</td>
                      <td className="hint">
                        {r.violations.map((v) => v.rule).join(", ") || (r.judged?.reasoning ? r.judged.reasoning : "—")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="note">
                <p>
                  <strong>Underwriting note</strong> <span className="hint">({narrative?.source ?? "serv"})</span>
                </p>
                <p>{narrative?.summary}</p>
                {narrative && narrative.top_risks.length > 0 ? (
                  <ul>
                    {narrative.top_risks.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}
