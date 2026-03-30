import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { t, text } from "../theme";

/**
 * S06 — Close. Stats grid, URL, NIST badge.
 * No gradients. No color. Just information.
 */

const METRICS = [
  { value: "452", label: "Operators" },
  { value: "16", label: "MCP Tools" },
  { value: "46", label: "Tests Pass" },
  { value: "4", label: "Programs" },
];

export const S06_Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Stats (0-80)
  const statsOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Phase 2: URL (80-160)
  const urlScale = spring({ frame: frame - 80, fps, config: { damping: 18, stiffness: 200 } });
  const urlOp = interpolate(frame, [80, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Phase 3: Bottom matter (140+)
  const bottomOp = interpolate(frame, [140, 160], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Final fade
  const exit = interpolate(frame, [255, 285], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: t.bg, opacity: exit }}>
      {/* Stats row — top */}
      <div
        style={{
          opacity: statsOp,
          display: "flex",
          justifyContent: "center",
          gap: 100,
          paddingTop: 180,
        }}
      >
        {METRICS.map((m, i) => {
          const delay = 8 + i * 10;
          const op = interpolate(frame, [delay, delay + 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const y = interpolate(frame, [delay, delay + 12], [15, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div key={i} style={{ opacity: op, transform: `translateY(${y}px)`, textAlign: "center" }}>
              <div
                style={{
                  fontFamily: t.font,
                  fontSize: 56,
                  fontWeight: 700,
                  color: t.t70,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {m.value}
              </div>
              <div style={{ ...text.label, marginTop: 10 }}>{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* URL — center */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${urlScale})`,
          opacity: urlOp,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            ...text.headline,
            fontSize: 80,
            margin: 0,
          }}
        >
          aegisplace.com
        </h1>
        <p style={{ ...text.body, fontSize: 20, marginTop: 16 }}>
          Register skills. Agents pay. You earn.
        </p>
      </div>

      {/* Bottom: tech stack + NIST */}
      <div
        style={{
          opacity: bottomOp,
          position: "absolute",
          bottom: 60,
          left: 140,
          right: 140,
        }}
      >
        {/* Stack */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 32,
            marginBottom: 24,
          }}
        >
          {["Anchor/Rust", "Token-2022", "NeMo Guardrails", "x402", "MCP"].map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: t.mono,
                fontSize: 12,
                color: t.t15,
                border: `1px solid ${t.border}`,
                padding: "6px 14px",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* NIST line */}
        <div style={{ textAlign: "center" }}>
          <span style={{ fontFamily: t.mono, fontSize: 10, color: t.t08, letterSpacing: "0.2em" }}>
            NIST AI AGENT STANDARDS INITIATIVE — APRIL 2026
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
