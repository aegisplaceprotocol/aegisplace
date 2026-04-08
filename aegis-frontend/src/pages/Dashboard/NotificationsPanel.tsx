import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import {
  Card,
  CardHead,
  PageHeader,
  StatusBadge,
  ActionButton,
  MonoValue,
} from "./primitives";

/* ── Types ────────────────────────────────────────────────────────────── */

interface AlertToggle {
  id: string;
  label: string;
  description: string;
  defaultOn: boolean;
}

interface WebhookDelivery {
  id: string;
  event: string;
  statusCode: number;
  timestamp: string;
}

interface AlertHistoryItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
}

/* ── Demo data ────────────────────────────────────────────────────────── */

const ALERT_TOGGLES: AlertToggle[] = [
  { id: "invocation-failures", label: "Invocation Failures", description: "Alert when your operators fail", defaultOn: true },
  { id: "high-latency", label: "High Latency", description: "Alert when response time exceeds 500ms", defaultOn: true },
  { id: "earnings-milestones", label: "Earnings Milestones", description: "Notify at $100, $1K, $10K earned", defaultOn: true },
  { id: "dispute-filed", label: "Dispute Filed", description: "When a dispute is filed against your operator", defaultOn: true },
  { id: "guardrail-blocks", label: "Guardrail Blocks", description: "When NeMo blocks an invocation", defaultOn: false },
  { id: "low-trust", label: "Low quality score", description: "When trust drops below 70", defaultOn: true },
  { id: "new-dependent", label: "New Dependent", description: "When a skill registers dependency on yours", defaultOn: false },
  { id: "weekly-summary", label: "Weekly Summary", description: "Email digest every Monday", defaultOn: true },
];

const WEBHOOK_DELIVERIES: WebhookDelivery[] = [
  { id: "wd1", event: "invocation.failed", statusCode: 200, timestamp: "2026-03-27 14:32:01" },
  { id: "wd2", event: "dispute.filed", statusCode: 200, timestamp: "2026-03-27 13:18:44" },
  { id: "wd3", event: "trust.low", statusCode: 502, timestamp: "2026-03-27 11:04:22" },
  { id: "wd4", event: "earnings.milestone", statusCode: 200, timestamp: "2026-03-26 22:51:09" },
  { id: "wd5", event: "guardrail.blocked", statusCode: 200, timestamp: "2026-03-26 19:37:55" },
];

const ALERT_HISTORY: AlertHistoryItem[] = [
  { id: "ah1", type: "Invocation Failure", message: "GPT-4o Router failed: timeout after 30s", timestamp: "2 min ago", read: false },
  { id: "ah2", type: "High Latency", message: "Claude Analyst response time: 842ms", timestamp: "18 min ago", read: false },
  { id: "ah3", type: "Dispute Filed", message: "Dispute #D-0047 against Mistral Coder", timestamp: "1 hr ago", read: false },
  { id: "ah4", type: "Earnings Milestone", message: "You reached $1,000 in total earnings!", timestamp: "3 hrs ago", read: true },
  { id: "ah5", type: "Guardrail Block", message: "NeMo blocked PII in request to Llama Guard", timestamp: "5 hrs ago", read: true },
  { id: "ah6", type: "Low quality score", message: "DeepSeek Math trust dropped to 68", timestamp: "8 hrs ago", read: true },
  { id: "ah7", type: "New Dependent", message: "Yield Strategy now depends on Gas Fee Oracle", timestamp: "12 hrs ago", read: true },
  { id: "ah8", type: "Weekly Summary", message: "Your weekly digest is ready", timestamp: "2 days ago", read: true },
];

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

/* ── Toggle Switch ────────────────────────────────────────────────────── */

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        border: "none",
        background: on ? T.positive : "rgba(255,255,255,0.10)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: 8,
          background: on ? "#fff" : "rgba(255,255,255,0.30)",
          transition: "left 0.2s",
          display: "block",
        }}
      />
    </button>
  );
}

/* ── Component ────────────────────────────────────────────────────────── */

export default function NotificationsPanel() {
  // Pre-fetch stats so data is warm for other panels
  trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });

  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    ALERT_TOGGLES.forEach((t) => { init[t.id] = t.defaultOn; });
    return init;
  });

  const [webhookUrl, setWebhookUrl] = useState("https://hooks.example.com/aegis/events");
  const [webhookEvents, setWebhookEvents] = useState<string[]>([
    "invocation-failures",
    "dispute-filed",
    "guardrail-blocks",
  ]);
  const [webhookTested, setWebhookTested] = useState(false);

  const toggleAlert = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleWebhookEvent = (id: string) => {
    setWebhookEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const unreadCount = ALERT_HISTORY.filter((a) => !a.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Configure alerts, webhooks, and notification preferences"
      />

      {/* Alert Toggles */}
      <Card style={{ marginBottom: 24 }}>
        <CardHead label="Alert Preferences" />
        <div style={{ padding: 0 }}>
          {ALERT_TOGGLES.map((toggle, i) => (
            <div
              key={toggle.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                borderBottom: i < ALERT_TOGGLES.length - 1 ? `1px solid ${T.border}` : undefined,
              }}
            >
              <div style={{ flex: 1, marginRight: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text80, marginBottom: 2 }}>
                  {toggle.label}
                </div>
                <div style={{ fontSize: 11, color: T.text30 }}>
                  {toggle.description}
                </div>
              </div>
              <ToggleSwitch on={toggles[toggle.id]} onToggle={() => toggleAlert(toggle.id)} />
            </div>
          ))}
        </div>
      </Card>

      {/* Webhook Configuration */}
      <Card style={{ marginBottom: 24 }}>
        <CardHead label="Webhook Configuration" />
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ ...LABEL, marginBottom: 6 }}>Webhook URL</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => { setWebhookUrl(e.target.value); setWebhookTested(false); }}
                style={{ ...INPUT, flex: 1 }}
              />
              <ActionButton
                label={webhookTested ? "Sent!" : "Test"}
                variant="default"
                onClick={() => setWebhookTested(true)}
              />
            </div>
          </div>

          <div>
            <div style={{ ...LABEL, marginBottom: 8 }}>Events to Send</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ALERT_TOGGLES.map((toggle) => {
                const active = webhookEvents.includes(toggle.id);
                return (
                  <label
                    key={toggle.id}
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
                      onClick={() => toggleWebhookEvent(toggle.id)}
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
                    {toggle.label}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ ...LABEL, marginBottom: 6 }}>Secret Key</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: T.text30,
              background: T.white3,
              padding: "8px 12px",
              borderRadius: 6,
              border: `1px solid ${T.border}`,
            }}>
              whsec_****************************a4f7
            </div>
          </div>

          <div>
            <ActionButton label="Save Webhook" variant="primary" />
          </div>

          {/* Recent deliveries */}
          <div style={{ marginTop: 8 }}>
            <div style={{ ...LABEL, marginBottom: 10 }}>Recent Deliveries</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Event", "Status", "Timestamp"].map((h, i) => (
                    <th key={i} style={{
                      ...LABEL,
                      textAlign: i === 0 ? "left" : "right",
                      padding: "8px 0",
                      borderBottom: `1px solid ${T.border}`,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WEBHOOK_DELIVERIES.map((d) => (
                  <tr key={d.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "10px 0", fontSize: 12, color: T.text50 }}>
                      <MonoValue color={T.text50}>{d.event}</MonoValue>
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right" }}>
                      <StatusBadge
                        status={String(d.statusCode)}
                        color={d.statusCode === 200 ? "green" : "red"}
                      />
                    </td>
                    <td style={{ padding: "10px 0", fontSize: 11, color: T.text30, textAlign: "right", whiteSpace: "nowrap" }}>
                      {d.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHead
          label="Alert History"
          action={
            unreadCount > 0 ? (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                background: T.negative,
                color: "#fff",
                fontSize: 10,
                fontWeight: 500,
                padding: "0 6px",
              }}>
                {unreadCount}
              </span>
            ) : undefined
          }
        />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["", "Type", "Message", "Time"].map((h, i) => (
                  <th key={i} style={{
                    ...LABEL,
                    textAlign: i <= 2 ? "left" : "right",
                    padding: "10px 12px",
                    borderBottom: `1px solid ${T.border}`,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALERT_HISTORY.map((alert) => (
                <tr key={alert.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: "12px 12px", width: 12 }}>
                    <span style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: alert.read ? "transparent" : T.text50,
                    }} />
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 12, fontWeight: 600, color: T.text50, whiteSpace: "nowrap" }}>
                    {alert.type}
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 12, color: alert.read ? T.text30 : T.text50 }}>
                    {alert.message}
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 11, color: T.text20, textAlign: "right", whiteSpace: "nowrap" }}>
                    {alert.timestamp}
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
