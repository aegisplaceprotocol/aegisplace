/**
 * Aegis Dashboard. Earnings Panel
 */
import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { trpc } from "@/lib/trpc";
import { PremiumAreaChart } from "@/components/PremiumAreaChart";
import { T } from "./theme";
import { Card, PageHeader, StatTile, CardHead, ConnectWalletPrompt } from "./primitives";
import { FEE_SPLIT, formatUsd, parseNumericValue } from "./constants";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function EarningsPanel() {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? "";
  const queryEnabled = Boolean(walletAddress);

  const creatorQuery = trpc.creator.earningsByWallet.useQuery(
    { walletAddress },
    { staleTime: 300_000, enabled: queryEnabled },
  );
  const analyticsQuery = trpc.creator.analyticsByWallet.useQuery(
    { walletAddress, days: 28 },
    { staleTime: 300_000, enabled: queryEnabled },
  );
  const opsQuery = trpc.creator.operatorsByWallet.useQuery(
    { walletAddress },
    { staleTime: 300_000, enabled: queryEnabled },
  );

  const creatorEarnings = creatorQuery.data;
  const walletOperators = opsQuery.data ?? [];

  const totalEarnings = Math.max(
    parseNumericValue(creatorEarnings?.total),
    walletOperators.reduce((sum, op) => sum + parseNumericValue(op.totalEarned), 0),
  );
  const totalInvocations = walletOperators.reduce((sum, op) => sum + Number(op.totalInvocations ?? 0), 0);

  const last30d = parseNumericValue(creatorEarnings?.last30d);
  const last7d = parseNumericValue(creatorEarnings?.last7d);
  const last24h = parseNumericValue(creatorEarnings?.last24h);
  const pending = parseNumericValue(creatorEarnings?.pending);
  const settled = parseNumericValue(creatorEarnings?.settled);

  const earningsData = useMemo(() => {
    const daily = analyticsQuery.data?.daily ?? [];
    const revenueByDay = new Map(daily.map((entry) => [entry.date, parseNumericValue(entry.revenue)]));
    const series = [] as { date: Date; value: number }[];

    for (let offset = 27; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      series.push({
        date: new Date(date),
        value: revenueByDay.get(toDateKey(date)) ?? 0,
      });
    }

    return series;
  }, [analyticsQuery.data]);

  const avgPerCall = totalInvocations > 0 ? totalEarnings / totalInvocations : 0;
  const estimatedGrossFees = totalEarnings > 0 ? totalEarnings / (FEE_SPLIT[0].pct / 100) : 0;

  if (!queryEnabled) {
    return <ConnectWalletPrompt />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader title="Earnings" subtitle="Creator earnings and revenue performance for the connected wallet" />

      {/* 4 stat tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <StatTile label="Total Revenue" value={formatUsd(totalEarnings)} delta={formatUsd(settled)} sub="creator share settled to date" />
        <StatTile label="Last 30 Days" value={formatUsd(last30d)} delta={formatUsd(last24h)} sub="rolling creator earnings" />
        <StatTile label="Last 7 Days" value={formatUsd(last7d)} delta={formatUsd(pending)} sub="pending creator share" />
        <StatTile label="Avg / Invocation" value={formatUsd(avgPerCall)} delta="creator share per call" sub={`${totalInvocations.toLocaleString()} wallet-scoped calls`} />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHead label={
          <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <span>Revenue (28 days)</span>
            <span style={{ fontSize: 11, color: T.text25, fontVariantNumeric: "tabular-nums", fontWeight: 300 }}>
              {new Date(Date.now() - 27 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}. {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </span>
        } />
        <div style={{ padding: "0 8px 8px", height: 288 }}>
          <PremiumAreaChart data={earningsData} height={258} formatValue={(v: number) => formatUsd(v)} />
        </div>
      </Card>

      {/* Second row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Fee Breakdown */}
        <Card>
          <CardHead label="Fee Breakdown" />
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ display: "flex", height: 6, borderRadius: 4, overflow: "hidden", gap: 1, marginBottom: 18 }}>
              {FEE_SPLIT.map((seg, i) => (
                <div key={seg.label} style={{
                  width: `${seg.pct}%`,
                  background: `rgba(255,255,255,${0.22 - i * 0.03})`,
                  borderRadius: i === 0 ? "3px 0 0 3px" : i === FEE_SPLIT.length - 1 ? "0 3px 3px 0" : 0,
                }} />
              ))}
            </div>
            {FEE_SPLIT.map((seg, i) => {
              const dollar = estimatedGrossFees * (seg.pct / 100);
              return (
                <div key={seg.label} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "9px 0",
                  borderBottom: i < FEE_SPLIT.length - 1 ? `1px solid ${T.border}` : "none",
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, background: `rgba(255,255,255,${0.22 - i * 0.03})` }} />
                  <span style={{ fontSize: 13, color: T.text50, flex: 1 }}>{seg.label}</span>
                  <span style={{ fontSize: 12, color: T.text25, fontVariantNumeric: "tabular-nums", marginRight: 8 }}>{seg.pct}%</span>
                  <span style={{ fontSize: 13, color: T.text50, fontVariantNumeric: "tabular-nums", fontWeight: 600, minWidth: 72, textAlign: "right" as const }}>
                    {formatUsd(dollar)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Protocol Economics */}
        <Card>
          <CardHead label="Protocol Economics" />
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { label: "Total Invocations", value: totalInvocations.toLocaleString(), sub: "all-time calls for this wallet's operators" },
              { label: "Avg Price / Call", value: formatUsd(avgPerCall), sub: "creator share blended across your operators" },
              { label: "Estimated Gross Fees", value: `${formatUsd(estimatedGrossFees)} USDC`, sub: "derived from creator share and fee split" },
            ].map((m) => (
              <div key={m.label}>
                <div style={{ fontSize: 11, letterSpacing: "0.04em", fontWeight: 500, color: T.text20, marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: T.text95, letterSpacing: "-0.01em" }}>{m.value}</div>
                <div style={{ fontSize: 11, color: T.text25, marginTop: 3 }}>{m.sub}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
