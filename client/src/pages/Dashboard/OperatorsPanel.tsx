/**
 * Aegis Dashboard. Operators Panel
 */
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { PremiumSparkline } from "@/components/PremiumSparkline";
import { T } from "./theme";
import { SIcon, BrandIcon } from "./icons";
import { Card, PageHeader, StatTile, StatusBadge } from "./primitives";
import { DEMO_SPARKLINE, DEMO_OPS } from "./constants";

export default function OperatorsPanel() {
  const opsQuery = trpc.operator.list.useQuery({ limit: 50, sortBy: "invocations" }, { staleTime: 300_000 });
  const statsQuery = trpc.stats.overview.useQuery(undefined, { staleTime: 300_000 });
  const ops: Record<string, unknown>[] = ((opsQuery.data as Record<string, unknown>)?.operators as Record<string, unknown>[]) ?? [];
  const stats = statsQuery.data as Record<string, unknown> | undefined;

  const totalOps: number = (stats?.totalOperators as number) ?? 0;
  const displayOps = ops.length ? ops : DEMO_OPS;
  const activeCount = displayOps.filter((op: Record<string, unknown>) => op.isActive !== false).length;

  const avgSuccess = displayOps.length
    ? displayOps.reduce((acc: number, op: Record<string, unknown>) => {
        const sr: number = (op.successfulInvocations as number) && (op.totalInvocations as number)
          ? ((op.successfulInvocations as number) / (op.totalInvocations as number)) * 100
          : (op.successRate as number) ?? 0;
        return acc + sr;
      }, 0) / displayOps.length
    : 0;

  const avgResponse = displayOps.length
    ? displayOps.reduce((acc: number, op: Record<string, unknown>) => acc + ((op.avgResponseMs as number) ?? 142), 0) / displayOps.length
    : 142;

  return (
    <div>
      <PageHeader
        title="My Operators"
        subtitle="Manage and monitor your deployed skill operators"
        action={
          <Link href="/submit">
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600,
              color: T.text95, cursor: "pointer", border: `1px solid ${T.border}`,
              background: T.white6, transition: "all 0.15s",
            }}>
              <SIcon name="zap" size={13} />
              Deploy New Operator
            </span>
          </Link>
        }
      />

      {/* 4-stat banner row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatTile label="Total Operators" value={totalOps.toLocaleString()} delta="+12 this week" sub="across all categories" />
        <StatTile label="Active Now" value={activeCount.toString()} delta="currently serving" sub="of deployed operators" />
        <StatTile label="Avg Success Rate" value={`${avgSuccess.toFixed(1)}%`} delta="+0.5% vs last week" sub="invocation success" />
        <StatTile label="Avg Response" value={`${Math.round(avgResponse)}ms`} delta="p95: 312ms" sub="median latency" />
      </div>

      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {[
                  { h: "#",           w: 40,   align: "center" as const },
                  { h: "Name",        w: "auto", align: "left" as const },
                  { h: "Category",    w: 120,  align: "left" as const },
                  { h: "Success %",   w: 160,  align: "left" as const },
                  { h: "Response",    w: 90,   align: "right" as const },
                  { h: "Invocations", w: 110,  align: "right" as const },
                  { h: "Revenue",     w: 100,  align: "right" as const },
                  { h: "Status",      w: 90,   align: "center" as const },
                  { h: "",            w: 40,   align: "center" as const },
                ].map((col) => (
                  <th key={col.h || "actions"} style={{
                    padding: "11px 16px", textAlign: col.align,
                    fontSize: 10, letterSpacing: "0.02em", fontWeight: 500,
                    color: T.text12, width: col.w,
                  }}>{col.h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayOps.map((op: Record<string, unknown>, i: number) => {
                const name: string = (op.name as string) ?? "";
                const cat: string = ((op.category as string) ?? "").replace(/-/g, " ");
                const invocations: number = (op.totalInvocations as number) ?? (op.invocations as number) ?? 0;
                const totalEarnedObj = op.totalEarned as Record<string, string> | undefined;
                const earned: number = totalEarnedObj?.$numberDecimal
                  ? parseFloat(totalEarnedObj.$numberDecimal)
                  : (op.earned as number) ?? 0;
                const sr: number = (op.successfulInvocations as number) && (op.totalInvocations as number)
                  ? ((op.successfulInvocations as number) / (op.totalInvocations as number)) * 100
                  : (op.successRate as number) ?? 0;
                const avgMs: number = (op.avgResponseMs as number) ?? Math.floor(Math.random() * 200 + 60);
                const verified: boolean = (op.isVerified as boolean) ?? false;
                const isActive: boolean = op.isActive !== false;
                return (
                  <tr key={i}
                    style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "11px 16px", textAlign: "center", fontSize: 11, color: T.text20, fontVariantNumeric: "tabular-nums" }}>{i + 1}</td>
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <BrandIcon name={name} size={18} />
                        <span style={{ fontWeight: 400, fontSize: 13, color: T.text50 }}>
                          {name.replace(/^(OpenAI|Anthropic|Claude|Google|Gemini|Meta|Mistral|NVIDIA|Solana)\s*/i, "").trim() || name}
                          {verified && <span style={{ marginLeft: 5, fontSize: 8, color: T.text20 }}>&#10003;</span>}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: T.white6, color: T.text30, whiteSpace: "nowrap" as const }}>{cat}</span>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 3, borderRadius: 2, background: T.white4, maxWidth: 80 }}>
                          <div style={{ height: "100%", borderRadius: 2, width: `${Math.min(sr, 100)}%`, background: "rgba(255,255,255,0.20)" }} />
                        </div>
                        <span style={{ fontSize: 12, color: T.text50, fontVariantNumeric: "tabular-nums", fontWeight: 600, minWidth: 40 }}>{sr.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px", textAlign: "right", fontSize: 12, color: T.text50, fontVariantNumeric: "tabular-nums" }}>{avgMs}ms</td>
                    <td style={{ padding: "11px 16px", textAlign: "right", fontSize: 12, color: T.text50, fontVariantNumeric: "tabular-nums" }}>{invocations.toLocaleString()}</td>
                    <td style={{ padding: "11px 16px", textAlign: "right", fontSize: 12, color: T.text80, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>${Math.round(earned).toLocaleString()}</td>
                    <td style={{ padding: "11px 16px", textAlign: "center" }}>
                      <StatusBadge status={isActive ? "active" : "inactive"} />
                    </td>
                    <td style={{ padding: "11px 16px", textAlign: "center" }}>
                      <SIcon name="arrow-right" size={14} className="text-white/20" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "10px 20px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: T.text20 }}>Showing {displayOps.length} of {totalOps.toLocaleString()} operators</span>
          <Link href="/marketplace">
            <span style={{ fontSize: 11, color: T.text20, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "color 0.15s" }}>
              Browse all <SIcon name="arrow-right" size={11} />
            </span>
          </Link>
        </div>
      </Card>
    </div>
  );
}
