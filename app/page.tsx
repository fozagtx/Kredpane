"use client";

import { useState } from "react";
import { NotchNavbar } from "../components/ui/notch-navbar";
import LogoIcon from "../assets/logo/logo-icon";

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
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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

      <section id="top" className="grid-pattern bg-white border-b border-[color:var(--line)] rounded-b-[64px] pt-32 pb-28 relative z-40">
        <div className="max-w-[1700px] mx-auto px-6">
          <div className="text-center max-w-5xl mx-auto mb-12">
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

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/scan"
              className="px-10 py-5 rounded-full bg-[#d6ff34] text-black text-base font-bold uppercase tracking-[2px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.25)] hover:bg-[#c9f22b] active:scale-[0.98] transition-all"
            >
              Scan a contract →
            </a>
            <a
              href="#how"
              className="px-10 py-5 rounded-full border border-[color:var(--line-strong)] text-[12px] font-bold uppercase tracking-[1.4px] hover:bg-white transition-colors"
            >
              How it works
            </a>
          </div>
          <p className="text-center text-[11px] font-bold uppercase tracking-[1.2px] text-[color:var(--muted)] mt-6">
            Paste text · Upload a PDF · Drop a photo
          </p>
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
          <div className="flex justify-center mt-12">
            <a
              href="/scan"
              className="px-8 py-4 rounded-full bg-[#d6ff34] text-black text-[13px] font-bold uppercase tracking-[1.6px] hover:bg-[#c9f22b] transition-colors"
            >
              Start a scan →
            </a>
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
                <a href="/scan" className="kp-link text-[12px] font-bold uppercase tracking-wide text-[color:var(--muted)]">Scan a contract</a>
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
