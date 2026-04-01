/**
 * Interactive tool showing economic exposure before transacting.
 * Includes: Payout flow (Sankey-style), bond calculator, validation pressure gauges.
 * Rebranded from AGIJobManager concepts into Aegis military language.
 */
import { useState, useMemo, useRef, useEffect } from "react";

/* ── Animated gauge arc ──────────────────────────────────────────────── */
function GaugeArc({ value, max, label, color, size = 120 }: {
  value: number; max: number; label: string; color: string; size?: number;
}) {
  const pct = Math.min(value / max, 1);
  const r = (size - 16) / 2;
  const circumference = Math.PI * r;
  const [animPct, setAnimPct] = useState(0);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start: number;
        const animate = (ts: number) => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / 800, 1);
          setAnimPct(pct * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [pct]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={ref} width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        {/* Background arc */}
        <path
          d={`M 8,${size / 2 + 8} A ${r},${r} 0 0 1 ${size - 8},${size / 2 + 8}`}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M 8,${size / 2 + 8} A ${r},${r} 0 0 1 ${size - 8},${size / 2 + 8}`}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${circumference * (1 - animPct)}`}
          style={{ transition: "stroke-dashoffset 0.1s" }}
        />
        {/* Center value */}
        <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fill="white" fontSize="18" fontWeight="700" fontFamily="'Aeonik', system-ui, sans-serif">
          {(animPct * max).toFixed(1)}
        </text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8" fontFamily="'Aeonik', system-ui, sans-serif" letterSpacing="0.1em">
          / {max}
        </text>
      </svg>
      <span className="text-[10px] font-medium text-white/30 tracking-wider text-center">{label}</span>
    </div>
  );
}

/* ── Sankey-style flow node ──────────────────────────────────────────── */
function FlowBar({ label, amount, pct, color, delay = 0 }: {
  label: string; amount: string; pct: number; color: string; delay?: number;
}) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setTimeout(() => setWidth(pct), delay);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [pct, delay]);

  return (
    <div ref={ref} className="group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-white/40 tracking-wider">{label}</span>
        <span className="text-[11px] font-medium text-white/60">{amount}</span>
      </div>
      <div className="h-2.5 bg-white/[0.015] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <div className="text-right mt-0.5">
        <span className="text-[9px] font-medium text-white/15">{pct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────── */
export default function MissionEconomics() {
  const [taskValue, setTaskValue] = useState(5000);
  const [duration, setDuration] = useState(300);
  const [riskTier, setRiskTier] = useState<"standard" | "elevated" | "critical">("standard");

  const economics = useMemo(() => {
    const riskMultiplier = riskTier === "standard" ? 1 : riskTier === "elevated" ? 1.5 : 2.5;
    const protocolFee = taskValue * 0.025;
    const burnAmount = protocolFee * 0.4;
    const treasuryAmount = protocolFee * 0.35;
    const validatorRewards = protocolFee * 0.25;
    const operatorPayout = taskValue - protocolFee;
    const operatorBond = taskValue * 0.05 * riskMultiplier;
    const validatorBond = taskValue * 0.02 * riskMultiplier;
    const disputeBond = taskValue * 0.08 * riskMultiplier;
    const durationBonus = duration > 600 ? 1.15 : duration > 300 ? 1.05 : 1;
    const settlementTime = Math.max(12, Math.min(120, duration * 0.04));

    return {
      protocolFee,
      burnAmount,
      treasuryAmount,
      validatorRewards,
      operatorPayout,
      operatorBond: operatorBond * durationBonus,
      validatorBond: validatorBond * durationBonus,
      disputeBond: disputeBond * durationBonus,
      settlementTime,
      netBurnRate: (burnAmount / taskValue * 100),
    };
  }, [taskValue, duration, riskTier]);

  /* Validation pressure */
  const pressure = useMemo(() => ({
    approvalThreshold: riskTier === "standard" ? 3 : riskTier === "elevated" ? 5 : 7,
    disapprovalThreshold: riskTier === "standard" ? 2 : riskTier === "elevated" ? 3 : 4,
    quorum: riskTier === "standard" ? 5 : riskTier === "elevated" ? 7 : 10,
    slashSeverity: riskTier === "standard" ? 2.5 : riskTier === "elevated" ? 5.0 : 10.0,
    maxSlash: 10,
  }), [riskTier]);

  return (
    <section className="py-16 sm:py-32 px-4 relative">
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="max-w-7xl mx-auto relative">
        {/* Section header */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-1.5 bg-white" />
            <span className="text-[10px] font-medium text-zinc-300/40 tracking-wider">MISSION ECONOMICS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal text-white/90 tracking-tight mb-3">
            Know Your Exposure<span className="text-zinc-300">.</span>
          </h2>
          <p className="text-white/25 max-w-xl text-sm leading-relaxed">
            Calculate exact economic exposure before any on-chain action. Bond requirements, payout splits, burn rates, and validator pressure, all derived from live protocol parameters.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Left: Input Controls ─────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-6">
            {/* Task Value */}
            <div className="border border-white/[0.04] bg-white/[0.015] p-5 rounded">
              <label className="text-[10px] font-medium text-white/25 tracking-wider block mb-3">TASK VALUE ($AEGIS)</label>
              <input
                type="range"
                min={100}
                max={50000}
                step={100}
                value={taskValue}
                onChange={(e) => setTaskValue(Number(e.target.value))}
                className="w-full h-1.5 bg-white/[0.04] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-medium text-white/15">100</span>
                <span className="text-lg font-normal text-zinc-300">{taskValue.toLocaleString()}</span>
                <span className="text-[10px] font-medium text-white/15">50,000</span>
              </div>
            </div>

            {/* Duration */}
            <div className="border border-white/[0.04] bg-white/[0.015] p-5 rounded">
              <label className="text-[10px] font-medium text-white/25 tracking-wider block mb-3">EXECUTION DURATION (SEC)</label>
              <input
                type="range"
                min={30}
                max={3600}
                step={30}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-1.5 bg-white/[0.04] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-medium text-white/15">30s</span>
                <span className="text-lg font-normal text-white/70">{duration >= 60 ? `${Math.floor(duration / 60)}m ${duration % 60}s` : `${duration}s`}</span>
                <span className="text-[10px] font-medium text-white/15">60m</span>
              </div>
            </div>

            {/* Risk Tier */}
            <div className="border border-white/[0.04] bg-white/[0.015] p-5 rounded">
              <label className="text-[10px] font-medium text-white/25 tracking-wider block mb-3">RISK CLASSIFICATION</label>
              <div className="grid grid-cols-3 gap-2">
                {(["standard", "elevated", "critical"] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setRiskTier(tier)}
                    className={`py-2.5 text-[10px] font-medium tracking-wider border transition-all ${
                      riskTier === tier
                        ? tier === "standard" ? "border-white/40 bg-white/10 text-zinc-300"
                          : tier === "elevated" ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                          : "border-red-500/40 bg-red-500/10 text-red-400"
                        : "border-white/[0.04] text-white/20 hover:text-white/40 hover:border-white/[0.08]"
                    }`}
                  >
                    {tier.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-[9px] font-medium text-white/15 mt-2">
                {riskTier === "standard" ? "Low-stakes tasks. Minimal bonding." :
                 riskTier === "elevated" ? "Moderate risk. 1.5x bond multiplier." :
                 "High-value ops. 2.5x bond + extended validation."}
              </p>
            </div>

            {/* Bond Summary */}
            <div className="border border-white/[0.04] bg-white/[0.015] p-5">
              <div className="text-[10px] font-medium text-zinc-300/40 tracking-wider mb-4">BOND REQUIREMENTS</div>
              <div className="space-y-3">
                {[
                  { label: "OPERATOR BOND", value: economics.operatorBond, desc: "Locked on assignment" },
                  { label: "VALIDATOR BOND", value: economics.validatorBond, desc: "Per validator stake" },
                  { label: "DISPUTE BOND", value: economics.disputeBond, desc: "Required to challenge" },
                ].map((b) => (
                  <div key={b.label} className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-medium text-white/35 tracking-wider">{b.label}</div>
                      <div className="text-[8px] text-white/15">{b.desc}</div>
                    </div>
                    <div className="text-sm font-normal text-white/70">{b.value.toFixed(0)} <span className="text-[9px] text-white/25">$AEGIS</span></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white/[0.04] flex justify-between">
                <span className="text-[10px] font-medium text-white/25">EST. SETTLEMENT</span>
                <span className="text-sm text-zinc-300/60">{economics.settlementTime.toFixed(0)}s</span>
              </div>
            </div>
          </div>

          {/* ── Center: Payout Flow ──────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-6">
            {/* Payout flow header */}
            <div className="border border-white/[0.04] bg-white/[0.015] p-5 rounded">
              <div className="flex items-center justify-between mb-5">
                <div className="text-[10px] font-medium text-white/25 tracking-wider">PAYOUT FLOW</div>
                <div className="text-[9px] font-medium text-white/15">
                  PROTOCOL FEE: <span className="text-zinc-300/60">2.5%</span>
                </div>
              </div>

              {/* Flow visualization */}
              <div className="relative mb-6">
                {/* Source */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.04]">
                  <div className="w-8 h-8 border border-white/[0.04] bg-white/[0.015] flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  </div>
                  <div>
                    <div className="text-xs text-white/50">INVOKING AGENT</div>
                    <div className="text-lg font-normal text-white/80">{taskValue.toLocaleString()} <span className="text-xs text-white/25">$AEGIS</span></div>
                  </div>
                </div>

                {/* Flow bars */}
                <div className="space-y-4">
                  <FlowBar
                    label="OPERATOR PAYOUT"
                    amount={`${economics.operatorPayout.toFixed(0)} $AEGIS`}
                    pct={(economics.operatorPayout / taskValue) * 100}
                    color="#A1A1AA"
                    delay={0}
                  />
                  <FlowBar
                    label="TOKEN BURN"
                    amount={`${economics.burnAmount.toFixed(0)} $AEGIS`}
                    pct={(economics.burnAmount / taskValue) * 100}
                    color="#FF6B6B"
                    delay={150}
                  />
                  <FlowBar
                    label="PROTOCOL TREASURY"
                    amount={`${economics.treasuryAmount.toFixed(0)} $AEGIS`}
                    pct={(economics.treasuryAmount / taskValue) * 100}
                    color="#A1A1AA"
                    delay={300}
                  />
                  <FlowBar
                    label="VALIDATOR REWARDS"
                    amount={`${economics.validatorRewards.toFixed(0)} $AEGIS`}
                    pct={(economics.validatorRewards / taskValue) * 100}
                    color="#FFD93D"
                    delay={450}
                  />
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.04]">
                <div className="text-center">
                  <div className="text-lg font-normal text-[#FF6B6B]">{economics.netBurnRate.toFixed(1)}%</div>
                  <div className="text-[8px] text-white/20 tracking-wider">BURN RATE</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-normal text-zinc-300">97.5%</div>
                  <div className="text-[8px] text-white/20 tracking-wider">OPERATOR NET</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-normal text-zinc-300">{(economics.treasuryAmount + economics.validatorRewards).toFixed(0)}</div>
                  <div className="text-[8px] text-white/20 tracking-wider">PROTOCOL REV</div>
                </div>
              </div>
            </div>

            {/* Cumulative burn projection */}
            <div className="border border-white/[0.04] bg-white/[0.015] p-5 rounded">
              <div className="text-[10px] font-medium text-white/25 tracking-wider mb-4">CUMULATIVE BURN PROJECTION</div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "DAILY", txs: 10000, burn: economics.burnAmount * 10000 },
                  { label: "WEEKLY", txs: 70000, burn: economics.burnAmount * 70000 },
                  { label: "MONTHLY", txs: 300000, burn: economics.burnAmount * 300000 },
                  { label: "YEARLY", txs: 3650000, burn: economics.burnAmount * 3650000 },
                ].map((p) => (
                  <div key={p.label} className="text-center">
                    <div className="text-xs font-normal text-[#FF6B6B]/80">{p.burn >= 1000000 ? `${(p.burn / 1000000).toFixed(1)}M` : p.burn >= 1000 ? `${(p.burn / 1000).toFixed(0)}K` : p.burn.toFixed(0)}</div>
                    <div className="text-[8px] text-white/15 mt-0.5">{p.label}</div>
                    <div className="text-[7px] text-white/10">{p.txs >= 1000000 ? `${(p.txs / 1000000).toFixed(1)}M txs` : `${(p.txs / 1000).toFixed(0)}K txs`}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Validation Pressure ───────────────────────────── */}
          <div className="lg:col-span-3 space-y-6">
            <div className="border border-white/[0.04] bg-white/[0.015] p-5 rounded">
              <div className="text-[10px] font-medium text-white/25 tracking-wider mb-6">VALIDATION PRESSURE</div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <GaugeArc
                  value={pressure.approvalThreshold}
                  max={pressure.quorum}
                  label="APPROVAL THRESHOLD"
                  color="#A1A1AA"
                  size={110}
                />
                <GaugeArc
                  value={pressure.disapprovalThreshold}
                  max={pressure.quorum}
                  label="DISAPPROVAL THRESHOLD"
                  color="#FF6B6B"
                  size={110}
                />
              </div>

              <div className="space-y-4">
                {/* Quorum */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] font-medium text-white/30">VOTE QUORUM</span>
                    <span className="text-[10px] font-medium text-white/50">{pressure.quorum} validators</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all" style={{ width: `${(pressure.quorum / 10) * 100}%` }} />
                  </div>
                </div>

                {/* Slash severity */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] font-medium text-white/30">SLASH SEVERITY</span>
                    <span className="text-[10px] font-medium text-white/50">{pressure.slashSeverity.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF6B6B] rounded-full transition-all" style={{ width: `${(pressure.slashSeverity / pressure.maxSlash) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Pressure summary */}
              <div className="mt-5 pt-4 border-t border-white/[0.04]">
                <div className="text-[9px] font-medium text-white/15 leading-relaxed">
                  {riskTier === "standard"
                    ? "Standard validation. 3 approvals needed from 5 validators. Low slash exposure."
                    : riskTier === "elevated"
                    ? "Elevated scrutiny. 5 approvals from 7 validators. Moderate slash risk."
                    : "Maximum validation pressure. 7 approvals from 10 validators. High slash severity."}
                </div>
              </div>
            </div>

            {/* Risk matrix */}
            <div className="border border-white/[0.04] bg-white/[0.015] p-5 rounded">
              <div className="text-[10px] font-medium text-white/25 tracking-wider mb-4">RISK MATRIX</div>
              <div className="space-y-2">
                {[
                  { label: "Bond exposure", value: ((economics.operatorBond / taskValue) * 100).toFixed(1) + "%", risk: economics.operatorBond / taskValue > 0.1 ? "high" : economics.operatorBond / taskValue > 0.06 ? "med" : "low" },
                  { label: "Validator coverage", value: pressure.quorum + " nodes", risk: pressure.quorum >= 7 ? "low" : pressure.quorum >= 5 ? "med" : "high" },
                  { label: "Settlement window", value: economics.settlementTime.toFixed(0) + "s", risk: economics.settlementTime > 60 ? "high" : economics.settlementTime > 30 ? "med" : "low" },
                  { label: "Dispute cost", value: economics.disputeBond.toFixed(0) + " $AEGIS", risk: economics.disputeBond > 2000 ? "high" : economics.disputeBond > 500 ? "med" : "low" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between py-1.5">
                    <span className="text-[10px] font-medium text-white/30">{r.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-white/50">{r.value}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        r.risk === "low" ? "bg-white" : r.risk === "med" ? "bg-amber-400" : "bg-red-400"
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
