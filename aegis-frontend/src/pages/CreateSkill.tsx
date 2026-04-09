import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { SkillUploadPanel } from "@/components/SkillUploadModal";

export default function CreateSkill() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@300;400;500&display=swap');`}</style>
      <Navbar />
      <main className="mx-auto max-w-380 px-12 pb-28 pt-24">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-normal tracking-tight text-white md:text-5xl">Create a skill with on-chain presence.</h1>
            <p className="mt-3 text-sm leading-6 text-white/60 md:text-base">
              This flow registers the skill in the Aegis Solana devnet program first, then publishes the markdown listing metadata used by the frontend, REST API, and MCP server.
            </p>
          </div>
          <Link href="/skill-marketplace" className="w-fit rounded-md border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white">
            Back to marketplace
          </Link>
        </div>

        <SkillUploadPanel variant="page" />
      </main>
      <MobileBottomNav />
    </div>
  );
}
