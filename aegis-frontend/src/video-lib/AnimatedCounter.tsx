import { useCurrentFrame } from "remotion";

/**
 * Animated number counter with easing.
 * Counts from `from` to `to` between startFrame and endFrame.
 */
interface AnimatedCounterProps {
  from?: number;
  to: number;
  startFrame?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: React.CSSProperties;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from: fromVal = 0,
  to,
  startFrame = 0,
  duration = 20,
  prefix = "",
  suffix = "",
  decimals = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const raw = Math.max(0, Math.min(1, (frame - startFrame) / duration));
  const progress = easeOutCubic(raw);
  const value = fromVal + (to - fromVal) * progress;

  return (
    <span style={style}>
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  );
};
