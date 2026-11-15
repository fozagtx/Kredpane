"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Review } from "../../lib/contract";
import type { ReppoVerdict } from "../../lib/reppo";
import { NotchNavbar } from "../../components/ui/notch-navbar";
import LogoIcon from "../../assets/logo/logo-icon";

export default function DashboardPage() {
  const [review, setReview] = useState<Review | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const [panel, setPanel] = useState<{ status: "idle" | "pending" | "done" | "error"; verdict?: ReppoVerdict; error?: string }>({
    status: "idle"
  });
  const router = useRouter();

  useEffect(() => {
    const raw = sessionStorage.getItem("kredpane:result");
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      setReview(JSON.parse(raw) as Review);
      setReady(true);
    } catch {
      router.replace("/");
    }
  }, [router]);

  async function checkWithPanel(): Promise<void> {
    if (!review) return;
    setPanel({ status: "pending" });
    try {
      const final = review.passes[review.passes.length - 1].text;
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: "A consumer contract revised to remove unfair terms.", reply: final })
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error || "could not submit");

      const deadline = Date.now() + 240_000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 4000));
        const poll = await fetch(`/api/evaluate?id=${data.id}`);
        const verdict = (await poll.json()) as ReppoVerdict & { error?: string };
        if (!poll.ok) throw new Error(verdict.error || "poll failed");
        if (verdict.status === "COMPLETED" || verdict.status === "FAILED") {
          setPanel({ status: "done", verdict });
          return;
        }
      }
      throw new Error("panel did not settle");
    } catch (err) {
      setPanel({ status: "error", error: (err as Error).message });
    }
  }

  if (!ready || !review) {
    return <main className="min-h-screen bg-[color:var(--page)] grid place-items-center text-sm text-[color:var(--muted)]">Loading…</main>;
  }

  const finalPass = review.passes[review.passes.length - 1];
  const remaining = finalPass.analysis.findings;
  const factsKept = review.facts - finalPass.missed.length;
  const hit = finalPass.analysis.riskScore <= review.target;

  return (
    <main className="min-h-screen bg-[color:var(--page)] text-[color:var(--fg)]">
      <NotchNavbar
        showNav={false}
        logo={
          <a href="/" className="flex items-center justify-center">
            <span className="w-8 h-8 rounded-[8px] bg-[#d6ff34] flex items-center justify-center">
              <LogoIcon className="w-5 h-5 text-black" />
            </span>
          </a>
        }
      />

      <div className="max-w-[1700px] mx-auto px-6 pt-28 pb-16">
        <div className="flex items-baseline gap-4 flex-wrap mb-8">
          <div className="flex items-baseline gap-3">
            <span className="text-[48px] md:text-[72px] font-bold leading-none text-[#3d5500]">{review.before.riskScore}</span>
            <span className="text-2xl text-[color:var(--muted)]">→</span>
            <span className="text-[48px] md:text-[72px] font-bold leading-none" style={{ color: hit ? "#0f7a4a" : "#0f6b7a" }}>
              {review.after.riskScore}
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[1.4px] text-[color:var(--muted)]">Risk score after rewrite</p>
            <p className="text-sm text-[color:var(--muted)] mt-1">
              {review.fixed} of {review.before.findings.length} unfair terms removed · {factsKept} of {review.facts} numbers kept
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a
              href="/"
              className="px-5 py-2.5 rounded-full border border-[color:var(--line-strong)] text-[11px] font-bold uppercase tracking-[1px] hover:bg-white transition-colors"
            >
              ← Scan another
            </a>
            <button
              onClick={() => void checkWithPanel()}
              disabled={panel.status === "pending"}
              className="px-5 py-2.5 rounded-full bg-[#d6ff34] text-black text-[11px] font-bold uppercase tracking-[1px] hover:bg-[#c9f22b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {panel.status === "pending" ? "Panel…" : "Independent panel check"}
            </button>
          </div>
        </div>

        {panel.status === "done" && panel.verdict ? (
          <div className="mb-6 bg-white rounded-[20px] p-4 border border-[color:var(--line)]">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-[#3d5500]">{panel.verdict.score ?? "—"}</span>
              <span className="text-[11px] font-bold uppercase tracking-[1.2px] text-[color:var(--muted)]">
                {panel.verdict.route} · {panel.verdict.confidence}
              </span>
            </div>
            {panel.verdict.reason ? <p className="text-sm text-[color:var(--muted)] mt-2">{panel.verdict.reason}</p> : null}
          </div>
        ) : null}
        {panel.status === "error" ? <p className="text-sm font-semibold text-[#b91c1c] mb-4">{panel.error}</p> : null}

        <div className="flex flex-col lg:flex-row gap-4">
          <Panel title={`The contract · risk ${review.before.riskScore}`}>
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-[#111111]">{review.passes[0].text}</p>
          </Panel>

          <Panel title={`Rewritten · risk ${finalPass.analysis.riskScore}`} accent={hit ? "#0f7a4a" : "#0f6b7a"}>
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-[#111111]">{finalPass.text}</p>
          </Panel>

          <Panel title="What we caught">
            <div className="flex flex-col gap-2.5">
              {review.before.findings.length === 0 ? <p className="text-sm text-[color:var(--muted)]">No traps found in this text.</p> : null}
              {review.before.findings.map((f) => {
                const stillThere = remaining.some((r) => r.id === f.id);
                const accent = f.severity === "critical" ? "#b91c1c" : f.severity === "high" ? "#3d5500" : "#0f6b7a";
                return (
                  <div key={f.id} className="bg-white rounded-[16px] p-3 border border-[color:var(--line)]" style={{ borderLeft: `4px solid ${accent}` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-[1.2px]" style={{ color: accent }}>{f.severity}</span>
                      <span
                        className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[1px]"
                        style={{
                          background: stillThere ? "rgba(220,38,38,0.10)" : "rgba(15,122,74,0.10)",
                          color: stillThere ? "#b91c1c" : "#0f7a4a"
                        }}
                      >
                        {stillThere ? "still there" : "fixed"}
                      </span>
                    </div>
                    <p className="text-[12px] font-bold mt-2 leading-snug">{f.label}</p>
                    <p className="text-[11px] text-[color:var(--muted)] mt-1 leading-snug">{f.ask}</p>
                  </div>
                );
              })}
              <p className="text-[10px] text-[color:var(--muted)]">Not legal advice. These are the terms worth questioning before you sign.</p>
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}

function Panel({ title, accent = "#3d5500", children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 min-w-0 bg-white rounded-[24px] overflow-hidden border border-[color:var(--line)]">
      <div className="px-4 py-3 border-b border-[color:var(--line)]">
        <p className="text-[10px] font-bold uppercase tracking-[1.2px]" style={{ color: accent }}>{title}</p>
      </div>
      <div className="p-4 max-h-[70vh] overflow-y-auto">{children}</div>
    </div>
  );
}
