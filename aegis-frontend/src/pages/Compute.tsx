import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/sections/Footer";

const LAYERS = [
  { layer: "Layer 1", name: "Silicon", desc: "NVIDIA GPUs, custom ASICs", color: "#4A7A82" },
  { layer: "Layer 2", name: "Compute", desc: "GPU marketplace via Aegis operators", color: "#71717A" },
  { layer: "Layer 3", name: "NIM Runtime", desc: "NVIDIA NIM containers for GPU-optimized inference", color: "#76B900" },
  { layer: "Layer 4", name: "Models", desc: "Nemotron Nano/Super/Ultra foundation models", color: "#76B900" },
  { layer: "Layer 5", name: "Skills", desc: "Task-specific operators with NeMo Guardrails", color: "#A1A1AA" },
  { layer: "Layer 6", name: "Agents", desc: "Autonomous consumers", color: "#71717A" },
  { layer: "Layer 7", name: "Quality", desc: "Aegis bonded validation + NeMo Evaluator", color: "#A1A1AA" },
  { layer: "Layer 8", name: "Settlement", desc: "Solana", color: "#4A7A82" },
];

const FEATURES = [
  {
    title: "GPU compute as an operator",
    desc: "8x H100s sitting idle at night become an Aegis operator earning per-second. Any AI agent anywhere can discover your GPUs, pay per-second for inference, and the revenue splits atomically.",
  },
  {
    title: "NVIDIA NIM deployment",
    desc: "Every GPU operator runs inside NVIDIA NIM containers. Pre-optimized inference with OpenAI-compatible APIs, 4.2x speedup over raw deployment, and auto-scaling. NIM-deployed operators get priority marketplace placement because performance is hardware-guaranteed.",
  },
  {
    title: "Hardware-attested validation",
    desc: "Execution happens inside hardware-secured enclaves. The silicon itself attests that the output was not tampered with. Bonded validation plus hardware attestation plus NeMo Evaluator benchmarks. No protocol on Earth has all three.",
  },
  {
    title: "Nemotron foundation models",
    desc: "Operators built on NVIDIA Nemotron across three tiers. Nano for lightweight edge inference. Super for balanced reasoning and RAG. Ultra for maximum capability. Open weights, training data, and fine-tuning recipes. A researcher fine-tunes Nemotron on medical data, uploads it as an Aegis operator, and earns 85% of every call.",
  },
  {
    title: "NeMo RL data flywheel",
    desc: "Every invocation generates training data. NeMo RL uses GRPO and PPO to continuously improve operators. NeMo Gym provides simulated environments. The more an operator is used, the better it gets. A self-improving marketplace that compounds quality over time.",
  },
  {
    title: "Darwinian marketplace",
    desc: "NeMo Evaluator benchmarks run every 6 hours. The best models rise via objective metrics, not marketing. Bad models get slashed and disappear. The marketplace self-optimizes without human curation.",
  },
];

export default function Compute() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 border-b border-white/[0.04]">
        <div className="mx-auto max-w-[1520px] px-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/20 bg-white/[0.04] mb-6">
            <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" />
            <span className="text-[11px] font-medium text-zinc-300/60 tracking-wider">IN DEVELOPMENT</span>
          </div>

          <h1 className="text-[clamp(2rem,5vw,3.75rem)] font-normal text-white leading-[1.05] tracking-tight mb-4">
            Every GPU on Earth
            <br />
            <span className="text-white/30">becomes a potential earner.</span>
          </h1>

          <p className="text-[15px] sm:text-[16px] text-white/35 max-w-2xl leading-relaxed">
            Register your GPUs as Aegis operators. Earn per-second for idle compute.
            Hardware-attested validation ensures agents get the compute they paid for.
            Every data center becomes an operator factory.
          </p>
        </div>
      </section>

      {/* AI Supply Chain */}
      <section className="py-16 sm:py-24 border-b border-white/[0.04]">
        <div className="mx-auto max-w-[1520px] px-12 max-w-3xl">
          <h2 className="text-xl sm:text-2xl font-normal text-white mb-2">
            The AI supply chain.
          </h2>
          <p className="text-[13px] text-white/25 mb-10">
            Every layer pays the layer below it. Every creator at every layer earns.
            The entire stack is economically self-sustaining.
          </p>

          <div className="space-y-0">
            {LAYERS.map((layer, i) => (
              <div
                key={layer.name}
                className={`flex items-center gap-4 sm:gap-6 p-4 sm:p-5 border border-white/[0.04] ${
                  i > 0 ? "border-t-0" : ""
                } hover:bg-white/[0.015] transition-all duration-300`}
              >
                <div className="text-[10px] font-medium text-white/15 tracking-wider w-14 shrink-0">
                  {layer.layer}
                </div>
                <div
                  className="w-3 h-3 shrink-0"
                  style={{ backgroundColor: `${layer.color}40`, border: `1px solid ${layer.color}60` }}
                />
                <div className="flex-1">
                  <span className="text-[14px] font-normal text-white/70">{layer.name}</span>
                  <span className="text-[13px] text-white/25 ml-3">{layer.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 border-b border-white/[0.04]">
        <div className="mx-auto max-w-[1520px] px-12 max-w-4xl">
          <h2 className="text-xl sm:text-2xl font-normal text-white mb-10">
            What this enables.
          </h2>

          <div className="grid sm:grid-cols-2 gap-px bg-white/[0.06] border border-white/[0.04]">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="bg-white/[0.02] p-6 sm:p-8 hover:bg-white/[0.015] transition-all duration-300"
              >
                <h3 className="text-[15px] font-normal text-white/80 mb-3">{feat.title}</h3>
                <p className="text-[13px] text-white/30 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The math */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-[1520px] px-12 max-w-3xl">
          <div className="border border-white/[0.12] bg-white/[0.03] p-6 rounded sm:p-10">
            <div className="text-[11px] font-medium tracking-wider text-zinc-300/40 uppercase mb-4">
              THE MATH
            </div>
            <div className="space-y-3 text-[14px] text-white/40 leading-relaxed">
              <p>1 billion agents making 100 calls a day at $0.003 each.</p>
              <p><span className="text-zinc-300 font-normal">$300M per day</span> in operator fees.</p>
              <p>8% treasury fee = <span className="text-white/60">$24M per day</span> in protocol revenue.</p>
              <p>0.5% per-invocation burn = <span className="text-red-400/60">$3M in $AEGIS burned per day</span>.</p>
              <p className="text-[16px] text-white/60 font-medium pt-2">
                Annual: $110B in operator fees. $9.9B in protocol revenue.
              </p>
              <p className="text-[13px] text-white/25 pt-2">
                The App Store does $85B/year. Aegis is the App Store for AI.
                Except the apps run themselves, the customers are AI agents,
                and the marketplace never closes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
