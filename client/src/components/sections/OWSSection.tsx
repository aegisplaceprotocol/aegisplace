import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";
import { Link } from "wouter";

const STACK = [
  { name: "AI Agent", desc: "Claude, GPT, any MCP client" },
  { name: "Aegis", desc: "452 operators, guardrails, success scoring" },
  { name: "x402", desc: "Per-call USDC micropayments" },
  { name: "OWS", desc: "Encrypted vault, policy engine, isolated signing" },
  { name: "Solana", desc: "400ms finality, $0.00025 per transaction" },
];

const POLICIES = [
  { rule: "Max per transaction", value: "$1.00 USDC" },
  { rule: "Max per hour", value: "$10.00 USDC" },
  { rule: "Max per day", value: "$50.00 USDC" },
  { rule: "Operator success minimum", value: "70+" },
  { rule: "Simulation required above", value: "$5.00" },
];

export default function OWSSection() {
  return (
    <section className="py-20 border-t border-white/[0.04]">
      <div className="container">
        <motion.div {...fadeInView} className="mb-8">
          <span className="text-[11px] font-medium text-white/20 uppercase tracking-[0.2em]">
            AGENT WALLETS
          </span>
        </motion.div>

        <motion.div
          {...fadeInView}
          className="grid lg:grid-cols-2 gap-px bg-white/[0.04] border border-white/[0.04] mb-10"
        >
          {/* Left. headline + stack */}
          <div className="bg-white/[0.015] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-[clamp(1.75rem,4.5vw,2.5rem)] font-normal text-white leading-[1.05] tracking-tight mb-4">
                Keys never leave the machine.
              </h2>
              <p className="text-[14px] text-white/30 leading-relaxed mb-10">
                Open Wallet Standard gives agents encrypted local wallets with
                policy-controlled spending. No cloud. No exposed keys. Signing
                happens in isolated memory.
              </p>

              {/* Stack diagram */}
              <div>
                {STACK.map((layer, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between py-3.5 ${
                      i < STACK.length - 1 ? "border-b border-white/[0.04]" : ""
                    }`}
                  >
                    <span className="text-[14px] font-medium text-white/60">
                      {layer.name}
                    </span>
                    <span className="text-[12px] text-white/20">
                      {layer.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/docs"
                className="text-[12px] text-white/25 hover:text-white/45 transition-colors"
              >
                Set up agent wallet
              </Link>
            </div>
          </div>

          {/* Right. policy engine + stats */}
          <div className="bg-white/[0.01] flex flex-col justify-between">
            <div>
              <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
                <div className="text-[10px] font-medium text-white/20 tracking-[0.12em] mb-3">
                  POLICY ENGINE
                </div>
                <p className="text-[13px] text-white/25 leading-relaxed">
                  Agents set spending limits before any key is touched. Policies
                  are enforced locally. Transactions that exceed limits are
                  blocked at the signing layer.
                </p>
              </div>

              <div className="px-6 sm:px-8">
                {POLICIES.map((p, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between py-3 ${
                      i < POLICIES.length - 1
                        ? "border-b border-white/[0.04]"
                        : ""
                    }`}
                  >
                    <span className="text-[12px] text-white/30">{p.rule}</span>
                    <span className="text-[13px] text-white/50">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-px bg-white/[0.04] border-t border-white/[0.04] mt-6">
              {[
                { value: "AES-256", label: "Encryption" },
                { value: "Zero", label: "Key exposure" },
                { value: "Local", label: "Infrastructure" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/[0.015] p-5 sm:p-6">
                  <div className="text-[18px] font-normal text-white/60">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-white/15 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
