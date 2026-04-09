/**
 * Aegis Dashboard. Settings Panel
 */
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { T } from "./theme";
import { Card, PageHeader, CardHead } from "./primitives";

export default function SettingsPanel() {
  const { publicKey } = useWallet();
  const [preferences, setPreferences] = useState({
    guardrailNotifications: true,
    emailAlerts: false,
    autoClaimFees: true,
  });

  const walletAddress = publicKey?.toBase58() ?? "No wallet connected";

  const togglePref = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const labelStyle: React.CSSProperties = {
    display: "block", marginBottom: 6, fontSize: 10, letterSpacing: "0.04em",
    fontWeight: 500, color: T.text20,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader title="Settings" subtitle="Profile, API keys, and account preferences" />

      <Card>
        <CardHead label="Identity" />
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={labelStyle}>Wallet Address</label>
            <div style={{
              padding: "10px 12px", borderRadius: 6, fontSize: 12, color: T.text30,
              background: T.white3, fontFamily: "'JetBrains Mono', monospace",
              border: `1px solid ${T.border}`, letterSpacing: "0.04em",
            }}>{walletAddress}</div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHead label="API Keys" />
        <div style={{ padding: 20 }}>
          <div style={{
            padding: "12px 14px",
            borderRadius: 6,
            background: T.white3,
            border: `1px solid ${T.border}`,
            fontSize: 12,
            color: T.text30,
            lineHeight: 1.6,
          }}>
            API key management is locked in this dashboard view.
          </div>
        </div>
      </Card>

      <Card>
        <CardHead label="Preferences" />
        <div style={{ padding: "8px 0" }}>
          {([
            { key: "guardrailNotifications" as const, label: "Guardrail Notifications", desc: "Alert when an invocation is blocked by a guardrail policy" },
            { key: "emailAlerts" as const, label: "Email Alerts", desc: "Receive weekly digest and important protocol updates" },
            { key: "autoClaimFees" as const, label: "Auto-claim Fees", desc: "Automatically sweep earned fees to your wallet weekly" },
          ]).map((pref, i, arr) => (
            <div key={pref.key} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none",
            }}>
              <div>
                <div style={{ fontSize: 13, color: T.text95, fontWeight: 500, marginBottom: 2 }}>{pref.label}</div>
                <div style={{ fontSize: 11, color: T.text25 }}>{pref.desc}</div>
              </div>
              <button onClick={() => togglePref(pref.key)} style={{
                width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                background: preferences[pref.key] ? "rgba(255,255,255,0.12)" : T.white6,
                position: "relative", transition: "background 0.2s", flexShrink: 0,
              }}>
                <span style={{
                  position: "absolute", top: 3,
                  left: preferences[pref.key] ? 23 : 3,
                  width: 18, height: 18, borderRadius: "50%",
                  background: preferences[pref.key] ? "rgba(255,255,255,0.50)" : T.text30,
                  transition: "left 0.2s, background 0.2s",
                }} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ padding: "13px 20px", borderBottom: `1px solid rgba(239,68,68,0.15)` }}>
          <span style={{ fontSize: 11, letterSpacing: "0.02em", fontWeight: 500, color: T.negative }}>Danger Zone</span>
        </div>
        <div style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: T.text50, fontWeight: 500, marginBottom: 2 }}>Deactivate all operators</div>
            <div style={{ fontSize: 11, color: T.text20 }}>This will halt all invocations across your deployed operators. Irreversible without re-activation.</div>
          </div>
          <button disabled style={{
            padding: "8px 20px", borderRadius: 6, border: `1px solid rgba(239,68,68,0.20)`,
            background: "rgba(239,68,68,0.04)", color: "rgba(239,68,68,0.30)",
            fontSize: 13, fontWeight: 600, cursor: "not-allowed", flexShrink: 0, opacity: 0.6,
          }}>Deactivate All</button>
        </div>
      </Card>
    </div>
  );
}
