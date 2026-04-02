import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { colors as c, fonts as f, headline, body, label as labelStyle, FEE_SPLIT, sceneBase, container, appear, prog } from "./tokens";

const FONT = "Aeonik, Outfit, system-ui, sans-serif";

/* ── Layout constants ── */
const SVG_W = 1200, SVG_H = 480;
const CENTER_Y = SVG_H / 2;

const BOX_W = 184, BOX_H = 72;
const ARROW_W = 56;

const USDC_X = 24;
const JUP_X = USDC_X + BOX_W + ARROW_W;
const SPLIT_CX = JUP_X + BOX_W + ARROW_W + 24;
const SPLIT_R = 24;

/* Branches: text OUTSIDE bars to prevent overlap */
const PCT_W = 64;           // width reserved for "85%" text left of bar
const LABEL_W = 96;         // width reserved for "Creator" text right of bar
const BRANCH_X = SPLIT_CX + SPLIT_R + 48;           // where pct text starts
const BAR_X = BRANCH_X + PCT_W;                      // where bar starts
const BAR_MAX_W = SVG_W - BAR_X - LABEL_W - 48;     // max bar width (~430px)
const BAR_SCALE = BAR_MAX_W / 60;                    // scale so 60% fills max

const BAR_H = 40, BAR_GAP = 16;
const TOTAL_H = 6 * BAR_H + 5 * BAR_GAP;
const BRANCH_Y0 = CENTER_Y - TOTAL_H / 2;

/** Scene 10: ECONOMICS. 5s (150 frames) */
export const Economics: React.FC = () => {
  const frame = useCurrentFrame();
  const exit = interpolate(frame, [138, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dashOff = -frame * 1.2;

  return (
    <AbsoluteFill style={{ ...sceneBase, opacity: exit }}>
      <div style={{ ...container, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ ...appear(frame, 0), marginBottom: 24 }}>
          <div style={labelStyle}>Economics</div>
          <h2 style={{ ...headline, fontSize: 48, margin: 0, marginTop: 8 }}>
            Real yield from real usage.
          </h2>
        </div>

        <div style={{ ...appear(frame, 4), width: "100%", maxWidth: SVG_W }}>
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" height="auto" style={{ display: "block" }}>

            {/* ── USDC Box ── */}
            {(() => {
              const p = prog(frame, 6, 14);
              const bx = USDC_X, by = CENTER_Y - BOX_H / 2;
              return (
                <g opacity={p} transform={`translate(0,${(1 - p) * 8})`}>
                  <rect x={bx} y={by} width={BOX_W} height={BOX_H} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
                  <text x={bx + BOX_W / 2} y={CENTER_Y - 8} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={20} fill="rgba(255,255,255,0.90)">$1.00 USDC</text>
                  <text x={bx + BOX_W / 2} y={CENTER_Y + 16} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={11} fill="rgba(255,255,255,0.30)">Agent Payment</text>
                </g>
              );
            })()}

            {/* ── Arrow: USDC → Jupiter ── */}
            {(() => {
              const p = prog(frame, 14, 20);
              const x1 = USDC_X + BOX_W + 8, x2 = JUP_X - 8;
              return (
                <g opacity={p}>
                  <line x1={x1} y1={CENTER_Y} x2={x2} y2={CENTER_Y} stroke="rgba(255,255,255,0.06)" />
                  <line x1={x1} y1={CENTER_Y} x2={x2} y2={CENTER_Y} stroke="rgba(255,255,255,0.20)" strokeDasharray="4 6" strokeDashoffset={dashOff} />
                  <polygon points={`${x2 - 6},${CENTER_Y - 3} ${x2 - 6},${CENTER_Y + 3} ${x2},${CENTER_Y}`} fill="rgba(255,255,255,0.20)" />
                  <text x={(x1 + x2) / 2} y={CENTER_Y - 12} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={8} fill="rgba(255,255,255,0.15)" letterSpacing="0.1em">SWAP</text>
                </g>
              );
            })()}

            {/* ── Jupiter Box ── */}
            {(() => {
              const p = prog(frame, 18, 26);
              const bx = JUP_X, by = CENTER_Y - 40;
              return (
                <g opacity={p} transform={`translate(0,${(1 - p) * 8})`}>
                  <rect x={bx} y={by} width={BOX_W} height={80} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.10)" />
                  <text x={bx + BOX_W / 2} y={by + 20} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={9} fill="rgba(255,255,255,0.20)" letterSpacing="0.12em">JUPITER DEX</text>
                  <text x={bx + BOX_W / 2} y={by + 44} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={18} fill="rgba(255,255,255,0.90)">→ $AEGIS</text>
                  <text x={bx + BOX_W / 2} y={by + 64} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={11} fill="rgba(255,255,255,0.30)">Market Buy</text>
                </g>
              );
            })()}

            {/* ── Arrow: Jupiter → Splitter ── */}
            {(() => {
              const p = prog(frame, 24, 30);
              const x1 = JUP_X + BOX_W + 8, x2 = SPLIT_CX - SPLIT_R - 4;
              return (
                <g opacity={p}>
                  <line x1={x1} y1={CENTER_Y} x2={x2} y2={CENTER_Y} stroke="rgba(255,255,255,0.06)" />
                  <line x1={x1} y1={CENTER_Y} x2={x2} y2={CENTER_Y} stroke="rgba(255,255,255,0.20)" strokeDasharray="4 6" strokeDashoffset={dashOff} />
                  <polygon points={`${x2 - 4},${CENTER_Y - 3} ${x2 - 4},${CENTER_Y + 3} ${x2},${CENTER_Y}`} fill="rgba(255,255,255,0.20)" />
                </g>
              );
            })()}

            {/* ── Splitter Circle ── */}
            {(() => {
              const p = prog(frame, 28, 34);
              return (
                <g opacity={p}>
                  <circle cx={SPLIT_CX} cy={CENTER_Y} r={SPLIT_R} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.10)" />
                  <text x={SPLIT_CX} y={CENTER_Y + 4} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={9} fill="rgba(255,255,255,0.40)" letterSpacing="0.08em">SPLIT</text>
                </g>
              );
            })()}

            {/* ── 6 Branches: pct | bar | label ── */}
            {FEE_SPLIT.map((fee, i) => {
              const branchY = BRANCH_Y0 + i * (BAR_H + BAR_GAP);
              const midY = branchY + BAR_H / 2;
              const delay = 32 + i * 3;
              const p = prog(frame, delay, delay + 10);
              const barProg = prog(frame, delay + 4, delay + 14);
              const barW = fee.pct * BAR_SCALE;

              // Cubic bezier from splitter to bar row
              const cpX = SPLIT_CX + (BAR_X - SPLIT_CX) * 0.4;

              return (
                <g key={i} opacity={p}>
                  {/* Curved connector */}
                  <path
                    d={`M${SPLIT_CX + SPLIT_R},${CENTER_Y} C${cpX},${CENTER_Y} ${cpX},${midY} ${BAR_X},${midY}`}
                    fill="none" stroke="rgba(255,255,255,0.05)" />

                  {/* Percentage. left of bar, right-aligned in its column */}
                  <text x={BAR_X - 16} y={midY + 6} textAnchor="end"
                    fontFamily={FONT} fontWeight={400} fontSize={22}
                    fill={`rgba(255,255,255,${(0.60 - i * 0.08).toFixed(2)})`}>
                    {fee.pct}%
                  </text>

                  {/* Bar outline */}
                  <rect x={BAR_X} y={branchY} width={barW} height={BAR_H}
                    fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />

                  {/* Bar fill */}
                  <rect x={BAR_X} y={branchY} width={barW * barProg} height={BAR_H}
                    fill={`rgba(255,255,255,${(0.06 - i * 0.007).toFixed(3)})`} />

                  {/* Dollar amount. inside bar, right-aligned (only for wide bars) */}
                  {barW > 200 && (
                    <text x={BAR_X + barW - 16} y={midY + 5} textAnchor="end"
                      fontFamily={FONT} fontWeight={400} fontSize={13} fill="rgba(255,255,255,0.20)">
                      ${fee.dollar.toFixed(2)}
                    </text>
                  )}

                  {/* Label. right of bar */}
                  <text x={BAR_X + barW + 16} y={midY + 5}
                    fontFamily={FONT} fontWeight={400} fontSize={13} fill="rgba(255,255,255,0.30)">
                    {fee.label}
                  </text>
                </g>
              );
            })}

            {/* Bottom text */}
            {(() => {
              const p = prog(frame, 56, 64);
              return (
                <text x={SVG_W / 2} y={SVG_H - 8} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={10} fill="rgba(255,255,255,0.12)" opacity={p} letterSpacing="0.08em">
                  EVERY INVOCATION IS A FORCED BUY · 2% BURNED FOREVER · 55-65% SUPPLY LOCKED
                </text>
              );
            })()}

          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
