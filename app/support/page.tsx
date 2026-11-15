"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import "../globals.css";
import { accepted, summarise } from "../../lib/support";
import type { SupportMessage, SupportTurn } from "../../lib/support";
import type { ReppoVerdict } from "../../lib/reppo";

const STARTERS = [
  "My database keeps timing out during nightly backups.",
  "I was charged twice this month and nobody has replied to my email.",
  "We're getting 500s on writes since this morning."
];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export default function SupportPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [turns, setTurns] = useState<SupportTurn[]>([]);
  const [input, setInput] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [phase, setPhase] = useState<string>("");
  const [elapsed, setElapsed] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [keys, setKeys] = useState<{ serv: boolean; reppo: boolean }>({ serv: true, reppo: true });
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((c: { serv?: boolean; reppo?: boolean }) => setKeys({ serv: Boolean(c.serv), reppo: Boolean(c.reppo) }))
      .catch(() => setKeys({ serv: false, reppo: false }));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);

  async function draft(history: SupportMessage[], feedback?: { score: number; route: string; reason: string; rubric: Record<string, number> }) {
    const res = await fetch("/api/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, feedback })
    });
    const data = (await res.json()) as { reply?: string; constraint?: string | null; error?: string };
    if (!res.ok || !data.reply) throw new Error(data.error || "could not draft a reply");
    return { reply: data.reply, constraint: data.constraint ?? null };
  }

  async function evaluate(userMessage: string, reply: string): Promise<ReppoVerdict> {
    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage, reply })
    });
    const data = (await res.json()) as { id?: string; error?: string };
    if (!res.ok || !data.id) throw new Error(data.error || "could not submit for scoring");

    const deadline = Date.now() + 180_000;
    while (Date.now() < deadline) {
      await sleep(4000);
      const poll = await fetch(`/api/evaluate?id=${data.id}`);
      const verdict = (await poll.json()) as ReppoVerdict & { error?: string };
      if (!poll.ok) throw new Error(verdict.error || "poll failed");
      if (verdict.status === "COMPLETED" || verdict.status === "FAILED") return verdict;
    }
    throw new Error("the panel did not settle within 3 minutes");
  }

  async function send(text: string): Promise<void> {
    const userMessage = text.trim();
    if (!userMessage || busy) return;
    setError("");
    setBusy(true);
    setElapsed(0);
    setInput("");

    const history: SupportMessage[] = [...messages, { role: "user", content: userMessage }];
    setMessages(history);

    const turn: SupportTurn = { user: userMessage, attempts: [], before: null, after: null };

    try {
      setPhase("drafting first reply");
      const first = await draft(history);
      turn.attempts.push({ n: 1, reply: first.reply, score: null, route: null, reason: null, rubric: {}, constraint: null });
      setMessages([...history, { role: "assistant", content: first.reply }]);

      if (!keys.reppo) {
        setTurns((t) => [...t, turn]);
        return;
      }

      setPhase("waiting for the evaluation panel");
      const v1 = await evaluate(userMessage, first.reply);
      turn.attempts[0].score = v1.score;
      turn.attempts[0].route = v1.route;
      turn.attempts[0].reason = v1.reason;
      turn.attempts[0].rubric = v1.rubric;
      turn.before = v1.score;
      turn.after = v1.score;

      if (v1.status !== "FAILED" && v1.score !== null && !accepted(v1.score, v1.route)) {
        setPhase("rewriting against the score");
        const second = await draft(history, {
          score: v1.score,
          route: v1.route ?? "review",
          reason: v1.reason ?? "",
          rubric: v1.rubric
        });
        turn.attempts.push({
          n: 2,
          reply: second.reply,
          score: null,
          route: null,
          reason: null,
          rubric: {},
          constraint: second.constraint
        });
        setMessages([...history, { role: "assistant", content: second.reply }]);

        setPhase("re-scoring the rewrite");
        const v2 = await evaluate(userMessage, second.reply);
        turn.attempts[1].score = v2.score;
        turn.attempts[1].route = v2.route;
        turn.attempts[1].reason = v2.reason;
        turn.attempts[1].rubric = v2.rubric;
        turn.after = v2.score ?? v1.score;
      }

      setTurns((t) => [...t, turn]);
    } catch (err) {
      setError((err as Error).message);
      setTurns((t) => [...t, turn]);
    } finally {
      setPhase("");
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    void send(input);
  }

  const stats = summarise(turns);

  return (
    <>
      <header>
        <div className="logo">
          RATCH<span>ET</span>
        </div>
        <div className="tag">Every reply is scored, then rewritten against that score · SERV Reasoning + Reppo</div>
        <a className="navlink" href="/">
          ← underwriting
        </a>
      </header>

      <main className="sup-main">
        <section className="sup-chat">
          {messages.length === 0 ? (
            <div className="sup-empty">
              <p>The first reply is deliberately unpolished. The panel scores it, then the reply is rewritten under that score.</p>
              <div className="sup-starters">
                {STARTERS.map((s) => (
                  <button key={s} className="sup-chip" onClick={() => void send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m, i) => (
            <div key={i} className={`sup-bubble ${m.role === "user" ? "user" : "agent"}`}>
              {m.content}
              <span className="sup-meta">{m.role === "user" ? "customer" : "support agent"}</span>
            </div>
          ))}

          {busy ? (
            <div className="sup-status">
              <span className="sup-dot" />
              {phase || "working"} · {elapsed}s
            </div>
          ) : null}
          {error ? <div className="sup-err">{error}</div> : null}
          <div ref={endRef} />
        </section>

        <aside className="sup-rail">
          <h1>Run ledger</h1>
          <p className="sup-lede">Scores come from an independent panel. The critique is handed to the rewrite as a hard constraint.</p>

          {!keys.serv ? <div className="sup-warn">SERV_API_KEY is not set. No replies can be drafted.</div> : null}
          {!keys.reppo ? (
            <div className="sup-warn">REPPO_API_KEY is not set. The agent still answers, but nothing is scored and the loop never triggers.</div>
          ) : null}

          <div className="sup-summary">
            <h2 style={{ margin: "0 0 8px" }}>Before / after</h2>
            <div className="sup-big">
              <b>{stats.before ?? "—"}</b>
              <span className="sup-arrow">→</span>
              <b>{stats.after ?? "—"}</b>
              {stats.delta !== null ? <span className={`sup-delta ${stats.delta <= 0 ? "zero" : ""}`}>{stats.delta > 0 ? `+${stats.delta}` : stats.delta}</span> : null}
            </div>
            <p className="sup-lede" style={{ margin: "8px 0 0" }}>
              mean first-reply score vs mean accepted score, across {stats.scored} scored turn{stats.scored === 1 ? "" : "s"}.
            </p>
          </div>

          {turns.map((t, i) => (
            <div className="sup-turn" key={i}>
              <div className="sup-q">{t.user}</div>
              {t.attempts.map((a) => (
                <div key={a.n}>
                  <div className="sup-score-row">
                    <span className={`sup-score ${accepted(a.score, a.route) ? "pass" : "fail"}`}>{a.score ?? "—"}</span>
                    {a.route ? <span className={`route ${a.route}`}>{a.route}</span> : null}
                    <span className="sup-lede" style={{ margin: 0 }}>
                      attempt {a.n}
                    </span>
                  </div>
                  {a.reason ? <p className="sup-critique">{a.reason}</p> : null}
                  {Object.keys(a.rubric).length > 0 ? (
                    <div className="sup-rubric">
                      {Object.entries(a.rubric).map(([k, v]) => (
                        <span key={k}>
                          {k} {v}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {a.constraint ? (
                    <details style={{ marginTop: 8 }}>
                      <summary className="sup-critique" style={{ cursor: "pointer" }}>
                        constraint passed to the rewrite
                      </summary>
                      <p className="sup-critique" style={{ whiteSpace: "pre-wrap" }}>
                        {a.constraint}
                      </p>
                    </details>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </aside>
      </main>

      <form className="sup-composer" onSubmit={onSubmit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a customer message…" disabled={busy} />
        <button type="submit" disabled={busy || !input.trim()}>
          {busy ? "working" : "send"}
        </button>
      </form>
    </>
  );
}
