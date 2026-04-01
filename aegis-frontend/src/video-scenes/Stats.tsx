import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { colors as c, fonts as f, label as labelStyle, sceneBase, container, appear, prog } from "./tokens";
import { NvidiaLogo, OpenAILogo, AnthropicLogo, SolanaLogo, StripeLogo, CoinbaseLogo, HuggingFaceLogo, MistralLogo, GoogleDeepMindLogo } from "./BrandLogos";

/** Scene 11: STATS + BRAND LOGOS. 3s (90 frames) */

const COUNTERS: { target: number; label: string; prefix: string; decimals?: number; suffix?: string }[] = [
  { target: 452, label: "Operators", prefix: "" },
  { target: 16, label: "MCP Tools", prefix: "" },
  { target: 0.02, label: "Avg Call", prefix: "$", decimals: 2 },
];

export const Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const exit = interpolate(frame, [78, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...sceneBase, opacity: exit }}>
      <div style={{ ...container, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* 4 counter stats */}
        <div style={{ display: "flex", gap: 64, justifyContent: "center", marginBottom: 48 }}>
          {COUNTERS.map((stat, i) => {
            const delay = 3 + i * 4;
            const p = prog(frame, delay, delay + 12);
            const current = stat.decimals
              ? parseFloat((p * stat.target).toFixed(stat.decimals))
              : Math.round(p * stat.target);
            const display = stat.decimals
              ? current.toFixed(stat.decimals)
              : String(current);

            return (
              <div key={i} style={{ textAlign: "center", ...appear(frame, delay) }}>
                <div style={{
                  fontFamily: f.family,
                  fontWeight: f.weight.light,
                  fontSize: 56,
                  color: c.text.primary,
                  letterSpacing: "-0.03em",
                }}>
                  {stat.prefix}{display}{stat.suffix || ""}
                </div>
                <div style={{
                  ...labelStyle,
                  fontSize: 11,
                  fontWeight: f.weight.regular,
                  marginTop: 8,
                }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Subtitle label */}
        <div style={{
          ...appear(frame, 30),
          marginBottom: 16,
          fontFamily: f.family,
          fontWeight: f.weight.regular,
          fontSize: 9,
          letterSpacing: "0.15em",
          textTransform: "uppercase" as const,
          color: "rgba(255,255,255,0.10)",
        }}>
          Skills on Aegis leverage the entire AI and blockchain stack
        </div>

        {/* Logo row */}
        <div style={{
          display: "flex",
          gap: 24,
          alignItems: "center",
          justifyContent: "center",
          ...appear(frame, 34),
        }}>
          <SolanaLogo />
          <NvidiaLogo />
          <OpenAILogo />
          <AnthropicLogo />
          <StripeLogo />
          <MistralLogo />
          <HuggingFaceLogo />
          <GoogleDeepMindLogo />
        </div>
      </div>
    </AbsoluteFill>
  );
};
