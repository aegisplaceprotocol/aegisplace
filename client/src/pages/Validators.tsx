import ComingSoon from "@/components/ComingSoon";
import { useState, useMemo, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";

/* ── Animated counter ──────────────────────────────────────────────────── */
function AnimNum({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!vis) return;
    const duration = 1200;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [vis, value]);

  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

/* ── Score bar ─────────────────────────────────────────────────────────── */
function ScoreBar({ score }: { score: number }) {
  const pct = score;
  const color = score >= 80 ? "rgb(161,161,170)" : score >= 60 ? "rgb(250,204,21)" : score >= 40 ? "rgb(96,165,250)" : "rgb(107,114,128)";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] font-medium" style={{ color }}>{score}</span>
    </div>
  );
}

/* ── Tier from stake amount ──────────────────────────────────────────── */
function getTier(stakeLamports: number) {
  if (stakeLamports >= 250_000_000_000) return "Grandmaster";
  if (stakeLamports >= 50_000_000_000) return "Master";
  if (stakeLamports >= 12_500_000_000) return "Journeyman";
  return "Apprentice";
}

function tierStyle(tier: string) {
  switch (tier) {
    case "Grandmaster": return { text: "text-zinc-200", bg: "bg-zinc-700/20", border: "border-zinc-500/30", badge: "Grandmaster" };
    case "Master": return { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/25", badge: "Master" };
    case "Journeyman": return { text: "text-zinc-300", bg: "bg-zinc-600/15", border: "border-zinc-500/20", badge: "Journeyman" };
    case "Apprentice": return { text: "text-zinc-400", bg: "bg-zinc-700/10", border: "border-zinc-600/15", badge: "Apprentice" };
    default: return { text: "text-zinc-500", bg: "bg-zinc-800/10", border: "border-white/[0.06]/10", badge: tier };
  }
}

/* ── Staking tier cards ──────────────────────────────────────────────── */
const STAKING_TIERS = [
  {
    tier: "Apprentice",
    bond: "2,500",
    bondNum: 2500,
    apy: "8.2%",
    maxOperators: 5,
    slashRisk: "2%",
    requirements: ["Wallet with 2,500 $AEGIS", "Complete validator quiz", "No prior slashing events"],
    perks: ["Validate up to 5 operators", "Basic reputation badge", "Community Discord access"],
  },
  {
    tier: "Journeyman",
    bond: "12,500",
    bondNum: 12500,
    apy: "12.5%",
    maxOperators: 25,
    slashRisk: "3%",
    requirements: ["6+ months as Apprentice", "50+ successful validations", "Score above 60"],
    perks: ["Validate up to 25 operators", "Priority dispute arbitration", "Governance voting rights", "Validator API access"],
  },
  {
    tier: "Master",
    bond: "50,000",
    bondNum: 50000,
    apy: "18.0%",
    maxOperators: 100,
    slashRisk: "5%",
    requirements: ["12+ months as Journeyman", "200+ successful validations", "Score above 75", "Community endorsement (3 Masters)"],
    perks: ["Validate up to 100 operators", "Dispute resolution committee", "Revenue share on validated operators", "Custom validator page", "Direct protocol team access"],
  },
  {
    tier: "Grandmaster",
    bond: "250,000",
    bondNum: 250000,
    apy: "24.0%",
    maxOperators: -1,
    slashRisk: "8%",
    requirements: ["24+ months as Master", "1,000+ successful validations", "Score above 90", "Protocol governance approval"],
    perks: ["Unlimited operator validation", "Protocol governance seat", "Fee tier override authority", "Emergency pause rights", "Quarterly protocol revenue share", "Validator mentorship program lead"],
  },
];

/* ── Onboarding steps ──────────────────────────────────────────────────── */
const ONBOARDING_STEPS = [
  {
    step: 1,
    title: "Acquire $AEGIS",
    description: "Purchase $AEGIS tokens on Jupiter, Raydium, or any supported Solana DEX. Minimum 2,500 $AEGIS required for Apprentice tier.",
    command: "# Swap SOL for $AEGIS on Jupiter\nagent-aegis swap --from SOL --to AEGIS --amount 2500",
    duration: "5 minutes",
  },
  {
    step: 2,
    title: "Register as Validator",
    description: "Register your Solana wallet as a validator node on the Aegis Protocol. This creates your on-chain validator identity.",
    command: "# Register validator identity\nagent-aegis validator register --wallet <YOUR_WALLET>\n\n# Verify registration\nagent-aegis validator status",
    duration: "2 minutes",
  },
  {
    step: 3,
    title: "Bond $AEGIS Stake",
    description: "Lock your $AEGIS tokens in the bonding contract. Tokens are locked for the duration of your validation activity. Slashing applies for malicious or negligent validation.",
    command: "# Bond tokens to Apprentice tier\nagent-aegis validator bond --amount 2500 --tier Apprentice\n\n# Check bond status\nagent-aegis validator bond-status",
    duration: "1 minute",
  },
  {
    step: 4,
    title: "Complete Validator Quiz",
    description: "Pass the validator competency assessment covering operator evaluation criteria, dispute resolution procedures, and slashing conditions.",
    command: "# Start the validator quiz\nagent-aegis validator quiz --start\n\n# 15 questions, 80% pass rate required\n# Topics: operator evaluation, x402 payments, dispute resolution",
    duration: "15 minutes",
  },
  {
    step: 5,
    title: "Begin Validating",
    description: "Browse pending operators in the validation queue, run them in sandboxed environments, and submit your attestation. Each successful validation earns staking rewards.",
    command: "# View pending validation queue\nagent-aegis validator queue\n\n# Validate a specific operator\nagent-aegis validator attest <OPERATOR_SLUG> --sandbox --report\n\n# Check your earnings\nagent-aegis validator rewards",
    duration: "Ongoing",
  },
];

/* ── Main component ────────────────────────────────────────────────────── */
export default function Validators() {
  return <ComingSoon title="Validators" description="Validator registration, staking, and attestation rewards." />;
}

function _Validators() {
  const [sortBy, setSortBy] = useState<"reputation" | "stake" | "validated" | "newest">("reputation");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [activeOnboardStep, setActiveOnboardStep] = useState(0);
  const [copied, setCopied] = useState(-1);

  // Fetch real validators from backend
  const { data: validatorData, isLoading } = trpc.validator.list.useQuery({
    sortBy,
    limit: 100,
    status: "active",
  });

  // Fetch protocol stats
  const { data: stats } = trpc.stats.overview.useQuery();

  const validators = validatorData?.validators || [];

  const filtered = useMemo(() => {
    if (filterTier === "all") return validators;
    return validators.filter((v: any) => getTier(v.stakeLamports) === filterTier);
  }, [validators, filterTier]);

  /* Stats */
  const totalBonded = validators.reduce((s: number, v: any) => s + (v.stakeLamports || 0), 0);
  const totalValidated = validators.reduce((s: number, v: any) => s + (v.validatedCount || 0), 0);
  const avgScore = validators.length > 0 ? validators.reduce((s: number, v: any) => s + (v.reputationScore || 0), 0) / validators.length : 0;
  const grandmasters = validators.filter((v: any) => getTier(v.stakeLamports) === "Grandmaster").length;

  const handleCopy = (idx: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(idx);
    setTimeout(() => setCopied(-1), 2000);
  };

  const formatStake = (lamports: number) => {
    if (lamports >= 1_000_000_000) return `${(lamports / 1_000_000_000).toFixed(1)}B`;
    if (lamports >= 1_000_000) return `${(lamports / 1_000_000).toFixed(1)}M`;
    if (lamports >= 1_000) return `${(lamports / 1_000).toFixed(1)}K`;
    return lamports.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-white/[0.02]">
      <Navbar />

      {/* ── Hero Stats ──────────────────────────────────────────────── */}
      <section className="pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 text-[11px] font-medium text-zinc-500 bg-zinc-800/40 border border-white/[0.06]/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
            Validator Network
          </span>

          <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-normal text-white leading-[1.05] tracking-tight max-w-3xl">
            The corps that<br />secures the protocol
          </h1>

          <p className="mt-5 text-zinc-500 text-lg max-w-2xl leading-relaxed">
            Every operator in the Aegis registry is attested by bonded validators who stake $AEGIS against their reputation. Rank up from Apprentice to Grandmaster. Negligent validation triggers slashing.
          </p>

          {/* Stat grid */}
          <div className="mt-14 grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: "Active Validators", value: <AnimNum value={stats?.totalValidators || validators.length} /> },
              { label: "Total Bonded", value: <><AnimNum value={totalBonded} /> <span className="text-zinc-500 text-sm">lamports</span></> },
              { label: "Total Attestations", value: <AnimNum value={totalValidated} /> },
              { label: "Avg Score", value: <span>{avgScore.toFixed(1)}<span className="text-zinc-600">/100</span></span> },
              { label: "Grandmasters", value: <AnimNum value={grandmasters} /> },
            ].map((stat, i) => (
              <div key={i} className="bg-white/[0.02]/50 border border-white/[0.06]/50 rounded p-5">
                <div className="text-[11px] font-medium text-zinc-500 mb-1.5">{stat.label}</div>
                <div className="text-[22px] font-normal text-zinc-200 tracking-tight">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leaderboard ─────────────────────────────────────────────── */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <span className="text-[11px] font-medium text-zinc-500 mb-2 block">Leaderboard</span>
              <h2 className="text-3xl font-normal text-white tracking-tight">
                Corps Rankings
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {["all", "Grandmaster", "Master", "Journeyman", "Apprentice"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterTier(t)}
                  className={`text-[11px] font-medium px-3 py-1.5 rounded border transition-all duration-200 ${
                    filterTier === t
                      ? "border-zinc-600 text-zinc-200 bg-zinc-800/60"
                      : "border-white/[0.06]/50 text-zinc-500 hover:text-zinc-300 hover:border-white/[0.06]"
                  }`}
                >
                  {t === "all" ? "All" : t}
                </button>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="border border-white/[0.06]/50 rounded p-12 text-center">
              <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Loading validators...</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filtered.length === 0 && (
            <div className="border border-white/[0.06]/50 rounded p-12 text-center">
              <p className="text-zinc-500 text-sm">
                {filterTier !== "all"
                  ? `No ${filterTier} validators found.`
                  : "No active validators yet. Be the first to register."}
              </p>
            </div>
          )}

          {/* Table */}
          {!isLoading && filtered.length > 0 && (
            <>
              <div className="border border-white/[0.06]/50 rounded overflow-hidden">
                {/* Header */}
                <div className="hidden lg:grid grid-cols-[3rem_1fr_8rem_7rem_6rem_6rem_7rem] gap-0 bg-white/[0.02]/40 border-b border-white/[0.06]/40 px-5 py-3">
                  <div className="text-[10px] font-medium text-zinc-500">#</div>
                  <div className="text-[10px] font-medium text-zinc-500">Validator</div>
                  <button onClick={() => setSortBy("stake")} className={`text-[10px] font-medium text-left transition-colors ${sortBy === "stake" ? "text-zinc-300" : "text-zinc-500 hover:text-zinc-300"}`}>
                    Stake {sortBy === "stake" && "\u2193"}
                  </button>
                  <button onClick={() => setSortBy("reputation")} className={`text-[10px] font-medium text-left transition-colors ${sortBy === "reputation" ? "text-zinc-300" : "text-zinc-500 hover:text-zinc-300"}`}>
                    Score {sortBy === "reputation" && "\u2193"}
                  </button>
                  <button onClick={() => setSortBy("validated")} className={`text-[10px] font-medium text-left transition-colors ${sortBy === "validated" ? "text-zinc-300" : "text-zinc-500 hover:text-zinc-300"}`}>
                    Validated {sortBy === "validated" && "\u2193"}
                  </button>
                  <div className="text-[10px] font-medium text-zinc-500">Slashed</div>
                  <div className="text-[10px] font-medium text-zinc-500">Status</div>
                </div>

                {/* Rows */}
                {filtered.map((v: any, i: number) => {
                  const tier = getTier(v.stakeLamports);
                  const ts = tierStyle(tier);
                  return (
                    <div
                      key={v.id}
                      className="grid grid-cols-1 lg:grid-cols-[3rem_1fr_8rem_7rem_6rem_6rem_7rem] gap-2 lg:gap-0 px-5 py-3.5 border-b border-white/[0.06]/20 hover:bg-zinc-800/20 transition-colors group"
                    >
                      <div className="text-[12px] font-medium text-zinc-600 hidden lg:block">{i + 1}</div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
                            {v.name || `Validator #${v.id}`}
                          </span>
                          <span className="text-[10px] text-zinc-600 font-mono">
                            {v.wallet.slice(0, 6)}...{v.wallet.slice(-4)}
                          </span>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${ts.text} ${ts.bg} ${ts.border}`}>
                          {ts.badge}
                        </span>
                      </div>
                      <div className="text-[13px] font-medium text-zinc-400">{formatStake(v.stakeLamports)}</div>
                      <ScoreBar score={v.reputationScore} />
                      <div className="text-[13px] font-medium text-zinc-500">{v.validatedCount}</div>
                      <div className="text-[13px] font-medium text-zinc-500">{v.slashedCount}</div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          v.status === "active" ? "bg-emerald-500/70" : v.status === "slashed" ? "bg-red-500/70" : "bg-zinc-600"
                        }`} />
                        <span className="text-[11px] text-zinc-500 capitalize">{v.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 text-[11px] font-medium text-zinc-600">
                Showing {filtered.length} of {validatorData?.total || validators.length} validators.
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Staking Economics ───────────────────────────────────────── */}
      <section className="py-20 border-t border-white/[0.06]/30">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <span className="text-[11px] font-medium text-zinc-500 mb-2 block">Economics</span>
          <h2 className="text-3xl font-normal text-white tracking-tight">
            Rank up. Earn more.
          </h2>
          <p className="mt-4 text-zinc-500 max-w-2xl leading-relaxed">
            Validators bond $AEGIS proportional to their rank. Higher ranks unlock more validation capacity, higher APY, and governance authority. Slashing is real. Negligent or malicious validation forfeits a percentage of your bond.
          </p>

          {/* Tier cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {STAKING_TIERS.map((t) => {
              const ts = tierStyle(t.tier);
              return (
                <div key={t.tier} className="bg-white/[0.02]/40 border border-white/[0.06]/40 rounded p-6 flex flex-col">
                  {/* Tier badge */}
                  <div className="flex items-center justify-between mb-5">
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded border ${ts.text} ${ts.bg} ${ts.border}`}>
                      {ts.badge}
                    </span>
                    <span className="text-[10px] font-medium text-zinc-600">Tier {STAKING_TIERS.indexOf(t) + 1}/4</span>
                  </div>

                  {/* Bond amount */}
                  <div className="mb-6">
                    <div className="text-[11px] font-medium text-zinc-500 mb-1">Bond Required</div>
                    <div className={`text-2xl font-normal tracking-tight ${ts.text}`}>
                      {t.bond} <span className="text-sm opacity-50">$AEGIS</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div>
                      <div className="text-[10px] font-medium text-zinc-600">APY</div>
                      <div className="text-[15px] font-normal text-zinc-300 mt-0.5">{t.apy}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-zinc-600">Max Ops</div>
                      <div className="text-[15px] font-normal text-zinc-400 mt-0.5">{t.maxOperators === -1 ? "\u221E" : t.maxOperators}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-zinc-600">Slash</div>
                      <div className="text-[15px] font-normal text-red-400/70 mt-0.5">{t.slashRisk}</div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="mb-5">
                    <div className="text-[10px] font-medium text-zinc-500 mb-2">Requirements</div>
                    {t.requirements.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <span className="text-zinc-600 text-[10px] mt-0.5">-</span>
                        <span className="text-[11px] text-zinc-500 leading-relaxed">{r}</span>
                      </div>
                    ))}
                  </div>

                  {/* Perks */}
                  <div className="mt-auto">
                    <div className="text-[10px] font-medium text-zinc-500 mb-2">Perks</div>
                    {t.perks.map((p, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <span className={`text-[10px] mt-0.5 ${ts.text} opacity-60`}>+</span>
                        <span className="text-[11px] text-zinc-400 leading-relaxed">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Economics breakdown */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="bg-white/[0.02]/40 border border-white/[0.06]/40 rounded p-6">
              <div className="text-[11px] font-medium text-zinc-500 mb-4">Reward Distribution</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-zinc-500">Validator reward per attestation</span>
                  <span className="text-[13px] font-medium text-zinc-300">0.5% of operator fee</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-zinc-500">Dispute resolution bonus</span>
                  <span className="text-[13px] font-medium text-zinc-300">2.0% of disputed amount</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-zinc-500">Staking APY (weighted avg)</span>
                  <span className="text-[13px] font-medium text-zinc-300">15.7%</span>
                </div>
              </div>
            </div>
            <div className="bg-white/[0.02]/40 border border-white/[0.06]/40 rounded p-6">
              <div className="text-[11px] font-medium text-zinc-500 mb-4">Slashing Conditions</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-zinc-500">Approving malicious operator</span>
                  <span className="text-[13px] font-medium text-red-400/70">100% bond</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-zinc-500">Negligent validation</span>
                  <span className="text-[13px] font-medium text-red-400/70">25% bond</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-zinc-500">Inactivity (30+ days)</span>
                  <span className="text-[13px] font-medium text-amber-400/70">5% bond</span>
                </div>
              </div>
            </div>
            <div className="bg-white/[0.02]/40 border border-white/[0.06]/40 rounded p-6">
              <div className="text-[11px] font-medium text-zinc-500 mb-4">Protocol Economics</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-zinc-500">Total staked</span>
                  <span className="text-[13px] font-medium text-zinc-300">{formatStake(totalBonded)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-zinc-500">Active validators</span>
                  <span className="text-[13px] font-medium text-zinc-300">{stats?.totalValidators || validators.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-zinc-500">Open disputes</span>
                  <span className="text-[13px] font-medium text-zinc-300">{stats?.openDisputes || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Become a Validator ──────────────────────────────────────── */}
      <section className="py-20 border-t border-white/[0.06]/30">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <span className="text-[11px] font-medium text-zinc-500 mb-2 block">Onboarding</span>
          <h2 className="text-3xl font-normal text-white tracking-tight">
            Become a Validator
          </h2>
          <p className="mt-4 text-zinc-500 max-w-2xl leading-relaxed">
            Five steps from zero to earning. Bond $AEGIS, pass the quiz, start validating. The entire process takes under 30 minutes.
          </p>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
            {/* Step selector */}
            <div className="flex flex-col gap-1">
              {ONBOARDING_STEPS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveOnboardStep(i)}
                  className={`text-left p-4 rounded transition-all duration-200 ${
                    activeOnboardStep === i
                      ? "bg-zinc-800/40 border border-white/[0.06]/40"
                      : "bg-transparent border border-transparent hover:bg-zinc-800/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-medium w-6 h-6 flex items-center justify-center rounded border ${
                      activeOnboardStep === i
                        ? "border-zinc-500 text-zinc-200 bg-zinc-700/30"
                        : "border-white/[0.06] text-zinc-500"
                    }`}>
                      {s.step}
                    </span>
                    <span className={`text-[12px] font-medium ${
                      activeOnboardStep === i ? "text-zinc-200" : "text-zinc-500"
                    }`}>
                      {s.title}
                    </span>
                  </div>
                  <div className={`mt-1.5 ml-9 text-[10px] font-medium ${
                    activeOnboardStep === i ? "text-zinc-500" : "text-zinc-700"
                  }`}>
                    {s.duration}
                  </div>
                </button>
              ))}
            </div>

            {/* Step detail */}
            <div className="border border-white/[0.06]/50 bg-white/[0.02]/30 rounded overflow-hidden">
              <div className="p-6 border-b border-white/[0.06]/30">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-medium text-zinc-500">
                    Step {ONBOARDING_STEPS[activeOnboardStep].step} of {ONBOARDING_STEPS.length}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-600">
                    {ONBOARDING_STEPS[activeOnboardStep].duration}
                  </span>
                </div>
                <h3 className="text-xl font-normal text-white tracking-tight">
                  {ONBOARDING_STEPS[activeOnboardStep].title}
                </h3>
                <p className="mt-3 text-[13px] text-zinc-500 leading-relaxed">
                  {ONBOARDING_STEPS[activeOnboardStep].description}
                </p>
              </div>

              {/* Code block */}
              <div className="relative">
                <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.06]/30 bg-white/[0.02]/50">
                  <span className="text-[10px] font-medium text-zinc-600">Terminal</span>
                  <button
                    onClick={() => handleCopy(activeOnboardStep, ONBOARDING_STEPS[activeOnboardStep].command)}
                    className="text-[10px] font-medium text-zinc-500 hover:text-zinc-200 transition-colors px-2.5 py-1 border border-white/[0.06]/40 hover:border-zinc-600 rounded"
                  >
                    {copied === activeOnboardStep ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="p-5 text-[12px] font-mono leading-[1.8] text-zinc-400 overflow-x-auto">
                  {ONBOARDING_STEPS[activeOnboardStep].command.split("\n").map((line, i) => (
                    <div key={i} className={line.startsWith("#") ? "text-zinc-600" : ""}>
                      {!line.startsWith("#") && !line.startsWith("\n") && line.trim() !== "" && (
                        <span className="text-zinc-500 mr-2">$</span>
                      )}
                      {line}
                    </div>
                  ))}
                </pre>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between p-5 border-t border-white/[0.06]/30">
                <button
                  onClick={() => setActiveOnboardStep(Math.max(0, activeOnboardStep - 1))}
                  disabled={activeOnboardStep === 0}
                  className="text-[11px] font-medium text-zinc-500 hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex gap-1.5">
                  {ONBOARDING_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        i === activeOnboardStep ? "bg-zinc-300" : i < activeOnboardStep ? "bg-zinc-600" : "bg-zinc-800"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setActiveOnboardStep(Math.min(ONBOARDING_STEPS.length - 1, activeOnboardStep + 1))}
                  disabled={activeOnboardStep === ONBOARDING_STEPS.length - 1}
                  className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  Next Step
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-white/[0.06]/30">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-normal text-white tracking-tight">
            Ready to secure the protocol?
          </h2>
          <p className="mt-3 text-zinc-500 text-sm max-w-lg mx-auto">
            Validators are the backbone of Aegis. Every operator you attest makes the network safer for every agent that uses it.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <a
              href="/playground"
              className="text-[13px] font-normal bg-white text-zinc-900 px-7 py-3 hover:bg-zinc-200 transition-colors rounded"
            >
              Try the Playground
            </a>
            <a
              href="/docs#staking"
              className="text-[13px] font-medium border border-white/[0.06]/40 text-zinc-400 px-7 py-3 hover:border-zinc-600 hover:text-zinc-200 transition-all rounded"
            >
              Read Staking Docs
            </a>
          </div>
        </div>
      </section>

      <div className="h-20" />
    </div>
  );
}
