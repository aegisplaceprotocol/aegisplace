import SectionLabel from "@/components/SectionLabel";
import { useInView } from "@/hooks/useInView";
import { toast } from "sonner";

const READINESS_CHECKS = [
  {
    label: "Health endpoint",
    path: "/aegis/health",
    description: "Standard JSON health response with uptime, latency, error rate",
    status: "required",
  },
  {
    label: "x402 payment header",
    path: "X-402-Payment",
    description: "Accept signed USDC transfers via the x402 HTTP standard",
    status: "required",
  },
  {
    label: "Bond deposit",
    path: "500+ $AEGIS",
    description: "Stake tokens as a quality guarantee. Slashed on SLA violations.",
    status: "required",
  },
  {
    label: "MCP manifest",
    path: "mcp-server.json",
    description: "Discoverable by Claude Code, Codex CLI, and other MCP clients",
    status: "recommended",
  },
  {
    label: "Deno sandbox compatible",
    path: "--allow-net only",
    description: "Runs inside a Deno sandbox with minimal permissions for success scoring",
    status: "recommended",
  },
  {
    label: "Observation trace",
    path: "/aegis/trace",
    description: "Expose execution traces for validator observation loops",
    status: "optional",
  },
];

const BADGES = [
  { label: "Verified", color: "#A1A1AA", description: "Health endpoint live, bond deposited, x402 active" },
  { label: "MCP Ready", color: "#60A5FA", description: "Discoverable via MCP protocol by AI agents" },
  { label: "Sandboxed", color: "#FBBF24", description: "Runs in Deno sandbox with restricted permissions" },
  { label: "Audited", color: "#A78BFA", description: "Passed validator observation loop with 90+ score" },
];

const APPLY_STEPS = [
  { step: "01", title: "Submit your endpoint", desc: "Provide your service URL, health endpoint, pricing, and a short description." },
  { step: "02", title: "Automated readiness check", desc: "We probe your health endpoint, verify x402 headers, and test response times." },
  { step: "03", title: "Deposit bond", desc: "Stake $AEGIS tokens. Higher bonds unlock higher success tiers and marketplace priority." },
  { step: "04", title: "Go live", desc: "Your operator appears in the marketplace. Agents discover and pay you via x402." },
];

function StatusDot({ status }: { status: string }) {
  const color = status === "required" ? "bg-white" : status === "recommended" ? "bg-amber-400" : "bg-white/20";
  return <span className={`w-1.5 h-1.5 rounded-full ${color} shrink-0`} />;
}

export default function OperatorApply() {
  const { ref, inView } = useInView(0.05);

  return (
    <section id="apply" className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.04]" ref={ref}>
      <div className="container">
        <SectionLabel text="OPERATORS" />

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
          <div>
            <h2 className={`text-[clamp(2rem,4.5vw,3.5rem)] font-normal text-white leading-[1.05] tracking-tight`}>
              Ship a service.<br />
              <span className="text-zinc-300">Earn per call.</span>
            </h2>
            <p className={`text-[14px] text-white/30 max-w-lg leading-relaxed mt-4`}>
              Register your API, pass readiness checks, deposit a bond, and start earning.
              No gatekeepers. No approval queues. Self-serve from day one.
            </p>
          </div>

          {/* Apply CTA */}
          <div className={``}>
            <button
              onClick={() => toast("Operator registration opens with devnet launch", { description: "Join the waitlist to get early access." })}
              className="group flex items-center gap-3 px-8 py-4 bg-white hover:bg-zinc-200 text-[#0A0A0A] transition-all duration-300 hover:"
            >
              <span className="text-[14px] font-normal ">Apply as Operator</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform duration-300 group-hover:translate-x-1">
                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="text-[10px] font-medium text-white/15 tracking-wider mt-2 text-center lg:text-right">DEVNET LAUNCH Q3 2025</div>
          </div>
        </div>

        {/* Two-column layout: Steps + Readiness */}
        <div className={`grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 lg:gap-8`}>

          {/* Left: How to apply steps */}
          <div className="border border-white/[0.04] rounded overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.04] bg-white/[0.015]">
              <span className="text-[10px] font-medium text-white/20 tracking-wider">HOW TO REGISTER</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {APPLY_STEPS.map((s, i) => (
                <div
                  key={s.step}
                  className={`flex gap-4 sm:gap-5 p-4 sm:p-5`}
                  style={{ transitionDelay: `${300 + i * 100}ms` }}
                >
                  <div className="text-[28px] sm:text-[32px] font-normal text-white/[0.06] leading-none shrink-0 w-10">
                    {s.step}
                  </div>
                  <div>
                    <div className="text-[14px] font-normal text-white/70">{s.title}</div>
                    <div className="text-[12px] text-white/25 leading-relaxed mt-1">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Readiness checklist */}
          <div className="border border-white/[0.04] rounded overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.04] bg-white/[0.015] flex items-center justify-between">
              <span className="text-[10px] font-medium text-white/20 tracking-wider">READINESS CHECKLIST</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span className="text-[9px] font-medium text-white/15">Required</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[9px] font-medium text-white/15">Recommended</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="text-[9px] font-medium text-white/15">Optional</span>
                </div>
              </div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {READINESS_CHECKS.map((check, i) => (
                <div
                  key={check.label}
                  className={`flex items-start gap-3 p-4 sm:p-5`}
                  style={{ transitionDelay: `${300 + i * 80}ms` }}
                >
                  <StatusDot status={check.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-medium text-white/60">{check.label}</span>
                      <code className="text-[10px] font-medium text-zinc-300/35 bg-white/[0.015] px-1.5 py-0.5 rounded">{check.path}</code>
                    </div>
                    <div className="text-[11px] text-white/20 leading-relaxed mt-0.5">{check.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Badges row */}
        <div className={`mt-8`}>
          <div className="text-[10px] font-medium text-white/15 tracking-wider mb-4">VERIFICATION BADGES</div>
          <div className="flex flex-wrap gap-3">
            {BADGES.map((badge) => (
              <button
                key={badge.label}
                onClick={() => toast(badge.label, { description: badge.description })}
                className="group flex items-center gap-2 px-4 py-2.5 border border-white/[0.04] rounded hover:border-white/[0.08] bg-white/[0.015] hover:bg-white/[0.015] transition-all duration-300 cursor-pointer"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: badge.color, opacity: 0.7 }}
                />
                <span className="text-[12px] font-medium text-white/40 group-hover:text-white/60 transition-colors tracking-wide">
                  {badge.label}
                </span>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-white/10 group-hover:text-white/25 transition-colors ml-1">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1"/>
                  <path d="M6 4V6.5M6 8V8.01" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className={`mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 p-4 sm:p-5 border border-white/[0.04] bg-white/[0.01]`}>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-zinc-300/40 shrink-0">
              <path d="M8 1L14.9282 5V11L8 15L1.0718 11V5L8 1Z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M8 5V8.5M8 10.5V10.51" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="text-[12px] font-medium text-white/30">No approval queue.</span>
          </div>
          <span className="text-[12px] text-white/20">
            Any developer can register an operator. The marketplace ranks by health, bond size, and validator scores.
            Bad actors get slashed. Good actors compound reputation.
          </span>
        </div>
      </div>
    </section>
  );
}
