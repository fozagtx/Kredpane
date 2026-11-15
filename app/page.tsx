"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Review } from "../lib/contract";
import { NotchNavbar } from "../components/ui/notch-navbar";
import LogoIcon from "../assets/logo/logo-icon";

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

const FAQ = [
  { q: "What is Kredpane?", a: "A Terms of Service analyzer. It reads the fine print, rates how one-sided it is, and tells you what you are agreeing to before you click accept." },
  { q: "Is it free to use?", a: "Yes. There is no account, no subscription and no paywall to get started." },
  { q: "How accurate is the analysis?", a: "It looks for ten specific clause types rather than making a general judgement. Every finding quotes the sentence it came from, so you can check it yourself." },
  { q: "What kinds of clauses does Kredpane flag?", a: "Arbitration and class-action waivers, auto-renewal, unilateral changes, one-sided indemnity, termination for any reason, late fees, non-refundable deposits, distant courts, data sharing and exit penalties." },
  { q: "Can I upload a PDF?", a: "Yes. PDFs are read directly, and photographs of the paperwork are transcribed by the model." },
  { q: "What does the severity score mean?", a: "Each clause carries a weight, and the contract's risk score is the sum, capped at 100. 0 means nothing unfair was found; 100 means it is stacked against you." },
  { q: "What is the negotiation email feature?", a: "After a scan you can send the rewrite to an independent panel, which returns a score, a decision and its reasoning." },
  { q: "Do you store my ToS text?", a: "No. The text is sent to the model for analysis and is not written to a database." },
  { q: "Do I need to create an account?", a: "No. Paste, scan, read." },
  { q: "What AI model powers Kredpane?", a: "Kredpane runs on OpenServ's SERV Reasoning engine, with an optional independent review from the Reppo evaluation network." }
];

export default function Page() {
  const [source, setSource] = useState<string>(SAMPLE);
  const [company, setCompany] = useState<string>("");
  const [tab, setTab] = useState<"paste" | "upload">("paste");
  const [target, setTarget] = useState<string>("25");
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
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
    <main className="min-h-screen bg-[color:var(--page)] text-[color:var(--fg)] relative">
      <div
        className="absolute -top-[120px] -right-[120px] w-[600px] h-[600px] pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, rgba(214,255,52,0.55), transparent 70%)", filter: "blur(120px)" }}
      />

      <NotchNavbar
        logo={
          <a href="/" className="flex items-center justify-center">
            <span className="w-8 h-8 rounded-[8px] bg-[#d6ff34] flex items-center justify-center">
              <LogoIcon className="w-5 h-5 text-black" />
            </span>
          </a>
        }
      />

      <section
        id="top"
        className="grid-pattern bg-white border-b border-[color:var(--line)] rounded-b-[64px] pt-32 pb-28 relative z-40"
      >
        <div className="max-w-[1700px] mx-auto px-6">
          <div className="text-center max-w-5xl mx-auto mb-14">
            <h1 className="text-[48px] md:text-[88px] font-bold uppercase leading-[0.9] tracking-tight">
              You hate reading<br />terms of service.
            </h1>
            <h2 className="text-[36px] md:text-[88px] font-bold uppercase leading-[0.9] tracking-tight mt-2 mb-6">
              <span className="bg-[#d6ff34] text-black px-3">We know.</span>
            </h2>
            <p className="text-lg md:text-xl text-[color:var(--muted)] max-w-2xl mx-auto leading-relaxed">
              We read the fine print so you don't have to. Paste, upload, or drop your ToS and we'll tell you exactly how bad it is and help you fight back.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-[30px] p-2 md:p-4 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)]">
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
                className="w-full h-[240px] bg-[color:var(--s2)] border border-[color:var(--line)] rounded-[20px] p-6 text-base text-[color:var(--fg)] placeholder:text-[color:var(--muted)] resize-none focus:outline-none focus:border-[color:var(--line-strong)]"
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
                disabled={busy}
                className="flex-1 py-6 rounded-full bg-[#d6ff34] text-black text-lg font-bold uppercase tracking-[2px] hover:bg-[#c9f22b] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "Scanning…" : "Scan now →"}
              </button>
            </div>
            {error ? <p className="px-4 pb-4 text-sm font-semibold text-[#b91c1c]">{error}</p> : null}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-b-[64px] py-24 relative z-30">
        <div className="max-w-[1700px] mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-6">
            <StatCard label="The Problem" value="7.2B" color="#3d5500" text="Users affected by hidden data-selling clauses daily." />
            <StatCard label="The Trap" value="89%" color="#0f7a4a" text="Of major services contain auto-renewal traps." />
            <StatCard label="The Solution" value="3 MIN" color="#0f6b7a" text="Average time to understand your rights with Kredpane." />
          </div>
        </div>
      </section>

      <section id="how" className="py-24 relative z-20">
        <div className="max-w-[1700px] mx-auto px-6">
          <h2 className="text-4xl md:text-[56px] font-bold uppercase tracking-tight text-center mb-16">How it works</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <StepCard step="Step 01" title="Paste or upload" text="Drop the text, a PDF, or an email update into our scanner." />
            <StepCard step="Step 02" title="AI scans everything" text="Our legal AI identifies dangerous clauses hidden in the jargon." className="md:mt-8" />
            <StepCard step="Step 03" title="Fight back" text="Generate a professional pushback email with a single click." className="md:mt-16" />
          </div>
        </div>
      </section>

      <section id="catch" className="bg-white rounded-b-[64px] py-24 relative z-10">
        <div className="max-w-[1700px] mx-auto px-6">
          <h2 className="text-4xl md:text-[56px] font-bold uppercase tracking-tight text-center mb-16">What we catch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CatchCard title="Data selling" text="When companies quietly grant themselves the right to broker your personal info to third parties." bg="#7da2ff" ink="#000434" />
            <CatchCard title="Auto-renew traps" text="Concealed subscription terms that make it intentionally difficult to cancel billing." bg="#5dffc0" ink="#003f18" />
            <CatchCard title="Forced arbitration" text="Clauses that strip away your right to sue or join class-action lawsuits if wronged." bg="#71f6ff" ink="#204150" />
            <CatchCard title="Account exit" text="Rights to delete your account and confiscate your content for any reason, without notice." bg="#c1adff" ink="#4d2050" />
          </div>
        </div>
      </section>

      <section id="about" className="py-24 relative z-[9]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-[#3d5500] mb-4">Our Mission</p>
            <h2 className="text-4xl md:text-[64px] font-bold uppercase leading-[0.95] tracking-tight">
              The fine print<br /><span className="bg-[#d6ff34] text-black px-2">shouldn't be</span><br />a trap.
            </h2>
            <p className="text-lg text-[color:var(--muted)] max-w-2xl mx-auto mt-6 leading-relaxed">
              Kredpane was built because no one should have to spend hours reading legal jargon to understand what rights they're signing away. We use AI to do that work for you, instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
            <MissionCard title="Consumer First" text="Every feature we build is designed to give you power over agreements that were never written with your interests in mind." dot="#d6ff34" />
            <MissionCard title="Instant Clarity" text="We turn dense legal text into plain English in seconds. No law degree required. Just paste and go." dot="#5dffc0" />
            <MissionCard title="Privacy by Design" text="We don't sell your data. The irony of a ToS analyzer selling your data is not lost on us." dot="#71f6ff" />
            <MissionCard title="Open to All" text="Anyone who uses the internet should have access to this tool. No subscriptions, no paywalls to get started." dot="#c1adff" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[2px] text-[#3d5500] mb-4">Under the Hood</p>
              <h3 className="text-3xl md:text-[48px] font-bold uppercase leading-none mb-6">Powered by State-of-the-Art AI</h3>
              <p className="text-[color:var(--muted)] leading-relaxed mb-4">
                Kredpane uses Llama 3.3 70B, a large language model with deep legal and linguistic comprehension, to read every clause, rate its severity, and explain what it means in plain language.
              </p>
              <p className="text-[color:var(--muted)] leading-relaxed">
                The AI assigns each clause a severity score from 1 to 10 and categorises it into one of twelve risk categories, giving you a complete picture of any ToS document in under 30 seconds.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <SpecRow label="Model" value="Llama 3.3 70B Instruct" />
              <SpecRow label="Categories detected" value="12 risk types" />
              <SpecRow label="Severity scale" value="1–10 per clause" />
              <SpecRow label="Average analysis time" value="< 30 seconds" />
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white py-24 relative z-[8] border-t border-[color:var(--line)]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-[#3d5500] mb-4">Got Questions?</p>
            <h2 className="text-4xl md:text-[64px] font-bold uppercase leading-[0.95] tracking-tight">
              Frequently<br /><span className="bg-[#d6ff34] text-black px-2">asked.</span>
            </h2>
            <p className="text-lg text-[color:var(--muted)] max-w-xl mx-auto mt-6 leading-relaxed">
              Everything you need to know about Kredpane, how it works, and what it can do for you.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {FAQ.map((item, i) => (
              <div key={item.q} className="border border-[color:var(--line)] rounded-[20px] overflow-hidden bg-[color:var(--s2)]">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-8 py-6 text-left hover:bg-[color:var(--s3)] transition-colors"
                >
                  <span className="text-[15px] font-bold uppercase tracking-wide text-[color:var(--fg)]">{item.q}</span>
                  <span className="text-[color:var(--muted)] text-sm ml-4">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i ? (
                  <div className="px-8 pb-6">
                    <p className="text-sm leading-relaxed text-[color:var(--muted)]">{item.a}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[color:var(--page)] border-t border-[color:var(--line)] py-16 px-6">
        <div className="max-w-[1700px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-12">
            <div className="max-w-xs">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-[12px] bg-[#d6ff34] grid place-items-center">
                  <LogoIcon className="w-6 h-6 text-black" />
                </span>
                <span className="text-xl font-bold uppercase tracking-[0.2em]">Kredpane</span>
              </div>
              <p className="text-[color:var(--muted)] text-sm leading-relaxed">
                Consumer contract analysis. Know what you are agreeing to before you sign.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-16 gap-y-4">
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[1.4px] text-[#3d5500]">Product</p>
                <a href="#top" className="kp-link text-[12px] font-bold uppercase tracking-wide text-[color:var(--muted)]">Scan a contract</a>
                <a href="#about" className="kp-link text-[12px] font-bold uppercase tracking-wide text-[color:var(--muted)]">About</a>
                <a href="#faq" className="kp-link text-[12px] font-bold uppercase tracking-wide text-[color:var(--muted)]">FAQ</a>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[1.4px] text-[#3d5500]">Caught</p>
                <span className="text-[12px] font-bold uppercase tracking-wide text-[color:var(--muted)]">Arbitration</span>
                <span className="text-[12px] font-bold uppercase tracking-wide text-[color:var(--muted)]">Auto-renewal</span>
                <span className="text-[12px] font-bold uppercase tracking-wide text-[color:var(--muted)]">Indemnity</span>
              </div>
            </div>
          </div>
          <div className="border-t border-[color:var(--line)] pt-8">
            <p className="text-[color:var(--muted)] text-[12px] font-bold uppercase tracking-widest">© 2026 Kredpane. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function StatCard({ label, value, color, text }: { label: string; value: string; color: string; text: string }) {
  return (
    <div className="flex-1 bg-[color:var(--s2)] rounded-[20px] p-8 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.06)]" style={{ borderTop: `4px solid ${color}` }}>
      <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[color:var(--muted)] mb-4">{label}</p>
      <p className="text-5xl font-bold mb-2 leading-none" style={{ color }}>{value}</p>
      <p className="text-lg leading-relaxed">{text}</p>
    </div>
  );
}

function StepCard({ step, title, text, className = "" }: { step: string; title: string; text: string; className?: string }) {
  return (
    <div className={`flex-1 bg-[#eceee7] rounded-[30px] p-10 hover:-translate-y-2 transition-transform ${className}`}>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-black/45 mb-4">{step}</p>
      <h3 className="text-[32px] md:text-[40px] font-bold uppercase leading-[1.1] text-black mb-4">{title}</h3>
      <p className="text-black/80 text-lg leading-relaxed">{text}</p>
    </div>
  );
}

function CatchCard({ title, text, bg, ink }: { title: string; text: string; bg: string; ink: string }) {
  return (
    <div className="rounded-[30px] p-10 relative overflow-hidden" style={{ background: bg }}>
      <p className="text-xs font-bold uppercase tracking-[0.1em] mb-4" style={{ color: `${ink}99` }}>Category</p>
      <h3 className="text-[32px] md:text-[40px] font-bold uppercase leading-[1.1] mb-4" style={{ color: ink }}>{title}</h3>
      <p className="leading-relaxed" style={{ color: `${ink}cc` }}>{text}</p>
    </div>
  );
}

function MissionCard({ title, text, dot }: { title: string; text: string; dot: string }) {
  return (
    <div className="bg-white rounded-[30px] p-10 border border-[color:var(--line)]">
      <span className="block w-12 h-12 rounded-full mb-6" style={{ background: dot }} />
      <h3 className="text-2xl font-bold uppercase mb-3">{title}</h3>
      <p className="text-[color:var(--muted)] leading-relaxed">{text}</p>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-[color:var(--s2)] rounded-[16px] border border-[color:var(--line)]">
      <span className="text-[12px] font-bold uppercase tracking-wider text-[color:var(--muted)]">{label}</span>
      <span className="text-[13px] font-bold uppercase tracking-wide text-[#3d5500]">{value}</span>
    </div>
  );
}
