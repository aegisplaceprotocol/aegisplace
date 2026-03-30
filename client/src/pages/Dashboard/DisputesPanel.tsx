import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import {
  Card, CardHead, PageHeader, StatTile, TabBar, StatusBadge,
  MiniTable, MonoValue, ActionButton, EmptyState,
} from "./primitives";

/* ── Types & demo data ─────────────────────────────────────────────────── */

type Tab = "active" | "my" | "file" | "history";

type Reason = "incorrect_output" | "timeout" | "overcharge" | "schema_violation";

interface Dispute {
  id: string;
  operator: string;
  challenger: string;
  reason: Reason;
  status: string;
  stake: string;
  timeRemaining: string;
  votesFor: number;
  votesAgainst: number;
}

const REASON_COLORS: Record<Reason, "red" | "amber" | "blue" | "purple"> = {
  incorrect_output: "red",
  timeout: "amber",
  overcharge: "blue",
  schema_violation: "purple",
};

const ACTIVE_DISPUTES: Dispute[] = [
  { id: "DSP-0041", operator: "gpt4-proxy.aegis", challenger: "7xK9...mR3f", reason: "incorrect_output", status: "Voting", stake: "500 USDC", timeRemaining: "18h 24m", votesFor: 12, votesAgainst: 3 },
  { id: "DSP-0040", operator: "search-engine.aegis", challenger: "3nB2...pQ4a", reason: "timeout", status: "Under Review", stake: "250 USDC", timeRemaining: "1d 6h", votesFor: 8, votesAgainst: 5 },
  { id: "DSP-0039", operator: "data-feed.aegis", challenger: "9cD4...kL2m", reason: "overcharge", status: "Voting", stake: "1,000 USDC", timeRemaining: "2d 12h", votesFor: 21, votesAgainst: 2 },
  { id: "DSP-0038", operator: "ml-inference.aegis", challenger: "5eF7...nH8v", reason: "schema_violation", status: "Under Review", stake: "750 USDC", timeRemaining: "3d 1h", votesFor: 6, votesAgainst: 6 },
  { id: "DSP-0037", operator: "compute-pool.aegis", challenger: "2gH1...jR6w", reason: "incorrect_output", status: "Voting", stake: "300 USDC", timeRemaining: "12h 45m", votesFor: 15, votesAgainst: 8 },
  { id: "DSP-0036", operator: "storage-node.aegis", challenger: "8iJ3...bT5x", reason: "timeout", status: "Under Review", stake: "400 USDC", timeRemaining: "4d 8h", votesFor: 3, votesAgainst: 1 },
];

const MY_FILED = [
  { id: "DSP-0039", operator: "data-feed.aegis", reason: "overcharge" as Reason, status: "Voting", stake: "1,000 USDC" },
  { id: "DSP-0032", operator: "old-api.aegis", reason: "timeout" as Reason, status: "Resolved - Won", stake: "200 USDC" },
];

const MY_VOTED = [
  { id: "DSP-0041", operator: "gpt4-proxy.aegis", vote: "For Challenger", status: "Voting" },
  { id: "DSP-0040", operator: "search-engine.aegis", vote: "For Operator", status: "Under Review" },
  { id: "DSP-0037", operator: "compute-pool.aegis", vote: "For Challenger", status: "Voting" },
  { id: "DSP-0033", operator: "analytics.aegis", vote: "For Challenger", status: "Resolved" },
];

const HISTORY_ROWS = [
  ["DSP-0035", "inference-v2.aegis", "Challenger Won", "500 USDC refunded", "2,500 AEGIS slashed", "3 days ago"],
  ["DSP-0034", "code-gen.aegis", "Operator Won", "No refund", "No slash", "5 days ago"],
  ["DSP-0033", "analytics.aegis", "Challenger Won", "300 USDC refunded", "1,500 AEGIS slashed", "7 days ago"],
  ["DSP-0032", "old-api.aegis", "Challenger Won", "200 USDC refunded", "1,000 AEGIS slashed", "9 days ago"],
  ["DSP-0031", "translate.aegis", "Operator Won", "No refund", "No slash", "11 days ago"],
  ["DSP-0030", "embed-v3.aegis", "Dismissed", "Bond returned", "No slash", "13 days ago"],
  ["DSP-0029", "image-gen.aegis", "Challenger Won", "1,200 USDC refunded", "6,000 AEGIS slashed", "15 days ago"],
  ["DSP-0028", "speech.aegis", "Operator Won", "No refund", "No slash", "18 days ago"],
  ["DSP-0027", "rag-search.aegis", "Challenger Won", "800 USDC refunded", "4,000 AEGIS slashed", "21 days ago"],
  ["DSP-0026", "classifier.aegis", "Dismissed", "Bond returned", "No slash", "24 days ago"],
];

/* ── Helpers ───────────────────────────────────────────────────────────── */

function VoteBar({ votesFor, votesAgainst }: { votesFor: number; votesAgainst: number }) {
  const total = votesFor + votesAgainst || 1;
  const forPct = (votesFor / total) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: T.positive, fontWeight: 600 }}>Challenger {votesFor}</span>
        <span style={{ fontSize: 10, color: T.negative, fontWeight: 600 }}>Operator {votesAgainst}</span>
      </div>
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: T.white4 }}>
        <div style={{ width: `${forPct}%`, background: T.positive, borderRadius: 3 }} />
        <div style={{ width: `${100 - forPct}%`, background: T.negative, borderRadius: 3 }} />
      </div>
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────────────────── */

export default function DisputesPanel() {
  const [tab, setTab] = useState<Tab>("active");
  const [formReason, setFormReason] = useState<Reason>("incorrect_output");

  const disputesQuery = trpc.dispute.list.useQuery(
    { status: "open", limit: 20 },
    { staleTime: 30_000 },
  );
  const statsQuery = trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });

  // Map API disputes to local shape, falling back to demo data
  const activeDisputes: Dispute[] = disputesQuery.data
    ? (disputesQuery.data as any[]).map((d: any, i: number) => ({
        id: `DSP-${String(d.id ?? i).padStart(4, "0")}`,
        operator: d.operatorId ? `operator-${d.operatorId}` : "unknown.aegis",
        challenger: d.challengerWallet ? `${d.challengerWallet.slice(0, 4)}...${d.challengerWallet.slice(-4)}` : "????...????",
        reason: (["incorrect_output", "timeout", "overcharge", "schema_violation"].includes(d.reason) ? d.reason : "incorrect_output") as Reason,
        status: d.status === "open" ? "Voting" : d.status === "under_review" ? "Under Review" : d.status ?? "Voting",
        stake: "500 USDC",
        timeRemaining: d.createdAt ? `${Math.max(1, Math.floor((Date.now() - new Date(d.createdAt).getTime()) / 3600000))}h` : "24h",
        votesFor: d.votesFor ?? 0,
        votesAgainst: d.votesAgainst ?? 0,
      }))
    : ACTIVE_DISPUTES;

  const labelStyle: React.CSSProperties = {
    letterSpacing: "0.02em", marginBottom: 6, display: "block",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: T.white3, border: `1px solid ${T.border}`,
    borderRadius: 6, padding: "10px 14px", color: T.text80, fontSize: 13,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div>
      <PageHeader
        title="Dispute Management"
        subtitle="File, vote on, and track protocol disputes"
      />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatTile label="Open Disputes" value={String(statsQuery.data?.openDisputes ?? 7)} accent={T.text50} />
        <StatTile label="Under Review" value="3" accent={T.text50} />
        <StatTile label="Resolved (30d)" value={String(statsQuery.data?.resolvedDisputes ?? 24)} accent={T.positive} />
        <StatTile label="Avg Resolution" value="2.4 days" />
      </div>

      <TabBar
        tabs={[
          { id: "active" as Tab, label: "Active" },
          { id: "my" as Tab, label: "My Disputes" },
          { id: "file" as Tab, label: "File New" },
          { id: "history" as Tab, label: "History" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ── Active ────────────────────────────────────────────────────── */}
      {tab === "active" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {activeDisputes.map(d => (
            <Card key={d.id}>
              <div style={{ padding: 20 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: T.text80 }}>{d.id}</span>
                    <StatusBadge status={d.reason.replace("_", " ")} color={REASON_COLORS[d.reason]} />
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                {/* Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: T.text30 }}>Operator</span>
                    <MonoValue color={T.text50}>{d.operator}</MonoValue>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: T.text30 }}>Challenger</span>
                    <MonoValue color={T.text50}>{d.challenger}</MonoValue>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: T.text30 }}>Stake</span>
                    <span style={{ fontSize: 13, color: T.text80, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{d.stake}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: T.text30 }}>Time Remaining</span>
                    <span style={{ fontSize: 13, color: T.text50, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{d.timeRemaining}</span>
                  </div>
                </div>
                {/* Vote bar */}
                <VoteBar votesFor={d.votesFor} votesAgainst={d.votesAgainst} />
                {/* Action */}
                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                  <ActionButton label="Vote" variant="primary" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── My Disputes ───────────────────────────────────────────────── */}
      {tab === "my" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <CardHead label="Disputes I Filed" />
            {MY_FILED.length > 0 ? (
              <MiniTable
                headers={["ID", "Operator", "Reason", "Status", "Stake"]}
                rows={MY_FILED.map(d => [
                  <span style={{ fontWeight: 500, color: T.text80 }}>{d.id}</span>,
                  <MonoValue color={T.text50}>{d.operator}</MonoValue>,
                  <StatusBadge status={d.reason.replace("_", " ")} color={REASON_COLORS[d.reason]} />,
                  <StatusBadge status={d.status} />,
                  d.stake,
                ])}
              />
            ) : (
              <EmptyState title="No Disputes Filed" message="You haven't filed any disputes yet." />
            )}
          </Card>

          <Card>
            <CardHead label="Disputes I Voted On" />
            <MiniTable
              headers={["ID", "Operator", "My Vote", "Status"]}
              rows={MY_VOTED.map(d => [
                <span style={{ fontWeight: 500, color: T.text80 }}>{d.id}</span>,
                <MonoValue color={T.text50}>{d.operator}</MonoValue>,
                <span style={{ fontSize: 12, color: d.vote.includes("Challenger") ? T.positive : T.negative, fontWeight: 600 }}>{d.vote}</span>,
                <StatusBadge status={d.status} />,
              ])}
            />
          </Card>
        </div>
      )}

      {/* ── File New ──────────────────────────────────────────────────── */}
      {tab === "file" && (
        <Card>
          <CardHead label="File a New Dispute" />
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, maxWidth: 560 }}>
            {/* Operator */}
            <div>
              <label style={labelStyle}>Select Operator</label>
              <select style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                <option value="">Choose an operator...</option>
                <option>gpt4-proxy.aegis</option>
                <option>search-engine.aegis</option>
                <option>data-feed.aegis</option>
                <option>ml-inference.aegis</option>
                <option>compute-pool.aegis</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <label style={labelStyle}>Reason</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(["incorrect_output", "timeout", "overcharge", "schema_violation"] as Reason[]).map(r => (
                  <label key={r} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <div
                      onClick={() => setFormReason(r)}
                      style={{
                        width: 16, height: 16, borderRadius: "50%",
                        border: `2px solid ${formReason === r ? T.positive : T.text30}`,
                        background: formReason === r ? T.positive : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
                      }}
                    >
                      {formReason === r && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#000" }} />}
                    </div>
                    <span style={{ fontSize: 13, color: T.text50, textTransform: "capitalize" }}>
                      {r.replace(/_/g, " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                rows={4}
                placeholder="Describe the issue in detail..."
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            {/* Evidence URL */}
            <div>
              <label style={labelStyle}>Evidence URL</label>
              <input
                type="url"
                placeholder="https://..."
                style={inputStyle}
              />
            </div>

            {/* Bond amount */}
            <div>
              <label style={labelStyle}>Bond Amount</label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  placeholder="0.00"
                  style={{ ...inputStyle, paddingRight: 60 }}
                />
                <span style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  fontSize: 12, color: T.text30, fontWeight: 600,
                }}>
                  USDC
                </span>
              </div>
            </div>

            <div style={{ marginTop: 4 }}>
              <ActionButton label="Submit Dispute" variant="primary" />
            </div>
          </div>
        </Card>
      )}

      {/* ── History ───────────────────────────────────────────────────── */}
      {tab === "history" && (
        <Card>
          <CardHead label="Resolved Disputes (30d)" />
          <MiniTable
            headers={["ID", "Operator", "Outcome", "Refund", "Slash", "When"]}
            rows={HISTORY_ROWS.map(r => [
              <span style={{ fontWeight: 500, color: T.text80 }}>{r[0]}</span>,
              <MonoValue color={T.text50}>{r[1]}</MonoValue>,
              <StatusBadge status={r[2]} color={r[2].includes("Challenger") ? "green" : r[2].includes("Operator") ? "amber" : "gray"} />,
              r[3],
              r[4],
              r[5],
            ])}
          />
        </Card>
      )}
    </div>
  );
}
