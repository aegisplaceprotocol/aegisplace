import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { colors as c, fonts as f, headline, body, label as labelStyle, sceneBase, container, appear, prog } from "./tokens";

/** Scene 5: SKILL MARKETPLACE. 5s (150 frames) */
const STEPS = [
  { n: "01", title: "Build something useful", desc: "A security scanner, a trading strategy, a data analyzer. anything an AI agent needs.", tags: ["Contract Scanner", "50-DEX Router", "Whale Tracker"] },
  { n: "02", title: "Upload it, name your price", desc: "We handle hosting, scaling, security, and billing. You focus on what you're good at.", tags: ["$0.05/call", "$0.10/call", "$0.02/call"] },
  { n: "03", title: "Earn every time it runs", desc: "Every invocation pays you instantly via USDC. No minimums. No delays. 24/7.", tags: ["AuditDAO. $847", "RouteMstr. $1,204", "DeepData. $392"] },
];

export const Marketplace: React.FC = () => {
  const frame = useCurrentFrame();
  const exit = interpolate(frame, [138, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...sceneBase, opacity: exit }}>
      <div style={{ ...container, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Header */}
        <div style={{ marginBottom: 16, ...appear(frame, 0) }}>
          <span style={labelStyle}>Skill Marketplace</span>
          <h2 style={{ ...headline, fontSize: 48, margin: "8px 0 0" }}>Build a skill once. Get paid forever.</h2>
        </div>

        {/* Subtitle */}
        <p style={{ ...body, fontSize: 18, maxWidth: 600, marginBottom: 40, ...appear(frame, 6) }}>
          Think of it like an app store, but for AI agent abilities.
          Build something useful, set your price, get paid every time it runs.
        </p>

        {/* 3 cards */}
        <div style={{ display: "flex", gap: 24, width: "100%" }}>
          {STEPS.map((step, i) => {
            const delay = 14 + i * 5;
            const sp = prog(frame, delay, delay + 8);
            return (
              <div key={i} style={{
                flex: 1,
                border: `1px solid ${c.border}`,
                background: c.surface,
                padding: 24,
                overflow: "hidden",
                textAlign: "left",
                opacity: sp,
                transform: `translateY(${(1 - sp) * 12}px)`,
              }}>
                {/* Step number */}
                <div style={{
                  width: 32,
                  height: 32,
                  border: `1px solid ${c.borderBright}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}>
                  <span style={{ fontFamily: f.family, fontWeight: f.weight.light, fontSize: 14, color: c.text.muted }}>{step.n}</span>
                </div>

                {/* Title */}
                <div style={{ fontFamily: f.family, fontWeight: f.weight.regular, fontSize: 17, color: c.text.primary, marginBottom: 8 }}>{step.title}</div>

                {/* Description */}
                <div style={{ fontFamily: f.family, fontWeight: f.weight.regular, fontSize: 13, color: "rgba(255,255,255,0.40)", lineHeight: 1.5, marginBottom: 16 }}>{step.desc}</div>

                {/* Divider */}
                <div style={{ height: 1, background: c.border, marginBottom: 16 }} />

                {/* Tags */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {step.tags.map((tag, j) => (
                    <span key={j} style={{
                      fontFamily: f.family,
                      fontWeight: f.weight.regular,
                      fontSize: 11,
                      color: c.text.muted,
                      border: `1px solid ${c.border}`,
                      padding: "2px 8px",
                      opacity: prog(frame, delay + 6 + j * 2, delay + 14 + j * 2),
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
