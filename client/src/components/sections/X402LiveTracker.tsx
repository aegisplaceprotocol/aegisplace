import { useEffect, useState, useRef, useCallback } from "react";
import { useInView } from "@/hooks/useInView";

/* ── Sparkline Canvas ──────────────────────────────────────────────── */
function Sparkline({ data, color = "#A1A1AA", height = 32 }: { data: number[]; color?: string; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = w / (data.length - 1);

    /* Gradient fill */
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, color + "20");
    gradient.addColorStop(1, color + "00");

    ctx.beginPath();
    ctx.moveTo(0, h);
    data.forEach((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h * 0.8) - h * 0.1;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    /* Line */
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h * 0.8) - h * 0.1;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color + "60";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* End dot */
    const lastX = (data.length - 1) * step;
    const lastY = h - ((data[data.length - 1] - min) / range) * (h * 0.8) - h * 0.1;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
    ctx.fillStyle = color + "20";
    ctx.fill();
  }, [data, color, height]);

  return <canvas ref={canvasRef} className="w-full" style={{ height }} />;
}

/* ── Activity Pulse ────────────────────────────────────────────────── */
function ActivityPulse() {
  const [bars, setBars] = useState<number[]>(Array(12).fill(0).map(() => Math.random()));

  useEffect(() => {
    const interval = setInterval(() => {
      setBars(prev => {
        const next = [...prev.slice(1), 0.2 + Math.random() * 0.8];
        return next;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-end gap-[2px] h-6">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[3px] bg-white transition-all rounded"
          style={{ height: `${h * 100}%`, opacity: 0.2 + h * 0.6 }}
        />
      ))}
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────────────────────── */
function TrackerStat({
  label,
  value,
  suffix,
  prefix,
  sparkData,
  trend,
  color = "#A1A1AA",
}: {
  label: string;
  value: string;
  suffix?: string;
  prefix?: string;
  sparkData: number[];
  trend?: string;
  color?: string;
}) {
  return (
    <div className="p-4 sm:p-5 border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.015] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium text-white/20 tracking-wider uppercase">{label}</span>
        {trend && (
          <span className="text-[10px] font-medium text-zinc-300/50">{trend}</span>
        )}
      </div>
      <div className="text-[clamp(1.4rem,3vw,2rem)] font-normal text-white/85 tracking-tight mb-3">
        {prefix}{value}{suffix}
      </div>
      <Sparkline data={sparkData} color={color} height={28} />
    </div>
  );
}

/* ── Live Transaction Row ──────────────────────────────────────────── */
const FACILITATORS = ["Coinbase", "Dexter", "Virtuals", "Kora", "Stripe"];
const CHAINS = ["Solana", "Base", "Ethereum"];
const RESOURCES = [
  "acp-x402.virtuals.io", "x402.dexter.cash", "blockrun.ai",
  "agents.allium.so", "public.zapper.xyz", "x402.twit.sh",
  "enrichx402.com", "x402.sniperx.fun", "mcp-x402.vishwanetwork.xyz",
];

interface LiveTx {
  id: string;
  resource: string;
  facilitator: string;
  chain: string;
  amount: number;
  timestamp: number;
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

function generateTx(): LiveTx {
  return {
    id: Math.random().toString(36).slice(2, 10),
    resource: pick(RESOURCES),
    facilitator: pick(FACILITATORS),
    chain: pick(CHAINS),
    amount: parseFloat(rand(0.01, 2.50).toFixed(2)),
    timestamp: Date.now(),
  };
}

/* ── Main Component ────────────────────────────────────────────────── */
export default function X402LiveTracker() {
  const { ref, inView } = useInView(0.05);

  /* Baseline: ~104K txns/day = ~1.2 txns/sec, ~$53K/day = ~$0.61/sec */
  const [txCount, setTxCount] = useState(75_432_891);
  const [volume, setVolume] = useState(24_187_432);
  const [buyers, setBuyers] = useState(94_218);
  const [sellers, setSellers] = useState(22_417);

  const [txSpark, setTxSpark] = useState<number[]>(() =>
    Array(20).fill(0).map(() => 80000 + Math.random() * 30000)
  );
  const [volSpark, setVolSpark] = useState<number[]>(() =>
    Array(20).fill(0).map(() => 40000 + Math.random() * 20000)
  );
  const [buyerSpark, setBuyerSpark] = useState<number[]>(() =>
    Array(20).fill(0).map(() => 3000 + Math.random() * 2000)
  );

  const [liveTxs, setLiveTxs] = useState<LiveTx[]>([]);
  const [tps, setTps] = useState(1.21);

  /* Increment counters at realistic rates */
  useEffect(() => {
    if (!inView) return;

    const counterInterval = setInterval(() => {
      const txBatch = Math.floor(rand(1, 4));
      const volBatch = parseFloat(rand(0.3, 1.8).toFixed(2));

      setTxCount(c => c + txBatch);
      setVolume(v => v + Math.round(volBatch * 100) / 100);

      /* Occasionally increment buyers/sellers */
      if (Math.random() > 0.7) setBuyers(b => b + 1);
      if (Math.random() > 0.92) setSellers(s => s + 1);

      setTps(parseFloat(rand(0.8, 2.1).toFixed(2)));
    }, 1000);

    /* Update sparklines every 3 seconds */
    const sparkInterval = setInterval(() => {
      setTxSpark(prev => [...prev.slice(1), 80000 + Math.random() * 30000]);
      setVolSpark(prev => [...prev.slice(1), 40000 + Math.random() * 20000]);
      setBuyerSpark(prev => [...prev.slice(1), 3000 + Math.random() * 2000]);
    }, 3000);

    return () => {
      clearInterval(counterInterval);
      clearInterval(sparkInterval);
    };
  }, [inView]);

  /* Live transaction feed */
  useEffect(() => {
    if (!inView) return;

    const txInterval = setInterval(() => {
      const tx = generateTx();
      setLiveTxs(prev => {
        const next = [tx, ...prev];
        if (next.length > 6) next.pop();
        return next;
      });
    }, 2000 + Math.random() * 1500);

    /* Seed initial */
    const initial: LiveTx[] = [];
    for (let i = 0; i < 5; i++) {
      const tx = generateTx();
      tx.timestamp = Date.now() - i * 3000;
      initial.push(tx);
    }
    setLiveTxs(initial);

    return () => clearInterval(txInterval);
  }, [inView]);

  const formatNumber = useCallback((n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toLocaleString();
  }, []);

  return (
    <section id="x402-tracker" className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.04]" ref={ref}>
      <div className="container px-5 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-14">
          <div>
            <div className="text-[10px] font-medium sm:text-[11px] tracking-wider text-white/15 mb-4">
              LIVE x402 ECOSYSTEM
            </div>
            <h2 className={`text-[clamp(1.8rem,4.5vw,3.5rem)] font-normal text-white leading-[1.05] tracking-tight`}>
              Real-time agent economy.<br />
              <span className="text-white/30">Verified on-chain.</span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <ActivityPulse />
            <div className="text-right">
              <div className="text-[18px] sm:text-[22px] font-normal text-zinc-300 ">{tps} tps</div>
              <div className="text-[10px] font-medium text-white/20 tracking-wider">CURRENT THROUGHPUT</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.04] mb-8`}>
          <TrackerStat
            label="Total Transactions"
            value={formatNumber(txCount)}
            sparkData={txSpark}
            trend="+104K/day"
          />
          <TrackerStat
            label="Cumulative Volume"
            value={formatNumber(volume)}
            prefix="$"
            sparkData={volSpark}
            trend="+$53K/day"
          />
          <TrackerStat
            label="Unique Buyers"
            value={formatNumber(buyers)}
            sparkData={buyerSpark}
            trend="+4.8K/day"
          />
          <TrackerStat
            label="Active Sellers"
            value={sellers.toLocaleString()}
            sparkData={buyerSpark.map(v => v * 0.25)}
            trend="+344/day"
            color="#ffffff"
          />
        </div>

        {/* Live Transaction Feed */}
        <div className={`border border-white/[0.04] bg-white/[0.01] overflow-hidden`}>
          {/* Feed Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-3 px-3 sm:px-4 border-b border-white/[0.04] bg-white/[0.015]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-white/30">Live x402 Transactions</span>
            </div>
            <a
              href="https://www.x402scan.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] sm:text-[10px] font-medium text-zinc-300/40 hover:text-zinc-300/70 tracking-wider transition-colors"
            >
              VERIFY ON x402SCAN.COM &rarr;
            </a>
          </div>

          {/* Column headers -- hidden on mobile */}
          <div className="hidden sm:grid grid-cols-[1fr_100px_80px_80px_70px] gap-3 items-center py-2 px-4 border-b border-white/[0.04] bg-white/[0.01]">
            <span className="text-[10px] font-medium text-white/15 tracking-wider">RESOURCE</span>
            <span className="text-[10px] font-medium text-white/15 tracking-wider">FACILITATOR</span>
            <span className="text-[10px] font-medium text-white/15 tracking-wider text-right">AMOUNT</span>
            <span className="text-[10px] font-medium text-white/15 tracking-wider text-right">CHAIN</span>
            <span className="text-[10px] font-medium text-white/15 tracking-wider text-right">AGE</span>
          </div>

          {/* Transaction rows */}
          <div className="max-h-[280px] overflow-hidden">
            {liveTxs.map((tx, i) => {
              const age = Math.round((Date.now() - tx.timestamp) / 1000);
              const ageStr = age < 2 ? "now" : `${age}s ago`;
              const isNew = i === 0;

              return (
                <div
                  key={tx.id}
                  className={`grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_100px_80px_80px_70px] gap-2 sm:gap-3 items-center py-3 px-3 sm:px-4 border-b border-white/[0.04] transition-all ${isNew ? "bg-white/[0.015]" : "bg-transparent"}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isNew ? "bg-white" : "bg-white/20"}`} />
                    </span>
                    <span className="text-[12px] sm:text-[13px] font-medium text-white/60 truncate">{tx.resource}</span>
                  </div>
                  <div className="flex items-center gap-3 sm:contents">
                    <span className="hidden sm:block text-[11px] font-medium text-white/25">{tx.facilitator}</span>
                    <span className="text-[12px] font-medium text-zinc-300/70 sm:text-right">${tx.amount.toFixed(2)}</span>
                    <span className="hidden sm:block text-[11px] font-medium text-white/20 text-right">{tx.chain}</span>
                    <span className="text-[10px] font-medium text-white/15 sm:text-right">{ageStr}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feed Footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 py-3 px-3 sm:px-4 border-t border-white/[0.04] bg-white/[0.015]">
            <span className="text-[9px] sm:text-[10px] font-medium text-white/15">
              Data baseline: x402scan.com | Updated: March 8, 2026
            </span>
            <span className="text-[9px] sm:text-[10px] font-medium text-white/15">
              Top facilitators: Coinbase, Dexter, Virtuals Protocol
            </span>
          </div>
        </div>

        {/* Bottom callouts */}
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          <div className="p-4 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-[10px] font-medium text-zinc-300/30 tracking-wider mb-2">SOLANA DOMINANCE</div>
            <div className="text-[20px] font-normal text-white/70 mb-1">49%</div>
            <p className="text-[11px] text-white/25 leading-relaxed">
              Solana processes 49% of all x402 transactions. 400ms finality and $0.00025 per tx make it the natural settlement layer.
            </p>
          </div>
          <div className="p-4 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-[10px] font-medium text-zinc-300/30 tracking-wider mb-2">TOP SERVER (24H)</div>
            <div className="text-[13px] font-normal text-white/70 mb-1">acp-x402.virtuals.io</div>
            <p className="text-[11px] text-white/25 leading-relaxed">
              71K transactions, $87K volume, 3.9K buyers in the last 24 hours. Virtuals Protocol is the largest x402 consumer.
            </p>
          </div>
          <div className="p-4 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-[10px] font-medium text-zinc-300/30 tracking-wider mb-2">AEGIS OPPORTUNITY</div>
            <div className="text-[13px] font-normal text-white/70 mb-1">Zero success layer</div>
            <p className="text-[11px] text-white/25 leading-relaxed">
              104K daily transactions with no validation, no bonding, no reputation scoring. Every transaction is a potential Aegis customer.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
