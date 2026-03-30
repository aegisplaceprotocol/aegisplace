import SectionLabel from "@/components/SectionLabel";
import { useInView } from "@/hooks/useInView";

const PLATFORMS = [
  { era: "Internet", result: "E-commerce" },
  { era: "Mobile", result: "App stores" },
  { era: "Cloud", result: "AWS Marketplace" },
  { era: "AI Agents", result: "Aegis" },
];

const FAILURES = [
  { name: "Stripe", reason: "Agents can't sign contracts or manage subscriptions" },
  { name: "AWS Marketplace", reason: "Designed for human procurement teams" },
  { name: "The App Store", reason: "No concept of per-call pricing" },
];

export default function WhyAegisExists() {
  const { ref, inView: visible } = useInView();

  return (
    <section ref={ref} className="py-24 border-t border-white/[0.04] border-b border-b-white/[0.04]">
      <div className="container max-w-[1100px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-6">
          <SectionLabel text="Why This Matters" />
        </div>

        <h2
          className="text-center text-[clamp(1.8rem,4vw,2.8rem)] font-light tracking-tight text-white leading-[1.15] max-w-[600px] mx-auto mb-16"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          Every breakthrough technology creates a commerce layer
        </h2>

        {/* Platform evolution grid */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20 items-stretch"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s",
          }}
        >
          {PLATFORMS.map((p, i) => (
            <div
              key={p.era}
              className={`rounded-[6px] p-6 text-center ${i === 3 ? 'card-glow border border-white/[0.10]' : 'card-standard'}`}
            >
              <div className="text-[11px] uppercase tracking-[0.1em] text-white/20 mb-3">{p.era}</div>
              <div className={`text-[16px] tracking-tight ${i === 3 ? 'text-white/90 font-bold' : 'text-white/50'}`}>
                {p.result}
              </div>
            </div>
          ))}
        </div>

        {/* Core argument */}
        <div className="max-w-[640px] mx-auto mb-20">
          <p
            className="text-[15px] text-white/40 leading-[1.9] text-center mb-8"
            style={{
              opacity: visible ? 1 : 0,
              transition: "opacity 0.6s ease 0.25s",
            }}
          >
            AI agents will be the primary consumers of software by 2027.
            Not humans clicking buttons. Machines calling APIs. When machines become the buyer,
            everything about commerce changes. They need structured discovery, not marketing pages.
            Reputation data, not brand awareness. Instant settlement, not 30-day invoices.
          </p>
        </div>

        {/* What doesn't work - 3 cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20 items-stretch"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s ease 0.3s, transform 0.5s ease 0.3s",
          }}
        >
          {FAILURES.map((f) => (
            <div key={f.name} className="card-standard rounded-[6px] p-6">
              <div className="text-[14px] text-white/50 font-bold mb-2">{f.name}</div>
              <div className="text-[12px] text-white/25 leading-[1.7]">{f.reason}</div>
            </div>
          ))}
        </div>

        {/* The answer */}
        <div className="text-center">
          <p
            className="text-[14px] text-white/30 mb-6"
            style={{
              opacity: visible ? 1 : 0,
              transition: "opacity 0.6s ease 0.4s",
            }}
          >
            The agent economy needs its own commerce layer. Purpose-built.
            Permissionless. Machine-readable. Instant settlement.
          </p>

          <p
            className="text-[28px] font-bold text-white/80 mb-8 tracking-tight"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s",
            }}
          >
            That's Aegis.
          </p>

          {/* Stats row */}
          <div
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2"
            style={{
              opacity: visible ? 1 : 0,
              transition: "opacity 0.6s ease 0.6s",
            }}
          >
            {["452 operators", "16 MCP tools", "400ms settlement", "60% to creators", "NeMo guardrails"].map((s) => (
              <span key={s} className="text-[11px] text-white/20 uppercase tracking-wider">{s}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
