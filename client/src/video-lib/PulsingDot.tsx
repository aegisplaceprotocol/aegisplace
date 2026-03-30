import { useCurrentFrame } from "remotion";

/**
 * A small circle that continuously pulses opacity and scale.
 * Monochrome, subtle.
 */
interface PulsingDotProps {
  size?: number;
  baseOpacity?: number;
  amplitude?: number;
  speed?: number;
  phase?: number;
  color?: string;
  style?: React.CSSProperties;
}

export const PulsingDot: React.FC<PulsingDotProps> = ({
  size = 6,
  baseOpacity = 0.5,
  amplitude = 0.3,
  speed = 0.1,
  phase = 0,
  color = "white",
  style,
}) => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame * speed + phase);
  const opacity = baseOpacity + pulse * amplitude;
  const scale = 1 + pulse * 0.15;

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      backgroundColor: color,
      opacity,
      transform: `scale(${scale})`,
      ...style,
    }} />
  );
};
