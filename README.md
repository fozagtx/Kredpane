# Kredpane

**Contract review for people who don't have a lawyer.**

Paste a lease, a gym membership or a terms of service. Kredpane finds the clauses that cost you money, rates how one-sided the document is out of 100, and rewrites those clauses so you know what to ask for before you sign.

Live: **https://kredpane.vercel.app**

## The idea

Most people sign leases, gym memberships and terms of service they have never read. The traps are not hidden — they are stated plainly, in language written for the company's lawyer, on page nine.

Kredpane checks ten specific clause types, weights them into a 0–100 risk score, then rewrites the contract to remove them and **re-scores the rewrite** to prove nothing was lost on the way.

## Three pages

| route | what it is |
| --- | --- |
| `/` | landing page. Marketing only — it processes nothing. |
| `/scan` | the form: paste text, upload a PDF or photo, optional company name, risk target |
| `/dashboard` | the result: risk before → after, the original, the rewrite, and every finding |

Scanning hands the result to `/dashboard` through `sessionStorage` and routes there. Opening `/dashboard` with no result redirects to `/`.

## How the analysis works

Ten checks in `lib/contract.ts`, each with a weight, a plain-English explanation and the sentence that triggered it:

| clause | severity | weight |
| --- | --- | --- |
| arbitration / class-action waiver | critical | 25 |
| unilateral changes without notice | high | 20 |
| one-sided indemnity | high | 20 |
| termination for any reason | high | 20 |
| automatic renewal | high | 15 |
| late fees and interest | medium | 10 |
| non-refundable fees | medium | 10 |
| data sharing | medium | 10 |
| early termination penalty | medium | 10 |
| distant venue / exclusive jurisdiction | medium | 5 |

Risk score is the sum, capped at 100. Detection is regex over the contract text, so it is deterministic and quotable — every finding shows the clause it came from.

## How the rewrite works

Up to three passes. Each pass is scored, and anything still unfair becomes the instruction for the next one:

1. rewrite the contract to remove or soften the listed terms
2. re-analyse it, and extract every fee, rate and notice period from the original
3. if the risk is still above target, or a number went missing, feed both failures back and try again

The dashboard shows which terms were fixed and which are still there, next to the number check.

## Measured

Real runs against the live API on the bundled gym contract:

| run | risk before | risk after | terms fixed | numbers kept |
| --- | --- | --- | --- | --- |
| 1 | 100 | 10 | 6 of 7 | 6 of 6 |
| 2 | 100 | 35 | 5 of 7 | 6 of 6 |
| 3 | 100 | 50 | 3 of 7 | 5 of 5 |

The score moves, and the numbers survive — that is the whole claim. Results vary between runs because the rewrite is model-driven.

## Sponsor stack

**SERV Reasoning (OpenServ)** — every rewrite pass and every image transcription. `https://inference-api.openserv.ai/v1`, model `gpt-5.4`.

**Reppo Evaluation API** — the "Independent panel check" on the dashboard. Submits the rewritten contract, polls until the verdict settles, and returns score, route, confidence and reasoning. This is a manual second opinion, not part of the rewrite loop.

**Dolphin and Kite are not used.** No code, keys or config for either.

## Demo film

`demo/` is a HyperFrames composition, 60 s at 1920x1080. It is cut from the real walkthrough recording plus a capture of the email modal, narrated by Kokoro (`af_heart`, 53.4 s), with synthesised UI sound on each cut, click and copy. Render with `cd demo && npx hyperframes render`; output lands in `demo/renders/`.

## Run

```bash
npm install
export SERV_API_KEY=...
export REPPO_API_KEY=...   # optional, enables the panel check
npm run dev                # http://localhost:3000
```

Uploads: PDFs are parsed with `unpdf`; PNG/JPEG/WebP go to SERV's vision model for transcription. A scanned PDF with no text layer is rejected with a message pointing at the photo route.

## Layout

```
app/
  page.tsx                landing
  scan/page.tsx           paste / upload form
  dashboard/page.tsx      results
  api/review/route.ts     analyse + rewrite loop
  api/extract/route.ts    PDF text and image transcription
  api/evaluate/route.ts   Reppo submit + poll
  api/config/route.ts     which keys are present
lib/
  contract.ts             the ten checks, scoring, rewrite loop
  facts.ts                fee/rate/notice extraction and survival check
  serv.ts                 SERV client
  reppo.ts                Reppo client
components/ui/notch-navbar.tsx
```

## Limits

- Clause detection is regex-driven. It is precise on the ten patterns above and blind to anything else — a contract can be hostile in ways this list does not cover.
- A rewrite can soften a clause instead of deleting it. The re-score is what you should trust, not the prose.
- The "Under the Hood" panel on the landing page is inherited copy from the reference design and does **not** describe this build: it says Llama 3.3 70B and twelve risk types, while this runs SERV `gpt-5.4` with ten checks.
- Not legal advice. It tells you which terms are worth questioning; it does not tell you whether a term is enforceable where you live.
