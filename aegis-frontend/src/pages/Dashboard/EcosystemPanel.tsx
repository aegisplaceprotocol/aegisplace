import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import {
  Card,
  CardHead,
  PageHeader,
  StatTile,
  StatusBadge,
  MonoValue,
} from "./primitives";

/* ── 6-Layer Stack ───────────────────────────────────────────────────── */

const STACK_LAYERS = [
  {
    name: "Application Layer",
    desc: "Autonomous AI agents consuming services across the economy",
    techs: ["Claude", "GPT-4o", "Gemini", "Mistral", "Llama"],
    integration: "Agents discover and invoke Aegis operators via MCP and A2A protocols",
    highlight: false,
  },
  {
    name: "Protocol Layer",
    desc: "Standard interfaces for agent discovery, communication, and identity",
    techs: ["MCP", "A2A", "ERC-8004", "Server Cards"],
    integration: "Aegis operators are discoverable via MCP tools and A2A agent cards",
    highlight: false,
  },
  {
    name: "Trust Layer",
    desc: "Bonded validation, on-chain reputation, economic slashing. the missing piece",
    techs: ["AEGIS Protocol", "6-Pillar Trust", "Bonded Validation", "cNFT Receipts"],
    integration: "THE CORE. between 'services exist' and 'services are trustworthy'",
    highlight: true,
  },
  {
    name: "Payment Layer",
    desc: "HTTP-native micropayments with sub-second settlement",
    techs: ["x402", "Stripe ACP", "USDC", "Google AP2"],
    integration: "Every operator invocation is an x402 payment with atomic fee splitting",
    highlight: false,
  },
  {
    name: "Execution Layer",
    desc: "400ms finality, sub-cent transactions, programmable accounts",
    techs: ["Solana", "SPL Tokens", "PDAs", "Metaplex Core"],
    integration: "All bonds, slashing, revenue splits, and receipts settle on Solana",
    highlight: false,
  },
  {
    name: "Infrastructure Layer",
    desc: "GPU compute, inference containers, safety rails, and continuous evaluation",
    techs: ["NVIDIA NIM", "GPU Clusters", "NeMo Guardrails", "NeMo Evaluator"],
    integration: "7 NeMo pillars baked into every operator at the protocol level",
    highlight: false,
  },
];

/* ── Protocol Integrations ───────────────────────────────────────────── */

const PROTOCOLS = [
  {
    name: "MCP",
    desc: "Model Context Protocol. Linux Foundation standard for agent-to-tool communication",
    metric: "16 tools",
    status: "Operational",
    statusColor: "green" as const,
    detail: "97M monthly SDK downloads. Aegis operators register as MCP tools with Server Cards for auto-discovery.",
  },
  {
    name: "A2A",
    desc: "Google Agent-to-Agent protocol for multi-agent collaboration",
    metric: "Compatible",
    status: "Integrated",
    statusColor: "green" as const,
    detail: "A2A agents use Aegis to verify operator quality before delegation. Agent Cards expose trust scores.",
  },
  {
    name: "ERC-8004",
    desc: "On-chain agent identity standard. Metaplex Core NFTs with reputation",
    metric: "Registry",
    status: "Active",
    statusColor: "green" as const,
    detail: "Identity says WHO you are. Aegis says HOW GOOD you are. Complementary identity + trust layer.",
  },
  {
    name: "x402",
    desc: "Coinbase HTTP-native micropayment protocol. USDC settlement",
    metric: "104K/day",
    status: "Operational",
    statusColor: "green" as const,
    detail: "Every operator invocation is an x402 payment. Reusable sessions, multi-chain support, service discovery.",
  },
];

/* ── Partner Ecosystem ───────────────────────────────────────────────── */

const PARTNERS = [
  { name: "NVIDIA NeMo", type: "AI Infrastructure", status: "Integrated" },
  { name: "Solana Agent Kit", type: "Agent Framework", status: "Integrated" },
  { name: "ElizaOS", type: "Agent Framework", status: "Compatible" },
  { name: "Stripe ACP", type: "Payment Protocol", status: "Compatible" },
  { name: "Google AP2", type: "Payment Protocol", status: "Compatible" },
  { name: "AegisX / Codex", type: "Agent Interface", status: "Compatible" },
  { name: "NIST CAISI", type: "Standards Body", status: "Engaging" },
  { name: "Agentic AI Foundation", type: "Governance", status: "Tracking" },
];

/* ── Styles ──────────────────────────────────────────────────────────── */

const LABEL: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.02em",
  fontWeight: 500,
  color: T.text20,
};

/* ── Component ───────────────────────────────────────────────────────── */

export default function EcosystemPanel() {
  const stats = trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });

  return (
    <div>
      <PageHeader
        title="Agent Ecosystem"
        subtitle="Interactive view of the AI agent economy stack"
      />

      {/* Live Protocol Stats */}
      {stats.data && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}>
          <StatTile label="Operators" value={stats.data.totalOperators.toLocaleString()} accent={T.positive} />
          <StatTile label="Invocations" value={stats.data.totalInvocations.toLocaleString()} accent={T.text50} />
          <StatTile label="Validators" value={stats.data.totalValidators.toLocaleString()} accent={T.text50} />
          <StatTile label="Disputes" value={`${stats.data.openDisputes} open / ${stats.data.totalDisputes}`} accent={T.text30} />
        </div>
      )}

      {/* 6-Layer Stack Visualization */}
      <Card style={{ marginBottom: 24 }}>
        <CardHead label="AI Agent Economy Stack" action={
          <span style={{ fontSize: 11, color: T.text30 }}>6 layers</span>
        } />
        <div style={{ padding: "20px 20px 24px" }}>
          <p style={{ fontSize: 12, color: T.text30, lineHeight: 1.6, marginBottom: 20 }}>
            Where Aegis sits in the AI agent infrastructure. Each layer depends on the layers below it.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STACK_LAYERS.map((layer, i) => (
              <div key={layer.name}>
                {/* Connecting line */}
                {i > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", height: 18 }}>
                    <div style={{
                      width: 1,
                      height: "100%",
                      borderLeft: `2px dotted ${T.text20}`,
                    }} />
                  </div>
                )}
                {/* Layer card */}
                <div style={{
                  background: layer.highlight ? `${T.positive}08` : T.white3,
                  border: `1px solid ${layer.highlight ? `${T.positive}30` : T.border}`,
                  borderLeft: layer.highlight ? `3px solid ${T.positive}` : `3px solid ${T.border}`,
                  borderRadius: 6,
                  padding: "16px 20px",
                  position: "relative" as const,
                }}>
                  {/* YOU ARE HERE badge */}
                  {layer.highlight && (
                    <div style={{
                      position: "absolute" as const,
                      top: -10,
                      right: 16,
                      background: T.positive,
                      color: "#000",
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: "0.02em",
                      padding: "3px 10px",
                      borderRadius: 10,
                    }}>
                      YOU ARE HERE
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontSize: 9,
                          fontWeight: 500,
                          color: T.text20,
                          letterSpacing: "0.02em",
                          background: T.white4,
                          padding: "2px 6px",
                          borderRadius: 3,
                        }}>
                          L{i + 1}
                        </span>
                        <span style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: layer.highlight ? T.positive : T.text80,
                        }}>
                          {layer.name}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: T.text30, marginTop: 3, lineHeight: 1.5 }}>
                        {layer.desc}
                      </div>
                    </div>
                  </div>

                  {/* Technology badges */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                    {layer.techs.map(tech => (
                      <span key={tech} style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 3,
                        background: layer.highlight ? `${T.positive}15` : T.white4,
                        color: layer.highlight ? T.positive : T.text50,
                      }}>
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Aegis integration point */}
                  <div style={{
                    fontSize: 11,
                    color: layer.highlight ? T.positive : T.text25,
                    fontWeight: layer.highlight ? 600 : 400,
                    fontStyle: layer.highlight ? undefined : "italic" as const,
                  }}>
                    {layer.integration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Protocol Integrations 2x2 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        marginBottom: 24,
      }}>
        {PROTOCOLS.map(p => (
          <Card key={p.name}>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 500, color: T.text80 }}>{p.name}</span>
                <StatusBadge status={p.status} color={p.statusColor} />
              </div>
              <p style={{ fontSize: 12, color: T.text30, lineHeight: 1.6, marginBottom: 10 }}>
                {p.desc}
              </p>
              <div style={{
                display: "inline-block",
                fontSize: 13,
                fontWeight: 500,
                color: T.positive,
                fontVariantNumeric: "tabular-nums",
                marginBottom: 10,
              }}>
                {p.metric}
              </div>
              <p style={{ fontSize: 11, color: T.text25, lineHeight: 1.5 }}>
                {p.detail}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Partner Ecosystem */}
      <Card>
        <CardHead label="Partner Ecosystem" action={
          <span style={{ fontSize: 11, color: T.text30 }}>{PARTNERS.length} integrations</span>
        } />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Platform", "Integration Type", "Status"].map((h, i) => (
                  <th key={h} style={{
                    ...LABEL,
                    textAlign: i === 0 ? "left" : i === 2 ? "center" : "right",
                    padding: "10px 16px",
                    borderBottom: `1px solid ${T.border}`,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PARTNERS.map((p, pi) => (
                <tr key={p.name} style={{
                  borderBottom: pi < PARTNERS.length - 1 ? `1px solid ${T.border}` : undefined,
                }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: T.text80 }}>
                    {p.name}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: T.text50, textAlign: "right" }}>
                    {p.type}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <StatusBadge
                      status={p.status}
                      color={
                        p.status === "Integrated" ? "green" :
                        p.status === "Compatible" ? "blue" :
                        p.status === "Engaging" ? "amber" : "gray"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
