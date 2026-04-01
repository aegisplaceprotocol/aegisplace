/**
 * Persistent sidebar/drawer showing session audit trail.
 * Every operator inspected, clearance check, invocation -- as a clean timeline.
 * Rebranded from AGIJobManager's Activity Concierge into Aegis military language.
 */
import { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";

/* ── Activity types ──────────────────────────────────────────────────── */
export type ActivityType =
  | "page_visit"
  | "operator_inspect"
  | "clearance_check"
  | "invocation"
  | "mission_deploy"
  | "skill_browse"
  | "playground_cmd"
  | "dashboard_view";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  label: string;
  detail: string;
  timestamp: Date;
  status?: "success" | "pending" | "failed";
  meta?: Record<string, string>;
}

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  page_visit: ">>",
  operator_inspect: "{}",
  clearance_check: "!!",
  invocation: "$>",
  mission_deploy: "=>",
  skill_browse: "[]",
  playground_cmd: ">_",
  dashboard_view: "##",
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  page_visit: "#ffffff20",
  operator_inspect: "#A1A1AA",
  clearance_check: "#FFD93D",
  invocation: "#A1A1AA",
  mission_deploy: "#A78BFA",
  skill_browse: "#60A5FA",
  playground_cmd: "#F472B6",
  dashboard_view: "rgba(52,211,153,0.55)",
};

/* ── Context for global activity tracking ────────────────────────────── */
interface ActivityContextType {
  activities: ActivityEntry[];
  addActivity: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void;
  clearActivities: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ActivityContext = createContext<ActivityContextType>({
  activities: [],
  addActivity: () => {},
  clearActivities: () => {},
  isOpen: false,
  setIsOpen: () => {},
});

export function useActivity() {
  return useContext(ActivityContext);
}

/* ── Provider ────────────────────────────────────────────────────────── */
export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<ActivityEntry[]>(() => {
    // Seed with some initial activity for demo purposes
    const now = new Date();
    return [
      {
        id: "seed-1",
        type: "page_visit",
        label: "Session Started",
        detail: "Aegis Protocol initialized",
        timestamp: new Date(now.getTime() - 120000),
        status: "success",
      },
      {
        id: "seed-2",
        type: "dashboard_view",
        label: "Dashboard Accessed",
        detail: "Protocol telemetry loaded",
        timestamp: new Date(now.getTime() - 90000),
        status: "success",
      },
      {
        id: "seed-3",
        type: "operator_inspect",
        label: "Operator Inspected",
        detail: "sentinel-prime.sol -- Trust: 97.2",
        timestamp: new Date(now.getTime() - 60000),
        status: "success",
        meta: { operator: "sentinel-prime.sol", trust: "97.2", mission: "", result: "", amount: "" },
      },
      {
        id: "seed-4",
        type: "clearance_check",
        label: "Clearance Check",
        detail: "code-review mission -- CLEARED",
        timestamp: new Date(now.getTime() - 45000),
        status: "success",
        meta: { mission: "code-review", result: "CLEARED", operator: "", trust: "", amount: "" },
      },
      {
        id: "seed-5",
        type: "invocation",
        label: "x402 Invocation",
        detail: "sentinel-prime.sol -- 2,400 $AEGIS",
        timestamp: new Date(now.getTime() - 30000),
        status: "success",
        meta: { operator: "sentinel-prime.sol", amount: "2,400", mission: "", result: "", trust: "" },
      },
      {
        id: "seed-6",
        type: "skill_browse",
        label: "Skill Directory",
        detail: "Browsed Trading category -- 32 skills",
        timestamp: new Date(now.getTime() - 15000),
        status: "success",
      },
    ];
  });
  const [isOpen, setIsOpen] = useState(false);

  const addActivity = useCallback((entry: Omit<ActivityEntry, "id" | "timestamp">) => {
    const newEntry: ActivityEntry = {
      ...entry,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date(),
    };
    setActivities(prev => [newEntry, ...prev].slice(0, 50));
  }, []);

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  return (
    <ActivityContext.Provider value={{ activities, addActivity, clearActivities, isOpen, setIsOpen }}>
      {children}
    </ActivityContext.Provider>
  );
}

/* ── Time ago helper ─────────────────────────────────────────────────── */
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/* ── Activity entry row ──────────────────────────────────────────────── */
function ActivityRow({ entry, isNew }: { entry: ActivityEntry; isNew: boolean }) {
  const color = ACTIVITY_COLORS[entry.type];
  const icon = ACTIVITY_ICONS[entry.type];

  return (
    <div className={`flex gap-3 py-3 px-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-all ${isNew ? "animate-in slide-in-from-top-2 duration-300" : ""}`}>
      {/* Icon */}
      <div
        className="w-7 h-7 border flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ borderColor: `${color}33`, backgroundColor: `${color}08` }}
      >
        <span className="text-[8px] font-normal" style={{ color }}>{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-white/50 truncate">{entry.label}</span>
          {entry.status && (
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              entry.status === "success" ? "bg-white" :
              entry.status === "pending" ? "bg-amber-400 animate-pulse" :
              "bg-red-400"
            }`} />
          )}
        </div>
        <div className="text-[9px] font-medium text-white/20 mt-0.5 truncate">{entry.detail}</div>
      </div>

      {/* Time */}
      <div className="text-[8px] text-white/10 flex-shrink-0 mt-1">
        {timeAgo(entry.timestamp)}
      </div>
    </div>
  );
}

/* ── Main Sidebar Component ──────────────────────────────────────────── */
export function ActivityConciergeDrawer() {
  const { activities, clearActivities, isOpen, setIsOpen } = useActivity();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [timeNow, setTimeNow] = useState(Date.now());

  // Update "time ago" every 10 seconds
  useEffect(() => {
    const iv = setInterval(() => setTimeNow(Date.now()), 10000);
    return () => clearInterval(iv);
  }, []);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, setIsOpen]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (isOpen && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, setIsOpen]);

  const successCount = activities.filter(a => a.status === "success").length;
  const pendingCount = activities.filter(a => a.status === "pending").length;
  const failedCount = activities.filter(a => a.status === "failed").length;

  return (
    <>
      {/* Toggle button - fixed bottom right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 w-12 h-12 border flex items-center justify-center transition-all group ${
          isOpen
            ? "border-white/30 bg-white/10"
            : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isOpen ? "#A1A1AA" : "rgba(255,255,255,0.3)"} strokeWidth="1.5">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {activities.length > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black text-[8px] font-normal flex items-center justify-center">
            {activities.length}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-white/[0.04] backdrop-blur-sm" />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 z-50 h-full w-[360px] max-w-[90vw] bg-white/[0.02] border-l border-white/[0.04] transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-white" />
              <span className="text-[10px] font-medium text-zinc-300/40 tracking-wider">ACTIVITY CONCIERGE</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white/50 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="text-[9px] font-medium text-white/25">{successCount} completed</span>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[9px] font-medium text-white/25">{pendingCount} pending</span>
              </div>
            )}
            {failedCount > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="text-[9px] font-medium text-white/25">{failedCount} failed</span>
              </div>
            )}
            <button
              onClick={clearActivities}
              className="ml-auto text-[9px] font-medium text-white/10 hover:text-red-400/40 transition-colors"
            >
              CLEAR
            </button>
          </div>
        </div>

        {/* Activity list */}
        <div className="overflow-y-auto h-[calc(100%-120px)]" key={timeNow}>
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-12 h-12 border border-white/[0.04] flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-[11px] font-medium text-white/20 mb-1">No activity yet</div>
              <div className="text-[9px] font-medium text-white/10">
                Browse operators, run clearance checks, and deploy missions to populate your audit trail.
              </div>
            </div>
          ) : (
            activities.map((entry, i) => (
              <ActivityRow key={entry.id} entry={entry} isNew={i === 0} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-3 border-t border-white/[0.04] bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-white/10">SESSION AUDIT TRAIL</span>
            <span className="text-[8px] text-white/10">{activities.length} events</span>
          </div>
        </div>
      </div>
    </>
  );
}
