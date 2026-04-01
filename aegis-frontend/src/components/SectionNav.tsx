import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "about", icon: "home", label: "HQ" },
  { id: "how-it-works", icon: "protocol", label: "Mission" },
  { id: "stack", icon: "layers", label: "Stack" },
  { id: "evolution", icon: "evolve", label: "Evolution" },
  { id: "highlights", icon: "star", label: "Advantage" },
  { id: "skill-marketplace", icon: "market", label: "Skills" },
  { id: "features", icon: "grid", label: "Arsenal" },
  { id: "x402-tracker", icon: "activity", label: "x402 Live" },
  { id: "tokenomics", icon: "token", label: "Treasury" },
  { id: "terminal", icon: "code", label: "Terminal" },
  { id: "faq", icon: "help", label: "Intel" },
];

function NavIcon({ type, active }: { type: string; active: boolean }) {
  const color = active ? "#A1A1AA" : "rgba(255,255,255,0.25)";
  const size = 18;

  switch (type) {
    case "home":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "protocol":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case "grid":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      );
    case "star":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "token":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" />
        </svg>
      );
    case "code":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case "layers":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 22 8.5 12 15 2 8.5 12 2" />
          <polyline points="2 15.5 12 22 22 15.5" />
          <polyline points="2 12 12 18.5 22 12" />
        </svg>
      );
    case "activity":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "map":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
      );
    case "help":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "market":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case "evolve":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      );
    default:
      return null;
  }
}

export default function SectionNav() {
  const [activeId, setActiveId] = useState("about");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero
      setVisible(window.scrollY > 400);

      // Find which section is most in view
      let best = "about";
      let bestRatio = 0;

      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const top = Math.max(0, rect.top);
        const bottom = Math.min(vh, rect.bottom);
        const visible = Math.max(0, bottom - top);
        const ratio = visible / vh;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = s.id;
        }
      }
      setActiveId(best);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const distance = Math.abs(el.getBoundingClientRect().top);
    // Use instant scroll for long distances (>3000px) to avoid jank
    // Smooth scroll only for nearby sections
    if (distance > 3000) {
      el.scrollIntoView({ behavior: "instant", block: "start" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      style={{ willChange: 'transform' }}
      className={`fixed left-3 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-1 transition-opacity duration-300 ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.04] rounded py-4 px-2 flex flex-col items-center gap-1">
        {SECTIONS.map((s) => {
          const isActive = activeId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`relative w-10 h-10 flex items-center justify-center rounded transition-all duration-300 group ${
                isActive
                  ? "bg-white/10"
                  : "hover:bg-white/[0.04]"
              }`}
              aria-label={s.label}
            >
              <NavIcon type={s.icon} active={isActive} />

              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-2.5 py-1 text-[11px] font-medium tracking-wide whitespace-nowrap bg-black/90 border border-white/10 rounded text-white/70 opacity-0 group-hover:opacity-100 duration-200 pointer-events-none">
                {s.label}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute -right-0.5 w-1 h-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
