import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { t, text } from "../theme";

/**
 * S01 — Cold open. No preamble. Just the name and what it is.
 * 3.5 seconds. Swiss grid. Left-aligned.
 */
export const S01_Open: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lineReveal = spring({ frame, fps, config: { damping: 30, stiffness: 300 } });
  const titleY = interpolate(frame, [8, 35], [40, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [8, 30], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [28, 48], [0, 1], { extrapolateRight: "clamp" });
  const metaOp = interpolate(frame, [45, 65], [0, 1], { extrapolateRight: "clamp" });

  // Exit fade
  const exit = interpolate(frame, [85, 105], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: t.bg, padding: "0 140px", justifyContent: "center", opacity: exit }}>
      {/* Thin horizontal line — reveals left to right */}
      <div
        style={{
          width: `${lineReveal * 120}px`,
          height: 1,
          backgroundColor: t.t30,
          marginBottom: 40,
        }}
      />

      {/* Title */}
      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)` }}>
        <h1 style={{ ...text.headline, fontSize: 88, margin: 0 }}>
          Aegis Protocol
        </h1>
      </div>

      {/* Subtitle */}
      <p
        style={{
          opacity: subOp,
          ...text.body,
          fontSize: 24,
          marginTop: 20,
          maxWidth: 600,
        }}
      >
        The skill marketplace where AI agents pay developers.
      </p>

      {/* Meta line */}
      <div
        style={{
          opacity: metaOp,
          display: "flex",
          gap: 40,
          marginTop: 48,
        }}
      >
        {["Solana", "MCP", "x402", "Token-2022"].map((tag) => (
          <span key={tag} style={{ ...text.label, color: t.t30 }}>
            {tag}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
