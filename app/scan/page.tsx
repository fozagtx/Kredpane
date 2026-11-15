"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Review } from "../../lib/contract";
import { NotchNavbar } from "../../components/ui/notch-navbar";
import LogoIcon from "../../assets/logo/logo-icon";

const SAMPLE = `GOLDEN FITNESS — MEMBERSHIP AGREEMENT

1. Term. This agreement begins on the start date and automatically renews for successive 12-month periods unless cancelled in writing 90 days before the renewal date.

2. Fees. Monthly dues are $49.99. A late fee of $15 applies to any payment more than 5 days overdue, plus interest at 18% per annum.

3. Cancellation. Members may cancel only in person at the home club. The annual maintenance fee of $59 is non-refundable.

4. Changes. We may change these terms, fees, or club locations at any time without notice.

5. Liability. Member agrees to indemnify and hold harmless the club from any and all claims.

6. Disputes. Any dispute shall be resolved by binding arbitration, and member waives the right to participate in a class action.

7. Termination. We may terminate this agreement at any time for any reason.

8. Governing law. This agreement is governed by the laws of the State of Delaware.`;

const TARGETS = [
  { value: 10, label: "low risk" },
  { value: 25, label: "medium" },
  { value: 40, label: "only the worst" }
];

export default function ScanPage() {
  const [source, setSource] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [tab, setTab] = useState<"paste" | "upload">("paste");
  const [target, setTarget] = useState<string>("25");
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [extracting, setExtracting] = useState<boolean>(false);
  const [docName, setDocName] = useState<string>("");
  const [emailHint, setEmailHint] = useState<boolean>(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function onFile(file: File): Promise<void> {
    setExtracting(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: form });
      const data = (await res.json()) as { text?: string; name?: string; chars?: number; error?: string };
      if (!res.ok || !data.text) throw new Error(data.error || "could not read the file");
      setSource(data.text);
      setDocName(`${data.name} · ${data.chars} characters`);
      setTab("paste");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExtracting(false);
    }
  }

  async function run(): Promise<void> {
    setBusy(true);
    setError("");
    try {
      const text = company.trim() ? `Company under review: ${company.trim()}\n\n${source}` : source;
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target: Number(target) })
      });
      const data = (await res.json()) as Review & { error?: string };
      if (!res.ok) throw new Error(data.error || "could not review the contract");
      sessionStorage.setItem("kredpane:result", JSON.stringify(data));
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

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

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <a href="/" className="text-[11px] font-bold uppercase tracking-[1.2px] text-[color:var(--muted)] hover:text-[color:var(--fg)]">
          ← Back
        </a>
        <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight mt-4 mb-2">Scan a contract</h1>
        <p className="text-[color:var(--muted)] mb-8">
          Paste the terms, upload a PDF, or drop a photo of the paperwork. Nothing is stored.
        </p>

        <div className="bg-white rounded-[30px] p-2 md:p-4 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)]">
          <div className="flex flex-wrap items-center gap-2 p-4 pb-0 mb-6">
            <button
              onClick={() => {
                setTab("upload");
                fileRef.current?.click();
              }}
              className={`px-6 py-3 rounded-full text-[13px] font-bold uppercase tracking-[1px] transition-colors ${
                tab === "upload" ? "bg-[#d6ff34] text-black" : "bg-[color:var(--s2)] text-[color:var(--muted)] hover:bg-[color:var(--s3)]"
              }`}
            >
              {extracting ? "Reading…" : "Upload PDF"}
            </button>
            <button
              onClick={() => setTab("paste")}
              className={`px-6 py-3 rounded-full text-[13px] font-bold uppercase tracking-[1px] transition-colors ${
                tab === "paste" ? "bg-[#d6ff34] text-black" : "bg-[color:var(--s2)] text-[color:var(--muted)] hover:bg-[color:var(--s3)]"
              }`}
            >
              Paste text
            </button>
            <button
              onClick={() => setEmailHint(true)}
              className="px-6 py-3 rounded-full text-[13px] font-bold uppercase tracking-[1px] bg-[color:var(--s2)] text-[color:var(--muted)] hover:bg-[color:var(--s3)] transition-colors"
            >
              From Email
            </button>
            <button
              onClick={() => setSource(SAMPLE)}
              className="px-4 py-3 rounded-full text-[11px] font-bold uppercase tracking-[1px] text-[color:var(--muted)] hover:text-[color:var(--fg)]"
            >
              Use sample
            </button>
            <span className="text-[11px] text-[color:var(--muted)] ml-auto hidden md:block">
              {docName || "PDF, PNG, JPEG or WebP"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFile(file);
                e.target.value = "";
              }}
            />
          </div>

          <div className="px-4 pb-4">
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="COMPANY NAME (OPTIONAL)"
              className="w-full bg-[color:var(--s2)] border border-[color:var(--line)] rounded-[12px] px-6 py-4 mb-4 text-sm font-bold uppercase tracking-wider text-[color:var(--fg)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-[color:var(--line-strong)]"
            />
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              spellCheck={false}
              placeholder="Paste the Terms of Service, Privacy Policy, or contract here..."
              className="w-full h-[320px] bg-[color:var(--s2)] border border-[color:var(--line)] rounded-[20px] p-6 text-base text-[color:var(--fg)] placeholder:text-[color:var(--muted)] resize-none focus:outline-none focus:border-[color:var(--line-strong)]"
            />
            {emailHint ? (
              <p className="text-[11px] text-[color:var(--muted)] mt-2">
                Email import is not connected yet — paste the email text into the box above.
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3 p-4 pt-2">
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="bg-[color:var(--s2)] text-[color:var(--fg)] border border-[color:var(--line-strong)] rounded-full px-4 py-3 text-[11px] font-bold uppercase tracking-[1px] focus:outline-none"
            >
              {TARGETS.map((t) => (
                <option key={t.value} value={t.value}>
                  aim: {t.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => void run()}
              disabled={busy || source.trim().length < 60}
              className="flex-1 py-5 rounded-full bg-[#d6ff34] text-black text-lg font-bold uppercase tracking-[2px] hover:bg-[#c9f22b] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? "Scanning…" : "Scan now →"}
            </button>
          </div>
          {error ? <p className="px-4 pb-4 text-sm font-semibold text-[#b91c1c]">{error}</p> : null}
          {source.trim().length > 0 && source.trim().length < 60 ? (
            <p className="px-4 pb-4 text-[11px] text-[color:var(--muted)]">Paste a bit more — at least a few clauses.</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
