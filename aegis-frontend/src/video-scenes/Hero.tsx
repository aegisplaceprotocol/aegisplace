import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import {
  colors as c,
  fonts as f,
  headline,
  body,
  AEGIS_ICON,
  sceneBase,
  container,
  prog,
  appear,
} from "./tokens";
import {
  SolanaLogo,
  NvidiaLogo,
  AnthropicLogo,
  OpenAILogo,
} from "./BrandLogos";

const CX = 960;
const CY = 380;
const RADIUS = 200;

const NODES = ["SOLANA", "NeMo", "MCP", "TRUST", "USDC", "x402"];

/** Scene 1: HERO. 5s (150 frames) */
export const Hero: React.FC = () => {
  const frame = useCurrentFrame();

  const exit = interpolate(frame, [138, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Shield fade + scale */
  const shieldOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shieldScale = interpolate(frame, [0, 20], [0.3, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Radiating rings */
  const rings = [8, 14, 20].map((start) => {
    const t = interpolate(frame, [start, start + 40], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return {
      scale: interpolate(t, [0, 1], [1, 5]),
      opacity: interpolate(t, [0, 1], [0.12, 0]),
    };
  });

  return (
    <AbsoluteFill style={{ ...sceneBase, opacity: exit }}>
      {/* Shield icon */}
      <div
        style={{
          position: "absolute",
          left: CX - 36,
          top: CY - 36,
          width: 72,
          height: 72,
          opacity: shieldOpacity,
          transform: `scale(${shieldScale})`,
        }}
      >
        <svg viewBox="0 0 3800 3800" width={72} height={72}>
          <path d={AEGIS_ICON} fill={c.text.primary} />
        </svg>
      </div>

      {/* Radiating rings */}
      {rings.map((ring, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: CX - 40,
            top: CY - 40,
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: `1px solid ${c.text.primary}`,
            opacity: ring.opacity,
            transform: `scale(${ring.scale})`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Orbital nodes */}
      <svg
        width={1920}
        height={1080}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {NODES.map((name, i) => {
          const startFrame = 22 + i * 3;
          const p = prog(frame, startFrame, startFrame + 10);
          const angle = (-90 + i * 60) * (Math.PI / 180);
          const ex = CX + Math.cos(angle) * RADIUS;
          const ey = CY + Math.sin(angle) * RADIUS;
          const labelX = CX + Math.cos(angle) * (RADIUS + 16);
          const labelY = CY + Math.sin(angle) * (RADIUS + 16);

          /* Animated line endpoint */
          const lx = CX + (ex - CX) * p;
          const ly = CY + (ey - CY) * p;

          return (
            <g key={name} opacity={p}>
              <line
                x1={CX}
                y1={CY}
                x2={lx}
                y2={ly}
                stroke={c.text.muted}
                strokeWidth={1}
                strokeDasharray="4 4"
                strokeDashoffset={-(frame * 0.5)}
              />
              <circle cx={ex} cy={ey} r={3} fill={c.text.primary} opacity={p} />
              <text
                x={labelX}
                y={labelY}
                fill={c.text.secondary}
                fontFamily="Aeonik, Outfit, system-ui, sans-serif"
                fontWeight={400}
                fontSize={11}
                textAnchor="middle"
                dominantBaseline="middle"
                letterSpacing="0.1em"
              >
                {name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Text overlay at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 140,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            ...headline,
            fontSize: 72,
            fontWeight: f.weight.regular,
            ...appear(frame, 30),
          }}
        >
          You build the tools.
        </div>
        <div
          style={{
            ...headline,
            fontSize: 72,
            fontWeight: f.weight.regular,
            marginTop: 8,
            ...appear(frame, 34),
          }}
        >
          AI agents pay to use them.
        </div>
        <div
          style={{
            ...body,
            fontSize: 18,
            fontWeight: f.weight.regular,
            marginTop: 24,
            maxWidth: 520,
            textAlign: "center",
            ...appear(frame, 40),
          }}
        >
          Aegis is a permissionless marketplace where AI agents discover,
          negotiate, and pay for operator skills on Solana. in real time.
        </div>
        <div
          style={{
            display: "flex",
            gap: 48,
            marginTop: 32,
            alignItems: "center",
            ...appear(frame, 46),
          }}
        >
          <SolanaLogo />
          <NvidiaLogo />
          <AnthropicLogo />
          <OpenAILogo />
        </div>
      </div>
    </AbsoluteFill>
  );
};
