import { AbsoluteFill, Sequence } from "remotion";
import { t } from "./theme";
import { S01_Open } from "./scenes/S01_Open";
import { S02_Problem } from "./scenes/S02_Problem";
import { S03_HowItWorks } from "./scenes/S03_HowItWorks";
import { S04_Code } from "./scenes/S04_Code";
import { S05_Demo } from "./scenes/S05_Demo";
import { S06_Close } from "./scenes/S06_Close";

/**
 * AEGIS PROTOCOL — Hackathon Demo
 *
 * 55 seconds @ 30fps = 1650 frames
 *
 * The whole video is typography + code.
 * No icons, no emojis, no gradients, no color.
 * White on black. Information density. Swiss grid.
 */
export const AegisDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: t.bg, fontFamily: t.font }}>
      {/* S01: cold open — 3.5s */}
      <Sequence from={0} durationInFrames={105}>
        <S01_Open />
      </Sequence>

      {/* S02: the problem — 5s */}
      <Sequence from={105} durationInFrames={150}>
        <S02_Problem />
      </Sequence>

      {/* S03: how aegis works — 7s */}
      <Sequence from={255} durationInFrames={210}>
        <S03_HowItWorks />
      </Sequence>

      {/* S04: the actual code — 12s */}
      <Sequence from={465} durationInFrames={360}>
        <S04_Code />
      </Sequence>

      {/* S05: live terminal demo — 18s */}
      <Sequence from={825} durationInFrames={540}>
        <S05_Demo />
      </Sequence>

      {/* S06: close — 6s */}
      <Sequence from={1365} durationInFrames={285}>
        <S06_Close />
      </Sequence>
    </AbsoluteFill>
  );
};
