/**
 * Aegis Dashboard. Operators Panel
 */
import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useWallet } from "@solana/wallet-adapter-react";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import { SIcon, BrandIcon } from "./icons";
import { Card, PageHeader, StatTile, StatusBadge, ConnectWalletPrompt } from "./primitives";
import { formatUsd, parseNumericValue } from "./constants";

export default function OperatorsPanel() {
  const [, navigate] = useLocation();
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? "";
  const queryEnabled = Boolean(walletAddress);

  const opsQuery = trpc.creator.operatorsByWallet.useQuery(
    { walletAddress },
    { staleTime: 300_000, enabled: queryEnabled },
  );
  const earningsQuery = trpc.creator.earningsByWallet.useQuery(
    { walletAddress },
    { staleTime: 300_000, enabled: queryEnabled },
  );
  const analyticsQuery = trpc.creator.analyticsByWallet.useQuery(
    { walletAddress, days: 30 },
    { staleTime: 300_000, enabled: queryEnabled },
  );

  const displayOps = (opsQuery.data ?? []) as Array<Record<string, unknown>>;
  const totalOps = displayOps.length;
  const activeCount = displayOps.filter((op) => op.isActive !== false).length;

  const earningsByOperator = useMemo(() => {
    const entries = (earningsQuery.data?.byOperator ?? []).map((entry) => [String(entry.operatorId), parseNumericValue(entry.total)]);
    return new Map(entries);
  }, [earningsQuery.data?.byOperator]);

  const totalRevenue = Math.max(
    parseNumericValue(earningsQuery.data?.total),
    displayOps.reduce((sum, op) => sum + parseNumericValue(op.totalEarned), 0),
  );

  const avgSuccess = totalOps
    ? displayOps.reduce((acc, op) => {
        const totalInvocations = Number(op.totalInvocations ?? 0);
        const successfulInvocations = Number(op.successfulInvocations ?? 0);
        const sr = totalInvocations > 0 ? (successfulInvocations / totalInvocations) * 100 : 0;
        return acc + sr;
      }, 0) / totalOps
    : 0;

  const opsWithLatency = displayOps.filter((op) => Number(op.avgResponseMs ?? 0) > 0);
  const avgResponse = opsWithLatency.length
    ? opsWithLatency.reduce((acc, op) => acc + Number(op.avgResponseMs ?? 0), 0) / opsWithLatency.length
    : null;

  const monthlyInvocations = (analyticsQuery.data?.daily ?? []).reduce((sum, day) => sum + Number(day.invocations ?? 0), 0);
  const monthlyRevenue = (analyticsQuery.data?.daily ?? []).reduce((sum, day) => sum + parseNumericValue(day.revenue), 0);

  if (!queryEnabled) {
    return <ConnectWalletPrompt />;
  }

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
        <StatTile label="Total Operators" value={totalOps.toLocaleString()} delta={`${monthlyInvocations.toLocaleString()} calls in 30d`} sub="owned by connected wallet" />
        <StatTile label="Active Now" value={activeCount.toString()} delta={`${Math.max(totalOps - activeCount, 0)} inactive`} sub="currently serving" />
        <StatTile label="Avg Success Rate" value={totalOps > 0 ? `${avgSuccess.toFixed(1)}%` : "—"} delta={`${monthlyInvocations.toLocaleString()} wallet-scoped invocations`} sub="across your operators" />
        <StatTile label="Creator Revenue" value={formatUsd(totalRevenue)} delta={`${formatUsd(monthlyRevenue)} in 30d`} sub="creator share from backend" />
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
              {displayOps.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: "28px 16px", textAlign: "center", fontSize: 12, color: T.text20 }}>
                    No operators found for the connected wallet.
                  </td>
                </tr>
              )}
              {displayOps.map((op: Record<string, unknown>, i: number) => {
                const name: string = (op.name as string) ?? "";
                const slug: string = (op.slug as string) ?? "";
                const cat: string = ((op.category as string) ?? "").replace(/-/g, " ");
                const invocations: number = (op.totalInvocations as number) ?? (op.invocations as number) ?? 0;
                const earned = earningsByOperator.get(String(op.id ?? "")) ?? parseNumericValue(op.totalEarned ?? op.earned);
                const sr: number = (op.successfulInvocations as number) && (op.totalInvocations as number)
                  ? ((op.successfulInvocations as number) / (op.totalInvocations as number)) * 100
                  : (op.successRate as number) ?? 0;
                const avgMs: number | null = (op.avgResponseMs as number) ?? null;
                const verified: boolean = (op.isVerified as boolean) ?? false;
                const isActive: boolean = op.isActive !== false;
                return (
                  <tr key={i}
                    onClick={() => {
                      if (!slug) return;
                      navigate(`/marketplace/${slug}`);
                    }}
                    style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.15s", cursor: slug ? "pointer" : "default" }}
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
                    <td style={{ padding: "11px 16px", textAlign: "right", fontSize: 12, color: T.text50, fontVariantNumeric: "tabular-nums" }}>{avgMs != null ? `${avgMs}ms` : "—"}</td>
                    <td style={{ padding: "11px 16px", textAlign: "right", fontSize: 12, color: T.text50, fontVariantNumeric: "tabular-nums" }}>{invocations.toLocaleString()}</td>
                    <td style={{ padding: "11px 16px", textAlign: "right", fontSize: 12, color: T.text80, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{formatUsd(earned)}</td>
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
          <span style={{ fontSize: 11, color: T.text20 }}>Showing {displayOps.length} of {totalOps.toLocaleString()} operators owned by this wallet</span>
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
