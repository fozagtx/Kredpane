# Ratchet

Rewrites hospital discharge instructions to a reading target, and proves nothing was lost on the way.

## The problem

- Nearly 9 in 10 US adults struggle with health information written in complex terms (CDC).
- Only 12% have proficient health literacy (National Assessment of Adult Literacy).
- AMA, HHS and NIH recommend patient materials at a **6th-grade level**; studies of real discharge documents find they sit above it.

Low health literacy is estimated to cost ~1 million avoidable hospital visits and $25B+ a year.

## What it does

You paste source instructions and pick a target grade. The app rewrites, measures, and refuses to hand back text that lost a dose, a time or a phone number.

Three checks per pass, all computed in code:

1. **Reading grade** — Flesch–Kincaid.
2. **Clinical terms** — abbreviations (`PO`, `BID`, `q6h`, `SpO2`) must reach zero; drug names are reported but allowed.
3. **Facts kept** — every dose, duration, percentage and phone number from the source must survive verbatim.

If a pass fails, the failure is fed back as the constraint for the next pass. Max three passes, and it stops early when nothing changes.

## Measured

One real run on the bundled sample (pneumonia discharge), target grade 6:

| | reading grade | clinical terms | facts kept |
| --- | --- | --- | --- |
| source | 8.8 | 12 | 10/10 |
| after pass 1 | **4.4** | **5** | **10/10** |

The remaining five terms are `pneumonia`, `amoxicillin-clavulanate`, `acetaminophen`, `saturation`, `emergency department` — reported, not silently dropped.

## Sponsor stack

**SERV Reasoning (OpenServ)** — every rewrite pass, `https://inference-api.openserv.ai/v1`.

**Reppo Evaluation API** — optional independent panel on the final text (`taskType: "response"`). Async, 60–100 seconds, so it sits behind a button rather than blocking the loop.

Dolphin and Kite are not wired.

## Run

```bash
npm install
export SERV_API_KEY=...
export REPPO_API_KEY=...   # optional, enables the panel check
npm run dev                # http://localhost:3000
```

Routes: `/`, `/api/improve`, `/api/evaluate`, `/api/config`.

## Layout

```
app/
  page.tsx              before/after panes, metric cards, pass ledger
  providers.tsx         Chakra provider
  api/improve/route.ts  rewrite loop
  api/evaluate/route.ts Reppo submit + poll
lib/
  readability.ts        Flesch-Kincaid, jargon matching, fact extraction
  instructions.ts       prompts, feedback, loop control
  serv.ts               SERV chat client
  reppo.ts              Reppo client
```

## Limits

- The model writes at grade 8–9 unprompted, so the gain is real but modest, not 14 → 6.
- Flesch–Kincaid is gameable: dropping punctuation or using shorthand lowers the score without improving comprehension. That is why grade is paired with a jargon check and fact retention rather than trusted alone.
- Fact extraction is regex over units, percentages and phone patterns. It catches dropped doses, not distorted meaning.
- Without `REPPO_API_KEY` the loop still works; only the panel check is unavailable.
