import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import {
  Card,
  CardHead,
  PageHeader,
  StatTile,
  StatusBadge,
  ProgressBar,
  MiniTable,
  MonoValue,
  ActionButton,
} from "./primitives";

/* ── GPU Supply Chain Layers ─────────────────────────────────────────── */

const GPU_LAYERS = [
  { name: "Silicon", desc: "NVIDIA H100/A100 dies", metric: "4,096 dies", icon: "◆" },
  { name: "Board", desc: "SXM5 modules", metric: "2,847 modules", icon: "▣" },
  { name: "Server", desc: "HGX platforms", metric: "712 servers", icon: "▦" },
  { name: "Cluster", desc: "GPU pods", metric: "89 pods", icon: "⬡" },
  { name: "Orchestration", desc: "Kubernetes schedulers", metric: "24 clusters", icon: "⎈" },
  { name: "Container", desc: "NIM containers", metric: "412 active", icon: "▢" },
  { name: "Model", desc: "Nemotron models", metric: "3 tiers", icon: "◇" },
  { name: "Agent", desc: "Aegis operators", metric: "1,247 registered", icon: "●" },
];

/* ── Available Compute ───────────────────────────────────────────────── */

const GPU_TABLE = [
  { type: "H100 80GB", count: "1,024", price: "$3.85", avail: 94, location: "US-East" },
  { type: "A100 80GB", count: "847", price: "$2.10", avail: 87, location: "EU-West" },
  { type: "A100 40GB", count: "512", price: "$1.45", avail: 91, location: "US-West" },
  { type: "L40S", count: "298", price: "$1.20", avail: 78, location: "AP-South" },
  { type: "RTX 4090", count: "166", price: "$0.74", avail: 65, location: "US-Central" },
];

/* ── Register GPU form options ───────────────────────────────────────── */

const GPU_TYPES = ["H100 80GB", "A100 80GB", "A100 40GB", "L40S", "RTX 4090", "RTX 3090"];
const REGIONS = ["US-East", "US-West", "US-Central", "EU-West", "EU-North", "AP-South", "AP-East"];

/* ── Styles ──────────────────────────────────────────────────────────── */

const LABEL: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.02em",
  fontWeight: 500,
  color: T.text20,
};

const SELECT_STYLE: React.CSSProperties = {
  background: T.white4,
  border: `1px solid ${T.border}`,
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 12,
  color: T.text80,
  outline: "none",
  width: "100%",
  appearance: "none" as const,
};

const INPUT_STYLE: React.CSSProperties = {
  background: T.white4,
  border: `1px solid ${T.border}`,
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 12,
  color: T.text80,
  outline: "none",
  width: "100%",
  fontVariantNumeric: "tabular-nums",
};

/* ── Component ───────────────────────────────────────────────────────── */

export default function ComputePanel() {
  const stats = trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Compute Infrastructure"
        subtitle="GPU supply chain and NIM deployment"
      />

      {/* Stats row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        marginBottom: 24,
      }}>
        <StatTile label="Available GPUs" value="2,847" delta="+124 this week" deltaPositive />
        <StatTile label="Active Deployments" value="412" delta="+18 today" deltaPositive accent={T.text50} />
        <StatTile label="Avg Cost/Hour" value="$2.14" delta="-$0.12 vs last week" deltaPositive accent={T.text50} />
        <StatTile label="Network Utilization" value="76.3%" delta="+3.1%" deltaPositive accent={T.text30} />
      </div>

      {/* GPU Supply Chain Visualization */}
      <Card style={{ marginBottom: 24 }}>
        <CardHead label="GPU Supply Chain. 8 Layers" />
        <div style={{ padding: "20px 20px 24px" }}>
          <p style={{ fontSize: 12, color: T.text30, marginBottom: 20, lineHeight: 1.6 }}>
            Every layer pays the layer below it. Every creator at every layer earns.
            The entire stack is economically self-sustaining.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {GPU_LAYERS.map((layer, i) => (
              <div key={layer.name}>
                {/* Connecting line */}
                {i > 0 && (
                  <div style={{
                    display: "flex",
                    justifyContent: "center",
                    height: 20,
                  }}>
                    <div style={{
                      width: 1,
                      height: "100%",
                      borderLeft: `2px dashed ${T.positive}30`,
                    }} />
                  </div>
                )}
                {/* Layer card */}
                <div style={{
                  background: T.white3,
                  border: `1px solid ${T.border}`,
                  borderLeft: `3px solid ${T.positive}50`,
                  borderRadius: 6,
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  transition: "background 0.15s",
                }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${T.positive}12`,
                    borderRadius: 6,
                    fontSize: 13,
                    color: T.positive,
                    flexShrink: 0,
                  }}>
                    {layer.icon}
                  </div>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: T.text20,
                    letterSpacing: "0.02em",
                    width: 24,
                    flexShrink: 0,
                  }}>
                    L{i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text80 }}>
                      {layer.name}
                    </div>
                    <div style={{ fontSize: 11, color: T.text30, marginTop: 1 }}>
                      {layer.desc}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: T.positive,
                    fontVariantNumeric: "tabular-nums",
                    flexShrink: 0,
                    textAlign: "right",
                  }}>
                    {layer.name === "Agent" && stats.data
                      ? `${stats.data.totalOperators.toLocaleString()} registered`
                      : layer.metric}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Available Compute Table */}
      <Card style={{ marginBottom: 24 }}>
        <CardHead label="Available Compute" action={
          <span style={{ fontSize: 11, color: T.text30 }}>5 GPU types</span>
        } />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["GPU Type", "Count", "Price/hr", "Availability", "Location"].map((h, i) => (
                  <th key={h} style={{
                    ...LABEL,
                    textAlign: i === 0 ? "left" : "right",
                    padding: "10px 16px",
                    borderBottom: `1px solid ${T.border}`,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GPU_TABLE.map((row, ri) => (
                <tr key={row.type} style={{
                  borderBottom: ri < GPU_TABLE.length - 1 ? `1px solid ${T.border}` : undefined,
                }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: T.text80 }}>
                    {row.type}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.text50, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {row.count}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.positive, textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {row.price}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
                      <div style={{ width: 80 }}>
                        <ProgressBar
                          value={row.avail}
                          color={row.avail > 85 ? T.positive : row.avail > 70 ? T.text50 : T.negative}
                        />
                      </div>
                      <MonoValue color={row.avail > 85 ? T.positive : row.avail > 70 ? T.text50 : T.negative}>
                        <span style={{ fontSize: 12 }}>{row.avail}%</span>
                      </MonoValue>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: T.text30, textAlign: "right" }}>
                    {row.location}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Register GPU Form */}
      <Card>
        <div
          onClick={() => setFormOpen(!formOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            cursor: "pointer",
            borderBottom: formOpen ? `1px solid ${T.border}` : undefined,
          }}
        >
          <span style={{ ...LABEL }}>Register GPU</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={T.text30}
            strokeWidth={2}
            style={{
              transition: "transform 0.2s",
              transform: formOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <path strokeLinecap="square" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div style={{
          maxHeight: formOpen ? 400 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}>
          <div style={{ padding: 20 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}>
              <div>
                <div style={{ ...LABEL, marginBottom: 8 }}>GPU Type</div>
                <select style={SELECT_STYLE}>
                  {GPU_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ ...LABEL, marginBottom: 8 }}>Count</div>
                <input type="number" defaultValue={1} min={1} style={INPUT_STYLE} />
              </div>
              <div>
                <div style={{ ...LABEL, marginBottom: 8 }}>Hourly Rate (USD)</div>
                <input type="number" defaultValue={2.0} step={0.01} min={0.01} style={INPUT_STYLE} />
              </div>
              <div>
                <div style={{ ...LABEL, marginBottom: 8 }}>Region</div>
                <select style={SELECT_STYLE}>
                  {REGIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <ActionButton label="Register GPU" variant="primary" />
          </div>
        </div>
      </Card>
    </div>
  );
}
