import { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { type DashSection } from "./Dashboard/theme";
import { T } from "./Dashboard/theme";
import { SIcon } from "./Dashboard/icons";
import { Sidebar } from "./Dashboard/Sidebar";

/* ── Lazy pages (public site embeds) ───────────────────────────────────── */

const Playground = lazy(() => import("./Playground"));
const Leaderboard = lazy(() => import("./Leaderboard"));
const RoyaltiesPage = lazy(() => import("./Royalties"));

/* ── Lazy dashboard panels ─────────────────────────────────────────────── */

const OverviewPanel = lazy(() => import("./Dashboard/OverviewPanel"));
const OperatorsPanel = lazy(() => import("./Dashboard/OperatorsPanel"));
const EarningsPanel = lazy(() => import("./Dashboard/EarningsPanel"));
const ActivityPanel = lazy(() => import("./Dashboard/ActivityPanel"));
const ConnectPanel = lazy(() => import("./Dashboard/ConnectPanel"));
const SettingsPanel = lazy(() => import("./Dashboard/SettingsPanel"));
const LiveFeedPanel = lazy(() => import("./Dashboard/LiveFeedPanel"));
const MissionsPanel = lazy(() => import("./Dashboard/MissionsPanel"));
const DelegationPanel = lazy(() => import("./Dashboard/DelegationPanel"));
const SkillMarketplacePanel = lazy(() => import("./Dashboard/SkillMarketplacePanel"));
const OperatorDirectoryPanel = lazy(() => import("./Dashboard/OperatorDirectoryPanel"));
const MissionBlueprintsPanel = lazy(() => import("./Dashboard/MissionBlueprintsPanel"));
const ValidatorsPanelNew = lazy(() => import("./Dashboard/ValidatorsPanel"));
const X402TrackerPanel = lazy(() => import("./Dashboard/X402TrackerPanel"));
const BurnTrackerPanel = lazy(() => import("./Dashboard/BurnTrackerPanel"));
const EconomicsPanel = lazy(() => import("./Dashboard/EconomicsPanel"));
const DisputesPanelNew = lazy(() => import("./Dashboard/DisputesPanel"));
const ArsenalPanel = lazy(() => import("./Dashboard/ArsenalPanel"));
const EvolutionPanel = lazy(() => import("./Dashboard/EvolutionPanel"));
const SwarmsPanel = lazy(() => import("./Dashboard/SwarmsPanel"));
const ResearchPanel = lazy(() => import("./Dashboard/ResearchPanel"));
const ComputePanel = lazy(() => import("./Dashboard/ComputePanel"));
const NvidiaPanel = lazy(() => import("./Dashboard/NvidiaPanel"));
const EcosystemPanel = lazy(() => import("./Dashboard/EcosystemPanel"));
const ApiKeysPanel = lazy(() => import("./Dashboard/ApiKeysPanel"));
const NotificationsPanel = lazy(() => import("./Dashboard/NotificationsPanel"));
const BagsPanel = lazy(() => import("./Dashboard/BagsPanel"));

/* ── Types ──────────────────────────────────────────────────────────────── */

export type { DashSection };

/* ── Main Dashboard ─────────────────────────────────────────────────────── */

const FALLBACK = <div style={{ padding: 32, color: "rgba(255,255,255,0.2)", fontSize: 13 }}>Loading...</div>;

function PanelSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={FALLBACK}>{children}</Suspense>;
}

export default function Dashboard() {
  const [section, setSection] = useState<DashSection>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  const renderContent = () => {
    switch (section) {
      /* Command Center */
      case "overview":    return <PanelSuspense><OverviewPanel /></PanelSuspense>;
      case "live-feed":   return <PanelSuspense><LiveFeedPanel /></PanelSuspense>;
      case "activity":    return <PanelSuspense><ActivityPanel /></PanelSuspense>;
      /* Operations */
      case "operators":   return <PanelSuspense><OperatorsPanel /></PanelSuspense>;
      case "earnings":    return <PanelSuspense><EarningsPanel /></PanelSuspense>;
      case "royalties":   return <PanelSuspense><RoyaltiesPage /></PanelSuspense>;
      case "missions":    return <PanelSuspense><MissionsPanel /></PanelSuspense>;
      case "delegation":  return <PanelSuspense><DelegationPanel /></PanelSuspense>;
      /* Marketplace */
      case "skill-marketplace":  return <PanelSuspense><SkillMarketplacePanel /></PanelSuspense>;
      case "operator-directory": return <PanelSuspense><OperatorDirectoryPanel /></PanelSuspense>;
      case "leaderboard":        return <PanelSuspense><Leaderboard /></PanelSuspense>;
      case "mission-blueprints": return <PanelSuspense><MissionBlueprintsPanel /></PanelSuspense>;
      /* Protocol */
      case "validators":    return <PanelSuspense><ValidatorsPanelNew /></PanelSuspense>;
      case "x402-tracker":  return <PanelSuspense><X402TrackerPanel /></PanelSuspense>;
      case "burn-tracker":  return <PanelSuspense><BurnTrackerPanel /></PanelSuspense>;
      case "economics":     return <PanelSuspense><EconomicsPanel /></PanelSuspense>;
      case "disputes":      return <PanelSuspense><DisputesPanelNew /></PanelSuspense>;
      /* Intelligence */
      case "arsenal":    return <PanelSuspense><ArsenalPanel /></PanelSuspense>;
      case "evolution":  return <PanelSuspense><EvolutionPanel /></PanelSuspense>;
      case "swarms":     return <PanelSuspense><SwarmsPanel /></PanelSuspense>;
      case "research":   return <PanelSuspense><ResearchPanel /></PanelSuspense>;
      /* Infrastructure */
      case "connect":    return <PanelSuspense><ConnectPanel /></PanelSuspense>;
      case "compute":    return <PanelSuspense><ComputePanel /></PanelSuspense>;
      case "nvidia":     return <PanelSuspense><NvidiaPanel /></PanelSuspense>;
      case "ecosystem":  return <PanelSuspense><EcosystemPanel /></PanelSuspense>;
      case "playground": return <PanelSuspense><Playground /></PanelSuspense>;
      /* Bags */
      case "bags":       return <PanelSuspense><BagsPanel /></PanelSuspense>;
      /* Account */
      case "settings":      return <PanelSuspense><SettingsPanel /></PanelSuspense>;
      case "api-keys":      return <PanelSuspense><ApiKeysPanel /></PanelSuspense>;
      case "notifications": return <PanelSuspense><NotificationsPanel /></PanelSuspense>;
      default:              return <PanelSuspense><OverviewPanel /></PanelSuspense>;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex" style={{ flexShrink: 0, width: 260 }}>
        <Sidebar section={section} setSection={setSection} />
      </div>

      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden"
        style={{ padding: 8, borderRadius: 6, background: T.white6, border: `1px solid ${T.border}` }}>
        <SIcon name="grid" size={18} className="text-white/50" />
      </button>

      {/* Mobile overlay sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 md:hidden"
              style={{ background: "rgba(0,0,0,0.6)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)} />
            <motion.div className="fixed inset-y-0 left-0 z-50 md:hidden"
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}>
              <Sidebar section={section} setSection={setSection} onClose={() => setMobileOpen(false)} isMobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin" as const }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 16px" }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
