import { useLiveFeed } from "@/hooks/useLiveFeed";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

export default function ActivityTicker() {
  const { events, connected } = useLiveFeed();
  const statsQuery = trpc.stats.overview.useQuery(undefined, {
    staleTime: 60_000,
  });

  // Format events into ticker items
  const tickerItems = useMemo(() => {
    const items: { text: string }[] = [];

    // Add real SSE events
    for (const evt of events.slice(-20)) {
      const data = evt.data as Record<string, unknown>;
      if (evt.event === "invocation") {
        items.push({
          text: `${(data.operatorName as string) || (data.operatorSlug as string) || "operator"} invoked ${data.responseMs}ms`,
        });
      } else if (evt.event === "registration") {
        items.push({
          text: `new operator: ${(data.name as string) || (data.slug as string) || "unknown"}`,
        });
      }
    }

    // Always include stats
    const stats = statsQuery.data;
    if (stats) {
      items.push(
        { text: `${stats.totalOperators} operators` },
        { text: `${(stats.totalInvocations ?? 0).toLocaleString()} invocations` },
        { text: `$${stats.totalEarnings || '0'} earned` }
      );
    }

    // If no events at all, show placeholder
    if (items.length === 0) {
      items.push(
        { text: "Aegis Protocol. AI Agent Skills Marketplace" },
        { text: "409+ operators available" },
        { text: "MCP endpoint live" }
      );
    }

    return items;
  }, [events, statsQuery.data]);

  // Duplicate items for seamless infinite scroll
  const doubledItems = [...tickerItems, ...tickerItems];

  return (
    <div className="hidden lg:flex bg-white/[0.02]/90 border-b border-white/[0.04] overflow-hidden h-7 items-center relative">
      {/* Connection indicator */}
      <div className="absolute left-3 z-10 flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-white/40 animate-pulse" : "bg-zinc-600"}`}
        />
      </div>

      {/* Scrolling content */}
      <div className="animate-ticker flex items-center whitespace-nowrap pl-8">
        {doubledItems.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 mx-6 text-[11px] font-medium"
          >
            {i > 0 && <span className="text-white/15 mr-3">&middot;</span>}
            <span className="text-white/30">{item.text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
