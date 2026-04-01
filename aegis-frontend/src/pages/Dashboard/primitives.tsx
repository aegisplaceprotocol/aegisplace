/**
 * Aegis Dashboard. Primitive Components
 *
 * Swiss minimal. Light weights. Generous whitespace.
 * The interface disappears. The data remains.
 */
import React, { useState } from "react";
import { T } from "./theme";

/* ── Card ──────────────────────────────────────────────────────────────── */

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.borderSubtle}`,
      borderRadius: 4,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── CardHead ──────────────────────────────────────────────────────────── */

export function CardHead({ label, action }: { label: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", borderBottom: `1px solid ${T.borderSubtle}`,
    }}>
      <span style={{ fontSize: 10, fontWeight: 400, color: T.text30, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </span>
      {action}
    </div>
  );
}

/* ── PageHeader ────────────────────────────────────────────────────────── */

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 32 }}>
      <div>
        <h1 style={{ fontSize: 15, fontWeight: 400, color: T.text80, margin: 0, letterSpacing: "0.01em" }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 11, color: T.text30, margin: "6px 0 0", fontWeight: 300 }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ── StatTile ──────────────────────────────────────────────────────────── */

export function StatTile({
  label, value, delta, deltaPositive, sub, accent: _accent,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  sub?: string;
  accent?: string;
}) {
  return (
    <div style={{ padding: "18px 0" }}>
      <div style={{ fontSize: 10, fontWeight: 400, color: T.text30, marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 300, fontVariantNumeric: "tabular-nums",
        color: T.text80, lineHeight: 1, letterSpacing: "-0.01em",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>
        {value}
      </div>
      {delta && (
        <div style={{ fontSize: 10, color: deltaPositive === false ? T.negative : T.positive, marginTop: 8, fontVariantNumeric: "tabular-nums", fontWeight: 400 }}>
          {delta}
        </div>
      )}
      {sub && <div style={{ fontSize: 10, color: T.text20, marginTop: 4, fontWeight: 300 }}>{sub}</div>}
    </div>
  );
}

/* ── StatusBadge ───────────────────────────────────────────────────────── */

export function StatusBadge({ status, color }: { status: string; color?: "green" | "amber" | "red" | "blue" | "gray" | "purple" }) {
  const map: Record<string, string> = {
    green:  "rgba(52,211,153,0.60)",
    amber:  "rgba(234,179,68,0.45)",
    red:    "rgba(220,100,60,0.50)",
    blue:   T.text30,
    purple: T.text30,
    gray:   T.text20,
  };

  const autoColor = color ?? (
    /complete|active|healthy|success/i.test(status) ? "green" :
    /pending|waiting|review/i.test(status) ? "amber" :
    /fail|error|slash|reject/i.test(status) ? "red" : "gray"
  );

  return (
    <span style={{
      display: "inline-block", fontSize: 10, fontWeight: 400,
      color: map[autoColor], letterSpacing: "0.02em",
    }}>
      {status}
    </span>
  );
}

/* ── TabBar ─────────────────────────────────────────────────────────────── */

export function TabBar<V extends string>({
  tabs, active, onChange,
}: {
  tabs: { id: V; label: string }[];
  active: V;
  onChange: (v: V) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 24, marginBottom: 28 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            background: "transparent",
            color: active === t.id ? T.text80 : T.text30,
            border: "none",
            borderBottom: "none",
            padding: "0 0 6px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: active === t.id ? 400 : 300,
            transition: "color 0.2s",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── FilterChips ───────────────────────────────────────────────────────── */

export function FilterChips<V extends string>({
  options, active, onChange,
}: {
  options: { id: V; label: string }[];
  active: V;
  onChange: (v: V) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          background: "transparent",
          color: active === o.id ? T.text80 : T.text30,
          border: "none", padding: "4px 10px", cursor: "pointer",
          fontSize: 11, fontWeight: 300, transition: "color 0.15s",
        }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── EmptyState ─────────────────────────────────────────────────────────── */

export function EmptyState({ title, message, subtitle, icon, action }: {
  title: string;
  message?: string;
  subtitle?: string;
  icon?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: 13, color: T.text30, fontWeight: 300 }}>{title}</div>
      {(subtitle || message) && (
        <div style={{ fontSize: 11, color: T.text20, marginTop: 6, maxWidth: 320, margin: "6px auto 0", lineHeight: 1.7, fontWeight: 300 }}>
          {subtitle || message}
        </div>
      )}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

/* ── LoadingSkeleton ───────────────────────────────────────────────────── */

export function LoadingSkeleton({ rows = 4, height = 12 }: { rows?: number; height?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "24px 14px" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height,
          borderRadius: 2,
          background: T.white4,
          opacity: 1 - i * 0.15,
          width: i === rows - 1 ? "40%" : i === rows - 2 ? "70%" : "100%",
        }} />
      ))}
    </div>
  );
}

/* ── MiniTable ─────────────────────────────────────────────────────────── */

export function MiniTable({ headers, rows }: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                fontSize: 9, fontWeight: 400, letterSpacing: "0.08em", textTransform: "uppercase",
                color: T.text20, textAlign: i === 0 ? "left" : "right",
                padding: "6px 14px", borderBottom: `1px solid ${T.borderSubtle}`,
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  fontSize: 12, color: ci === 0 ? T.text50 : T.text30,
                  fontWeight: 300,
                  textAlign: ci === 0 ? "left" : "right",
                  padding: "8px 14px",
                  fontVariantNumeric: ci > 0 ? "tabular-nums" : undefined,
                  borderBottom: ri < rows.length - 1 ? `1px solid ${T.borderSubtle}` : undefined,
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── ConnectWalletPrompt ───────────────────────────────────────────────── */

export function ConnectWalletPrompt() {
  return (
    <EmptyState
      title="Connect wallet to continue"
      message="Link your Solana wallet to access this section."
      action={
        <button style={{
          background: "transparent", color: T.text50, fontWeight: 400, fontSize: 11,
          border: `1px solid ${T.border}`, borderRadius: 3, padding: "7px 18px", cursor: "pointer",
          letterSpacing: "0.02em",
        }}>
          Connect
        </button>
      }
    />
  );
}

/* ── ActionButton ──────────────────────────────────────────────────────── */

export function ActionButton({ label, onClick, variant = "ghost" }: {
  label: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "ghost" | "danger";
}) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  return (
    <button onClick={onClick} style={{
      padding: "5px 12px",
      fontSize: 11,
      fontWeight: 400,
      color: isDanger ? T.negative : isPrimary ? T.text80 : T.text30,
      background: "transparent",
      border: `1px solid ${isPrimary ? T.border : isDanger ? "rgba(248,113,113,0.12)" : "transparent"}`,
      borderRadius: 3,
      cursor: "pointer",
      transition: "all 0.2s ease",
      letterSpacing: "0.01em",
    }}>
      {label}
    </button>
  );
}

/* ── MonoValue ─────────────────────────────────────────────────────────── */

export function MonoValue({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
      fontSize: 11,
      fontWeight: 300,
      fontVariantNumeric: "tabular-nums",
      color: color ?? T.text30,
    }}>
      {children}
    </span>
  );
}

/* ── ProgressBar ───────────────────────────────────────────────────────── */

export function ProgressBar({ value, max = 100, color: _color }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height: 1, background: T.white4, overflow: "hidden" }}>
      <div style={{
        width: `${pct}%`, height: "100%",
        background: "rgba(255,255,255,0.18)",
        transition: "width 0.5s ease",
      }} />
    </div>
  );
}

/* ── CodeBlock ─────────────────────────────────────────────────────────── */

export function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <pre style={{
        background: T.card,
        border: `1px solid ${T.borderSubtle}`,
        borderRadius: 3,
        padding: "14px 16px",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
        color: T.text30,
        overflowX: "auto",
        margin: 0,
        lineHeight: 1.7,
        fontWeight: 300,
      }}>
        {code}
      </pre>
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        style={{
          position: "absolute", top: 8, right: 8, background: "transparent",
          border: "none", padding: "4px 8px", cursor: "pointer",
          fontSize: 9, color: copied ? T.text50 : T.text20, fontWeight: 400,
          letterSpacing: "0.04em", textTransform: "uppercase",
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
