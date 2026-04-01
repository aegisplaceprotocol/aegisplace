import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { colors as c, fonts as f, headline, body, label as labelStyle, sceneBase, container, appear, prog } from "./tokens";

const JSON_LINES = [
  '{',
  '  "mcpServers": {',
  '    "aegis": {',
  '      "url": "https://aegisplace.com/api/mcp"',
  '    }',
  '  }',
  '}',
];

/** Scene 7: MCP CONNECT. 4.5s (135 frames) */
export const MCPConnect: React.FC = () => {
  const frame = useCurrentFrame();
  const exit = interpolate(frame, [123, 135], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...sceneBase, opacity: exit }}>
      <div style={{ ...container, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Header */}
        <div style={{ ...appear(frame, 0) }}>
          <span style={labelStyle}>Integration</span>
          <h2 style={{ ...headline, fontSize: 48, margin: 0, marginTop: 8, marginBottom: 16 }}>
            One line to connect.
          </h2>
        </div>

        {/* Subtitle */}
        <p style={{
          fontFamily: f.family,
          fontWeight: f.weight.regular,
          fontSize: 18,
          color: c.text.secondary,
          margin: 0,
          marginBottom: 32,
          ...appear(frame, 6),
        }}>
          Works with Claude, Cursor, Windsurf, OpenCode.
        </p>

        {/* JSON block */}
        <div style={{
          maxWidth: 560,
          width: "100%",
          border: `1px solid ${c.border}`,
          background: "#060606",
          padding: 24,
          textAlign: "left" as const,
          ...appear(frame, 12),
        }}>
          {JSON_LINES.map((line, i) => {
            const lp = prog(frame, 14 + i * 2, 22 + i * 2);
            return (
              <div key={i} style={{
                fontFamily: f.family,
                fontWeight: f.weight.regular,
                fontSize: 14,
                lineHeight: 1.8,
                color: line.includes("url") ? c.text.secondary : c.text.muted,
                whiteSpace: "pre",
                opacity: lp,
              }}>
                {line}
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        <div style={{
          display: "flex",
          gap: 56,
          marginTop: 40,
          justifyContent: "center",
          ...appear(frame, 40),
        }}>
          {[
            { val: "16", label: "Tools" },
            { val: "452", label: "Operators" },
            { val: "12", label: "Categories" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" as const, ...appear(frame, 42 + i * 3) }}>
              <div style={{
                fontFamily: f.family,
                fontWeight: f.weight.light,
                fontSize: 24,
                color: c.text.primary,
                letterSpacing: "-0.03em",
              }}>
                {s.val}
              </div>
              <div style={{
                fontFamily: f.family,
                fontWeight: f.weight.regular,
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase" as const,
                color: c.text.label,
                marginTop: 8,
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
