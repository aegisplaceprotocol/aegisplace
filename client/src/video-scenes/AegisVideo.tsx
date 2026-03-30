import { AbsoluteFill, Sequence } from "remotion";
import { colors } from "./tokens";
import { Hero } from "./Hero";
import { Problem } from "./Problem";
import { Architecture } from "./Architecture";
import { LiveNetwork } from "./LiveNetwork";
import { Marketplace } from "./Marketplace";
import { Terminal } from "./Terminal";
import { TrustEngine } from "./TrustEngine";
import { Guardrails } from "./Guardrails";
import { Economics } from "./Economics";
import { Stats } from "./Stats";
import { CTA } from "./CTA";

/**
 * AEGIS PROTOCOL. V3
 *
 * 11 scenes, 56 seconds, 30fps = 1680 frames
 * MCPConnect removed. Frames redistributed.
 */
export const AegisVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{
      backgroundColor: colors.bg,
      fontFamily: "Aeonik, Outfit, system-ui, sans-serif",
    }}>
      <Sequence from={0} durationInFrames={150}><Hero /></Sequence>
      <Sequence from={150} durationInFrames={135}><Problem /></Sequence>
      <Sequence from={285} durationInFrames={165}><Architecture /></Sequence>
      <Sequence from={450} durationInFrames={150}><LiveNetwork /></Sequence>
      <Sequence from={600} durationInFrames={180}><Marketplace /></Sequence>
      <Sequence from={780} durationInFrames={240}><Terminal /></Sequence>
      <Sequence from={1020} durationInFrames={150}><TrustEngine /></Sequence>
      <Sequence from={1170} durationInFrames={135}><Guardrails /></Sequence>
      <Sequence from={1305} durationInFrames={165}><Economics /></Sequence>
      <Sequence from={1470} durationInFrames={120}><Stats /></Sequence>
      <Sequence from={1590} durationInFrames={90}><CTA /></Sequence>
    </AbsoluteFill>
  );
};
