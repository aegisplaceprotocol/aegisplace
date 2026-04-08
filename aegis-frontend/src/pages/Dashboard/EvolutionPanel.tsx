import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import { PageHeader, Card, CardHead, ActionButton, MiniTable, StatusBadge } from "./primitives";

const AXIS_NAMES = ["Specialize", "Learn", "Equip", "Earn", "Network", "Harden"] as const;
type AxisName = (typeof AXIS_NAMES)[number];

const AXIS_COLORS: Record<AxisName, string> = {
  Specialize: "rgba(255,255,255,0.50)",
  Learn: "rgba(255,255,255,0.40)",
  Equip: "rgba(255,255,255,0.35)",
  Earn: "rgba(255,255,255,0.30)",
  Network: "rgba(255,255,255,0.25)",
  Harden: "rgba(255,255,255,0.20)",
};

type Strategy = "Balanced" | "Specialize-First" | "Earn-Heavy" | "Security-Focused";

const STRATEGY_WEIGHTS: Record<Strategy, number[]> = {
  "Balanced": [1, 1, 1, 1, 1, 1],
  "Specialize-First": [3, 2, 1, 0.5, 0.5, 1],
  "Earn-Heavy": [1, 1, 2, 3, 2, 0.5],
  "Security-Focused": [1, 1, 1, 0.5, 1, 3],
};

interface Operator {
  name: string;
  initialValues: number[];
}

const OPERATORS: Operator[] = [
  { name: "code-review-alpha", initialValues: [35, 28, 20, 15, 22, 40] },
  { name: "translate-beta", initialValues: [20, 45, 30, 25, 18, 35] },
  { name: "security-audit-v2", initialValues: [50, 30, 25, 10, 15, 55] },
  { name: "data-pipeline-gamma", initialValues: [15, 40, 45, 30, 35, 20] },
  { name: "content-writer-pro", initialValues: [25, 50, 15, 35, 40, 18] },
  { name: "rust-specialist-01", initialValues: [60, 20, 35, 20, 10, 45] },
];

interface LogEntry {
  cycle: number;
  changes: { axis: AxisName; delta: number; from: number; to: number }[];
}

function buildRadarPoints(values: number[], cx: number, cy: number, r: number): string {
  return values
    .map((v, i) => {
      const angle = (Math.PI * 2 * i) / values.length - Math.PI / 2;
      const pct = Math.min(v, 100) / 100;
      const x = cx + Math.cos(angle) * r * pct;
      const y = cy + Math.sin(angle) * r * pct;
      return `${x},${y}`;
    })
    .join(" ");
}

function RadarChart({ values, size = 260 }: { values: number[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 36;
  const n = AXIS_NAMES.length;

  const hexPoints = (scale: number) =>
    Array.from({ length: n })
      .map((_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        return `${cx + Math.cos(angle) * r * scale},${cy + Math.sin(angle) * r * scale}`;
      })
      .join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", margin: "0 auto" }}>
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon
          key={s}
          points={hexPoints(s)}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {AXIS_NAMES.map((_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(angle) * r}
            y2={cy + Math.sin(angle) * r}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={1}
          />
        );
      })}

      {/* Value polygon */}
      <polygon
        points={buildRadarPoints(values, cx, cy, r)}
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.20)"
        strokeWidth={2}
      />

      {/* Dots on vertices */}
      {values.map((v, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const pct = Math.min(v, 100) / 100;
        const x = cx + Math.cos(angle) * r * pct;
        const y = cy + Math.sin(angle) * r * pct;
        return <circle key={i} cx={x} cy={y} r={3.5} fill={AXIS_COLORS[AXIS_NAMES[i]]} />;
      })}

      {/* Labels */}
      {AXIS_NAMES.map((name, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = cx + Math.cos(angle) * (r + 24);
        const ly = cy + Math.sin(angle) * (r + 24);
        return (
          <text
            key={name}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontSize: 10, fontWeight: 500, fill: AXIS_COLORS[name], letterSpacing: "0.04em" }}
          >
            {name}
          </text>
        );
      })}
    </svg>
  );
}

export default function EvolutionPanel() {
  const myOps = trpc.operator.list.useQuery({ limit: 5, sortBy: "trust" }, { staleTime: 60_000 });

  // Merge real operators into the selector: real ops first, then demo fallbacks
  const mergedOperators = useMemo(() => {
    const realOps: Operator[] = (myOps.data?.items || []).map((op: any) => ({
      name: op.slug || op.name,
      initialValues: [
        // Specialize: derived from quality score
        Math.min(100, Math.round((op.qualityScore ?? 50) * 0.6)),
        // Learn: derived from invocation count scaled to 0-50 range
        Math.min(50, Math.round((op.totalInvocations ?? 0) / 200)),
        // Equip: derived from success rate if available, else trust proxy
        Math.min(100, Math.round(((op.successRate ? parseFloat(op.successRate) : op.qualityScore ?? 50)) * 0.4)),
        // Earn: derived from invocation volume
        Math.min(100, Math.round((op.totalInvocations ?? 0) / 100)),
        // Network: derived from quality score as social proxy
        Math.min(100, Math.round((op.qualityScore ?? 50) * 0.3)),
        // Harden: derived from quality score as security proxy
        Math.min(100, Math.round((op.qualityScore ?? 50) * 0.5)),
      ],
    }));
    return realOps.length > 0 ? [...realOps, ...OPERATORS] : OPERATORS;
  }, [myOps.data]);

  const [selectedOp, setSelectedOp] = useState(0);
  const [strategy, setStrategy] = useState<Strategy>("Balanced");
  const [currentValues, setCurrentValues] = useState<number[]>(() => [...mergedOperators[0].initialValues]);
  const [cycle, setCycle] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [autoRun, setAutoRun] = useState(false);
  const [speed, setSpeed] = useState(500);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const resetOperator = useCallback(
    (idx: number) => {
      setSelectedOp(idx);
      setCurrentValues([...mergedOperators[idx].initialValues]);
      setCycle(0);
      setLog([]);
      setAutoRun(false);
    },
    [mergedOperators],
  );

  const runCycle = useCallback(() => {
    setCycle((prev) => {
      if (prev >= 100) return prev;
      const newCycle = prev + 1;

      setCurrentValues((vals) => {
        const weights = STRATEGY_WEIGHTS[strategy];
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        const numAxes = 1 + (Math.random() > 0.5 ? 1 : 0);
        const changes: LogEntry["changes"] = [];
        const newVals = [...vals];

        for (let a = 0; a < numAxes; a++) {
          // Weighted random axis selection
          let roll = Math.random() * totalWeight;
          let axisIdx = 0;
          for (let j = 0; j < weights.length; j++) {
            roll -= weights[j];
            if (roll <= 0) { axisIdx = j; break; }
          }

          const delta = Math.floor(Math.random() * 5) + 1;
          const from = newVals[axisIdx];
          const to = Math.min(100, from + delta);
          if (to > from) {
            newVals[axisIdx] = to;
            changes.push({ axis: AXIS_NAMES[axisIdx], delta: to - from, from, to });
          }
        }

        if (changes.length > 0) {
          setLog((prev) => [...prev, { cycle: newCycle, changes }]);
        }

        return newVals;
      });

      return newCycle;
    });
  }, [strategy]);

  // Auto-run effect
  useEffect(() => {
    if (autoRun && cycle < 100) {
      autoRef.current = setInterval(runCycle, speed);
    }
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [autoRun, speed, runCycle, cycle]);

  // Stop auto when at 100
  useEffect(() => {
    if (cycle >= 100) setAutoRun(false);
  }, [cycle]);

  // Scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  const op = mergedOperators[selectedOp] || mergedOperators[0];

  return (
    <div>
      <PageHeader
        title="Operator Evolution"
        subtitle="6-axis evolution simulator for skill operators"
      />

      {/* Controls row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24, alignItems: "center" }}>
        {/* Operator selector */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em", display: "block", marginBottom: 4 }}>
            OPERATOR
          </label>
          <select
            value={selectedOp}
            onChange={(e) => resetOperator(Number(e.target.value))}
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
            {mergedOperators.map((o, i) => (
              <option key={o.name} value={i}>{o.name}</option>
            ))}
          </select>
        </div>

        {/* Strategy selector */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em", display: "block", marginBottom: 4 }}>
            STRATEGY
          </label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as Strategy)}
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
            {(Object.keys(STRATEGY_WEIGHTS) as Strategy[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Speed control */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 500, color: T.text20, letterSpacing: "0.02em", display: "block", marginBottom: 4 }}>
            SPEED
          </label>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
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
            <option value={1000}>Slow (1s)</option>
            <option value={500}>Normal (500ms)</option>
            <option value={200}>Fast (200ms)</option>
            <option value={50}>Turbo (50ms)</option>
          </select>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {/* Left: Radar chart */}
        <Card>
          <CardHead label="Radar View" action={<StatusBadge status={`Cycle ${cycle}`} color="blue" />} />
          <div style={{ padding: 20 }}>
            <RadarChart values={currentValues} />

            {/* Cycle counter + buttons */}
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text50, marginBottom: 12, fontVariantNumeric: "tabular-nums" }}>
                Cycle {cycle} / 100
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <ActionButton label="Run Cycle" onClick={runCycle} variant={cycle >= 100 ? "default" : "primary"} />
                <ActionButton
                  label={autoRun ? "Pause Auto" : "Auto-Run"}
                  onClick={() => setAutoRun((p) => !p)}
                  variant={autoRun ? "danger" : "default"}
                />
                <ActionButton label="Reset" onClick={() => resetOperator(selectedOp)} variant="default" />
              </div>
            </div>
          </div>
        </Card>

        {/* Right: Evolution log */}
        <Card>
          <CardHead label="Evolution Log" action={
            <span style={{ fontSize: 10, color: T.text20 }}>{log.length} events</span>
          } />
          <div
            ref={logRef}
            style={{
              height: 360,
              overflowY: "auto",
              padding: "12px 16px",
            }}
          >
            {log.length === 0 && (
              <div style={{ fontSize: 12, color: T.text20, textAlign: "center", paddingTop: 40 }}>
                Run a cycle to see evolution events
              </div>
            )}
            {log.map((entry, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  lineHeight: 1.6,
                  padding: "4px 0",
                  borderBottom: i < log.length - 1 ? `1px solid ${T.border}` : undefined,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <span style={{ color: T.text30 }}>Cycle {entry.cycle}: </span>
                {entry.changes.map((c, ci) => (
                  <span key={ci}>
                    {ci > 0 && <span style={{ color: T.text20 }}>, </span>}
                    <span style={{ color: AXIS_COLORS[c.axis], fontWeight: 600 }}>{c.axis}</span>
                    <span style={{ color: T.positive }}> +{c.delta}</span>
                    <span style={{ color: T.text20 }}> ({c.from} → {c.to})</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Before/After comparison table */}
      <div style={{ marginTop: 16 }}>
        <Card>
          <CardHead label="Before / After Comparison" />
          <MiniTable
            headers={["Axis", "Initial", "Current", "Change"]}
            rows={AXIS_NAMES.map((name, i) => [
              <span style={{ color: AXIS_COLORS[name], fontWeight: 500 }}>{name}</span>,
              String(op.initialValues[i]),
              String(currentValues[i]),
              <span style={{ color: currentValues[i] > op.initialValues[i] ? T.positive : T.text30 }}>
                {currentValues[i] > op.initialValues[i]
                  ? `+${currentValues[i] - op.initialValues[i]}`
                  : "..."}
              </span>,
            ])}
          />
        </Card>
      </div>
    </div>
  );
}
