import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import {
  colors as c,
  fonts as f,
  headline,
  label as labelStyle,
  sceneBase,
  container,
  appear,
  prog,
} from "./tokens";

const FEED = [
  { op: "jupiter-ultra-swap", caller: "agent-7f3a", amount: 0.05, latency: "47ms", rep: 94, status: "settled" },
  { op: "aegis-prime-46", caller: "bot-c91e", amount: 0.12, latency: "1.2s", rep: 92, status: "settled" },
  { op: "firecrawl", caller: "agent-2d8b", amount: 0.03, latency: "89ms", rep: 95, status: "settled" },
  { op: "helius-rpc", caller: "svc-f4a2", amount: 0.25, latency: "23ms", rep: 91, status: "validating" },
  { op: "birdeye-analytics", caller: "agent-e6c1", amount: 0.08, latency: "412ms", rep: 87, status: "settled" },
  { op: "whisper-stt", caller: "bot-a3f9", amount: 0.02, latency: "890ms", rep: 93, status: "settled" },
  { op: "deepseek-v3", caller: "agent-7f3a", amount: 0.15, latency: "1.1s", rep: 89, status: "settled" },
  { op: "qwen-25-coder", caller: "svc-f4a2", amount: 0.09, latency: "670ms", rep: 90, status: "settled" },
];

const SVG_FONT = "Aeonik, Outfit, system-ui, sans-serif";
const CX = 200;
const CY = 200;

function ringPoint(i: number, count: number, radius: number, offsetDeg = 0): [number, number] {
  const angle = ((i * 360) / count + offsetDeg - 90) * (Math.PI / 180);
  return [CX + Math.cos(angle) * radius, CY + Math.sin(angle) * radius];
}

const COL_TEMPLATE = "1fr 72px 56px 64px";
const HEADERS = ["Operator", "Amount", "Score", "Status"];

/** Scene 4: LIVE NETWORK. 5s (150 frames) */
export const LiveNetwork: React.FC = () => {
  const frame = useCurrentFrame();
  const exit = interpolate(frame, [138, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const volProg = prog(frame, 6, 60);
  const volume = Math.floor(volProg * 43200);
  const volStr = volume.toLocaleString();

  // Node positions
  const inner = Array.from({ length: 6 }, (_, i) => ringPoint(i, 6, 80));
  const middle = Array.from({ length: 6 }, (_, i) => ringPoint(i, 6, 150, 30));
  const outer = Array.from({ length: 6 }, (_, i) => ringPoint(i, 6, 200));

  // Edges: inner hex + inner-middle + middle-outer
  const edges: Array<[[number, number], [number, number]]> = [];
  for (let i = 0; i < 6; i++) {
    edges.push([inner[i], inner[(i + 1) % 6]]);
    edges.push([inner[i], middle[i]]);
    edges.push([inner[i], middle[(i + 1) % 6]]);
    edges.push([middle[i], outer[i]]);
  }

  const innerLabels = FEED.slice(0, 6).map((d) => d.op.slice(0, 8));
  const middleLabels = FEED.slice(6).map((d) => d.op.slice(0, 8));

  const radarProg = prog(frame, 4, 30);

  return (
    <AbsoluteFill style={{ ...sceneBase, opacity: exit }}>
      <div
        style={{
          ...container,
          textAlign: "left" as const,
          display: "flex",
          gap: 48,
          alignItems: "flex-start",
        }}
      >
        {/* LEFT: Network graph */}
        <div style={{ flexShrink: 0, ...appear(frame, 2) }}>
          <svg width={400} height={420} viewBox="0 0 400 420">
            {/* Edges */}
            {edges.map(([a, b], i) => {
              const edgeAppear = prog(frame, 4 + i * 0.5, 14 + i * 0.5);
              const pulseProg = ((frame * 0.02 + i * 0.3) % 1);
              const px = a[0] + (b[0] - a[0]) * pulseProg;
              const py = a[1] + (b[1] - a[1]) * pulseProg;
              return (
                <g key={`e${i}`} opacity={edgeAppear}>
                  <line
                    x1={a[0]}
                    y1={a[1]}
                    x2={b[0]}
                    y2={b[1]}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={0.5}
                  />
                  {edgeAppear > 0.5 && (
                    <circle
                      cx={px}
                      cy={py}
                      r={1.5}
                      fill="rgba(255,255,255,0.30)"
                    />
                  )}
                </g>
              );
            })}

            {/* Inner ring nodes */}
            {inner.map(([x, y], i) => {
              const appeared = prog(frame, 6 + i * 2, 14 + i * 2) > 0;
              const active = i < FEED.length && appeared;
              const nodeOpacity = prog(frame, 6 + i * 2, 14 + i * 2);
              return (
                <g key={`in${i}`} opacity={nodeOpacity}>
                  {active && (
                    <circle
                      cx={x}
                      cy={y}
                      r={8}
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={0.5}
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={4}
                    fill={active ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.15)"}
                  />
                  <text
                    x={x}
                    y={y + 14}
                    textAnchor="middle"
                    fontFamily={SVG_FONT}
                    fontWeight={400}
                    fontSize={7}
                    fill="rgba(255,255,255,0.30)"
                  >
                    {innerLabels[i]}
                  </text>
                </g>
              );
            })}

            {/* Middle ring nodes */}
            {middle.map(([x, y], i) => {
              const nodeOpacity = prog(frame, 10 + i * 2, 18 + i * 2);
              const feedIdx = 6 + i;
              const appeared = nodeOpacity > 0;
              const active = feedIdx < FEED.length && appeared;
              return (
                <g key={`mid${i}`} opacity={nodeOpacity}>
                  {active && (
                    <circle
                      cx={x}
                      cy={y}
                      r={6}
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth={0.5}
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={3}
                    fill={active ? "rgba(255,255,255,0.40)" : "rgba(255,255,255,0.10)"}
                  />
                  {middleLabels[i] && (
                    <text
                      x={x}
                      y={y + 12}
                      textAnchor="middle"
                      fontFamily={SVG_FONT}
                      fontWeight={400}
                      fontSize={6}
                      fill="rgba(255,255,255,0.20)"
                    >
                      {middleLabels[i]}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Outer ring nodes */}
            {outer.map(([x, y], i) => {
              const nodeOpacity = prog(frame, 14 + i * 2, 22 + i * 2);
              const appeared = nodeOpacity > 0;
              const active = i < FEED.length && appeared;
              return (
                <g key={`out${i}`} opacity={nodeOpacity}>
                  {active && (
                    <circle
                      cx={x}
                      cy={y}
                      r={5}
                      fill="none"
                      stroke="rgba(255,255,255,0.04)"
                      strokeWidth={0.5}
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={2}
                    fill={active ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.08)"}
                  />
                </g>
              );
            })}

            {/* Bottom label */}
            <text
              x={CX}
              y={400}
              textAnchor="middle"
              fontFamily={SVG_FONT}
              fontWeight={700}
              fontSize={9}
              fill="rgba(255,255,255,0.15)"
              letterSpacing="0.1em"
              opacity={radarProg}
            >
              NETWORK TOPOLOGY
            </text>
          </svg>
        </div>

        {/* RIGHT: Live feed table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 24,
            }}
          >
            <div style={appear(frame, 2)}>
              <span style={labelStyle}>Live Feed</span>
              <h2 style={{ ...headline, fontSize: 44, margin: 0, marginTop: 4 }}>
                Live Network
              </h2>
            </div>
            <div style={appear(frame, 6)}>
              <span
                style={{
                  fontFamily: f.family,
                  fontWeight: 400,
                  fontSize: 28,
                  color: c.text.primary,
                  letterSpacing: "-0.02em",
                }}
              >
                {volStr}
              </span>
              <span
                style={{
                  ...labelStyle,
                  fontSize: 10,
                  marginLeft: 8,
                }}
              >
                calls today
              </span>
            </div>
          </div>

          {/* Table */}
          <div
            style={{
              border: `1px solid ${c.border}`,
              width: "100%",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: COL_TEMPLATE,
                padding: "8px 16px",
                borderBottom: `1px solid ${c.border}`,
                background: c.surface,
              }}
            >
              {HEADERS.map((h) => (
                <span
                  key={h}
                  style={{
                    ...labelStyle,
                    fontSize: 9,
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Data rows */}
            {FEED.map((row, i) => {
              const entrance = appear(frame, 12 + i * 5);
              const isValidating = row.status === "validating";
              const dotOpacity = isValidating
                ? 0.3 + 0.7 * Math.abs(Math.sin(frame * 0.08 + i))
                : 1;

              return (
                <div
                  key={row.op}
                  style={{
                    ...entrance,
                    display: "grid",
                    gridTemplateColumns: COL_TEMPLATE,
                    padding: "8px 16px",
                    borderBottom:
                      i < FEED.length - 1
                        ? `1px solid ${c.border}`
                        : "none",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: f.family,
                      fontWeight: 400,
                      fontSize: 13,
                      color: c.text.primary,
                    }}
                  >
                    {row.op}
                  </span>
                  <span
                    style={{
                      fontFamily: f.family,
                      fontWeight: 400,
                      fontSize: 12,
                      color: c.text.secondary,
                    }}
                  >
                    {row.amount} SOL
                  </span>
                  <span
                    style={{
                      fontFamily: f.family,
                      fontWeight: 400,
                      fontSize: 12,
                      color: c.text.secondary,
                    }}
                  >
                    {row.rep}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: isValidating
                          ? c.text.muted
                          : c.text.secondary,
                        opacity: dotOpacity,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: f.family,
                        fontWeight: 400,
                        fontSize: 10,
                        color: c.text.muted,
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {row.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ ...appear(frame, 50), marginTop: 16 }}>
            <span
              style={{
                ...labelStyle,
                fontSize: 10,
              }}
            >
              452 operators &middot; 16 MCP tools &middot; Solana devnet
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
