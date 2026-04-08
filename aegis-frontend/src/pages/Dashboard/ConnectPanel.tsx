/**
 * Aegis Dashboard. MCP Connect Panel
 */
import { useState, useCallback } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import { SIcon } from "./icons";
import { Card, PageHeader, StatTile, CardHead } from "./primitives";

/* ── MCP Tools list ────────────────────────────────────────────────────── */

const MCP_TOOLS = [
  { name: "aegis_list_operators",   desc: "List all registered skill operators with filters" },
  { name: "aegis_get_operator",     desc: "Get full metadata for a specific operator by slug" },
  { name: "aegis_invoke_skill",     desc: "Execute a skill operator and return the result" },
  { name: "aegis_get_trust_score",  desc: "Retrieve on-chain quality score for an operator" },
  { name: "aegis_search_operators", desc: "Semantic search across operator names and descriptions" },
  { name: "aegis_get_health",       desc: "Check protocol health and network status" },
  { name: "aegis_get_stats",        desc: "Fetch aggregate protocol statistics" },
  { name: "aegis_get_earnings",     desc: "Query earnings data for connected wallet" },
  { name: "aegis_list_validators",  desc: "List active validators securing the network" },
  { name: "aegis_get_leaderboard",  desc: "Get top operators ranked by invocations or revenue" },
  { name: "aegis_submit_operator",  desc: "Register a new skill operator to the protocol" },
  { name: "aegis_get_categories",   desc: "List all operator category taxonomy" },
  { name: "aegis_get_activity",     desc: "Fetch recent invocation activity log" },
  { name: "aegis_resolve_dispute",  desc: "Submit or query on-chain dispute resolution" },
  { name: "aegis_get_fee_split",    desc: "Query current fee distribution configuration" },
  { name: "aegis_get_operator_analytics", desc: "Get detailed analytics for a specific operator" },
];

/* ── Code snippets ─────────────────────────────────────────────────────── */

const CLAUDE_CODE_SNIPPET = `// ~/.claude/mcp.json
{
  "mcpServers": {
    "aegis": {
      "url": "https://mcp.aegisplace.com/v1",
      "transport": { "type": "sse" },
      "auth": {
        "type": "bearer",
        "token": "<YOUR_API_KEY>"
      }
    }
  }
}`;

const REST_SNIPPET = `curl -X POST https://mcp.aegisplace.com/v1/invoke \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "aegis_invoke_skill",
    "arguments": {
      "slug": "code-guard",
      "input": { "code": "..." }
    }
  }'`;

const PYTHON_SNIPPET = `import anthropic

client = anthropic.Anthropic()

response = client.beta.messages.create(
    model="claude-opus-4-5",
    max_tokens=4096,
    tools=[{"type": "mcp", "server_name": "aegis"}],
    messages=[{
        "role": "user",
        "content": "Scan this code for vulnerabilities using CodeGuard"
    }]
)
print(response.content)`;

/* ── CodeBlock ─────────────────────────────────────────────────────────── */

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [code]);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleCopy}
        style={{
          position: "absolute", top: 10, right: 10, padding: "4px 10px",
          borderRadius: 4, border: `1px solid ${T.border}`, background: T.white6,
          color: copied ? T.text80 : T.text30, fontSize: 11, fontWeight: 500,
          cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.02em",
          display: "flex", alignItems: "center", gap: 4, zIndex: 1,
        }}
      >
        <SIcon name="copy" size={11} />
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre style={{
        margin: 0, padding: "16px 16px 16px 16px", borderRadius: 6,
        fontSize: 12, color: T.text50, background: T.white3,
        border: `1px solid ${T.border}`, fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        overflowX: "auto", lineHeight: 1.6, whiteSpace: "pre",
      }}>{code}</pre>
    </div>
  );
}

/* ── ConnectPanel ──────────────────────────────────────────────────────── */

export default function ConnectPanel() {
  const [codeTab, setCodeTab] = useState<"claude" | "rest" | "python">("claude");
  const connectStats = trpc.stats.overview.useQuery(undefined, { staleTime: 300_000 });
  const connectOps = ((connectStats.data as Record<string, unknown>)?.totalOperators as number)?.toLocaleString() ?? "...";

  const codeTabItems: Array<{ key: typeof codeTab; label: string }> = [
    { key: "claude",  label: "AegisX" },
    { key: "rest",    label: "REST API" },
    { key: "python",  label: "Python" },
  ];

  const activeCode = codeTab === "claude" ? CLAUDE_CODE_SNIPPET : codeTab === "rest" ? REST_SNIPPET : PYTHON_SNIPPET;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader
        title="MCP Connect"
        subtitle="Model Context Protocol integration for AI agents"
        action={
          <Link href="/docs">
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600,
              color: T.text50, cursor: "pointer", border: `1px solid ${T.border}`, transition: "all 0.15s",
            }}>
              API Reference <SIcon name="arrow-right" size={12} />
            </span>
          </Link>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <StatTile label="MCP Tools" value="16" delta="all categories" sub="ready to invoke" />
        <StatTile label="Operators" value={connectOps} delta="+12 this week" sub="skills available" />
        <StatTile label="Avg Latency" value="89ms" delta="p95: 312ms" sub="tool round-trip" />
        <StatTile label="Uptime" value="99.9%" delta="30-day rolling" sub="protocol availability" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
        <Card>
          <div style={{ padding: "13px 20px 0", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 0 }}>
            {codeTabItems.map((tab) => (
              <button key={tab.key} onClick={() => setCodeTab(tab.key)} style={{
                padding: "6px 16px 12px", border: "none", background: "transparent",
                color: codeTab === tab.key ? T.text95 : T.text30, fontSize: 13,
                fontWeight: codeTab === tab.key ? 700 : 400, cursor: "pointer",
                borderBottom: codeTab === tab.key ? `2px solid rgba(255,255,255,0.20)` : "2px solid transparent",
                transition: "all 0.15s", marginBottom: -1,
              }}>{tab.label}</button>
            ))}
          </div>
          <div style={{ padding: 16 }}>
            <CodeBlock code={activeCode} language={codeTab} />
          </div>
        </Card>

        <Card>
          <div style={{ padding: "13px 16px 11px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, letterSpacing: "0.02em", fontWeight: 500, color: T.text20 }}>MCP Tools</span>
            <span style={{ fontSize: 10, color: T.text20, fontVariantNumeric: "tabular-nums" }}>{MCP_TOOLS.length} available</span>
          </div>
          <div style={{ maxHeight: 440, overflowY: "auto" }}>
            {MCP_TOOLS.map((tool, i) => (
              <div key={tool.name} style={{
                padding: "9px 16px",
                borderBottom: i < MCP_TOOLS.length - 1 ? `1px solid ${T.border}` : "none",
                transition: "background 0.15s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <img src="/assets/vectorwhite.svg" alt="" width={10} height={10} style={{ opacity: 0.15 }} />
                  <span style={{ fontSize: 11, color: T.text50, fontFamily: "'JetBrains Mono', monospace", fontWeight: 400 }}>{tool.name}</span>
                </div>
                <div style={{ fontSize: 10, color: T.text20, lineHeight: 1.5, paddingLeft: 16, fontWeight: 300 }}>{tool.desc}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHead label="Quick Start" />
        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[
            { n: "1", title: "Get your API key", desc: "Generate a key from the Settings panel. Keep it secret." },
            { n: "2", title: "Add to AegisX", desc: "Paste the config snippet into ~/.claude/mcp.json and restart." },
            { n: "3", title: "Invoke any skill", desc: "Ask Claude to use any Aegis operator. it handles the rest." },
          ].map((step) => (
            <div key={step.n} style={{ display: "flex", gap: 14 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 4, background: "rgba(255,255,255,0.03)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: 11, fontWeight: 300, color: T.text30,
              }}>{step.n}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 400, color: T.text50, marginBottom: 3 }}>{step.title}</div>
                <div style={{ fontSize: 11, color: T.text20, lineHeight: 1.5, fontWeight: 300 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
