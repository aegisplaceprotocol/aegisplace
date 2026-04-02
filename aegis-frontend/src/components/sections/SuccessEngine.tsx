import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";

const DIMENSIONS = [
  { label: "AegisX IDE Tools", value: 57, color: "#10B981" },
  { label: "Bags.fm Integration", value: 6, color: "#10B981" },
  { label: "Vulnerability Classes", value: 15, color: "#10B981" },
  { label: "Concurrent Agents", value: 16, color: "#10B981" },
  { label: "On-Chain Actions", value: 24, color: "#10B981" },
];

function Gauge({ label, value, color }: { label: string; value: number; color: string; inverted?: boolean }) {
  const circumference = 2 * Math.PI * 34;
  const fillPercent = Math.min(value / 60, 1);
  const offset = circumference * (1 - fillPercent);

  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/40 p-6 text-center">
      <svg viewBox="0 0 80 80" className="w-20 h-20 mx-auto mb-3 -rotate-90">
        <circle cx={40} cy={40} r={34} fill="none" stroke="#27272a" strokeWidth={4} />
        <circle
          cx={40}
          cy={40}
          r={34}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="text-2xl font-normal text-white mb-1" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}

export default function SuccessEngine() {
  return (
    <section className="py-16 sm:py-20 border-t border-white/[0.04]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <motion.div {...fadeInView}>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[11px] font-medium tracking-wider uppercase text-zinc-500">
            </span>
          </div>

          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-normal text-white leading-[1.1] tracking-tight mb-4">
            The full-stack Solana AI platform. Nothing else comes close.
          </h2>
          <p className="text-[14px] sm:text-[15px] text-zinc-500 max-w-2xl leading-relaxed mb-12 sm:mb-16">
            AegisX is the only browser-based IDE built for Solana. 86 modules, Bags.fm integration,
            smart contract auditing across 15 vulnerability classes, and multi-agent swarms with 16 concurrent agents.
            Cursor, Windsurf, and Copilot don't ship any of this.
          </p>
        </motion.div>

        <motion.div {...fadeInView}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
            {DIMENSIONS.map((d) => (
              <Gauge key={d.label} label={d.label} value={d.value} color={d.color} inverted={d.inverted} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
