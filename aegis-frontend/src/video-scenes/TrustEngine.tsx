import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import {
  colors as c,
  fonts as f,
  headline,
  label as labelStyle,
  sceneBase,
  container,
  appear,
  prog,
} from "./tokens";

const DIMS = [
  { label: "Success Rate", pct: 89, weight: 30 },
  { label: "Review Score", pct: 94, weight: 25 },
  { label: "Response Time", pct: 82, weight: 20 },
  { label: "Uptime", pct: 97, weight: 15 },
  { label: "Verification", pct: 90, weight: 10 },
];

/** Scene 8: TRUST ENGINE. 5s (150 frames) */
export const TrustEngine: React.FC = () => {
  const frame = useCurrentFrame();
  const exit = interpolate(frame, [138, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ ...sceneBase, opacity: exit }}>
      <div style={{
        ...container,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        {/* Header. centered */}
        <div style={{ textAlign: "center", marginBottom: 56, ...appear(frame, 0) }}>
          <div style={{ ...labelStyle, marginBottom: 12 }}>Trust</div>
          <h2 style={{ ...headline, fontSize: 48, margin: 0 }}>
            Five dimensions. One score.
          </h2>
        </div>

        {/* 5 bars. full width, generous spacing */}
        <div style={{ width: "100%", maxWidth: 800 }}>
          {DIMS.map((dim, i) => {
            const delay = 12 + i * 6;
            const barAppear = prog(frame, delay, delay + 8);
            const fillProg = prog(frame, delay + 4, delay + 24);
            const barOpacity = (0.65 - i * 0.10);

            return (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                marginBottom: 24,
                opacity: barAppear,
                transform: `translateY(${(1 - barAppear) * 8}px)`,
              }}>
                {/* Label. right aligned */}
                <span style={{
                  width: 136,
                  textAlign: "right" as const,
                  flexShrink: 0,
                  fontFamily: f.family,
                  fontWeight: f.weight.regular,
                  fontSize: 14,
                  color: c.text.secondary,
                }}>
                  {dim.label}
                </span>

                {/* Bar track */}
                <div style={{
                  flex: 1,
                  height: 24,
                  background: "rgba(255,255,255,0.03)",
                  position: "relative" as const,
                  overflow: "hidden",
                }}>
                  <div style={{
                    width: `${dim.pct * fillProg}%`,
                    height: "100%",
                    background: `rgba(255,255,255,${barOpacity.toFixed(2)})`,
                  }} />
                </div>

                {/* Percentage */}
                <span style={{
                  width: 56,
                  textAlign: "right" as const,
                  flexShrink: 0,
                  fontFamily: f.family,
                  fontWeight: f.weight.regular,
                  fontSize: 20,
                  color: c.text.primary,
                  letterSpacing: "-0.02em",
                }}>
                  {Math.round(dim.pct * fillProg)}%
                </span>

                {/* Weight */}
                <span style={{
                  width: 40,
                  textAlign: "right" as const,
                  flexShrink: 0,
                  fontFamily: f.family,
                  fontWeight: f.weight.regular,
                  fontSize: 11,
                  color: c.text.label,
                }}>
                  {dim.weight}%
                </span>
              </div>
            );
          })}

          {/* Divider */}
          <div style={{
            height: 1,
            background: c.border,
            marginTop: 24,
            marginBottom: 32,
            ...appear(frame, 56),
          }} />

          {/* Overall score. right aligned, big */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "baseline",
            gap: 16,
            ...appear(frame, 60),
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.40)",
              }} />
              <span style={{
                fontFamily: f.family,
                fontWeight: f.weight.regular,
                fontSize: 14,
                color: c.text.muted,
              }}>
                Overall Success Rate
              </span>
            </div>
            <span style={{
              fontFamily: f.family,
              fontWeight: f.weight.regular,
              fontSize: 48,
              color: c.text.primary,
              letterSpacing: "-0.03em",
            }}>
              89/100
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
