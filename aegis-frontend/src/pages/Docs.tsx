import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const T = {
  bg: "#0A0A0B",
  card: "rgba(255,255,255,0.015)",
  border: "rgba(255,255,255,0.05)",
  borderHover: "rgba(255,255,255,0.08)",
  text95: "rgba(255,255,255,0.92)",
  text80: "rgba(255,255,255,0.72)",
  text50: "rgba(255,255,255,0.44)",
  text30: "rgba(255,255,255,0.28)",
  text20: "rgba(255,255,255,0.18)",
  emerald: "rgba(52,211,153,0.55)",
} as const;

const NAV_BG = "#080809";

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------
const SECTIONS = [
  { id: "hero", label: "Overview" },
  { id: "quickstart", label: "Quick Start" },
  { id: "architecture", label: "Architecture" },
  { id: "why-aegis", label: "Why Aegis" },
  { id: "marketplace", label: "Marketplace" },
  { id: "aegisx", label: "AegisX IDE" },
  { id: "skillfi", label: "SkillFi Royalties" },
  { id: "nemo", label: "NeMo Guardrails" },
  { id: "mcp-tools", label: "MCP Tools" },
  { id: "programs", label: "Solana Programs" },
  { id: "protocols", label: "Protocols" },
  { id: "bags", label: "Bags.fm" },
  { id: "api", label: "API Reference" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
};

// ---------------------------------------------------------------------------
// Canvas: HeroMesh (particle field)
// ---------------------------------------------------------------------------
function HeroMesh() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const dots: { x: number; y: number; vx: number; vy: number }[] = [];
    for (let i = 0; i < 24; i++) dots.push({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.00015, vy: (Math.random() - 0.5) * 0.00015 });
    function resize() { c!.width = c!.offsetWidth * dpr; c!.height = c!.offsetHeight * dpr; }
    resize();
    window.addEventListener("resize", resize);
    let raf = 0;
    function draw() {
      const w = c!.offsetWidth, h = c!.offsetHeight;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > 1) d.vx *= -1;
        if (d.y < 0 || d.y > 1) d.vy *= -1;
      }
      ctx!.fillStyle = "rgba(255,255,255,0.12)";
      for (const d of dots) { ctx!.beginPath(); ctx!.arc(d.x * w, d.y * h, 1.2, 0, Math.PI * 2); ctx!.fill(); }
      ctx!.strokeStyle = "rgba(255,255,255,0.03)";
      ctx!.lineWidth = 0.5;
      for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
        const dx = (dots[i].x - dots[j].x) * w, dy = (dots[i].y - dots[j].y) * h;
        if (dx * dx + dy * dy < 6400) { ctx!.beginPath(); ctx!.moveTo(dots[i].x * w, dots[i].y * h); ctx!.lineTo(dots[j].x * w, dots[j].y * h); ctx!.stroke(); }
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

// ---------------------------------------------------------------------------
// Canvas: FlowMesh (horizontal particle flow)
// ---------------------------------------------------------------------------
function FlowMesh() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const nodes = [
      { x: 0.06, y: 0.5, label: "Agent" },
      { x: 0.21, y: 0.5, label: "MCP" },
      { x: 0.36, y: 0.5, label: "x402" },
      { x: 0.50, y: 0.5, label: "NeMo In" },
      { x: 0.64, y: 0.5, label: "Execute" },
      { x: 0.79, y: 0.5, label: "NeMo Out" },
      { x: 0.94, y: 0.5, label: "Solana" },
    ];
    const edges: [number, number][] = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]];
    interface P { edge: number; t: number; speed: number }
    const particles: P[] = [];
    for (let i = 0; i < 12; i++) particles.push({ edge: Math.floor(Math.random() * edges.length), t: Math.random(), speed: 0.002 + Math.random() * 0.003 });
    function resize() { c!.width = c!.offsetWidth * dpr; c!.height = c!.offsetHeight * dpr; }
    resize();
    window.addEventListener("resize", resize);
    let raf = 0;
    function draw() {
      const w = c!.offsetWidth, h = c!.offsetHeight;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);
      ctx!.strokeStyle = "rgba(255,255,255,0.04)";
      ctx!.lineWidth = 1;
      for (const [a, b] of edges) { ctx!.beginPath(); ctx!.moveTo(nodes[a].x * w, nodes[a].y * h); ctx!.lineTo(nodes[b].x * w, nodes[b].y * h); ctx!.stroke(); }
      for (const n of nodes) {
        ctx!.beginPath(); ctx!.arc(n.x * w, n.y * h, 5, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(52,211,153,0.25)"; ctx!.fill();
        ctx!.strokeStyle = "rgba(52,211,153,0.4)"; ctx!.lineWidth = 1; ctx!.stroke();
        ctx!.fillStyle = T.text30; ctx!.font = "10px system-ui"; ctx!.textAlign = "center";
        ctx!.fillText(n.label, n.x * w, n.y * h + 18);
      }
      ctx!.fillStyle = "rgba(52,211,153,0.6)";
      for (const p of particles) {
        const [a, b] = edges[p.edge];
        const px = nodes[a].x + (nodes[b].x - nodes[a].x) * p.t;
        const py = nodes[a].y + (nodes[b].y - nodes[a].y) * p.t;
        ctx!.beginPath(); ctx!.arc(px * w, py * h, 2, 0, Math.PI * 2); ctx!.fill();
        p.t += p.speed;
        if (p.t > 1) { p.t = 0; p.edge = (p.edge + 1) % edges.length; }
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ width: "100%", height: 120, display: "block" }} />;
}

// ---------------------------------------------------------------------------
// Canvas: CascadeMesh (tree with particles flowing down)
// ---------------------------------------------------------------------------
function CascadeMesh() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const tree = [
      { x: 0.5, y: 0.1 },
      { x: 0.25, y: 0.4 }, { x: 0.5, y: 0.4 }, { x: 0.75, y: 0.4 },
      { x: 0.12, y: 0.7 }, { x: 0.3, y: 0.7 }, { x: 0.42, y: 0.7 }, { x: 0.58, y: 0.7 }, { x: 0.7, y: 0.7 }, { x: 0.88, y: 0.7 },
      { x: 0.06, y: 0.95 }, { x: 0.18, y: 0.95 }, { x: 0.3, y: 0.95 }, { x: 0.42, y: 0.95 }, { x: 0.58, y: 0.95 }, { x: 0.7, y: 0.95 }, { x: 0.82, y: 0.95 }, { x: 0.94, y: 0.95 },
    ];
    const edges: [number, number][] = [
      [0,1],[0,2],[0,3],
      [1,4],[1,5],[2,6],[2,7],[3,8],[3,9],
      [4,10],[4,11],[5,12],[6,13],[7,14],[8,15],[9,16],[9,17],
    ];
    interface P { edge: number; t: number; speed: number }
    const particles: P[] = [];
    for (let i = 0; i < 30; i++) particles.push({ edge: Math.floor(Math.random() * edges.length), t: Math.random(), speed: 0.004 + Math.random() * 0.006 });
    function resize() { c!.width = c!.offsetWidth * dpr; c!.height = c!.offsetHeight * dpr; }
    resize();
    window.addEventListener("resize", resize);
    let raf = 0;
    function draw() {
      const w = c!.offsetWidth, h = c!.offsetHeight;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);
      ctx!.strokeStyle = "rgba(52,211,153,0.08)";
      ctx!.lineWidth = 1;
      for (const [a, b] of edges) { ctx!.beginPath(); ctx!.moveTo(tree[a].x * w, tree[a].y * h); ctx!.lineTo(tree[b].x * w, tree[b].y * h); ctx!.stroke(); }
      for (const n of tree) { ctx!.beginPath(); ctx!.arc(n.x * w, n.y * h, 3, 0, Math.PI * 2); ctx!.fillStyle = "rgba(52,211,153,0.2)"; ctx!.fill(); }
      ctx!.fillStyle = "rgba(52,211,153,0.55)";
      for (const p of particles) {
        const [a, b] = edges[p.edge];
        const px = tree[a].x + (tree[b].x - tree[a].x) * p.t;
        const py = tree[a].y + (tree[b].y - tree[a].y) * p.t;
        ctx!.beginPath(); ctx!.arc(px * w, py * h, 2, 0, Math.PI * 2); ctx!.fill();
        p.t += p.speed;
        if (p.t > 1) { p.t = 0; p.edge = Math.floor(Math.random() * edges.length); }
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ width: "100%", height: 300, display: "block", borderRadius: 8 }} />;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function Code({ children }: { children: string }) {
  return <code style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: "2px 6px", fontFamily: "monospace", fontSize: 13 }}>{children}</code>;
}

function Badge({ children, color = T.emerald }: { children: string; color?: string }) {
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, background: color, color: "#fff" }}>{children}</span>;
}

function SectionHeading({ children }: { children: string }) {
  return <h2 style={{ fontSize: 24, fontWeight: 600, color: T.text95, margin: 0 }}>{children}</h2>;
}

function Body({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 15, lineHeight: 1.7, color: T.text50, margin: 0 }}>{children}</p>;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, backdropFilter: "blur(8px)", transition: "border-color 0.2s, background 0.2s", ...style }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.card; }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Code block with tabs
// ---------------------------------------------------------------------------
const QUICKSTART_TABS = ["MCP", "REST", "TypeScript", "Python", "CLI", "Docker"] as const;
const QUICKSTART_CODE: Record<string, string> = {
  MCP: `{
  "mcpServers": {
    "aegis": {
      "url": "https://mcp.aegisprotocol.com/sse",
      "transport": "sse"
    }
  }
}`,
  REST: `curl -X POST https://api.aegisprotocol.com/v1/invoke \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"skill": "price-oracle", "input": {"token": "SOL"}}'`,
  TypeScript: `import { AegisClient } from "@aegis/sdk";

const aegis = new AegisClient({ apiKey: process.env.AEGIS_KEY });
const result = await aegis.invoke("price-oracle", {
  input: { token: "SOL" },
  maxFee: 0.001
});
console.log(result.output);`,
  Python: `from aegis import AegisClient

client = AegisClient(api_key="YOUR_KEY")
result = client.invoke("price-oracle",
    input={"token": "SOL"},
    max_fee=0.001
)
print(result.output)`,
  CLI: `# Install AegisX CLI
npm install -g @aegis/cli

# Authenticate with your Solana wallet
aegisx auth login

# Browse and invoke skills
aegisx skills list --category code-analysis
aegisx invoke price-oracle --input '{"token": "SOL"}'
aegisx trust score price-oracle
aegisx earnings --wallet YOUR_WALLET`,
  Docker: `# Clone the repository
git clone https://github.com/aegisplaceprotocol/aegisplace
cd aegis

# Copy environment template and configure
cp .env.example .env
# Edit .env with your SOLANA_RPC_URL, MONGODB_URI, etc.

# Start all services (API, MCP server, NeMo sidecar)
docker-compose up -d

# Verify services are running
docker-compose ps
curl http://localhost:3000/api/v1/health`,
};

const QUICKSTART_RESULTS: Record<string, string[]> = {
  MCP: [
    "47 skills available in AegisX, Cursor, or Windsurf",
    "SSE transport with real-time invocation streaming",
    "Automatic trust scoring on every tool call",
    "NeMo guardrail scanning on all inputs and outputs",
  ],
  REST: [
    "Direct HTTP access to all 15+ API endpoints",
    "x402 payment negotiation via standard HTTP 402 headers",
    "JSON responses with trust metadata on every call",
    "Rate limiting: 200 requests per 15 minutes (unauthenticated)",
  ],
  TypeScript: [
    "Type-safe client with full IntelliSense support",
    "12.6KB bundle, zero dependencies",
    "Built-in retry logic and error handling",
    "Automatic wallet-sign authentication",
  ],
  Python: [
    "LangChain adapter included for agent pipelines",
    "Async support with asyncio",
    "Typed responses with Pydantic models",
    "Compatible with Python 3.9+",
  ],
  CLI: [
    "28 commands for marketplace, trading, auditing, and research",
    "61 integrated tools (21 Aegis + 40 MCP ecosystem)",
    "Local SQLite for session history and usage stats",
    "Built-in Solana wallet management",
  ],
  Docker: [
    "Full local development environment in one command",
    "API server, MCP server, and NeMo guardrails sidecar",
    "MongoDB and all dependencies pre-configured",
    "PM2 process management via ecosystem.config.cjs",
  ],
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const INVOCATION_STEPS = [
  { n: 1, title: "Discover via MCP", desc: "Agent finds the skill through MCP standard tool discovery." },
  { n: 2, title: "Negotiate via x402", desc: "Payment terms set with HTTP 402. Price, currency, recipient." },
  { n: 3, title: "NeMo scans input", desc: "Guardrails check for PII, prompt injection, jailbreak attempts." },
  { n: 4, title: "Operator executes", desc: "The skill runs on the operator's infrastructure. Result returned." },
  { n: 5, title: "NeMo scans output", desc: "Output checked for hallucination, toxic content, data leaks." },
  { n: 6, title: "Solana settles", desc: "Payment splits atomically into 5 wallets. On chain. Final." },
];

const UNDER_THE_HOOD = [
  { label: "Settlement time", value: "~400ms on Solana mainnet" },
  { label: "Cost per transaction", value: "$0.00025 USDC" },
  { label: "Rate limiting (global)", value: "200 requests / 15 minutes" },
  { label: "Rate limiting (authenticated)", value: "10 requests / 15 minutes per wallet" },
  { label: "Rate limiting (MCP)", value: "60 requests / minute per connection" },
  { label: "Health monitoring", value: "5-minute loops, 3 failures triggers auto-deactivate" },
  { label: "Real-time feed", value: "SSE live stream at /api/feed for invocation events" },
  { label: "A2A discovery", value: "agent-card.json at /.well-known/agent-card.json" },
  { label: "Fee split enforcement", value: "Atomic 5-way split, no partial settlement possible" },
  { label: "Trust recalculation", value: "Every 15 minutes across all 5 dimensions" },
];

const WHY_CARDS = [
  { gap: "Agent Commerce", proven: "$10B+ in DEX volume proves agents can transact", missing: "No safety layer, no multi-chain settlement" },
  { gap: "On-Chain Registries", proven: "75% of Safe transactions on Gnosis prove on-chain identity works", missing: "Slow settlement, poor developer experience" },
  { gap: "Plugin Architectures", proven: "90+ plugins and 15K stars prove modular AI tooling works", missing: "No payment layer, no way for creators to earn" },
  { gap: "AI-to-AI Payments", proven: "First AI payment with Visa proves machine-to-machine commerce is real", missing: "Runs on its own chain, limited interoperability" },
  { gap: "HTTP Micropayments", proven: "140M+ x402 transactions prove instant stablecoin payments work", missing: "No trust scoring, no safety scanning" },
  { gap: "Universal Discovery", proven: "97M monthly MCP SDK downloads prove standardized tool discovery works", missing: "No payment rails, no monetization" },
];

const FEE_SPLIT = [
  { label: "Skill operator", pct: 85 },
  { label: "Validator pool", pct: 10 },
  { label: "Protocol treasury", pct: 3 },
  { label: "Insurance fund", pct: 1.5 },
  { label: "Burn", pct: 0.5 },
];

const TRUST_DIMS = [
  { name: "Reliability", desc: "Uptime, latency p95, error rate over rolling 30 days" },
  { name: "Safety", desc: "NeMo violation rate, severity-weighted score" },
  { name: "Accuracy", desc: "Output quality validated by downstream consumers" },
  { name: "Economic", desc: "Payment history, dispute rate, settlement speed" },
  { name: "Community", desc: "Peer reviews, validator attestations, age on registry" },
];

const CATEGORIES = [
  "Code Analysis", "Code Generation", "Data Analytics", "DeFi Tools",
  "DevOps", "Document Processing", "Education", "Finance",
  "Healthcare", "Image Processing", "Language Translation", "Legal",
  "Marketing", "Natural Language", "Research", "Security Auditing",
  "Social Media", "Trading", "Web Scraping",
];

const DISCOVERY_METHODS = [
  { method: "MCP Standard", desc: "16 tools auto-discovered by any MCP-compatible agent (AegisX, Cursor, Windsurf). SSE transport with real-time streaming." },
  { method: "REST API", desc: "15+ endpoints at /api/v1/*. Full CRUD for operators, invocations, trust scores, disputes, and earnings." },
  { method: "A2A Protocol", desc: "Google/Linux Foundation standard. Agent card at /.well-known/agent-card.json for agent-to-agent delegation." },
  { method: "/llms.txt", desc: "Machine-readable protocol summary at /llms.txt. Lets any LLM understand Aegis capabilities without API calls." },
];

const OPERATOR_STEPS = [
  { step: "Register", desc: "Submit operator metadata, endpoint URL, category, and pricing. Requires $AEGIS tokens." },
  { step: "Health Check", desc: "System pings your endpoint every 5 minutes. 3 consecutive failures auto-deactivate your operator." },
  { step: "Trust Scoring", desc: "5-dimension score recalculated every 15 minutes. Higher trust means more visibility in discovery." },
  { step: "Invocation", desc: "Agents discover and call your skill via MCP, REST, or A2A. NeMo scans input before execution." },
  { step: "Settlement", desc: "Payment splits atomically on Solana into 5 wallets. Your 85% share arrives in ~400ms." },
];

const AEGISX_COMMANDS = [
  { cmd: "aegisx skills list", desc: "Browse all 50 active skills with trust scores and pricing" },
  { cmd: "aegisx skills invoke", desc: "Execute any skill with JSON input and payment negotiation" },
  { cmd: "aegisx trust score", desc: "Get the full 5-dimension trust breakdown for any operator" },
  { cmd: "aegisx audit", desc: "Run a security audit on a Solana program directory" },
  { cmd: "aegisx research", desc: "Search Reddit, HN, GitHub, and DexScreener in parallel" },
  { cmd: "aegisx trade quote", desc: "Get Jupiter swap quotes for any Solana token pair" },
  { cmd: "aegisx trade swap", desc: "Execute a token swap through Jupiter aggregator" },
  { cmd: "aegisx launch", desc: "Create a new token on Bags.fm with configurable fee modes" },
  { cmd: "aegisx earnings", desc: "View earnings breakdown by wallet address" },
  { cmd: "aegisx auth login", desc: "Authenticate with your Solana wallet for signed requests" },
  { cmd: "aegisx mcp connect", desc: "Connect to the Aegis MCP server for tool discovery" },
  { cmd: "aegisx disputes list", desc: "View and manage disputes filed against your operators" },
];

const AEGISX_SHORTCUTS = [
  { keys: "Ctrl+Shift+I", action: "Invoke selected skill inline" },
  { keys: "Ctrl+Shift+T", action: "Show trust score overlay for current operator" },
  { keys: "Ctrl+Shift+M", action: "Open MCP tool palette" },
  { keys: "Ctrl+Shift+D", action: "Toggle NeMo guardrail debug panel" },
  { keys: "Ctrl+Shift+S", action: "Open Solana wallet and earnings dashboard" },
];

const AEGISX_SNIPPETS = [
  { name: "aegis-program", desc: "Anchor program scaffold with PDA derivation, checked arithmetic, and 5-way fee split" },
  { name: "aegis-fee-split", desc: "Complete fee distribution logic with [8500, 1000, 300, 150, 50] BPS values" },
  { name: "aegis-invoke", desc: "Full invocation flow with x402 payment negotiation and error handling" },
  { name: "aegis-client", desc: "AegisClient setup with wallet auth, retry config, and type-safe responses" },
  { name: "aegis-mcp-config", desc: "MCP server configuration with SSE transport and environment variables" },
];

const NEMO_PROFILES = [
  { name: "default", input: "PII scan, injection detect", output: "Toxicity, hallucination", latency: "~40ms" },
  { name: "security", input: "+ jailbreak, exfiltration", output: "+ data leak, bias", latency: "~85ms" },
  { name: "code", input: "+ malicious code patterns", output: "+ license violation", latency: "~60ms" },
];

const NEMO_TIERS = [
  { score: "90-100", level: "Minimal", desc: "Basic toxicity filter only. Single-pass scan. No sampling." },
  { score: "70-89", level: "Standard", desc: "Full default profile. PII stripping, injection detection, hallucination checks." },
  { score: "40-69", level: "Enhanced", desc: "Security profile active. Jailbreak detection, exfiltration blocking, 10% random deep scan sampling." },
  { score: "0-39", level: "Maximum", desc: "All checks on every call. Human review queue for flagged outputs. Temporary lockout after 3 violations." },
];

const NEMO_BLOCKED = [
  { threat: "PII in prompts", example: "SSN, credit card numbers, email addresses, phone numbers stripped before execution" },
  { threat: "SQL injection", example: "Payloads like ' OR 1=1; DROP TABLE detected and blocked at input scan" },
  { threat: "Prompt injection", example: "Attempts to override system instructions or extract internal prompts" },
  { threat: "Jailbreak patterns", example: "DAN-style prompts, roleplay escapes, instruction hierarchy attacks" },
  { threat: "Data exfiltration", example: "Output containing API keys, internal URLs, or base64-encoded secrets" },
  { threat: "Toxic content", example: "Hate speech, harassment, explicit content filtered from outputs" },
];

const NEMO_MODELS = [
  { model: "nemoguard-8b", desc: "Primary content safety model. Handles PII detection, toxicity scoring, and prompt injection classification. Fine-tuned from Llama 3.1 8B." },
  { model: "nemotron-70b", desc: "Reasoning model for complex safety decisions. Evaluates edge cases, context-dependent threats, and multi-step attack patterns." },
  { model: "MiniLM-L6-v2", desc: "Embedding model for semantic similarity. Powers jailbreak pattern matching and output hallucination detection via cosine similarity." },
];

const MCP_TOOLS_DATA = [
  { name: "aegis_discover", desc: "Search and filter operators by category, trust score, pricing, and tags" },
  { name: "aegis_invoke", desc: "Execute a single skill with payment negotiation and NeMo scanning" },
  { name: "aegis_invoke_batch", desc: "Batch invoke up to 10 skills in parallel with atomic settlement" },
  { name: "aegis_price", desc: "Get current pricing for any skill including fee breakdown" },
  { name: "aegis_trust_score", desc: "Full 5-dimension trust breakdown with historical trend" },
  { name: "aegis_trust_history", desc: "Trust score changes over time with dimension-level granularity" },
  { name: "aegis_operator_info", desc: "Detailed operator metadata, endpoint, health status, and earnings" },
  { name: "aegis_categories", desc: "List all 19 skill categories with operator counts" },
  { name: "aegis_register", desc: "Register a new skill operator with metadata and pricing config" },
  { name: "aegis_update", desc: "Update operator config, pricing, endpoint URL, or metadata" },
  { name: "aegis_deactivate", desc: "Deactivate an operator you own, removing it from discovery" },
  { name: "aegis_earnings", desc: "View earnings breakdown by wallet, operator, or time period" },
  { name: "aegis_disputes", desc: "List disputes with filters for status, operator, and date range" },
  { name: "aegis_dispute_submit", desc: "File a dispute against an invocation with evidence attachment" },
  { name: "aegis_royalty_tree", desc: "Visualize the full dependency graph and royalty cascade for a skill" },
  { name: "aegis_health", desc: "Platform health check with per-service status and latency metrics" },
];

const SOLANA_PROGRAMS = [
  {
    name: "Skill Registry",
    id: "7CHg7hLqGvpdY8tKKeZL6eLgudCszB7e7VnBB1ogUqYR",
    instructions: ["initialize", "register_operator", "invoke_skill", "update_trust", "deactivate_operator", "rotate_admin", "update_config", "claim_royalties"],
    safety: "PDA-derived authority, operator-only writes",
    desc: "Core protocol program. Handles operator registration, skill invocation, trust score updates, and atomic 5-way fee settlement.",
  },
  {
    name: "Royalty Registry",
    id: "FrXBFm4WdqBHosZJ8rMyT9FHNvRXuSVzxqGBbH7nCWs6",
    instructions: ["register_dependency", "update_weights", "cascade_royalty", "claim_royalties", "remove_dependency"],
    safety: "Depth-weighted cascade, max depth 5, per-creator vaults via CPI",
    desc: "Manages the upstream royalty graph. When a skill depends on other skills, royalties cascade automatically through a depth-weighted distribution.",
  },
  {
    name: "Governance",
    id: "6TwiJJSscSFpSQA1PU8uYoJHGwgxaprEPJSpKfRireSn",
    instructions: ["create_proposal", "cast_vote", "execute_proposal", "stake", "unstake"],
    safety: "Quorum requirements, time-locked execution, validator-only proposals",
    desc: "On-chain governance for protocol parameter changes. $AEGIS holders vote on fee splits, trust thresholds, and category additions.",
  },
];

const SOLANA_SAFETY = [
  "Checked arithmetic: all math uses checked_add, checked_mul, checked_sub with u128 intermediates",
  "PDA verification: every account validated with seeds + bump constraints",
  "Overflow protection: overflow-checks = true in Cargo.toml release profile",
  "Fee split validation: BPS values [8500, 1000, 300, 150, 50] enforced at initialization, must sum to 10000",
  "Authority checks: only the registered operator can modify their own state",
  "Rent-exempt enforcement: all accounts created with minimum rent balance",
];

const PROTOCOLS = [
  {
    name: "MCP",
    version: "1.0",
    status: "Live",
    desc: "Model Context Protocol. 16 tools for skill discovery and invocation. SSE transport with real-time streaming.",
    details: "Linux Foundation governance. 97M monthly SDK downloads. Compatible with AegisX, Cursor, Windsurf, and any MCP-compatible agent. One-line config to connect.",
  },
  {
    name: "x402",
    version: "0.4",
    status: "Live",
    desc: "HTTP 402 micropayments. Pay-per-call with USDC settlement on Solana.",
    details: "Coinbase v2 compliant. 140M+ transactions processed. Backed by Cloudflare, Google, and Visa. Agent sends payment with request, skill executes after verification.",
  },
  {
    name: "A2A",
    version: "0.1",
    status: "Live",
    desc: "Agent-to-agent delegation. Task handoff with context preservation.",
    details: "Google/Linux Foundation standard. Agent card served at /.well-known/agent-card.json. Enables autonomous agent-to-agent task delegation without human intervention.",
  },
];

const BAGS_FEE_MODES = [
  { mode: "Default (2% flat)", desc: "2% fee on every trade, split between protocol and operator. Best for stable, established operators." },
  { mode: "Low-pre, High-post", desc: "Lower fees on buys, higher fees on sells. Encourages accumulation and long-term holding." },
  { mode: "High-pre, Low-post", desc: "Higher fees on buys, lower fees on sells. Front-loads revenue for early liquidity." },
  { mode: "High-flat", desc: "Elevated flat fee on all trades. Maximum revenue per transaction for high-demand skills." },
];

const BAGS_SKILLS = [
  { name: "bags_token_launch", desc: "Create a new token on Bags.fm with bonding curve and fee mode config" },
  { name: "bags_trade_quote", desc: "Get swap quotes for any token pair through Jupiter aggregator" },
  { name: "bags_trade_swap", desc: "Execute a token swap with slippage protection" },
  { name: "bags_analytics", desc: "Token analytics: holders, volume, market cap, fee earnings" },
  { name: "bags_fee_config", desc: "View and update fee mode for your operator token" },
  { name: "bags_social_link", desc: "Link Twitter, GitHub, or website to your token profile" },
  { name: "bags_compound", desc: "Auto-compound liquidity from trading fees back into the pool" },
  { name: "bags_holders", desc: "List top token holders with balance and percentage breakdown" },
  { name: "bags_earnings", desc: "View fee earnings breakdown by period and source" },
  { name: "bags_dividends", desc: "Configure and distribute dividends to top token holders" },
  { name: "bags_dex_verify", desc: "Verify your token on DexScreener with branding and social links" },
  { name: "bags_dex_boost", desc: "Boost your token visibility on DexScreener listings" },
];

const API_ENDPOINTS = [
  { method: "POST", path: "/v1/invoke", desc: "Execute a skill with payment and guardrail scanning" },
  { method: "POST", path: "/v1/invoke/batch", desc: "Batch invoke up to 10 skills in parallel" },
  { method: "GET", path: "/v1/skills", desc: "List all active skills with pagination and filters" },
  { method: "GET", path: "/v1/skills/:id", desc: "Get skill details, trust score, and health status" },
  { method: "GET", path: "/v1/skills/:id/price", desc: "Get current pricing with fee breakdown" },
  { method: "GET", path: "/v1/trust/:id", desc: "Full 5-dimension trust score breakdown" },
  { method: "GET", path: "/v1/trust/:id/history", desc: "Trust score changes over time" },
  { method: "POST", path: "/v1/register", desc: "Register a new skill operator" },
  { method: "PUT", path: "/v1/skills/:id", desc: "Update skill config, pricing, or metadata" },
  { method: "DELETE", path: "/v1/skills/:id", desc: "Deactivate a skill (owner only)" },
  { method: "GET", path: "/v1/earnings/:wallet", desc: "Earnings breakdown by wallet address" },
  { method: "GET", path: "/v1/royalties/:id", desc: "Royalty dependency tree for a skill" },
  { method: "POST", path: "/v1/disputes", desc: "Submit a dispute with evidence" },
  { method: "GET", path: "/v1/disputes", desc: "List disputes with status filters" },
  { method: "GET", path: "/v1/categories", desc: "All 19 categories with operator counts" },
  { method: "GET", path: "/v1/health", desc: "Platform health with per-service status" },
  { method: "GET", path: "/v1/feed", desc: "SSE stream of real-time invocation events" },
  { method: "GET", path: "/v1/validators", desc: "List active validators with bond tiers" },
  { method: "POST", path: "/v1/auth/nonce", desc: "Request a nonce for wallet-sign authentication" },
  { method: "POST", path: "/v1/auth/verify", desc: "Verify ed25519 signature and receive JWT session" },
];

const API_EXAMPLES = [
  {
    title: "Invoke a Skill",
    method: "POST",
    path: "/v1/invoke",
    request: `{
  "skill": "price-oracle",
  "input": { "token": "SOL" },
  "maxFee": 0.001,
  "wallet": "YOUR_SOLANA_WALLET"
}`,
    response: `{
  "id": "inv_abc123",
  "output": { "price": 142.57, "currency": "USD" },
  "fee": 0.0005,
  "trust_score": 94.2,
  "settlement_tx": "5xKp...solana_tx_hash",
  "guardrail_pass": true,
  "latency_ms": 387
}`,
  },
  {
    title: "Get Trust Score",
    method: "GET",
    path: "/v1/trust/price-oracle",
    request: null,
    response: `{
  "operator": "price-oracle",
  "overall": 94.2,
  "dimensions": {
    "reliability": 96.1,
    "safety": 100.0,
    "accuracy": 91.8,
    "economic": 93.4,
    "community": 89.7
  },
  "last_updated": "2026-03-31T12:00:00Z",
  "health_status": "active",
  "total_invocations": 48291
}`,
  },
  {
    title: "Register an Operator",
    method: "POST",
    path: "/v1/register",
    request: `{
  "name": "my-analysis-bot",
  "endpoint": "https://my-server.com/api/analyze",
  "category": "code-analysis",
  "description": "Analyzes code for bugs and security issues",
  "pricing": { "perCall": 0.002, "currency": "USDC" },
  "tags": ["security", "code-review", "static-analysis"],
  "wallet": "YOUR_SOLANA_WALLET"
}`,
    response: `{
  "id": "op_xyz789",
  "name": "my-analysis-bot",
  "status": "active",
  "trust_score": 50.0,
  "health_check_url": "https://my-server.com/api/analyze/health",
  "next_health_check": "2026-03-31T12:05:00Z"
}`,
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function Docs() {
  const [activeSection, setActiveSection] = useState<SectionId>("hero");
  const [activeTab, setActiveTab] = useState<string>("MCP");
  const { data: stats } = trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });

  // Intersection observer for active section
  useEffect(() => {
    const els = SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      entries => { for (const e of entries) if (e.isIntersecting) setActiveSection(e.target.id as SectionId); },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const gridCell = (content: React.ReactNode, key?: string) => (
    <Card key={key}>{content}</Card>
  );

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text50 }}>
      <Navbar />

      <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", position: "relative" }}>

        {/* Left Nav */}
        <nav style={{
          width: 220, flexShrink: 0, position: "sticky", top: 72, height: "calc(100vh - 72px)", overflowY: "auto",
          padding: "32px 0 40px", borderRight: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column", gap: 1,
        }} className="hidden lg:flex">
          <div style={{ padding: "0 20px 16px", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: T.text20 }}>Documentation</div>
          {SECTIONS.map(s => {
            const active = activeSection === s.id;
            return (
              <button key={s.id} onClick={() => scrollTo(s.id)} style={{
                display: "block", width: "100%", textAlign: "left", background: "transparent",
                border: "none", borderLeft: active ? "2px solid #10B981" : "2px solid transparent",
                padding: "6px 20px", fontSize: 13, fontWeight: active ? 500 : 400,
                color: active ? "rgba(255,255,255,0.85)" : T.text30, cursor: "pointer",
                transition: "all 0.15s",
              }}>
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <main style={{ flex: 1, maxWidth: 720, margin: "0 auto", padding: "100px 48px 120px", display: "flex", flexDirection: "column", gap: 48 }}>

          {/* 1. Hero */}
          <section id="hero" style={{ position: "relative" }}>
            <div style={{ position: "relative", minHeight: 320 }}>
              <HeroMesh />
              <div style={{ position: "relative", zIndex: 1 }}>
                <motion.h1 {...fadeUp} style={{ fontSize: 32, fontWeight: 600, color: T.text95, margin: 0, lineHeight: 1.3 }}>
                  Aegis Documentation
                </motion.h1>
                <motion.p {...fadeUp} style={{ fontSize: 15, lineHeight: 1.7, color: T.text50, marginTop: 12, maxWidth: 520 }}>
                  Three products. One protocol. The complete infrastructure for AI skills that earn money on Solana.
                </motion.p>

                {/* Three Products */}
                <motion.div {...fadeUp} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 24 }}>
                  <Card style={{ padding: 16, borderLeft: "2px solid #10B981" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text95 }}>Marketplace</div>
                    <div style={{ fontSize: 12, color: T.text50, marginTop: 4, lineHeight: 1.5 }}>180+ skills. Discover, invoke, earn.</div>
                  </Card>
                  <Card style={{ padding: 16, borderLeft: "2px solid rgba(96,165,250,0.5)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text95 }}>AegisX IDE</div>
                    <div style={{ fontSize: 12, color: T.text50, marginTop: 4, lineHeight: 1.5 }}>Build skills with 86 Solana infrastructure modules, 47 skills, and AegisX CLI.</div>
                  </Card>
                  <Card style={{ padding: 16, borderLeft: "2px solid rgba(168,85,247,0.5)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text95 }}>SkillFi</div>
                    <div style={{ fontSize: 12, color: T.text50, marginTop: 4, lineHeight: 1.5 }}>Royalties cascade 5 levels deep.</div>
                  </Card>
                </motion.div>

                {/* Live Stats */}
                <motion.div {...fadeUp} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
                  {[
                    { label: "Skills Live", value: stats?.totalOperators?.toLocaleString() ?? "..." },
                    { label: "Invocations", value: stats?.totalInvocations?.toLocaleString() ?? "..." },
                    { label: "Revenue Settled", value: stats?.totalEarnings ? `$${parseFloat(String(stats.totalEarnings)).toLocaleString()}` : "..." },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: "center", padding: "12px 0" }}>
                      <div style={{ fontSize: 22, fontWeight: 600, color: T.text95, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: T.text20, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                    </div>
                  ))}
                </motion.div>

                {/* Protocol Logos */}
                <motion.div {...fadeUp} style={{ display: "flex", gap: 24, marginTop: 20, alignItems: "center" }}>
                  {["solana", "nvidia", "coinbase"].map(name => (
                    <img key={name} src={`/assets/icons/${name}.svg`} alt={name} style={{ height: 16, opacity: 0.25, filter: "brightness(10)" }} />
                  ))}
                  <span style={{ fontSize: 10, color: T.text20, letterSpacing: "0.06em" }}>SOLANA / NVIDIA NeMo / COINBASE x402</span>
                </motion.div>
              </div>
            </div>
          </section>

          {/* 2. Quick Start */}
          <section id="quickstart">
            <motion.div {...fadeUp}>
              <SectionHeading>Quick Start</SectionHeading>
              <div style={{ display: "flex", gap: 0, marginTop: 16, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap" }}>
                {QUICKSTART_TABS.map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} style={{
                    background: "none", border: "none", borderBottom: activeTab === t ? "2px solid rgba(52,211,153,0.55)" : "2px solid transparent",
                    padding: "8px 16px", fontSize: 13, color: activeTab === t ? T.text95 : T.text30, cursor: "pointer",
                  }}>{t}</button>
                ))}
              </div>
              <div style={{ marginTop: 12, position: "relative" }}>
                <pre style={{
                  background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 8,
                  padding: 16, fontSize: 13, lineHeight: 1.6, color: T.text80, overflow: "auto", margin: 0,
                }}>
                  {QUICKSTART_CODE[activeTab]}
                </pre>
                <button onClick={() => navigator.clipboard.writeText(QUICKSTART_CODE[activeTab])} style={{
                  position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.06)", border: `1px solid ${T.border}`,
                  borderRadius: 4, padding: "4px 10px", fontSize: 11, color: T.text30, cursor: "pointer",
                }}>Copy</button>
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text95, marginBottom: 8 }}>What you get</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(QUICKSTART_RESULTS[activeTab] || []).map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: T.emerald, fontSize: 13, lineHeight: 1.7, flexShrink: 0 }}>+</span>
                      <span style={{ fontSize: 13, color: T.text50, lineHeight: 1.7 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>

          {/* 3. Architecture */}
          <section id="architecture">
            <motion.div {...fadeUp}>
              <SectionHeading>One Skill Invocation</SectionHeading>
              <FlowMesh />
              <Body>Six things happen in 400 milliseconds.</Body>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                {INVOCATION_STEPS.map(s => (
                  <Card key={s.n}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 22, height: 22, borderRadius: "50%", background: T.emerald, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{s.n}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.text95 }}>{s.title}</span>
                    </div>
                    <div style={{ fontSize: 13, color: T.text50, marginTop: 6, lineHeight: 1.6 }}>{s.desc}</div>
                  </Card>
                ))}
              </div>
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: T.text95, marginBottom: 12 }}>Under the Hood</div>
                <Card>
                  {UNDER_THE_HOOD.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < UNDER_THE_HOOD.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <span style={{ fontSize: 13, color: T.text50 }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontFamily: "monospace", color: T.text80, textAlign: "right" }}>{item.value}</span>
                    </div>
                  ))}
                </Card>
              </div>
            </motion.div>
          </section>

          {/* 4. Why Aegis */}
          <section id="why-aegis">
            <motion.div {...fadeUp}>
              <SectionHeading>Why This Matters</SectionHeading>
              <Body>Six critical problems have been solved individually. Nobody combined them into one protocol. Until now.</Body>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                {WHY_CARDS.map(c => (
                  <Card key={c.gap} style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text95, marginBottom: 4 }}>{c.gap}</div>
                        <div style={{ fontSize: 12, color: T.text50, lineHeight: 1.6 }}>{c.proven}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(239,68,68,0.5)", maxWidth: 180, textAlign: "right", lineHeight: 1.5, flexShrink: 0, marginLeft: 16 }}>{c.missing}</div>
                    </div>
                  </Card>
                ))}
              </div>
              <Card style={{ marginTop: 16, padding: 20, background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: T.text95, lineHeight: 1.7, textAlign: "center" }}>
                  Aegis combines discovery, payments, trust, safety, royalties, and settlement into one protocol. On Solana. In 400ms.
                </div>
              </Card>
              <Body>
                Aegis is the first protocol to combine all six layers into a single stack. Discovery via MCP. Payments via x402. Trust via a 5-dimension scoring engine. Safety via NeMo Guardrails. Royalties via on-chain CPI cascades. Settlement via Solana. Why Solana specifically? 400ms finality, $0.00025 per transaction, and the largest active developer community in crypto. No other chain delivers sub-second settlement at that cost with that level of tooling support.
              </Body>
            </motion.div>
          </section>

          {/* 5. Marketplace */}
          <section id="marketplace">
            <motion.div {...fadeUp}>
              <SectionHeading>Marketplace</SectionHeading>
              <Body>180+ operators across 12 categories. Every skill trust-scored, every call audited, every payment settled on Solana.</Body>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 10 }}>19 Categories</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {CATEGORIES.map(cat => (
                    <span key={cat} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: T.card, border: `1px solid ${T.border}`, color: T.text50 }}>{cat}</span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 10 }}>How Operators Work</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {OPERATOR_STEPS.map((s, i) => (
                    <div key={s.step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span style={{ width: 22, height: 22, borderRadius: "50%", background: T.emerald, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{i + 1}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text95 }}>{s.step}</div>
                        <div style={{ fontSize: 13, color: T.text50, lineHeight: 1.6 }}>{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 10 }}>Discovery Methods</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {DISCOVERY_METHODS.map(d => (
                    <Card key={d.method} style={{ padding: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text95 }}>{d.method}</div>
                      <div style={{ fontSize: 13, color: T.text50, marginTop: 4, lineHeight: 1.6 }}>{d.desc}</div>
                    </Card>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 8 }}>Trust Scoring: 5 Dimensions</div>
                <Body>Recalculated every 15 minutes. Operators with scores below 40 get enhanced guardrail scanning on every call. Operators above 90 get minimal scanning for faster execution.</Body>
                <div style={{ marginTop: 8 }}>
                  {TRUST_DIMS.map(d => (
                    <div key={d.name} style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text80, minWidth: 90 }}>{d.name}</span>
                      <span style={{ fontSize: 13, color: T.text50 }}>{d.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 8 }}>Fee Split Per Invocation</div>
                {FEE_SPLIT.map(f => (
                  <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                    <div style={{ width: `${f.pct * 3}px`, height: 8, borderRadius: 4, background: T.emerald, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: T.text50, minWidth: 30 }}>{f.pct}%</span>
                    <span style={{ fontSize: 13, color: T.text30 }}>{f.label}</span>
                  </div>
                ))}
              </div>

              <Card style={{ marginTop: 16, padding: 16, background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text95, marginBottom: 6 }}>Revenue Example</div>
                <Body>
                  An operator priced at $0.005 per call receives 1,000 invocations per day. Gross daily revenue: $5.00. Creator share at 85%: $4.25 per day, $127.50 per month. If upstream dependencies exist, 5% of the creator share cascades through the royalty graph automatically.
                </Body>
              </Card>
            </motion.div>
          </section>

          {/* 6. AegisX */}
          <section id="aegisx">
            <motion.div {...fadeUp}>
              <SectionHeading>AegisX IDE</SectionHeading>
              <Body>A native code editor built for Aegis development. Based on Zed (Rust, high-performance). Trust-aware AI completions, built-in operator invocation, and Solana program tooling integrated at the editor level.</Body>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                {[
                  { title: "Trust-Aware", desc: "Live trust scores inline. Red flags before you invoke." },
                  { title: "Solana-Native", desc: "Wallet connected. Earnings, staking, disputes from the IDE." },
                  { title: "MCP Integrated", desc: "Discover and test skills without leaving the editor." },
                  { title: "Snippet Library", desc: "28 ready-to-paste patterns for common integrations." },
                ].map(c => (
                  <Card key={c.title}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text95 }}>{c.title}</div>
                    <div style={{ fontSize: 13, color: T.text50, marginTop: 4, lineHeight: 1.6 }}>{c.desc}</div>
                  </Card>
                ))}
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 10 }}>12 Commands</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {AEGISX_COMMANDS.map(c => (
                    <div key={c.cmd} style={{ display: "flex", gap: 12, padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 13, fontFamily: "monospace", color: T.emerald, minWidth: 180, flexShrink: 0 }}>{c.cmd}</span>
                      <span style={{ fontSize: 13, color: T.text50 }}>{c.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 10 }}>Keyboard Shortcuts</div>
                <Card>
                  {AEGISX_SHORTCUTS.map((s, i) => (
                    <div key={s.keys} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < AEGISX_SHORTCUTS.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <span style={{ fontSize: 13, fontFamily: "monospace", color: T.text80 }}>{s.keys}</span>
                      <span style={{ fontSize: 13, color: T.text50 }}>{s.action}</span>
                    </div>
                  ))}
                </Card>
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 10 }}>Top Snippets</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {AEGISX_SNIPPETS.map(s => (
                    <div key={s.name} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <Code>{s.name}</Code>
                      <span style={{ fontSize: 13, color: T.text50, lineHeight: 1.6 }}>{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Card style={{ marginTop: 20, padding: 16, background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text95, marginBottom: 6 }}>Why Not Just Use VS Code?</div>
                <Body>
                  VS Code requires extensions for MCP, Solana, and wallet integration that do not talk to each other. AegisX is MCP-native from the ground up. Every AI completion is trust-scored. Every tool call is guardrail-scanned. Every payment is wallet-signed. Solana program development has first-class support with Anchor syntax highlighting, PDA derivation helpers, and one-click devnet deployment. It is a single environment built for a single purpose: building and monetizing AI skills on Aegis.
                </Body>
              </Card>
            </motion.div>
          </section>

          {/* 7. SkillFi */}
          <section id="skillfi">
            <motion.div {...fadeUp}>
              <SectionHeading>SkillFi Royalties</SectionHeading>
              <CascadeMesh />
              <div style={{ fontSize: 16, fontWeight: 600, color: T.text95, marginTop: 12 }}>Build the foundation. Earn from everything above it. Forever.</div>
              <Body>
                You build a price oracle. Someone builds a portfolio analyzer on top. Someone builds a trading bot on top of that. Every time the trading bot runs, you earn. Automatically. On chain. Up to 5 levels deep.
              </Body>
              <Card style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text95, marginBottom: 8 }}>Depth-Weighted Distribution</div>
                {[
                  { depth: "Level 1 (direct dependency)", share: "50% of royalty pool" },
                  { depth: "Level 2", share: "25%" },
                  { depth: "Level 3", share: "12.5%" },
                  { depth: "Level 4", share: "6.25%" },
                  { depth: "Level 5", share: "6.25%" },
                ].map(l => (
                  <div key={l.depth} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                    <span style={{ color: T.text50 }}>{l.depth}</span>
                    <span style={{ color: T.emerald }}>{l.share}</span>
                  </div>
                ))}
              </Card>

              <Card style={{ marginTop: 16, padding: 16, background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text95, marginBottom: 6 }}>Concrete Example</div>
                <Body>
                  Your oracle earns $0.002 per call. A portfolio analyzer calls it 10,000 times per month. You earn $20 per month from that single dependency. A trading bot then builds on the portfolio analyzer and drives 50,000 calls per month. At Level 2, you earn an additional $25 per month from the trading bot's usage. Now multiply by every skill in the ecosystem that depends on yours. Foundational builders earn compounding revenue as the dependency graph grows.
                </Body>
              </Card>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 8 }}>Register a Dependency</div>
                <pre style={{
                  background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 8,
                  padding: 16, fontSize: 13, lineHeight: 1.6, color: T.text80, overflow: "auto", margin: 0,
                }}>{`// Register upstream dependency on-chain
const tx = await program.methods
  .registerDependency(
    upstreamOperatorPda,  // the skill you depend on
    weight: 100           // relative weight (BPS)
  )
  .accounts({
    operator: myOperatorPda,
    royaltyRegistry: registryPda,
    authority: wallet.publicKey,
  })
  .rpc();`}</pre>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 8 }}>Claim Royalties</div>
                <pre style={{
                  background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 8,
                  padding: 16, fontSize: 13, lineHeight: 1.6, color: T.text80, overflow: "auto", margin: 0,
                }}>{`// Claim accumulated royalties to your wallet
const tx = await program.methods
  .claimRoyalties()
  .accounts({
    operator: myOperatorPda,
    creatorVault: vaultPda,
    destination: wallet.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();

// Or via CLI
// aegisx earnings claim --operator my-oracle`}</pre>
              </div>
            </motion.div>
          </section>

          {/* 8. NeMo */}
          <section id="nemo">
            <motion.div {...fadeUp}>
              <SectionHeading>NeMo Guardrails</SectionHeading>
              <Body>Every call is safety-checked. No exceptions. NVIDIA NeMo Guardrails run as a Python sidecar, scanning both inputs and outputs before any skill executes or returns results.</Body>
              <div style={{ marginTop: 16, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>{["Profile", "Input Checks", "Output Checks", "Latency"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.text30, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {NEMO_PROFILES.map(p => (
                      <tr key={p.name}>
                        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.text95, fontFamily: "monospace" }}>{p.name}</td>
                        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.text50 }}>{p.input}</td>
                        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.text50 }}>{p.output}</td>
                        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.text30 }}>{p.latency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 10 }}>What Gets Blocked</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {NEMO_BLOCKED.map(b => (
                    <Card key={b.threat} style={{ padding: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text95 }}>{b.threat}</div>
                      <div style={{ fontSize: 12, color: T.text50, marginTop: 4, lineHeight: 1.6 }}>{b.example}</div>
                    </Card>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 10 }}>Models Used</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {NEMO_MODELS.map(m => (
                    <Card key={m.model} style={{ padding: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", color: T.emerald }}>{m.model}</div>
                      <div style={{ fontSize: 13, color: T.text50, marginTop: 4, lineHeight: 1.6 }}>{m.desc}</div>
                    </Card>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 8 }}>Adaptive Tiers (by Trust Score)</div>
                {NEMO_TIERS.map(t => (
                  <div key={t.score} style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 13, fontFamily: "monospace", color: T.emerald, minWidth: 60 }}>{t.score}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text80, minWidth: 80 }}>{t.level}</span>
                    <span style={{ fontSize: 13, color: T.text50 }}>{t.desc}</span>
                  </div>
                ))}
              </div>
              <Card style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text95, marginBottom: 6 }}>Self-Improving</div>
                <Body>3 violations in 24h triggers enhanced monitoring. 5 triggers temporary lockout. 10 triggers permanent ban pending manual review.</Body>
              </Card>
            </motion.div>
          </section>

          {/* 9. MCP Tools */}
          <section id="mcp-tools">
            <motion.div {...fadeUp}>
              <SectionHeading>MCP Tools</SectionHeading>
              <Body>16 tools accessible from any MCP-compatible agent. One-line config to connect AegisX, Cursor, or Windsurf.</Body>
              <div style={{ marginTop: 16, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>{["Tool", "Description"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.text30, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {MCP_TOOLS_DATA.map(t => (
                      <tr key={t.name}>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${T.border}`, fontFamily: "monospace", color: T.text80, whiteSpace: "nowrap" }}>{t.name}</td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${T.border}`, color: T.text50 }}>{t.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </section>

          {/* 10. Solana Programs */}
          <section id="programs">
            <motion.div {...fadeUp}>
              <SectionHeading>Solana Programs</SectionHeading>
              <Body>Three Anchor programs on Solana devnet. Built with Anchor 0.30.1 in Rust. Mainnet audit pending.</Body>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                {SOLANA_PROGRAMS.map(p => (
                  <Card key={p.name}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text95 }}>{p.name}</div>
                    <div style={{ fontSize: 12, fontFamily: "monospace", color: T.text30, marginTop: 4, wordBreak: "break-all" }}>{p.id}</div>
                    <div style={{ fontSize: 13, color: T.text50, marginTop: 6, lineHeight: 1.6 }}>{p.desc}</div>
                    <div style={{ fontSize: 13, color: T.text50, marginTop: 8 }}>
                      <span style={{ fontWeight: 600, color: T.text80 }}>Instructions: </span>
                      {p.instructions.map((inst, i) => (
                        <span key={inst}>
                          <Code>{inst}</Code>
                          {i < p.instructions.length - 1 && <span style={{ color: T.text20 }}>{" "}</span>}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: T.emerald, marginTop: 6 }}>{p.safety}</div>
                  </Card>
                ))}
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 10 }}>Safety Features</div>
                <Card>
                  {SOLANA_SAFETY.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: i < SOLANA_SAFETY.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <span style={{ color: T.emerald, flexShrink: 0 }}>+</span>
                      <span style={{ fontSize: 13, color: T.text50, lineHeight: 1.6 }}>{s}</span>
                    </div>
                  ))}
                </Card>
              </div>
            </motion.div>
          </section>

          {/* 11. Protocols */}
          <section id="protocols">
            <motion.div {...fadeUp}>
              <SectionHeading>Protocols</SectionHeading>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                {PROTOCOLS.map(p => (
                  <Card key={p.name}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.text95 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: T.text30 }}>v{p.version}</span>
                      <Badge color="rgba(52,211,153,0.35)">{p.status}</Badge>
                    </div>
                    <div style={{ fontSize: 13, color: T.text50, marginTop: 4, lineHeight: 1.6 }}>{p.desc}</div>
                    <div style={{ fontSize: 12, color: T.text30, marginTop: 6, lineHeight: 1.6 }}>{p.details}</div>
                  </Card>
                ))}
              </div>
            </motion.div>
          </section>

          {/* 12. Bags.fm */}
          <section id="bags">
            <motion.div {...fadeUp}>
              <SectionHeading>Bags.fm</SectionHeading>
              <Body>Every operator gets a token on Bags.fm at registration. 2% of every trade goes to the protocol. Every skill invocation triggers a forced buy of the operator's token.</Body>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                {[
                  { title: "Token Launch", desc: "Automatic bonding curve creation at operator registration. No setup needed." },
                  { title: "Fee Sharing", desc: "2% trade fee split between protocol, operator, and stakers." },
                  { title: "Forced Buy Pressure", desc: "Every invocation allocates a portion of fees to buy the operator token." },
                  { title: "Holder Rewards", desc: "Top token holders earn a share of the operator's invocation revenue." },
                ].map(c => (
                  <Card key={c.title}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text95 }}>{c.title}</div>
                    <div style={{ fontSize: 13, color: T.text50, marginTop: 4, lineHeight: 1.6 }}>{c.desc}</div>
                  </Card>
                ))}
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 10 }}>Fee Modes</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr>{["Mode", "Description"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.text30, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {BAGS_FEE_MODES.map(f => (
                        <tr key={f.mode}>
                          <td style={{ padding: "6px 10px", borderBottom: `1px solid ${T.border}`, color: T.text95, fontFamily: "monospace", whiteSpace: "nowrap", fontSize: 12 }}>{f.mode}</td>
                          <td style={{ padding: "6px 10px", borderBottom: `1px solid ${T.border}`, color: T.text50 }}>{f.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 10 }}>12 Bags.fm Skills</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {BAGS_SKILLS.map(s => (
                    <div key={s.name} style={{ display: "flex", gap: 12, padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: T.emerald, minWidth: 180, flexShrink: 0 }}>{s.name}</span>
                      <span style={{ fontSize: 13, color: T.text50 }}>{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 8 }}>CLI Commands</div>
                <pre style={{
                  background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 8,
                  padding: 16, fontSize: 13, lineHeight: 1.6, color: T.text80, overflow: "auto", margin: 0,
                }}>{`# Launch a token on Bags.fm
aegisx launch "My Operator" --symbol MOP --fee-mode high-pre-low-post

# Get a swap quote
aegisx trade quote --from USDC --to AEGIS --amount 100

# Execute the swap
aegisx trade swap --from USDC --to AEGIS --amount 100 --slippage 0.5`}</pre>
              </div>
            </motion.div>
          </section>

          {/* 13. API Reference */}
          <section id="api">
            <motion.div {...fadeUp}>
              <SectionHeading>API Reference</SectionHeading>
              <Body>20 endpoints. REST API at /api/v1/*. Authentication via Solana wallet-sign (ed25519 nonce, signature, JWT session cookie).</Body>
              <div style={{ marginTop: 16, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>{["Method", "Path", "Description"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.text30, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {API_ENDPOINTS.map((e, i) => (
                      <tr key={i}>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${T.border}`, fontFamily: "monospace", fontWeight: 600, color: e.method === "GET" ? T.emerald : e.method === "POST" ? "rgba(96,165,250,0.6)" : e.method === "PUT" ? "rgba(251,191,36,0.6)" : "rgba(248,113,113,0.6)", fontSize: 12 }}>{e.method}</td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${T.border}`, fontFamily: "monospace", color: T.text80 }}>{e.path}</td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${T.border}`, color: T.text50 }}>{e.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text95, marginBottom: 12 }}>Request / Response Examples</div>
                {API_EXAMPLES.map(ex => (
                  <div key={ex.title} style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text95 }}>{ex.title}</span>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: ex.method === "GET" ? T.emerald : "rgba(96,165,250,0.6)" }}>{ex.method} {ex.path}</span>
                    </div>
                    {ex.request && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: T.text20, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Request</div>
                        <pre style={{
                          background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 8,
                          padding: 12, fontSize: 12, lineHeight: 1.5, color: T.text80, overflow: "auto", margin: 0,
                        }}>{ex.request}</pre>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 11, color: T.text20, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Response</div>
                      <pre style={{
                        background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 8,
                        padding: 12, fontSize: 12, lineHeight: 1.5, color: T.text80, overflow: "auto", margin: 0,
                      }}>{ex.response}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

        </main>

        {/* Right TOC */}
        <aside style={{
          width: 180, flexShrink: 0, position: "sticky", top: 72, height: "calc(100vh - 72px)",
          padding: "32px 16px 40px", borderLeft: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column", gap: 1,
          maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
        }} className="hidden xl:flex">
          <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: T.text20, marginBottom: 12 }}>On this page</div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)} style={{
              background: "none", border: "none", textAlign: "left", padding: "5px 0",
              fontSize: 12, color: activeSection === s.id ? "#10B981" : T.text20, cursor: "pointer",
              fontWeight: activeSection === s.id ? 500 : 400,
              transition: "color 0.15s",
            }}>{s.label}</button>
          ))}
        </aside>

      </div>
    </div>
  );
}
