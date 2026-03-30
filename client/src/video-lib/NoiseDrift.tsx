import { AbsoluteFill, useCurrentFrame } from "remotion";

/**
 * Very subtle static grain overlay. no flickering.
 * Single seed, very fine grain, extremely low opacity.
 */
interface NoiseDriftProps {
  opacity?: number;
  speed?: number;
  scale?: number;
}

export const NoiseDrift: React.FC<NoiseDriftProps> = ({
  opacity = 0.018,
}) => {
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity, mixBlendMode: "screen" }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <filter id="noise-static">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75 0.75"
            numOctaves={4}
            seed={42}
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise-static)" />
      </svg>
    </AbsoluteFill>
  );
};
