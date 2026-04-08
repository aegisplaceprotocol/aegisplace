// ─────────────────────────────────────────────────────────────────────────────
// Aegis Protocol — Knowledge & Information Page
// "What is Aegis" meets "Why Aegis" meets "How it works"
// DM Sans + DM Mono, framer-motion, IntersectionObserver sticky nav
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — exact match to SkillsMarketplace
───────────────────────────────────────────────────────────────────────────── */
const T = {
  bg: "#0A0A0B",
  card: "rgba(255,255,255,0.015)",
  cardHover: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.05)",
  borderSubtle: "rgba(255,255,255,0.03)",
  borderHover: "rgba(255,255,255,0.08)",
  text95: "rgba(255,255,255,0.92)",
  text80: "rgba(255,255,255,0.72)",
  text50: "rgba(255,255,255,0.44)",
  text30: "rgba(255,255,255,0.28)",
  text20: "rgba(255,255,255,0.18)",
  text12: "rgba(255,255,255,0.10)",
  accent: "rgba(52,211,153,0.60)",
  accentSubtle: "rgba(52,211,153,0.12)",
  accentBorder: "rgba(52,211,153,0.25)",
  white2: "rgba(255,255,255,0.02)",
  white4: "rgba(255,255,255,0.04)",
  white6: "rgba(255,255,255,0.06)",
};

const FONT_SANS = "'DM Sans', 'Helvetica Neue', sans-serif";
const FONT_MONO = "'DM Mono', 'SF Mono', 'Fira Code', monospace";
const EASE_STANDARD = "easeOut" as const;

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION DEFINITIONS
───────────────────────────────────────────────────────────────────────────── */
const SECTIONS = [
  { id: "what-is-aegis",       label: "What is Aegis" },
  { id: "the-problem",         label: "The Problem" },
  { id: "the-solution",        label: "The Solution" },
  { id: "how-it-works",        label: "How It Works" },
  { id: "market-opportunity",  label: "Market Opportunity" },
  { id: "technology",          label: "Technology" },
  { id: "for-creators",        label: "For Creators" },
  { id: "integrations",        label: "Integrations" },
  { id: "faq",                 label: "FAQ" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATION PRESETS
───────────────────────────────────────────────────────────────────────────── */
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: EASE_STANDARD },
};

const fadeUpDelay = (delay: number) => ({
  ...fadeUp,
  transition: { duration: 0.55, delay, ease: EASE_STANDARD },
});

/* ─────────────────────────────────────────────────────────────────────────────
   FAQ DATA
───────────────────────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: "What is Aegis Protocol?",
    a: "Aegis is the skills marketplace and IDE for AI agents on Solana. It lets developers publish skills that any AI agent can discover and pay for, with every call scanned by NVIDIA NeMo guardrails and settled in USDC via the x402 payment protocol.",
  },
  {
    q: "What is x402?",
    a: "x402 is an internet payment standard built on HTTP 402. It lets machines pay machines autonomously in USDC without wallets, logins, or human intervention. Visa, Mastercard, Google, and Stripe all back it through the Linux Foundation.",
  },
  {
    q: "How do creators get paid?",
    a: "When a skill is invoked, 85% of the fee goes directly to the creator's wallet in USDC, settled in approximately 400ms on Solana. There are no invoices, no monthly payouts, and no minimums.",
  },
  {
    q: "What chains does Aegis support?",
    a: "Aegis settles on Solana. Solana offers 400ms finality and $0.00025 per transaction, making it practical for micropayments at the scale AI agents require.",
  },
  {
    q: "How does NeMo protect agents?",
    a: "Every call through Aegis passes four checks from NVIDIA NeMo: input scan, output scan, content filter, and anomaly detection. No invocation is delivered without clearing all four layers.",
  },
  {
    q: "What is the fee split?",
    a: "85% goes to the skill creator. 10% goes to validator nodes. 3% funds the treasury. 1.5% goes into an insurance pool. The remaining 0.5% is burned.",
  },
  {
    q: "Can I use Aegis with Claude Code or Cursor?",
    a: "Yes. Any MCP-compatible tool can connect to Aegis skills directly. Claude Code, Cursor, and Continue all support MCP, so you can invoke skills without leaving your IDE.",
  },
  {
    q: "What is a Solana Blink?",
    a: "A Blink is a shareable link that carries a Solana action. Every Aegis skill has a Blink, so you can post it on Twitter and anyone can invoke the skill with one click.",
  },
  {
    q: "How many skills are available?",
    a: "148+ skills across 19 categories are live on mainnet today, ranging from code analysis and DeFi tools to content generation and data enrichment.",
  },
  {
    q: "Is Aegis open source?",
    a: "The Aegis SDK and MCP server are open source. The marketplace infrastructure and NeMo integration layer are proprietary. The smart contracts are publicly verifiable on Solana mainnet.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION HEADING COMPONENT
───────────────────────────────────────────────────────────────────────────── */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: "clamp(22px, 2.6vw, 32px)",
      fontWeight: 300,
      color: T.text95,
      letterSpacing: "-0.025em",
      margin: "0 0 12px",
      lineHeight: 1.2,
      fontFamily: FONT_SANS,
    }}>
      {children}
    </h2>
  );
}

function SectionLead({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 16,
      color: T.text50,
      lineHeight: 1.65,
      margin: "0 0 40px",
      fontFamily: FONT_SANS,
      fontWeight: 400,
      maxWidth: 640,
    }}>
      {children}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CARD COMPONENT
───────────────────────────────────────────────────────────────────────────── */
function InfoCard({
  children,
  style,
  hoverable,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  hoverable?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => hoverable && setHovered(true)}
      onMouseLeave={() => hoverable && setHovered(false)}
      style={{
        background: hovered ? T.cardHover : T.card,
        border: `1px solid ${hovered ? T.borderHover : T.border}`,
        borderRadius: 10,
        padding: 28,
        transition: "background 0.2s ease, border-color 0.2s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FAQ ACCORDION ITEM
───────────────────────────────────────────────────────────────────────────── */
function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div {...fadeUpDelay(index * 0.04)}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          borderBottom: `1px solid ${T.border}`,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 0",
          gap: 16,
        }}>
          <span style={{
            fontSize: 15,
            fontWeight: 400,
            color: open ? T.text95 : T.text80,
            fontFamily: FONT_SANS,
            lineHeight: 1.4,
            transition: "color 0.15s ease",
          }}>
            {q}
          </span>
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            style={{
              flexShrink: 0,
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: T.text30,
              fontSize: 20,
              lineHeight: 1,
              fontWeight: 300,
            }}
          >
            +
          </motion.span>
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: "hidden" }}
            >
              <p style={{
                fontSize: 14,
                color: T.text50,
                lineHeight: 1.7,
                margin: "0 0 20px",
                fontFamily: FONT_SANS,
                paddingRight: 32,
              }}>
                {a}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FEE SPLIT BAR
───────────────────────────────────────────────────────────────────────────── */
function FeeSplitBar() {
  const segments = [
    { label: "Creator", pct: 85, opacity: 0.82 },
    { label: "Validators", pct: 10, opacity: 0.38 },
    { label: "Treasury", pct: 3, opacity: 0.22 },
    { label: "Insurance", pct: 1.5, opacity: 0.14 },
    { label: "Burn", pct: 0.5, opacity: 0.08 },
  ];

  return (
    <div style={{ width: "100%" }}>
      {/* Bar */}
      <div style={{
        display: "flex",
        height: 10,
        borderRadius: 6,
        overflow: "hidden",
        gap: 2,
        marginBottom: 16,
      }}>
        {segments.map((s) => (
          <motion.div
            key={s.label}
            initial={{ scaleX: 0, transformOrigin: "left" }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              flex: s.pct,
              background: `rgba(255,255,255,${s.opacity})`,
              borderRadius: 4,
            }}
          />
        ))}
      </div>
      {/* Labels */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {segments.map((s) => (
          <div key={s.label} style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginRight: 12,
            marginBottom: 6,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: `rgba(255,255,255,${s.opacity})`,
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 11,
              color: T.text50,
              fontFamily: FONT_MONO,
              fontVariantNumeric: "tabular-nums",
            }}>
              {s.pct}% {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STEP FLOW
───────────────────────────────────────────────────────────────────────────── */
const STEPS = [
  {
    num: "01",
    title: "Creator publishes",
    body: "A developer wraps any function as an Aegis skill, sets a per-call price in USDC, and publishes it to the marketplace. The skill is listed instantly across all discovery protocols.",
  },
  {
    num: "02",
    title: "Agent discovers",
    body: "Any AI agent finds the skill via MCP, A2A, or a Solana Blink. No API keys required. The skill appears in Claude Code, Cursor, and Google agent contexts automatically.",
  },
  {
    num: "03",
    title: "Agent pays",
    body: "The agent sends a USDC micropayment via x402. The request is authenticated, the fee is locked, and the call proceeds. The whole handshake takes under 50 milliseconds.",
  },
  {
    num: "04",
    title: "NeMo scans",
    body: "NVIDIA NeMo checks the input before execution and the output before delivery. Four layers: input filter, output filter, content policy, and anomaly detection. Nothing slips through.",
  },
  {
    num: "05",
    title: "Fees split and settle",
    body: "Solana settles the payment in approximately 400ms. The fee splits atomically into five wallets: 85% creator, 10% validators, 3% treasury, 1.5% insurance, 0.5% burn.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function Docs() {
  const [activeSection, setActiveSection] = useState<SectionId>("what-is-aegis");
  const [stickyNavStuck, setStickyNavStuck] = useState(false);
  const stickyRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  /* Sticky nav sentinel */
  useEffect(() => {
    const sentinel = document.createElement("div");
    sentinel.style.height = "1px";
    sentinel.style.width = "100%";
    stickyRef.current?.parentElement?.insertBefore(sentinel, stickyRef.current);
    const obs = new IntersectionObserver(([e]) => setStickyNavStuck(!e.isIntersecting), { threshold: 1 });
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  /* IntersectionObserver for active section */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      fontFamily: FONT_SANS,
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: rgba(52,211,153,0.18); }
        .docs-section-nav::-webkit-scrollbar { display: none; }
        .docs-section-nav { scrollbar-width: none; -ms-overflow-style: none; }
        @media (max-width: 900px) {
          .docs-two-col { grid-template-columns: 1fr !important; gap: 32px !important; }
          .docs-three-col { grid-template-columns: 1fr !important; }
          .docs-four-col { grid-template-columns: repeat(2, 1fr) !important; }
          .docs-steps { flex-direction: column !important; }
          .docs-step-arrow { display: none !important; }
          .docs-step-arrow { display: none !important; }
          .docs-comp-table { font-size: 12px !important; }
        }
        @media (max-width: 600px) {
          .docs-four-col { grid-template-columns: 1fr !important; }
          .docs-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div style={{
        width: "100%",
        paddingTop: 64,
        position: "relative",
        overflow: "hidden",
        borderBottom: `1px solid ${T.borderSubtle}`,
      }}>
        {/* Video background */}
        <video
          autoPlay loop muted playsInline
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%",
            objectFit: "cover", opacity: 0.18,
            pointerEvents: "none", zIndex: 0,
          }}
        >
          <source src="/videos/AegisSprite.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(180deg, rgba(10,10,11,0.3) 0%, rgba(10,10,11,0.7) 70%, ${T.bg} 100%)`,
          zIndex: 1, pointerEvents: "none",
        }} />
        {/* Subtle radial accent */}
        <div style={{
          position: "absolute", inset: 0,
          background: `
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(52,211,153,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 40% 60% at 10% 80%, rgba(52,211,153,0.025) 0%, transparent 50%)
          `,
          zIndex: 2, pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 1520, margin: "0 auto", padding: "52px 48px 52px", position: "relative", zIndex: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}
          >
            <img src="/icon.png" alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
            <h1 style={{
              fontSize: "clamp(30px, 4.5vw, 46px)",
              fontWeight: 300,
              color: T.text95,
              letterSpacing: "-0.03em",
              margin: 0,
              lineHeight: 1.1,
              fontFamily: FONT_SANS,
            }}>
              Aegis Protocol
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              fontSize: 16, color: T.text50, margin: 0,
              lineHeight: 1.65, maxWidth: 560, fontFamily: FONT_SANS, fontWeight: 400,
            }}
          >
            The skills marketplace and IDE for AI agents on Solana. 148+ skills. 19 categories. Every call scanned by NVIDIA NeMo. Settled in USDC via x402.
          </motion.p>
        </div>
      </div>

      {/* ── STICKY SECTION NAV ───────────────────────────────────────────── */}
      <div
        ref={stickyRef}
        style={{
          position: "sticky", top: 56, zIndex: 40,
          background: T.bg,
          borderBottom: `1px solid ${stickyNavStuck ? T.border : T.borderSubtle}`,
          transition: "border-color 0.2s ease",
        }}
      >
        <div style={{ maxWidth: 1520, margin: "0 auto", padding: "0 48px" }}>
          <div
            className="docs-section-nav"
            style={{
              display: "flex",
              gap: 0,
              overflowX: "auto",
              alignItems: "stretch",
            }}
          >
            {SECTIONS.map(({ id, label }) => {
              const active = activeSection === id;
              return (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: `2px solid ${active ? T.text95 : "transparent"}`,
                    padding: "16px 18px",
                    fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    color: active ? T.text95 : T.text30,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontFamily: FONT_SANS,
                    letterSpacing: "0.01em",
                    transition: "color 0.15s ease, border-color 0.15s ease, font-weight 0.15s ease",
                    flexShrink: 0,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1520, margin: "0 auto", padding: "0 48px" }}>

        {/* ═══ SECTION 1: WHAT IS AEGIS ═══════════════════════════════════ */}
        <section id="what-is-aegis" style={{ paddingTop: 80, paddingBottom: 80, borderBottom: `1px solid ${T.borderSubtle}` }}>
          <motion.div {...fadeUp}>
            <SectionHeading>What is Aegis</SectionHeading>
            <SectionLead>
              The skills marketplace and IDE for AI agents on Solana. Published skills are discoverable, invocable, and paid per call with USDC. Every invocation is scanned by NVIDIA NeMo.
            </SectionLead>
          </motion.div>

          <div
            className="docs-two-col"
            style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 48, alignItems: "start" }}
          >
            {/* Left: text */}
            <div>
              <motion.div {...fadeUpDelay(0.05)}>
                <p style={{ fontSize: 15, color: T.text80, lineHeight: 1.75, margin: "0 0 20px", fontFamily: FONT_SANS }}>
                  Aegis is where AI agents find the tools they need. It is a marketplace of callable skills: discrete, priced functions that any agent can discover, invoke, and pay for without human intervention. Think of it as the App Store for AI agents, built on Solana, with every transaction settled in USDC and every call inspected by NVIDIA NeMo.
                </p>
                <p style={{ fontSize: 15, color: T.text80, lineHeight: 1.75, margin: "0 0 20px", fontFamily: FONT_SANS }}>
                  The protocol serves two audiences. Developers publish skills: anything from a code linter to a DeFi arbitrage engine to a sentiment analyzer. Agents consume those skills. Payment flows automatically from the agent to the creator in approximately 400 milliseconds, with no invoices, no API key management, and no friction on either side.
                </p>
                <p style={{ fontSize: 15, color: T.text80, lineHeight: 1.75, margin: "0 0 20px", fontFamily: FONT_SANS }}>
                  NeMo safety scans are what make Aegis different from every other marketplace. Every invocation passes four NeMo guardrail checks before a result is returned. Creators do not have to think about prompt injection, jailbreaks, or policy violations. Aegis handles it at the infrastructure level.
                </p>
                <p style={{ fontSize: 15, color: T.text80, lineHeight: 1.75, margin: 0, fontFamily: FONT_SANS }}>
                  Skills are discoverable through three protocols simultaneously: MCP (the standard for IDE-based agents), Google A2A (the standard for cloud agents), and Solana Blinks (the standard for social distribution). A skill published once is reachable everywhere agents exist.
                </p>
              </motion.div>
            </div>

            {/* Right: key facts card */}
            <motion.div
              {...fadeUpDelay(0.12)}
            >
              <InfoCard>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: T.text20,
                  letterSpacing: "0.10em", textTransform: "uppercase",
                  fontFamily: FONT_SANS, marginBottom: 24,
                }}>
                  Key Facts
                </div>
                {[
                  { stat: "148+", label: "skills live on mainnet" },
                  { stat: "19", label: "categories" },
                  { stat: "85%", label: "creator earnings per call" },
                  { stat: "Solana", label: "settlement layer" },
                  { stat: "NVIDIA NeMo", label: "guardrails on every call" },
                  { stat: "400ms", label: "average settlement time" },
                  { stat: "$0.00025", label: "cost per Solana transaction" },
                ].map(({ stat, label }, i) => (
                  <div key={label} style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: `1px solid ${T.borderSubtle}`,
                    gap: 16,
                  }}>
                    <span style={{
                      fontSize: 11,
                      color: T.text30,
                      fontFamily: FONT_SANS,
                      letterSpacing: "0.01em",
                      flex: 1,
                    }}>
                      {label}
                    </span>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: T.text95,
                      fontFamily: FONT_MONO,
                      fontVariantNumeric: "tabular-nums",
                      flexShrink: 0,
                    }}>
                      {stat}
                    </span>
                  </div>
                ))}
              </InfoCard>
            </motion.div>
          </div>
        </section>

        {/* ═══ SECTION 2: THE PROBLEM ══════════════════════════════════════ */}
        <section id="the-problem" style={{ paddingTop: 80, paddingBottom: 80, borderBottom: `1px solid ${T.borderSubtle}` }}>
          <motion.div {...fadeUp}>
            <SectionHeading>The Problem</SectionHeading>
            <SectionLead>
              The AI agent economy is growing faster than the infrastructure supporting it. Three gaps held it back. Two were solved. One was not.
            </SectionLead>
          </motion.div>

          <div
            className="docs-three-col"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 40 }}
          >
            {[
              {
                status: "Solved",
                statusColor: T.text50,
                gap: "Discovery",
                sub: "How does an agent find a tool it needs?",
                body1: "Before MCP, every agent needed custom integrations. There was no standard for tool discovery, no registry, no contract. Developers built one-off connectors that broke every time an API changed.",
                body2: "MCP solved it. The Model Context Protocol gives every tool a standard interface. Today there are over 19,000 MCP servers. Agents built on any platform can discover and invoke any MCP-compatible tool.",
                credit: "MCP: 19K+ servers. The discovery layer exists.",
              },
              {
                status: "Solved",
                statusColor: T.text50,
                gap: "Payments",
                sub: "How does an agent pay for what it uses?",
                body1: "Agents cannot hold credit cards. They cannot log into payment portals or manage subscription tiers. Traditional payment rails assume a human on the other end. That assumption breaks the entire model.",
                body2: "x402 solved it. The HTTP 402 payment standard lets machines pay machines in USDC, per call, with no human in the loop. Over 140 million transactions have been processed under this standard.",
                credit: "x402: 140M+ transactions. The payment layer exists.",
              },
              {
                status: "Not solved. This is Aegis.",
                statusColor: T.text95,
                gap: "Quality",
                sub: "How do you know a tool is safe to invoke?",
                body1: "No registry audits what a skill returns. No standard exists for prompt injection protection, output filtering, or anomaly detection across callable tools. The attack surface is wide open.",
                body2: "Aegis fills this gap. Every skill in the marketplace runs through NVIDIA NeMo guardrails on input and output. There is no other marketplace that makes safety scanning a first-class feature.",
                credit: "Quality: nobody solved it. Until Aegis.",
                code: `// programs/aegis/src/errors.rs
#[error_code]
pub enum AegisError {
    #[msg("Fee basis points must sum to exactly 10000")]
    InvalidFeeBpsSum,
    #[msg("Operator is not active")]
    OperatorNotActive,
    #[msg("Insufficient USDC for invocation")]
    InsufficientFunds,
    #[msg("Caller is not the admin")]
    Unauthorized,
}`,
              },
            ].map(({ status, statusColor, gap, sub, body1, body2, credit, code }: any, i: number) => (
              <motion.div key={gap} {...fadeUpDelay(i * 0.08)}>
                <InfoCard hoverable style={{ height: "100%" }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600,
                    color: i === 2 ? T.text95 : T.text30,
                    letterSpacing: "0.10em", textTransform: "uppercase",
                    fontFamily: FONT_SANS, marginBottom: 12,
                  }}>
                    {status}
                  </div>
                  <h3 style={{
                    fontSize: 20, fontWeight: 300, color: T.text95,
                    letterSpacing: "-0.02em", margin: "0 0 6px",
                    fontFamily: FONT_SANS,
                  }}>
                    {gap}
                  </h3>
                  <p style={{
                    fontSize: 13, color: T.text30, fontStyle: "italic",
                    margin: "0 0 16px", fontFamily: FONT_SANS, lineHeight: 1.5,
                  }}>
                    {sub}
                  </p>
                  <p style={{ fontSize: 14, color: T.text50, lineHeight: 1.7, margin: "0 0 12px", fontFamily: FONT_SANS }}>
                    {body1}
                  </p>
                  <p style={{ fontSize: 14, color: T.text50, lineHeight: 1.7, margin: code ? "0 0 16px" : "0 0 20px", fontFamily: FONT_SANS }}>
                    {body2}
                  </p>
                  {code && (
                    <pre style={{
                      margin: "0 0 16px", padding: 14, borderRadius: 8,
                      background: "#0c0c0e", border: `1px solid ${T.borderSubtle}`,
                      fontFamily: "'DM Mono', monospace", fontSize: 10.5,
                      lineHeight: 1.6, color: "rgba(255,255,255,0.55)",
                      overflowX: "auto", whiteSpace: "pre",
                    }}>
                      {code}
                    </pre>
                  )}
                  <div style={{
                    fontSize: 11, color: i === 2 ? T.text95 : T.text30,
                    fontFamily: FONT_MONO, borderTop: `1px solid ${T.borderSubtle}`,
                    paddingTop: 14, lineHeight: 1.5,
                  }}>
                    {credit}
                  </div>
                </InfoCard>
              </motion.div>
            ))}
          </div>

          {/* Quote cards */}
          <div
            className="docs-three-col"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}
          >
            {[
              {
                quote: "The agent-to-agent economy is the next frontier of crypto. The protocols that enable it will be infrastructure plays of lasting value.",
                source: "a16z Crypto",
              },
              {
                quote: "Solana is the settlement layer for the machine economy. Speed and cost at this level are non-negotiable for autonomous payments.",
                source: "Solana Foundation",
              },
              {
                quote: "x402 is the HTTP status code that was always meant to mean something. Now it does. Machines paying machines is no longer science fiction.",
                source: "Circle CEO",
              },
            ].map(({ quote, source }, i) => (
              <motion.div key={source} {...fadeUpDelay(i * 0.06)}>
                <div style={{
                  background: T.white2,
                  border: `1px solid ${T.borderSubtle}`,
                  borderRadius: 10,
                  padding: "22px 24px",
                }}>
                  <p style={{
                    fontSize: 13, color: T.text50, lineHeight: 1.7,
                    margin: "0 0 14px", fontFamily: FONT_SANS, fontStyle: "italic",
                  }}>
                    "{quote}"
                  </p>
                  <div style={{
                    fontSize: 10, color: T.text20, fontFamily: FONT_SANS,
                    fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>
                    {source}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ SECTION 3: THE SOLUTION ═════════════════════════════════════ */}
        <section id="the-solution" style={{ paddingTop: 80, paddingBottom: 80, borderBottom: `1px solid ${T.borderSubtle}` }}>
          <motion.div {...fadeUp}>
            <SectionHeading>The Solution</SectionHeading>
            <SectionLead>
              Aegis is the skills marketplace the agent economy is missing. It combines curated skills, NeMo safety scans, payments, and AegisX IDE access in a single protocol.
            </SectionLead>
          </motion.div>

          <div
            className="docs-two-col"
            style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 48, alignItems: "start" }}
          >
            {/* Left: what Aegis provides */}
            <motion.div {...fadeUpDelay(0.05)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  {
                    title: "Marketplace",
                    body: "148+ skills across 19 categories. Every skill has a standard interface, a price in USDC, and a trust score built from invocation history. Agents can filter, compare, and invoke without human setup.",
                    code: `// programs/aegis/src/state.rs
#[account]
pub struct Operator {
    pub creator: Pubkey,
    pub operator_id: u64,
    pub name: String,        // max 64 bytes
    pub slug: String,        // max 64 bytes
  pub metadata_uri: String, // max 200 bytes
    pub price_usdc_base: u64,
    pub trust_score: u16,    // 0 to 10000
    pub total_invocations: u64,
    pub is_active: bool,
}`,
                  },
                  {
                    title: "Quality Guardrails",
                    body: "Every call passes NVIDIA NeMo input and output scans before execution and before delivery. Four layers: input filter, output filter, content policy enforcement, and anomaly detection. No exceptions.",
                    code: `# guardrails/aegis-security/config.yml
rails:
  input:
    flows:
      - content safety check input
      - check jailbreak
      - mask sensitive data on input
      - check injection
  output:
    flows:
      - content safety check output
      - self check hallucination`,
                  },
                  {
                    title: "Autonomous Payments",
                    body: "Skills are paid per call in USDC via the x402 HTTP payment standard. Agents send payment, payment is verified on Solana, the skill executes. The entire cycle takes under 400 milliseconds.",
                    code: `// aegis-backend/src/x402.ts
// HTTP 402 payment gate middleware
if (!paymentHeader) {
  return res.status(402).json({
    x402Version: 2,
    network: "solana:mainnet-beta",
    usdcMint: "EPjFWdd5AufqSSq...",
    amount: operator.pricePerCall,
    recipient: operator.creatorWallet,
  });
}`,
                  },
                  {
                    title: "IDE Integration",
                    body: "Aegis skills surface inside Claude Code, Cursor, and any MCP-compatible IDE via the AegisX plugin. Developers invoke skills without leaving their editor. No dashboard, no API keys, no friction.",
                  },
                ].map(({ title, body, code }: any) => (
                  <InfoCard key={title} hoverable>
                    <h3 style={{
                      fontSize: 14, fontWeight: 500, color: T.text95,
                      margin: "0 0 8px", fontFamily: FONT_SANS, letterSpacing: "0.01em",
                    }}>
                      {title}
                    </h3>
                    <p style={{ fontSize: 14, color: T.text50, lineHeight: 1.7, margin: code ? "0 0 16px" : 0, fontFamily: FONT_SANS }}>
                      {body}
                    </p>
                    {code && (
                      <pre style={{
                        margin: 0, padding: 14, borderRadius: 8,
                        background: "#0c0c0e", border: `1px solid ${T.borderSubtle}`,
                        fontFamily: "'DM Mono', monospace", fontSize: 10.5,
                        lineHeight: 1.6, color: "rgba(255,255,255,0.55)",
                        overflowX: "auto", whiteSpace: "pre",
                      }}>
                        {code}
                      </pre>
                    )}
                  </InfoCard>
                ))}
              </div>
            </motion.div>

            {/* Right: fee split */}
            <motion.div {...fadeUpDelay(0.12)}>
              <InfoCard>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: T.text20,
                  letterSpacing: "0.10em", textTransform: "uppercase",
                  fontFamily: FONT_SANS, marginBottom: 12,
                }}>
                  Fee Split
                </div>
                <p style={{
                  fontSize: 13, color: T.text30, lineHeight: 1.6,
                  margin: "0 0 24px", fontFamily: FONT_SANS,
                }}>
                  Every call fee splits atomically into five recipients on Solana. No manual distribution. No delay.
                </p>
                <FeeSplitBar />
                <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { pct: "85%", label: "Creator", note: "Paid immediately to the skill author's wallet." },
                    { pct: "10%", label: "Validators", note: "Node operators who verify NeMo scan results." },
                    { pct: "3%", label: "Treasury", note: "Protocol development and grants." },
                    { pct: "1.5%", label: "Insurance", note: "Covers disputed or failed calls." },
                    { pct: "0.5%", label: "Burn", note: "Deflationary pressure on the protocol token." },
                  ].map(({ pct, label, note }) => (
                    <div key={label} style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      paddingBottom: 12, borderBottom: `1px solid ${T.borderSubtle}`,
                    }}>
                      <span style={{
                        fontSize: 13, fontWeight: 500, color: T.text95,
                        fontFamily: FONT_MONO, minWidth: 36,
                        fontVariantNumeric: "tabular-nums",
                      }}>
                        {pct}
                      </span>
                      <div>
                        <div style={{ fontSize: 12, color: T.text80, fontFamily: FONT_SANS, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 11, color: T.text30, fontFamily: FONT_SANS, lineHeight: 1.5 }}>{note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </InfoCard>
            </motion.div>
          </div>
        </section>

        {/* ═══ SECTION 4: HOW IT WORKS ═════════════════════════════════════ */}
        <section id="how-it-works" style={{ paddingTop: 80, paddingBottom: 80, borderBottom: `1px solid ${T.borderSubtle}` }}>
          <motion.div {...fadeUp}>
            <SectionHeading>How It Works</SectionHeading>
            <SectionLead>
              From skill publication to result delivery. Five steps. No human in the loop after setup.
            </SectionLead>
          </motion.div>

          <div
            className="docs-steps"
            style={{ display: "flex", gap: 0, alignItems: "stretch" }}
          >
            {STEPS.map((step, i) => (
              <div key={step.num} style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
                <motion.div {...fadeUpDelay(i * 0.07)} style={{ flex: 1 }}>
                  <InfoCard hoverable style={{ height: "100%" }}>
                    <div style={{
                      fontSize: 11, fontWeight: 500, color: T.text20,
                      fontFamily: FONT_MONO, marginBottom: 16, letterSpacing: "0.05em",
                    }}>
                      {step.num}
                    </div>
                    <h3 style={{
                      fontSize: 15, fontWeight: 500, color: T.text95,
                      margin: "0 0 12px", fontFamily: FONT_SANS,
                    }}>
                      {step.title}
                    </h3>
                    <p style={{ fontSize: 13, color: T.text50, lineHeight: 1.7, margin: 0, fontFamily: FONT_SANS }}>
                      {step.body}
                    </p>
                  </InfoCard>
                </motion.div>
                {i < STEPS.length - 1 && (
                  <div
                    className="docs-step-arrow"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 24, flexShrink: 0,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6h8M7 3l3 3-3 3" stroke={T.text20} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <motion.div {...fadeUpDelay(0.1)} style={{ marginTop: 40 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: T.text20,
              letterSpacing: "0.10em", textTransform: "uppercase",
              fontFamily: FONT_SANS, marginBottom: 12,
            }}>
              On-chain event emitted on every invocation
            </div>
            <pre style={{
              margin: 0, padding: 14, borderRadius: 8,
              background: "#0c0c0e", border: `1px solid ${T.borderSubtle}`,
              fontFamily: "'DM Mono', monospace", fontSize: 10.5,
              lineHeight: 1.6, color: "rgba(255,255,255,0.55)",
              overflowX: "auto", whiteSpace: "pre",
            }}>{`// programs/aegis/src/events.rs
// Emitted on-chain for every skill invocation
#[event]
pub struct SkillInvoked {
    pub operator_id: u64,
    pub caller: Pubkey,
    pub amount: u64,
    pub creator_share: u64,
    pub validator_share: u64,
    pub treasury_share: u64,
    pub insurance_share: u64,
    pub burn_share: u64,
    pub timestamp: i64,
}`}</pre>
          </motion.div>
        </section>

        {/* ═══ SECTION 5: MARKET OPPORTUNITY ══════════════════════════════ */}
        <section id="market-opportunity" style={{ paddingTop: 80, paddingBottom: 80, borderBottom: `1px solid ${T.borderSubtle}` }}>
          <motion.div {...fadeUp}>
            <SectionHeading>Market Opportunity</SectionHeading>
            <SectionLead>
              The platforms AI agents run on have reached massive scale. None of them combine marketplace, quality, payments, and IDE. Aegis does.
            </SectionLead>
          </motion.div>

          {/* Stat grid */}
          <div
            className="docs-stat-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 40 }}
          >
            {[
              { stat: "$29B", label: "Cursor valuation", note: "The IDE where developers already work. AegisX plugs directly into it." },
              { stat: "20M", label: "GitHub Copilot users", note: "Active developers already comfortable with AI-assisted tooling." },
              { stat: "19K+", label: "MCP servers", note: "The discovery layer that Aegis skills are natively compatible with." },
              { stat: "140M+", label: "x402 transactions", note: "Proof that machine-to-machine payments at scale are real." },
            ].map(({ stat, label, note }, i) => (
              <motion.div key={label} {...fadeUpDelay(i * 0.06)}>
                <InfoCard hoverable>
                  <div style={{
                    fontSize: "clamp(28px, 3vw, 40px)",
                    fontWeight: 300,
                    color: T.text95,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    fontFamily: FONT_MONO,
                    fontVariantNumeric: "tabular-nums",
                    marginBottom: 8,
                  }}>
                    {stat}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 500, color: T.text50,
                    fontFamily: FONT_SANS, marginBottom: 10,
                  }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 12, color: T.text30, lineHeight: 1.6, fontFamily: FONT_SANS }}>
                    {note}
                  </div>
                </InfoCard>
              </motion.div>
            ))}
          </div>

          {/* Bags.fm callout */}
          <motion.div {...fadeUpDelay(0.1)}>
            <InfoCard style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <h3 style={{
                    fontSize: 16, fontWeight: 400, color: T.text95,
                    margin: "0 0 10px", fontFamily: FONT_SANS,
                  }}>
                    Bags.fm integration
                  </h3>
                  <p style={{ fontSize: 14, color: T.text50, lineHeight: 1.7, margin: 0, fontFamily: FONT_SANS }}>
                    Bags.fm has processed over $5 billion in volume and paid out more than $40 million to creators. Aegis skills are natively accessible through the Bags.fm creator platform, giving every Bags creator immediate access to the full Aegis skill catalog without any additional setup.
                  </p>
                </div>
                <div style={{
                  display: "flex", flexDirection: "column", gap: 8,
                  padding: "16px 24px",
                  background: T.white2,
                  border: `1px solid ${T.borderSubtle}`,
                  borderRadius: 8,
                  flexShrink: 0,
                }}>
                  <div style={{ display: "flex", gap: 24 }}>
                    {[
                      { stat: "$5B", label: "volume" },
                      { stat: "$40M", label: "creator payouts" },
                    ].map(({ stat, label }) => (
                      <div key={label}>
                        <div style={{
                          fontSize: 22, fontWeight: 300, color: T.text95,
                          fontFamily: FONT_MONO, letterSpacing: "-0.03em",
                          fontVariantNumeric: "tabular-nums",
                        }}>
                          {stat}
                        </div>
                        <div style={{ fontSize: 10, color: T.text30, fontFamily: FONT_SANS, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </InfoCard>
          </motion.div>

          {/* Competitive positioning */}
          <motion.div {...fadeUpDelay(0.15)}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: T.text20,
              letterSpacing: "0.10em", textTransform: "uppercase",
              fontFamily: FONT_SANS, marginBottom: 16,
            }}>
              Competitive Positioning
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                className="docs-comp-table"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                  fontFamily: FONT_SANS,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["", "Aegis", "MCPize", "Agent Bazaar", "Cursor", "Eliza"].map((h) => (
                      <th key={h} style={{
                        padding: "10px 16px",
                        textAlign: h === "" ? "left" : "center",
                        fontSize: 11, fontWeight: 600,
                        color: h === "Aegis" ? T.text95 : T.text20,
                        letterSpacing: "0.06em", textTransform: "uppercase",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Marketplace",         "yes", "yes", "yes", "no",  "no"],
                    ["Quality guardrails",  "yes", "no",  "no",  "no",  "no"],
                    ["Micropayments",       "yes", "no",  "no",  "no",  "no"],
                    ["IDE plugin",          "yes", "no",  "no",  "yes", "no"],
                    ["MCP compatible",      "yes", "yes", "no",  "yes", "no"],
                    ["Solana settlement",   "yes", "no",  "no",  "no",  "no"],
                  ].map(([feature, ...vals]) => (
                    <tr key={feature as string} style={{ borderBottom: `1px solid ${T.borderSubtle}` }}>
                      <td style={{ padding: "12px 16px", color: T.text50, fontFamily: FONT_SANS }}>
                        {feature}
                      </td>
                      {(vals as string[]).map((v, i) => (
                        <td key={i} style={{
                          padding: "12px 16px",
                          textAlign: "center",
                          color: v === "yes" ? (i === 0 ? T.text95 : T.text50) : T.text20,
                          fontFamily: FONT_MONO,
                          fontSize: 12,
                        }}>
                          {v === "yes" ? "yes" : "no"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>

        {/* ═══ SECTION 6: TECHNOLOGY ═══════════════════════════════════════ */}
        <section id="technology" style={{ paddingTop: 80, paddingBottom: 80, borderBottom: `1px solid ${T.borderSubtle}` }}>
          <motion.div {...fadeUp}>
            <SectionHeading>Technology Stack</SectionHeading>
            <SectionLead>
              Aegis is built on proven infrastructure. Each component is battle-tested at scale and backed by major institutions.
            </SectionLead>
          </motion.div>

          <div
            className="docs-four-col"
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}
          >
            {[
              {
                provider: "NVIDIA",
                title: "NeMo Guardrails",
                body1: "NVIDIA's NeMo Guardrails framework wraps every skill invocation in four protection layers. Input scanning blocks malicious prompts before they reach the skill. Output scanning catches policy violations before they reach the agent.",
                body2: "The content filter enforces operator-defined rules, and the anomaly detector flags unusual call patterns. No invocation completes without clearing all four checks. There are no bypass modes and no exception lists.",
                code: `# aegis-security/config.yml (live on GitHub)
models:
  - type: content_safety
    engine: nim
    model: nvidia/llama-3.1-nemoguard-8b-content-safety

rails:
  input:
    flows:
      - content safety check input
      - check jailbreak
      - mask sensitive data on input
      - check injection
      - check forbidden terms
  output:
    flows:
      - content safety check output
      - self check hallucination
      - check sensitive output`,
              },
              {
                provider: "Linux Foundation",
                title: "x402 Micropayments",
                body1: "x402 repurposes HTTP's 402 status code as a machine-readable payment request. When an agent hits a skill endpoint, the server returns a 402 with the USDC amount and Solana address. The agent pays, the server verifies, the call proceeds.",
                body2: "Visa, Mastercard, Google, Stripe, and Circle all back the x402 standard through the Linux Foundation. Over 140 million transactions have cleared under it. Aegis uses x402 for every skill invocation.",
                code: `// aegis-backend/src/x402.ts (live on GitHub)
// 85% creator, 10% validators, 3% treasury,
// 1.5% insurance, 0.5% burn
export function calculateFeeSplit(totalAtomic: number) {
  const creator   = Math.floor((totalAtomic * 8500) / 10_000);
  const validator  = Math.floor((totalAtomic * 1000) / 10_000);
  const treasury   = Math.floor((totalAtomic * 300)  / 10_000);
  const insurance  = Math.floor((totalAtomic * 150)  / 10_000);
  const burn       = Math.floor((totalAtomic * 50)   / 10_000);
  return { creator, validator, treasury, insurance, burn };
}`,
              },
              {
                provider: "Solana",
                title: "Solana Settlement",
                body1: "Solana delivers 400ms transaction finality at $0.00025 per transaction. For AI agents making thousands of micropayments per hour, those numbers matter. Any other chain makes per-call billing economically unviable.",
                body2: "Fee splits are executed atomically in a single transaction. The creator, validators, treasury, insurance pool, and burn address all receive their share in one operation. There is no partial state, no reconciliation, no delay.",
                code: `// programs/aegis/src/state.rs (live on GitHub)
#[account]
pub struct ProtocolConfig {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub validator_pool: Pubkey,
    pub insurance_fund: Pubkey,
    pub aegis_mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub total_operators: u64,
    pub total_invocations: u64,
    pub total_volume_lamports: u64,
    pub fee_bps: [u16; 6], // must sum to 10000
    pub bump: u8,
}`,
              },
              {
                provider: "Three Protocols",
                title: "MCP + A2A + Blinks",
                body1: "Skills on Aegis are discoverable through three protocols simultaneously. MCP makes them available inside Claude Code, Cursor, and Continue. Google A2A makes them accessible to any cloud-based agent that implements the agent communication protocol.",
                body2: "Solana Blinks turn any skill into a shareable link. Post a Blink on Twitter and anyone can invoke the skill with one click, with payment handled automatically. A skill published once reaches every distribution channel.",
                code: `// programs/aegis/src/events.rs (live on GitHub)
#[event]
pub struct SkillInvoked {
    pub operator_id: u64,
    pub caller: Pubkey,
    pub amount: u64,
    pub creator_share: u64,
    pub validator_share: u64,
    pub staker_share: u64,
    pub treasury_share: u64,
    pub insurance_share: u64,
    pub burn_share: u64,
    pub invocation_id: u64,
    pub timestamp: i64,
}`,
              },
            ].map(({ provider, title, body1, body2, code }, i) => (
              <motion.div key={title} {...fadeUpDelay(i * 0.07)}>
                <InfoCard hoverable style={{ height: "100%" }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: T.text20,
                    letterSpacing: "0.10em", textTransform: "uppercase",
                    fontFamily: FONT_SANS, marginBottom: 12,
                  }}>
                    {provider}
                  </div>
                  <h3 style={{
                    fontSize: 16, fontWeight: 400, color: T.text95,
                    margin: "0 0 14px", fontFamily: FONT_SANS, letterSpacing: "-0.01em",
                  }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: 13, color: T.text50, lineHeight: 1.75, margin: "0 0 12px", fontFamily: FONT_SANS }}>
                    {body1}
                  </p>
                  <p style={{ fontSize: 13, color: T.text50, lineHeight: 1.75, margin: code ? "0 0 16px" : 0, fontFamily: FONT_SANS }}>
                    {body2}
                  </p>
                  {code && (
                    <pre style={{
                      margin: 0, padding: 14, borderRadius: 8,
                      background: "#0c0c0e", border: `1px solid ${T.borderSubtle}`,
                      fontFamily: "'DM Mono', monospace", fontSize: 10.5,
                      lineHeight: 1.6, color: "rgba(255,255,255,0.55)",
                      overflowX: "auto", whiteSpace: "pre",
                    }}>
                      {code}
                    </pre>
                  )}
                </InfoCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ SECTION 7: FOR CREATORS ═════════════════════════════════════ */}
        <section id="for-creators" style={{ paddingTop: 80, paddingBottom: 80, borderBottom: `1px solid ${T.borderSubtle}` }}>
          <motion.div {...fadeUp}>
            <SectionHeading>For Creators</SectionHeading>
            <div style={{ marginBottom: 40 }}>
              <p style={{
                fontSize: "clamp(20px, 2.5vw, 28px)",
                fontWeight: 300, color: T.text80,
                letterSpacing: "-0.02em", lineHeight: 1.3,
                margin: 0, fontFamily: FONT_SANS,
              }}>
                Publish a skill. Earn 85% of every call.
              </p>
            </div>
          </motion.div>

          <div
            className="docs-two-col"
            style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 48, alignItems: "start" }}
          >
            <motion.div {...fadeUpDelay(0.05)}>
              <p style={{ fontSize: 15, color: T.text80, lineHeight: 1.75, margin: "0 0 20px", fontFamily: FONT_SANS }}>
                The creator economy on Aegis is straightforward. You write a function. You wrap it as an Aegis skill. You set a price per call in USDC. From that point on, every invocation earns 85% of the call fee, paid directly to your wallet in approximately 400 milliseconds.
              </p>
              <p style={{ fontSize: 15, color: T.text80, lineHeight: 1.75, margin: "0 0 20px", fontFamily: FONT_SANS }}>
                Pricing is entirely up to you. A simple utility skill might charge $0.001 per call. A complex data enrichment pipeline might charge $0.05. The marketplace surfaces your skill to every compatible agent, and your trust score improves as invocations accumulate. Higher trust scores improve placement in search results.
              </p>
              <p style={{ fontSize: 15, color: T.text80, lineHeight: 1.75, margin: "0 0 20px", fontFamily: FONT_SANS }}>
                The 19 categories cover code analysis, DeFi tools, data enrichment, content generation, sentiment analysis, image processing, translation, search, summarization, classification, and more. If you have a function that other agents would pay to use, there is a category for it.
              </p>
              <p style={{ fontSize: 15, color: T.text80, lineHeight: 1.75, margin: "0 0 20px", fontFamily: FONT_SANS }}>
                You do not need to manage payments, handle API keys, or run your own infrastructure. Aegis handles discovery, authentication, payment, guardrails, and settlement. Your only responsibility is building a skill that works.
              </p>

              <pre style={{
                margin: "0 0 32px", padding: 14, borderRadius: 8,
                background: "#0c0c0e", border: `1px solid ${T.borderSubtle}`,
                fontFamily: "'DM Mono', monospace", fontSize: 10.5,
                lineHeight: 1.6, color: "rgba(255,255,255,0.55)",
                overflowX: "auto", whiteSpace: "pre",
              }}>{`// programs/aegis/src/lib.rs
pub fn register_operator(
    ctx: Context<RegisterOperator>,
    name: String,
    slug: String,
    metadata_uri: String,
    price_usdc_base: u64,
    category: u8,
) -> Result<()>`}</pre>

              <a
                href="/skill-marketplace?tab=earn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  background: T.text95,
                  color: T.bg,
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: FONT_SANS,
                  textDecoration: "none",
                  letterSpacing: "0.01em",
                  transition: "opacity 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Start creating
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke={T.bg} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </motion.div>

            <motion.div {...fadeUpDelay(0.12)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { stat: "85%", label: "Your earnings", note: "Of every call fee, paid in USDC." },
                  { stat: "400ms", label: "Time to payment", note: "From invocation to wallet credit." },
                  { stat: "148+", label: "Skills in the marketplace", note: "Proven demand across 19 categories." },
                  { stat: "0", label: "Infrastructure to manage", note: "Aegis handles discovery, auth, payment, and guardrails." },
                  { stat: "USDC", label: "Settlement currency", note: "Stable, liquid, and global." },
                ].map(({ stat, label, note }, i) => (
                  <InfoCard key={label} hoverable>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: T.text30, fontFamily: FONT_SANS, marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 11, color: T.text20, fontFamily: FONT_SANS, lineHeight: 1.5 }}>{note}</div>
                      </div>
                      <div style={{
                        fontSize: 20, fontWeight: 300, color: T.text95,
                        fontFamily: FONT_MONO, letterSpacing: "-0.03em",
                        fontVariantNumeric: "tabular-nums", flexShrink: 0,
                      }}>
                        {stat}
                      </div>
                    </div>
                  </InfoCard>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ SECTION 8: INTEGRATIONS ═════════════════════════════════════ */}
        <section id="integrations" style={{ paddingTop: 80, paddingBottom: 80, borderBottom: `1px solid ${T.borderSubtle}` }}>
          <motion.div {...fadeUp}>
            <SectionHeading>Integrations</SectionHeading>
            <SectionLead>
              Aegis skills work with every major agent protocol. Publish once, reach every platform where agents run.
            </SectionLead>
          </motion.div>

          <div
            className="docs-four-col"
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}
          >
            {[
              {
                protocol: "MCP",
                title: "Model Context Protocol",
                body: "Any MCP-compatible tool can invoke Aegis skills directly. Claude Code, Cursor, and Continue all support MCP natively. Install the Aegis MCP server once and every skill in the marketplace appears as an available tool inside your IDE. No configuration per skill required.",
                detail: "97M monthly SDK downloads. The standard for IDE-based agents.",
                code: `{ "mcpServers": { "aegis": { "url": "https://aegisplace.com/mcp" } } }`,
              },
              {
                protocol: "A2A",
                title: "Agent-to-Agent Protocol",
                body: "Google's A2A protocol defines how autonomous agents communicate with each other. Aegis skills publish an A2A agent card that makes them discoverable and invokable by any A2A-compatible agent. If you build agents on Google Cloud or with Vertex AI, Aegis skills are natively accessible.",
                detail: "Google's standard for cloud-based agent orchestration.",
                code: `GET https://aegisplace.com/.well-known/agent.json`,
              },
              {
                protocol: "Blinks",
                title: "Solana Blinks",
                body: "Every Aegis skill has a Blink: a URL that carries a full Solana action. Share the link on Twitter and anyone can invoke the skill with one click, with x402 handling payment automatically. Blinks turn skills into social objects that can spread through any feed.",
                detail: "One click to invoke any skill from any social platform.",
                code: `https://dial.to/?action=solana-action:https://aegisplace.com/api/actions/{slug}`,
              },
              {
                protocol: "x402",
                title: "HTTP Payment Standard",
                body: "x402 is how Aegis handles payments. When an agent calls a skill, the server returns a 402 with the payment details. The agent's x402 client sends USDC to the Solana address specified, the payment is confirmed on-chain, and the skill executes. The agent never needs a wallet UI.",
                detail: "Linux Foundation standard. Visa, Mastercard, Google, Stripe backing.",
              },
            ].map(({ protocol, title, body, detail, code }: any, i: number) => (
              <motion.div key={protocol} {...fadeUpDelay(i * 0.07)}>
                <InfoCard hoverable style={{ height: "100%" }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: T.text20,
                    letterSpacing: "0.10em", textTransform: "uppercase",
                    fontFamily: FONT_SANS, marginBottom: 12,
                  }}>
                    {protocol}
                  </div>
                  <h3 style={{
                    fontSize: 15, fontWeight: 400, color: T.text95,
                    margin: "0 0 12px", fontFamily: FONT_SANS,
                  }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: 13, color: T.text50, lineHeight: 1.75, margin: "0 0 16px", fontFamily: FONT_SANS }}>
                    {body}
                  </p>
                  {code && (
                    <pre style={{
                      margin: "0 0 16px", padding: 14, borderRadius: 8,
                      background: "#0c0c0e", border: `1px solid ${T.borderSubtle}`,
                      fontFamily: "'DM Mono', monospace", fontSize: 10.5,
                      lineHeight: 1.6, color: "rgba(255,255,255,0.55)",
                      overflowX: "auto", whiteSpace: "pre",
                    }}>
                      {code}
                    </pre>
                  )}
                  <div style={{
                    fontSize: 11, color: T.text20, fontFamily: FONT_MONO,
                    borderTop: `1px solid ${T.borderSubtle}`, paddingTop: 12,
                    lineHeight: 1.5,
                  }}>
                    {detail}
                  </div>
                </InfoCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ SECTION 9: FAQ ══════════════════════════════════════════════ */}
        <section id="faq" style={{ paddingTop: 80, paddingBottom: 100 }}>
          <motion.div {...fadeUp}>
            <SectionHeading>FAQ</SectionHeading>
            <SectionLead>
              Common questions about Aegis Protocol. Answers in plain English.
            </SectionLead>
          </motion.div>

          <div style={{ maxWidth: 800 }}>
            {/* First item has top border */}
            <div style={{ borderTop: `1px solid ${T.border}` }}>
              {FAQ_ITEMS.map((item, i) => (
                <FaqItem key={item.q} {...item} index={i} />
              ))}
            </div>
          </div>
        </section>

      </div>{/* end content wrapper */}

      <MobileBottomNav />
    </div>
  );
}
