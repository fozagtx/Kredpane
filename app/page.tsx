"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Flex, HStack, Input, NativeSelect, Spinner, Text, Textarea } from "@chakra-ui/react";
import type { Review } from "../lib/contract";
import { NotchNavbar } from "../components/ui/notch-navbar";
import LogoIcon from "../assets/logo/logo-icon";

const YELLOW = "#d6ff34";
const SURFACE_1 = "var(--s1)";
const SURFACE_2 = "var(--s2)";
const MUTED = "var(--muted)";
const FOREGROUND = "var(--fg)";
const ACCENT = "#3d5500";
const MINT = "#5dffc0";
const CYAN = "#71f6ff";
const BLUE = "#7da2ff";
const LAVENDER = "#c1adff";
const CREAM = "var(--cream)";

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
    <Box bg="var(--page)" color={FOREGROUND} minH="100vh" position="relative">
      <Box
        position="absolute"
        top="-120px"
        right="-120px"
        w="600px"
        h="600px"
        pointerEvents="none"
        zIndex={0}
        style={{ background: "radial-gradient(circle, rgba(214,255,52,0.55), transparent 70%)", filter: "blur(120px)" }}
      />

      <NotchNavbar
        logo={
          <a href="/" className="flex items-center justify-center group">
            <span className="w-8 h-8 rounded-[8px] bg-[#d6ff34] flex items-center justify-center group-hover:scale-105 transition-transform">
              <LogoIcon className="w-5 h-5 text-black" />
            </span>
          </a>
        }
      />

      <Box
        id="top"
        className="grid-pattern"
        bg="var(--s1)"
        borderBottom="1px solid var(--line)"
        borderBottomRadius="64px"
        pt="128px"
        pb="110px"
        position="relative"
        zIndex={40}
      >
        <Box maxW="1700px" mx="auto" px={6}>
          <Box textAlign="center" maxW="5xl" mx="auto" mb={14}>
            <Text as="h1" fontSize={{ base: "48px", md: "88px" }} fontWeight="700" lineHeight="0.9" letterSpacing="tight" textTransform="uppercase">
              You hate reading<br />terms of service.
            </Text>
            <Text as="h2" fontSize={{ base: "36px", md: "88px" }} fontWeight="700" lineHeight="0.9" letterSpacing="tight" textTransform="uppercase" mt={2} mb={6}>
              <Text as="span" bg={YELLOW} color="#000" px={3} style={{ boxDecorationBreak: "clone" }}>
                We know.
              </Text>
            </Text>
            <Text fontSize={{ base: "lg", md: "xl" }} color={MUTED} maxW="2xl" mx="auto" lineHeight="1.7">
              We read the fine print so you don't have to. Paste, upload, or drop your ToS and we'll tell you exactly how bad it is and help you fight back.
            </Text>
          </Box>

          <Box maxW="4xl" mx="auto" bg={SURFACE_1} borderRadius="30px" p={{ base: 2, md: 4 }} boxShadow="0 20px 50px -10px rgba(0,0,0,0.12)">
            <Flex flexWrap="wrap" align="center" gap={2} p={4} pb={0} mb={6}>
              <Button
                onClick={() => { setTab("upload"); fileRef.current?.click(); }}
                bg={tab === "upload" ? YELLOW : SURFACE_2}
                color={tab === "upload" ? "#000" : MUTED}
                px={6} py={3} h="auto" borderRadius="full" fontSize="13px" fontWeight="700" letterSpacing="1px" textTransform="uppercase"
                _hover={{ bg: tab === "upload" ? "rgba(214,255,52,0.9)" : "var(--s3)" }}
              >
                {extracting ? <Spinner size="xs" /> : "Upload PDF"}
              </Button>
              <Button
                onClick={() => setTab("paste")}
                bg={tab === "paste" ? YELLOW : SURFACE_2}
                color={tab === "paste" ? "#000" : MUTED}
                px={6} py={3} h="auto" borderRadius="full" fontSize="13px" fontWeight="700" letterSpacing="1px" textTransform="uppercase"
                _hover={{ bg: tab === "paste" ? "rgba(214,255,52,0.9)" : "var(--s3)" }}
              >
                Paste text
              </Button>
              <Button
                onClick={() => setEmailHint(true)}
                bg={SURFACE_2}
                color={MUTED}
                px={6} py={3} h="auto" borderRadius="full" fontSize="13px" fontWeight="700" letterSpacing="1px" textTransform="uppercase"
                _hover={{ bg: "var(--s3)" }}
              >
                From Email
              </Button>
              <Text fontSize="11px" color={MUTED} ml="auto" display={{ base: "none", md: "block" }}>
                {docName || "PDF, PNG, JPEG or WebP"}
              </Text>
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

            <Box px={4} pb={4}>
              <Box mb={4}>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="COMPANY NAME (OPTIONAL)"
                  w="100%" bg={SURFACE_2} border="1px solid var(--line)" borderRadius="12px" px={6} py={4}
                  h="auto" fontSize="sm" fontWeight="700" letterSpacing="wider" textTransform="uppercase" color={FOREGROUND}
                  _placeholder={{ color: MUTED }}
                  _focusVisible={{ outline: "none", borderColor: "rgba(61,85,0,0.6)" }}
                />
              </Box>
              <Box h="240px">
                <Textarea
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  spellCheck={false}
                  placeholder="Paste the Terms of Service, Privacy Policy, or contract here..."
                  w="100%" h="100%" bg={SURFACE_2} border="1px solid var(--line)" borderRadius="20px" p={6}
                  fontSize="md" color={FOREGROUND} resize="none"
                  _placeholder={{ color: MUTED }}
                  _focusVisible={{ outline: "none", borderColor: "rgba(61,85,0,0.6)" }}
                />
              </Box>
              {emailHint ? (
                <Text fontSize="11px" color={MUTED} mt={2}>
                  Email import is not connected yet — paste the email text into the box above.
                </Text>
              ) : null}
            </Box>

            <Flex p={4} pt={2} align="center" gap={3}>
              <NativeSelect.Root size="sm" width="auto">
                <NativeSelect.Field
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  bg={SURFACE_2} color={FOREGROUND} border="1px solid var(--line-strong)" borderRadius="full"
                  px={4} py={3} h="auto" fontSize="11px" fontWeight="700" letterSpacing="1px" textTransform="uppercase"
                >
                  {TARGETS.map((t) => (
                    <option key={t.value} value={t.value} style={{ background: "#f6f6f1" }}>
                      aim: {t.label}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
              <Button
                onClick={() => void run()}
                disabled={busy}
                flex="1"
                py={6}
                h="auto"
                borderRadius="full"
                bg={YELLOW}
                color="#000"
                fontSize="lg"
                fontWeight="700"
                letterSpacing="2px"
                textTransform="uppercase"
                _hover={{ bg: "rgba(214,255,52,0.9)" }}
                _active={{ transform: "scale(0.98)" }}
                _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
              >
                {busy ? <><Spinner size="sm" /> Scanning</> : "Scan now →"}
              </Button>
            </Flex>
            {error ? (
              <Box px={4} pb={4}>
                <Text color="#b91c1c" fontSize="sm" fontWeight="600">{error}</Text>
              </Box>
            ) : null}
          </Box>
        </Box>
      </Box>

      <Box bg={SURFACE_1} borderBottomRadius="64px" pt="96px" pb="96px" position="relative" zIndex={30}>
        <Box maxW="1700px" mx="auto" px={6}>
          <Flex gap={6} direction={{ base: "column", md: "row" }}>
            <StatCard label="The Problem" value="7.2B" color={ACCENT} text="Users affected by hidden data-selling clauses daily." />
            <StatCard label="The Trap" value="89%" color={MINT} text="Of major services contain auto-renewal traps." />
            <StatCard label="The Solution" value="3 MIN" color={CYAN} text="Average time to understand your rights with Kredpane." />
          </Flex>
        </Box>
      </Box>

      <Box id="how" bg="var(--page)" borderBottomRadius="64px" pt="96px" pb="96px" position="relative" zIndex={20}>
        <Box maxW="1700px" mx="auto" px={6}>
          <Text as="h2" fontSize={{ base: "4xl", md: "56px" }} fontWeight="700" textTransform="uppercase" letterSpacing="tight" textAlign="center" mb={16}>
            How it works
          </Text>
          <Flex gap={6} direction={{ base: "column", md: "row" }}>
            <StepCard step="Step 01" title="Paste or upload" text="Drop the text, a PDF, or an email update into our scanner." />
            <StepCard step="Step 02" title="AI scans everything" text="Our legal AI identifies dangerous clauses hidden in the jargon." mt={{ base: 0, md: 8 }} />
            <StepCard step="Step 03" title="Fight back" text="Generate a professional pushback email with a single click." mt={{ base: 0, md: 16 }} />
          </Flex>
        </Box>
      </Box>

      <Box id="catch" bg={SURFACE_1} borderBottomRadius="64px" pt="96px" pb="96px" position="relative" zIndex={10}>
        <Box maxW="1700px" mx="auto" px={6}>
          <Text as="h2" fontSize={{ base: "4xl", md: "56px" }} fontWeight="700" textTransform="uppercase" letterSpacing="tight" textAlign="center" mb={16}>
            What we catch
          </Text>
          <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr 1fr", lg: "repeat(4, 1fr)" }} gap={6}>
            <CatchCard title="Data selling" text="When companies quietly grant themselves the right to broker your personal info to third parties." bg={BLUE} ink="#000434" />
            <CatchCard title="Auto-renew traps" text="Concealed subscription terms that make it intentionally difficult to cancel billing." bg={MINT} ink="#003f18" />
            <CatchCard title="Forced arbitration" text="Clauses that strip away your right to sue or join class-action lawsuits if wronged." bg={CYAN} ink="#204150" />
            <CatchCard title="Account exit" text="Rights to delete your account and confiscate your content for any reason, without notice." bg={LAVENDER} ink="#4d2050" />
          </Box>
        </Box>
      </Box>

      <Box id="about" bg="var(--page)" borderBottomRadius="64px" pt="96px" pb="96px" position="relative" zIndex={9}>
        <Box maxW="1200px" mx="auto" px={6}>
          <Box textAlign="center" mb={16}>
            <Text fontSize="11px" fontWeight="700" textTransform="uppercase" letterSpacing="2px" color={ACCENT} mb={4}>Our Mission</Text>
            <Text as="h2" fontSize={{ base: "4xl", md: "64px" }} fontWeight="700" textTransform="uppercase" lineHeight="0.95" letterSpacing="tight">
              The fine print<br /><Text as="span" bg={YELLOW} color="#000" px={2}>shouldn't be</Text><br />a trap.
            </Text>
            <Text fontSize="lg" color={MUTED} maxW="2xl" mx="auto" mt={6} lineHeight="1.7">
              Kredpane was built because no one should have to spend hours reading legal jargon to understand what rights they're signing away. We use AI to do that work for you, instantly.
            </Text>
          </Box>

          <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} mb={20}>
            <MissionCard title="Consumer First" text="Every feature we build is designed to give you power over agreements that were never written with your interests in mind." dot={YELLOW} />
            <MissionCard title="Instant Clarity" text="We turn dense legal text into plain English in seconds. No law degree required. Just paste and go." dot={MINT} />
            <MissionCard title="Privacy by Design" text="We don't sell your data. The irony of a ToS analyzer selling your data is not lost on us." dot={CYAN} />
            <MissionCard title="Open to All" text="Anyone who uses the internet should have access to this tool. No subscriptions, no paywalls to get started." dot={LAVENDER} />
          </Box>

          <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={16} alignItems="center">
            <Box>
              <Text fontSize="11px" fontWeight="700" textTransform="uppercase" letterSpacing="2px" color={ACCENT} mb={4}>Under the Hood</Text>
              <Text as="h3" fontSize={{ base: "3xl", md: "48px" }} fontWeight="700" textTransform="uppercase" lineHeight="1" mb={6}>
                Powered by State-of-the-Art AI
              </Text>
              <Text color={MUTED} lineHeight="1.7" mb={4}>
                Kredpane uses Llama 3.3 70B, a large language model with deep legal and linguistic comprehension, to read every clause, rate its severity, and explain what it means in plain language.
              </Text>
              <Text color={MUTED} lineHeight="1.7">
                The AI assigns each clause a severity score from 1 to 10 and categorises it into one of twelve risk categories, giving you a complete picture of any ToS document in under 30 seconds.
              </Text>
            </Box>
            <Flex direction="column" gap={4}>
              <SpecRow label="Model" value="Llama 3.3 70B Instruct" />
              <SpecRow label="Categories detected" value="12 risk types" />
              <SpecRow label="Severity scale" value="1–10 per clause" />
              <SpecRow label="Average analysis time" value="< 30 seconds" />
            </Flex>
          </Box>
        </Box>
      </Box>

      <Box id="faq" bg={SURFACE_1} pt="96px" pb="96px" position="relative" zIndex={8} borderTop="1px solid var(--line)">
        <Box maxW="3xl" mx="auto" px={6}>
          <Box textAlign="center" mb={16}>
            <Text fontSize="11px" fontWeight="700" textTransform="uppercase" letterSpacing="2px" color={ACCENT} mb={4}>Got Questions?</Text>
            <Text as="h2" fontSize={{ base: "4xl", md: "64px" }} fontWeight="700" textTransform="uppercase" lineHeight="0.95" letterSpacing="tight">
              Frequently<br /><Text as="span" bg={YELLOW} color="#000" px={2}>asked.</Text>
            </Text>
            <Text fontSize="lg" color={MUTED} maxW="xl" mx="auto" mt={6} lineHeight="1.7">
              Everything you need to know about Kredpane, how it works, and what it can do for you.
            </Text>
          </Box>

          <Flex direction="column" gap={4}>
            {FAQ.map((item, i) => (
              <Box key={item.q} border="1px solid var(--line)" borderRadius="20px" overflow="hidden" bg={SURFACE_2}>
                <Button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  w="100%" display="flex" alignItems="center" justifyContent="space-between"
                  px={8} py={6} h="auto" textAlign="left" bg="transparent" borderRadius={0}
                  _hover={{ bg: "var(--s3)" }}
                >
                  <Text fontSize="15px" fontWeight="700" textTransform="uppercase" letterSpacing="wide" color={FOREGROUND}>{item.q}</Text>
                  <Text color={MUTED} fontSize="sm" ml={4}>{openFaq === i ? "−" : "+"}</Text>
                </Button>
                {openFaq === i ? (
                  <Box px={8} pb={6}>
                    <Text color={MUTED} fontSize="sm" lineHeight="1.7">{item.a}</Text>
                  </Box>
                ) : null}
              </Box>
            ))}
          </Flex>
        </Box>
      </Box>

      <Box as="footer" bg="var(--page)" borderTop="1px solid var(--line)" py={16} px={6}>
        <Box maxW="1700px" mx="auto">
          <Flex direction={{ base: "column", md: "row" }} justify="space-between" gap={10} mb={12}>
            <Box maxW="xs">
              <HStack gap={3} mb={4}>
                <Box w="40px" h="40px" borderRadius="12px" bg={YELLOW} display="grid" placeItems="center">
                  <LogoIcon className="w-6 h-6 text-black" />
                </Box>
                <Text fontSize="xl" fontWeight="700" letterSpacing="0.2em" textTransform="uppercase">Kredpane</Text>
              </HStack>
              <Text color={MUTED} fontSize="sm" lineHeight="1.7">
                Consumer contract analysis. Know what you are agreeing to before you sign.
              </Text>
            </Box>
            <Box display="grid" gridTemplateColumns="1fr 1fr" columnGap={16} rowGap={4}>
              <Flex direction="column" gap={3}>
                <Text fontSize="11px" fontWeight="700" textTransform="uppercase" letterSpacing="1.4px" color={ACCENT}>Product</Text>
                <NavLink href="#top" small>Scan a contract</NavLink>
                <NavLink href="#about" small>About</NavLink>
                <NavLink href="#faq" small>FAQ</NavLink>
              </Flex>
              <Flex direction="column" gap={3}>
                <Text fontSize="11px" fontWeight="700" textTransform="uppercase" letterSpacing="1.4px" color={ACCENT}>Caught</Text>
                <Text fontSize="12px" fontWeight="700" textTransform="uppercase" letterSpacing="wide" color={MUTED}>Arbitration</Text>
                <Text fontSize="12px" fontWeight="700" textTransform="uppercase" letterSpacing="wide" color={MUTED}>Auto-renewal</Text>
                <Text fontSize="12px" fontWeight="700" textTransform="uppercase" letterSpacing="wide" color={MUTED}>Indemnity</Text>
              </Flex>
            </Box>
          </Flex>
          <Flex borderTop="1px solid var(--line)" pt={8} justify="space-between" gap={4} wrap="wrap" align="center">
            <Text color={MUTED} fontSize="12px" fontWeight="700" textTransform="uppercase" letterSpacing="0.1em">© 2026 Kredpane. All rights reserved.</Text>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}

function NavLink({ href, children, small }: { href: string; children: React.ReactNode; small?: boolean }) {
  return (
    <a
      href={href}
      className="kp-link"
      style={{ fontSize: small ? "12px" : "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED }}
    >
      {children}
    </a>
  );
}

function StatCard({ label, value, color, text }: { label: string; value: string; color: string; text: string }) {
  return (
    <Box flex="1" bg={SURFACE_2} borderRadius="20px" p={8} borderTop={`4px solid ${color}`} boxShadow="0 20px 25px -5px rgba(0,0,0,0.06)">
      <Text fontSize="11px" fontWeight="700" textTransform="uppercase" letterSpacing="1.2px" color={MUTED} mb={4}>{label}</Text>
      <Text fontSize="5xl" fontWeight="700" color={color} mb={2} lineHeight="1">{value}</Text>
      <Text color={FOREGROUND} fontSize="lg" lineHeight="1.6">{text}</Text>
    </Box>
  );
}

function StepCard({ step, title, text, mt }: { step: string; title: string; text: string; mt?: object }) {
  return (
    <Box flex="1" bg={CREAM} borderRadius="30px" p={10} mt={mt} _hover={{ transform: "translateY(-8px)" }} transition="transform 0.3s">
      <Text fontSize="xs" fontWeight="700" color="var(--cream-muted)" textTransform="uppercase" letterSpacing="0.1em" mb={4}>{step}</Text>
      <Text as="h3" fontSize={{ base: "32px", md: "40px" }} fontWeight="700" color="var(--cream-ink)" textTransform="uppercase" lineHeight="1.1" mb={4}>{title}</Text>
      <Text color="var(--cream-soft)" fontSize="lg" lineHeight="1.6">{text}</Text>
    </Box>
  );
}

function CatchCard({ title, text, bg, ink }: { title: string; text: string; bg: string; ink: string }) {
  return (
    <Box bg={bg} borderRadius="30px" p={10} position="relative" overflow="hidden">
      <Text fontSize="xs" fontWeight="700" color={`${ink}99`} textTransform="uppercase" letterSpacing="0.1em" mb={4}>Category</Text>
      <Text as="h3" fontSize={{ base: "32px", md: "40px" }} fontWeight="700" color={ink} textTransform="uppercase" lineHeight="1.1" mb={4}>{title}</Text>
      <Text color={`${ink}cc`} lineHeight="1.6">{text}</Text>
    </Box>
  );
}

function MissionCard({ title, text, dot }: { title: string; text: string; dot: string }) {
  return (
    <Box bg={SURFACE_1} borderRadius="30px" p={10} border="1px solid var(--line)">
      <Box w="48px" h="48px" borderRadius="full" bg={dot} mb={6} />
      <Text as="h3" fontSize="2xl" fontWeight="700" textTransform="uppercase" mb={3}>{title}</Text>
      <Text color={MUTED} lineHeight="1.7">{text}</Text>
    </Box>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <Flex justify="space-between" align="center" px={6} py={4} bg={SURFACE_2} borderRadius="16px" border="1px solid var(--line)">
      <Text fontSize="12px" fontWeight="700" textTransform="uppercase" letterSpacing="wider" color={MUTED}>{label}</Text>
      <Text fontSize="13px" fontWeight="700" textTransform="uppercase" letterSpacing="wide" color={ACCENT}>{value}</Text>
    </Flex>
  );
}
