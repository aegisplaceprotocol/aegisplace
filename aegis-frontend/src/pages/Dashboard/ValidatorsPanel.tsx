import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import {
  Card, CardHead, PageHeader, StatTile, TabBar, StatusBadge,
  MiniTable, MonoValue, ActionButton, FilterChips, ProgressBar,
} from "./primitives";

/* ── Types & constants ─────────────────────────────────────────────────── */

type Tab = "validators" | "status" | "stake" | "tiers";
type Tier = "Apprentice" | "Journeyman" | "Master" | "Grandmaster";
type SortBy = "quality" | "stake" | "operators";

const TIER_COLOR: Record<Tier, string> = {
  Apprentice: T.text50,
  Journeyman: T.text50,
  Master: T.text30,
  Grandmaster: T.text50,
};

const TIER_BADGE_COLOR: Record<Tier, "gray" | "blue" | "purple" | "amber"> = {
  Apprentice: "gray",
  Journeyman: "blue",
  Master: "purple",
  Grandmaster: "amber",
};

/* ── Demo data ─────────────────────────────────────────────────────────── */

interface Validator {
  name: string;
  wallet: string;
  tier: Tier;
  stake: string;
  stakeNum: number;
  operators: number;
  commission: string;
  quality: number;
}

const VALIDATORS: Validator[] = [
  { name: "aegis-sentinel-1", wallet: "4xK9...mR3f", tier: "Grandmaster", stake: "280,000", stakeNum: 280000, operators: 47, commission: "5.0%", quality: 99.2 },
  { name: "solana-guardian", wallet: "7nB2...pQ4a", tier: "Grandmaster", stake: "245,000", stakeNum: 245000, operators: 41, commission: "6.0%", quality: 98.7 },
  { name: "protocol-watcher", wallet: "2cD4...kL2m", tier: "Master", stake: "180,000", stakeNum: 180000, operators: 32, commission: "7.5%", quality: 97.1 },
  { name: "chain-validator-x", wallet: "9eF7...nH8v", tier: "Master", stake: "155,000", stakeNum: 155000, operators: 28, commission: "8.0%", quality: 96.4 },
  { name: "aegis-node-prime", wallet: "5gH1...jR6w", tier: "Master", stake: "132,000", stakeNum: 132000, operators: 25, commission: "8.5%", quality: 95.8 },
  { name: "validator-omega", wallet: "1iJ3...bT5x", tier: "Journeyman", stake: "85,000", stakeNum: 85000, operators: 18, commission: "9.0%", quality: 93.2 },
  { name: "trustless-node", wallet: "8kL5...dV9y", tier: "Journeyman", stake: "72,000", stakeNum: 72000, operators: 15, commission: "9.5%", quality: 91.7 },
  { name: "defi-sentinel", wallet: "3mN8...fX2z", tier: "Journeyman", stake: "58,000", stakeNum: 58000, operators: 12, commission: "10.0%", quality: 89.4 },
  { name: "new-validator-42", wallet: "6oP0...hZ4a", tier: "Apprentice", stake: "22,000", stakeNum: 22000, operators: 5, commission: "12.0%", quality: 84.1 },
  { name: "fresh-node", wallet: "4qR2...jB6c", tier: "Apprentice", stake: "10,500", stakeNum: 10500, operators: 2, commission: "15.0%", quality: 78.3 },
];

const TIER_CARDS: { tier: Tier; bond: string; maxOps: string; apy: string; features: string[] }[] = [
  { tier: "Apprentice", bond: "10,000 AEGIS", maxOps: "10", apy: "8-12%", features: ["Basic validation", "Standard queue priority", "Community support"] },
  { tier: "Journeyman", bond: "50,000 AEGIS", maxOps: "25", apy: "12-16%", features: ["Priority validation", "Dispute voting", "Enhanced queue priority", "Direct support"] },
  { tier: "Master", bond: "100,000 AEGIS", maxOps: "50", apy: "16-22%", features: ["High-value validation", "Dispute arbitration", "Top queue priority", "Protocol governance", "Revenue bonus"] },
  { tier: "Grandmaster", bond: "200,000 AEGIS", maxOps: "Unlimited", apy: "22-30%", features: ["All operator access", "Final arbitration", "Maximum priority", "Full governance", "Revenue multiplier", "Protocol advisory"] },
];

/* ── Component ─────────────────────────────────────────────────────────── */

export default function ValidatorsPanel() {
  const [tab, setTab] = useState<Tab>("validators");
  const [sortBy, setSortBy] = useState<SortBy>("quality");
  const [isValidator] = useState(false);

  const validatorsQuery = trpc.validator.list.useQuery(
    { limit: 50, sortBy: "quality" },
    { staleTime: 60_000 },
  );
  const statsQuery = trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });

  // Map API data to local shape, falling back to demo data
  const validatorItems: Validator[] = validatorsQuery.data
    ? (validatorsQuery.data as any[]).map((v: any) => ({
        name: v.name ?? "Unknown",
        wallet: v.wallet ? `${v.wallet.slice(0, 4)}...${v.wallet.slice(-4)}` : "????...????",
        tier: (v.qualityScore >= 95 ? "Grandmaster" : v.qualityScore >= 85 ? "Master" : v.qualityScore >= 75 ? "Journeyman" : "Apprentice") as Tier,
        stake: (v.stakeLamports ? (Number(v.stakeLamports) / 1e9).toLocaleString() : "..."),
        stakeNum: v.stakeLamports ? Number(v.stakeLamports) / 1e9 : 0,
        operators: v.validatedCount ?? 0,
        commission: v.commissionBps ? `${(v.commissionBps / 100).toFixed(1)}%` : "5.0%",
        quality: v.qualityScore ?? 0,
      }))
    : VALIDATORS;

  const sortedValidators = [...validatorItems].sort((a, b) => {
    if (sortBy === "quality") return b.quality - a.quality;
    if (sortBy === "stake") return b.stakeNum - a.stakeNum;
    return b.operators - a.operators;
  });

  return (
    <div>
      <PageHeader
        title="Validator Network"
        subtitle="Decentralized validation, staking, and tier progression"
      />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatTile label="Active Validators" value={String(statsQuery.data?.totalValidators ?? 142)} accent={T.positive} />
        <StatTile label="Total Staked" value={statsQuery.data?.totalStaked ? `${(Number(statsQuery.data.totalStaked) / 1e6).toFixed(1)}M $AEGIS` : "4.2M $AEGIS"} accent={T.text30} />
        <StatTile label="Avg Commission" value="8.5%" />
        <StatTile label="Attestations (24h)" value="12,847" accent={T.text50} />
      </div>

      <TabBar
        tabs={[
          { id: "validators" as Tab, label: "Validators" },
          { id: "status" as Tab, label: "My Status" },
          { id: "stake" as Tab, label: "Stake" },
          { id: "tiers" as Tab, label: "Tiers" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ── Validators Table ──────────────────────────────────────────── */}
      {tab === "validators" && (
        <Card>
          <CardHead
            label="Validator Directory"
            action={
              <FilterChips
                options={[
                  { id: "quality" as SortBy, label: "quality" },
                  { id: "stake" as SortBy, label: "Stake" },
                  { id: "operators" as SortBy, label: "Operators" },
                ]}
                active={sortBy}
                onChange={setSortBy}
              />
            }
          />
          <MiniTable
            headers={["Validator", "Wallet", "Tier", "Stake", "Operators", "Commission", "quality"]}
            rows={sortedValidators.map(v => [
              <span style={{ fontWeight: 500, color: T.text80 }}>{v.name}</span>,
              <MonoValue color={T.text50}>{v.wallet}</MonoValue>,
              <StatusBadge status={v.tier} color={TIER_BADGE_COLOR[v.tier]} />,
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{v.stake}</span>,
              String(v.operators),
              v.commission,
              <span style={{
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
                color: v.quality >= 95 ? T.positive : v.quality >= 85 ? T.text50 : T.text50,
              }}>
                {v.quality}
              </span>,
            ])}
          />
        </Card>
      )}

      {/* ── My Status ─────────────────────────────────────────────────── */}
      {tab === "status" && (
        <div>
          {!isValidator ? (
            <Card>
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 400, color: T.text80, marginBottom: 12 }}>
                  Become a Validator
                </div>
                <div style={{ fontSize: 13, color: T.text30, maxWidth: 480, margin: "0 auto 24px", lineHeight: 1.7 }}>
                  Validators secure the Aegis Protocol by attesting to operator behavior, resolving disputes, and ensuring service quality. Earn staking rewards and protocol fees.
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16, maxWidth: 480, margin: "0 auto 28px" }}>
                  {[
                    { label: "Min Bond", value: "10,000 AEGIS" },
                    { label: "Starting Tier", value: "Apprentice" },
                    { label: "Est. APY", value: "8-12%" },
                  ].map((r, i) => (
                    <div key={i} style={{ background: T.white3, borderRadius: 6, padding: "14px 12px" }}>
                      <div style={{ fontSize: 10, color: T.text20, letterSpacing: "0.02em", fontWeight: 500, marginBottom: 6 }}>
                        {r.label}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: T.text80, fontVariantNumeric: "tabular-nums" }}>
                        {r.value}
                      </div>
                    </div>
                  ))}
                </div>

                <ActionButton label="Apply to Become a Validator" variant="primary" />
              </div>
            </Card>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Card>
                <CardHead label="My Validator Info" />
                <div style={{ padding: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { label: "Tier", value: "Journeyman" },
                      { label: "Operators Validated", value: "15" },
                      { label: "Total Earnings", value: "12,400 AEGIS" },
                      { label: "Attestation Accuracy", value: "94.2%" },
                    ].map((r, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: T.text30 }}>{r.label}</span>
                        <span style={{ fontSize: 13, color: T.text80, fontWeight: 600 }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── Stake ─────────────────────────────────────────────────────── */}
      {tab === "stake" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Card>
            <CardHead label="Stake AEGIS" />
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                  <div style={{ fontSize: 10, color: T.text20, letterSpacing: "0.02em", fontWeight: 500, marginBottom: 4 }}>
                  Current Stake
                </div>
                <div style={{ fontSize: 28, fontWeight: 400, color: T.text80, fontVariantNumeric: "tabular-nums" }}>
                  0 AEGIS
                </div>
              </div>

              <div>
                  <div style={{ fontSize: 10, color: T.text20, letterSpacing: "0.02em", fontWeight: 500, marginBottom: 4 }}>
                  Amount to Stake
                </div>
                <input
                  type="number"
                  placeholder="0"
                  style={{
                    width: "100%", background: T.white3, border: `1px solid ${T.border}`,
                    borderRadius: 6, padding: "10px 14px", color: T.text80, fontSize: 13,
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                  <div style={{ fontSize: 10, color: T.text20, letterSpacing: "0.02em", fontWeight: 500, marginBottom: 4 }}>
                  Projected APY
                </div>
                <div style={{ fontSize: 20, fontWeight: 400, color: T.positive, fontVariantNumeric: "tabular-nums" }}>
                  18.4%
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <ActionButton label="Stake" variant="primary" />
                <ActionButton label="Unstake" variant="default" />
              </div>
            </div>
          </Card>

          <Card>
            <CardHead label="Unstaking Queue" />
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: T.text30, marginBottom: 16 }}>
                7-day cooldown period applies to all unstaking requests.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { amount: "5,000 AEGIS", initiated: "3 days ago", remaining: "4 days", progress: 42.8 },
                  { amount: "2,500 AEGIS", initiated: "1 day ago", remaining: "6 days", progress: 14.3 },
                ].map((q, i) => (
                  <div key={i} style={{ background: T.white3, borderRadius: 6, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.text80, fontVariantNumeric: "tabular-nums" }}>{q.amount}</span>
                      <span style={{ fontSize: 12, color: T.text50, fontWeight: 600 }}>{q.remaining} left</span>
                    </div>
                    <ProgressBar value={q.progress} color={T.text50} />
                    <div style={{ fontSize: 10, color: T.text20, marginTop: 6 }}>Initiated {q.initiated}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Tiers ─────────────────────────────────────────────────────── */}
      {tab === "tiers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {TIER_CARDS.map((tc, i) => {
            const color = TIER_COLOR[tc.tier];
            const isLast = i === TIER_CARDS.length - 1;
            return (
              <div key={tc.tier} style={{ position: "relative" }}>
                {/* Connector line */}
                {!isLast && (
                  <div style={{
                    position: "absolute", left: 32, top: "100%", width: 2, height: 4,
                    background: T.borderSubtle,
                  }} />
                )}
                <Card style={{ borderLeft: `3px solid ${color}` }}>
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      {/* Tier number */}
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", background: `${color}20`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 500, color,
                      }}>
                        {i + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 500, color }}>{tc.tier}</div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 16 }}>
                      <div style={{ background: T.white3, borderRadius: 6, padding: "12px 14px" }}>
                          <div style={{ fontSize: 10, color: T.text20, letterSpacing: "0.02em", fontWeight: 500, marginBottom: 4 }}>
                          Bond Required
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T.text80, fontVariantNumeric: "tabular-nums" }}>
                          {tc.bond}
                        </div>
                      </div>
                      <div style={{ background: T.white3, borderRadius: 6, padding: "12px 14px" }}>
                          <div style={{ fontSize: 10, color: T.text20, letterSpacing: "0.02em", fontWeight: 500, marginBottom: 4 }}>
                          Max Operators
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T.text80, fontVariantNumeric: "tabular-nums" }}>
                          {tc.maxOps}
                        </div>
                      </div>
                      <div style={{ background: T.white3, borderRadius: 6, padding: "12px 14px" }}>
                          <div style={{ fontSize: 10, color: T.text20, letterSpacing: "0.02em", fontWeight: 500, marginBottom: 4 }}>
                          APY Range
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T.positive, fontVariantNumeric: "tabular-nums" }}>
                          {tc.apy}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {tc.features.map((f, fi) => (
                        <span key={fi} style={{
                          fontSize: 11, color: T.text50, background: T.white4,
                          padding: "4px 10px", borderRadius: 4, fontWeight: 500,
                        }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
