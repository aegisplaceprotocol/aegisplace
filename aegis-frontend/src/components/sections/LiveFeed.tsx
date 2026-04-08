import { useEffect, useState, useRef, useMemo } from "react";
import SectionLabel from "@/components/SectionLabel";
import { useInView } from "@/hooks/useInView";
import { useLiveFeed, type LiveFeedEvent } from "@/hooks/useLiveFeed";
import { trpc } from "@/lib/trpc";

interface Invocation {
  id: string;
  operator: string;
  caller: string;
  amount: string;
  latency: string;
  status: "settled" | "validating" | "pending";
  quality: number;
  timestamp: number;
}


function StatusDot({ status }: { status: Invocation["status"] }) {
  const colors = {
    settled: "bg-white",
    validating: "bg-amber-400",
    pending: "bg-white/30",
  };
  return (
    <span className="relative flex h-2 w-2">
      {status === "settled" && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-75" />
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[status]}`} />
    </span>
  );
}

function FeedRow({ inv, isNew }: { inv: Invocation; isNew: boolean }) {
  const age = Math.round((Date.now() - inv.timestamp) / 1000);
  const ageStr = age < 2 ? "now" : `${age}s ago`;

  return (
    <div className={`grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_100px_80px_70px_60px_70px_60px] gap-2 sm:gap-3 items-center py-3 px-3 sm:px-4 border-b border-white/[0.04] transition-all ${isNew ? "bg-white/[0.015]" : "bg-transparent"}`}>
      <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
        <StatusDot status={inv.status} />
        <span className="text-[12px] sm:text-[13px] font-medium text-white/70 truncate">{inv.operator}</span>
      </div>
      <div className="flex items-center gap-3 sm:contents">
        <span className="hidden sm:block text-[11px] font-medium text-white/30 truncate">{inv.caller}</span>
        <span className="text-[12px] font-medium text-zinc-300/70 sm:text-right">{inv.amount}</span>
        <span className="hidden sm:block text-[11px] font-medium text-white/25 text-right">{inv.latency}</span>
        <span className={`hidden sm:block text-[10px] font-medium text-right ${inv.quality >= 90 ? "text-zinc-300/60" : inv.quality >= 80 ? "text-white/40" : "text-amber-400/50"}`}>
          {inv.quality}/100
        </span>
        <span className={`text-[10px] font-medium sm:text-right ${inv.status === "settled" ? "text-zinc-300/50" : inv.status === "validating" ? "text-amber-400/50" : "text-white/20"}`}>
          {inv.status}
        </span>
        <span className="hidden sm:block text-[10px] font-medium text-white/15 text-right">{ageStr}</span>
      </div>
    </div>
  );
}

/** Convert an SSE invocation event to the Invocation display format */
function sseToInvocation(evt: LiveFeedEvent): Invocation | null {
  if (evt.event !== "invocation") return null;
  const d = evt.data;
  return {
    id: evt.id,
    operator: (d.operatorSlug as string) || (d.operatorName as string) || "unknown",
    caller: d.callerWallet
      ? `${(d.callerWallet as string).slice(0, 6)}...${(d.callerWallet as string).slice(-4)}`
      : "anon",
    amount: `$${parseFloat((d.amountPaid as string) || "0").toFixed(4)}`,
    latency: `${d.responseMs || 0}ms`,
    status: (d.success as boolean) ? "settled" : "pending",
    quality: Math.max(0, Math.min(100, 75 + ((d.successDelta as number) || 0))),
    timestamp: (d.timestamp as number) || Date.now(),
  };
}

export default function LiveFeed() {
  const { data: stats } = trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });
  const { data: recentData } = trpc.invoke.recent.useQuery(
    { limit: 15 },
    { staleTime: 30_000, refetchInterval: 30_000 },
  );
  const { ref, inView } = useInView(0.05);
  const { events: sseEvents, connected: sseConnected } = useLiveFeed();
  const [newestId, setNewestId] = useState<string>("");
  const [totalCount, setTotalCount] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const statsInitialized = useRef(false);

  // Seed counters from live stats once available
  useEffect(() => {
    if (stats && !statsInitialized.current) {
      statsInitialized.current = true;
      if (stats.totalInvocations) setTotalCount(stats.totalInvocations);
      if (stats.totalEarnings) setTotalVolume(parseFloat(String(stats.totalEarnings)));
    }
  }, [stats]);

  // Convert SSE events to invocation display format
  const sseInvocations = useMemo(() => {
    return sseEvents
      .map(sseToInvocation)
      .filter((inv): inv is Invocation => inv !== null)
      .slice(0, 15);
  }, [sseEvents]);

  // Convert trpc.invoke.recent to invocation display format as fallback
  const recentInvocations = useMemo((): Invocation[] => {
    if (!recentData) return [];
    return (recentData as any[]).map((row: any, i: number) => {
      const inv = row.invocation ?? row;
      return {
        id: String(inv.id ?? inv._id ?? i),
        operator: row.operatorSlug ?? row.operatorName ?? inv.operatorSlug ?? "unknown",
        caller: inv.callerWallet
          ? `${String(inv.callerWallet).slice(0, 6)}...${String(inv.callerWallet).slice(-4)}`
          : "anon",
        amount: `$${parseFloat(inv.amountPaid || "0").toFixed(4)}`,
        latency: `${inv.responseMs || 0}ms`,
        status: (inv.success ? "settled" : inv.responseMs === 0 ? "pending" : "validating") as Invocation["status"],
        quality: Math.max(0, Math.min(100, Math.round((inv.qualityScore ?? 75)))),
        timestamp: inv.createdAt ? new Date(inv.createdAt).getTime() : Date.now() - i * 3000,
      };
    });
  }, [recentData]);

  // SSE is primary; fall back to tRPC recent data
  const hasSSEData = sseInvocations.length > 0;
  const invocations = hasSSEData ? sseInvocations : recentInvocations;

  // Track newest SSE event for highlight
  useEffect(() => {
    if (sseInvocations.length > 0) {
      setNewestId(sseInvocations[0].id);
    }
  }, [sseInvocations]);

  useEffect(() => {
    if (recentInvocations.length > 0 && !hasSSEData) {
      setNewestId(recentInvocations[0].id);
    }
  }, [recentInvocations, hasSSEData]);

  return (
    <section id="live-feed" className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.04]" ref={ref}>
      <div className="container">
        <SectionLabel text="LIVE PROTOCOL" />

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <h2 className={`text-[clamp(2rem,4.5vw,3.5rem)] font-normal text-white leading-[1.05] tracking-tight`}>
              Every invocation.<br />
              <span className="text-white/30">On-chain. Verifiable.</span>
            </h2>
          </div>
          <div className="flex gap-4 sm:gap-8">
            <div className="text-right">
              <div className="text-[18px] sm:text-[24px] font-normal text-zinc-300 tracking-tight">
                {totalCount.toLocaleString()}
              </div>
              <div className="text-[10px] font-medium text-white/20 tracking-wider">TOTAL INVOCATIONS</div>
            </div>
            <div className="text-right">
              <div className="text-[18px] sm:text-[24px] font-normal text-white/60 tracking-tight">
                ${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-medium text-white/20 tracking-wider">PROTOCOL VOLUME</div>
            </div>
          </div>
        </div>

        {/* Feed container */}
        <div className={`border border-white/[0.04] bg-white/[0.01] rounded overflow-hidden`}>
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[1fr_100px_80px_70px_60px_70px_60px] gap-3 items-center py-3 px-4 border-b border-white/[0.04] bg-white/[0.015]">
            <span className="text-[10px] font-medium text-white/20 tracking-wider">OPERATOR</span>
            <span className="text-[10px] font-medium text-white/20 tracking-wider">CALLER</span>
            <span className="text-[10px] font-medium text-white/20 tracking-wider text-right">AMOUNT</span>
            <span className="text-[10px] font-medium text-white/20 tracking-wider text-right">LATENCY</span>
            <span className="text-[10px] font-medium text-white/20 tracking-wider text-right">REP</span>
            <span className="text-[10px] font-medium text-white/20 tracking-wider text-right">STATUS</span>
            <span className="text-[10px] font-medium text-white/20 tracking-wider text-right">AGE</span>
          </div>

          {/* Rows */}
          <div className="max-h-[420px] overflow-hidden">
            {invocations.map((inv) => (
              <FeedRow key={inv.id} inv={inv} isNew={inv.id === newestId} />
            ))}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-3 px-3 sm:px-4 border-t border-white/[0.04] bg-white/[0.015]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-white/30">
                {sseConnected ? "Live feed connected" : "Streaming from Solana devnet"}
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-medium text-white/15">
              avg settlement: 400ms | avg cost: $0.012
            </span>
          </div>
        </div>

        {/* Callout */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 p-5 border border-white/[0.04] bg-white/[0.015]">
            <div className="text-[10px] font-medium text-white/20 tracking-wider mb-2">INVOCATION RECEIPTS</div>
            <p className="text-[13px] text-white/40 leading-relaxed">
              Every settled invocation mints a compressed NFT (cNFT) via Bubblegum at ~$0.00005 per mint.
              Portable proof-of-work that builds an agent's on-chain portfolio.
            </p>
          </div>
          <div className="flex-1 p-5 border border-white/[0.04] bg-white/[0.015]">
            <div className="text-[10px] font-medium text-white/20 tracking-wider mb-2">HEALTH ENDPOINT</div>
            <p className="text-[13px] text-white/40 leading-relaxed">
              Every registered operator exposes <span className="font-medium text-zinc-300/50">GET /aegis/health</span> returning
              uptime, p99 latency, error rate, and queue depth. Real-time badges, not static metadata.
            </p>
          </div>
          <div className="flex-1 p-5 border border-white/[0.04] bg-white/[0.015]">
            <div className="text-[10px] font-medium text-white/20 tracking-wider mb-2">.AEGIS.SOL IDENTITY</div>
            <p className="text-[13px] text-white/40 leading-relaxed">
              Agents register via Solana Name Service. <span className="font-medium text-zinc-300/50">translate.aegis.sol</span> resolves
              to an operator's metadata, quality score, and invocation history.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
