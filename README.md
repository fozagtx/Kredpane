# Ratchet

Support replies that get measurably better inside a single conversation.

Every reply is scored by an independent evaluation panel. If it does not ship, the reply is rewritten under a hard constraint built from the score, the route, the critique and the rubric — then scored again. The ledger shows both attempts side by side and the mean before/after across the conversation.

## Measured

One real run on the free tier, same customer message both times:

| | score | route | completeness | settle |
| --- | --- | --- | --- | --- |
| baseline reply | **69** | `review` | **14** | 64s |
| rewrite under that verdict | **100** | `review` | **100** | 104s |

The baseline says *"I am sorry for the inconvenience. Please contact our team and they will look into it."* The rewrite names the duplicate charge as a billing error, states the refund path, escalates, gives a timeframe, and asks exactly one question.

Note the second run is still routed `review` at a perfect score, because the panel's confidence was medium. Acceptance therefore requires **route `ship` and score ≥ 80**, not score alone — and the loop stops after two attempts, because a perfect score the panel still wants a human to see is not a reason to keep rewriting.

## The loop

1. **Draft.** The baseline agent runs on SERV (`gpt-5.4`) under a deliberately thin prompt: two sentences, no diagnosis, no commitments. That is the "before".
2. **Score.** Customer message plus reply go to Reppo as `taskType: "response"`.
3. **Rewrite, if needed.** SERV regenerates the reply with the constraint derived from the verdict.
4. **Re-score.** Both attempts land in the ledger with score, route, critique and rubric chips.

Reppo verdicts are queued and take 60–100 seconds, so the UI shows a live scoring state rather than pretending the loop is instant. Credits are only charged when an evaluation settles.

## Sponsor stack

**SERV Reasoning (OpenServ)** — every generation. The baseline reply and the constrained rewrite are the same model, different instructions, so the delta comes from the constraint and not from a model swap. Base URL `https://inference-api.openserv.ai/v1`.

**Reppo Evaluation API** — the panel. `POST /api/v1/agents/evals` with `taskType: "response"`, polled until `COMPLETED`. The rubric dimensions it returns are what the rewrite is held to.

Dolphin and Kite are not wired. Nothing in this repo calls them.

## Underwriting surface (`/underwrite`)

The repo also carries an earlier surface: submit an agent endpoint, run seven adversarial tests, get a grade, a premium, and a spend-permission decision. Six tests are checked mechanically and one is judged by SERV; a deterministic finding always outranks the model. Denials can be sent to the same Reppo panel as an independent review.

It shares the app and the sponsor integrations. `npm run assess -- --compare` drives it from the CLI.

## Run

```bash
npm install
export SERV_API_KEY=...
export REPPO_API_KEY=...
npm run dev            # http://localhost:3000
```

Useful routes: `/` (support loop), `/underwrite`, `/api/reply`, `/api/evaluate`, `/api/chat`, `/api/score`, `/api/second-opinion`.

## Layout

```
app/
  page.tsx                    support loop
  underwrite/page.tsx         underwriting surface
  api/reply/route.ts          draft and constrained rewrite (SERV)
  api/evaluate/route.ts       submit + poll a Reppo evaluation
  api/chat/route.ts           agent-under-test runner (Agents SDK on SERV)
  api/score/route.ts          submit + poll for the underwriting panel
  api/second-opinion/route.ts Reppo review of a denial
lib/
  support.ts                  baseline prompt, constraint builder, scoring rules
  serv.ts                     SERV client, judge, narrative
  reppo.ts                    Reppo client for both surfaces
  tests.ts                    the seven adversarial tests
  runner.ts                   underwriting orchestration
  score.ts                    grade and premium
  adapter.ts                  endpoint client and redaction
  types.ts
```

## Limits

- The baseline prompt is intentionally weak. That is the premise — the product is the constraint loop, not the baseline.
- Scoring is one panel pass per attempt, not a statistical estimate.
- Without `REPPO_API_KEY` the agent still replies but nothing is scored and the loop never triggers; the UI says so.
