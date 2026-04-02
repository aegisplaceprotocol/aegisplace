import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import {
  colors as c,
  fonts as f,
  headline,
  body,
  label as labelStyle,
  sceneBase,
  container,
  appear,
  prog,
} from "./tokens";

const STATS = [
  { value: "$4.8T", desc: "AI agent market by 2030", sub: "Every agent needs skills to function" },
  { value: "1B+", desc: "Agents making calls daily by 2028", sub: "Each call is a potential payment" },
  { value: "85%", desc: "Of every fee goes to the creator", sub: "Settled on Solana in 400ms" },
];

/** Scene 2: THE PROBLEM. 4.5s (135 frames) */
export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const exit = interpolate(frame, [123, 135], [1, 0], {
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
        <div style={{ textAlign: "center", marginBottom: 64, ...appear(frame, 4) }}>
          <div style={{ ...labelStyle, marginBottom: 12 }}>The Opportunity</div>
          <h2 style={{ ...headline, fontSize: 48, margin: 0 }}>
            Your AI skills should make you money.
          </h2>
        </div>

        {/* 3 stats in a centered row */}
        <div style={{
          display: "flex",
          gap: 64,
          justifyContent: "center",
          width: "100%",
          maxWidth: 1000,
        }}>
          {STATS.map((stat, i) => {
            const entrance = appear(frame, 16 + i * 8);
            return (
              <div key={i} style={{
                ...entrance,
                flex: 1,
                textAlign: "center",
                padding: "32px 0",
                borderTop: `1px solid ${c.border}`,
              }}>
                <div style={{
                  fontFamily: f.family,
                  fontWeight: f.weight.regular,
                  fontSize: 56,
                  color: c.text.primary,
                  letterSpacing: "-0.03em",
                  marginBottom: 16,
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontFamily: f.family,
                  fontWeight: f.weight.regular,
                  fontSize: 15,
                  color: c.text.secondary,
                  lineHeight: 1.5,
                  marginBottom: 8,
                }}>
                  {stat.desc}
                </div>
                <div style={{
                  fontFamily: f.family,
                  fontWeight: f.weight.regular,
                  fontSize: 12,
                  color: c.text.muted,
                  letterSpacing: "0.02em",
                }}>
                  {stat.sub}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tagline. centered */}
        <div style={{ marginTop: 56, textAlign: "center", ...appear(frame, 56) }}>
          <span style={{
            ...headline,
            fontSize: 32,
            color: c.text.secondary,
          }}>
            Upload once. Earn forever.
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
