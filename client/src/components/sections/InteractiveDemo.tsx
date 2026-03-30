import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";
import SectionLabel from "@/components/SectionLabel";
import GlowCard from "@/components/GlowCard";
import { NvidiaBadge } from "@/components/NvidiaLogo";

/* ---- Terminal line types ---- */
interface TermLine {
  type: "command" | "output" | "success" | "payment" | "header" | "divider" | "error";
  text: string;
  delay: number;
}

/* ---- The scripted terminal session ---- */
const TERMINAL_SCRIPT: TermLine[] = [
  { type: "header", text: "AEGIS PROTOCOL v2.4.0  //  Solana Mainnet  //  Session #48291", delay: 0 },
  { type: "divider", text: "", delay: 200 },
  { type: "command", text: "$ aegis discover --task \"code-review\" --lang solidity --budget 0.01", delay: 400 },
  { type: "output", text: "Searching 2,847 operators across 13 categories...", delay: 600 },
  { type: "output", text: "Found 47 matches. Ranking by success rate + price + latency...", delay: 400 },
  { type: "divider", text: "", delay: 200 },
  { type: "output", text: "  #1  aegis-labs/code-review-agent    Success: 94%   $0.003/call   12.8k invocations", delay: 300 },
  { type: "output", text: "  #2  AuditDAO/solidity-auditor       Success: 91%   $0.005/call    8.2k invocations", delay: 200 },
  { type: "output", text: "  #3  CrabLabs/rust-analyzer-pro      Success: 87%   $0.004/call    5.1k invocations", delay: 200 },
  { type: "divider", text: "", delay: 300 },
  { type: "command", text: "$ aegis invoke aegis-labs/code-review-agent --file contract.sol", delay: 500 },
  { type: "output", text: "Validating operator bond... 500 $AEGIS staked. Bond active.", delay: 400 },
  { type: "output", text: "NeMo Guardrails check... PASSED (safety + compliance)", delay: 350 },
  { type: "output", text: "Signing x402 payment header...", delay: 300 },
  { type: "payment", text: "  Payment: 0.003 USDC >> Swap to $AEGIS on Jupiter >> Revenue split executing", delay: 500 },
  { type: "divider", text: "", delay: 200 },
  { type: "success", text: "  Creator:                 $0.0018  (60%)", delay: 300 },
  { type: "success", text: "  Validators:              $0.00045 (15%)", delay: 200 },
  { type: "output", text: "  Stakers:                 $0.00036 (12%)", delay: 150 },
  { type: "output", text: "  Treasury:                $0.00024 (8%)", delay: 150 },
  { type: "output", text: "  Insurance:               $0.00009 (3%)", delay: 150 },
  { type: "output", text: "  Burned forever:          $0.00006 (2%)", delay: 150 },
  { type: "divider", text: "", delay: 300 },
  { type: "output", text: "Executing in sandboxed environment...", delay: 600 },
  { type: "output", text: "NeMo Evaluator scoring output quality...", delay: 500 },
  { type: "output", text: "Validator attestation: 8/8 nodes confirmed.", delay: 400 },
  { type: "divider", text: "", delay: 200 },
  { type: "success", text: "INVOCATION COMPLETE", delay: 300 },
  { type: "output", text: "  Findings: 3 critical, 7 warnings, 12 suggestions", delay: 200 },
  { type: "output", text: "  Response time: 1.8s  |  Tx: 5kWp...tN8j  |  Receipt: verified", delay: 200 },
  { type: "output", text: "  Success score updated: 94% > 94.1%", delay: 200 },
];

/* ---- Animated Terminal ---- */
function LiveTerminal() {
  const [lines, setLines] = useState<TermLine[]>([]);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const play = useCallback(() => {
    setLines([]);
    setPlaying(true);
    setDone(false);
    let idx = 0;

    const addLine = () => {
      if (idx >= TERMINAL_SCRIPT.length) {
        setPlaying(false);
        setDone(true);
        return;
      }
      const line = TERMINAL_SCRIPT[idx];
      timerRef.current = setTimeout(() => {
        setLines(prev => [...prev, line]);
        idx++;
        addLine();
      }, line.delay);
    };

    addLine();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Auto-play on scroll into view
  useEffect(() => {
    const el = scrollRef.current?.parentElement;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !playing && !done) play();
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [play, playing, done]);

  const getLineColor = (type: TermLine["type"]) => {
    switch (type) {
      case "command": return "text-zinc-200";
      case "success": return "text-emerald-400";
      case "payment": return "text-amber-400/80";
      case "header": return "text-zinc-500";
      case "divider": return "text-zinc-800";
      case "error": return "text-red-400";
      default: return "text-zinc-500";
    }
  };

  return (
    <GlowCard className="rounded border border-white/[0.06] overflow-hidden" glowColor="rgba(52, 211, 153, 0.05)">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
          </div>
          <span className="text-[11px] font-mono text-zinc-600 ml-2">aegis-cli</span>
        </div>
        <div className="flex items-center gap-3">
          {playing && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-live" />
              <span className="text-[10px] font-medium text-emerald-500/70">LIVE</span>
            </span>
          )}
          {done && (
            <button onClick={play} className="text-[10px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
              Replay
            </button>
          )}
        </div>
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="h-[380px] sm:h-[420px] overflow-y-auto p-4 font-mono text-[11px] sm:text-[12px] leading-[1.8] scroll-smooth no-scrollbar"
        style={{ background: "rgba(8,8,12,0.6)" }}
      >
        {lines.length === 0 && !playing && (
          <div className="h-full flex items-center justify-center">
            <button
              onClick={play}
              className="group flex items-center gap-3 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded border border-white/[0.08] flex items-center justify-center group-hover:border-white/[0.15] transition-colors">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <polygon points="6,3 13,8 6,13" fill="currentColor" />
                </svg>
              </div>
              <span className="text-[13px] font-medium font-sans">Watch a live invocation</span>
            </button>
          </div>
        )}
        {lines.map((line, i) => (
          <div key={i} className={`${getLineColor(line.type)} ${line.type === "command" ? "font-normal" : ""}`}>
            {line.type === "divider" ? (
              <div className="h-px bg-white/[0.04] my-1" />
            ) : line.type === "header" ? (
              <div className="text-[10px] tracking-wider">{line.text}</div>
            ) : (
              <div className={line.type === "success" ? "font-normal" : ""}>
                {line.text}
              </div>
            )}
          </div>
        ))}
        {playing && <span className="inline-block w-2 h-4 bg-zinc-400 animate-pulse-live ml-0.5" />}
      </div>
    </GlowCard>
  );
}

/* ---- Money flow visualization ---- */
function MoneyFlow() {
  return (
    <GlowCard className="rounded border border-white/[0.06] bg-white/[0.01] p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
        <span className="text-[12px] font-normal text-zinc-300">Revenue Split Per Invocation</span>
      </div>

      {/* Visual bar breakdown */}
      <div className="mb-5">
        <div className="flex h-3 overflow-hidden gap-0.5 rounded">
          <div className="bg-emerald-500/80 flex-[60] rounded-l-sm" title="Creator: 60%" />
          <div className="bg-blue-500/60 flex-[15]" title="Validators: 15%" />
          <div className="bg-emerald-500/50 flex-[12]" title="Stakers: 12%" />
          <div className="bg-zinc-500/40 flex-[8]" title="Treasury: 8%" />
          <div className="bg-amber-500/40 flex-[3]" title="Insurance: 3%" />
          <div className="bg-red-500/40 flex-[2] rounded-r-sm" title="Burned: 2%" />
        </div>
      </div>

      <div className="space-y-2.5">
        {[
          { label: "You (the creator)", pct: "60%", color: "bg-emerald-500/80", amount: "$0.0018" },
          { label: "Validator network", pct: "15%", color: "bg-blue-500/60", amount: "$0.00045" },
          { label: "Stakers", pct: "12%", color: "bg-emerald-500/50", amount: "$0.00036" },
          { label: "Protocol treasury", pct: "8%", color: "bg-zinc-500/40", amount: "$0.00024" },
          { label: "Insurance fund", pct: "3%", color: "bg-amber-500/40", amount: "$0.00009" },
          { label: "Burned forever", pct: "2%", color: "bg-red-500/40", amount: "$0.00006" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded ${item.color}`} />
              <span className="text-zinc-400">{item.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-zinc-600 font-mono">{item.amount}</span>
              <span className="text-zinc-300 font-normal font-mono w-8 text-right">{item.pct}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.04]">
        <div className="text-[11px] text-zinc-600 leading-relaxed">
          On a $0.003 invocation, the creator earns $0.0018 instantly.
          At 10,000 calls per day, that is <span className="text-emerald-400/70 font-medium">$18/day</span> or <span className="text-emerald-400/70 font-medium">$540/month</span> from a single skill.
        </div>
      </div>
    </GlowCard>
  );
}

/* ---- Earnings calculator ---- */
function EarningsCalc() {
  const [calls, setCalls] = useState(5000);
  const [price, setPrice] = useState(0.003);
  const [skills, setSkills] = useState(1);

  const daily = calls * price * 0.6 * skills;
  const monthly = daily * 30;
  const yearly = monthly * 12;

  return (
    <GlowCard className="rounded border border-white/[0.06] bg-white/[0.01] p-5 sm:p-6" glowColor="rgba(52, 211, 153, 0.06)">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
        <span className="text-[12px] font-normal text-zinc-300">Earnings Calculator</span>
      </div>

      <div className="space-y-4 mb-5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-zinc-500">Daily invocations per skill</span>
            <span className="text-[12px] font-medium text-zinc-300 font-mono">{calls.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="100"
            max="100000"
            step="100"
            value={calls}
            onChange={(e) => setCalls(Number(e.target.value))}
            className="w-full h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-zinc-500">Price per call</span>
            <span className="text-[12px] font-medium text-zinc-300 font-mono">${price.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min="0.001"
            max="0.05"
            step="0.001"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-zinc-500">Number of skills</span>
            <span className="text-[12px] font-medium text-zinc-300 font-mono">{skills}</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={skills}
            onChange={(e) => setSkills(Number(e.target.value))}
            className="w-full h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded bg-white/[0.02] border border-white/[0.04]">
          <div className="text-[16px] sm:text-[18px] font-bold text-emerald-400 font-mono">${daily.toFixed(2)}</div>
          <div className="text-[10px] text-zinc-600 mt-0.5">per day</div>
        </div>
        <div className="text-center p-3 rounded bg-white/[0.02] border border-white/[0.04]">
          <div className="text-[16px] sm:text-[18px] font-bold text-emerald-400 font-mono">${monthly.toFixed(0)}</div>
          <div className="text-[10px] text-zinc-600 mt-0.5">per month</div>
        </div>
        <div className="text-center p-3 rounded bg-white/[0.02] border border-white/[0.04]">
          <div className="text-[16px] sm:text-[18px] font-bold text-emerald-400 font-mono">${yearly.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
          <div className="text-[10px] text-zinc-600 mt-0.5">per year</div>
        </div>
      </div>

      <p className="text-[10px] text-zinc-600 mt-3 text-center">
        Based on 60% creator share. Actual earnings depend on demand and pricing.
      </p>
    </GlowCard>
  );
}

/* ---- Comparison table ---- */
function ComparisonTable() {
  const rows = [
    { feature: "Creator revenue share", aegis: "60%", others: "0 to 30%" },
    { feature: "Settlement time", aegis: "< 1 second", others: "30 to 90 days" },
    { feature: "Quality validation", aegis: "NVIDIA NeMo", others: "None" },
    { feature: "Dispute resolution", aegis: "On chain", others: "Manual" },
    { feature: "Minimum payout", aegis: "$0.001", others: "$50 to $100" },
    { feature: "Payment method", aegis: "USDC / $AEGIS", others: "Wire / PayPal" },
    { feature: "Success scoring", aegis: "Real time", others: "Static ratings" },
  ];

  return (
    <GlowCard className="rounded border border-white/[0.06] bg-white/[0.01] p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />
        <span className="text-[12px] font-normal text-zinc-300">Why Aegis Wins</span>
      </div>

      <div className="space-y-0">
        {/* Header */}
        <div className="grid grid-cols-3 gap-2 pb-2 border-b border-white/[0.04] mb-2">
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider" />
          <span className="text-[10px] text-emerald-400/70 uppercase tracking-wider font-normal text-center">Aegis</span>
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider text-center">Others</span>
        </div>
        {rows.map((row) => (
          <div key={row.feature} className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/[0.03] last:border-0">
            <span className="text-[11px] text-zinc-500">{row.feature}</span>
            <span className="text-[11px] text-zinc-200 font-medium text-center">{row.aegis}</span>
            <span className="text-[11px] text-zinc-600 text-center">{row.others}</span>
          </div>
        ))}
      </div>
    </GlowCard>
  );
}

/* ---- Main Section ---- */
export default function InteractiveDemo() {
  return (
    <section id="demo" className="py-24 sm:py-32 relative">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent pointer-events-none" />

      <div className="container relative">
        <motion.div {...fadeInView} className="mb-12 sm:mb-14">
          <SectionLabel text="See It In Action" />

          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-normal text-white leading-[1.1] tracking-tight mt-3 mb-4">
            Watch money move in real time.
          </h2>
          <p className="text-[14px] sm:text-[15px] text-zinc-500 max-w-2xl leading-relaxed">
            This is the actual invocation flow. An AI agent discovers a skill, pays for it
            with x402 micropayments, and the creator earns 60% of the fee instantly on Solana.
            No invoices. No waiting. No middlemen.
          </p>
        </motion.div>

        {/* Main grid: terminal left, info panels right */}
        <motion.div {...fadeInView} className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
          {/* Terminal: takes 3 cols */}
          <div className="lg:col-span-3">
            <LiveTerminal />
          </div>

          {/* Right panels: takes 2 cols */}
          <div className="lg:col-span-2 space-y-5">
            <MoneyFlow />
            <EarningsCalc />
          </div>
        </motion.div>

        {/* Bottom row: comparison + protocol badges */}
        <motion.div {...fadeInView} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <ComparisonTable />
          </div>

          <div className="lg:col-span-2 space-y-5">
            {/* Protocol badges */}
            <GlowCard className="rounded border border-white/[0.06] bg-white/[0.01] p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400/60" />
                <span className="text-[12px] font-normal text-zinc-300">Protocol Stack</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <NvidiaBadge text="NeMo Validated" size="sm" variant="minimal" />
                {["x402", "MCP", "A2A", "Solana", "Jupiter"].map((p) => (
                  <span key={p} className="text-[11px] font-medium font-mono px-2.5 py-1 rounded border border-white/[0.06] text-zinc-500 bg-white/[0.02]">
                    {p}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Every invocation is validated by NVIDIA NeMo, settled on Solana in under a second,
                and discoverable through MCP and A2A protocols.
              </p>
            </GlowCard>

            {/* Live stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Avg Latency", value: "0.4s" },
                { label: "Success Rate", value: "99.7%" },
                { label: "Validators", value: "8/8" },
              ].map((s) => (
                <GlowCard key={s.label} className="rounded border border-white/[0.06] bg-white/[0.01] p-3 text-center">
                  <div className="font-normal text-sm sm:text-base text-zinc-200">{s.value}</div>
                  <div className="text-[10px] font-medium text-zinc-600 mt-0.5">{s.label}</div>
                </GlowCard>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
