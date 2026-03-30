import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import {
  Card,
  CardHead,
  PageHeader,
  StatTile,
  StatusBadge,
  ProgressBar,
  MonoValue,
  MiniTable,
} from "./primitives";

/* ── Planned-feature display data (not yet backed by real queries) ──── */

const PLANNED_BADGE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: "0.08em",
  color: T.text25,
  background: T.white4,
  padding: "2px 7px",
  borderRadius: 3,
  marginLeft: 8,
  verticalAlign: "middle",
};

const EVALUATOR_DATA = {
  title: "NeMo Evaluator",
  desc: "Automated benchmarking that tests AI models against real metrics every 6 hours.",
  benchmarks: [
    { operator: "GPT-4o Router", accuracy: "94.2%", latency: "89ms", safety: "98.7%" },
    { operator: "Claude Analyst", accuracy: "96.1%", latency: "142ms", safety: "99.2%" },
    { operator: "Mistral Coder", accuracy: "91.8%", latency: "67ms", safety: "97.4%" },
    { operator: "Llama Guard", accuracy: "88.5%", latency: "203ms", safety: "99.8%" },
    { operator: "DeepSeek Math", accuracy: "97.3%", latency: "118ms", safety: "96.1%" },
  ],
};

const NIM_DATA = {
  title: "NIM Containers",
  desc: "Pre-optimized containers that run AI models on GPUs with maximum efficiency. Up to 4x inference speedup.",
  containers: [
    { name: "nim-gpt4o-prod", model: "GPT-4o", gpu: "H100", status: "Active" },
    { name: "nim-claude-v3", model: "Claude 3.5", gpu: "A100 80GB", status: "Active" },
    { name: "nim-mistral-lg", model: "Mistral Large", gpu: "A100 40GB", status: "Active" },
    { name: "nim-llama-guard", model: "Llama Guard 3", gpu: "L40S", status: "Active" },
    { name: "nim-nemotron-s", model: "Nemotron Super", gpu: "H100", status: "Scaling" },
    { name: "nim-whisper-xl", model: "Whisper XL", gpu: "RTX 4090", status: "Pending" },
  ],
};

const NEMOTRON_DATA = {
  title: "Nemotron Models",
  desc: "NVIDIA's open-weight foundation models. Hybrid latent mixture-of-experts architecture.",
  tiers: [
    { tier: "Nano", params: "8B", useCase: "Lightweight edge inference, parsing, formatting", deployments: 487, color: T.text50 },
    { tier: "Super", params: "49B", useCase: "Complex reasoning, code review, RAG, analysis", deployments: 312, color: T.text30 },
    { tier: "Ultra", params: "253B", useCase: "Maximum capability, multi-agent workflows", deployments: 89, color: T.text50 },
  ],
};

/* ── Curator Pipelines (planned) ──────────────────────────────────── */

const PIPELINES = [
  { name: "Medical Dataset v3", records: "2.4M / 3.1M", quality: 94, pct: 77 },
  { name: "Legal Corpus Clean", records: "890K / 1.2M", quality: 91, pct: 74 },
  { name: "Code Review Pairs", records: "1.1M / 1.1M", quality: 97, pct: 100 },
];

/* ── Helpers ──────────────────────────────────────────────────────── */

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function timeAgo(ts: string | Date): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/* ── Styles ──────────────────────────────────────────────────────── */

const LABEL: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.02em",
  fontWeight: 500,
  color: T.text20,
};

/* ── Component ───────────────────────────────────────────────────── */

export default function NvidiaPanel() {
  const guardrailStats = trpc.operator.guardrailStats.useQuery(undefined, { staleTime: 60_000 });
  const violationTypes = trpc.operator.guardrailViolationTypes.useQuery(undefined, { staleTime: 60_000 });
  const recentViolations = trpc.operator.guardrailViolations.useQuery({ limit: 10 }, { staleTime: 30_000 });

  const gs = guardrailStats.data;
  const vTypes = violationTypes.data ?? [];
  const violations = recentViolations.data ?? [];

  // Compute input vs output violation split from real stats
  const inputFail = gs?.inputFailCount ?? 0;
  const outputFail = gs?.outputFailCount ?? 0;
  const totalFails = inputFail + outputFail;
  const inputPct = totalFails > 0 ? Math.round((inputFail / totalFails) * 100) : 50;
  const outputPct = totalFails > 0 ? 100 - inputPct : 50;

  // Compute overall pass rate from input + output
  const overallPassRate = gs
    ? Math.round(((gs.inputPassRate + gs.outputPassRate) / 2) * 100) / 100
    : null;

  return (
    <div>
      <PageHeader
        title="NVIDIA Stack"
        subtitle="NeMo Guardrails, Evaluator, NIM, and Nemotron integration"
      />

      {/* Guardrails status indicator */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
        padding: "8px 14px",
        background: T.white3,
        border: `1px solid ${T.border}`,
        borderRadius: 6,
        width: "fit-content",
      }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: gs?.guardrailsEnabled ? T.mint : "rgba(245,158,11,0.6)",
          display: "inline-block",
          boxShadow: gs?.guardrailsEnabled
            ? `0 0 6px ${T.mint}`
            : "0 0 6px rgba(245,158,11,0.4)",
        }} />
        <span style={{ fontSize: 12, fontWeight: 500, color: T.text50 }}>
          NeMo Guardrails: {gs?.guardrailsEnabled ? "Active" : "Standby"}
        </span>
        {gs && (
          <span style={{ fontSize: 11, color: T.text25, marginLeft: 8 }}>
            avg {gs.avgLatencyMs}ms latency
          </span>
        )}
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        marginBottom: 24,
      }}>
        <StatTile
          label="Guardrail Checks"
          value={gs ? formatCount(gs.totalChecked) : "--"}
          delta="total"
          deltaPositive
        />
        <StatTile
          label="Pass Rate"
          value={overallPassRate !== null ? `${overallPassRate}%` : "--"}
          delta={gs ? `input: ${gs.inputPassRate}% / output: ${gs.outputPassRate}%` : ""}
          deltaPositive
          accent={T.positive}
        />
        <StatTile
          label="Operators Protected"
          value={gs ? gs.operatorsProtected.toLocaleString() : "--"}
          delta="with guardrails"
          deltaPositive
        />
        <StatTile
          label="Violation Rate"
          value={gs ? `${gs.violationRate}%` : "--"}
          delta={totalFails > 0 ? `${totalFails.toLocaleString()} total` : ""}
          accent={T.text50}
        />
      </div>

      {/* NeMo Components 2x2 grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Guardrails card. live data */}
        <Card>
          <CardHead label="NeMo Guardrails" />
          <div style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: 12, color: T.text30, lineHeight: 1.6, marginBottom: 16 }}>
              Programmable safety rules that screen every AI interaction. Input, output, dialog, and retrieval rails.
            </p>
            <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
              <div>
                <div style={{ ...LABEL, marginBottom: 4 }}>Operators Protected</div>
                <div style={{ fontSize: 20, fontWeight: 400, color: T.text80, fontVariantNumeric: "tabular-nums" }}>
                  {gs ? gs.operatorsProtected.toLocaleString() : "--"}
                </div>
              </div>
              <div>
                <div style={{ ...LABEL, marginBottom: 4 }}>Violation Rate</div>
                <div style={{ fontSize: 20, fontWeight: 400, color: T.text50, fontVariantNumeric: "tabular-nums" }}>
                  {gs ? `${gs.violationRate}%` : "--"}
                </div>
              </div>
            </div>
            <div style={{ ...LABEL, marginBottom: 8 }}>Top Violation Types</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {vTypes.length > 0 ? vTypes.map(v => (
                <span key={v.type} style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 4,
                  background: T.white4,
                  color: T.text50,
                }}>
                  {v.type} ({v.count})
                </span>
              )) : (
                <span style={{ fontSize: 11, color: T.text25 }}>No violations recorded</span>
              )}
            </div>
          </div>
        </Card>

        {/* Evaluator card. planned */}
        <Card>
          <CardHead label={<>{EVALUATOR_DATA.title}<span style={PLANNED_BADGE}>PLANNED</span></>} />
          <div style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: 12, color: T.text30, lineHeight: 1.6, marginBottom: 12 }}>
              {EVALUATOR_DATA.desc}
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Operator", "Accuracy", "Latency", "Safety"].map((h, i) => (
                      <th key={h} style={{
                        ...LABEL,
                        textAlign: i === 0 ? "left" : "right",
                        padding: "6px 8px",
                        borderBottom: `1px solid ${T.border}`,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EVALUATOR_DATA.benchmarks.map((b, ri) => (
                    <tr key={b.operator} style={{
                      borderBottom: ri < EVALUATOR_DATA.benchmarks.length - 1 ? `1px solid ${T.border}` : undefined,
                    }}>
                      <td style={{ padding: "8px 8px", fontSize: 12, fontWeight: 600, color: T.text50 }}>{b.operator}</td>
                      <td style={{ padding: "8px 8px", fontSize: 12, color: T.positive, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{b.accuracy}</td>
                      <td style={{ padding: "8px 8px", fontSize: 12, color: T.text50, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{b.latency}</td>
                      <td style={{ padding: "8px 8px", fontSize: 12, color: T.text50, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{b.safety}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* NIM Containers card. planned */}
        <Card>
          <CardHead label={<>{NIM_DATA.title}<span style={PLANNED_BADGE}>PLANNED</span></>} />
          <div style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: 12, color: T.text30, lineHeight: 1.6, marginBottom: 12 }}>
              {NIM_DATA.desc}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {NIM_DATA.containers.map((c, ci) => (
                <div key={c.name} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: ci < NIM_DATA.containers.length - 1 ? `1px solid ${T.border}` : undefined,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text50, fontFamily: "'JetBrains Mono', monospace" }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 10, color: T.text25, marginTop: 1 }}>
                      {c.model} on {c.gpu}
                    </div>
                  </div>
                  <StatusBadge
                    status={c.status}
                    color={c.status === "Active" ? "green" : c.status === "Scaling" ? "amber" : "gray"}
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Nemotron Models card. planned */}
        <Card>
          <CardHead label={<>{NEMOTRON_DATA.title}<span style={PLANNED_BADGE}>PLANNED</span></>} />
          <div style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: 12, color: T.text30, lineHeight: 1.6, marginBottom: 16 }}>
              {NEMOTRON_DATA.desc}
            </p>
            {NEMOTRON_DATA.tiers.map((t, ti) => (
              <div key={t.tier} style={{
                padding: "12px 14px",
                background: T.white3,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                marginBottom: ti < NEMOTRON_DATA.tiers.length - 1 ? 8 : 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: t.color,
                    }}>
                      {t.tier}
                    </span>
                    <span style={{ fontSize: 11, color: T.text30, fontVariantNumeric: "tabular-nums" }}>
                      {t.params} params
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: T.text50, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {t.deployments} deployments
                  </span>
                </div>
                <div style={{ fontSize: 11, color: T.text30, lineHeight: 1.5 }}>
                  {t.useCase}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Guardrail Dashboard. live data */}
      <Card style={{ marginBottom: 24 }}>
        <CardHead label="Guardrail Dashboard" action={
          <span style={{ fontSize: 11, color: T.text30 }}>Recent violations</span>
        } />
        <div style={{ padding: "16px 20px" }}>
          {/* Violations table */}
          <div style={{ ...LABEL, marginBottom: 10 }}>Recent Violations</div>
          <div style={{ overflowX: "auto", marginBottom: 24 }}>
            {violations.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Operator", "Type", "Violations", "Time"].map((h, i) => (
                      <th key={h} style={{
                        ...LABEL,
                        textAlign: i === 0 ? "left" : "right",
                        padding: "8px 12px",
                        borderBottom: `1px solid ${T.border}`,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v, vi) => (
                    <tr key={vi} style={{
                      borderBottom: vi < violations.length - 1 ? `1px solid ${T.border}` : undefined,
                    }}>
                      <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 600, color: T.text50 }}>
                        {v.operatorName}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: T.text50, textAlign: "right" }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: v.type === "input" ? T.text50 : T.text30,
                          background: T.white4,
                          padding: "2px 7px",
                          borderRadius: 3,
                        }}>
                          {v.type}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 11, color: T.text30, textAlign: "right" }}>
                        {v.violations.length > 0 ? v.violations.join(", ") : "--"}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 11, color: T.text25, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {timeAgo(v.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ fontSize: 12, color: T.text25, padding: "16px 0" }}>
                No guardrail violations recorded yet.
              </div>
            )}
          </div>

          {/* Violation Breakdown. computed from real stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            <div>
              <div style={{ ...LABEL, marginBottom: 12 }}>Input vs Output Violations</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: T.text50 }}>Input Violations</span>
                  <MonoValue color={T.text50}>
                    <span style={{ fontSize: 11 }}>
                      {totalFails > 0 ? `${inputPct}%` : "--"} {inputFail > 0 && <span style={{ color: T.text25 }}>({inputFail})</span>}
                    </span>
                  </MonoValue>
                </div>
                <div style={{ height: 8, background: T.white4, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${inputPct}%`, background: T.text50, borderRadius: 4 }} />
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: T.text50 }}>Output Violations</span>
                  <MonoValue color={T.text50}>
                    <span style={{ fontSize: 11 }}>
                      {totalFails > 0 ? `${outputPct}%` : "--"} {outputFail > 0 && <span style={{ color: T.text25 }}>({outputFail})</span>}
                    </span>
                  </MonoValue>
                </div>
                <div style={{ height: 8, background: T.white4, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${outputPct}%`, background: T.text30, borderRadius: 4 }} />
                </div>
              </div>
            </div>

            <div>
              <div style={{ ...LABEL, marginBottom: 12 }}>Guardrail Performance</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: T.text30 }}>Avg Latency</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text50, fontVariantNumeric: "tabular-nums" }}>
                    {gs ? `${gs.avgLatencyMs}ms` : "--"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: T.text30 }}>Input Pass Rate</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.positive, fontVariantNumeric: "tabular-nums" }}>
                    {gs ? `${gs.inputPassRate}%` : "--"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: T.text30 }}>Output Pass Rate</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.positive, fontVariantNumeric: "tabular-nums" }}>
                    {gs ? `${gs.outputPassRate}%` : "--"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: T.text30 }}>Total Checks</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text50, fontVariantNumeric: "tabular-nums" }}>
                    {gs ? gs.totalChecked.toLocaleString() : "--"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* NeMo Curator. planned */}
      <Card>
        <CardHead label={<>NeMo Curator. Data Pipelines<span style={PLANNED_BADGE}>PLANNED</span></>} action={
          <span style={{ fontSize: 11, color: T.text30 }}>3 active</span>
        } />
        <div style={{ padding: "16px 20px" }}>
          <p style={{ fontSize: 12, color: T.text30, lineHeight: 1.6, marginBottom: 16 }}>
            GPU-accelerated data processing for preparing training data. Heuristic filtering, ML-based quality classification, deduplication, and PII removal.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PIPELINES.map(p => (
              <div key={p.name} style={{
                padding: "14px 16px",
                background: T.white3,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text50 }}>{p.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 11, color: T.text30, fontVariantNumeric: "tabular-nums" }}>
                      {p.records} records
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: p.quality >= 95 ? T.positive : T.text50,
                      background: p.quality >= 95 ? `${T.positive}15` : `${T.text50}15`,
                      padding: "2px 8px",
                      borderRadius: 10,
                    }}>
                      Q: {p.quality}%
                    </span>
                  </div>
                </div>
                <ProgressBar
                  value={p.pct}
                  color={p.pct === 100 ? T.positive : T.text50}
                />
                {p.pct === 100 && (
                  <div style={{ fontSize: 10, color: T.positive, fontWeight: 600, marginTop: 4 }}>
                    COMPLETE
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
