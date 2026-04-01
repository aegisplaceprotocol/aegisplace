/**
 * Aegis Dashboard. Settings Panel
 */
import { useState, useCallback } from "react";
import { T } from "./theme";
import { SIcon } from "./icons";
import { Card, PageHeader, CardHead } from "./primitives";

export default function SettingsPanel() {
  const [displayName, setDisplayName] = useState("");
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [preferences, setPreferences] = useState({
    guardrailNotifications: true,
    emailAlerts: false,
    autoClaimFees: true,
  });

  const WALLET = "7f3aGh23jKlMnOpQrStUvWxDk9x";
  const MASKED_KEY = "sk-aegis-\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022DK9x";

  const handleCopyKey = useCallback(() => {
    navigator.clipboard.writeText(MASKED_KEY).then(() => {
      setApiKeyCopied(true);
      setTimeout(() => setApiKeyCopied(false), 1500);
    });
  }, []);

  const togglePref = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 6, fontSize: 13,
    color: T.text95, background: T.white3, border: `1px solid ${T.border}`,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
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
            }}>{WALLET}</div>
          </div>
          <div>
            <label style={labelStyle}>Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name..." style={inputStyle} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button style={{
              padding: "8px 20px", borderRadius: 6, border: `1px solid ${T.border}`,
              background: T.white6, color: T.text50, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            }}>Save Changes</button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHead label="API Keys" />
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Active API Key</label>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
              borderRadius: 6, background: T.white3, border: `1px solid ${T.border}`,
            }}>
              <code style={{ flex: 1, fontSize: 12, color: T.text30, fontFamily: "'JetBrains Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                {MASKED_KEY}
              </code>
              <button onClick={handleCopyKey} style={{
                display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                borderRadius: 4, border: `1px solid ${T.border}`, background: T.white6,
                color: apiKeyCopied ? T.text80 : T.text30, fontSize: 11, fontWeight: 500,
                cursor: "pointer", letterSpacing: "0.02em", transition: "all 0.15s", flexShrink: 0,
              }}>
                <SIcon name="copy" size={11} />
                {apiKeyCopied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button style={{
              padding: "8px 20px", borderRadius: 6, border: `1px solid rgba(245,158,11,0.25)`,
              background: "rgba(245,158,11,0.06)", color: "rgba(245,158,11,0.75)",
              fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            }}>Regenerate Key</button>
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
