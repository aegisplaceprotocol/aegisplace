import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { t, text } from "../theme";

/**
 * S02 — The problem. Three lines. No decoration.
 * Each line types in, one after another. Cold, factual.
 */
const LINES = [
  "AI agents can't discover skills.",
  "AI agents can't pay for skills.",
  "AI agents can't verify quality.",
];

export const S02_Problem: React.FC = () => {
  const frame = useCurrentFrame();

  const headerOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Exit
  const exit = interpolate(frame, [130, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: t.bg,
        padding: "0 140px",
        justifyContent: "center",
        opacity: exit,
      }}
    >
      {/* Label */}
      <div style={{ opacity: headerOp, marginBottom: 48 }}>
        <span style={text.label}>The problem</span>
      </div>

      {/* Three statements */}
      {LINES.map((line, i) => {
        const start = 15 + i * 25;
        const op = interpolate(frame, [start, start + 18], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const x = interpolate(frame, [start, start + 18], [20, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              opacity: op,
              transform: `translateX(${x}px)`,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                ...text.headline,
                fontSize: 52,
                color: i === LINES.length - 1 ? t.t90 : t.t30,
              }}
            >
              {line}
            </span>
          </div>
        );
      })}

      {/* Punchline */}
      <div
        style={{
          opacity: interpolate(frame, [90, 110], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          marginTop: 40,
        }}
      >
        <span style={{ ...text.body, fontSize: 20, color: t.t50 }}>
          Aegis fixes all three.
        </span>
      </div>
    </AbsoluteFill>
  );
};
