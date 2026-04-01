import { AbsoluteFill, useCurrentFrame } from "remotion";

/**
 * Floating monochrome particles that drift slowly.
 * Seeded positions so they're deterministic across renders.
 */
interface ParticleBackgroundProps {
  count?: number;
  speed?: number;
  opacity?: number;
  maxSize?: number;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  count = 20,
  speed = 0.3,
  opacity = 0.025,
  maxSize = 2,
}) => {
  const frame = useCurrentFrame();

  const particles = Array.from({ length: count }, (_, i) => {
    const sx = seededRandom(i * 2) * 1920;
    const sy = seededRandom(i * 2 + 1) * 1080;
    const size = 0.8 + seededRandom(i * 3) * (maxSize - 0.8);
    const phaseX = seededRandom(i * 4) * Math.PI * 2;
    const phaseY = seededRandom(i * 5) * Math.PI * 2;
    const drift = 0.5 + seededRandom(i * 6) * 0.5;

    const x = sx + Math.sin(frame * speed * 0.02 + phaseX) * 20 * drift;
    const y = sy + Math.cos(frame * speed * 0.015 + phaseY) * 14 * drift - frame * speed * 0.1;
    const wrappedY = ((y % 1080) + 1080) % 1080;
    const particleOpacity = opacity * (0.4 + seededRandom(i * 7) * 0.6);

    return { x, y: wrappedY, size, opacity: particleOpacity, key: i };
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        {particles.map((p) => (
          <circle
            key={p.key}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill="white"
            opacity={p.opacity}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
