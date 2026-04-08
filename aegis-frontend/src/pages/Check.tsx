import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";

/* ── Design tokens (matches dashboard) ─────────────────────────────── */

const T = {
  bg: "#0A0A0B",
  card: "rgba(255,255,255,0.015)",
  border: "rgba(255,255,255,0.05)",
  borderHover: "rgba(255,255,255,0.08)",
  text95: "rgba(255,255,255,0.92)",
  text50: "rgba(255,255,255,0.44)",
  text30: "rgba(255,255,255,0.28)",
  text20: "rgba(255,255,255,0.18)",
  positive: "rgba(52,211,153,0.70)",
  warning: "rgba(251,191,36,0.70)",
  negative: "rgba(220,100,60,0.60)",
  accent: "rgba(52,211,153,0.60)",
};

/* ── Detection ─────────────────────────────────────────────────────── */

type InputType = "token" | "wallet" | "contract" | "mcp" | "website" | "unknown";

function detectType(input: string): InputType {
  const trimmed = input.trim();
  if (!trimmed) return "unknown";
  if (/^https?:\/\//.test(trimmed)) {
    if (trimmed.includes("github.com")) return "contract";
    if (trimmed.includes("mcp") || trimmed.includes(":3000") || trimmed.includes("/api/")) return "mcp";
    return "website";
  }
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
    // Solana address — could be token or wallet, check length patterns
    return trimmed.length >= 43 ? "token" : "wallet";
  }
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return "wallet";
  return "unknown";
}

function typeLabel(t: InputType): string {
  switch (t) {
    case "token": return "Token";
    case "wallet": return "Wallet";
    case "contract": return "Smart Contract";
    case "mcp": return "MCP Server";
    case "website": return "Website";
    default: return "Unknown";
  }
}

function typeDescription(t: InputType): string {
  switch (t) {
    case "token": return "Checking mint authority, freeze authority, LP status, holder concentration, deployer history";
    case "wallet": return "Profiling transaction history, behavioral patterns, risk flags, associated wallets";
    case "contract": return "Scanning for 15 vulnerability classes including missing signers, arithmetic overflow, unsafe CPI";
    case "mcp": return "Checking for SSRF vectors, env var exposure, malicious patterns, CVE matches";
    case "website": return "Checking SSL, domain age, phishing patterns, known scam databases";
    default: return "Paste a token address, wallet, GitHub repo, MCP server URL, or website";
  }
}

/* ── Score display ─────────────────────────────────────────────────── */

interface CheckResult {
  score: number;
  label: "SAFE" | "CAUTION" | "DANGER";
  type: InputType;
  checks: { name: string; passed: boolean; detail: string }[];
  summary: string;
}

function scoreColor(score: number): string {
  if (score >= 75) return T.positive;
  if (score >= 40) return T.warning;
  return T.negative;
}

function labelColor(label: string): string {
  if (label === "SAFE") return T.positive;
  if (label === "CAUTION") return T.warning;
  return T.negative;
}

/* ── Simulate check (replace with real API calls) ──────────────────── */

async function runCheck(input: string, type: InputType): Promise<CheckResult> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));

  const checks: { name: string; passed: boolean; detail: string }[] = [];

  if (type === "token") {
    checks.push(
      { name: "Mint Authority", passed: true, detail: "Revoked" },
      { name: "Freeze Authority", passed: true, detail: "Revoked" },
      { name: "Liquidity Pool", passed: true, detail: "$142K locked on Raydium" },
      { name: "Top 10 Holders", passed: true, detail: "38% concentration (healthy)" },
      { name: "Deployer History", passed: true, detail: "3 previous tokens, all active" },
      { name: "Token Age", passed: true, detail: "47 days" },
    );
  } else if (type === "wallet") {
    checks.push(
      { name: "Transaction History", passed: true, detail: "1,284 transactions over 6 months" },
      { name: "Known Associations", passed: true, detail: "No flagged wallets" },
      { name: "Funding Source", passed: true, detail: "CEX withdrawal (Coinbase)" },
      { name: "Behavior Pattern", passed: true, detail: "Active trader, consistent activity" },
      { name: "Sanctions Check", passed: true, detail: "Not on any known lists" },
    );
  } else if (type === "contract") {
    checks.push(
      { name: "Missing Signers", passed: true, detail: "All handlers verified" },
      { name: "Arithmetic Overflow", passed: true, detail: "Checked math used" },
      { name: "Unsafe CPI", passed: false, detail: "1 cross-program call without validation" },
      { name: "PDA Collisions", passed: true, detail: "Canonical bumps used" },
      { name: "Reinitialization", passed: true, detail: "Init guards present" },
      { name: "Account Validation", passed: true, detail: "Owner checks on all accounts" },
    );
  } else if (type === "mcp") {
    checks.push(
      { name: "SSRF Protection", passed: true, detail: "No private IP access" },
      { name: "Env Var Exposure", passed: true, detail: "No secrets in responses" },
      { name: "Input Validation", passed: true, detail: "Schema validation present" },
      { name: "Rate Limiting", passed: false, detail: "No rate limiting detected" },
      { name: "TLS/SSL", passed: true, detail: "Valid certificate" },
    );
  } else {
    checks.push(
      { name: "SSL Certificate", passed: true, detail: "Valid, expires in 284 days" },
      { name: "Domain Age", passed: true, detail: "Registered 2 years ago" },
      { name: "Phishing Database", passed: true, detail: "Not flagged" },
      { name: "Content Analysis", passed: true, detail: "No suspicious patterns" },
    );
  }

  const passed = checks.filter((c) => c.passed).length;
  const total = checks.length;
  const score = Math.round((passed / total) * 100);
  const label: "SAFE" | "CAUTION" | "DANGER" = score >= 80 ? "SAFE" : score >= 50 ? "CAUTION" : "DANGER";

  return {
    score,
    label,
    type,
    checks,
    summary: `${passed}/${total} checks passed. ${checks.filter((c) => !c.passed).map((c) => c.name).join(", ") || "No issues found."}`,
  };
}

/* ── Main ──────────────────────────────────────────────────────────── */

export default function Check() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [detectedType, setDetectedType] = useState<InputType>("unknown");

  const handleInputChange = useCallback((val: string) => {
    setInput(val);
    setDetectedType(detectType(val));
    setResult(null);
  }, []);

  const handleCheck = useCallback(async () => {
    if (!input.trim() || detectedType === "unknown") return;
    setLoading(true);
    setResult(null);
    try {
      const res = await runCheck(input.trim(), detectedType);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }, [input, detectedType]);

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text95 }}>
      <Navbar />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "120px 20px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, fontWeight: 400, letterSpacing: "-0.025em", color: T.text95, margin: "0 0 8px" }}>
            Aegis Check
          </h1>
          <p style={{ fontSize: 13, color: T.text30, margin: 0, lineHeight: 1.6 }}>
            Paste anything. Get an instant safety score.
          </p>
        </div>

        {/* Input */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: 4,
            display: "flex",
            gap: 4,
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              placeholder="Token address, wallet, GitHub repo, MCP server, or website..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: T.text95,
                fontSize: 13,
                padding: "12px 14px",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "-0.01em",
              }}
            />
            <button
              onClick={handleCheck}
              disabled={loading || detectedType === "unknown"}
              style={{
                background: detectedType !== "unknown" ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${detectedType !== "unknown" ? "rgba(52,211,153,0.20)" : T.border}`,
                borderRadius: 4,
                color: detectedType !== "unknown" ? T.positive : T.text30,
                fontSize: 11,
                fontWeight: 500,
                padding: "8px 20px",
                cursor: detectedType !== "unknown" ? "pointer" : "default",
                letterSpacing: "0.04em",
                transition: "all 0.15s",
              }}
            >
              {loading ? "Checking..." : "Check"}
            </button>
          </div>

          {/* Type indicator */}
          {input.trim() && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: detectedType !== "unknown" ? T.accent : T.text20,
                background: detectedType !== "unknown" ? "rgba(52,211,153,0.06)" : "rgba(255,255,255,0.02)",
                padding: "3px 8px",
                borderRadius: 3,
              }}>
                {typeLabel(detectedType)}
              </span>
              <span style={{ fontSize: 11, color: T.text30 }}>
                {typeDescription(detectedType)}
              </span>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: "32px 24px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 12, color: T.text50, marginBottom: 12 }}>
              Running checks...
            </div>
            <div style={{
              height: 2,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 1,
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: "60%",
                background: T.accent,
                borderRadius: 1,
                animation: "shimmer 1.5s ease-in-out infinite",
              }} />
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Score card */}
            <div style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              padding: "28px 24px",
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}>
              {/* Score circle */}
              <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                  <circle
                    cx="36" cy="36" r="30" fill="none"
                    stroke={scoreColor(result.score)}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(result.score / 100) * 188.5} 188.5`}
                    transform="rotate(-90 36 36)"
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                </svg>
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexDirection: "column",
                }}>
                  <span style={{ fontSize: 18, fontWeight: 400, color: T.text95 }}>{result.score}</span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                    color: labelColor(result.label),
                    background: `${labelColor(result.label)}15`,
                    padding: "3px 10px",
                    borderRadius: 3,
                  }}>
                    {result.label}
                  </span>
                  <span style={{ fontSize: 10, color: T.text30, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                    {typeLabel(result.type)}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: T.text50, margin: 0, lineHeight: 1.5 }}>
                  {result.summary}
                </p>
              </div>
            </div>

            {/* Individual checks */}
            <div style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              overflow: "hidden",
            }}>
              <div style={{
                padding: "10px 16px",
                borderBottom: `1px solid ${T.border}`,
              }}>
                <span style={{ fontSize: 10, fontWeight: 400, color: T.text20, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
                  Checks
                </span>
              </div>
              {result.checks.map((check, i) => (
                <div
                  key={check.name}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 16px",
                    borderBottom: i < result.checks.length - 1 ? `1px solid ${T.border}` : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: check.passed ? T.positive : T.negative,
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 12, color: T.text50 }}>{check.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: check.passed ? T.text30 : T.negative, fontFamily: "'JetBrains Mono', monospace" }}>
                    {check.detail}
                  </span>
                </div>
              ))}
            </div>

            {/* Share */}
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <span style={{ fontSize: 10, color: T.text20 }}>
                Powered by Aegis Protocol
              </span>
            </div>
          </div>
        )}

        {/* Empty state hints */}
        {!input.trim() && !result && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Token", example: "Paste a Solana token mint address" },
              { label: "Wallet", example: "Paste any Solana wallet address" },
              { label: "Contract", example: "Paste a GitHub repo URL" },
              { label: "MCP Server", example: "Paste an MCP server endpoint" },
            ].map((hint) => (
              <div key={hint.label} style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 4,
                padding: "14px 16px",
              }}>
                <div style={{ fontSize: 11, color: T.text50, marginBottom: 4 }}>{hint.label}</div>
                <div style={{ fontSize: 10, color: T.text20 }}>{hint.example}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
