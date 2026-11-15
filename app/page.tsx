"use client";

import { useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  HStack,
  NativeSelect,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Textarea
} from "@chakra-ui/react";
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
  const [extracting, setExtracting] = useState<boolean>(false);
  const [docName, setDocName] = useState<string>("");
  const [dragging, setDragging] = useState<boolean>(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File): Promise<void> {
    setExtracting(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: form });
      const data = (await res.json()) as { text?: string; name?: string; kind?: string; chars?: number; error?: string };
      if (!res.ok || !data.text) throw new Error(data.error || "could not read the file");
      setSource(data.text);
      setDocName(`${data.name} · ${data.kind} · ${data.chars} characters`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExtracting(false);
    }
  }

  const finalPass = result ? result.passes[result.passes.length - 1] : null;
  const factsKept = result && finalPass ? result.facts - finalPass.missed.length : 0;
  const gradeDrop = result ? Number((result.after.grade - result.before.grade).toFixed(1)) : 0;

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
        body: JSON.stringify({ userMessage: "Hospital discharge instructions for a patient to follow at home.", reply: final })
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
    <Box bg="gray.50" minH="100vh">
      <Container maxW="6xl" py={{ base: 6, md: 10 }}>
        <Flex align="center" gap={4} wrap="wrap" mb={8}>
          <Box>
            <Heading size="2xl" letterSpacing="tight">
              Kredpane
            </Heading>
            <Text color="gray.600" fontSize="sm" mt={1}>
              Rewrites discharge instructions to a reading target, and refuses to lose a dose, a time or a phone number on the way.
            </Text>
          </Box>
          <HStack ml="auto" gap={2}>
            <NativeSelect.Root size="sm" width="130px">
              <NativeSelect.Field value={target} onChange={(e) => setTarget(e.target.value)}>
                {TARGETS.map((t) => (
                  <option key={t} value={t}>
                    grade {t}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
            <Button colorPalette="blue" onClick={() => void run()} disabled={busy}>
              {busy ? <Spinner size="xs" /> : "Rewrite"}
            </Button>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <MetricCard
            label="Reading grade"
            value={result ? result.after.grade : undefined}
            from={result ? result.before.grade : undefined}
            note={result ? `target ${result.target} · ${result.hit ? "reached" : "not reached"}` : "Flesch–Kincaid"}
            tone={result ? (result.hit ? "green" : "orange") : undefined}
          />
          <MetricCard
            label="Clinical terms left"
            value={finalPass ? finalPass.metrics.jargon.length : undefined}
            from={result ? result.before.jargon.length : undefined}
            note={finalPass && finalPass.metrics.jargon.length ? finalPass.metrics.jargon.join(", ") : "abbreviations and jargon"}
            tone={finalPass && finalPass.metrics.jargon.length === 0 ? "green" : undefined}
          />
          <MetricCard
            label="Facts kept"
            value={result ? `${factsKept}/${result.facts}` : undefined}
            note={finalPass && finalPass.missed.length ? `missing: ${finalPass.missed.join(", ")}` : "doses, times, phone numbers"}
            tone={finalPass && finalPass.missed.length === 0 ? "green" : result ? "red" : undefined}
          />
        </SimpleGrid>

        {error ? (
          <Card.Root mt={4} borderColor="red.200" bg="red.50">
            <Card.Body py={3}>
              <Text color="red.700" fontSize="sm" fontWeight="medium">
                {error}
              </Text>
            </Card.Body>
          </Card.Root>
        ) : null}

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} mt={4}>
          <Card.Root
            borderColor={dragging ? "blue.400" : undefined}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void onFile(file);
            }}
          >
            <Card.Header pb={3}>
              <Flex align="center" gap={3} wrap="wrap">
                <Card.Title fontSize="sm" textTransform="uppercase" letterSpacing="wider" color="gray.500">
                  Source
                </Card.Title>
                <Badge ml="auto" colorPalette={result ? "gray" : "blue"} variant="subtle">
                  {result ? `grade ${result.before.grade}` : "editable"}
                </Badge>
                <Button size="xs" variant="outline" onClick={() => fileRef.current?.click()} disabled={extracting}>
                  {extracting ? <Spinner size="xs" /> : "Upload PDF or photo"}
                </Button>
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
              </Flex>
              <Text fontSize="xs" color="gray.500" mt={2}>
                {extracting
                  ? "Reading the document…"
                  : docName || "Paste text, or drop a PDF or photo of the discharge paperwork here."}
              </Text>
            </Card.Header>
            <Card.Body pt={0}>
              <Textarea
                value={source}
                onChange={(e) => setSource(e.target.value)}
                spellCheck={false}
                minH="420px"
                variant="subtle"
                fontSize="sm"
                lineHeight="tall"
                resize="vertical"
              />
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header pb={3}>
              <Flex align="center" gap={2}>
                <Card.Title fontSize="sm" textTransform="uppercase" letterSpacing="wider" color="gray.500">
                  Rewritten → pass {finalPass ? finalPass.n : "—"}
                </Card.Title>
                {finalPass ? (
                  <Badge ml="auto" colorPalette={finalPass.metrics.grade <= result!.target ? "green" : "orange"} variant="subtle">
                    grade {finalPass.metrics.grade}
                  </Badge>
                ) : null}
                {result ? (
                  <Button size="xs" variant="outline" onClick={() => void checkWithPanel()} disabled={panel.status === "pending"}>
                    {panel.status === "pending" ? "panel…" : "panel check"}
                  </Button>
                ) : null}
              </Flex>
            </Card.Header>
            <Card.Body pt={0}>
              {finalPass ? (
                <Text fontSize="sm" lineHeight="taller" whiteSpace="pre-wrap">
                  {finalPass.text}
                </Text>
              ) : (
                <Flex minH="420px" align="center" justify="center" px={6}>
                  <Text color="gray.500" fontSize="sm" textAlign="center" maxW="sm">
                    Press Rewrite. Every pass is measured; if the grade is still too high, or a dose or phone number went
                    missing, that failure is fed back and it tries again.
                  </Text>
                </Flex>
              )}
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {result ? (
          <Stack gap={4} mt={8}>
            <Card.Root>
              <Card.Header pb={2}>
                <Card.Title fontSize="sm" textTransform="uppercase" letterSpacing="wider" color="gray.500">
                  Passes
                </Card.Title>
              </Card.Header>
              <Card.Body pt={0}>
                <Stack gap={0} divideY="1px">
                  {result.passes.map((p) => (
                    <Flex key={p.n} align="baseline" gap={4} py={3} wrap="wrap">
                      <Text fontWeight="medium" minW="70px" fontSize="sm">
                        {p.n === 0 ? "source" : `pass ${p.n}`}
                      </Text>
                      <Text fontWeight="bold" fontSize="lg" minW="44px">
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
              </Card.Body>
            </Card.Root>

            {panel.status !== "idle" ? (
              <Card.Root>
                <Card.Header pb={2}>
                  <Card.Title fontSize="sm" textTransform="uppercase" letterSpacing="wider" color="gray.500">
                    Independent panel
                  </Card.Title>
                </Card.Header>
                <Card.Body pt={0}>
                  {panel.status === "pending" ? (
                    <HStack gap={2} color="gray.600">
                      <Spinner size="xs" />
                      <Text fontSize="sm">Submitted. The panel usually settles in 60–100 seconds.</Text>
                    </HStack>
                  ) : null}
                  {panel.status === "error" ? (
                    <Text color="red.600" fontSize="sm" fontWeight="medium">
                      {panel.error}
                    </Text>
                  ) : null}
                  {panel.status === "done" && panel.verdict ? (
                    <Stack gap={3}>
                      <HStack gap={3}>
                        <Text fontWeight="bold" fontSize="3xl" lineHeight="1">
                          {panel.verdict.score ?? "—"}
                        </Text>
                        <Badge colorPalette={panel.verdict.route === "ship" ? "green" : panel.verdict.route === "block" ? "red" : "orange"} variant="subtle">
                          {panel.verdict.route ?? "unknown"}
                        </Badge>
                        <Text color="gray.500" fontSize="sm">
                          {panel.verdict.confidence ? `${panel.verdict.confidence} confidence` : ""}
                        </Text>
                      </HStack>
                      {panel.verdict.reason ? (
                        <Text fontSize="sm" color="gray.600">
                          {panel.verdict.reason}
                        </Text>
                      ) : null}
                      <HStack gap={2} wrap="wrap">
                        {Object.entries(panel.verdict.rubric).map(([k, v]) => (
                          <Badge key={k} variant="surface">
                            {k} {v}
                          </Badge>
                        ))}
                      </HStack>
                    </Stack>
                  ) : null}
                </Card.Body>
              </Card.Root>
            ) : null}

            <Text fontSize="xs" color="gray.500">
              Grade moved {gradeDrop < 0 ? gradeDrop : "0"} points across {result.passes.length - 1} pass
              {result.passes.length - 1 === 1 ? "" : "es"}. Facts checked: {result.facts}. Terms still present:{" "}
              {finalPass?.metrics.jargon.length ?? 0}.
            </Text>
          </Stack>
        ) : null}
      </Container>
    </Box>
  );
}

function MetricCard({
  label,
  value,
  from,
  note,
  tone
}: {
  label: string;
  value?: string | number;
  from?: number;
  note: string;
  tone?: "green" | "orange" | "red";
}) {
  return (
    <Card.Root>
      <Card.Body>
        <Text fontSize="xs" fontWeight="medium" textTransform="uppercase" letterSpacing="wider" color="gray.500">
          {label}
        </Text>
        <HStack align="baseline" gap={2} mt={2}>
          {from !== undefined ? (
            <>
              <Text fontSize="3xl" fontWeight="semibold" color="gray.400" lineHeight="1">
                {from}
              </Text>
              <Text color="gray.300" fontSize="xl">
                →
              </Text>
            </>
          ) : null}
          <Text fontSize="3xl" fontWeight="bold" lineHeight="1">
            {value ?? "—"}
          </Text>
          {tone ? (
            <Badge colorPalette={tone} variant="subtle" size="sm">
              {tone === "green" ? "pass" : tone === "red" ? "fail" : "check"}
            </Badge>
          ) : null}
        </HStack>
        <Text color="gray.600" fontSize="xs" mt={2} lineClamp={2}>
          {note}
        </Text>
      </Card.Body>
    </Card.Root>
  );
}
