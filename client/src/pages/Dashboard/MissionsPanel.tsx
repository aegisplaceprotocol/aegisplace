import React, { useState } from "react";
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
  ProgressBar,
} from "./primitives";

/* ── Shared styles ────────────────────────────────────────────────────── */

const LABEL: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.02em",
  fontWeight: 500,
  color: T.text20,
};

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontVariantNumeric: "tabular-nums",
};

/* ── Demo data ────────────────────────────────────────────────────────── */

type MissionStatus = "Active" | "Completed" | "Failed";

interface PipelineStep {
  name: string;
  operator: string;
  status: "done" | "running" | "failed" | "pending";
  cost: string;
  output?: string;
}

interface Mission {
  id: string;
  name: string;
  description: string;
  status: MissionStatus;
  lastRun: string;
  totalRuns: number;
  avgCost: string;
  steps: PipelineStep[];
}

const MISSIONS: Mission[] = [
  {
    id: "m1",
    name: "Market Alpha Scanner",
    description: "Scans DEX pools for arbitrage opportunities and executes trades via Jupiter",
    status: "Active",
    lastRun: "2 min ago",
    totalRuns: 1847,
    avgCost: "$0.42",
    steps: [
      { name: "Fetch Prices", operator: "Pyth Oracle Reader", status: "done", cost: "$0.003", output: "142 price feeds fetched" },
      { name: "Detect Spreads", operator: "Claude Analyst", status: "done", cost: "$0.12", output: "3 opportunities found" },
      { name: "Risk Check", operator: "Llama Guard", status: "done", cost: "$0.008", output: "All passes" },
      { name: "Execute Trade", operator: "Jupiter Router", status: "running", cost: "$0.28", output: "Pending confirmation..." },
    ],
  },
  {
    id: "m2",
    name: "Sentiment Aggregator",
    description: "Aggregates social sentiment from Twitter, Discord, and Telegram for top 50 tokens",
    status: "Active",
    lastRun: "8 min ago",
    totalRuns: 924,
    avgCost: "$0.18",
    steps: [
      { name: "Scrape Sources", operator: "Web Crawler Pro", status: "done", cost: "$0.04", output: "1,284 posts collected" },
      { name: "Classify Sentiment", operator: "GPT-4o Router", status: "done", cost: "$0.09", output: "Bullish: 62%, Bearish: 21%, Neutral: 17%" },
      { name: "Generate Report", operator: "Claude Analyst", status: "done", cost: "$0.05", output: "Report generated, 2.4k words" },
    ],
  },
  {
    id: "m3",
    name: "Validator Health Monitor",
    description: "Monitors validator uptime, vote accuracy, and alerts on degradation",
    status: "Active",
    lastRun: "1 min ago",
    totalRuns: 4210,
    avgCost: "$0.08",
    steps: [
      { name: "Poll Validators", operator: "RPC Monitor", status: "done", cost: "$0.01", output: "48 validators polled" },
      { name: "Analyze Metrics", operator: "Mistral Coder", status: "done", cost: "$0.04", output: "2 degraded nodes detected" },
      { name: "Alert Router", operator: "Notification Hub", status: "done", cost: "$0.02", output: "Alerts dispatched to 3 channels" },
      { name: "Log to Chain", operator: "Solana Writer", status: "done", cost: "$0.01", output: "TX: 5kJ2...f8mN" },
    ],
  },
  {
    id: "m4",
    name: "NFT Floor Tracker",
    description: "Tracks floor prices across Magic Eden and Tensor, sends alerts on dips > 10%",
    status: "Completed",
    lastRun: "34 min ago",
    totalRuns: 612,
    avgCost: "$0.22",
    steps: [
      { name: "Fetch Listings", operator: "ME API Bridge", status: "done", cost: "$0.02", output: "890 listings fetched" },
      { name: "Price Analysis", operator: "DeepSeek Math", status: "done", cost: "$0.11", output: "Floor delta: -4.2% (no alert)" },
      { name: "Store Results", operator: "DB Writer", status: "done", cost: "$0.01", output: "Written to timeseries DB" },
      { name: "Notify", operator: "Notification Hub", status: "done", cost: "$0.08", output: "Summary sent" },
      { name: "Archive", operator: "IPFS Pinner", status: "done", cost: "$0.003", output: "CID: Qm7x...3kRp" },
    ],
  },
  {
    id: "m5",
    name: "Governance Proposal Analyzer",
    description: "Reads new DAO proposals, summarizes impact, and recommends vote direction",
    status: "Failed",
    lastRun: "1h ago",
    totalRuns: 89,
    avgCost: "$0.56",
    steps: [
      { name: "Fetch Proposals", operator: "Realms Reader", status: "done", cost: "$0.01", output: "3 new proposals" },
      { name: "Deep Analysis", operator: "Claude Analyst", status: "done", cost: "$0.34", output: "Impact analysis complete" },
      { name: "Risk Assessment", operator: "Llama Guard", status: "failed", cost: "$0.00", output: "Error: context window exceeded" },
    ],
  },
  {
    id: "m6",
    name: "Weekly Portfolio Report",
    description: "Generates comprehensive weekly performance report with charts and insights",
    status: "Completed",
    lastRun: "3h ago",
    totalRuns: 52,
    avgCost: "$0.89",
    steps: [
      { name: "Gather Holdings", operator: "Portfolio Scanner", status: "done", cost: "$0.02", output: "34 positions found" },
      { name: "Compute PnL", operator: "DeepSeek Math", status: "done", cost: "$0.15", output: "+14.2% weekly return" },
      { name: "Generate Charts", operator: "DALL-E Renderer", status: "done", cost: "$0.32", output: "6 charts generated" },
      { name: "Write Report", operator: "Claude Analyst", status: "done", cost: "$0.38", output: "4,800 word report" },
      { name: "Distribute", operator: "Email Sender", status: "done", cost: "$0.02", output: "Sent to 3 recipients" },
    ],
  },
];

interface Blueprint {
  id: string;
  name: string;
  description: string;
  category: string;
  stepCount: number;
  avgCost: string;
  timesFork: number;
}

const BLUEPRINTS: Blueprint[] = [
  { id: "b1", name: "DeFi Arbitrage Scanner", description: "Detect and execute cross-DEX arbitrage opportunities with built-in risk controls", category: "Trading", stepCount: 5, avgCost: "$0.38", timesFork: 342 },
  { id: "b2", name: "Alpha Research Pipeline", description: "Multi-source research aggregation with sentiment analysis and signal extraction", category: "Research", stepCount: 4, avgCost: "$0.24", timesFork: 218 },
  { id: "b3", name: "Protocol Health Monitor", description: "Real-time monitoring of protocol metrics with anomaly detection and alerting", category: "Monitoring", stepCount: 4, avgCost: "$0.12", timesFork: 567 },
  { id: "b4", name: "Content Generation Suite", description: "Automated content creation pipeline for threads, newsletters, and reports", category: "Content", stepCount: 3, avgCost: "$0.45", timesFork: 189 },
  { id: "b5", name: "On-Chain Analytics Engine", description: "Deep on-chain data analysis with whale tracking and flow visualization", category: "Analytics", stepCount: 5, avgCost: "$0.31", timesFork: 421 },
  { id: "b6", name: "Smart Contract Auditor", description: "Automated security analysis pipeline for Solana programs with vulnerability scoring", category: "Security", stepCount: 4, avgCost: "$0.67", timesFork: 156 },
];

const AVAILABLE_OPERATORS = [
  "Claude Analyst", "GPT-4o Router", "Mistral Coder", "Llama Guard",
  "DeepSeek Math", "Jupiter Router", "Web Crawler Pro", "Notification Hub",
  "DALL-E Renderer", "Solana Writer", "RPC Monitor", "DB Writer",
];

/* ── Sub-components ───────────────────────────────────────────────────── */

function PipelineViz({ steps, compact }: { steps: PipelineStep[]; compact?: boolean }) {
  const dotColor = (s: PipelineStep["status"]) =>
    s === "done" ? T.positive : s === "running" ? T.text50 : s === "failed" ? T.negative : T.text20;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, overflow: "hidden" }}>
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: compact ? 50 : 80 }}>
            <div style={{
              width: compact ? 10 : 14,
              height: compact ? 10 : 14,
              borderRadius: "50%",
              background: dotColor(step.status),
              boxShadow: step.status === "running" ? `0 0 8px ${T.text50}` : "none",
              transition: "all 0.3s",
            }} />
            {!compact && (
              <>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.text50, marginTop: 6, textAlign: "center", lineHeight: 1.2 }}>
                  {step.name}
                </div>
                <div style={{ fontSize: 9, color: T.text20, marginTop: 2, textAlign: "center" }}>
                  {step.operator}
                </div>
              </>
            )}
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: compact ? "0 0 16px" : "1 1 auto",
              height: 2,
              background: steps[i].status === "done"
                ? T.borderSubtle
                : T.text20,
              marginTop: compact ? 0 : -20,
              minWidth: 12,
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function MissionCard({ mission }: { mission: Mission }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card style={{ marginBottom: 12 }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ padding: "16px 20px", cursor: "pointer", transition: "background 0.15s" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.white3; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: T.text80 }}>{mission.name}</span>
              <StatusBadge status={mission.status} />
            </div>
            <div style={{ fontSize: 12, color: T.text30, lineHeight: 1.4 }}>{mission.description}</div>
          </div>
          <span style={{ fontSize: 18, color: T.text20, marginLeft: 12, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>
            {"\u25BE"}
          </span>
        </div>

        {/* Pipeline visualization */}
        <div style={{ margin: "12px 0" }}>
          <PipelineViz steps={mission.steps} />
        </div>

        {/* Meta row */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            { label: "Last Run", value: mission.lastRun },
            { label: "Total Runs", value: mission.totalRuns.toLocaleString() },
            { label: "Avg Cost", value: mission.avgCost },
          ].map((m) => (
            <div key={m.label}>
              <span style={{ ...LABEL, marginRight: 6 }}>{m.label}</span>
              <span style={{ ...MONO, fontSize: 12, color: T.text50 }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "16px 20px" }}>
          <div style={{ ...LABEL, marginBottom: 12 }}>Step Detail</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {mission.steps.map((step, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "24px 1fr",
                gap: 12,
                alignItems: "center",
                padding: "8px 12px",
                background: T.white3,
                borderRadius: 6,
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: step.status === "done" ? T.positive : step.status === "running" ? T.text50 : step.status === "failed" ? T.negative : T.text20,
                }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text80 }}>{step.name}</div>
                  <div style={{ fontSize: 10, color: T.text30 }}>{step.operator}</div>
                </div>
                <div style={{ fontSize: 11, color: T.text50, ...MONO }}>{step.output || "-"}</div>
                <div style={{ fontSize: 11, color: T.positive, textAlign: "right", ...MONO }}>{step.cost}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function BlueprintsTab() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: 16,
    }}>
      {BLUEPRINTS.map((bp) => {
        const accent = T.text50;
        return (
          <Card key={bp.id}>
            <div style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <span style={{
                    color: accent, marginBottom: 6, display: "block",
                  }}>
                    {bp.category}
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.text80 }}>{bp.name}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: T.text30, lineHeight: 1.5, marginBottom: 16, minHeight: 36 }}>
                {bp.description}
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                {[
                  { label: "Steps", value: bp.stepCount.toString() },
                  { label: "Avg Cost", value: bp.avgCost },
                  { label: "Forked", value: bp.timesFork.toLocaleString() },
                ].map((m) => (
                  <div key={m.label}>
                    <div style={{ ...LABEL, marginBottom: 2 }}>{m.label}</div>
                    <div style={{ ...MONO, fontSize: 13, fontWeight: 600, color: T.text50 }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <ActionButton label="Fork & Customize" variant="default" />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function CreateTab() {
  const realOps = trpc.operator.list.useQuery({ limit: 20, sortBy: "trust" }, { staleTime: 60_000 });
  const operatorNames = React.useMemo(() => {
    const real = (realOps.data?.items || []).map((op: any) => op.slug || op.name);
    const combined = [...new Set([...real, ...AVAILABLE_OPERATORS])];
    return combined.length > 0 ? combined : AVAILABLE_OPERATORS;
  }, [realOps.data]);

  const [currentStep, setCurrentStep] = useState(1);
  const [missionName, setMissionName] = useState("");
  const [missionDesc, setMissionDesc] = useState("");
  const [pipelineSteps, setPipelineSteps] = useState<{ name: string; operator: string }[]>([
    { name: "Step 1", operator: AVAILABLE_OPERATORS[0] },
  ]);
  const [schedule, setSchedule] = useState("one-time");
  const [cronExpr, setCronExpr] = useState("0 */6 * * *");
  const [budgetLimit, setBudgetLimit] = useState("10.00");

  const formSteps = [
    { num: 1, label: "Name & Description" },
    { num: 2, label: "Pipeline Steps" },
    { num: 3, label: "Schedule" },
    { num: 4, label: "Budget" },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: T.white4,
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    padding: "8px 12px",
    fontSize: 13,
    color: T.text80,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
      {/* Form */}
      <Card>
        <div style={{ padding: "20px" }}>
          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
            {formSteps.map((fs, i) => (
              <React.Fragment key={fs.num}>
                <div
                  onClick={() => setCurrentStep(fs.num)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer",
                    minWidth: 60,
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 500,
                    background: currentStep === fs.num ? T.positive : currentStep > fs.num ? "rgba(255,255,255,0.06)" : T.white4,
                    color: currentStep === fs.num ? "#000" : currentStep > fs.num ? T.positive : T.text30,
                    transition: "all 0.2s",
                  }}>
                    {currentStep > fs.num ? "\u2713" : fs.num}
                  </div>
                  <span style={{ fontSize: 10, color: currentStep === fs.num ? T.text50 : T.text20, marginTop: 4, textAlign: "center" }}>
                    {fs.label}
                  </span>
                </div>
                {i < formSteps.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, minWidth: 20,
                    background: currentStep > fs.num ? T.positive : T.white4,
                    marginTop: -14, transition: "background 0.2s",
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Name */}
          {currentStep === 1 && (
            <div>
              <div style={{ ...LABEL, marginBottom: 8 }}>Mission Name</div>
              <input
                type="text"
                value={missionName}
                onChange={(e) => setMissionName(e.target.value)}
                placeholder="e.g. Market Alpha Scanner"
                style={{ ...inputStyle, marginBottom: 16 }}
              />
              <div style={{ ...LABEL, marginBottom: 8 }}>Description</div>
              <textarea
                value={missionDesc}
                onChange={(e) => setMissionDesc(e.target.value)}
                placeholder="Describe what this mission does..."
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          )}

          {/* Step 2: Pipeline */}
          {currentStep === 2 && (
            <div>
              <div style={{ ...LABEL, marginBottom: 12 }}>Pipeline Steps</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pipelineSteps.map((ps, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 32px",
                    gap: 8, alignItems: "center",
                  }}>
                    <input
                      type="text"
                      value={ps.name}
                      onChange={(e) => {
                        const next = [...pipelineSteps];
                        next[i] = { ...next[i], name: e.target.value };
                        setPipelineSteps(next);
                      }}
                      placeholder="Step name"
                      style={inputStyle}
                    />
                    <select
                      value={ps.operator}
                      onChange={(e) => {
                        const next = [...pipelineSteps];
                        next[i] = { ...next[i], operator: e.target.value };
                        setPipelineSteps(next);
                      }}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      {operatorNames.map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    {pipelineSteps.length > 1 && (
                      <button
                        onClick={() => setPipelineSteps(pipelineSteps.filter((_, j) => j !== i))}
                        style={{
                          width: 28, height: 28, borderRadius: 4,
                          background: "transparent", border: `1px solid ${T.border}`,
                          color: T.negative, cursor: "pointer", fontSize: 14,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {"\u00D7"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setPipelineSteps([...pipelineSteps, { name: `Step ${pipelineSteps.length + 1}`, operator: operatorNames[0] }])}
                style={{
                  marginTop: 12,
                  background: "transparent", border: `1px dashed ${T.border}`,
                  borderRadius: 6, padding: "8px 16px", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, color: T.text30,
                  width: "100%", transition: "border-color 0.15s",
                }}
              >
                + Add Step
              </button>
            </div>
          )}

          {/* Step 3: Schedule */}
          {currentStep === 3 && (
            <div>
              <div style={{ ...LABEL, marginBottom: 12 }}>Execution Schedule</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["one-time", "recurring"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSchedule(s)}
                    style={{
                      padding: "8px 20px", borderRadius: 6, cursor: "pointer",
                      fontSize: 12, fontWeight: 600,
                      background: schedule === s ? T.white6 : "transparent",
                      color: schedule === s ? T.text80 : T.text30,
                      border: `1px solid ${schedule === s ? T.border : "transparent"}`,
                      textTransform: "capitalize" as const,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {schedule === "recurring" && (
                <div>
                  <div style={{ ...LABEL, marginBottom: 8 }}>Cron Expression</div>
                  <input
                    type="text"
                    value={cronExpr}
                    onChange={(e) => setCronExpr(e.target.value)}
                    style={{ ...inputStyle, ...MONO }}
                  />
                  <div style={{ fontSize: 11, color: T.text20, marginTop: 6 }}>
                    Current: Every 6 hours
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Budget */}
          {currentStep === 4 && (
            <div>
              <div style={{ ...LABEL, marginBottom: 12 }}>Budget Limit (USD)</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 400, color: T.text30 }}>$</span>
                <input
                  type="text"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  style={{ ...inputStyle, ...MONO, fontSize: 20, fontWeight: 400, maxWidth: 200 }}
                />
              </div>
              <div style={{ fontSize: 11, color: T.text20, marginTop: 8 }}>
                Mission will pause when this budget is exceeded per run
              </div>
              <div style={{ marginTop: 20 }}>
                <ProgressBar value={34} max={100} color={T.positive} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: T.text20 }}>Estimated cost/run: ~$0.34</span>
                  <span style={{ fontSize: 10, color: T.text20 }}>Budget: ${budgetLimit}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <ActionButton
              label="Back"
              variant="default"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            />
            {currentStep < 4 ? (
              <ActionButton
                label="Next"
                variant="primary"
                onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
              />
            ) : (
              <ActionButton label="Create Mission" variant="primary" />
            )}
          </div>
        </div>
      </Card>

      {/* Pipeline preview */}
      <Card>
        <CardHead label="Pipeline Preview" />
        <div style={{ padding: "20px" }}>
          {pipelineSteps.length === 0 ? (
            <div style={{ fontSize: 12, color: T.text20, textAlign: "center", padding: "24px 0" }}>
              Add steps to see preview
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
              {pipelineSteps.map((ps, i) => (
                <React.Fragment key={i}>
                  <div style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: T.white3,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    textAlign: "center",
                    position: "relative",
                  }}>
                    <div style={{
                      position: "absolute",
                      left: -8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 16, height: 16, borderRadius: "50%",
                      background: T.positive,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 500, color: "#000",
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text80 }}>
                      {ps.name || `Step ${i + 1}`}
                    </div>
                    <div style={{ fontSize: 10, color: T.text30, marginTop: 2 }}>
                      {ps.operator}
                    </div>
                  </div>
                  {i < pipelineSteps.length - 1 && (
                    <div style={{
                      width: 2, height: 20,
                      background: T.borderSubtle,
                    }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────── */

type TabId = "my-missions" | "blueprints" | "create";

export default function MissionsPanel() {
  // Pre-fetch stats so data is warm for other panels
  trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });
  const [activeTab, setActiveTab] = useState<TabId>("my-missions");

  return (
    <div>
      <PageHeader
        title="Missions"
        subtitle="Build, manage, and monitor multi-step AI pipelines"
        action={<ActionButton label="Create Mission" variant="primary" onClick={() => setActiveTab("create")} />}
      />

      {/* Stats row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        marginBottom: 24,
      }}>
        <StatTile label="Active Missions" value="12" delta="+3 this week" deltaPositive accent={T.positive} />
        <StatTile label="Completed Today" value="47" delta="+12 vs yesterday" deltaPositive accent={T.text50} />
        <StatTile label="Avg Cost / Run" value="$0.34" delta="-$0.06" deltaPositive accent={T.text50} />
        <StatTile label="Success Rate" value="94.2%" delta="-1.2%" deltaPositive={false} accent={T.positive} />
      </div>

      {/* Tab bar */}
      <TabBar
        tabs={[
          { id: "my-missions" as TabId, label: "My Missions" },
          { id: "blueprints" as TabId, label: "Blueprints" },
          { id: "create" as TabId, label: "Create" },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab content */}
      {activeTab === "my-missions" && (
        <div>
          {MISSIONS.map((m) => (
            <MissionCard key={m.id} mission={m} />
          ))}
        </div>
      )}

      {activeTab === "blueprints" && <BlueprintsTab />}

      {activeTab === "create" && <CreateTab />}
    </div>
  );
}
