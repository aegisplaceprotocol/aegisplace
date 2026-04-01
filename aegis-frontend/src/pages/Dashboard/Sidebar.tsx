/**
 * Aegis Dashboard. Sidebar Navigation
 */
import { useState, useCallback } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import { type DashSection, NAV_GROUPS } from "./theme";
import { SIcon } from "./icons";
import { Spark } from "./icons";
import { DEMO_SPARKLINE } from "./constants";

export function Sidebar({ section, setSection, onClose, isMobile }: {
  section: DashSection; setSection: (s: DashSection) => void; onClose?: () => void; isMobile?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const statsQuery = trpc.stats.overview.useQuery(undefined, { staleTime: 300_000 });
  const stats = statsQuery.data as Record<string, unknown> | undefined;
  const displayRevenue = stats?.totalEarnings
    ? `$${Math.floor(parseFloat(String(stats.totalEarnings))).toLocaleString()}`
    : "...";
  const displayOps = (stats?.totalOperators as number)?.toLocaleString() ?? "0";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText("7f3aGh23jKlMnOpQrStUvWxDk9x").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, []);

  /* ── Collapsible group state (persisted) ─────────────────────────────── */
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("aegis_sidebar_state");
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    const defaults: Record<string, boolean> = { "Command Center": true, "Operations": true };
    if (isMobile) return defaults;
    return { ...defaults, "Marketplace": true, "Protocol": true, "Intelligence": true, "Infrastructure": true, "Account": true };
  });

  const toggleGroup = useCallback((group: string) => {
    setOpenGroups(prev => {
      const next = { ...prev, [group]: !prev[group] };
      try { localStorage.setItem("aegis_sidebar_state", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return (
    <div style={{
      width: 260,
      height: "100%",
      background: T.bg,
      borderRight: `1px solid ${T.borderSubtle}`,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Logo */}
      <div style={{ padding: "28px 20px 24px" }}>
        <img src="/assets/fullvectorwhite.svg" alt="Aegis" style={{ height: 18, opacity: 0.85 }} />
      </div>

      {/* Protocol stats */}
      <div style={{ margin: "0 20px 24px", paddingBottom: 20, borderBottom: `1px solid ${T.borderSubtle}` }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, fontWeight: 400, color: T.text20, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            Protocol Revenue
          </div>
          <div style={{ fontSize: 20, fontWeight: 300, fontVariantNumeric: "tabular-nums", color: T.text80, letterSpacing: "-0.01em" }}>
            {displayRevenue}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <Spark data={DEMO_SPARKLINE} width={210} height={20} />
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 400, color: T.text20, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Operators</div>
            <div style={{ fontSize: 13, fontWeight: 300, color: T.text50, fontVariantNumeric: "tabular-nums" }}>{displayOps}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 400, color: T.text20, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Success</div>
            <div style={{ fontSize: 13, fontWeight: 300, color: T.text50, fontVariantNumeric: "tabular-nums" }}>
              {(stats?.totalInvocations as number) > 0
                ? `${(((stats?.health as Record<string, number>)?.healthy || 0) / Math.max(1, (stats?.realOperators as number || 1)) * 100).toFixed(1)}%`
                : "--"}
            </div>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        {NAV_GROUPS.map((g) => {
          const isOpen = openGroups[g.title] ?? false;
          const hasActive = g.items.some(item => item.section === section);
          return (
            <div key={g.title} style={{ marginBottom: 8 }}>
              <button
                onClick={() => toggleGroup(g.title)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 12px",
                  marginBottom: isOpen ? 4 : 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span style={{
                  fontSize: 10,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  color: hasActive ? T.text20 : T.text12,
                  transition: "color 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}>
                  {g.title === "Bags" && (
                    <img src="/assets/icons/bags.svg" alt="" width={11} height={11} style={{ opacity: hasActive ? 0.5 : 0.25 }} />
                  )}
                  {g.title}
                </span>
                <svg
                  width="8" height="8" viewBox="0 0 10 10"
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.25s ease",
                    opacity: 0.12,
                  }}
                >
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
                </svg>
              </button>

              <div style={{
                maxHeight: isOpen ? `${g.items.length * 44}px` : "0px",
                overflow: "hidden",
                transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease",
                opacity: isOpen ? 1 : 0,
              }}>
                {g.items.map((item, index) => {
                  const active = item.section === section;
                  return (
                    <div
                      key={item.section}
                      style={{
                        opacity: isOpen ? 1 : 0,
                        transform: isOpen ? "translateY(0)" : "translateY(-4px)",
                        transition: `opacity 0.25s ease ${index * 0.03}s, transform 0.25s ease ${index * 0.03}s`,
                      }}
                    >
                      <button
                        onClick={() => { setSection(item.section); onClose?.(); }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 12px",
                          borderRadius: 0,
                          border: "none",
                          textAlign: "left" as const,
                          fontSize: 12,
                          cursor: "pointer",
                          background: "transparent",
                          borderLeft: active ? `1.5px solid rgba(255,255,255,0.15)` : "1.5px solid transparent",
                          color: active ? T.text50 : T.text20,
                          fontWeight: 400,
                          transition: "all 0.15s",
                        }}
                      >
                        {item.section === "bags" ? (
                          <img src="/assets/icons/bags.svg" alt="" width={13} height={13} style={{ opacity: active ? 0.5 : 0.2, flexShrink: 0 }} />
                        ) : (
                          <SIcon name={item.icon} size={13} className={active ? "text-white/30" : "text-white/10"} />
                        )}
                        <span>{item.label}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Promo box */}
      <div style={{ margin: "0 16px 16px", borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
        <video autoPlay loop muted playsInline src="/videos/AegisSprite.mp4" style={{ width: "100%", display: "block" }} />
        <div style={{ padding: "10px 14px" }}>
          <div style={{ fontSize: 13, color: T.text50, marginBottom: 2 }}>New skills every day.</div>
          <div style={{ fontSize: 12, color: T.text25 }}>{displayOps} operators and counting &rarr;</div>
        </div>
      </div>

      {/* Bottom links */}
      <div style={{ padding: "0 16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        <Link href="/">
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.text25, cursor: "pointer", transition: "color 0.15s", padding: "4px 0" }}>
            <SIcon name="external" size={14} /> Back to site
          </span>
        </Link>
        <Link href="/docs">
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.text25, cursor: "pointer", transition: "color 0.15s", padding: "4px 0" }}>
            <SIcon name="book" size={14} /> Help & Support
          </span>
        </Link>
      </div>
    </div>
  );
}
