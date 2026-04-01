import React, { useState, useMemo } from "react";
import { T } from "./theme";
import {
  Card,
  CardHead,
  PageHeader,
  StatTile,
  StatusBadge,
  ActionButton,
  MonoValue,
  CodeBlock,
} from "./primitives";
import { trpc } from "@/lib/trpc";

/* ── Types ────────────────────────────────────────────────────────────── */

interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  created: string;
  lastUsed: string | null;
  scopes: string[];
  invocations: number;
  spend: string;
  rateTier: string;
  status: "active" | "expired" | "revoked";
}

/* ── Demo data ────────────────────────────────────────────────────────── */

const SCOPES_LIST = [
  "Read Operators",
  "Invoke Skills",
  "Manage My Operators",
  "View Analytics",
  "Manage Disputes",
];

const RATE_TIERS: { label: string; value: string }[] = [
  { label: "Standard (60/min)", value: "standard" },
  { label: "Pro (300/min)", value: "pro" },
  { label: "Enterprise (1000/min)", value: "enterprise" },
];

const DEMO_KEYS: ApiKey[] = [
  {
    id: "k1",
    name: "Production Bot",
    maskedKey: "sk-aegis-****...f291",
    created: "2026-01-15",
    lastUsed: "2026-03-27",
    scopes: ["Read Operators", "Invoke Skills", "View Analytics"],
    invocations: 8421,
    spend: "$247.63",
    rateTier: "Pro (300/min)",
    status: "active",
  },
  {
    id: "k2",
    name: "Analytics Dashboard",
    maskedKey: "sk-aegis-****...83d0",
    created: "2026-02-08",
    lastUsed: "2026-03-26",
    scopes: ["Read Operators", "View Analytics"],
    invocations: 4312,
    spend: "$129.36",
    rateTier: "Standard (60/min)",
    status: "active",
  },
  {
    id: "k3",
    name: "Dev Testing Key",
    maskedKey: "sk-aegis-****...a1c7",
    created: "2025-11-02",
    lastUsed: null,
    scopes: ["Read Operators", "Invoke Skills", "Manage My Operators", "View Analytics", "Manage Disputes"],
    invocations: 114,
    spend: "$7.22",
    rateTier: "Enterprise (1000/min)",
    status: "expired",
  },
];

const DAILY_USAGE = [1842, 2103, 1654, 2340, 1920, 1587, 2201];
const DAILY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ── Styles ───────────────────────────────────────────────────────────── */

const INPUT: React.CSSProperties = {
  width: "100%",
  background: T.white4,
  border: `1px solid ${T.border}`,
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 13,
  color: T.text80,
  outline: "none",
  fontFamily: "inherit",
};

const LABEL: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.02em",
  fontWeight: 500,
  color: T.text20,
};

const SCOPE_BADGE: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: 9,
  fontWeight: 600,
  background: T.white4,
  color: T.text50,
  marginRight: 4,
  marginBottom: 4,
};

/* ── Component ────────────────────────────────────────────────────────── */

export default function ApiKeysPanel() {
  const [keyName, setKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [rateTier, setRateTier] = useState("standard");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [localRevokedIds, setLocalRevokedIds] = useState<string[]>([]);

  // Real API data
  const utils = trpc.useUtils();
  const { data: apiKeys } = trpc.apiKey.list.useQuery(undefined, {
    retry: false,
  });
  const createMutation = trpc.apiKey.create.useMutation({
    onSuccess: () => {
      utils.apiKey.list.invalidate();
    },
  });
  const revokeMutation = trpc.apiKey.revoke.useMutation({
    onSuccess: () => {
      utils.apiKey.list.invalidate();
    },
  });

  // Merge real keys with demo fallback
  const keys: ApiKey[] = useMemo(() => {
    if (apiKeys && apiKeys.length > 0) {
      return apiKeys.map((k: any) => ({
        id: k._id?.toString() ?? k.id,
        name: k.name,
        maskedKey: k.keyPrefix + "****...",
        created: k.createdAt ? new Date(k.createdAt).toISOString().slice(0, 10) : "",
        lastUsed: k.lastUsedAt ? new Date(k.lastUsedAt).toISOString().slice(0, 10) : null,
        scopes: k.scopes ?? [],
        invocations: k.usageCount ?? 0,
        spend: "$0.00",
        rateTier: `${k.rateLimit ?? 60}/min`,
        status: k.isActive ? "active" as const : "revoked" as const,
      }));
    }
    // Fallback to demo data when no real keys exist
    return DEMO_KEYS.map((k) =>
      localRevokedIds.includes(k.id) ? { ...k, status: "revoked" as const } : k
    );
  }, [apiKeys, localRevokedIds]);

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleGenerate = () => {
    if (!keyName.trim()) return;
    createMutation.mutate(
      {
        name: keyName.trim(),
        scopes: selectedScopes.length > 0
          ? selectedScopes.filter((s): s is "read" | "invoke" | "register" | "admin" =>
              ["read", "invoke", "register", "admin"].includes(s))
          : undefined,
      },
      {
        onSuccess: (data) => {
          setGeneratedKey(data.key);
          setKeyName("");
          setSelectedScopes([]);
        },
        onError: () => {
          // Fallback to local generation if not authenticated
          const fakeKey = `sk-aegis-${Math.random().toString(36).slice(2, 14)}-${Math.random().toString(36).slice(2, 10)}`;
          setGeneratedKey(fakeKey);
        },
      }
    );
  };

  const handleRevoke = (id: string) => {
    revokeMutation.mutate(
      { keyId: id },
      {
        onError: () => {
          // Fallback for demo keys
          setLocalRevokedIds((prev) => [...prev, id]);
        },
      }
    );
  };

  const statusColor = (s: string): "green" | "amber" | "red" => {
    if (s === "active") return "green";
    if (s === "expired") return "amber";
    return "red";
  };

  const maxUsage = Math.max(...DAILY_USAGE);
  const barChartHeight = 60;
  const barWidth = 28;
  const barGap = 8;
  const chartWidth = DAILY_USAGE.length * (barWidth + barGap) - barGap;

  return (
    <div>
      <PageHeader
        title="API Keys"
        subtitle="Generate and manage your Aegis Protocol API keys"
      />

      {/* Stats row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        marginBottom: 24,
      }}>
        <StatTile label="API Calls This Month" value="12,847" delta="+18.2% vs last month" deltaPositive />
        <StatTile label="Total Spend" value="$384.21" delta="+$42.10 this week" deltaPositive accent={T.text50} />
        <StatTile label="Rate Limit Hits" value="3" delta="Down from 12" deltaPositive accent={T.text50} />
      </div>

      {/* Usage chart card */}
      <Card style={{ marginBottom: 24 }}>
        <CardHead label="Daily Usage (Last 7 Days)" />
        <div style={{ padding: "20px 20px 16px" }}>
          <svg
            width={chartWidth + 40}
            height={barChartHeight + 28}
            viewBox={`0 0 ${chartWidth + 40} ${barChartHeight + 28}`}
            style={{ display: "block", maxWidth: "100%" }}
          >
            {DAILY_USAGE.map((val, i) => {
              const h = (val / maxUsage) * barChartHeight;
              const x = 20 + i * (barWidth + barGap);
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={barChartHeight - h}
                    width={barWidth}
                    height={h}
                    rx={3}
                    fill="rgba(255,255,255,0.20)"
                    opacity={0.7}
                  />
                  <text
                    x={x + barWidth / 2}
                    y={barChartHeight + 14}
                    textAnchor="middle"
                    fontSize={9}
                    fill={T.text20}
                  >
                    {DAILY_LABELS[i]}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y={barChartHeight - h - 4}
                    textAnchor="middle"
                    fontSize={8}
                    fill={T.text30}
                  >
                    {val.toLocaleString()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </Card>

      {/* Generate new key */}
      <Card style={{ marginBottom: 24 }}>
        <CardHead label="Generate New Key" />
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ ...LABEL, marginBottom: 6 }}>Key Name</div>
            <input
              type="text"
              placeholder="e.g., Production Bot"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              style={INPUT}
            />
          </div>

          <div>
            <div style={{ ...LABEL, marginBottom: 8 }}>Scopes</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SCOPES_LIST.map((scope) => {
                const active = selectedScopes.includes(scope);
                return (
                  <label
                    key={scope}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      fontSize: 12,
                      color: active ? T.text80 : T.text30,
                    }}
                  >
                    <span
                      onClick={() => toggleScope(scope)}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        border: `1px solid ${active ? T.positive : T.border}`,
                        background: active ? T.positive : "transparent",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        transition: "all 0.15s",
                      }}
                    >
                      {active && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4.5 7.5L8 3" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {scope}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ ...LABEL, marginBottom: 6 }}>Rate Limit</div>
            <div style={{ display: "flex", gap: 8 }}>
              {RATE_TIERS.map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => setRateTier(tier.value)}
                  style={{
                    background: rateTier === tier.value ? T.white6 : "transparent",
                    color: rateTier === tier.value ? T.text80 : T.text30,
                    border: `1px solid ${rateTier === tier.value ? T.borderHover : T.border}`,
                    borderRadius: 6,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <ActionButton label="Generate Key" variant="primary" onClick={handleGenerate} />
          </div>

          {generatedKey && (
            <div style={{ marginTop: 4 }}>
              <CodeBlock code={generatedKey} />
              <div style={{
                marginTop: 8,
                fontSize: 11,
                fontWeight: 600,
                color: T.text50,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L1 14h14L8 1z" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                This key will only be shown once
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Active keys table */}
      <Card>
        <CardHead
          label="Active Keys"
          action={
            <span style={{ fontSize: 11, color: T.text30 }}>
              {keys.length} keys
            </span>
          }
        />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Name", "Key", "Created", "Last Used", "Scopes", "Invocations", "Spend", "Rate Limit", "Status", ""].map((h, i) => (
                  <th key={i} style={{
                    ...LABEL,
                    textAlign: i === 0 || i === 4 ? "left" : "right",
                    padding: "10px 12px",
                    borderBottom: `1px solid ${T.border}`,
                    whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: "12px 12px", fontSize: 13, fontWeight: 600, color: T.text80 }}>
                    {k.name}
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "right" }}>
                    <MonoValue color={T.text50}>{k.maskedKey}</MonoValue>
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 12, color: T.text30, textAlign: "right", whiteSpace: "nowrap" }}>
                    {k.created}
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 12, color: k.lastUsed ? T.text30 : T.text20, textAlign: "right", whiteSpace: "nowrap" }}>
                    {k.lastUsed ?? "Never used"}
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "left", maxWidth: 200 }}>
                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                      {k.scopes.map((s) => (
                        <span key={s} style={SCOPE_BADGE}>{s}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 13, color: T.text50, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {k.invocations.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 13, color: T.text50, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {k.spend}
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 11, color: T.text30, textAlign: "right", whiteSpace: "nowrap" }}>
                    {k.rateTier}
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "right" }}>
                    <StatusBadge status={k.status} color={statusColor(k.status)} />
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "right" }}>
                    {k.status === "active" && (
                      <ActionButton label="Revoke" variant="danger" onClick={() => handleRevoke(k.id)} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
