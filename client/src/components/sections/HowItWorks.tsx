import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";
import SectionLabel from "@/components/SectionLabel";

const STEPS = [
  { num: "01", title: "Discover", desc: "Agent searches the Aegis index for the best operator by success score, price, and latency." },
  { num: "02", title: "Pay", desc: "USDC micropayment via x402. Swapped to $AEGIS on Jupiter before execution." },
  { num: "03", title: "Guard", desc: "NeMo Guardrails check every input for safety, injection, and compliance before execution." },
  { num: "04", title: "Execute", desc: "Operator runs in a sandboxed environment. Isolated. Auditable. Deterministic." },
  { num: "05", title: "Validate", desc: "Bonded validators attest output quality. NeMo Evaluator scores the response." },
  { num: "06", title: "Settle", desc: "Revenue splits atomically on Solana: 60% creator, 15% validators, 12% stakers, 8% treasury, 3% insurance, 2% burned." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 border-t border-white/[0.05]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <motion.div {...fadeInView}>
        </motion.div>

        <motion.div {...fadeInView} className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-20">
          <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-normal text-white leading-[1.05] tracking-tight">
            One skill invocation.
            <br />
            <span className="text-zinc-500 font-normal">Six steps. Under half a second.</span>
          </h2>
          <p className="text-[14px] text-zinc-500 max-w-md leading-relaxed lg:text-right">
            An agent needs a skill. Aegis finds the right operator, handles the micropayment,
            validates the output, and splits the earnings. Every step is recorded on Solana
            so anyone can audit the receipts.
          </p>
        </motion.div>

        {/* 6-step flow cards */}
        <motion.div {...fadeInView} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-16 sm:mb-20">
          {STEPS.map((step) => (
            <div key={step.num} className="rounded border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="text-[11px] font-bold text-emerald-500 mb-2">{step.num}</div>
              <div className="text-[15px] font-medium text-white mb-2">{step.title}</div>
              <div className="text-[12px] text-zinc-500 leading-relaxed">{step.desc}</div>
            </div>
          ))}
        </motion.div>

        {/* ===== DESKTOP SVG DIAGRAM ===== */}
        <motion.div
          {...fadeInView}
          className="hidden lg:flex justify-center"
          style={{ maxWidth: 1300, margin: '0 auto' }}
        >
          <svg
            viewBox="0 0 1300 820"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <defs>
              <style>{`
                .flow-line {
                  stroke: rgba(161,161,170,0.35);
                  stroke-width: 1;
                  stroke-dasharray: 8 5;
                  fill: none;
                  animation: svgDashFlow 2s linear infinite;
                }
                .flow-line-slow {
                  stroke: rgba(255,255,255,0.06);
                  stroke-width: 1;
                  stroke-dasharray: 4 4;
                  fill: none;
                  animation: svgDashFlow 3s linear infinite;
                }
                .flow-line-obs {
                  stroke: rgba(161,161,170,0.18);
                  stroke-width: 1;
                  stroke-dasharray: 3 6;
                  fill: none;
                  animation: svgDashFlowReverse 2.5s linear infinite;
                }
                @keyframes svgDashFlow {
                  to { stroke-dashoffset: -26; }
                }
                @keyframes svgDashFlowReverse {
                  to { stroke-dashoffset: 26; }
                }
              `}</style>
            </defs>

            {/* ROW 1: Creator -> Registry -> Index */}

            {/* OPERATOR CREATOR box */}
            <rect x="60" y="80" width="300" height="130" rx="12" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="rgba(255,255,255,0.02)" />
            <text x="210" y="125" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="15" fontWeight="600">Skill Creator</text>
            <text x="210" y="150" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="12">Uploads AI skill to registry</text>
            <text x="210" y="172" textAnchor="middle" fill="rgba(255,255,255,0.20)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="11">Stakes $AEGIS bond</text>

            {/* Arrow: Creator -> Registry */}
            <circle cx="360" cy="145" r="3.5" fill="#A1A1AA" opacity="0.5" />
            <line x1="365" y1="145" x2="475" y2="145" className="flow-line" />
            <text x="420" y="133" textAnchor="middle" fill="rgba(255,255,255,0.30)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="11">Registers</text>

            {/* AEGIS REGISTRY box (highlighted) */}
            <rect x="480" y="50" width="380" height="190" rx="12" stroke="rgba(161,161,170,0.5)" strokeWidth="1.5" fill="rgba(161,161,170,0.04)" />
            <text x="670" y="105" textAnchor="middle" fill="rgba(161,161,170,0.9)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="18" fontWeight="700">Aegis Registry</text>
            <text x="670" y="132" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="12">On-chain Solana program</text>
            <text x="670" y="168" textAnchor="middle" fill="rgba(161,161,170,0.30)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="10">metadata  |  bond_vault  |  reputation</text>
            <text x="670" y="192" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="10">Token-2022 transfer hooks</text>

            {/* Arrow: Registry -> Index */}
            <circle cx="860" cy="145" r="3.5" fill="#A1A1AA" opacity="0.5" />
            <line x1="865" y1="145" x2="955" y2="145" className="flow-line" />
            <text x="910" y="133" textAnchor="middle" fill="rgba(255,255,255,0.30)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="11">Indexes</text>

            {/* SKILL INDEX box */}
            <rect x="960" y="80" width="280" height="130" rx="12" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="rgba(255,255,255,0.02)" />
            <text x="1100" y="125" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="15" fontWeight="600">Skill Index</text>
            <text x="1100" y="150" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="12">Discoverable by any agent</text>
            <text x="1100" y="172" textAnchor="middle" fill="rgba(255,255,255,0.20)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="11">GitHub, HuggingFace, Native</text>

            {/* VERTICAL CONNECTORS */}

            <circle cx="210" cy="210" r="3" fill="rgba(255,255,255,0.15)" />
            <line x1="210" y1="214" x2="210" y2="328" className="flow-line-slow" />
            <text x="175" y="268" fill="rgba(255,255,255,0.18)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="10">Reputation</text>
            <text x="175" y="282" fill="rgba(255,255,255,0.18)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="10">feedback</text>

            <circle cx="670" cy="240" r="3.5" fill="#A1A1AA" opacity="0.5" />
            <line x1="670" y1="245" x2="670" y2="328" className="flow-line" />
            <text x="705" y="292" fill="rgba(255,255,255,0.30)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="11">Validates</text>

            {/* ROW 2: Consumer -> Validator -> Revenue Split */}

            {/* CONSUMER AGENT box */}
            <rect x="60" y="332" width="300" height="130" rx="12" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="rgba(255,255,255,0.02)" />
            <text x="210" y="377" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="15" fontWeight="600">Consumer Agent</text>
            <text x="210" y="402" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="12">Invokes skill via x402</text>
            <text x="210" y="424" textAnchor="middle" fill="rgba(255,255,255,0.20)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="11">Pays USDC per call</text>

            {/* Sandbox label */}
            <rect x="72" y="468" width="276" height="30" rx="8" stroke="rgba(161,161,170,0.12)" strokeWidth="1" strokeDasharray="3 3" fill="rgba(161,161,170,0.02)" />
            <text x="210" y="488" textAnchor="middle" fill="rgba(161,161,170,0.40)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="10">Sandboxed execution environment</text>

            {/* Arrow: Consumer -> Validator */}
            <circle cx="360" cy="397" r="3.5" fill="#A1A1AA" opacity="0.5" />
            <line x1="365" y1="397" x2="475" y2="397" className="flow-line" />
            <text x="420" y="385" textAnchor="middle" fill="rgba(255,255,255,0.30)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="11">x402 payment</text>

            {/* BONDED VALIDATOR box */}
            <rect x="480" y="332" width="380" height="130" rx="12" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="rgba(255,255,255,0.02)" />
            <text x="670" y="377" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="15" fontWeight="600">Bonded Validator</text>
            <text x="670" y="402" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="12">Stakes $AEGIS to attest quality</text>
            <text x="670" y="424" textAnchor="middle" fill="rgba(255,255,255,0.20)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="11">NeMo Evaluator scoring</text>

            {/* Arrow: Validator -> Revenue */}
            <circle cx="860" cy="397" r="3.5" fill="#A1A1AA" opacity="0.5" />
            <line x1="865" y1="397" x2="955" y2="397" className="flow-line" />
            <text x="910" y="385" textAnchor="middle" fill="rgba(255,255,255,0.30)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="11">Splits revenue</text>

            {/* REVENUE SPLIT box (highlighted) */}
            <rect x="960" y="316" width="280" height="195" rx="12" stroke="rgba(161,161,170,0.5)" strokeWidth="1.5" fill="rgba(161,161,170,0.04)" />
            <text x="1100" y="350" textAnchor="middle" fill="rgba(161,161,170,0.9)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="16" fontWeight="700">Revenue Split</text>
            <text x="1100" y="378" textAnchor="middle" fill="rgba(161,161,170,0.75)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="14" fontWeight="500">60% Creator</text>
            <text x="1100" y="400" textAnchor="middle" fill="rgba(161,161,170,0.75)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="14" fontWeight="500">15% Validators</text>
            <text x="1100" y="422" textAnchor="middle" fill="rgba(255,255,255,0.30)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="12">12% Stakers</text>
            <text x="1100" y="442" textAnchor="middle" fill="rgba(255,255,255,0.30)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="12">8% Treasury</text>
            <text x="1100" y="462" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="12">3% Insurance</text>
            <text x="1100" y="482" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="12">2% Burned</text>

            {/* x402 payment flow label */}
            <rect x="960" y="520" width="280" height="52" rx="8" stroke="rgba(161,161,170,0.15)" strokeWidth="1" strokeDasharray="4 3" fill="rgba(161,161,170,0.02)" />
            <text x="1100" y="542" textAnchor="middle" fill="rgba(161,161,170,0.50)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="11">USDC in  /  Swap  /  $AEGIS out</text>
            <text x="1100" y="560" textAnchor="middle" fill="rgba(255,255,255,0.22)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="10">x402 + Jupiter + Solana</text>

            {/* OBSERVATION LOOP: Validator -> Registry */}
            <path d="M 480 410 C 420 410, 420 220, 480 200" className="flow-line-obs" />
            <text x="425" y="315" textAnchor="middle" fill="rgba(161,161,170,0.25)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="9" transform="rotate(-90, 425, 315)">OBSERVATION LOOP</text>

            {/* VERTICAL: Validator -> Dispute */}
            <circle cx="670" cy="462" r="3" fill="rgba(255,255,255,0.15)" />
            <line x1="670" y1="466" x2="670" y2="588" className="flow-line-slow" />
            <text x="705" y="530" fill="rgba(255,255,255,0.22)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="11">If challenged</text>

            {/* ROW 3: Dispute Resolution */}
            <rect x="340" y="592" width="600" height="110" rx="12" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="5 3" fill="rgba(255,255,255,0.02)" />
            <text x="640" y="635" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="15" fontWeight="600">Dispute Resolution</text>
            <text x="640" y="662" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="12">$AEGIS stake-weighted resolution</text>
            <text x="640" y="684" textAnchor="middle" fill="rgba(255,255,255,0.20)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="11">Replayable audit trace on-chain</text>

            <line x1="340" y1="647" x2="210" y2="462" className="flow-line-obs" />
            <text x="258" y="565" textAnchor="middle" fill="rgba(161,161,170,0.25)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="9">Reputation update</text>

            {/* LEGEND */}
            <rect x="100" y="745" width="1140" height="50" rx="8" fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <line x1="130" y1="770" x2="175" y2="770" className="flow-line" />
            <text x="185" y="774" fill="rgba(255,255,255,0.25)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="10">On-chain transaction</text>
            <line x1="380" y1="770" x2="425" y2="770" className="flow-line-obs" />
            <text x="435" y="774" fill="rgba(255,255,255,0.25)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="10">Observation loop</text>
            <line x1="620" y1="770" x2="665" y2="770" className="flow-line-slow" />
            <text x="675" y="774" fill="rgba(255,255,255,0.25)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="10">Feedback / off-chain</text>
            <rect x="860" y="760" width="20" height="20" rx="6" stroke="rgba(161,161,170,0.12)" strokeWidth="1" strokeDasharray="3 3" fill="rgba(161,161,170,0.02)" />
            <text x="890" y="774" fill="rgba(255,255,255,0.25)" fontFamily="'Aeonik', system-ui, sans-serif" fontSize="10">Sandbox boundary</text>
          </svg>
        </motion.div>

        {/* ===== MOBILE VERTICAL FLOW ===== */}
        <motion.div {...fadeInView} className="lg:hidden space-y-0">
          {[
            { label: "Skill Creator", desc: "Uploads AI skill and stakes $AEGIS bond as quality guarantee", accent: false },
            { label: "Aegis Registry", desc: "On-chain Solana program that indexes and validates all operators", accent: true },
            { label: "Consumer Agent", desc: "Discovers and invokes skills, pays USDC via x402 micropayments", accent: false },
            { label: "Bonded Validator", desc: "Stakes $AEGIS to attest operator quality using NeMo Evaluator", accent: true },
            { label: "Revenue Split", desc: "60% creator, 15% validators, 12% stakers, 8% treasury, 3% insurance, 2% burned", accent: true },
            { label: "Dispute Resolution", desc: "Stake-weighted prediction market with replayable audit trace", accent: false },
          ].map((node, i, arr) => (
            <div key={node.label}>
              <div
                className={`p-6 border transition-colors rounded ${
                  node.accent
                    ? "border-white/[0.15] bg-white/[0.03]"
                    : "border-white/[0.07] bg-white/[0.02]"
                }`}
              >
                <div
                  className={`text-[13px] font-normal mb-1 ${
                    node.accent ? "text-zinc-300" : "text-white/70"
                  }`}
                >
                  {node.label}
                </div>
                <div className="text-[12px] text-zinc-500">{node.desc}</div>
              </div>
              {i < arr.length - 1 && (
                <div className="flex justify-center py-1">
                  <div
                    className="w-px h-8"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to bottom, rgba(161,161,170,0.3) 0, rgba(161,161,170,0.3) 4px, transparent 4px, transparent 8px)",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
