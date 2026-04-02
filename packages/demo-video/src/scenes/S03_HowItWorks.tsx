import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { t, text } from "../theme";

/**
 * S03 - How it works. Four-column grid. Numbers + text.
 * Pure Swiss layout. No diagrams. The grid IS the diagram.
 */
const STEPS = [
  {
    num: "01",
    title: "Register",
    body: "Developers register skills on Solana. Name, endpoint, price. One transaction.",
  },
  {
    num: "02",
    title: "Discover",
    body: "AI agents find skills via MCP. Standard protocol. Works with Claude, GPT, any agent.",
  },
  {
    num: "03",
    title: "Pay",
    body: "HTTP 402 triggers USDC micropayment. x402 protocol. Sub-cent settlement on Solana.",
  },
  {
    num: "04",
    title: "Verify",
    body: "Every response scored. Latency, accuracy, schema. Trust accrues on-chain. 85/10/3/1.5/0.5 fee split.",
  },
];

export const S03_HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const exit = interpolate(frame, [185, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: t.bg,
        padding: "120px 140px",
        opacity: exit,
      }}
    >
      {/* Label */}
      <div style={{ opacity: headerOp, marginBottom: 60 }}>
        <span style={text.label}>How it works</span>
      </div>

      {/* 4-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
        {STEPS.map((step, i) => {
          const delay = 15 + i * 22;
          const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 200 } });
          const op = interpolate(frame, [delay, delay + 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                opacity: op,
                transform: `translateY(${(1 - s) * 20}px)`,
                borderTop: `1px solid ${t.border}`,
                paddingTop: 24,
              }}
            >
              {/* Number */}
              <span
                style={{
                  fontFamily: t.mono,
                  fontSize: 13,
                  fontWeight: 400,
                  color: t.t15,
                  display: "block",
                  marginBottom: 16,
                }}
              >
                {step.num}
              </span>

              {/* Title */}
              <h3
                style={{
                  ...text.headline,
                  fontSize: 28,
                  margin: "0 0 12px",
                }}
              >
                {step.title}
              </h3>

              {/* Body */}
              <p
                style={{
                  ...text.body,
                  fontSize: 15,
                  margin: 0,
                  color: t.t30,
                }}
              >
                {step.body}
              </p>
            </div>
          );
        })}
      </div>

      {/* Bottom stat bar */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 140,
          right: 140,
          display: "flex",
          justifyContent: "space-between",
          borderTop: `1px solid ${t.border}`,
          paddingTop: 24,
          opacity: interpolate(frame, [100, 120], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {[
          { val: "~400ms", label: "Settlement" },
          { val: "$0.00025", label: "Transaction fee" },
          { val: "60%", label: "To creators" },
          { val: "452", label: "Operators live" },
        ].map((s) => (
          <div key={s.label}>
            <div style={{ fontFamily: t.font, fontSize: 28, fontWeight: 600, color: t.t70, letterSpacing: "-0.02em" }}>
              {s.val}
            </div>
            <div style={{ ...text.label, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
