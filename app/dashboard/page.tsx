"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Flex, HStack, Spinner, Text } from "@chakra-ui/react";
import type { Review } from "../../lib/contract";
import type { ReppoVerdict } from "../../lib/reppo";
import { NotchNavbar } from "../../components/ui/notch-navbar";
import LogoIcon from "../../assets/logo/logo-icon";

const YELLOW = "#d6ff34";
const SURFACE_1 = "var(--s1)";
const SURFACE_2 = "var(--s2)";
const MUTED = "var(--muted)";
const FOREGROUND = "var(--fg)";
const ACCENT = "#3d5500";
const MINT = "#5dffc0";
const CYAN = "#71f6ff";
const DANGER = "#ff4444";

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
    } catch {
      router.replace("/");
    }
    setReady(true);
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
    return (
      <Box bg="var(--page)" minH="100vh" display="grid" placeItems="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  const finalPass = review.passes[review.passes.length - 1];
  const remaining = finalPass.analysis.findings;
  const factsKept = review.facts - finalPass.missed.length;

  return (
    <Box bg="var(--page)" color={FOREGROUND} minH="100vh">
      <NotchNavbar
        logo={
          <a href="/" className="flex items-center justify-center group">
            <span className="w-8 h-8 rounded-[8px] bg-[#d6ff34] flex items-center justify-center group-hover:scale-105 transition-transform">
              <LogoIcon className="w-5 h-5 text-black" />
            </span>
          </a>
        }
      />

      <Box maxW="1700px" mx="auto" px={6} pt="112px" pb={16}>
        <Flex align="baseline" gap={4} wrap="wrap" mb={8}>
          <HStack gap={3} align="baseline">
            <Text fontSize={{ base: "48px", md: "72px" }} fontWeight="700" lineHeight="1" color={ACCENT}>
              {review.before.riskScore}
            </Text>
            <Text fontSize="2xl" color={MUTED}>→</Text>
            <Text fontSize={{ base: "48px", md: "72px" }} fontWeight="700" lineHeight="1" color={review.after.riskScore <= review.target ? "#0f7a4a" : CYAN}>
              {review.after.riskScore}
            </Text>
          </HStack>
          <Box>
            <Text fontSize="11px" fontWeight="700" letterSpacing="1.4px" textTransform="uppercase" color={MUTED}>
              Risk score after rewrite
            </Text>
            <Text fontSize="sm" color={MUTED} mt={1}>
              {review.fixed} of {review.before.findings.length} unfair terms removed · {factsKept} of {review.facts} numbers kept
            </Text>
          </Box>
          <HStack ml="auto" gap={2}>
            <Button asChild variant="outline" borderColor="var(--line-strong)" color={FOREGROUND} borderRadius="full" px={5} py={2.5} h="auto" fontSize="11px" fontWeight="700" letterSpacing="1px" textTransform="uppercase">
              <a href="/">← Scan another</a>
            </Button>
            <Button
              onClick={() => void checkWithPanel()}
              disabled={panel.status === "pending"}
              bg={YELLOW}
              color="#000"
              borderRadius="full"
              px={5}
              py={2.5}
              h="auto"
              fontSize="11px"
              fontWeight="700"
              letterSpacing="1px"
              textTransform="uppercase"
              _hover={{ bg: "rgba(214,255,52,0.9)" }}
              _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
            >
              {panel.status === "pending" ? "Panel…" : "Independent panel check"}
            </Button>
          </HStack>
        </Flex>

        {panel.status === "done" && panel.verdict ? (
          <Box mb={6} bg={SURFACE_2} borderRadius="20px" p={4} border="1px solid var(--line)">
            <HStack gap={3} align="baseline">
              <Text fontSize="2xl" fontWeight="700" color={ACCENT}>{panel.verdict.score ?? "—"}</Text>
              <Text fontSize="11px" fontWeight="700" letterSpacing="1.2px" textTransform="uppercase" color={MUTED}>
                {panel.verdict.route} · {panel.verdict.confidence}
              </Text>
            </HStack>
            {panel.verdict.reason ? <Text fontSize="sm" color={MUTED} mt={2}>{panel.verdict.reason}</Text> : null}
          </Box>
        ) : null}
        {panel.status === "error" ? (
          <Text color="#b91c1c" fontSize="sm" fontWeight="600" mb={4}>{panel.error}</Text>
        ) : null}

        <Flex gap={4} direction={{ base: "column", lg: "row" }} align="stretch">
          <ResultPanel title={`The contract · risk ${review.before.riskScore}`}>
            <Text fontSize="13px" lineHeight="1.7" whiteSpace="pre-wrap" color={FOREGROUND}>
              {review.passes[0].text}
            </Text>
          </ResultPanel>

          <ResultPanel title={`Rewritten · risk ${finalPass.analysis.riskScore}`} accent={finalPass.analysis.riskScore <= review.target ? "#0f7a4a" : CYAN}>
            <Text fontSize="13px" lineHeight="1.7" whiteSpace="pre-wrap" color={FOREGROUND}>
              {finalPass.text}
            </Text>
          </ResultPanel>

          <ResultPanel title="What we caught">
            <Flex direction="column" gap={2.5}>
              {review.before.findings.length === 0 ? <Text fontSize="sm" color={MUTED}>No traps found in this text.</Text> : null}
              {review.before.findings.map((f) => {
                const stillThere = remaining.some((r) => r.id === f.id);
                const accent = f.severity === "critical" ? DANGER : f.severity === "high" ? ACCENT : "#0f6b7a";
                return (
                  <Box key={f.id} bg={SURFACE_1} borderRadius="16px" borderLeft={`4px solid ${accent}`} border="1px solid var(--line)" p={3}>
                    <Flex align="center" gap={2}>
                      <Text fontSize="9px" fontWeight="700" letterSpacing="1.2px" textTransform="uppercase" color={accent}>
                        {f.severity}
                      </Text>
                      <Box
                        ml="auto"
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        bg={stillThere ? "rgba(220,38,38,0.10)" : "rgba(15,122,74,0.10)"}
                        color={stillThere ? "#b91c1c" : "#0f7a4a"}
                        fontSize="9px"
                        fontWeight="700"
                        letterSpacing="1px"
                        textTransform="uppercase"
                      >
                        {stillThere ? "still there" : "fixed"}
                      </Box>
                    </Flex>
                    <Text fontSize="12px" fontWeight="700" mt={2} lineHeight="1.35">{f.label}</Text>
                    <Text fontSize="11px" color={MUTED} mt={1} lineHeight="1.5">{f.ask}</Text>
                  </Box>
                );
              })}
              <Text fontSize="10px" color={MUTED}>Not legal advice. These are the terms worth questioning before you sign.</Text>
            </Flex>
          </ResultPanel>
        </Flex>
      </Box>
    </Box>
  );
}

function ResultPanel({ title, accent = ACCENT, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <Box flex="1" minW="0" bg={SURFACE_1} borderRadius="24px" overflow="hidden" border="1px solid var(--line)">
      <Box px={4} py={3} borderBottom="1px solid var(--line)">
        <Text fontSize="10px" fontWeight="700" letterSpacing="1.2px" textTransform="uppercase" color={accent}>{title}</Text>
      </Box>
      <Box p={4} maxH="70vh" overflowY="auto">{children}</Box>
    </Box>
  );
}
