import { useCurrentFrame } from "remotion";

/**
 * A subtle gradient shimmer that sweeps across a container.
 * Absolute positioned. parent must be position: relative.
 */
interface ShimmerSweepProps {
  startFrame?: number;
  duration?: number;
  width?: number;
  opacity?: number;
  repeat?: boolean;
  repeatInterval?: number;
}

export const ShimmerSweep: React.FC<ShimmerSweepProps> = ({
  startFrame = 0,
  duration = 20,
  width = 80,
  opacity = 0.14,
  repeat = false,
  repeatInterval = 60,
}) => {
  const frame = useCurrentFrame();

  let progress: number;
  if (repeat) {
    const cycleFrame = (frame - startFrame) % repeatInterval;
    progress = cycleFrame >= 0 && cycleFrame < duration
      ? cycleFrame / duration
      : -1;
  } else {
    const elapsed = frame - startFrame;
    progress = elapsed >= 0 && elapsed < duration
      ? elapsed / duration
      : -1;
  }

  if (progress < 0) return null;

  const left = `${progress * 100}%`;

  return (
    <div style={{
      position: "absolute",
      top: 0,
      left,
      width,
      height: "100%",
      background: `linear-gradient(90deg, transparent, rgba(255,255,255,${opacity}), transparent)`,
      pointerEvents: "none",
    }} />
  );
};
