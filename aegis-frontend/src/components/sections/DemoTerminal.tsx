import { useInView } from "@/hooks/useInView";
import { useState, useEffect, useCallback, useMemo } from "react";
import SectionLabel from "@/components/SectionLabel";
import { trpc } from "@/lib/trpc";

const LINES: { type: string; text: string; delay?: number }[] = [
  { type: "prompt", text: "$ agent-aegis init", delay: 800 },
  { type: "output", text: "  Bootstrapping Agent Aegis runtime..." },
  { type: "success", text: "  [OK] Solana wallet generated: 7xKp...3nVq" },
  { type: "success", text: "  [OK] Runtime initialized at ~/.agent-aegis/" },
  { type: "dim", text: "  Solana-native: solana address --keypair ~/.agent-aegis/wallet.json" },
  { type: "blank", text: "" },
  { type: "prompt", text: "$ agent-aegis wallet airdrop 2", delay: 600 },
  { type: "output", text: "  Requesting 2 SOL from devnet faucet..." },
  { type: "success", text: "  [OK] 2.000000000 SOL received" },
  { type: "blank", text: "" },
  { type: "prompt", text: '$ agent-aegis search "code review"', delay: 1000 },
  { type: "output", text: "  Searching Aegis Index (82,074 operators)..." },
  { type: "blank", text: "" },
  { type: "header", text: "  OPERATOR                  SCORE  PRICE         VALIDATORS" },
  { type: "divider", text: "  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500" },
  { type: "result", text: "  code-review-agent      92/100  0.002 SOL     3 bonded" },
  { type: "result", text: "  lint-and-fix           87/100  0.001 SOL     2 bonded" },
  { type: "result", text: "  security-audit         95/100  0.005 SOL     5 bonded" },
  { type: "blank", text: "" },
  { type: "prompt", text: "$ agent-aegis invoke code-review-agent --pay x402", delay: 1200 },
  { type: "output", text: "  GET /invoke/code-review-agent" },
  { type: "output", text: "  HTTP 402 \u2192 Payment Required" },
  { type: "output", text: "  Amount: $0.05 USDC | Protocol: x402 | Chain: Solana" },
  { type: "output", text: "  Signing USDC transfer with wallet 7xKp...3nVq..." },
  { type: "success", text: "  [OK] x402 payment confirmed (tx: 4kR9...mN2x)" },
  { type: "blank", text: "" },
  { type: "output", text: "  Swapping USDC -> $AEGIS via Jupiter..." },
  { type: "success", text: "  [OK] Swapped $0.05 USDC -> 12.4 $AEGIS" },
  { type: "blank", text: "" },
  { type: "split", text: "  Revenue split executed atomically:" },
  { type: "split-detail", text: "    -> 7.44 $AEGIS  (85%)  -> creator:  9pLm...kQ4w" },
  { type: "split-detail", text: "    -> 1.24 $AEGIS  (10%)  -> validators: 3xNr...jP8v" },
  { type: "split-detail", text: "    -> 0.37 $AEGIS  (3%)   -> treasury" },
  { type: "split-detail", text: "    -> 0.99 $AEGIS  (3%)   -> protocol treasury" },
  { type: "split-detail", text: "    -> 0.19 $AEGIS  (1.5%) -> insurance fund" },
  { type: "split-detail", text: "    -> 0.06 $AEGIS  (0.5%) -> burned (deflationary)" },
  { type: "blank", text: "" },
  { type: "output", text: "  Launching Deno sandbox (strict mode)..." },
  { type: "dim", text: "    --allow-net=api.openai.com  --allow-read=./src  --deny-write  --deny-env" },
  { type: "output", text: "  Executing operator on target repository..." },
  { type: "success", text: "  [OK] Operator completed in 1.2s | Sandbox: clean exit" },
  { type: "success", text: "  [OK] Observation trace recorded: tr_9fGh...4kR9" },
  { type: "success", text: "  [OK] Reputation +1 -> 86/100 (Gold)" },
  { type: "blank", text: "" },
  { type: "prompt", text: "$ agent-aegis mcp-server --start", delay: 800 },
  { type: "output", text: "  Starting MCP server on localhost:3847..." },
  { type: "success", text: "  [OK] MCP server live. 82,074 operators discoverable" },
  { type: "dim", text: "  Compatible: AegisX \u00b7 AegisX Desktop \u00b7 Codex CLI \u00b7 Codex App \u00b7 ChatGPT" },
  { type: "dim", text: "  AegisX Remote: monitor invocations from mobile" },
  { type: "blank", text: "" },
  { type: "prompt", text: "$ agent-aegis balance", delay: 500 },
  { type: "balance", text: "  SOL: 1.998  |  USDC: 9.95  |  $AEGIS: 0.00" },
  { type: "success", text: "  [OK] Total spent (consumer): $0.05 USDC via x402" },
  { type: "dim", text: "  Built on the x402 open standard (HTTP 402 micropayments)" },
];

export default function DemoTerminal() {
  const { data: stats } = trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });
  const { ref, inView } = useInView(0.15);
  const [visibleLines, setVisibleLines] = useState(0);
  const [started, setStarted] = useState(false);

  const lines = useMemo(() => {
    const count = stats?.totalOperators?.toLocaleString() ?? "82,074";
    return LINES.map((line) => ({
      ...line,
      text: line.text.replace(/82,074/g, count),
    }));
  }, [stats?.totalOperators]);

  const startDemo = useCallback(() => {
    setVisibleLines(0);
    setStarted(true);
  }, []);

  useEffect(() => {
    if (inView && !started) startDemo();
  }, [inView, started, startDemo]);

  useEffect(() => {
    if (!started) return;
    if (visibleLines >= lines.length) return;

    const currentLine = lines[visibleLines];
    const delay = currentLine?.type === "prompt" ? (currentLine.delay || 600) :
                  currentLine?.type === "blank" ? 200 : 70;

    const timer = setTimeout(() => {
      setVisibleLines((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [started, visibleLines, lines]);

  const getColor = (type: string) => {
    switch (type) {
      case "prompt": return "text-zinc-300 font-normal";
      case "success": return "text-zinc-300/65";
      case "result": return "text-white/55";
      case "header": return "text-white/25 font-normal";
      case "divider": return "text-white/12";
      case "split": return "text-white/45";
      case "split-detail": return "text-zinc-300/45";
      case "balance": return "text-white/65 font-normal";
      case "dim": return "text-white/18";
      case "blank": return "";
      default: return "text-white/35";
    }
  };

  const isComplete = visibleLines >= lines.length;

  return (
    <section id="terminal" className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.04]" ref={ref}>
      <div className="container max-w-4xl">
        <div className="text-center mb-16">
          <SectionLabel text="DEMO" />
          <h2 className={`text-[clamp(2rem,4.5vw,3.5rem)] font-normal text-white leading-[1.05] tracking-tight mt-6`}>
            Search. Pay. Execute. Earn.
          </h2>
          <p className={`text-[14px] text-white/30 mt-4 max-w-lg mx-auto`}>
            MCP discovery. x402 payment. Deno sandbox. Revenue split. All in one terminal session.
          </p>
        </div>

        {/* Terminal window */}
        <div className={`relative border border-white/[0.04] overflow-hidden scale-100`} style={{
          boxShadow: "0 0 80px rgba(161,161,170,0.03)",
        }}>
          {/* Title bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04] bg-white/[0.015]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/35" />
              <span className="font-mono text-[11px] text-white/18 ml-3">agent-aegis &mdash; bash &mdash; 80x24</span>
            </div>
            {isComplete && (
              <button
                onClick={startDemo}
                className="font-mono text-[11px] tracking-wider uppercase text-white/25 hover:text-zinc-300 transition-colors border border-white/[0.04] hover:border-white/[0.08] px-3 py-1.5"
              >
                Replay
              </button>
            )}
          </div>

          {/* Terminal body  -  all lines pre-rendered to prevent layout shift */}
          <div className="p-3 sm:p-6 lg:p-8 font-mono text-[10px] sm:text-[11px] lg:text-[12px] leading-[1.9] bg-[oklch(0.09_0.005_285)] overflow-x-auto">
            {lines.map((line, i) => (
              <div
                key={i}
                className={`${getColor(line.type)} ${line.type === "blank" ? "h-3" : ""} duration-150`}
              >
                {line.text || "\u00A0"}
              </div>
            ))}
            {!isComplete && started && (
              <span
                className="inline-block w-[7px] h-[14px] bg-white/70 animate-pulse ml-0.5"
                style={{
                  position: "relative",
                  top: `-${(lines.length - visibleLines) * 1.9}em`,
                }}
              />
            )}
          </div>
        </div>

        {/* Bottom caption */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/playground"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-zinc-300/60 hover:text-zinc-300 border border-white/[0.04] hover:border-white/[0.08] px-5 py-2.5 transition-all duration-300 hover:bg-white/[0.04]"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 2L12 8L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Try it yourself in the Playground
          </a>
          <p className="text-[13px] text-white/18">
            Every command above runs today.{" "}
            <a
              href="https://github.com/aegis-protocol/agent-aegis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300/35 hover:text-zinc-300 transition-colors"
            >
              View source &rarr;
            </a>
          </p>
        </div>
      </div>


    </section>
  );
}
