import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import {
  PageHeader, Card, CardHead, StatTile, TabBar, ProgressBar,
  StatusBadge, ActionButton, EmptyState,
} from "./primitives";

type SwarmTab = "active" | "launch" | "results";

interface Swarm {
  id: number;
  name: string;
  category: string;
  agents: number;
  experimentsCompleted: number;
  experimentsTotal: number;
  budgetUsed: number;
  budgetAllocated: number;
  status: "running" | "paused" | "completed";
  bestScore: number;
}

interface Experiment {
  id: number;
  description: string;
  score: number;
  cost: number;
  kept: boolean | null;
}

const INITIAL_SWARMS: Swarm[] = [
  {
    id: 1,
    name: "Alpha Strategy Sweep",
    category: "Trading Strategy",
    agents: 24,
    experimentsCompleted: 847,
    experimentsTotal: 1000,
    budgetUsed: 84.70,
    budgetAllocated: 100.00,
    status: "running",
    bestScore: 94,
  },
  {
    id: 2,
    name: "Market Sentiment v3",
    category: "Market Analysis",
    agents: 12,
    experimentsCompleted: 312,
    experimentsTotal: 500,
    budgetUsed: 31.20,
    budgetAllocated: 50.00,
    status: "paused",
    bestScore: 87,
  },
  {
    id: 3,
    name: "Contract Audit Swarm",
    category: "Security Audit",
    agents: 11,
    experimentsCompleted: 125,
    experimentsTotal: 125,
    budgetUsed: 11.50,
    budgetAllocated: 15.00,
    status: "completed",
    bestScore: 91,
  },
];

const SWARM_EXPERIMENTS: Record<number, Experiment[]> = {
  1: [
    { id: 1, description: "Momentum crossover with 12/26 EMA, RSI confirmation >70", score: 94, cost: 0.12, kept: null },
    { id: 2, description: "Mean reversion on Bollinger squeeze with volume filter", score: 91, cost: 0.09, kept: null },
    { id: 3, description: "Breakout detection with ATR trailing stop", score: 88, cost: 0.11, kept: null },
    { id: 4, description: "VWAP deviation strategy with order flow imbalance", score: 85, cost: 0.08, kept: null },
    { id: 5, description: "Pairs trading with cointegration test on SOL/ETH", score: 82, cost: 0.10, kept: null },
    { id: 6, description: "Sentiment-weighted momentum with on-chain data", score: 79, cost: 0.14, kept: null },
    { id: 7, description: "Adaptive grid strategy with dynamic spacing", score: 76, cost: 0.07, kept: null },
    { id: 8, description: "Whale tracking strategy using wallet clustering", score: 72, cost: 0.13, kept: null },
  ],
  2: [
    { id: 1, description: "Twitter sentiment NLP with fine-tuned BERT", score: 87, cost: 0.06, kept: null },
    { id: 2, description: "On-chain metrics correlation analysis", score: 83, cost: 0.05, kept: null },
    { id: 3, description: "Fear & Greed index prediction model", score: 80, cost: 0.07, kept: null },
    { id: 4, description: "Cross-exchange flow analysis", score: 77, cost: 0.04, kept: null },
    { id: 5, description: "Options market sentiment indicator", score: 74, cost: 0.06, kept: null },
  ],
  3: [
    { id: 1, description: "Reentrancy vulnerability scanner with symbolic execution", score: 91, cost: 0.09, kept: null },
    { id: 2, description: "Integer overflow detection via abstract interpretation", score: 89, cost: 0.08, kept: null },
    { id: 3, description: "Access control analysis with role graph traversal", score: 86, cost: 0.10, kept: null },
    { id: 4, description: "Flash loan attack vector identification", score: 83, cost: 0.07, kept: null },
    { id: 5, description: "State variable shadowing detector", score: 78, cost: 0.05, kept: null },
  ],
};

const MEDAL_COLORS = [T.text50, "#C0C0C0", "#CD7F32"];

export default function SwarmsPanel() {
  const stats = trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });
  const [tab, setTab] = useState<SwarmTab>("active");
  const [swarms, setSwarms] = useState<Swarm[]>(INITIAL_SWARMS);
  const [experiments, setExperiments] = useState<Record<number, Experiment[]>>(SWARM_EXPERIMENTS);

  // Launch form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Trading Strategy");
  const [formTarget, setFormTarget] = useState("");
  const [formAgents, setFormAgents] = useState(25);
  const [formBudget, setFormBudget] = useState("50.00");
  const [formExpCount, setFormExpCount] = useState("500");

  // Results state
  const [resultsSwarm, setResultsSwarm] = useState(1);

  const totalAgents = swarms.reduce((a, s) => a + s.agents, 0);
  const totalExperiments = swarms.reduce((a, s) => a + s.experimentsCompleted, 0);
  const totalBudget = swarms.reduce((a, s) => a + s.budgetUsed, 0);
  const activeCount = swarms.filter((s) => s.status === "running").length;

  const costEstimate = useMemo(() => {
    const agents = formAgents;
    const exps = parseInt(formExpCount) || 0;
    return (agents * exps * 0.001).toFixed(2);
  }, [formAgents, formExpCount]);

  const toggleSwarmStatus = (id: number) => {
    setSwarms((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (s.status === "running") return { ...s, status: "paused" as const };
        if (s.status === "paused") return { ...s, status: "running" as const };
        return s;
      }),
    );
  };

  const stopSwarm = (id: number) => {
    setSwarms((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "completed" as const } : s)),
    );
  };

  const toggleKeep = (swarmId: number, expId: number, kept: boolean) => {
    setExperiments((prev) => ({
      ...prev,
      [swarmId]: prev[swarmId].map((e) =>
        e.id === expId ? { ...e, kept } : e,
      ),
    }));
  };

  const launchSwarm = () => {
    if (!formName.trim()) return;
    const newId = Math.max(...swarms.map((s) => s.id)) + 1;
    const newSwarm: Swarm = {
      id: newId,
      name: formName,
      category: formCategory,
      agents: formAgents,
      experimentsCompleted: 0,
      experimentsTotal: parseInt(formExpCount) || 500,
      budgetUsed: 0,
      budgetAllocated: parseFloat(formBudget) || 50,
      status: "running",
      bestScore: 0,
    };
    setSwarms((prev) => [...prev, newSwarm]);
    setExperiments((prev) => ({ ...prev, [newId]: [] }));
    setFormName("");
    setFormTarget("");
    setTab("active");
  };

  const selectedResults = experiments[resultsSwarm] || [];
  const sortedResults = [...selectedResults].sort((a, b) => b.score - a.score);
  const selectedSwarm = swarms.find((s) => s.id === resultsSwarm);

  return (
    <div>
      <PageHeader
        title="Research Swarms"
        subtitle="Launch autonomous agent swarms for parallel research"
      />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        <StatTile label="Active Swarms" value={String(activeCount)} accent={T.positive} />
        <StatTile label="Agents Deployed" value={String(totalAgents)} accent={T.text50} />
        <StatTile label="Experiments Run" value={totalExperiments.toLocaleString()} accent={T.text50} />
        <StatTile label="Budget Used" value={`$${totalBudget.toFixed(2)}`} accent={T.text30} />
      </div>

      {/* Protocol-wide stats */}
      {stats.data && (
        <div style={{
          padding: "10px 16px",
          background: T.white3,
          borderRadius: 6,
          marginBottom: 16,
          fontSize: 12,
          color: T.text30,
          textAlign: "center",
        }}>
          Protocol: {stats.data.totalOperators.toLocaleString()} operators &middot; {stats.data.totalInvocations.toLocaleString()} invocations &middot; {stats.data.totalValidators.toLocaleString()} validators
        </div>
      )}

      <TabBar
        tabs={[
          { id: "active" as SwarmTab, label: "Active Swarms" },
          { id: "launch" as SwarmTab, label: "Launch New" },
          { id: "results" as SwarmTab, label: "Results" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ─── Active Swarms ─── */}
      {tab === "active" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {swarms.map((swarm) => (
            <Card key={swarm.id}>
              <div style={{ padding: 20 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: T.text80 }}>{swarm.name}</div>
                    <div style={{ fontSize: 11, color: T.text25, marginTop: 2 }}>{swarm.category}</div>
                  </div>
                  <StatusBadge
                    status={swarm.status}
                    color={swarm.status === "running" ? "green" : swarm.status === "paused" ? "amber" : "blue"}
                  />
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em" }}>AGENTS</div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: T.text50, marginTop: 2 }}>{swarm.agents}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em" }}>EXPERIMENTS</div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: T.text50, marginTop: 2 }}>
                      {swarm.experimentsCompleted} / {swarm.experimentsTotal}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em" }}>BUDGET</div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: T.text50, marginTop: 2 }}>
                      ${swarm.budgetUsed.toFixed(2)} / ${swarm.budgetAllocated.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em" }}>BEST SCORE</div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: T.positive, marginTop: 2 }}>
                      {swarm.bestScore > 0 ? swarm.bestScore : "--"}
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <ProgressBar
                  value={swarm.experimentsCompleted}
                  max={swarm.experimentsTotal}
                  color="rgba(255,255,255,0.20)"
                />

                {/* Actions */}
                {swarm.status !== "completed" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <ActionButton
                      label={swarm.status === "running" ? "Pause" : "Resume"}
                      onClick={() => toggleSwarmStatus(swarm.id)}
                      variant="default"
                    />
                    <ActionButton
                      label="Stop"
                      onClick={() => stopSwarm(swarm.id)}
                      variant="danger"
                    />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Launch New ─── */}
      {tab === "launch" && (
        <Card>
          <CardHead label="Launch Configuration" />
          <div style={{ padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em", display: "block", marginBottom: 6 }}>
                  SWARM NAME
                </label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Alpha Strategy Sweep"
                  style={{
                    width: "100%",
                    background: T.bg,
                    border: `1px solid ${T.border}`,
                    borderRadius: 6,
                    color: T.text80,
                    padding: "8px 12px",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Category */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em", display: "block", marginBottom: 6 }}>
                  RESEARCH CATEGORY
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  style={{
                    width: "100%",
                    background: T.bg,
                    border: `1px solid ${T.border}`,
                    borderRadius: 6,
                    color: T.text80,
                    padding: "8px 12px",
                    fontSize: 13,
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <option>Trading Strategy</option>
                  <option>Market Analysis</option>
                  <option>Security Audit</option>
                  <option>LLM Research</option>
                  <option>Data Pipeline</option>
                </select>
              </div>
            </div>

            {/* Target */}
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em", display: "block", marginBottom: 6 }}>
                TARGET DESCRIPTION
              </label>
              <textarea
                value={formTarget}
                onChange={(e) => setFormTarget(e.target.value)}
                placeholder="Describe the research objective..."
                rows={3}
                style={{
                  width: "100%",
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  color: T.text80,
                  padding: "8px 12px",
                  fontSize: 13,
                  resize: "vertical",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Agent count slider */}
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em", display: "block", marginBottom: 6 }}>
                AGENT COUNT: {formAgents}
              </label>
              <input
                type="range"
                min={5}
                max={100}
                value={formAgents}
                onChange={(e) => setFormAgents(Number(e.target.value))}
                style={{ width: "100%", accentColor: T.positive }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.text20 }}>
                <span>5</span>
                <span>100</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
              {/* Budget */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em", display: "block", marginBottom: 6 }}>
                  BUDGET LIMIT (USDC)
                </label>
                <input
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  placeholder="50.00"
                  style={{
                    width: "100%",
                    background: T.bg,
                    border: `1px solid ${T.border}`,
                    borderRadius: 6,
                    color: T.text80,
                    padding: "8px 12px",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Experiment count */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em", display: "block", marginBottom: 6 }}>
                  EXPERIMENT COUNT
                </label>
                <input
                  value={formExpCount}
                  onChange={(e) => setFormExpCount(e.target.value)}
                  placeholder="500"
                  style={{
                    width: "100%",
                    background: T.bg,
                    border: `1px solid ${T.border}`,
                    borderRadius: 6,
                    color: T.text80,
                    padding: "8px 12px",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Cost estimate + Launch */}
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, color: T.text30 }}>
                Estimated cost: <span style={{ color: T.text50, fontWeight: 500 }}>${costEstimate} USDC</span>
              </div>
              <ActionButton label="Launch Swarm" onClick={launchSwarm} variant="primary" />
            </div>
          </div>
        </Card>
      )}

      {/* ─── Results ─── */}
      {tab === "results" && (
        <div>
          {/* Swarm selector */}
          <div style={{ marginBottom: 16 }}>
            <select
              value={resultsSwarm}
              onChange={(e) => setResultsSwarm(Number(e.target.value))}
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                color: T.text80,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {swarms.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {sortedResults.length === 0 ? (
            <EmptyState title="No Results Yet" message="This swarm has not produced any experiment results yet." />
          ) : (
            <>
              {/* Ranked experiments */}
              <Card>
                <CardHead label="Ranked Experiments" action={
                  <span style={{ fontSize: 10, color: T.text20 }}>{sortedResults.length} results</span>
                } />
                <div>
                  {sortedResults.map((exp, i) => (
                    <div
                      key={exp.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "12px 20px",
                        borderBottom: i < sortedResults.length - 1 ? `1px solid ${T.border}` : undefined,
                        background: i < 3 ? `${MEDAL_COLORS[i]}08` : undefined,
                      }}
                    >
                      {/* Rank */}
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 500,
                          flexShrink: 0,
                          background: i < 3 ? `${MEDAL_COLORS[i]}20` : T.white4,
                          color: i < 3 ? MEDAL_COLORS[i] : T.text30,
                        }}
                      >
                        {i + 1}
                      </div>

                      {/* Description */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: T.text50, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {exp.description}
                        </div>
                      </div>

                      {/* Score */}
                      <div style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: exp.score >= 90 ? T.positive : exp.score >= 80 ? T.text50 : T.text50,
                        fontVariantNumeric: "tabular-nums",
                        flexShrink: 0,
                      }}>
                        {exp.score}
                      </div>

                      {/* Cost */}
                      <div style={{ fontSize: 11, color: T.text25, fontVariantNumeric: "tabular-nums", width: 50, textAlign: "right", flexShrink: 0 }}>
                        ${exp.cost.toFixed(2)}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button
                          onClick={() => toggleKeep(resultsSwarm, exp.id, true)}
                          style={{
                            background: exp.kept === true ? `${T.positive}20` : "transparent",
                            border: `1px solid ${exp.kept === true ? T.positive : T.border}`,
                            borderRadius: 4,
                            padding: "3px 8px",
                            fontSize: 10,
                            fontWeight: 500,
                            color: exp.kept === true ? T.positive : T.text30,
                            cursor: "pointer",
                          }}
                        >
                          Keep
                        </button>
                        <button
                          onClick={() => toggleKeep(resultsSwarm, exp.id, false)}
                          style={{
                            background: exp.kept === false ? `${T.negative}20` : "transparent",
                            border: `1px solid ${exp.kept === false ? T.negative : T.border}`,
                            borderRadius: 4,
                            padding: "3px 8px",
                            fontSize: 10,
                            fontWeight: 500,
                            color: exp.kept === false ? T.negative : T.text30,
                            cursor: "pointer",
                          }}
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Summary card */}
              {selectedSwarm && (
                <Card style={{ marginTop: 12 }}>
                  <CardHead label="Summary" />
                  <div style={{ padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em" }}>BEST SCORE</div>
                      <div style={{ fontSize: 24, fontWeight: 400, color: T.positive, marginTop: 4 }}>
                        {sortedResults[0]?.score ?? "--"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em" }}>AVG SCORE</div>
                      <div style={{ fontSize: 24, fontWeight: 400, color: T.text50, marginTop: 4 }}>
                        {sortedResults.length > 0
                          ? Math.round(sortedResults.reduce((a, e) => a + e.score, 0) / sortedResults.length)
                          : "--"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em" }}>TOTAL COST</div>
                      <div style={{ fontSize: 24, fontWeight: 400, color: T.text50, marginTop: 4 }}>
                        ${sortedResults.reduce((a, e) => a + e.cost, 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em" }}>KEPT</div>
                      <div style={{ fontSize: 24, fontWeight: 400, color: T.text50, marginTop: 4 }}>
                        {sortedResults.filter((e) => e.kept === true).length} / {sortedResults.length}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
