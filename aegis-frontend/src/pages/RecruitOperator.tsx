import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { SkillUploadPanel } from "@/components/SkillUploadModal";

const PROCESS_STEPS = [
  {
    title: "Define the public listing",
    description: "Set the operator name, slug, category, tagline, and marketplace-facing description.",
  },
  {
    title: "Add private instructions",
    description: "Upload the private SKILL.md payload that buyers unlock after payment.",
  },
  {
    title: "Register on Solana",
    description: "Your wallet signs the on-chain register_operator transaction before the marketplace listing goes live.",
  },
  {
    title: "Publish and earn",
    description: "The operator becomes discoverable in the marketplace and revenue flows per paid invocation.",
  },
] as const;

const REQUIREMENTS = [
  "Connected and authenticated Solana wallet",
  "Public description for the marketplace card and detail page",
  "Private SKILL.md content for the paid operator payload",
  "Optional docs, GitHub, and icon links for the listing",
] as const;

const MARKET_NOTES = [
  "Operators and skills use the same listing model in Aegis.",
  "No deployment URL is required for registration in the current protocol model.",
  "The public metadata stays visible while the private markdown stays paywalled.",
] as const;

export default function RecruitOperator() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@300;400;500&display=swap');`}</style>
      <Navbar />

      <main className="mx-auto max-w-380 px-6 pb-28 pt-24 md:px-12">
        <div className="mb-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[10px] font-medium text-zinc-300/60 bg-white/4 border border-white/10 px-3 py-1 rounded-full">
                OPERATOR REGISTRATION
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight leading-[0.95] mb-8">
              <span className="text-white/90">Register</span>
              <br />
              <span className="text-white/30">your operator.</span>
            </h1>
            <p className="max-w-xl text-md md:text-lg text-white/40 leading-relaxed">
              Start earning 85% of every invocation. Your operator becomes discoverable across the x402 payment network.
            </p>
          </div>

          <Link href="/marketplace" className="w-fit rounded-md border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white">
            Back to marketplace
          </Link>
        </div>

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <SkillUploadPanel variant="page" mode="operator" />

          <aside className="space-y-8 xl:sticky xl:top-24">
            <section className="border border-white/8 bg-white/2 p-8">
              <h3 className="text-[13px] font-medium text-zinc-300/60 tracking-wider mb-6">STEP FLOW</h3>
              <div className="space-y-4">
                {PROCESS_STEPS.map((step, index) => (
                  <div key={step.title} className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-white/8 bg-white/3 text-[10px] font-normal text-white/40">
                      {index + 1}
                    </div>
                    <div>
                      <h2 className="text-[13px] font-normal text-white/70">{step.title}</h2>
                      <p className="mt-1 text-[12px] leading-relaxed text-white/30">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="border border-white/8 bg-white/2 p-8">
              <h3 className="text-[13px] font-medium text-zinc-300/60 tracking-wider mb-6">WHAT YOU NEED</h3>
              <div className="space-y-3">
                {REQUIREMENTS.map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-[12px] text-white/35 leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B981]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="border border-white/8 bg-white/2 p-8">
              <h3 className="text-[13px] font-medium text-zinc-300/60 tracking-wider mb-6">REGISTRY MODEL</h3>
              <div className="space-y-3">
                {MARKET_NOTES.map((item) => (
                  <p key={item} className="text-[12px] leading-relaxed text-white/30">
                    {item}
                  </p>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
