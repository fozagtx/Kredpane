"use client";

import { useState } from "react";
import { Badge, Box, Button, Flex, Heading, HStack, NativeSelect, Separator, SimpleGrid, Spinner, Stack, Text, Textarea } from "@chakra-ui/react";
import type { Improvement } from "../lib/instructions";
import type { ReppoVerdict } from "../lib/reppo";

const SAMPLE = `68-year-old woman discharged after community-acquired pneumonia.
Medications: amoxicillin-clavulanate 875/125 mg PO BID for 7 days; acetaminophen 650 mg PO q6h PRN temperature above 38.3 C.
Follow-up: primary care in 5 to 7 days; pulmonology if still short of breath at 14 days.
Red flags: oxygen saturation below 90%, respiratory rate above 24, new confusion, unable to keep fluids down — go to the emergency department or call 911.
Activity: no lifting more than 10 lb for 2 weeks.
Contacts: clinic 555-0142, after-hours nurse line 555-0199.`;

const TARGETS = [5, 6, 7, 8];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export default function Page() {
  const [source, setSource] = useState<string>(SAMPLE);
  const [target, setTarget] = useState<string>("6");
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<Improvement | null>(null);
  const [panel, setPanel] = useState<{ status: "idle" | "pending" | "done" | "error"; verdict?: ReppoVerdict; error?: string }>({ status: "idle" });

  const finalPass = result ? result.passes[result.passes.length - 1] : null;
  const factsKept = result && finalPass ? result.facts - finalPass.missed.length : 0;

  async function run(): Promise<void> {
    setBusy(true);
    setError("");
    setPanel({ status: "idle" });
    try {
      const res = await fetch("/api/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: source, target: Number(target) })
      });
      const data = (await res.json()) as Improvement & { error?: string };
      if (!res.ok) throw new Error(data.error || "could not rewrite the text");
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function checkWithPanel(): Promise<void> {
    if (!result) return;
    setPanel({ status: "pending" });
    try {
      const final = result.passes[result.passes.length - 1].text;
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: "Hospital discharge instructions for a patient to follow at home.",
          reply: final
        })
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error || "could not submit");

      const deadline = Date.now() + 240_000;
      while (Date.now() < deadline) {
        await sleep(4000);
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

  return (
    <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
      <Flex align="center" gap={4} wrap="wrap" pb={5} borderBottomWidth="2px" borderColor="gray.900">
        <Heading size="lg" letterSpacing="tight">
          RATCHET
        </Heading>
        <Text color="gray.600" fontSize="sm" maxW="md">
          Rewrites hospital instructions to a reading target, and refuses to lose a dose, a time or a phone number on the way.
        </Text>
        <HStack ml="auto" gap={2}>
          <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color="gray.500">
            target
          </Text>
          <NativeSelect.Root size="sm" width="auto">
            <NativeSelect.Field
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              borderWidth="1.5px"
              borderColor="gray.900"
              borderRadius="0"
              bg="white"
              fontSize="sm"
              fontWeight="semibold"
              width="auto"
            >
              {TARGETS.map((t) => (
                <option key={t} value={t}>
                  grade {t}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
          <Button colorPalette="blue" size="sm" onClick={() => void run()} disabled={busy}>
            {busy ? <Spinner size="xs" /> : "rewrite"}
          </Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} mt={6} borderWidth="2px" borderColor="gray.900">
        <MetricCell
          label="Reading grade"
          before={result ? result.before.grade : null}
          after={result ? result.after.grade : null}
          note={result ? `target ${result.target} · ${result.hit ? "reached" : "not reached"}` : "Flesch-Kincaid"}
        />
        <MetricCell
          label="Clinical terms"
          before={result ? result.before.jargon.length : null}
          after={finalPass ? finalPass.metrics.jargon.length : null}
          note={finalPass && finalPass.metrics.jargon.length ? finalPass.metrics.jargon.join(", ") : "abbreviations and jargon"}
        />
        <MetricCell
          label="Facts kept"
          before={null}
          after={result ? factsKept : null}
          afterSuffix={result ? ` / ${result.facts}` : ""}
          note={finalPass && finalPass.missed.length ? `missing: ${finalPass.missed.join(", ")}` : "doses, times, phone numbers"}
        />
      </SimpleGrid>

      {error ? (
        <Text color="red.600" fontWeight="semibold" mt={4} fontSize="sm">
          {error}
        </Text>
      ) : null}

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6} mt={6}>
        <Box borderWidth="2px" borderColor="gray.900">
          <Flex align="center" gap={3} px={4} py={2.5} borderBottomWidth="2px" borderColor="gray.900" bg="gray.50">
            <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
              Before · source
            </Text>
            <Badge ml="auto" variant="solid" colorPalette="gray">
              {result ? `grade ${result.before.grade}` : "editable"}
            </Badge>
          </Flex>
          <Textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            minH="430px"
            border="none"
            borderRadius="0"
            fontFamily="inherit"
            fontSize="sm"
            lineHeight="tall"
            p={4}
            resize="vertical"
            _focusVisible={{ outline: "3px solid", outlineColor: "blue.500", outlineOffset: "-3px" }}
          />
        </Box>

        <Box borderWidth="2px" borderColor="gray.900">
          <Flex align="center" gap={2} px={4} py={2.5} borderBottomWidth="2px" borderColor="gray.900" bg="gray.50">
            <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
              After · pass {finalPass ? finalPass.n : "—"}
            </Text>
            {finalPass ? (
              <Badge ml="auto" variant="solid" colorPalette={finalPass.metrics.grade <= result!.target ? "green" : "orange"}>
                grade {finalPass.metrics.grade}
              </Badge>
            ) : null}
            {result ? (
              <Button size="xs" variant="outline" onClick={() => void checkWithPanel()} disabled={panel.status === "pending"}>
                {panel.status === "pending" ? "panel…" : "panel check"}
              </Button>
            ) : null}
          </Flex>
          {finalPass ? (
            <Box p={4} fontSize="sm" lineHeight="taller" whiteSpace="pre-wrap">
              {finalPass.text}
            </Box>
          ) : (
            <Box p={6} color="gray.500" fontSize="sm">
              Press rewrite. Every pass is measured; if the grade is still too high, or a dose or phone number went missing, that failure is fed back and it tries again.
            </Box>
          )}
        </Box>
      </SimpleGrid>

      {result ? (
        <>
          <Box mt={8} pt={5} borderTopWidth="2px" borderColor="gray.900">
            <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color="gray.500" mb={3}>
              Passes
            </Text>
            <Stack gap={0}>
              {result.passes.map((p) => (
                <Flex key={p.n} align="baseline" gap={4} py={2.5} borderBottomWidth="1px" borderColor="gray.200" wrap="wrap">
                  <Text fontWeight="semibold" minW="70px" fontSize="sm">
                    {p.n === 0 ? "source" : `pass ${p.n}`}
                  </Text>
                  <Text fontFamily="mono" fontWeight="bold" fontSize="lg" minW="48px">
                    {p.metrics.grade}
                  </Text>
                  <Text color="gray.600" fontSize="xs">
                    {p.metrics.words} words · avg sentence {p.metrics.avgSentence} · {p.metrics.jargon.length} clinical terms ·{" "}
                    {p.missed.length ? `${p.missed.length} facts missing` : "facts intact"}
                  </Text>
                  <Badge ml="auto" variant="subtle" colorPalette={p.metrics.grade <= result.target ? "green" : "orange"}>
                    {p.metrics.grade <= result.target ? "target" : "above"}
                  </Badge>
                </Flex>
              ))}
            </Stack>
          </Box>

          {panel.status !== "idle" ? (
            <Box mt={6} borderWidth="2px" borderColor="gray.900" p={4}>
              <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color="gray.500">
                Independent panel
              </Text>
              <Separator my={3} />
              {panel.status === "pending" ? (
                <HStack gap={2} color="gray.600" fontSize="sm">
                  <Spinner size="xs" />
                  <Text>Submitted. The panel usually settles in 60–100 seconds.</Text>
                </HStack>
              ) : null}
              {panel.status === "error" ? (
                <Text color="red.600" fontWeight="semibold" fontSize="sm">
                  {panel.error}
                </Text>
              ) : null}
              {panel.status === "done" && panel.verdict ? (
                <Stack gap={3}>
                  <HStack gap={3}>
                    <Text fontFamily="mono" fontWeight="bold" fontSize="2xl">
                      {panel.verdict.score ?? "—"}
                    </Text>
                    {panel.verdict.route ? <Badge variant="solid">{panel.verdict.route}</Badge> : null}
                  </HStack>
                  {panel.verdict.reason ? (
                    <Text fontSize="sm" color="gray.600">
                      {panel.verdict.reason}
                    </Text>
                  ) : null}
                  <HStack gap={2} wrap="wrap">
                    {Object.entries(panel.verdict.rubric).map(([k, v]) => (
                      <Badge key={k} variant="outline">
                        {k} {v}
                      </Badge>
                    ))}
                  </HStack>
                </Stack>
              ) : null}
            </Box>
          ) : null}
        </>
      ) : null}
    </Box>
  );
}

function MetricCell({
  label,
  before,
  after,
  afterSuffix,
  note
}: {
  label: string;
  before: number | null;
  after: number | null;
  afterSuffix?: string;
  note: string;
}) {
  return (
    <Box p={5} borderRightWidth={{ base: 0, md: "2px" }} borderBottomWidth={{ base: "2px", md: 0 }} borderColor="gray.900" _last={{ borderRightWidth: 0, borderBottomWidth: 0 }}>
      <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color="gray.500">
        {label}
      </Text>
      <HStack align="baseline" gap={2} mt={1}>
        {before !== null ? (
          <>
            <Text fontSize="4xl" fontWeight="extrabold" letterSpacing="tight" lineHeight="1">
              {before}
            </Text>
            <Text color="gray.400" fontSize="2xl">
              →
            </Text>
          </>
        ) : null}
        <Text fontSize="4xl" fontWeight="extrabold" letterSpacing="tight" lineHeight="1">
          {after ?? "—"}
          {afterSuffix ?? ""}
        </Text>
      </HStack>
      <Text color="gray.600" fontSize="xs" mt={2} lineClamp={2}>
        {note}
      </Text>
    </Box>
  );
}
