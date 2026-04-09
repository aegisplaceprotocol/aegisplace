import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import ConnectWalletButton from "@/components/ConnectWalletButton";

/* -- Link types ---------------------------------------------------------- */
interface NavLink {
  label: string;
  href: string;
  external?: boolean;
  page?: boolean;
  description?: string;
  iconUrl?: string;
}

interface NavGroup {
  label: string;
  links: NavLink[];
}

/* -- Grouped navigation structure ---------------------------------------- */
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Products",
    links: [
      { label: "AegisX IDE", href: "/aegisx", page: true, description: "57-tool AI dev environment for Solana", iconUrl: "/assets/vectorwhite.svg" },
      { label: "Skill Marketplace", href: "/skill-marketplace", page: true, description: "19,000+ MCP skills with trust and payments", iconUrl: "/assets/vectorwhite.svg" },
      { label: "Operator Marketplace", href: "/marketplace", page: true, description: "Browse bonded AI operators" },
      { label: "Playground", href: "/playground", page: true, description: "Test operator invocations live" },
    ],
  },
  {
    label: "Earn",
    links: [
      { label: "Creator Economy", href: "/earn", page: true, description: "Upload skills, earn per invocation" },
      { label: "Deploy Operator", href: "/submit", page: true, description: "Bond stake and start earning" },
      { label: "Bags.fm Integration", href: "/skill-fi", page: true, description: "Trade operator tokens on Bags", iconUrl: "/assets/solana-gradient_e9806652.png" },
      { label: "Tasks & Bounties", href: "/tasks", page: true, description: "Open work and rewards" },
    ],
  },
  {
    label: "Technology",
    links: [
      { label: "Protocol Overview", href: "/ecosystem", page: true, description: "Full stack architecture" },
      { label: "NeMo Guardrails", href: "/nvidia", page: true, description: "AI safety powered by NVIDIA", iconUrl: "/assets/nvidia_519f6f4b.png" },
      { label: "x402 Payments", href: "/x402", page: true, description: "Micropayments for agent commerce", iconUrl: "/assets/solana_f851568f.png" },
      { label: "Swarm Intelligence", href: "/swarms", page: true, description: "Multi-agent coordination" },
      { label: "Validators", href: "/validators", page: true, description: "Stake and validate quality", iconUrl: "/assets/solana_f851568f.png" },
    ],
  },
  {
    label: "Research",
    links: [
      { label: "Working Papers", href: "/research", page: true, description: "3 academic papers on agent economics" },
      { label: "Competitive Analysis", href: "/compare", page: true, description: "AegisX vs Cursor, Copilot, Windsurf" },
      { label: "Why Aegis", href: "/why", page: true, description: "$29B market, no skills marketplace" },
      { label: "Live Feed", href: "/live-feed", page: true, description: "Real-time protocol activity" },
    ],
  },
  {
    label: "Developers",
    links: [
      { label: "Connect via MCP", href: "/connect", page: true, description: "One line agent config" },
      { label: "SDK", href: "/sdk", page: true, description: "5 minutes, 10 lines of code" },
      { label: "Documentation", href: "/docs", page: true, description: "Full API and tool reference" },
      { label: "Skill Directory", href: "/skills", page: true, description: "Browse by category" },
    ],
  },
];

const FLAT_LINKS: NavLink[] = [
  { label: "Tokenomics", href: "/tokenomics", page: true },
  { label: "FAQ", href: "/faq", page: true },
];

/* -- Component ----------------------------------------------------------- */

export default function Navbar() {
  const { connected } = useWallet();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");

  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const showComingSoonToast = useCallback((label: string) => {
    toast.info(`Coming soon`, {
      description: "This part of Aegis is locked for now. It will be available very soon.",
    });
  }, []);

  /* -- Scroll detection -------------------------------------------------- */
  useEffect(() => {
    const onScroll = () => {
      const nextScrolled = window.scrollY > 20;
      setScrolled((prev) => (prev === nextScrolled ? prev : nextScrolled));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* -- Active section tracking ------------------------------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sectionIds = ["how-it-works", "demo-chat"];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  /* -- Dropdown hover logic ---------------------------------------------- */
  const openDrop = useCallback((label: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setOpenDropdown(label);
  }, []);

  const closeDrop = useCallback(() => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 150);
  }, []);

  /* -- Navigation handler ------------------------------------------------ */
  const handleClick = (link: NavLink, e: React.MouseEvent) => {
    setMobileOpen(false);
    setOpenDropdown(null);
    if (link.external) return;
    if (link.page) return;
    if (link.href.startsWith("#")) {
      e.preventDefault();
      if (window.location.pathname === "/") {
        const el = document.querySelector(link.href);
        if (el) {
          const distance = Math.abs(el.getBoundingClientRect().top);
          el.scrollIntoView({ behavior: distance > 3000 ? "instant" : "smooth", block: "start" });
        }
      } else {
        window.location.href = "/" + link.href;
      }
    }
  };

  /* -- Check if a link is active ----------------------------------------- */
  const isActive = (href: string) => {
    if (href.startsWith("#")) return activeSection === href.slice(1);
    if (href.startsWith("/")) return window.location.pathname === href;
    return false;
  };

  const isGroupActive = (group: NavGroup) => group.links.some((l) => isActive(l.href));

  return (
    <>
      <nav
        ref={navRef}
        aria-label="Main navigation"
        style={{ willChange: 'transform, background-color' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled
            ? "bg-zinc-950/92 backdrop-blur-xl border-b border-white/[0.07]"
            : "bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between h-14">
          {/* -- Logo ---------------------------------------------------- */}
          <a href="/" className="flex items-center shrink-0 group">
            <img
              src="/assets/fullvectorwhite.svg"
              alt="Aegis"
              className="h-6 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            />
          </a>

          {/* -- Desktop navigation -------------------------------------- */}
          <div className="hidden xl:flex items-center gap-0.5">
            {NAV_GROUPS.map((group) => (
              <div
                key={group.label}
                className="relative"
                onMouseEnter={() => openDrop(group.label)}
                onMouseLeave={closeDrop}
              >
                <button
                  className={`text-[12px] font-medium tracking-wide px-3 py-2 transition-colors duration-200 flex items-center gap-1.5 ${
                    isGroupActive(group)
                      ? "text-zinc-100"
                      : openDropdown === group.label
                        ? "text-zinc-300"
                        : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {group.label}
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                    className={`transition-transform duration-200 ${openDropdown === group.label ? "rotate-180" : ""}`}
                  >
                    <path d="M1.5 3L4 5.5L6.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Dropdown panel */}
                <div
                  className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-opacity duration-150 ${
                    openDropdown === group.label
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="bg-zinc-900/97 backdrop-blur-xl border border-white/[0.07] rounded-xl min-w-65 overflow-hidden shadow-xl shadow-black/30">
                    {group.links.map((link, i) => (
                      <a
                        key={link.label}
                        href={link.href}
                        onClick={(e) => handleClick(link, e)}
                        aria-current={isActive(link.href) ? "page" : undefined}
                        className={`block px-4 py-2.5 transition-colors duration-150 group/item hover:bg-white/4 ${
                          i > 0 ? "border-t border-white/4" : ""
                        } ${isActive(link.href) ? "bg-white/3" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[12px] font-medium flex items-center gap-2.5 ${
                            isActive(link.href) ? "text-zinc-100" : "text-zinc-400 group-hover/item:text-zinc-200"
                          } transition-colors`}>
                            {link.iconUrl && (
                              <img src={link.iconUrl} alt="" className="h-3.5 w-auto opacity-50 group-hover/item:opacity-80 transition-opacity" />
                            )}
                            {link.label}
                          </span>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-zinc-700 group-hover/item:text-zinc-500 transition-colors shrink-0">
                            <path d="M3 1.5H8.5V7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                            <path d="M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                          </svg>
                        </div>
                        {link.description && (
                          <p className="text-[11px] text-zinc-600 mt-0.5 group-hover/item:text-zinc-500 transition-colors">
                            {link.description}
                          </p>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Flat links */}
            {FLAT_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleClick(link, e)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`text-[12px] font-medium tracking-wide px-3 py-2 transition-colors duration-200 ${
                  isActive(link.href) ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* -- Right side CTAs ----------------------------------------- */}
          <div className="hidden xl:flex items-center gap-1.5 shrink-0">
            <ConnectWalletButton />

            <button
              type="button"
              onClick={() => showComingSoonToast("Open IDE")}
              className="hidden xl:inline-flex items-center gap-2 px-4 py-1.5 text-[12px] font-medium border border-white/8 text-white/60 hover:text-white hover:border-white/20 transition-all rounded"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Open IDE
            </button>

            {connected && (
              <a
                href="/dashboard"
                className="text-[12px] font-medium bg-white text-zinc-950 px-4 py-1.5 rounded-md hover:bg-zinc-200 transition-colors duration-200"
              >
                Dashboard
              </a>
            )}
          </div>

          {/* -- Mobile toggle ------------------------------------------- */}
          <button
            className="xl:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span className={`block w-5 h-px bg-zinc-400 transition-all duration-300 origin-center ${mobileOpen ? "rotate-45 translate-y-[3.5px]" : ""}`} />
            <span className={`block w-5 h-px bg-zinc-400 duration-300 ${mobileOpen ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`block w-5 h-px bg-zinc-400 transition-all duration-300 origin-center ${mobileOpen ? "-rotate-45 -translate-y-[3.5px]" : ""}`} />
          </button>
        </div>
      </nav>

      {/* -- Mobile menu (full-screen overlay) ----------------------------- */}
      <div
        className={`fixed inset-0 z-40 xl:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => setMobileOpen(false)} />

        {/* Panel */}
        <div
          className={`absolute top-14 left-0 right-0 bottom-0 bg-zinc-950/98 backdrop-blur-xl overflow-y-auto transition-transform duration-300 ${
            mobileOpen ? "translate-y-0" : "-translate-y-4"
          }`}
        >
          <div className="p-6 space-y-6">
            {/* Mobile menu logo */}
            <div className="pb-4 border-b border-white/[0.07]">
              <img src="/assets/fullvectorwhite.svg" alt="Aegis" className="h-5 opacity-70" />
            </div>
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase mb-3">{group.label}</p>
                <div className="space-y-0.5">
                  {group.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={(e) => handleClick(link, e)}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors duration-150 ${
                        isActive(link.href)
                          ? "text-zinc-100 bg-white/4"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/3"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {link.iconUrl && (
                          <img src={link.iconUrl} alt="" className="h-3.5 w-auto opacity-50" />
                        )}
                        <div>
                          <span className="text-[13px] font-medium">{link.label}</span>
                          {link.description && (
                            <p className="text-[11px] text-zinc-600 mt-0.5">{link.description}</p>
                          )}
                        </div>
                      </div>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-zinc-700 shrink-0">
                        <path d="M3 1.5H8.5V7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                        <path d="M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            ))}

            {/* Flat links */}
            <div>
              <p className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase mb-3">More</p>
              <div className="space-y-0.5">
                {FLAT_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleClick(link, e)}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={`block py-2.5 px-3 text-[13px] font-medium rounded-lg transition-colors duration-150 ${
                      isActive(link.href)
                        ? "text-zinc-100 bg-white/4"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/3"
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Mobile CTAs */}
            <div className="pt-4 border-t border-white/[0.07] space-y-3">
              {connected && (
                <a
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center py-2.5 text-[12px] font-medium text-zinc-950 bg-white rounded-lg hover:bg-zinc-200 transition-colors duration-200"
                >
                  Dashboard
                </a>
              )}
              <button
                onClick={() => { toast("Source code coming soon", { description: "The repository will be public once the protocol launches." }); setMobileOpen(false); }}
                className="flex items-center gap-3 py-2.5 px-3 text-[13px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer w-full"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="opacity-50">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                View Source
              </button>
              <a
                href="/docs"
                className="block text-center py-2.5 text-[12px] font-medium text-zinc-400 border border-white/[0.07] rounded-lg"
              >
                Documentation
              </a>
              <div onClick={() => setMobileOpen(false)}>
                <ConnectWalletButton variant="mobile" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
