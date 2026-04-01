import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { colors as c, fonts as f, headline, label as labelStyle, sceneBase, container, appear, prog } from "./tokens";

const SVG_W = 1100, SVG_H = 480;
const CARD_W = 280, CARD_H = 170, CARD_GAP = 24;
const GRID_W = 2 * CARD_W + CARD_GAP; // 584
const GRID_H = 2 * CARD_H + CARD_GAP; // 364
const GRID_X = (SVG_W - GRID_W) / 2; // 258
const GRID_Y = (SVG_H - GRID_H) / 2; // 58

const CHECKS = [
  { title: "Content Safety", items: ["Toxic language", "Harmful intent", "Illegal content"] },
  { title: "Jailbreak Detection", items: ["Prompt injection", "Role override", "Context escape"] },
  { title: "PII Masking", items: ["Emails", "Phone numbers", "SSNs & API keys"] },
  { title: "Injection Guard", items: ["SQL injection", "XSS patterns", "Template injection"] },
];

const FONT = "Aeonik, Outfit, system-ui, sans-serif";

/** Scene 9: GUARDRAILS. 4s (120 frames). 2x2 check card grid pipeline */
export const Guardrails: React.FC = () => {
  const frame = useCurrentFrame();
  const exit = interpolate(frame, [108, 120], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const activeCheck = frame < 20 ? -1 : Math.min(3, Math.floor((frame - 20) / 14));

  // Card positions: [row][col]
  const cardPositions = [
    [{ x: GRID_X, y: GRID_Y }, { x: GRID_X + CARD_W + CARD_GAP, y: GRID_Y }],
    [{ x: GRID_X, y: GRID_Y + CARD_H + CARD_GAP }, { x: GRID_X + CARD_W + CARD_GAP, y: GRID_Y + CARD_H + CARD_GAP }],
  ];

  const flatCards = [cardPositions[0][0], cardPositions[0][1], cardPositions[1][0], cardPositions[1][1]];

  // Arrows between cards
  const col1CenterX = GRID_X + CARD_W;
  const col2LeftX = GRID_X + CARD_W + CARD_GAP;
  const row1MidY = GRID_Y + CARD_H;
  const row2TopY = GRID_Y + CARD_H + CARD_GAP;
  const col1MidX = GRID_X + CARD_W / 2;
  const col2MidX = GRID_X + CARD_W + CARD_GAP + CARD_W / 2;

  return (
    <AbsoluteFill style={{ ...sceneBase, opacity: exit }}>
      <div style={{ ...container, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Header */}
        <div style={{ ...appear(frame, 0) }}>
          <span style={labelStyle}>Safety</span>
          <h2 style={{ ...headline, fontSize: 48, margin: 0, marginTop: 8, marginBottom: 24 }}>
            Every call. Checked.
          </h2>
        </div>

        {/* SVG Diagram */}
        <div style={{ ...appear(frame, 6), width: "100%", maxWidth: 1100 }}>
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" height="auto" style={{ display: "block" }}>
            {/* Input box */}
            {(() => {
              const bx = 40, by = (SVG_H - 56) / 2, bw = 120, bh = 56;
              const p = prog(frame, 6, 14);
              return (
                <g opacity={p}>
                  <rect x={bx} y={by} width={bw} height={bh} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
                  <text x={bx + bw / 2} y={by + 22} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={14} fill="rgba(255,255,255,0.90)">Request</text>
                  <text x={bx + bw / 2} y={by + 40} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={10} fill="rgba(255,255,255,0.40)">Agent payload</text>
                </g>
              );
            })()}

            {/* Arrow: Input → Grid */}
            {(() => {
              const p = prog(frame, 12, 18);
              return (
                <g opacity={p}>
                  <line x1={160} y1={240} x2={GRID_X - 8} y2={240} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                  <polygon points={`${GRID_X - 8},236 ${GRID_X - 8},244 ${GRID_X},240`} fill="rgba(255,255,255,0.15)" />
                </g>
              );
            })()}

            {/* 2x2 Grid of Check Cards */}
            {CHECKS.map((check, i) => {
              const pos = flatCards[i];
              const cardDelay = 16 + i * 4;
              const p = prog(frame, cardDelay, cardDelay + 8);
              const isActive = activeCheck === i;
              const pulse = isActive ? 0.10 + 0.06 * Math.sin(frame * 0.3) : 0.06;
              const num = String(i + 1).padStart(2, "0");

              return (
                <g key={i} opacity={p} transform={`translate(0, ${(1 - p) * 8})`}>
                  {/* Card background */}
                  <rect
                    x={pos.x} y={pos.y}
                    width={CARD_W} height={CARD_H}
                    fill="rgba(255,255,255,0.02)"
                    stroke={`rgba(255,255,255,${pulse.toFixed(3)})`}
                    strokeWidth={isActive ? 1.5 : 1}
                  />

                  {/* Title */}
                  <text x={pos.x + 20} y={pos.y + 30} fontFamily={FONT} fontWeight={400} fontSize={13} fill="rgba(255,255,255,0.90)">
                    {check.title}
                  </text>

                  {/* Big number */}
                  <text x={pos.x + CARD_W - 20} y={pos.y + 32} textAnchor="end" fontFamily={FONT} fontWeight={400} fontSize={22} fill="rgba(255,255,255,0.06)">
                    {num}
                  </text>

                  {/* Sub-items */}
                  {check.items.map((item, j) => {
                    const itemY = pos.y + 52 + j * 32;
                    const itemDone = isActive ? (frame - 20 - i * 14) > (j + 1) * 4 : activeCheck > i;
                    const itemActive = isActive && !itemDone;

                    return (
                      <g key={j}>
                        {/* Checkmark or dot */}
                        {itemDone ? (
                          <text x={pos.x + 20} y={itemY + 12} fontFamily={FONT} fontWeight={400} fontSize={12} fill="rgba(255,255,255,0.50)">
                            ✓
                          </text>
                        ) : (
                          <circle cx={pos.x + 24} cy={itemY + 8} r={3} fill={itemActive ? "rgba(255,255,255,0.40)" : "rgba(255,255,255,0.12)"} />
                        )}

                        {/* Item text */}
                        <text x={pos.x + 40} y={itemY + 12} fontFamily={FONT} fontWeight={400} fontSize={11} fill={itemDone ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.30)"}>
                          {item}
                        </text>

                        {/* PASS label */}
                        {itemDone && (
                          <text x={pos.x + CARD_W - 20} y={itemY + 12} textAnchor="end" fontFamily={FONT} fontWeight={400} fontSize={9} fill="rgba(255,255,255,0.30)" letterSpacing="0.08em">
                            PASS
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Horizontal arrows: col1 → col2 at row midpoints */}
            {[0, 1].map((row) => {
              const y = GRID_Y + row * (CARD_H + CARD_GAP) + CARD_H / 2;
              const p = prog(frame, 28, 34);
              return (
                <g key={`harrow-${row}`} opacity={p}>
                  <line x1={col1CenterX} y1={y} x2={col2LeftX} y2={y} stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
                  <polygon points={`${col2LeftX - 4},${y - 3} ${col2LeftX - 4},${y + 3} ${col2LeftX},${y}`} fill="rgba(255,255,255,0.10)" />
                </g>
              );
            })}

            {/* Vertical arrows: row1 → row2 at column midpoints */}
            {[0, 1].map((col) => {
              const x = col === 0 ? col1MidX : col2MidX;
              const p = prog(frame, 30, 36);
              return (
                <g key={`varrow-${col}`} opacity={p}>
                  <line x1={x} y1={row1MidY} x2={x} y2={row2TopY} stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
                  <polygon points={`${x - 3},${row2TopY - 4} ${x + 3},${row2TopY - 4} ${x},${row2TopY}`} fill="rgba(255,255,255,0.10)" />
                </g>
              );
            })}

            {/* Arrow: Grid → Output */}
            {(() => {
              const gridRight = GRID_X + GRID_W;
              const outX = gridRight + 36;
              const p = prog(frame, 70, 78);
              return (
                <g opacity={p}>
                  <line x1={gridRight} y1={240} x2={outX} y2={240} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                  <polygon points={`${outX - 4},236 ${outX - 4},244 ${outX},240`} fill="rgba(255,255,255,0.15)" />
                </g>
              );
            })()}

            {/* Output box */}
            {(() => {
              const ox = GRID_X + GRID_W + 36, oy = 212, ow = 140, oh = 56;
              const allDone = activeCheck >= 3 && frame > 72;
              const p = prog(frame, 74, 82);
              return (
                <g opacity={p}>
                  <rect x={ox} y={oy} width={ow} height={oh} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
                  <text x={ox + ow / 2} y={oy + 22} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={13} fill="rgba(255,255,255,0.90)">Safe Response</text>
                  <text x={ox + ow / 2} y={oy + 40} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={10} fill={allDone ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.25)"}>
                    {allDone ? "4/4 passed" : "Checking…"}
                  </text>
                </g>
              );
            })()}

            {/* Footer */}
            {(() => {
              const p = prog(frame, 84, 92);
              return (
                <text x={SVG_W / 2} y={SVG_H - 12} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={11} fill="rgba(255,255,255,0.15)" opacity={p} letterSpacing="0.06em">
                  Powered by NVIDIA NeMo Guardrails · 4 safety checks per invocation
                </text>
              );
            })()}
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
