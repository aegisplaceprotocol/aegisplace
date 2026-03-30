import { useEffect, useState, useRef } from "react";
import SectionLabel from "@/components/SectionLabel";
import { useInView } from "@/hooks/useInView";

interface OperatorHealth {
  name: string;
  domain: string;
  status: "operational" | "degraded" | "down";
  uptime: number;
  p99: number;
  errorRate: number;
  queueDepth: number;
  invocations24h: number;
  reputation: number;
  lastCheck: number;
}

const INITIAL_OPERATORS: OperatorHealth[] = [
  { name: "gpt4-code-review", domain: "codereview.aegis.sol", status: "operational", uptime: 99.97, p99: 142, errorRate: 0.02, queueDepth: 3, invocations24h: 14892, reputation: 97, lastCheck: 0 },
  { name: "aegis-translate-es", domain: "translate.aegis.sol", status: "operational", uptime: 99.99, p99: 89, errorRate: 0.01, queueDepth: 0, invocations24h: 31204, reputation: 99, lastCheck: 0 },
  { name: "whisper-transcribe", domain: "transcribe.aegis.sol", status: "operational", uptime: 99.91, p99: 2340, errorRate: 0.08, queueDepth: 12, invocations24h: 8741, reputation: 94, lastCheck: 0 },
  { name: "stable-diff-gen", domain: "imagegen.aegis.sol", status: "degraded", uptime: 98.42, p99: 4800, errorRate: 1.2, queueDepth: 47, invocations24h: 5293, reputation: 82, lastCheck: 0 },
  { name: "sentiment-v3", domain: "sentiment.aegis.sol", status: "operational", uptime: 99.95, p99: 67, errorRate: 0.04, queueDepth: 1, invocations24h: 22156, reputation: 96, lastCheck: 0 },
  { name: "pdf-extract-pro", domain: "pdfextract.aegis.sol", status: "operational", uptime: 99.88, p99: 310, errorRate: 0.11, queueDepth: 5, invocations24h: 9834, reputation: 93, lastCheck: 0 },
  { name: "sql-optimize", domain: "sqlopt.aegis.sol", status: "down", uptime: 94.21, p99: 0, errorRate: 100, queueDepth: 0, invocations24h: 0, reputation: 61, lastCheck: 0 },
  { name: "voice-clone-v2", domain: "voiceclone.aegis.sol", status: "degraded", uptime: 97.83, p99: 6200, errorRate: 3.4, queueDepth: 89, invocations24h: 1247, reputation: 74, lastCheck: 0 },
];

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

function StatusBadge({ status }: { status: OperatorHealth["status"] }) {
  const config = {
    operational: { bg: "bg-white/10", text: "text-zinc-300", dot: "bg-white", label: "OPERATIONAL" },
    degraded: { bg: "bg-amber-400/10", text: "text-amber-400", dot: "bg-amber-400", label: "DEGRADED" },
    down: { bg: "bg-red-400/10", text: "text-red-400", dot: "bg-red-400", label: "DOWN" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status === "operational" ? "animate-pulse" : ""}`} />
      <span className={`text-[10px] font-medium tracking-wider ${c.text}`}>{c.label}</span>
    </span>
  );
}

function MetricBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function HealthDashboard() {
  const { ref, inView } = useInView(0.05);
  const [operators, setOperators] = useState<OperatorHealth[]>(INITIAL_OPERATORS);
  const [selectedOperator, setSelectedOperator] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Simulate live metric fluctuations
  useEffect(() => {
    if (!inView) return;
    intervalRef.current = setInterval(() => {
      setOperators(prev => prev.map(s => {
        if (s.status === "down") return { ...s, lastCheck: Date.now() };
        const p99Delta = rand(-20, 20);
        const errDelta = rand(-0.05, 0.05);
        return {
          ...s,
          p99: Math.max(30, Math.round(s.p99 + p99Delta)),
          errorRate: Math.max(0, parseFloat((s.errorRate + errDelta).toFixed(2))),
          queueDepth: Math.max(0, s.queueDepth + Math.round(rand(-2, 2))),
          invocations24h: s.invocations24h + Math.round(rand(0, 5)),
          lastCheck: Date.now(),
        };
      }));
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [inView]);

  const selected = operators[selectedOperator];
  const operational = operators.filter(s => s.status === "operational").length;
  const degraded = operators.filter(s => s.status === "degraded").length;
  const down = operators.filter(s => s.status === "down").length;

  return (
    <section id="health" className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.04]" ref={ref}>
      <div className="container">
        <SectionLabel text="HEALTH" />

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <h2 className={`text-[clamp(2rem,4.5vw,3.5rem)] font-normal text-white leading-[1.05] tracking-tight`}>
              Real-time health.<br />
              <span className="text-white/30">Not static metadata.</span>
            </h2>
            <p className={`text-[14px] text-white/30 max-w-lg leading-relaxed mt-4`}>
              Every registered operator exposes a standard health endpoint. The marketplace displays
              live operational status, not yesterday's reputation score.
            </p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-[28px] font-normal text-zinc-300 ">{operational}</div>
              <div className="text-[10px] font-medium text-zinc-300/40 tracking-wider">OPERATIONAL</div>
            </div>
            <div className="text-center">
              <div className="text-[28px] font-normal text-amber-400 ">{degraded}</div>
              <div className="text-[10px] font-medium text-amber-400/40 tracking-wider">DEGRADED</div>
            </div>
            <div className="text-center">
              <div className="text-[28px] font-normal text-red-400 ">{down}</div>
              <div className="text-[10px] font-medium text-red-400/40 tracking-wider">DOWN</div>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-0 border border-white/[0.04] rounded overflow-hidden`}>
          {/* Operator list */}
          <div className="border-b lg:border-b-0 lg:border-r border-white/[0.04] bg-white/[0.01]">
            <div className="p-3 border-b border-white/[0.04]">
              <span className="text-[10px] font-medium text-white/20 tracking-wider">REGISTERED OPERATORS</span>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {operators.map((s, i) => (
                <button
                  key={s.name}
                  onClick={() => setSelectedOperator(i)}
                  className={`w-full text-left px-4 py-3 border-b border-white/[0.04] transition-colors ${selectedOperator === i ? "bg-white/[0.04]" : "hover:bg-white/[0.015]"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[13px] font-medium ${selectedOperator === i ? "text-white/80" : "text-white/50"}`}>
                      {s.name}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${s.status === "operational" ? "bg-white" : s.status === "degraded" ? "bg-amber-400" : "bg-red-400"}`} />
                  </div>
                  <div className="text-[10px] font-medium text-white/15 mt-0.5">{s.domain}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div className="bg-white/[0.015] p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[18px] font-normal text-white/80">{selected.name}</h3>
                <div className="text-[12px] font-medium text-zinc-300/40 mt-1">{selected.domain}</div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-white/[0.015] border border-white/[0.04] rounded">
                <div className="text-[10px] font-medium text-white/20 tracking-wider mb-1">UPTIME</div>
                <div className={`text-[20px] font-normal ${selected.uptime >= 99.5 ? "text-zinc-300" : selected.uptime >= 98 ? "text-amber-400" : "text-red-400"}`}>
                  {selected.uptime}%
                </div>
                <MetricBar value={selected.uptime} max={100} color={selected.uptime >= 99.5 ? "bg-white" : selected.uptime >= 98 ? "bg-amber-400" : "bg-red-400"} />
              </div>
              <div className="p-3 bg-white/[0.015] border border-white/[0.04] rounded">
                <div className="text-[10px] font-medium text-white/20 tracking-wider mb-1">P99 LATENCY</div>
                <div className={`text-[20px] font-normal ${selected.p99 <= 200 ? "text-zinc-300" : selected.p99 <= 1000 ? "text-amber-400" : "text-red-400"}`}>
                  {selected.status === "down" ? "--" : `${selected.p99}ms`}
                </div>
                <MetricBar value={Math.min(selected.p99, 5000)} max={5000} color={selected.p99 <= 200 ? "bg-white" : selected.p99 <= 1000 ? "bg-amber-400" : "bg-red-400"} />
              </div>
              <div className="p-3 bg-white/[0.015] border border-white/[0.04] rounded">
                <div className="text-[10px] font-medium text-white/20 tracking-wider mb-1">ERROR RATE</div>
                <div className={`text-[20px] font-normal ${selected.errorRate <= 0.1 ? "text-zinc-300" : selected.errorRate <= 1 ? "text-amber-400" : "text-red-400"}`}>
                  {selected.status === "down" ? "100%" : `${selected.errorRate}%`}
                </div>
                <MetricBar value={Math.min(selected.errorRate, 5)} max={5} color={selected.errorRate <= 0.1 ? "bg-white" : selected.errorRate <= 1 ? "bg-amber-400" : "bg-red-400"} />
              </div>
              <div className="p-3 bg-white/[0.015] border border-white/[0.04] rounded">
                <div className="text-[10px] font-medium text-white/20 tracking-wider mb-1">QUEUE</div>
                <div className={`text-[20px] font-normal ${selected.queueDepth <= 5 ? "text-zinc-300" : selected.queueDepth <= 20 ? "text-amber-400" : "text-red-400"}`}>
                  {selected.status === "down" ? "--" : selected.queueDepth}
                </div>
                <MetricBar value={Math.min(selected.queueDepth, 100)} max={100} color={selected.queueDepth <= 5 ? "bg-white" : selected.queueDepth <= 20 ? "bg-amber-400" : "bg-red-400"} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-white/[0.015] border border-white/[0.04] rounded">
                <div className="text-[10px] font-medium text-white/20 tracking-wider mb-1">24H INVOCATIONS</div>
                <div className="text-[20px] font-normal text-white/60">{selected.invocations24h.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-white/[0.015] border border-white/[0.04] rounded">
                <div className="text-[10px] font-medium text-white/20 tracking-wider mb-1">REPUTATION</div>
                <div className={`text-[20px] font-normal ${selected.reputation >= 90 ? "text-zinc-300" : selected.reputation >= 75 ? "text-amber-400" : "text-red-400"}`}>
                  {selected.reputation}/100
                </div>
              </div>
            </div>

            {/* Endpoint example */}
            <div className="p-4 bg-white/[0.015] border border-white/[0.04] rounded text-[12px] font-medium">
              <div className="text-white/20 mb-2">// Standard health endpoint</div>
              <div className="text-zinc-300/60">GET</div>
              <div className="text-white/50 ml-4">https://{selected.domain}/aegis/health</div>
              <div className="text-white/20 mt-3 mb-1">// Response</div>
              <div className="text-white/40">{"{"}</div>
              <div className="text-white/40 ml-4">"status": "<span className={selected.status === "operational" ? "text-zinc-300/60" : selected.status === "degraded" ? "text-amber-400/60" : "text-red-400/60"}>{selected.status}</span>",</div>
              <div className="text-white/40 ml-4">"uptime": {selected.uptime},</div>
              <div className="text-white/40 ml-4">"p99_ms": {selected.status === "down" ? "null" : selected.p99},</div>
              <div className="text-white/40 ml-4">"error_rate": {selected.status === "down" ? 100 : selected.errorRate},</div>
              <div className="text-white/40 ml-4">"queue_depth": {selected.status === "down" ? 0 : selected.queueDepth}</div>
              <div className="text-white/40">{"}"}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
