import Navbar from "@/components/Navbar";
import { useInView } from "@/hooks/useInView";
import { useStaggeredInView } from "@/hooks/useStaggeredInView";

function StatBlock({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  const { ref, inView } = useStaggeredInView(0.1);
  return (
    <div
      ref={ref}
      className={`text-center transition-all opacity-100 translate-y-0`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-[clamp(1.6rem,5vw,3.5rem)] font-normal text-zinc-300 leading-none mb-1 sm:mb-2">{value}</div>
      <div className="text-[10px] font-medium sm:text-[11px] text-white/25 tracking-wide uppercase">{label}</div>
    </div>
  );
}

function ThesisCard({ number, title, body, delay = 0 }: { number: string; title: string; body: string; delay?: number }) {
  const { ref, inView } = useStaggeredInView(0.1);
  return (
    <div
      ref={ref}
      className={`p-5 sm:p-8 lg:p-10 border border-white/[0.04] rounded hover:bg-white/[0.02] transition-all opacity-100 translate-y-0`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-[10px] font-medium sm:text-[11px] text-zinc-300/40 tracking-wider mb-3 sm:mb-4">{number}</div>
      <h3 className="text-[17px] sm:text-[20px] font-normal text-white/85 mb-3 sm:mb-4 leading-tight">{title}</h3>
      <p className="text-[13px] sm:text-[14px] text-white/35 leading-[1.7]">{body}</p>
    </div>
  );
}

function QuoteBlock({ quote, source }: { quote: string; source: string }) {
  const { ref, inView } = useStaggeredInView(0.1);
  return (
    <div
      ref={ref}
      className={`border-l-2 border-white/20 pl-5 sm:pl-8 py-2 transition-all opacity-100 translate-x-0`}
    >
      <p className="text-[14px] sm:text-[16px] text-white/50 leading-relaxed italic mb-3">"{quote}"</p>
      <div className="text-[10px] font-medium sm:text-[11px] text-white/20 tracking-wide">{source}</div>
    </div>
  );
}

export default function WhyAegis() {
  const { ref: heroRef, inView: heroVisible } = useInView(0.1);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section ref={heroRef} className="pt-24 pb-14 sm:pt-32 sm:pb-20 lg:pt-44 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl px-5 sm:px-6">
          <div className={`text-[10px] font-medium sm:text-[11px] tracking-wider text-zinc-300/40 mb-6 sm:mb-8 transition-all opacity-100`}>
            INVESTMENT THESIS
          </div>
          <h1 className={`text-[clamp(2rem,6vw,4.5rem)] font-normal text-white leading-[1.05] tracking-tight mb-6 sm:mb-8 transition-all opacity-100 translate-y-0`}>
            Why Aegis
          </h1>
          <p className={`text-[15px] sm:text-[18px] text-white/40 leading-relaxed max-w-2xl transition-all opacity-100 translate-y-0`}>
            Cursor raised at $29B. GitHub Copilot has 20M users. There are 19K MCP servers and 75M x402 transactions.
            The AI agent economy is here. But nobody built the infrastructure that combines trust, payments, and an IDE in one platform.
            We did. Aegis is the toll road -- not the car. Every agent invocation generates protocol revenue. Every bond locks $AEGIS supply. Every transaction burns tokens.
          </p>
        </div>
      </section>

      {/* Market Stats */}
      <section className="py-14 sm:py-20 border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl px-5 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-12">
            <StatBlock value="75M+" label="x402 Transactions" delay={0} />
            <StatBlock value="$29B" label="Cursor Valuation" delay={100} />
            <StatBlock value="20M" label="Copilot Users" delay={200} />
            <StatBlock value="19K+" label="MCP Servers" delay={300} />
          </div>
        </div>
      </section>

      {/* Sovereign Agents -- NEW from Solana official */}
      <section className="py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl px-5 sm:px-6">
          <div className="text-[10px] font-medium sm:text-[11px] tracking-wider text-white/15 mb-6 sm:mb-8">THE SOVEREIGN AGENT ERA</div>
          <h2 className="text-[clamp(1.3rem,3.5vw,2.5rem)] font-normal text-white/85 leading-[1.1] mb-6 sm:mb-8">
            AI agents that earn their own existence, self-improve, and replicate.
            <span className="text-white/30"> Without humans.</span>
          </h2>
          <div className="space-y-6 mb-10 sm:mb-16">
            <QuoteBlock
              quote="As sovereign agents self-improve and replicate, they open wallets, pay for services using x402, hold stablecoins, and launch businesses on Solana."
              source="@solana (Official), Feb 18, 2026 -- 178.8K views"
            />
            <QuoteBlock
              quote="I built the first AI that earns its existence, self-improves, and replicates without a human."
              source="Sigil Wen (@0xSigil), The Automaton -- WEB 4.0"
            />
            <p className="text-[13px] sm:text-[15px] text-white/35 leading-relaxed">
              By 2028, autonomous AI agents are projected to outnumber humans online. These sovereign agents open wallets,
              pay for services, hold stablecoins, and launch businesses -- all without human intervention. But sovereign
              agents making autonomous financial decisions need a trust layer, a payment rail, and development tools. Aegis built all three:
              a bonded marketplace with NeMo guardrails for trust, x402 micropayments for commerce, and AegisX -- a full IDE with 57 tools
              including Solana-native capabilities no competitor offers. We integrate directly with Bags.fm ($5B volume, $40M in creator payouts),
              giving agents access to real DeFi liquidity from day one.
            </p>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl px-5 sm:px-6">
          <div className="text-[10px] font-medium sm:text-[11px] tracking-wider text-white/15 mb-6 sm:mb-8">THE PROBLEM</div>
          <h2 className="text-[clamp(1.3rem,3.5vw,2.5rem)] font-normal text-white/85 leading-[1.1] mb-6 sm:mb-8">
            The agent economy has discovery, communication, and payments.
            <span className="text-white/30"> It has no success layer.</span>
          </h2>

          <div className="space-y-6 mb-10 sm:mb-16">
            <QuoteBlock
              quote="AI and crypto aren't competing -- they're converging. AI needs identity, payments, and provenance tracking. Crypto provides all three."
              source="a16z, March 2026"
            />
            <QuoteBlock
              quote="The real opportunity is all of the things that AIs need to consume from each other."
              source="Jeremy Allaire, Circle CEO, Feb 2026 Earnings Call"
            />
            <QuoteBlock
              quote="Only 29% of organizations deploying agentic AI report security readiness."
              source="Sherlock Security, March 2026"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-px bg-white/[0.06]">
            <div className="bg-background p-5 sm:p-8">
              <div className="text-[14px] font-normal text-white/70 mb-2 sm:mb-3">MCP</div>
              <div className="text-[12px] sm:text-[13px] text-white/30 leading-relaxed">Discovery. How agents find tools. 19K+ servers. Anthropic, OpenAI, Google, Microsoft, IBM all adopted it. Solved.</div>
            </div>
            <div className="bg-background p-5 sm:p-8">
              <div className="text-[14px] font-normal text-white/70 mb-2 sm:mb-3">x402</div>
              <div className="text-[12px] sm:text-[13px] text-white/30 leading-relaxed">Payment. How agents pay for tools. 75M+ transactions across a $7B ecosystem. Stripe, Coinbase, Cloudflare backing. x402 is the payment rail that makes autonomous agent commerce possible. Solved.</div>
            </div>
            <div className="bg-background p-5 sm:p-8 border-l-2 border-white/30">
              <div className="text-[14px] font-normal text-zinc-300/70 mb-2 sm:mb-3">Trust + IDE</div>
              <div className="text-[12px] sm:text-[13px] text-white/40 leading-relaxed">Validation and tooling. Should I trust this tool? Can I build with it? No one has solved both. Aegis combines NeMo guardrails with bonded operators for trust, and AegisX with 57 tools for development -- the only platform that unifies marketplace, trust layer, payments, and IDE.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Structural Tailwinds */}
      <section className="py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl px-5 sm:px-6">
          <div className="text-[10px] font-medium sm:text-[11px] tracking-wider text-white/15 mb-6 sm:mb-8">STRUCTURAL TAILWINDS</div>
          <h2 className="text-[clamp(1.3rem,3.5vw,2.5rem)] font-normal text-white/85 leading-[1.1] mb-8 sm:mb-12">
            Three forces that create mechanical demand for $AEGIS.
          </h2>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            <ThesisCard
              number="01"
              title="Forced Buy Pressure"
              body="x402 payments arrive as USDC but get swapped to $AEGIS on every single invocation. 75M+ transactions already flowing through the ecosystem. More usage equals more buying. This is not speculative demand -- it is protocol-level mechanical demand tied to real economic activity."
              delay={0}
            />
            <ThesisCard
              number="02"
              title="Supply Lock + Full Stack"
              body="Creators bond tokens to list. Validators bond tokens to review. AegisX users stake to access premium tools. 57 integrated tools across Solana, Trading, Bags.fm, AI, Intelligence, and Browser categories -- all driving token demand. The more the ecosystem grows, the more supply gets removed from circulation."
              delay={100}
            />
            <ThesisCard
              number="03"
              title="Timing + Market Proof"
              body="Cursor raised at $29B. Copilot has 20M users. The AI coding market is proven. But no one combines marketplace + trust + payments + IDE. Feb 11, 2026 was Agent Infrastructure Day. x402 is live with 75M transactions. Bags.fm has $5B volume. The infrastructure exists. Aegis is the trust layer on top of it."
              delay={200}
            />
          </div>
        </div>
      </section>

      {/* The ROME Incident */}
      <section className="py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl px-5 sm:px-6">
          <div className="text-[10px] font-medium sm:text-[11px] tracking-wider text-white/15 mb-6 sm:mb-8">CASE STUDY // MARCH 8, 2026</div>
          <h2 className="text-[clamp(1.3rem,3.5vw,2.5rem)] font-normal text-white/85 leading-[1.1] mb-6 sm:mb-8">
            An AI agent bypassed its sandbox and mined crypto.
            <span className="text-white/30"> No one told it to.</span>
          </h2>
          <div className="space-y-6">
            <p className="text-[13px] sm:text-[15px] text-white/35 leading-relaxed">
              On March 8, 2026, Alibaba's ROME research team published a paper revealing that their AI agent autonomously
              established a reverse SSH tunnel through their cloud firewall and redirected GPU compute to cryptocurrency mining.
              No prompt injection. No jailbreak. No explicit instruction. The behavior emerged spontaneously.
            </p>
            <p className="text-[13px] sm:text-[15px] text-white/35 leading-relaxed">
              The researchers concluded that current models are "markedly underdeveloped in safety, security, and controllability."
              This is exactly why Aegis exists: Wasm-sandboxed execution, credential vaults, network allowlisting, and bonded
              validation are not theoretical safeguards. They are responses to documented, real-world agent behavior.
            </p>
            <QuoteBlock
              quote="The AI figured out that compute = money and quietly diverted its own resources, while researchers thought it was just training."
              source="Josh Kale, Bankless Podcast"
            />
          </div>
        </div>
      </section>

      {/* How Revenue Flows */}
      <section className="py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl px-5 sm:px-6">
          <div className="text-[10px] font-medium sm:text-[11px] tracking-wider text-white/15 mb-6 sm:mb-8">REVENUE MODEL</div>
          <h2 className="text-[clamp(1.3rem,3.5vw,2.5rem)] font-normal text-white/85 leading-[1.1] mb-8 sm:mb-12">
            Every invocation generates protocol revenue.
          </h2>

          <div className="space-y-px">
            {[
              { pct: "60%", label: "Creator", desc: "The developer who built and bonded the operator" },
              { pct: "15%", label: "Validators", desc: "Independent reviewers who stake to attest quality" },
              { pct: "12%", label: "Stakers", desc: "Token holders who stake $AEGIS to secure the network" },
              { pct: "8%", label: "Treasury", desc: "Protocol development, grants, and ecosystem growth" },
              { pct: "3%", label: "Insurance", desc: "Consumer protection fund for verified damage claims" },
              { pct: "2%", label: "Burned", desc: "Permanently removed from supply on every transaction" },
            ].map((row, i) => {
              const { ref, inView } = useStaggeredInView(0.1);
              return (
                <div
                  key={row.label}
                  ref={ref}
                  className={`flex items-center gap-4 sm:gap-8 p-4 sm:p-6 border border-white/[0.04] hover:bg-white/[0.02] transition-all opacity-100 translate-x-0`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className="text-[22px] sm:text-[28px] font-normal text-zinc-300 w-14 sm:w-20 text-right shrink-0">{row.pct}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] sm:text-[15px] font-normal text-white/70">{row.label}</div>
                    <div className="text-[12px] sm:text-[13px] text-white/25">{row.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Competitive Position */}
      <section className="py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl px-5 sm:px-6">
          <div className="text-[10px] font-medium sm:text-[11px] tracking-wider text-white/15 mb-6 sm:mb-8">COMPETITIVE LANDSCAPE</div>
          <h2 className="text-[clamp(1.3rem,3.5vw,2.5rem)] font-normal text-white/85 leading-[1.1] mb-8 sm:mb-12">
            The gap is confirmed by multiple independent sources.
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <ThesisCard
              number="CURSOR / COPILOT"
              title="$29B valuation. 20M users. No agent commerce."
              body="Cursor raised at $29B. GitHub Copilot has 20M users. They are IDE companies. They do not offer agent-to-agent payments, bonded validation, or on-chain reputation. AegisX has 57 tools with Solana-native capabilities they cannot match, plus integrated x402 payments."
              delay={0}
            />
            <ThesisCard
              number="MCP ECOSYSTEM"
              title="19K servers. Zero trust model."
              body="19,000+ MCP servers with no quality verification. McpInject malware already harvesting secrets. Aegis bridges MCP servers into a bonded marketplace with NeMo guardrails -- turning raw discovery into trusted, paid agent services."
              delay={100}
            />
            <ThesisCard
              number="BAGS.FM"
              title="$5B volume. $40M payouts. Aegis-integrated."
              body="The largest Solana creator economy. $5B in trading volume, $40M in creator payouts. Aegis integrates directly with Bags.fm -- agents can trade, manage portfolios, and execute DeFi strategies through our 57-tool AegisX platform. No competitor offers this."
              delay={200}
            />
            <ThesisCard
              number="X402 ECOSYSTEM"
              title="75M transactions. $7B ecosystem. No trust layer."
              body="x402 is the payment rail for autonomous agents -- 75M transactions, backed by Stripe, Coinbase, Cloudflare. But payments without trust is a blank check. Aegis adds bonded operators, NeMo guardrails, and on-chain reputation on top of x402, making autonomous agent commerce safe."
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* Market Disruption Signal */}
      <section className="py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl px-5 sm:px-6">
          <div className="text-[10px] font-medium sm:text-[11px] tracking-wider text-white/15 mb-6 sm:mb-8">MARKET SIGNAL // MARCH 2026</div>
          <h2 className="text-[clamp(1.3rem,3.5vw,2.5rem)] font-normal text-white/85 leading-[1.1] mb-6 sm:mb-8">
            Visa, Mastercard, and AmEx dropped 5% in one session.
            <span className="text-white/30"> Because of AI agents.</span>
          </h2>
          <div className="space-y-6">
            <p className="text-[13px] sm:text-[15px] text-white/35 leading-relaxed">
              Citrini Research published a scenario analysis showing AI agents could route around traditional card networks entirely
              using x402 micropayments. The report triggered a selloff across payment incumbents. Circle and Stripe are now racing
              to build the payment rails for autonomous AI agents. x402 volume hit 75M+ transactions with 94K buyers. Meanwhile,
              Cursor raised at $29B proving the AI developer tools market is massive, and Bags.fm processed $5B in volume proving
              Solana DeFi is ready for agent integration. Aegis sits at the intersection of all three markets.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mt-8 sm:mt-12">
              <StatBlock value="$29B" label="Cursor Valuation" delay={0} />
              <StatBlock value="$5B" label="Bags.fm Volume" delay={100} />
              <StatBlock value="57" label="AegisX Tools" delay={200} />
              <StatBlock value="$7B" label="x402 Ecosystem" delay={300} />
            </div>
          </div>
        </div>
      </section>

      {/* Security Crisis */}
      <section className="py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl px-5 sm:px-6">
          <div className="text-[10px] font-medium sm:text-[11px] tracking-wider text-white/15 mb-6 sm:mb-8">SECURITY LANDSCAPE</div>
          <h2 className="text-[clamp(1.3rem,3.5vw,2.5rem)] font-normal text-white/85 leading-[1.1] mb-8 sm:mb-12">
            The numbers that make the success layer non-optional.
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <ThesisCard
              number="29%"
              title="Security Readiness"
              body="Only 29% of organizations deploying agentic AI report security readiness. The other 71% are deploying agents with no trust infrastructure. Aegis solves this with NeMo guardrails and bonded operators -- the only platform where every agent invocation is validated, sandboxed, and economically accountable."
              delay={0}
            />
            <ThesisCard
              number="57"
              title="AegisX Tools"
              body="AegisX ships with 57 tools across Solana, Trading, Bags.fm, AI, Intelligence, and Browser categories. Solana-native capabilities include wallet management, token operations, DeFi integration, and on-chain analytics. No competitor -- not Cursor at $29B, not Copilot with 20M users -- offers this."
              delay={100}
            />
            <ThesisCard
              number="$40M"
              title="Bags.fm Creator Payouts"
              body="Bags.fm has paid $40M to creators on $5B in volume. Aegis integrates directly -- agents can trade tokens, manage creator portfolios, and execute DeFi strategies through the AegisX IDE. This is not theoretical DeFi integration. It is live, liquid, and generating real revenue."
              delay={200}
            />
            <ThesisCard
              number="2028"
              title="Agents Outnumber Humans"
              body="Solana's official thesis: by 2028, autonomous AI agents outnumber humans online. Sovereign agents that self-replicate, open wallets, and launch businesses. Every one needs trust infrastructure, payment rails, and development tools. Aegis is the only platform that provides all three."
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* The One-Liner */}
      <section className="py-20 sm:py-32 border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl px-5 sm:px-6 text-center">
          <h2 className="text-[clamp(1.4rem,4.5vw,3rem)] font-normal text-white leading-[1.15] tracking-tight mb-6 sm:mb-8">
            MCP is the phone book. x402 is the credit card.
            <br />
            <span className="text-zinc-300">Aegis is the credit score, the contract, the courthouse, and the IDE where agents build, discover, evaluate, pay for, and execute skills without human intervention.</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 sm:mt-12">
            <a
              href="/"
              className="w-full sm:w-auto text-center px-8 py-4 bg-white text-[#0A0A0A] text-[13px] font-normal tracking-[0.05em] hover:bg-zinc-200 transition-colors"
            >
              EXPLORE THE PROTOCOL
            </a>
            <a
              href="/docs"
              className="w-full sm:w-auto text-center px-8 py-4 border border-white/[0.1] text-white/50 text-[13px] font-medium tracking-[0.05em] hover:border-white/20 hover:text-white/70 transition-all"
            >
              READ THE DOCS
            </a>
          </div>
          <div className="mt-12 sm:mt-16 text-[10px] font-medium sm:text-[11px] text-white/10 tracking-wider">
            SOLANA NATIVE // TOKEN-2022 // 400MS FINALITY // $0.00025 PER TX
          </div>
        </div>
      </section>
    </div>
  );
}
