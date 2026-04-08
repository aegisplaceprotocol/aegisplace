import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { colors as c, fonts as f, headline, body, label as labelStyle, sceneBase, container, appear, prog } from "./tokens";

/** Scene 6: TERMINAL DEMO. 7s (210 frames) */
type LT = "cmd" | "ok" | "out" | "head" | "split" | "dim" | "gap";

const L: { t: number; type: LT; text: string }[] = [
  { t: 0,   type: "cmd",   text: '$ aegis search "code review"' },
  { t: 8,   type: "out",   text: "  Searching Aegis Index (452 operators)..." },
  { t: 16,  type: "gap",   text: "" },
  { t: 18,  type: "head",  text: "  OPERATOR              SCORE   PRICE" },
  { t: 20,  type: "dim",   text: "  ─────────────────────────────────────" },
  { t: 23,  type: "out",   text: "  code-review-agent     92/100  $0.05" },
  { t: 26,  type: "out",   text: "  security-audit        95/100  $0.08" },
  { t: 32,  type: "gap",   text: "" },
  { t: 36,  type: "cmd",   text: "$ aegis invoke code-review-agent --pay usdc" },
  { t: 46,  type: "out",   text: "  HTTP 402 → Payment Required" },
  { t: 50,  type: "out",   text: "  Amount: $0.05 USDC | Chain: Solana" },
  { t: 58,  type: "ok",    text: "  [OK] USDC payment confirmed (tx: 4kR9...mN2x)" },
  { t: 66,  type: "gap",   text: "" },
  { t: 70,  type: "split", text: "  Revenue split:" },
  { t: 74,  type: "split", text: "    85%  → creator    9pLm...kQ4w" },
  { t: 78,  type: "split", text: "    10%  → validators pool" },
  { t: 82,  type: "split", text: "     3%  → treasury" },
  { t: 86,  type: "split", text: "    1.5% → insurance" },
  { t: 90,  type: "split", text: "     3%  → insurance" },
  { t: 94,  type: "split", text: "    0.5% → burned" },
  { t: 102, type: "gap",   text: "" },
  { t: 106, type: "out",   text: "  Executing operator..." },
  { t: 116, type: "ok",    text: "  [OK] Completed 1.2s | Quality 92/100" },
  { t: 122, type: "ok",    text: "  [OK] Success rate: 92/100" },
  { t: 130, type: "gap",   text: "" },
  { t: 136, type: "cmd",   text: "$ aegis balance" },
  { t: 146, type: "ok",    text: "  SOL: 1.998  |  USDC: 9.95  |  $AEGIS: 0.00" },
];

function color(type: LT): string {
  switch (type) {
    case "cmd":   return c.text.primary;
    case "ok":    return "rgba(255,255,255,0.60)";
    case "out":   return c.text.secondary;
    case "head":  return c.text.muted;
    case "split": return "rgba(255,255,255,0.45)";
    case "dim":   return c.text.label;
    default:      return "transparent";
  }
}

export const Terminal: React.FC = () => {
  const frame = useCurrentFrame();
  const exit = interpolate(frame, [195, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const visible = L.filter((l) => frame >= l.t);

  return (
    <AbsoluteFill style={{ ...sceneBase, opacity: exit }}>
      <div style={{ ...container, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Header */}
        <div style={{ marginBottom: 8, ...appear(frame, 0) }}>
          <span style={labelStyle}>Demo</span>
          <h2 style={{ ...headline, fontSize: 44, margin: "8px 0 0" }}>Search. Pay. Execute. Earn.</h2>
        </div>

        {/* Subtitle */}
        <p style={{ ...body, fontSize: 15, marginBottom: 24, ...appear(frame, 4) }}>
          One terminal session. Everything on Solana.
        </p>

        {/* Terminal window */}
        <div style={{
          width: "100%",
          maxWidth: 780,
          border: `1px solid ${c.border}`,
          background: "#111111",
          overflow: "hidden",
          ...appear(frame, 6),
        }}>
          {/* Chrome bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderBottom: `1px solid ${c.border}`,
            background: c.surface,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.10)" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.15)" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.20)" }} />
            <span style={{ fontFamily: f.family, fontWeight: f.weight.regular, fontSize: 11, color: c.text.label, marginLeft: 8 }}>
              aegis. bash. 80x24
            </span>
          </div>

          {/* Content */}
          <div style={{ padding: "16px 16px", textAlign: "left" }}>
            {visible.map((line) => {
              const lineOp = prog(frame, line.t, line.t + 4);
              return (
                <div key={line.t} style={{
                  opacity: lineOp,
                  fontFamily: f.family,
                  fontWeight: line.type === "cmd" || line.type === "head" ? f.weight.bold : f.weight.regular,
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: color(line.type),
                  whiteSpace: "pre",
                  height: line.type === "gap" ? 4 : "auto",
                }}>{line.text || "\u00A0"}</div>
              );
            })}
            {Math.floor(frame / 10) % 2 === 0 && (
              <span style={{ display: "inline-block", width: 6, height: 12, backgroundColor: "rgba(255,255,255,0.50)" }} />
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
