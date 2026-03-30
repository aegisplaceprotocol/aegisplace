import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import ConnectWalletButton from "@/components/ConnectWalletButton";

/* -- Link types ---------------------------------------------------------- */
interface NavLink {
  label: string;
  href: string;
  external?: boolean;
  page?: boolean;
  description?: string;
  /** Optional small inline logo URL (white PNG) */
  iconUrl?: string;
}

interface NavGroup {
  label: string;
  links: NavLink[];
}

/* -- Grouped navigation structure ---------------------------------------- */
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Earn",
    links: [
      { label: "Creator Economy", href: "/earn", page: true, description: "Upload skills, earn from every agent invocation" },
      { label: "Upload Operator", href: "/submit", page: true, description: "Deploy and start earning" },
      { label: "Marketplace", href: "/marketplace", page: true, description: "Browse and discover operators" },
      { label: "Skill Marketplace", href: "/skill-marketplace", page: true, description: "Build skills, earn per use" },
      { label: "Earnings Calculator", href: "/earn#calculator", page: true, description: "Model your operator revenue" },
    ],
  },
  {
    label: "Protocol",
    links: [
      { label: "Arsenal", href: "/arsenal", page: true, description: "15 protocol primitives" },
      { label: "Evolution Engine", href: "/evolution", page: true, description: "Operator lifecycle and upgrades" },
      { label: "Swarm Intelligence", href: "/swarms", page: true, description: "Autonomous multi-agent coordination" },
      { label: "Research", href: "/research", page: true, description: "Whitepaper and technical docs" },
    ],
  },
  {
    label: "Ecosystem",
    links: [
      { label: "Full Stack", href: "/ecosystem", page: true, description: "Where Aegis sits in the AI agent economy" },
      { label: "NVIDIA NeMo Stack", href: "/nvidia", page: true, description: "7 NeMo pillars powering every operator", iconUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663305557175/YNULcqsamfwqB8eQkc2VNX/nvidia_519f6f4b.png" },
      { label: "GPU Compute", href: "/compute", page: true, description: "Every GPU becomes a potential earner", iconUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663305557175/YNULcqsamfwqB8eQkc2VNX/nvidia_519f6f4b.png" },
      { label: "Validator Corps", href: "/validators", page: true, description: "Stake and validate operator quality", iconUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663305557175/YNULcqsamfwqB8eQkc2VNX/solana_f851568f.png" },
      { label: "x402 Tracker", href: "/x402", page: true, description: "Live x402 payment stream", iconUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663305557175/YNULcqsamfwqB8eQkc2VNX/solana_f851568f.png" },
      { label: "Intel Feed", href: "/live-feed", page: true, description: "Real-time operator invocations" },
    ],
  },
  {
    label: "Build",
    links: [
      { label: "SDK Integration", href: "/sdk", page: true, description: "5 minutes, 10 lines of code" },
      { label: "Mission Builder", href: "/missions/new", page: true, description: "Compose structured task briefings" },
      { label: "Playground", href: "/playground", page: true, description: "Interactive terminal simulator" },
    ],
  },
];

const FLAT_LINKS: NavLink[] = [
  { label: "Research", href: "/research", page: true },
  { label: "Docs", href: "/docs", page: true },
];

/* -- Component ----------------------------------------------------------- */

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");

  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  /* -- Scroll detection -------------------------------------------------- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
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
        className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* -- Logo ---------------------------------------------------- */}
          <a href="/" className="flex items-center shrink-0 group">
            <img
              src="/assets/fullvectorwhite.svg"
              alt="Aegis"
              className="h-5 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
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
                  className={`text-sm px-3 py-2 transition-colors flex items-center gap-1.5 ${
                    isGroupActive(group)
                      ? "text-white"
                      : openDropdown === group.label
                        ? "text-white"
                        : "text-zinc-400 hover:text-white"
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
                  <div className="bg-zinc-800/97 backdrop-blur-xl border border-white/[0.07] rounded min-w-[240px] overflow-hidden shadow-xl shadow-black/20">
                    {group.links.map((link, i) => (
                      <a
                        key={link.label}
                        href={link.href}
                        onClick={(e) => handleClick(link, e)}
                        className={`block px-4 py-2.5 transition-colors duration-150 group/item hover:bg-white/[0.04] ${
                          i > 0 ? "border-t border-white/[0.04]" : ""
                        } ${isActive(link.href) ? "bg-white/[0.03]" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[12px] font-medium flex items-center gap-2 ${
                            isActive(link.href) ? "text-zinc-100" : "text-zinc-400 group-hover/item:text-zinc-200"
                          } transition-colors`}>
                            {link.iconUrl && (
                              <img src={link.iconUrl} alt="" className="h-3 w-auto opacity-50 group-hover/item:opacity-80 transition-opacity" />
                            )}
                            {link.label}
                          </span>
                          {link.page && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-zinc-700 group-hover/item:text-zinc-500 transition-colors">
                              <path d="M3 1.5H8.5V7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                              <path d="M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                            </svg>
                          )}
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
                className={`text-sm px-3 py-2 transition-colors ${
                  isActive(link.href) ? "text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* -- Right side CTAs ----------------------------------------- */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            <button
              onClick={() => toast("Dashboard coming soon", { description: "The full dashboard launches with mainnet." })}
              className="border border-white/[0.12] px-4 py-1.5 text-[13px] hover:border-white/20 transition-colors text-zinc-300 hover:text-white rounded cursor-pointer"
            >
              Dashboard
            </button>

            <button
              onClick={() => toast("Wallet connect coming soon", { description: "Phantom and Solflare support launching with mainnet." })}
              className="bg-white text-zinc-900 px-4 py-1.5 text-[13px] font-medium hover:bg-zinc-200 transition-colors rounded cursor-pointer"
            >
              Connect Wallet
            </button>
          </div>

          {/* -- Mobile toggle ------------------------------------------- */}
          <button
            className="xl:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
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
          className={`absolute top-[56px] left-0 right-0 bottom-0 bg-white/[0.02]/98 backdrop-blur-xl overflow-y-auto transition-transform duration-300 ${
            mobileOpen ? "translate-y-0" : "-translate-y-4"
          }`}
        >
          <div className="p-6 space-y-6">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase mb-3">{group.label}</p>
                <div className="space-y-0.5">
                  {group.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={(e) => handleClick(link, e)}
                      className={`flex items-center justify-between py-2.5 px-3 rounded transition-colors duration-150 ${
                        isActive(link.href)
                          ? "text-zinc-100 bg-white/[0.04]"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                      }`}
                    >
                      <div>
                        <span className="text-[13px] font-medium">{link.label}</span>
                        {link.description && (
                          <p className="text-[11px] text-zinc-600 mt-0.5">{link.description}</p>
                        )}
                      </div>
                      {link.page && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-zinc-700 shrink-0">
                          <path d="M3 1.5H8.5V7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                          <path d="M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                        </svg>
                      )}
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
                    className={`block py-2.5 px-3 text-[13px] font-medium rounded transition-colors duration-150 ${
                      isActive(link.href)
                        ? "text-zinc-100 bg-white/[0.04]"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Mobile CTAs */}
            <div className="pt-4 border-t border-white/[0.07] space-y-3">
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
                className="block text-center py-2.5 text-[12px] font-medium text-zinc-400 border border-white/[0.07] rounded"
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
