import { useEffect, useState } from "react";

const NAV_ITEMS = [
  {
    id: "home",
    label: "Home",
    href: "/",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#A1A1AA" : "rgba(255,255,255,0.35)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "earn",
    label: "Earn",
    href: "/earn",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#A1A1AA" : "rgba(255,255,255,0.35)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" />
      </svg>
    ),
  },
  {
    id: "tokenomics",
    label: "Token",
    href: "/tokenomics",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#A1A1AA" : "rgba(255,255,255,0.35)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: "aegisx",
    label: "AegisX",
    href: "/aegisx",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#9945FF" : "rgba(255,255,255,0.35)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
  },
  {
    id: "ecosystem",
    label: "Stack",
    href: "/ecosystem",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#A1A1AA" : "rgba(255,255,255,0.35)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
];

export default function MobileBottomNav() {
  const [activeId, setActiveId] = useState("home");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Set active based on current path
    const path = window.location.pathname;
    const match = NAV_ITEMS.find((item) => item.href === path);
    if (match) setActiveId(match.id);
    else setActiveId("home");
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;

        if (currentY > lastScrollY + 10 && currentY > 200) {
          setVisible(false);
        } else if (currentY < lastScrollY - 5 || currentY < 100) {
          setVisible(true);
        }
        lastScrollY = currentY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigateTo = (href: string, id: string) => {
    setActiveId(id);
    if (href === "/" && window.location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.location.href = href;
  };

  return (
    <nav
      role="navigation"
      aria-label="Mobile navigation"
      className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-all duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {/* Top edge glow */}
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#A1A1AA]/20 to-transparent" />

      <div className="bg-zinc-950/95 backdrop-blur-2xl border-t border-white/[0.07]">
        <div className="flex items-center justify-around h-[56px] px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.href, item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-all duration-200 ${
                  isActive ? "scale-105" : "opacity-70"
                }`}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon(isActive)}
                <span
                  className={`text-[10px] font-medium tracking-wider transition-colors duration-200 ${
                    isActive ? "text-zinc-300" : "text-white/30"
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -top-px left-1/2 -translate-x-1/2 w-5 h-[2px] bg-white/60 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Safe area padding for notched phones */}
      <div className="bg-zinc-950/95 h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
