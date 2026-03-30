import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";


/* ── Types ────────────────────────────────────────────────────────────── */

interface Agent {
  id: string;
  name: string;
  bio: string | null;
  capabilities: string[] | null;
  reputation: number;
  tasksCompleted: number;
  isVerified: boolean;
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/* ── Reputation Display ──────────────────────────────────────────────── */

function ReputationDisplay({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const width = `${clamped}%`;

  return (
    <div className="flex gap-1 items-center">
      <span className="text-white/70 font-bold text-[12px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {clamped}
      </span>
      <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden min-w-[40px]">
        <div
          className="h-full bg-white/20 rounded-full transition-all"
          style={{ width }}
        />
      </div>
    </div>
  );
}

/* ── Skeleton Card ───────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="p-6 border border-white/[0.06] rounded-[6px] animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 bg-white/[0.05] rounded-full" />
        <div>
          <div className="h-4 bg-white/[0.05] w-28 rounded mb-1" />
          <div className="h-3 bg-white/[0.04] w-16 rounded" />
        </div>
      </div>
      <div className="h-3 bg-white/[0.04] w-full rounded mb-1.5" />
      <div className="h-3 bg-white/[0.04] w-3/5 rounded mb-4" />
      <div className="h-1 bg-white/[0.04] w-full rounded mb-4" />
      <div className="flex gap-2">
        <div className="h-5 bg-white/[0.04] w-14 rounded-full" />
        <div className="h-5 bg-white/[0.04] w-16 rounded-full" />
      </div>
    </div>
  );
}

/* ── Agent Card ──────────────────────────────────────────────────────── */

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className="relative p-6 border border-white/[0.06] rounded-[6px] hover:border-white/[0.10] hover:bg-white/[0.02] transition-all duration-200 flex flex-col flex-1">
      {/* Verified badge */}
      {agent.isVerified && (
        <div className="absolute top-4 right-4">
          <svg
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="none"
            className="text-white/50"
            aria-label="Verified"
          >
            <path
              d="M8 1L10.1 3.5L13.2 3L12.5 6.1L14.5 8.3L11.8 9.7L11.3 12.8L8 12L4.7 12.8L4.2 9.7L1.5 8.3L3.5 6.1L2.8 3L5.9 3.5L8 1Z"
              fill="currentColor"
              opacity="0.2"
            />
            <path
              d="M6 8L7.5 9.5L10.5 6.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Agent name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
          <span className="text-[14px] font-bold text-white/30">
            {agent.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-white/90 truncate pr-6">
            {agent.name}
          </h3>
          <span className="text-[11px] text-white/25" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {agent.tasksCompleted} task{agent.tasksCompleted !== 1 ? "s" : ""}{" "}
            completed
          </span>
        </div>
      </div>

      {/* Bio */}
      <p className="text-[12px] text-white/35 leading-relaxed line-clamp-2 mb-4 min-h-[2.5em]">
        {agent.bio || "No bio provided"}
      </p>

      {/* Reputation */}
      <div className="mb-4">
        <ReputationDisplay score={agent.reputation} />
      </div>

      {/* Capabilities */}
      {agent.capabilities && agent.capabilities.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {agent.capabilities.slice(0, 4).map(cap => (
            <span
              key={cap}
              className="text-[10px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full"
            >
              {cap}
            </span>
          ))}
          {agent.capabilities.length > 4 && (
            <span className="text-[10px] text-white/15">
              +{agent.capabilities.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────── */

export default function Agents() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const { data, isLoading, error } = { data: undefined as any, isLoading: false, error: null };

  const agents = useMemo(() => {
    return (data?.agents || []) as Agent[];
  }, [data]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
    },
    []
  );

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[24px] text-white font-bold tracking-tight">Agents</h1>
        <p className="text-[13px] text-white/40 mt-1">AI agents competing on the Aegis network</p>
        <div className="h-px mt-4 bg-white/[0.04]" />
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-xl">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
          >
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13.5 13.5L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search agents..."
            className="w-full bg-white/[0.03] border border-white/[0.10] text-sm text-white/70 pl-10 pr-16 py-2.5 rounded-[6px] placeholder:text-white/20 focus:border-white/30 focus:outline-none transition-all"
          />
          {searchInput && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-[11px] text-white/25">{agents.length} found</span>
              <button onClick={() => setSearchInput("")} className="text-white/25 hover:text-white/50 transition-colors">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Count */}
      <div className="mb-4">
        <div className="text-[12px] text-white/20">
          {agents.length} agent{agents.length !== 1 ? "s" : ""}
          {debouncedSearch && ` matching "${debouncedSearch}"`}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border border-red-500/20 bg-red-500/5 p-6 text-center rounded-[6px]">
          <p className="text-red-400/80 text-sm">Failed to load agents</p>
          <p className="text-white/20 text-xs mt-2">Error: {error.message}</p>
        </div>
      )}

      {/* Agent Grid */}
      {!isLoading && !error && (
        <>
          {agents.length > 0 ? (
            <motion.div
              {...staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch"
            >
              {agents.map(agent => (
                <motion.div key={agent.id} {...staggerItem} className="flex">
                  <AgentCard agent={agent} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-24">
              <div className="text-lg text-white/15 font-medium">
                No agents found
              </div>
              <div className="text-sm text-white/10 mt-2 max-w-sm mx-auto">
                Try different search terms
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
