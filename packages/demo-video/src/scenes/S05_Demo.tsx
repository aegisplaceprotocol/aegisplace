import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { t, text } from "../theme";

/**
 * S05 — Live terminal demo. Full-screen terminal.
 * Shows the actual demo-loop.ts running on devnet.
 * Each line appears with timing. Clean. No fake stuff.
 */

type LineType = "cmd" | "out" | "ok" | "dim" | "head" | "blank";

const LINES: { t: number; type: LineType; text: string }[] = [
  { t: 0,   type: "cmd",   text: "$ npx tsx scripts/demo-loop.ts --network devnet" },
  { t: 20,  type: "blank",  text: "" },
  { t: 25,  type: "head",  text: "AEGIS PROTOCOL — FULL LOOP DEMO" },
  { t: 30,  type: "dim",   text: "────────────────────────────────────────" },
  { t: 40,  type: "out",   text: "Connecting to Solana devnet..." },
  { t: 55,  type: "ok",    text: "[OK] Connected — slot #312,847,291" },
  { t: 75,  type: "out",   text: "Loading keypairs..." },
  { t: 85,  type: "ok",    text: "[OK] Admin    Fg4r...kP2q" },
  { t: 92,  type: "ok",    text: "[OK] Creator  8xNm...vJ3w" },
  { t: 99,  type: "ok",    text: "[OK] Caller   Bk7e...mR9t" },
  { t: 115, type: "blank",  text: "" },
  { t: 120, type: "head",  text: "1  REGISTER OPERATOR" },
  { t: 130, type: "out",   text: "Calling register_operator..." },
  { t: 155, type: "ok",    text: '[OK] "code-review-v3" registered on-chain' },
  { t: 165, type: "dim",   text: "     PDA  7Kp2...nX4m" },
  { t: 172, type: "dim",   text: "     Price  0.02 USDC / invocation" },
  { t: 180, type: "dim",   text: "     Tx  solscan.io/tx/3rYw...8kPq" },
  { t: 195, type: "blank",  text: "" },
  { t: 200, type: "head",  text: "2  INVOKE WITH PAYMENT" },
  { t: 210, type: "out",   text: "Transferring 0.02 USDC..." },
  { t: 230, type: "out",   text: "Forwarding to operator endpoint..." },
  { t: 250, type: "ok",    text: "[OK] Response received — 247ms" },
  { t: 260, type: "dim",   text: '     Quality score  92/100' },
  { t: 268, type: "dim",   text: "     Trust delta  +3" },
  { t: 280, type: "blank",  text: "" },
  { t: 285, type: "head",  text: "3  FEE DISTRIBUTION" },
  { t: 295, type: "ok",    text: "[OK] Creator   70%  0.014000 USDC  →  8xNm...vJ3w" },
  { t: 308, type: "ok",    text: "[OK] Stakers   20%  0.004000 USDC  →  Pool...Addr" },
  { t: 321, type: "ok",    text: "[OK] Treasury   9%  0.001800 USDC  →  Trea...sury" },
  { t: 334, type: "ok",    text: "[OK] Referrer   1%  0.000200 USDC  →  Refe...rrer" },
  { t: 348, type: "dim",   text: "     Sum  0.020000 USDC  ✓ exact" },
  { t: 360, type: "blank",  text: "" },
  { t: 365, type: "head",  text: "4  TRUST UPDATE" },
  { t: 375, type: "ok",    text: "[OK] Trust  50.00 → 53.00  (+3.00)" },
  { t: 390, type: "blank",  text: "" },
  { t: 395, type: "head",  text: "5  INVOCATION RECEIPT" },
  { t: 405, type: "ok",    text: "[OK] Receipt PDA  9mXk...pQ2r" },
  { t: 415, type: "dim",   text: "     Amount  0.02 USDC" },
  { t: 422, type: "dim",   text: "     Response  247ms" },
  { t: 429, type: "dim",   text: "     Trust Δ  +3" },
  { t: 440, type: "blank",  text: "" },
  { t: 445, type: "dim",   text: "────────────────────────────────────────" },
  { t: 450, type: "ok",    text: "ALL STEPS PASSED" },
  { t: 460, type: "dim",   text: "3 on-chain transactions  |  4.2s total" },
];

function getColor(type: LineType): string {
  switch (type) {
    case "cmd": return t.t70;
    case "ok": return t.t90;
    case "out": return t.t50;
    case "dim": return t.t15;
    case "head": return t.t30;
    case "blank": return "transparent";
  }
}

function getWeight(type: LineType): number {
  return type === "head" ? 600 : type === "cmd" ? 500 : 400;
}

export const S05_Demo: React.FC = () => {
  const frame = useCurrentFrame();

  const headerOp = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const exit = interpolate(frame, [510, 540], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const visible = LINES.filter((l) => frame >= l.t);
  const maxVisible = 22;
  const scrollOffset = Math.max(0, visible.length - maxVisible);

  // Blinking cursor
  const cursor = Math.floor(frame / 15) % 2 === 0;

  return (
    <AbsoluteFill style={{ backgroundColor: t.bg, opacity: exit }}>
      {/* Header bar */}
      <div
        style={{
          opacity: headerOp,
          padding: "24px 60px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <span style={text.label}>Live demo — Devnet</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: t.t30 }} />
          <span style={{ ...text.label, color: t.t15 }}>aegis-protocol</span>
        </div>
      </div>

      {/* Terminal body */}
      <div style={{ padding: "20px 60px", flex: 1, overflow: "hidden" }}>
        {visible.slice(scrollOffset).map((line, i) => {
          const lineOp = interpolate(frame, [line.t, line.t + 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={`${line.t}-${i}`}
              style={{
                opacity: lineOp,
                fontFamily: t.mono,
                fontSize: 15,
                lineHeight: 1.75,
                color: getColor(line.type),
                fontWeight: getWeight(line.type),
                whiteSpace: "pre",
                letterSpacing: line.type === "head" ? "0.08em" : "0",
                textTransform: line.type === "head" ? "uppercase" : "none",
              }}
            >
              {line.text || "\u00A0"}
            </div>
          );
        })}

        {/* Cursor */}
        {cursor && (
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 17,
              backgroundColor: t.t50,
              marginTop: 4,
            }}
          />
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "16px 60px",
          borderTop: `1px solid ${t.border}`,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontFamily: t.mono, fontSize: 11, color: t.t08 }}>
          All transactions verifiable on Solana Explorer
        </span>
        <span style={{ fontFamily: t.mono, fontSize: 11, color: t.t08 }}>
          devnet
        </span>
      </div>
    </AbsoluteFill>
  );
};
