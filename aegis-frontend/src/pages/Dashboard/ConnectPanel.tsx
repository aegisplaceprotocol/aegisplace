/**
 * Aegis Dashboard. MCP Connect Panel
 */
import { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { apiUrl } from "@/lib/api";
import { T } from "./theme";
import { SIcon } from "./icons";
import { Card, PageHeader, StatTile, CardHead } from "./primitives";

interface MCPTool {
  name: string;
  description: string;
}

interface MCPDiscovery {
  name: string;
  version: string;
  description: string;
  protocolVersion: string;
  tools: MCPTool[];
  endpoint: string;
}

/* ── Code snippets ─────────────────────────────────────────────────────── */

const MCP_CONFIG_SNIPPET = `// ~/.claude/mcp.json
{
  "mcpServers": {
    "aegis": {
      "url": "https://aegisplace.com/api/mcp"
    }
  }
}`;

const MCP_USAGE_SNIPPET = `# Then use the MCP tools in Claude Code or Cursor:
1. Call aegis_list_operators or aegis_search_operators to find candidates
2. Call aegis_get_operator with the slug you want
3. Copy the returned operatorId
4. Call aegis_invoke_operator with that operatorId
5. If the operator is paid, the response returns PAYMENT_REQUIRED plus the checkout URL
6. Open checkout, connect your wallet, and approve the USDC payment
7. Retry aegis_invoke_operator with:
   - operatorId
   - x-payer-wallet
   - x-payment-proof
8. The second call returns the unlocked private SKILL.md result`;

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
  const [mcpDiscovery, setMcpDiscovery] = useState<MCPDiscovery | null>(null);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const connectStats = trpc.stats.overview.useQuery(undefined, { staleTime: 300_000 });
  const connectOps = ((connectStats.data as Record<string, unknown>)?.totalOperators as number)?.toLocaleString() ?? "...";

  useEffect(() => {
    let cancelled = false;

    fetch(apiUrl("/api/mcp"))
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Discovery failed with status ${response.status}`);
        }
        return response.json() as Promise<MCPDiscovery>;
      })
      .then((data) => {
        if (cancelled) return;
        setMcpDiscovery(data);
        setDiscoveryError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setDiscoveryError(error instanceof Error ? error.message : "Unable to load MCP discovery");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const tools = mcpDiscovery?.tools ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader
        title="MCP Connect"
        subtitle="Model Context Protocol connectivity, invocation flow, and live command discovery"
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
        <StatTile label="MCP Tools" value={tools.length > 0 ? String(tools.length) : "..."} delta="live discovery" sub="ready to invoke" />
        <StatTile label="Operators" value={connectOps} delta="+12 this week" sub="skills available" />
        <StatTile label="Endpoint" value={mcpDiscovery?.endpoint ?? "/api/mcp"} delta={mcpDiscovery?.protocolVersion ?? "MCP"} sub="JSON-RPC discovery route" />
        <StatTile label="Server" value={mcpDiscovery?.name ?? "aegis-protocol"} delta={mcpDiscovery?.version ?? "1.0.0"} sub="discovery metadata" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
        <Card>
          <CardHead label="MCP Connectivity Procedure" />
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.text50, marginBottom: 6 }}>MCP server config</div>
              <div style={{ fontSize: 12, color: T.text20, lineHeight: 1.6, marginBottom: 12 }}>
                Point Claude Code, Cursor, or another MCP client at the Aegis JSON-RPC discovery endpoint. This mirrors the MCP setup shown on operator detail pages.
              </div>
              <CodeBlock code={MCP_CONFIG_SNIPPET} language="json" />
            </div>

            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.text50, marginBottom: 6 }}>MCP usage flow</div>
              <div style={{ fontSize: 12, color: T.text20, lineHeight: 1.6, marginBottom: 12 }}>
                Discover operators, resolve the operator ID, then invoke through MCP. Paid skills require checkout and a second invocation with the wallet address and confirmed payment signature.
              </div>
              <CodeBlock code={MCP_USAGE_SNIPPET} language="plaintext" />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ padding: "13px 16px 11px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, letterSpacing: "0.02em", fontWeight: 500, color: T.text20 }}>Available MCP Commands</span>
            <span style={{ fontSize: 10, color: T.text20, fontVariantNumeric: "tabular-nums" }}>{tools.length} available</span>
          </div>
          <div style={{ maxHeight: 440, overflowY: "auto" }}>
            {tools.length === 0 && !discoveryError && (
              <div style={{ padding: "20px 16px", fontSize: 11, color: T.text20 }}>
                Loading MCP discovery...
              </div>
            )}
            {discoveryError && (
              <div style={{ padding: "20px 16px", fontSize: 11, color: T.negative }}>
                {discoveryError}
              </div>
            )}
            {tools.map((tool, i) => (
              <div key={tool.name} style={{
                padding: "9px 16px",
                borderBottom: i < tools.length - 1 ? `1px solid ${T.border}` : "none",
                transition: "background 0.15s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <img src="/assets/vectorwhite.svg" alt="" width={10} height={10} style={{ opacity: 0.15 }} />
                  <span style={{ fontSize: 11, color: T.text50, fontFamily: "'JetBrains Mono', monospace", fontWeight: 400 }}>{tool.name}</span>
                </div>
                <div style={{ fontSize: 10, color: T.text20, lineHeight: 1.5, paddingLeft: 16, fontWeight: 300 }}>{tool.description}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHead label="Connection Steps" />
        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[
            { n: "1", title: "Add the MCP server", desc: "Paste the JSON config into your MCP client so it discovers Aegis at /api/mcp." },
            { n: "2", title: "Discover a skill", desc: "Use aegis_list_operators or aegis_search_operators, then inspect the result with aegis_get_operator." },
            { n: "3", title: "Invoke and pay if required", desc: "Run aegis_invoke_operator. Paid skills return a checkout URL, then a second call with x-payer-wallet and x-payment-proof unlocks the result." },
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
