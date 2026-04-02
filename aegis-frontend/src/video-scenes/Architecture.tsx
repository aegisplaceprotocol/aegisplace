import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import {
  colors as c,
  fonts as f,
  headline,
  label as labelStyle,
  AEGIS_ICON,
  sceneBase,
  container,
  appear,
  prog,
} from "./tokens";

const F = "Aeonik, Outfit, system-ui, sans-serif";

/** Scene 3: ARCHITECTURE. 5.5s (165 frames)
 *
 * Clean CSS flexbox layout. No SVG diagram.
 * Everything centered. No coordinate math.
 */

const STAGES = [
  { n: "01", label: "Authenticate", desc: "Verify agent identity" },
  { n: "02", label: "Route via MCP", desc: "Match to best operator" },
  { n: "03", label: "Success Rate", desc: "5-dimension quality check" },
  { n: "04", label: "NeMo Guardrails", desc: "Input & output safety" },
  { n: "05", label: "Settle on Solana", desc: "~400ms USDC finality" },
];

export const Architecture: React.FC = () => {
  const frame = useCurrentFrame();
  const exit = interpolate(frame, [153, 165], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const pAgent = prog(frame, 6, 14);
  const pCore = prog(frame, 16, 24);
  const pOp = prog(frame, 48, 56);
  const pSettle = prog(frame, 60, 68);
  const pEarn = prog(frame, 68, 76);

  // Data packet: which stage is active
  const packetIdx = frame > 28 ? Math.min(4.9, (frame - 28) * 0.06) : -1;

  return (
    <AbsoluteFill style={{ ...sceneBase, opacity: exit }}>
      <div style={{
        ...container,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40, ...appear(frame, 0) }}>
          <div style={{ ...labelStyle, marginBottom: 8 }}>Architecture</div>
          <h2 style={{ ...headline, fontSize: 48, margin: 0 }}>How Aegis works</h2>
        </div>

        {/* ═══ MAIN ROW: Agent → Core → Operator ═══ */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          width: "100%",
          marginBottom: 32,
        }}>
          {/* Agent box */}
          <div style={{
            width: 176,
            flexShrink: 0,
            border: `1px solid ${c.border}`,
            background: c.surface,
            padding: "24px 16px",
            textAlign: "center" as const,
            opacity: pAgent,
            transform: `translateY(${(1 - pAgent) * 8}px)`,
          }}>
            <div style={{ fontFamily: f.family, fontWeight: f.weight.regular, fontSize: 16, color: c.text.primary, marginBottom: 8 }}>AI Agent</div>
            <div style={{ fontFamily: f.family, fontWeight: f.weight.regular, fontSize: 11, color: c.text.muted }}>Any LLM or Agent</div>
          </div>

          {/* Arrow left */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            opacity: pAgent, flexShrink: 0, width: 72,
          }}>
            <span style={{ fontFamily: f.family, fontWeight: f.weight.regular, fontSize: 9, color: c.text.label, letterSpacing: "0.08em" }}>USDC</span>
            <svg width={56} height={8} viewBox="0 0 56 8">
              <line x1={0} y1={4} x2={48} y2={4} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 5" strokeDashoffset={-(frame * 0.5)} />
              <polygon points="48,1 48,7 54,4" fill="rgba(255,255,255,0.12)" />
            </svg>
            <span style={{ fontFamily: f.family, fontWeight: f.weight.regular, fontSize: 8, color: "rgba(255,255,255,0.08)", letterSpacing: "0.06em" }}>HTTP 402</span>
          </div>

          {/* ═══ AEGIS CORE. the hero element ═══ */}
          <div style={{
            width: 440,
            flexShrink: 0,
            border: `1px solid ${c.borderBright}`,
            background: "rgba(255,255,255,0.02)",
            padding: "20px 24px",
            opacity: pCore,
            transform: `translateY(${(1 - pCore) * 8}px)`,
          }}>
            {/* Core header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, marginBottom: 20,
            }}>
              <svg width={16} height={16} viewBox="0 0 3797 3797">
                <path d={AEGIS_ICON} fill="rgba(255,255,255,0.25)" />
              </svg>
              <span style={{
                fontFamily: f.family, fontWeight: f.weight.regular,
                fontSize: 11, color: c.text.label, letterSpacing: "0.14em",
              }}>AEGIS PROTOCOL</span>
            </div>

            {/* 5 stages */}
            {STAGES.map((stage, i) => {
              const sp = prog(frame, 24 + i * 4, 32 + i * 4);
              const isActive = packetIdx >= i && packetIdx < i + 1.1;
              return (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 16px",
                  marginBottom: i < 4 ? 8 : 0,
                  border: `1px solid rgba(255,255,255,${isActive ? 0.12 : 0.04})`,
                  background: isActive ? "rgba(255,255,255,0.02)" : "transparent",
                  opacity: sp,
                  transform: `translateY(${(1 - sp) * 6}px)`,
                }}>
                  {/* Number */}
                  <span style={{
                    fontFamily: f.family, fontWeight: f.weight.regular,
                    fontSize: 10, color: c.text.label, width: 24, flexShrink: 0,
                  }}>{stage.n}</span>
                  {/* Label */}
                  <span style={{
                    fontFamily: f.family, fontWeight: f.weight.regular,
                    fontSize: 14, color: "rgba(255,255,255,0.60)", flex: 1,
                  }}>{stage.label}</span>
                  {/* Description */}
                  <span style={{
                    fontFamily: f.family, fontWeight: f.weight.regular,
                    fontSize: 11, color: c.text.muted, flexShrink: 0,
                  }}>{stage.desc}</span>
                </div>
              );
            })}
          </div>

          {/* Arrow right */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            opacity: pOp, flexShrink: 0, width: 72,
          }}>
            <span style={{ fontFamily: f.family, fontWeight: f.weight.regular, fontSize: 9, color: c.text.label, letterSpacing: "0.08em" }}>INVOKE</span>
            <svg width={56} height={8} viewBox="0 0 56 8">
              <line x1={0} y1={4} x2={48} y2={4} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 5" strokeDashoffset={-(frame * 0.5)} />
              <polygon points="48,1 48,7 54,4" fill="rgba(255,255,255,0.12)" />
            </svg>
            <span style={{ fontFamily: f.family, fontWeight: f.weight.regular, fontSize: 8, color: "rgba(255,255,255,0.08)", letterSpacing: "0.06em" }}>VERIFIED</span>
          </div>

          {/* Operator box */}
          <div style={{
            width: 176,
            flexShrink: 0,
            border: `1px solid ${c.border}`,
            background: c.surface,
            padding: "24px 16px",
            textAlign: "center" as const,
            opacity: pOp,
            transform: `translateY(${(1 - pOp) * 8}px)`,
          }}>
            <div style={{ fontFamily: f.family, fontWeight: f.weight.regular, fontSize: 16, color: c.text.primary, marginBottom: 8 }}>Skill Operator</div>
            <div style={{ fontFamily: f.family, fontWeight: f.weight.regular, fontSize: 11, color: c.text.muted }}>Your code, your price</div>
          </div>
        </div>

        {/* ═══ SETTLE ARROW (vertical, centered) ═══ */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          marginBottom: 16, opacity: pSettle,
        }}>
          <svg width={8} height={32} viewBox="0 0 8 32">
            <line x1={4} y1={0} x2={4} y2={24} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 5" strokeDashoffset={-(frame * 0.5)} />
            <polygon points="1,24 7,24 4,30" fill="rgba(255,255,255,0.12)" />
          </svg>
          <span style={{ fontFamily: f.family, fontWeight: f.weight.regular, fontSize: 8, color: c.text.label, letterSpacing: "0.10em" }}>SETTLE ON SOLANA</span>
        </div>

        {/* ═══ EARN BOX (centered) ═══ */}
        <div style={{
          width: 360,
          border: `1px solid ${c.borderBright}`,
          background: "rgba(255,255,255,0.03)",
          padding: "24px 32px",
          textAlign: "center" as const,
          opacity: pEarn,
          transform: `translateY(${(1 - pEarn) * 8}px)`,
        }}>
          <div style={{ fontFamily: f.family, fontWeight: f.weight.regular, fontSize: 20, color: c.text.primary, marginBottom: 8 }}>
            Creator earns 85%
          </div>
          <div style={{ fontFamily: f.family, fontWeight: f.weight.regular, fontSize: 12, color: c.text.muted }}>
            Settled in USDC · 400ms · No invoices
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
