import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import {
  Card,
  CardHead,
  PageHeader,
  StatTile,
  StatusBadge,
  TabBar,
  ActionButton,
  MonoValue,
  MiniTable,
} from "./primitives";

/* ── Demo Chains ─────────────────────────────────────────────────────── */

interface ChainStep {
  operator: string;
  status: "complete" | "active" | "pending";
  cost: string;
}

interface DelegationChain {
  name: string;
  created: string;
  totalCost: string;
  totalTime: string;
  overallStatus: string;
  currentStep: number;
  steps: ChainStep[];
}

const CHAINS: DelegationChain[] = [
  {
    name: "Document Intelligence Pipeline",
    created: "Mar 27, 2026 09:14",
    totalCost: "$0.0201",
    totalTime: "1,605ms",
    overallStatus: "Active",
    currentStep: 3,
    steps: [
      { operator: "pdf-extract-pro", status: "complete", cost: "$0.0034" },
      { operator: "entity-extract", status: "complete", cost: "$0.0021" },
      { operator: "aegis-translate-es", status: "complete", cost: "$0.0089" },
      { operator: "text-summarize", status: "active", cost: "$0.0012" },
      { operator: "chart-gen-v4", status: "pending", cost: "$0.0045" },
    ],
  },
  {
    name: "Code Review & Optimization",
    created: "Mar 27, 2026 08:42",
    totalCost: "$0.0149",
    totalTime: "882ms",
    overallStatus: "Active",
    currentStep: 2,
    steps: [
      { operator: "gpt4-code-review", status: "complete", cost: "$0.0067" },
      { operator: "sql-optimize", status: "complete", cost: "$0.0023" },
      { operator: "api-test-suite", status: "active", cost: "$0.0041" },
      { operator: "a11y-audit", status: "pending", cost: "$0.0018" },
    ],
  },
  {
    name: "Content Generation Pipeline",
    created: "Mar 27, 2026 08:15",
    totalCost: "$0.0244",
    totalTime: "5,147ms",
    overallStatus: "Active",
    currentStep: 2,
    steps: [
      { operator: "sentiment-v3", status: "complete", cost: "$0.0008" },
      { operator: "text-summarize", status: "complete", cost: "$0.0031" },
      { operator: "stable-diff-gen", status: "active", cost: "$0.0120" },
      { operator: "voice-clone-v2", status: "pending", cost: "$0.0085" },
    ],
  },
  {
    name: "Financial Analysis Chain",
    created: "Mar 27, 2026 07:51",
    totalCost: "$0.0183",
    totalTime: "743ms",
    overallStatus: "Complete",
    currentStep: 2,
    steps: [
      { operator: "market-data-feed", status: "complete", cost: "$0.0045" },
      { operator: "risk-analyzer", status: "complete", cost: "$0.0078" },
      { operator: "report-gen-v2", status: "complete", cost: "$0.0060" },
    ],
  },
];

/* ── Pipeline Builder Steps ──────────────────────────────────────────── */

const BUILDER_OPERATORS = [
  "pdf-extract-pro", "entity-extract", "text-summarize", "aegis-translate-es",
  "chart-gen-v4", "gpt4-code-review", "sql-optimize", "api-test-suite",
  "sentiment-v3", "stable-diff-gen", "voice-clone-v2", "market-data-feed",
  "risk-analyzer", "report-gen-v2", "a11y-audit",
];

/* ── Receipts ────────────────────────────────────────────────────────── */

const RECEIPTS = [
  { id: "rcpt-7a3f", chain: "Document Intelligence", step: "Step 1", amount: "$0.0034", time: "09:14:02", tx: "5xKm...9dFw" },
  { id: "rcpt-8b4e", chain: "Document Intelligence", step: "Step 2", amount: "$0.0021", time: "09:14:32", tx: "3nRp...2vHa" },
  { id: "rcpt-9c5d", chain: "Document Intelligence", step: "Step 3", amount: "$0.0089", time: "09:14:95", tx: "8fYq...4mLe" },
  { id: "rcpt-1d6c", chain: "Code Review", step: "Step 1", amount: "$0.0067", time: "08:42:14", tx: "2hBt...7xNc" },
  { id: "rcpt-2e7b", chain: "Code Review", step: "Step 2", amount: "$0.0023", time: "08:42:35", tx: "9jDv...1pSf" },
  { id: "rcpt-3f8a", chain: "Content Generation", step: "Step 1", amount: "$0.0008", time: "08:15:07", tx: "4kFw...6qTg" },
  { id: "rcpt-4g9z", chain: "Content Generation", step: "Step 2", amount: "$0.0031", time: "08:15:35", tx: "7mHy...3sVi" },
  { id: "rcpt-5h0y", chain: "Financial Analysis", step: "Step 1", amount: "$0.0045", time: "07:51:12", tx: "1nJa...8uXk" },
  { id: "rcpt-6i1x", chain: "Financial Analysis", step: "Step 2", amount: "$0.0078", time: "07:51:45", tx: "6pLc...0wZm" },
  { id: "rcpt-7j2w", chain: "Financial Analysis", step: "Step 3", amount: "$0.0060", time: "07:52:18", tx: "0rNe...5yBo" },
];

/* ── Styles ──────────────────────────────────────────────────────────── */

const LABEL: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.02em",
  fontWeight: 500,
  color: T.text20,
};

const STATUS_DOT_COLORS: Record<string, string> = {
  complete: T.positive,
  active: T.text50,
  pending: T.text25,
};

/* ── Component ───────────────────────────────────────────────────────── */

export default function DelegationPanel() {
  const realOps = trpc.operator.list.useQuery({ limit: 20, sortBy: "trust" }, { staleTime: 60_000 });
  const operatorOptions = useMemo(() => {
    const real = (realOps.data?.items || []).map((op: any) => op.slug || op.name);
    const combined = [...new Set([...real, ...BUILDER_OPERATORS])];
    return combined.length > 0 ? combined : BUILDER_OPERATORS;
  }, [realOps.data]);

  const [tab, setTab] = useState<"active" | "builder" | "receipts">("active");
  const [builderSteps, setBuilderSteps] = useState<string[]>(["pdf-extract-pro", "text-summarize"]);

  const addStep = () => {
    const available = operatorOptions.filter(o => !builderSteps.includes(o));
    if (available.length > 0) {
      setBuilderSteps([...builderSteps, available[0]]);
    }
  };

  const removeStep = (idx: number) => {
    setBuilderSteps(builderSteps.filter((_, i) => i !== idx));
  };

  const estimateCost = (op: string) => {
    const costs: Record<string, number> = {
      "pdf-extract-pro": 0.0034, "entity-extract": 0.0021, "text-summarize": 0.0012,
      "aegis-translate-es": 0.0089, "chart-gen-v4": 0.0045, "gpt4-code-review": 0.0067,
      "sql-optimize": 0.0023, "api-test-suite": 0.0041, "sentiment-v3": 0.0008,
      "stable-diff-gen": 0.012, "voice-clone-v2": 0.0085, "market-data-feed": 0.0045,
      "risk-analyzer": 0.0078, "report-gen-v2": 0.006, "a11y-audit": 0.0018,
    };
    return costs[op] ?? 0.003;
  };

  const totalBuilderCost = builderSteps.reduce((s, op) => s + estimateCost(op), 0);

  return (
    <div>
      <PageHeader
        title="Delegation Chains"
        subtitle="Multi-step pipeline orchestration with atomic settlement"
      />

      {/* Stats row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        marginBottom: 24,
      }}>
        <StatTile label="Active Chains" value="8" delta="+3 today" deltaPositive />
        <StatTile label="Steps Completed" value="347" delta="+41 last hour" deltaPositive accent={T.text50} />
        <StatTile label="Avg Chain Length" value="4.2 steps" sub="across all chains" accent={T.text30} />
        <StatTile label="Settlement Rate" value="99.7%" delta="+0.1%" deltaPositive accent={T.positive} />
      </div>

      {/* TabBar */}
      <TabBar
        tabs={[
          { id: "active" as const, label: "Active Chains" },
          { id: "builder" as const, label: "Pipeline Builder" },
          { id: "receipts" as const, label: "Receipts" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* Active Chains tab */}
      {tab === "active" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {CHAINS.map(chain => (
            <Card key={chain.name}>
              <div style={{ padding: "18px 20px" }}>
                {/* Chain header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: T.text80 }}>{chain.name}</span>
                  <StatusBadge
                    status={chain.overallStatus}
                    color={chain.overallStatus === "Complete" ? "green" : "amber"}
                  />
                </div>
                <div style={{ fontSize: 11, color: T.text25, marginBottom: 16 }}>
                  Created {chain.created}
                </div>

                {/* Pipeline visualization. horizontal chain */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  overflowX: "auto",
                  padding: "12px 0",
                  marginBottom: 16,
                }}>
                  {chain.steps.map((step, si) => (
                    <div key={si} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                      {/* Step node */}
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        minWidth: 120,
                      }}>
                        {/* Status dot */}
                        <div style={{
                          width: si === chain.currentStep ? 16 : 12,
                          height: si === chain.currentStep ? 16 : 12,
                          borderRadius: "50%",
                          background: STATUS_DOT_COLORS[step.status],
                          boxShadow: step.status === "active" ? `0 0 8px ${T.text50}60` : undefined,
                          border: si === chain.currentStep ? `2px solid ${T.bg}` : undefined,
                          outline: si === chain.currentStep ? `2px solid ${STATUS_DOT_COLORS[step.status]}` : undefined,
                          transition: "all 0.3s",
                        }} />
                        {/* Operator name */}
                        <div style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: step.status === "pending" ? T.text25 : T.text50,
                          fontFamily: "'JetBrains Mono', monospace",
                          textAlign: "center" as const,
                          maxWidth: 110,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap" as const,
                        }}>
                          {step.operator}
                        </div>
                        {/* Cost */}
                        <div style={{
                          fontSize: 10,
                          color: step.status === "complete" ? T.positive : T.text25,
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 600,
                        }}>
                          {step.cost}
                        </div>
                      </div>
                      {/* Connecting arrow */}
                      {si < chain.steps.length - 1 && (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          width: 40,
                          flexShrink: 0,
                          marginTop: -22,
                        }}>
                          <div style={{
                            flex: 1,
                            height: 2,
                            background: chain.steps[si + 1].status === "pending"
                              ? `${T.text20}`
                              : T.borderSubtle,
                          }} />
                          <div style={{
                            width: 0,
                            height: 0,
                            borderTop: "4px solid transparent",
                            borderBottom: "4px solid transparent",
                            borderLeft: `6px solid ${STATUS_DOT_COLORS[chain.steps[si + 1].status]}`,
                          }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Chain summary */}
                <div style={{
                  display: "flex",
                  gap: 24,
                  padding: "10px 14px",
                  background: T.white3,
                  borderRadius: 6,
                  border: `1px solid ${T.border}`,
                }}>
                  <div>
                    <span style={{ ...LABEL }}>Total Cost</span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.positive, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                      {chain.totalCost}
                    </div>
                  </div>
                  <div>
                    <span style={{ ...LABEL }}>Total Time</span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text50, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                      {chain.totalTime}
                    </div>
                  </div>
                  <div>
                    <span style={{ ...LABEL }}>Steps</span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text50, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                      {chain.steps.filter(s => s.status === "complete").length}/{chain.steps.length} complete
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pipeline Builder tab */}
      {tab === "builder" && (
        <Card>
          <CardHead label="Pipeline Builder" action={
            <span style={{ fontSize: 11, color: T.text30 }}>
              {builderSteps.length} steps
            </span>
          } />
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {builderSteps.map((op, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: T.white3,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                }}>
                  {/* Step number */}
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: T.white6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 500,
                    color: T.text50,
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>

                  {/* Operator selector */}
                  <select
                    value={op}
                    onChange={(e) => {
                      const updated = [...builderSteps];
                      updated[i] = e.target.value;
                      setBuilderSteps(updated);
                    }}
                    style={{
                      flex: 1,
                      background: T.white4,
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 12,
                      color: T.text80,
                      outline: "none",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {operatorOptions.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>

                  {/* Estimated cost */}
                  <MonoValue color={T.positive}>
                    <span style={{ fontSize: 11 }}>${estimateCost(op).toFixed(4)}</span>
                  </MonoValue>

                  {/* Remove button */}
                  <button
                    onClick={() => removeStep(i)}
                    style={{
                      background: "transparent",
                      border: `1px solid ${T.border}`,
                      borderRadius: 4,
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: T.text30,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>

            {/* Add step button */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button
                onClick={addStep}
                style={{
                  background: "transparent",
                  border: `1px dashed ${T.border}`,
                  borderRadius: 6,
                  padding: "10px 20px",
                  cursor: "pointer",
                  color: T.text30,
                  fontSize: 12,
                  fontWeight: 600,
                  width: "100%",
                  transition: "border-color 0.15s",
                }}
              >
                + Add Step
              </button>
            </div>

            {/* Cost calculator */}
            <div style={{
              padding: "14px 16px",
              background: T.white3,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}>
              <div>
                <div style={{ ...LABEL, marginBottom: 4 }}>Estimated Cost Per Run</div>
                <div style={{ fontSize: 22, fontWeight: 400, color: T.positive, fontVariantNumeric: "tabular-nums" }}>
                  ${totalBuilderCost.toFixed(4)}
                </div>
              </div>
              <div style={{ textAlign: "right" as const }}>
                <div style={{ ...LABEL, marginBottom: 4 }}>Steps</div>
                <div style={{ fontSize: 22, fontWeight: 400, color: T.text50, fontVariantNumeric: "tabular-nums" }}>
                  {builderSteps.length}
                </div>
              </div>
            </div>

            <ActionButton label="Deploy Chain" variant="primary" />
          </div>
        </Card>
      )}

      {/* Receipts tab */}
      {tab === "receipts" && (
        <Card>
          <CardHead label="cNFT Receipts" action={
            <span style={{ fontSize: 11, color: T.text30 }}>
              {RECEIPTS.length} receipts
            </span>
          } />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Receipt ID", "Chain", "Step", "Amount", "Time", "Tx"].map((h, i) => (
                    <th key={h} style={{
                      ...LABEL,
                      textAlign: i === 0 ? "left" : "right",
                      padding: "10px 14px",
                      borderBottom: `1px solid ${T.border}`,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECEIPTS.map((r, ri) => (
                  <tr key={r.id} style={{
                    borderBottom: ri < RECEIPTS.length - 1 ? `1px solid ${T.border}` : undefined,
                  }}>
                    <td style={{
                      padding: "10px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: T.text50,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {r.id}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: T.text50, textAlign: "right" }}>
                      {r.chain}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: T.text30, textAlign: "right" }}>
                      {r.step}
                    </td>
                    <td style={{
                      padding: "10px 14px",
                      fontSize: 12,
                      color: T.positive,
                      textAlign: "right",
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {r.amount}
                    </td>
                    <td style={{
                      padding: "10px 14px",
                      fontSize: 11,
                      color: T.text30,
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {r.time}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <span style={{
                        fontSize: 11,
                        color: T.text50,
                        fontFamily: "'JetBrains Mono', monospace",
                        cursor: "pointer",
                      }}>
                        {r.tx}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
