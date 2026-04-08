import ComingSoon from "@/components/ComingSoon";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import RequireWallet from "@/components/RequireWallet";
import { trpc } from "@/lib/trpc";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@/components/WalletModal";

/* -- Animated rolling number ------------------------------------------------ */
function AnimNum({ value, prefix = "", suffix = "", decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const dur = 1200;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / dur, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setDisplay(ease * value);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {prefix}{decimals > 0 ? display.toFixed(decimals) : Math.floor(display).toLocaleString()}{suffix}
    </span>
  );
}

/* -- Helpers ---------------------------------------------------------------- */
function timeAgo(date: Date | string): string {
  const now = Date.now();
  const d = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function trustColor(score: number) {
  if (score >= 80) return "#A1A1AA";
  if (score >= 60) return "#71717A";
  if (score >= 40) return "#eab308";
  return "rgba(220,100,60,0.50)";
}

function categoryLabel(cat: string) {
  return cat.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/* -- Main Page -------------------------------------------------------------- */
export default function MyOperators() {
  return <ComingSoon title="My Operators" description="Manage your registered operators and track performance." />;
}

function _MyOperators() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const walletAddress = publicKey?.toBase58() || "";

  // Fetch operators by creator wallet
  const { data: operators, isLoading, refetch } = trpc.operator.byCreator.useQuery(
    { walletAddress },
    { enabled: !!walletAddress }
  );

  // Aggregate stats
  const totalInvocations = operators?.reduce((sum, op) => sum + (op.totalInvocations || 0), 0) || 0;
  const totalEarnings = operators?.reduce((sum, op) => sum + parseFloat(op.totalEarned || "..."), 0) || 0;
  const avgTrust = operators?.length
    ? Math.round(operators.reduce((sum, op) => sum + op.qualityScore, 0) / operators.length)
    : 0;
  const activeCount = operators?.filter(op => op.isActive).length || 0;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <RequireWallet>
    <div className="min-h-screen bg-[#0A0A0B]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 border-b border-white/[0.04]">
        <div className="mx-auto max-w-[1520px] px-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-medium text-zinc-300/60 bg-white/[0.04] border border-white/[0.10] px-3 py-1 rounded-full">
              CREATOR DASHBOARD
            </span>
            {connected && (
              <span className="text-[10px] font-medium text-white/20">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight leading-[0.95] mb-4">
            <span className="text-white/90">MY</span>{" "}
            <span className="text-white/30">OPERATORS</span>
          </h1>
          <p className="text-[15px] text-white/35 max-w-lg">
            Track your registered operators, monitor invocation volume, and watch your earnings grow in real time.
          </p>
        </div>
      </section>

      {/* Not connected state */}
      {!connected && (
        <section className="py-32">
          <div className="mx-auto max-w-[1520px] px-12">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-20 h-20 mx-auto mb-8 border border-white/[0.08] bg-white/[0.02] flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="14" rx="2" />
                  <path d="M22 10H18a2 2 0 000 4h4" />
                  <circle cx="18" cy="12" r="1" fill="rgba(255,255,255,0.2)" />
                </svg>
              </div>
              <h2 className="text-2xl font-normal text-white/80 mb-4">Connect Your Wallet</h2>
              <p className="text-[14px] text-white/30 mb-8 leading-relaxed">
                Connect your Phantom wallet to view operators you have registered.
                Your wallet address is used to identify your creator account.
              </p>
              <button
                onClick={() => setVisible(true)}
                className="text-[13px] font-normal text-zinc-900 bg-white hover:bg-zinc-200 px-8 py-3.5 transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Connected: loading state */}
      {connected && isLoading && (
        <section className="py-32">
          <div className="mx-auto max-w-[1520px] px-12 text-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-[#A1A1AA] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[13px] text-white/30 ">Loading your operators...</p>
          </div>
        </section>
      )}

      {/* Connected: no operators */}
      {connected && !isLoading && (!operators || operators.length === 0) && (
        <section className="py-32">
          <div className="mx-auto max-w-[1520px] px-12">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-20 h-20 mx-auto mb-8 border border-white/[0.08] bg-white/[0.02] flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <h2 className="text-2xl font-normal text-white/80 mb-4">No Operators Yet</h2>
              <p className="text-[14px] text-white/30 mb-8 leading-relaxed">
                You have not registered any operators with this wallet.
                Upload your first operator to start earning from AI agent invocations.
              </p>
              <Link href="/submit">
                <span className="inline-block text-[13px] font-normal text-zinc-900 bg-white hover:bg-zinc-200 px-8 py-3.5 transition-colors cursor-pointer">
                  Register Your First Operator
                </span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Connected: has operators */}
      {connected && !isLoading && operators && operators.length > 0 && (
        <>
          {/* Stats overview */}
          <section className="border-b border-white/[0.04] bg-white/[0.01]">
            <div className="mx-auto max-w-[1520px] px-12 py-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.04]">
                <div className="bg-white/[0.02] p-6 md:p-8">
                  <div className="text-[28px] md:text-[36px] font-normal text-white/90 leading-none mb-2">
                    <AnimNum value={operators.length} />
                  </div>
                  <div className="text-[11px] text-white/30 tracking-wider">OPERATORS</div>
                </div>
                <div className="bg-white/[0.02] p-6 md:p-8">
                  <div className="text-[28px] md:text-[36px] font-normal text-white/90 leading-none mb-2">
                    <AnimNum value={totalInvocations} />
                  </div>
                  <div className="text-[11px] text-white/30 tracking-wider">TOTAL INVOCATIONS</div>
                </div>
                <div className="bg-white/[0.02] p-6 md:p-8">
                  <div className="text-[28px] md:text-[36px] font-normal text-zinc-300 leading-none mb-2">
                    $<AnimNum value={totalEarnings} decimals={2} />
                  </div>
                  <div className="text-[11px] text-zinc-300/40 tracking-wider">TOTAL EARNED (USDC)</div>
                </div>
                <div className="bg-white/[0.02] p-6 md:p-8">
                  <div className="text-[28px] md:text-[36px] font-normal leading-none mb-2" style={{ color: trustColor(avgTrust) }}>
                    <AnimNum value={avgTrust} />
                  </div>
                  <div className="text-[11px] text-white/30 tracking-wider">AVG quality score</div>
                </div>
              </div>
            </div>
          </section>

          {/* Operator list */}
          <section className="py-16">
            <div className="mx-auto max-w-[1520px] px-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-[13px] font-medium text-white/40 tracking-wider">
                  YOUR OPERATORS ({operators.length})
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => refetch()}
                    className="text-[11px] font-medium text-white/25 hover:text-white/50 border border-white/[0.04] rounded hover:border-white/[0.12] px-3 py-1.5 transition-all"
                  >
                    REFRESH
                  </button>
                  <Link href="/submit">
                    <span className="text-[11px] font-medium text-zinc-300/60 hover:text-zinc-300 border border-white/20 hover:border-white/40 px-3 py-1.5 transition-all cursor-pointer">
                      + NEW OPERATOR
                    </span>
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                {operators.map((op) => {
                  const successRate = op.totalInvocations > 0
                    ? ((op.successfulInvocations / op.totalInvocations) * 100).toFixed(1)
                    : "0.0";
                  const earnings = parseFloat(op.totalEarned || "...");

                  return (
                    <Link key={op.id} href={`/marketplace/${op.slug}`}>
                      <div className="group border border-white/[0.04] rounded hover:border-white/[0.12] bg-white/[0.01] hover:bg-white/[0.02] transition-all duration-300 cursor-pointer">
                        <div className="p-6">
                          {/* Top row: name, status, trust */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 border border-white/[0.08] bg-white/[0.02] flex items-center justify-center shrink-0">
                                <span className="text-[14px] font-normal text-zinc-300/60">
                                  {op.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-[15px] font-normal text-white/90 group-hover:text-zinc-300 transition-colors">
                                  {op.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-medium text-white/25">{op.slug}</span>
                                  <span className="text-[10px] font-medium text-white/15">|</span>
                                  <span className="text-[10px] font-medium text-white/25">{categoryLabel(op.category)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-medium px-2 py-0.5 border ${
                                op.isActive
                                  ? "text-white/60 border-white/[0.08] bg-white/[0.03]"
                                  : "text-white/25 border-white/[0.04] bg-white/[0.02]"
                              }`}>
                                {op.isActive ? "ACTIVE" : "INACTIVE"}
                              </span>
                              {op.isVerified && (
                                <span className="text-[10px] font-medium text-zinc-300/60 border border-white/20 bg-white/[0.04] px-2 py-0.5">
                                  VERIFIED
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stats row */}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                              <div className="text-[10px] font-medium text-white/20 mb-1">TRUST</div>
                              <div className="text-[16px] font-normal" style={{ color: trustColor(op.qualityScore) }}>
                                {op.qualityScore}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-medium text-white/20 mb-1">INVOCATIONS</div>
                              <div className="text-[16px] font-normal text-white/80 ">
                                {op.totalInvocations.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-medium text-white/20 mb-1">SUCCESS RATE</div>
                              <div className="text-[16px] font-normal text-white/80 ">
                                {successRate}%
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-medium text-white/20 mb-1">PRICE/CALL</div>
                              <div className="text-[16px] font-normal text-white/80 ">
                                ${parseFloat(op.pricePerCall).toFixed(4)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-medium text-zinc-300/30 mb-1">EARNED</div>
                              <div className="text-[16px] font-normal text-zinc-300 ">
                                ${earnings.toFixed(4)}
                              </div>
                            </div>
                          </div>

                          {/* Bottom: created date */}
                          <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                            <span className="text-[10px] font-medium text-white/15">
                              Registered {timeAgo(op.createdAt)}
                            </span>
                            <span className="text-[10px] font-medium text-white/15 group-hover:text-white/30 transition-colors">
                              View details &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Earnings breakdown */}
              <div className="mt-12 border border-white/[0.04] bg-white/[0.01] p-8">
                <h3 className="text-[13px] font-medium text-zinc-300/50 tracking-wider mb-6">EARNINGS BREAKDOWN</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border border-white/[0.04] bg-white/[0.02] p-5">
                    <div className="text-[10px] font-medium text-white/25 mb-2">GROSS REVENUE</div>
                    <div className="text-[22px] font-normal text-white/80 ">
                      ${(totalEarnings / 0.6).toFixed(4)}
                    </div>
                    <div className="text-[10px] font-medium text-white/15 mt-1">Total fees paid</div>
                  </div>
                  <div className="border border-white/15 bg-white/[0.03] p-5">
                    <div className="text-[10px] font-medium text-zinc-300/40 mb-2">CREATOR (85%)</div>
                    <div className="text-[22px] font-normal text-zinc-300 ">
                      ${totalEarnings.toFixed(4)}
                    </div>
                    <div className="text-[10px] font-medium text-zinc-300/20 mt-1">Your wallet</div>
                  </div>
                  <div className="border border-white/[0.04] bg-white/[0.02] p-5">
                    <div className="text-[10px] font-medium text-white/25 mb-2">VALIDATORS (15%)</div>
                    <div className="text-[22px] font-normal text-white/50 ">
                      ${((totalEarnings / 0.6) * 0.15).toFixed(4)}
                    </div>
                    <div className="text-[10px] font-medium text-white/15 mt-1">Quality attestors</div>
                  </div>
                  <div className="border border-white/[0.04] bg-white/[0.02] p-5">
                    <div className="text-[10px] font-medium text-white/25 mb-2">TREASURY (3%)</div>
                    <div className="text-[22px] font-normal text-white/50 ">
                      ${((totalEarnings / 0.6) * 0.12).toFixed(4)}
                    </div>
                    <div className="text-[10px] font-medium text-white/15 mt-1">Delegated stakers</div>
                  </div>
                  <div className="border border-white/[0.04] bg-white/[0.02] p-5">
                    <div className="text-[10px] font-medium text-white/25 mb-2">TREASURY (8%)</div>
                    <div className="text-[22px] font-normal text-white/50 ">
                      ${((totalEarnings / 0.6) * 0.08).toFixed(4)}
                    </div>
                    <div className="text-[10px] font-medium text-white/15 mt-1">Protocol fund</div>
                  </div>
                  <div className="border border-white/[0.04] bg-white/[0.02] p-5">
                    <div className="text-[10px] font-medium text-white/25 mb-2">INSURANCE (3%)</div>
                    <div className="text-[22px] font-normal text-white/50 ">
                      ${((totalEarnings / 0.6) * 0.03).toFixed(4)}
                    </div>
                    <div className="text-[10px] font-medium text-white/15 mt-1">Dispute coverage</div>
                  </div>
                  <div className="border border-white/[0.04] bg-white/[0.02] p-5">
                    <div className="text-[10px] font-medium text-red-400/20 mb-2">BURNED (0.5%)</div>
                    <div className="text-[22px] font-normal text-red-400/60 ">
                      ${((totalEarnings / 0.6) * 0.02).toFixed(4)}
                    </div>
                    <div className="text-[10px] font-medium text-white/15 mt-1">Permanently removed</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
    </RequireWallet>
  );
}
