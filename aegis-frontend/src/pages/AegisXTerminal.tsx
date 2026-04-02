import { motion } from "framer-motion";
import { fadeInView, staggerContainer, staggerItem } from "@/lib/animations";
import { useState, useEffect, useCallback } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════════════════
   AegisX IDE. Landing Page
   Swiss minimal. Premium. Zero noise. Every pixel intentional.
   ═══════════════════════════════════════════════════════════════════════════ */

const PURPLE = "#9945FF";
const GREEN = "#14F195";
const TEAL = "#00D4AA";
const GOLD = "#FECA57";
const ORANGE = "#FF9F43";
const LIGHT_PURPLE = "#B06CFF";
const COMMENT = "#606078";

/* ── Syntax Highlighting ── */

interface Token {
  text: string;
  color?: string;
}

type Line = Token[];

const kw = (t: string): Token => ({ text: t, color: PURPLE });
const str = (t: string): Token => ({ text: t, color: GREEN });
const fn_ = (t: string): Token => ({ text: t, color: TEAL });
const ty = (t: string): Token => ({ text: t, color: GOLD });
const cm = (t: string): Token => ({ text: t, color: COMMENT });
const mac = (t: string): Token => ({ text: t, color: LIGHT_PURPLE });
const num = (t: string): Token => ({ text: t, color: ORANGE });
const w = (t: string): Token => ({ text: t });

const CODE_LINES: Line[] = [
  [kw("use"), w(" anchor_lang::prelude::*;")],
  [],
  [mac("declare_id!"), w("("), str('"AegisX11111111111111111111111111111111111"'), w(");")],
  [],
  [w("#["), kw("program"), w("]")],
  [kw("pub"), w(" "), kw("mod"), w(" vault {")],
  [w("    "), kw("use"), w(" "), kw("super"), w("::*;")],
  [],
  [w("    "), kw("pub"), w(" "), kw("fn"), w(" "), fn_("initialize"), w("(ctx: "), ty("Context"), w("<"), ty("Initialize"), w(">, bump: "), ty("u8"), w(") -> "), ty("Result"), w("<()> {")],
  [w("        "), kw("let"), w(" vault = &"), kw("mut"), w(" ctx.accounts.vault;")],
  [w("        vault.authority = ctx.accounts.authority."), fn_("key"), w("();")],
  [w("        vault.bump = bump;")],
  [w("        vault.total_deposits = "), num("0"), w(";")],
  [w("        "), kw("Ok"), w("(())")],
  [w("    }")],
  [],
  [w("    "), kw("pub"), w(" "), kw("fn"), w(" "), fn_("deposit"), w("(ctx: "), ty("Context"), w("<"), ty("Deposit"), w(">, amount: "), ty("u64"), w(") -> "), ty("Result"), w("<()> {")],
  [w("        "), mac("require!"), w("(amount > "), num("0"), w(", VaultError::InvalidAmount);")],
  [],
  [w("        "), kw("let"), w(" transfer = "), ty("Transfer"), w(" {")],
  [w("            from: ctx.accounts.user_token."), fn_("to_account_info"), w("(),")],
  [w("            to: ctx.accounts.vault_token."), fn_("to_account_info"), w("(),")],
  [w("            authority: ctx.accounts.user."), fn_("to_account_info"), w("(),")],
  [w("        };")],
  [],
  [w("        token::"), fn_("transfer"), w("(")],
  [w("            "), ty("CpiContext"), w("::"), fn_("new"), w("(ctx.accounts.token_program."), fn_("to_account_info"), w("(), transfer),")],
  [w("            amount,")],
  [w("        )?;")],
  [],
  [w("        ctx.accounts.vault.total_deposits += amount;")],
  [w("        "), kw("Ok"), w("(())")],
  [w("    }")],
  [w("}")],
];

/* ── Stats ── */
const STATS = [
  "86 modules",
  "24 on-chain actions",
  "15 vuln detectors",
  "120fps",
  "10x faster",
];

/* ── Bento Features ── */
const FEATURES = [
  {
    label: "ON-CHAIN",
    title: "Solana Agent",
    desc: "24 on-chain actions. Transfer, swap, stake, deploy, compress \u2014 without leaving your editor.",
    span: "md:col-span-2",
    terminal: [
      { prompt: true, text: "aegisx solana transfer 2.5 SOL to 7xKX...9fRp" },
      { prompt: false, text: "Preparing transfer..." },
      { prompt: false, text: "Signature: 4vK9...xQ2m" },
      { prompt: false, text: "Confirmed in 412ms" },
    ],
  },
  {
    label: "SECURITY",
    title: "Smart Contract Auditor",
    desc: "15 vulnerability detectors scan your Anchor programs in real-time.",
    span: "",
    terminal: [
      { prompt: false, text: "PASS  Reentrancy guard" },
      { prompt: false, text: "PASS  Integer overflow" },
      { prompt: false, text: "WARN  Missing signer check L:42" },
      { prompt: false, text: "PASS  Account validation" },
    ],
  },
  {
    label: "PARALLEL",
    title: "Multi-Agent Swarms",
    desc: "Up to 16 parallel agents working different files simultaneously.",
    span: "",
  },
  {
    label: "AI-NATIVE",
    title: "AI-Native Editor",
    desc: "20+ LLM providers. Claude, GPT, Gemini, Groq, local models. Switch mid-session.",
    span: "md:col-span-2",
  },
];

/* ── Tool Categories ── */
const TOOL_CATEGORIES = [
  {
    heading: "SOLANA NATIVE",
    tools: ["solana_agent", "solana_audit", "codemap", "deploy_wizard", "program_test", "account_inspect"],
  },
  {
    heading: "TRADING & DEFI",
    tools: ["trading", "x402_pay", "bags_launch", "bags_trade", "bags_fees", "bags_social", "bags_apps", "bags_analytics"],
  },
  {
    heading: "INTELLIGENCE",
    tools: ["intel", "research", "autoresearch", "video_gen", "browser", "image_gen"],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Code Line Renderer ── */
function CodeLineRenderer({ tokens }: { tokens: Line }) {
  if (tokens.length === 0) return <span>{"\u00A0"}</span>;
  return (
    <>
      {tokens.map((tok, i) => (
        <span key={i} style={tok.color ? { color: tok.color } : undefined}>
          {tok.text}
        </span>
      ))}
    </>
  );
}

/* ── Editor Mockup (reusable) ── */
function EditorMockup({
  lines,
  tabs,
  activeTab = 0,
  className = "",
  showSidebar = false,
  glow = false,
}: {
  lines: Line[];
  tabs?: string[];
  activeTab?: number;
  className?: string;
  showSidebar?: boolean;
  glow?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      {glow && (
        <div
          className="absolute -inset-px rounded-xl opacity-20 blur-3xl pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 40%, ${PURPLE}40, transparent 70%)`,
          }}
        />
      )}
      <div className="relative rounded-xl border border-white/[0.06] bg-[#0c0c0f] overflow-hidden shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center h-9 px-4 border-b border-white/[0.04] bg-[#0a0a0d]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
          </div>
          {tabs && (
            <div className="flex ml-4 -mb-px">
              {tabs.map((tab, i) => (
                <div
                  key={tab}
                  className={`px-3 py-1.5 text-[11px] font-mono border-b ${
                    i === activeTab
                      ? "text-white/60 border-white/10"
                      : "text-white/20 border-transparent"
                  }`}
                >
                  {tab}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex">
          {/* Sidebar */}
          {showSidebar && (
            <div className="hidden md:flex flex-col w-12 border-r border-white/[0.04] bg-[#09090b] py-3 items-center gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-sm ${i === 0 ? "bg-white/10" : "bg-white/[0.04]"}`} />
              ))}
            </div>
          )}

          {/* Code area */}
          <div className="flex-1 overflow-x-auto">
            <pre className="p-4 text-[12px] md:text-[13px] leading-[1.7] font-mono">
              <code>
                {lines.map((line, i) => (
                  <div key={i} className="flex">
                    <span className="inline-block w-8 md:w-10 text-right mr-4 md:mr-6 text-white/10 select-none shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-white/70">
                      <CodeLineRenderer tokens={line} />
                    </span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mini Terminal (for bento cards) ── */
function MiniTerminal({ lines }: { lines: { prompt: boolean; text: string }[] }) {
  return (
    <div className="mt-4 rounded-lg border border-white/[0.04] bg-[#0a0a0d] p-3 font-mono text-[11px] leading-relaxed">
      {lines.map((line, i) => (
        <div key={i} className={line.prompt ? "text-white/50" : "text-white/25"}>
          {line.prompt && <span className="text-white/20 mr-1.5">$</span>}
          {line.text}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function AegisXTerminal() {
  const [scrolled, setScrolled] = useState(false);

  const showComingSoonToast = useCallback(() => {
    toast.info("AegisX IDE is coming soon", {
      description: "This preview page is locked while the IDE launch is finalized.",
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans antialiased selection:bg-purple-500/20">
      <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-zinc-950/45 backdrop-blur-md" />
        <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-zinc-950/88 px-8 py-10 text-center shadow-2xl shadow-black/50">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[10px] uppercase tracking-[0.3em] text-white/40">
            Soon
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-white/92">
            AegisX IDE is coming soon
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/45">
            The IDE preview is locked while we finish the launch experience. Check back very soon.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={showComingSoonToast}
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-2.5 text-[13px] font-medium text-zinc-950 transition-colors duration-200 hover:bg-white/90"
            >
              Notify Me Soon
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-white/[0.08] px-6 py-2.5 text-[13px] font-medium text-white/55 transition-colors duration-200 hover:border-white/[0.16] hover:text-white/80"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>

      <div className="pointer-events-none select-none blur-md opacity-35">
      {/* ───────────────────────── FIXED NAV ───────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-zinc-950/80 backdrop-blur-xl border-b border-white/[0.04]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-6">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/assets/vectorwhite.svg" alt="Aegis" className="h-5 w-5" />
            <span className="text-[15px] font-medium tracking-tight text-white/90">
              AegisX
            </span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-[13px] text-white/30">
            <a href="#features" className="hover:text-white/60 transition-colors duration-300">
              Features
            </a>
            <a href="#tools" className="hover:text-white/60 transition-colors duration-300">
              Tools
            </a>
            <a
              href="#download"
              className="hover:text-white/60 transition-colors duration-300"
            >
              Download
            </a>
          </div>
        </div>
      </nav>

      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-14 overflow-hidden">
        {/* Subtle grid bg */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 text-center max-w-3xl mx-auto"
        >
          <h1 className="text-[clamp(2.5rem,7vw,5rem)] font-medium leading-[0.95] tracking-tight">
            <span className="text-white/40">The IDE built for</span>
            <br />
            <span className="text-white">Solana.</span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-6 text-[14px] text-white/25 tracking-wide"
          >
            GPU-accelerated editor. 86 AI modules. Solana-native.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <a
              href="#download"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-zinc-950 text-[13px] font-medium rounded-lg hover:bg-white/90 transition-colors duration-200"
            >
              Download for macOS
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-50">
                <path d="M6 2v8M3 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a
              href="https://github.com/aegisprotocol"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-white/[0.08] text-white/40 text-[13px] font-medium rounded-lg hover:border-white/[0.15] hover:text-white/60 transition-all duration-200"
            >
              View source
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-40">
                <path d="M3 9l6-6M4.5 3H9v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </motion.div>
        </motion.div>

        {/* Hero editor mockup */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 w-full max-w-4xl mx-auto mt-16 mb-8"
        >
          <EditorMockup
            lines={CODE_LINES.slice(0, 16)}
            tabs={["lib.rs", "state.rs", "errors.rs"]}
            showSidebar
            glow
          />
        </motion.div>

        {/* Fade to bg */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none z-20" />
      </section>

      {/* ───────────────────────── STATS BAR ───────────────────────── */}
      <section className="border-y border-white/[0.04]">
        <motion.div
          {...fadeInView}
          className="max-w-6xl mx-auto py-5 px-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {STATS.map((stat, i) => (
            <span key={stat} className="flex items-center gap-6">
              <span className="font-mono text-[11px] text-white/20 tracking-widest uppercase">
                {stat}
              </span>
              {i < STATS.length - 1 && (
                <span className="hidden sm:inline text-white/10 text-[11px]">
                  /
                </span>
              )}
            </span>
          ))}
        </motion.div>
      </section>

      {/* ───────────────────────── BENTO GRID ───────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-28 md:py-40">
        <motion.div
          {...fadeInView}
          className="mb-16"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 mb-4">
            Capabilities
          </p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-white/90">
            Everything you need.
            <br />
            <span className="text-white/30">Nothing you don't.</span>
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.04] rounded-xl overflow-hidden border border-white/[0.04]"
        >
          {FEATURES.map((feat) => (
            <motion.div
              key={feat.title}
              variants={staggerItem}
              className={`bg-zinc-950 p-8 md:p-10 hover:bg-white/[0.015] transition-colors duration-500 group ${feat.span}`}
            >
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/15 mb-4">
                {feat.label}
              </p>
              <h3 className="text-xl font-medium text-white/90 mb-2">
                {feat.title}
              </h3>
              <p className="text-sm text-white/30 leading-relaxed max-w-md">
                {feat.desc}
              </p>
              {feat.terminal && <MiniTerminal lines={feat.terminal} />}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ───────────────────────── FULL-WIDTH CODE SHOWCASE ───────────────────────── */}
      <section className="px-6 py-28 md:py-40">
        <motion.div {...fadeInView} className="max-w-5xl mx-auto mb-16 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 mb-4">
            Editor
          </p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight">
            <span className="text-white/90">Write Solana programs</span>
            <br />
            <span className="text-white/30">with real-time intelligence.</span>
          </h2>
        </motion.div>

        <motion.div
          {...fadeInView}
          className="max-w-5xl mx-auto"
        >
          <EditorMockup
            lines={CODE_LINES}
            tabs={["lib.rs", "state.rs", "errors.rs", "tests.rs"]}
            activeTab={0}
            showSidebar
            glow
          />
        </motion.div>
      </section>

      {/* ───────────────────────── TOOL CATEGORIES ───────────────────────── */}
      <section id="tools" className="max-w-6xl mx-auto px-6 py-28 md:py-40 border-t border-white/[0.04]">
        <motion.div {...fadeInView} className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 mb-4">
            Toolkit
          </p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-white/90">
            86 modules.
            <br />
            <span className="text-white/30">One interface.</span>
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 md:gap-16"
        >
          {TOOL_CATEGORIES.map((cat) => (
            <motion.div key={cat.heading} variants={staggerItem}>
              <h4 className="text-[10px] uppercase tracking-[0.15em] text-white/15 mb-6">
                {cat.heading}
              </h4>
              <ul className="space-y-2.5">
                {cat.tools.map((tool) => (
                  <li
                    key={tool}
                    className="font-mono text-[13px] text-white/35 hover:text-white transition-colors duration-300 cursor-default"
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ───────────────────────── DOWNLOAD CTA ───────────────────────── */}
      <section
        id="download"
        className="relative border-t border-white/[0.04] py-32 md:py-44 px-6"
      >
        {/* Subtle glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${PURPLE}30, transparent 60%)`,
          }}
        />

        <motion.div
          {...fadeInView}
          className="relative z-10 max-w-2xl mx-auto text-center"
        >
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-medium tracking-tight leading-tight">
            <span className="text-white/90">Ready to build.</span>
          </h2>

          <div className="mt-10">
            <a
              href="https://github.com/aegisprotocol/aegisx/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-zinc-950 text-[14px] font-medium rounded-lg hover:bg-white/90 transition-colors duration-200"
            >
              Download for macOS
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-50">
                <path d="M6 2v8M3 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-[12px] text-white/20 font-mono">
            <span className="hover:text-white/40 transition-colors cursor-pointer">macOS</span>
            <span className="text-white/10">/</span>
            <span className="hover:text-white/40 transition-colors cursor-pointer">Linux</span>
            <span className="text-white/10">/</span>
            <span className="hover:text-white/40 transition-colors cursor-pointer">Windows</span>
          </div>

          <p className="mt-10 text-[12px] text-white/10 tracking-wide">
            Built on Zed. Enhanced by Aegis Protocol.
          </p>
        </motion.div>
      </section>

      {/* ───────────────────────── FOOTER ───────────────────────── */}
      <footer className="border-t border-white/[0.04] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/assets/vectorwhite.svg" alt="Aegis" className="h-4 w-4 opacity-30" />
            <span className="text-[11px] text-white/15 tracking-wide">
              2026 Aegis Protocol
            </span>
          </div>
          <div className="flex items-center gap-6 text-[12px] text-white/20">
            <a
              href="https://github.com/aegisprotocol"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/40 transition-colors duration-300"
            >
              GitHub
            </a>
            <a href="/docs" className="hover:text-white/40 transition-colors duration-300">
              Docs
            </a>
            <a
              href="https://discord.gg/aegis"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/40 transition-colors duration-300"
            >
              Discord
            </a>
          </div>
        </div>
      </footer>
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
      </div>
    </div>
  );
}
