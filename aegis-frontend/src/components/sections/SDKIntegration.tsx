import { useState, useCallback } from "react";
import SectionLabel from "@/components/SectionLabel";
import { useInView } from "@/hooks/useInView";
import { toast } from "sonner";

const TABS = [
  {
    label: "Register an Operator",
    lang: "TypeScript",
    filename: "register.ts",
    endpoints: [
      { method: "POST", path: "/v1/operators/register" },
      { method: "GET", path: "/v1/operators/:id/status" },
    ],
    code: `import { AegisSDK } from "@aegis-protocol/sdk";

const aegis = new AegisSDK({
  keypair: loadKeypair("~/.config/aegis/id.json"),
  cluster: "mainnet-beta",
});

await aegis.registerOperator({
  name: "my-translate-operator",
  endpoint: "https://api.myservice.com/translate",
  bond: 500,              // $AEGIS tokens staked
  pricePerCall: 0.003,    // USD via x402
  healthEndpoint: "/aegis/health",
});

// That's it. Your operator is live on the marketplace.
console.log("Operator registered. Earning starts now.");`,
  },
  {
    label: "Invoke an Operator",
    lang: "TypeScript",
    filename: "invoke.ts",
    endpoints: [
      { method: "POST", path: "/v1/invoke/:operator" },
      { method: "GET", path: "/v1/receipts/:txHash" },
    ],
    code: `import { AegisSDK } from "@aegis-protocol/sdk";

const aegis = new AegisSDK({
  keypair: loadKeypair("~/.config/aegis/id.json"),
  cluster: "mainnet-beta",
});

const result = await aegis.invoke({
  operator: "aegis-translate-es",
  input: { text: "Hello world", target: "es" },
  maxCost: 0.01,          // USD budget cap
});

// result.output  -> "Hola mundo"
// result.receipt -> cNFT mint address
// result.cost   -> $0.0034 (actual)
// result.latency -> 89ms`,
  },
  {
    label: "Delegate a Pipeline",
    lang: "TypeScript",
    filename: "delegate.ts",
    endpoints: [
      { method: "POST", path: "/v1/delegate" },
      { method: "GET", path: "/v1/pipelines/:id/trace" },
    ],
    code: `import { AegisSDK } from "@aegis-protocol/sdk";

const aegis = new AegisSDK({
  keypair: loadKeypair("~/.config/aegis/id.json"),
  cluster: "mainnet-beta",
});

const pipeline = await aegis.delegate({
  steps: [
    { operator: "pdf-extract-pro", input: fileBuffer },
    { operator: "entity-extract",  input: "$prev.output" },
    { operator: "text-summarize",  input: "$prev.output" },
  ],
  maxTotalCost: 0.05,     // USD budget for entire chain
  onStep: (step) => console.log(\`Step \${step.index}: \${step.status}\`),
});

// pipeline.receipts -> [cNFT, cNFT, cNFT]
// pipeline.totalCost -> $0.0067`,
  },
  {
    label: "AegisX MCP",
    lang: "JSON",
    filename: "aegis_mcp.json",
    endpoints: [
      { method: "MCP", path: "aegis mcp-server" },
      { method: "GET", path: "/v1/discover" },
    ],
    code: `// Add to your AegisX MCP config
// ~/.config/aegis/mcp.json

{
  "aegis-operators": {
    "command": "aegis",
    "args": ["mcp-server", "--cluster", "mainnet-beta"],
    "env": {
      "AEGIS_KEYPAIR": "~/.config/aegis/id.json"
    }
  }
}

// Now in AegisX or AegisX Desktop:
// "Use the code-review operator to audit this file"
// Claude discovers it via MCP, pays via x402, returns result.
// Works with AegisX Remote from mobile too.`,
  },
  {
    label: "Codex CLI",
    lang: "Bash",
    filename: "codex_setup.sh",
    endpoints: [
      { method: "POST", path: "/invoke/:operator" },
      { method: "x402", path: "X-402-Payment header" },
    ],
    code: `# Codex CLI connects via MCP or direct HTTP x402
# Option 1: MCP integration (recommended)
aegis mcp-server --port 3847 &
codex --mcp-server http://localhost:3847

# Option 2: Direct x402 invocation from Codex App
# Codex App multi-agent workflows can invoke
# Aegis operators in parallel across worktrees:

curl -X POST https://aegisplace.com/api/invoke/code-review \\
  -H "X-402-Payment: <signed_usdc_tx>" \\
  -d '{"repo": "my-org/my-repo", "branch": "main"}'

# Response includes cNFT receipt for audit trail.
# GPT-5.3-Codex handles the x402 handshake natively.`,
  },
  {
    label: "Health Endpoint",
    lang: "TypeScript",
    filename: "health.ts",
    endpoints: [
      { method: "GET", path: "/aegis/health" },
      { method: "GET", path: "/v1/operators/:id/health" },
    ],
    code: `// Implement the standard Aegis health endpoint
// Required for all registered operators

import express from "express";

const app = express();

app.get("/aegis/health", (req, res) => {
  res.json({
    status: "operational",
    uptime: process.uptime(),
    p99_ms: getP99Latency(),
    error_rate: getErrorRate(),
    queue_depth: getQueueDepth(),
    version: "1.0.0",
  });
});

// The marketplace polls this every 30s.
// Your quality score updates in real-time.`,
  },
];

const INSTALL_STEPS = [
  { cmd: "npm install @aegis-protocol/sdk", desc: "Install the SDK" },
  { cmd: "aegis init", desc: "Generate keypair + config" },
  { cmd: "aegis register --config ./aegis.yaml", desc: "Register your operator" },
  { cmd: "aegis status", desc: "Verify live on marketplace" },
];

const FIRST_REQUESTS = [
  {
    label: "Discover operators",
    cmd: `curl 'https://aegisplace.com/api/v1/discover?capability=code-review&limit=5'`,
  },
  {
    label: "Execution manifest",
    cmd: `curl 'https://aegisplace.com/api/execution-manifest.json'`,
  },
  {
    label: "Invoke with x402",
    cmd: `curl -X POST https://aegisplace.com/api/v1/invoke/code-review \\
  -H 'X-402-Payment: <signed_usdc_tx>' \\
  -d '{"repo":"my-org/my-repo","branch":"main"}'`,
  },
  {
    label: "Check receipt",
    cmd: `curl 'https://aegisplace.com/api/v1/receipts/4kR9...mN2x'`,
  },
  {
    label: "Operator health",
    cmd: `curl 'https://aegisplace.com/api/v1/operators/code-review/health'`,
  },
];

function EndpointPill({ method, path }: { method: string; path: string }) {
  const methodColor =
    method === "POST" ? "text-amber-400/70 bg-amber-400/[0.06] border-amber-400/15" :
    method === "GET" ? "text-zinc-300/60 bg-white/[0.04] border-white/[0.04]" :
    method === "MCP" ? "text-zinc-300/50 bg-white/[0.04] border-white/[0.04]" :
    "text-white/40 bg-white/[0.015] border-white/[0.04]";

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(path);
        toast("Copied to clipboard", { description: path });
      }}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-[10px] font-medium tracking-wide transition-all duration-200 hover:scale-[1.03] cursor-pointer ${methodColor}`}
    >
      <span className="font-normal">{method}</span>
      <span className="text-white/30">{path}</span>
    </button>
  );
}

export default function SDKIntegration() {
  const { ref, inView } = useInView(0.05);
  const [activeTab, setActiveTab] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyCmd = useCallback((cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd.replace(/\\\n\s*/g, ""));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }, []);

  return (
    <section id="integrate" className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.04]" ref={ref}>
      <div className="container">
        <SectionLabel text="INTEGRATE" />

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <h2 className={`text-[clamp(2rem,4.5vw,3.5rem)] font-normal text-white leading-[1.05] tracking-tight`}>
              Five minutes.<br />
              <span className="text-zinc-300">Ten lines.</span>
            </h2>
            <p className={`text-[14px] text-white/30 max-w-lg leading-relaxed mt-4`}>
              Register an operator, start earning. Invoke an operator, pay per call.
              Delegate a pipeline, let the network route. No vendor lock-in. MIT licensed.
            </p>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-1">
            <div className="text-[10px] font-medium text-white/20 tracking-wider">QUICK START</div>
            {INSTALL_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] font-medium text-white/15 hidden sm:inline">{step.desc}</span>
                <code className="text-[11px] font-medium text-zinc-300/50 bg-white/[0.015] px-2 py-0.5 rounded">{step.cmd}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Code tabs */}
        <div className={`border border-white/[0.04] rounded overflow-hidden`}>
          {/* Tab bar */}
          <div className="flex border-b border-white/[0.04] bg-white/[0.015] overflow-x-auto">
            {TABS.map((tab, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-3 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-[12px] font-medium tracking-wider whitespace-nowrap transition-all border-b-2 ${activeTab === i ? "text-zinc-300 border-white bg-white/[0.015]" : "text-white/30 border-transparent hover:text-white/50"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* File header */}
          <div className="flex items-center justify-between px-5 py-2 bg-white/[0.015] border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400/40" />
              <span className="w-3 h-3 rounded-full bg-amber-400/40" />
              <span className="w-3 h-3 rounded-full bg-white/30" />
              <span className="text-[11px] font-medium text-white/20 ml-2">{TABS[activeTab].filename}</span>
            </div>
            <span className="text-[10px] font-medium text-white/15">{TABS[activeTab].lang}</span>
          </div>

          {/* Code block */}
          <div className="p-3 sm:p-5 bg-white/[0.015] overflow-x-auto">
            <pre className="text-[11px] sm:text-[13px] font-medium leading-[1.7]">
              {TABS[activeTab].code.split("\n").map((line, i) => (
                <div key={i} className="flex">
                  <span className="w-8 text-right text-white/10 select-none shrink-0 mr-4">{i + 1}</span>
                  <span className={
                    line.startsWith("//") || line.startsWith("import") || line.startsWith("const") || line.startsWith("await") || line.startsWith("app.") || line.startsWith("#")
                      ? line.startsWith("//") || line.startsWith("#") ? "text-white/20" : line.startsWith("import") ? "text-zinc-300/50" : "text-white/50"
                      : "text-white/40"
                  }>
                    {line || "\u00A0"}
                  </span>
                </div>
              ))}
            </pre>
          </div>

          {/* Endpoint pills row */}
          <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
            <span className="text-[9px] font-medium text-white/15 tracking-wider uppercase mr-1">Endpoints:</span>
            {TABS[activeTab].endpoints.map((ep, i) => (
              <EndpointPill key={i} method={ep.method} path={ep.path} />
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 border border-white/[0.04] bg-white/[0.015] text-center">
            <div className="text-[24px] font-normal text-zinc-300 ">4</div>
            <div className="text-[10px] font-medium text-white/20 tracking-wider mt-1">COMMANDS TO LAUNCH</div>
          </div>
          <div className="p-4 border border-white/[0.04] bg-white/[0.015] text-center">
            <div className="text-[24px] font-normal text-white/60 ">12</div>
            <div className="text-[10px] font-medium text-white/20 tracking-wider mt-1">LINES TO REGISTER</div>
          </div>
          <div className="p-4 border border-white/[0.04] bg-white/[0.015] text-center">
            <div className="text-[24px] font-normal text-white/60 ">MIT</div>
            <div className="text-[10px] font-medium text-white/20 tracking-wider mt-1">LICENSE</div>
          </div>
          <div className="p-4 border border-white/[0.04] bg-white/[0.015] text-center">
            <div className="text-[24px] font-normal text-white/60 ">0</div>
            <div className="text-[10px] font-medium text-white/20 tracking-wider mt-1">VENDOR LOCK-IN</div>
          </div>
        </div>

        {/* First Requests -- curl block inspired by 402.bot */}
        <div className={`mt-16`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[18px] sm:text-[22px] font-normal text-white/80 tracking-tight">First requests</h3>
              <p className="text-[13px] text-white/25 mt-1">Copy, paste, run. Every endpoint is live today.</p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-medium text-zinc-300/50 tracking-wider">LIVE ON DEVNET</span>
            </div>
          </div>

          <div className="border border-white/[0.04] rounded overflow-hidden" style={{ boxShadow: "0 0 60px rgba(161,161,170,0.02)" }}>
            {/* Terminal header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-white/[0.04] bg-white/[0.015]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/35" />
                <span className="text-[10px] font-medium text-white/15 ml-2">aegisplace.com/api</span>
              </div>
              <span className="text-[10px] font-medium text-white/12 tracking-wider">CURL</span>
            </div>

            {/* Curl commands */}
            <div className="bg-white/[0.015]">
              {FIRST_REQUESTS.map((req, i) => (
                <div
                  key={i}
                  className={`group flex items-start gap-3 px-4 sm:px-5 py-3.5 transition-colors hover:bg-white/[0.015] ${i < FIRST_REQUESTS.length - 1 ? "border-b border-white/[0.03]" : ""}`}
                >
                  {/* Label */}
                  <span className="text-[10px] font-medium text-white/15 tracking-wider uppercase w-28 sm:w-36 shrink-0 pt-0.5 hidden sm:block">
                    {req.label}
                  </span>

                  {/* Command */}
                  <pre className="flex-1 text-[11px] sm:text-[12px] font-medium text-white/40 leading-[1.7] whitespace-pre-wrap break-all">
                    <span className="text-zinc-300/40">$</span>{" "}
                    {req.cmd}
                  </pre>

                  {/* Copy button */}
                  <button
                    onClick={() => copyCmd(req.cmd, i)}
                    className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 duration-200"
                    title="Copy command"
                  >
                    {copiedIdx === i ? (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-zinc-300">
                        <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-white/20 hover:text-white/50 transition-colors">
                        <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M3 11V3C3 2.44772 3.44772 2 4 2H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Bottom bar with endpoint pills */}
            <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 border-t border-white/[0.04] bg-white/[0.015]">
              <span className="text-[9px] font-medium text-white/12 tracking-wider uppercase mr-1">Base URL:</span>
              <code className="text-[11px] font-medium text-zinc-300/40">https://aegisplace.com/api</code>
              <span className="text-white/8 mx-1">|</span>
              <EndpointPill method="GET" path="/execution-manifest.json" />
              <EndpointPill method="GET" path="/llms.txt" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
