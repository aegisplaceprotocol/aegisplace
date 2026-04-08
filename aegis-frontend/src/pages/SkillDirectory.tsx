import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { fadeInView, staggerContainer, staggerItem } from "@/lib/animations";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";

/* ── Skill data types ────────────────────────────────────────────────── */

interface Skill {
  name: string;
  provider: string;
  providerType: "Aegis Native" | "OpenClaw" | "MCP" | "Solana Agent Kit" | "Community" | "Partner";
  description: string;
  tags: string[];
  status: "live" | "beta" | "coming-soon";
}

interface Category {
  icon: string;
  name: string;
  description: string;
  skills: Skill[];
}

/* ── Category metadata ────────────────────────────────────────────────── */

const CATEGORY_META: Record<string, { icon: string; description: string }> = {
  "code-review": { icon: "\uD83D\uDCBB", description: "Code review, debugging, refactoring, and CI/CD automation" },
  "security-audit": { icon: "\uD83D\uDD12", description: "Vulnerability scanning, threat detection, and compliance auditing" },
  "financial-analysis": { icon: "\uD83D\uDCCA", description: "Trading, DeFi, yield optimization, and market analysis" },
  "data-extraction": { icon: "\uD83D\uDCC8", description: "On-chain analytics, data pipelines, and intelligence gathering" },
  "sentiment-analysis": { icon: "\uD83D\uDCAC", description: "Social sentiment analysis and mood tracking" },
  "search": { icon: "\uD83D\uDD0D", description: "Research, search, and fact verification" },
  "text-generation": { icon: "\u270D\uFE0F", description: "Technical writing, documentation, and content generation" },
  "translation": { icon: "\uD83C\uDF10", description: "Multi-language translation for agents" },
  "summarization": { icon: "\uD83D\uDCDD", description: "Summarization of meetings, documents, and contracts" },
  "image-generation": { icon: "\uD83C\uDFA8", description: "Image generation, vision, and visual analysis" },
  "classification": { icon: "\uD83C\uDFF7\uFE0F", description: "Classification, categorization, and governance analysis" },
  "other": { icon: "\u2699\uFE0F", description: "Infrastructure, automation, and specialized tools" },
};

/* ── Provider badge colors ───────────────────────────────────────────── */

function providerBadge(type: string) {
  switch (type) {
    case "Aegis Native": return "bg-white/[0.08] text-white/70 border-white/[0.12]";
    case "Solana Agent Kit": return "bg-white/[0.05] text-white/50 border-white/[0.08]";
    case "OpenClaw": return "bg-white/[0.05] text-white/60 border-white/[0.08]";
    case "MCP": return "bg-white/[0.05] text-white/60 border-white/[0.08]";
    case "Partner": return "bg-white/[0.05] text-white/50 border-white/[0.08]";
    default: return "bg-white/[0.03] text-white/40 border-white/[0.06]";
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "live": return "bg-white/[0.08] text-white/70";
    case "beta": return "bg-white/[0.05] text-white/40";
    default: return "bg-white/[0.03] text-white/30";
  }
}

/* ── Main component ──────────────────────────────────────────────────── */

export default function SkillDirectory() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const operatorsQuery = trpc.operator.list.useQuery({ limit: 200 });

  const CATEGORIES = useMemo((): Category[] => {
    const ops = operatorsQuery.data?.operators ?? [];
    // Group operators by category
    const grouped: Record<string, typeof ops> = {};
    ops.forEach(o => {
      if (!grouped[o.category]) grouped[o.category] = [];
      grouped[o.category].push(o);
    });

    return Object.entries(grouped)
      .map(([cat, skills]) => ({
        icon: CATEGORY_META[cat]?.icon ?? "\u2699\uFE0F",
        name: cat.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" "),
        description: CATEGORY_META[cat]?.description ?? "Specialized operator skills",
        skills: skills.map(s => {
          const tags: string[] = (() => { try { return typeof s.tags === "string" ? JSON.parse(s.tags) : (s.tags ?? []); } catch { return []; } })();
          return {
            name: s.name,
            provider: s.creatorWallet?.slice(0, 8) ?? "Aegis",
            providerType: (s.isVerified ? "Aegis Native" : "Community") as Skill["providerType"],
            description: s.description ?? "",
            tags,
            status: (s.isActive ? "live" : "beta") as Skill["status"],
          };
        }),
      }))
      .sort((a, b) => b.skills.length - a.skills.length);
  }, [operatorsQuery.data]);

  const totalSkills = useMemo(() => CATEGORIES.reduce((sum, c) => sum + c.skills.length, 0), [CATEGORIES]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES;
    const q = searchQuery.toLowerCase();
    return CATEGORIES.map((cat) => ({
      ...cat,
      skills: cat.skills.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.includes(q)) ||
          s.provider.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.skills.length > 0);
  }, [searchQuery, CATEGORIES]);

  const activeCategory = selectedCategory
    ? filteredCategories.find((c) => c.name === selectedCategory)
    : null;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@300;400;500&display=swap');`}</style>
      <Navbar />
      {/* Breadcrumb nav */}
      <nav className="sticky top-[88px] z-40 border-b border-white/[0.07] bg-[#0A0A0B]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1520px] px-12 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-medium text-xs text-white/30 hover:text-white/50 transition-colors">
              home
            </Link>
            <span className="text-white/10">/</span>
            {selectedCategory ? (
              <>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="font-medium text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  skills
                </button>
                <span className="text-white/10">/</span>
                <span className="font-medium text-xs text-white/60">{selectedCategory.toLowerCase()}</span>
              </>
            ) : (
              <span className="font-medium text-xs text-white/60">skills</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/skill-marketplace" className="text-[11px] font-medium text-zinc-300/60 hover:text-zinc-300 transition-colors">
              Skill Marketplace
            </Link>
            <Link href="/marketplace" className="text-[11px] font-medium text-white/30 hover:text-white/50 transition-colors">
              Operators
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1520px] px-12 pb-16">
        {operatorsQuery.isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-sm text-white/30">Loading skills...</div>
          </div>
        ) : !selectedCategory ? (
          /* ── Category list view ──────────────────────────────────────── */
          <>
            <motion.div {...fadeInView} className="mb-8 sm:mb-10">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight mb-3 text-white/92">
                Skill Directory
              </h1>
              <p className="text-sm sm:text-base text-white/40 max-w-xl mb-4">
                Curated skills for AI agents. Find what you need, tell your operator, get to work.
              </p>
              <p className="text-xs text-white/25 max-w-xl mb-4">
                Every skill here works inside AegisX. Search from the IDE terminal with <span className="font-mono text-white/35">aegisx skills search</span> or browse the chat panel to install directly.
              </p>
              <p className="font-medium text-xs text-white/20">
                {totalSkills} skills across {CATEGORIES.length} categories
              </p>
            </motion.div>

            {/* Search */}
            <motion.div {...fadeInView} className="mb-6 sm:mb-8">
              <div className="relative max-w-md">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  placeholder="Search skills, tags, providers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded pl-10 pr-4 py-2.5 text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            </motion.div>

            {/* Category cards */}
            <motion.div {...staggerContainer} className="space-y-2">
              {filteredCategories.map((cat) => (
                <motion.button
                  {...staggerItem}
                  key={cat.name}
                  onClick={() => { setSelectedCategory(cat.name); setSearchQuery(""); }}
                  className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.025] hover:border-white/[0.08] transition-all group text-left"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span className="text-lg sm:text-xl shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <div className="font-medium text-sm sm:text-base text-white/80 group-hover:text-white transition-colors">
                        {cat.name}
                      </div>
                      <div className="text-[11px] sm:text-xs text-white/30 mt-0.5 truncate">
                        {cat.description}
                      </div>
                    </div>
                  </div>
                  <span className="font-medium text-xs text-white/20 shrink-0 ml-3">
                    {cat.skills.length} {cat.skills.length === 1 ? "skill" : "skills"}
                  </span>
                </motion.button>
              ))}
            </motion.div>

            {/* Marketplace CTA */}
            <div className="mt-8 sm:mt-10 border border-white/[0.05] bg-white/[0.015] p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-sm font-normal text-white/80 mb-1">Built a skill? Start earning.</h3>
                  <p className="text-xs text-white/44">Upload your skill to the marketplace and get paid every time an agent uses it.</p>
                </div>
                <Link href="/skill-marketplace?tab=upload" className="text-xs font-medium bg-white text-zinc-900 px-5 py-2.5 hover:bg-zinc-200 transition-colors shrink-0 text-center">
                  Publish a Skill
                </Link>
              </div>
            </div>

            {/* Machine-readable endpoint */}
            <div className="mt-6 pt-6 border-t border-white/[0.07]">
              <p className="text-[11px] font-medium text-white/20">
                AGENTS: This directory is also available as machine-readable JSON at{" "}
                <span className="text-zinc-300/50 hover:text-zinc-300 cursor-pointer">/api/skills.json</span>
              </p>
            </div>
          </>
        ) : activeCategory ? (
          /* ── Skill list view ─────────────────────────────────────────── */
          <>
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl sm:text-2xl">{activeCategory.icon}</span>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-normal tracking-tight text-white/92">
                  {activeCategory.name}
                </h1>
              </div>
              <p className="text-sm text-white/40 mb-2">{activeCategory.description}</p>
              <p className="font-medium text-xs text-white/20">
                {activeCategory.skills.length} {activeCategory.skills.length === 1 ? "skill" : "skills"}
              </p>
            </div>

            {/* Search within category */}
            <div className="mb-5 sm:mb-6">
              <div className="relative max-w-md">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  placeholder={`Search ${activeCategory.name.toLowerCase()} skills...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded pl-10 pr-4 py-2.5 text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            </div>

            {/* Skill cards */}
            <div className="space-y-2">
              {(searchQuery
                ? activeCategory.skills.filter(
                    (s) =>
                      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.tags.some((t) => t.includes(searchQuery.toLowerCase()))
                  )
                : activeCategory.skills
              ).map((skill) => (
                <div
                  key={skill.name}
                  className="border border-white/[0.05] p-6 bg-white/[0.015] hover:bg-white/[0.025] hover:border-white/[0.08] transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm sm:text-base text-white/80">{skill.name}</span>
                        <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded border ${providerBadge(skill.providerType)}`}>
                          {skill.provider}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded ${statusBadge(skill.status)}`}>
                        {skill.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] sm:text-xs text-white/40 leading-relaxed mb-2.5">
                    {skill.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 flex-wrap">
                      {skill.tags.map((t) => (
                        <span key={t} className="text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 bg-white/[0.04] text-white/25 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                    <Link
                      href="/skill-marketplace"
                      className="text-[10px] font-medium sm:text-[11px] text-zinc-300/50 hover:text-zinc-300 transition-colors shrink-0 ml-2"
                    >
                      marketplace &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Back button */}
            <div className="mt-6 sm:mt-8">
              <button
                onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
                className="font-medium text-xs text-white/30 hover:text-white/50 transition-colors flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back to all categories
              </button>
            </div>
          </>
        ) : null}
      </div>
      <MobileBottomNav />
    </div>
  );
}
