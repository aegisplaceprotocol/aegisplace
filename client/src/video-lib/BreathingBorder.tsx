import { useCurrentFrame } from "remotion";

/**
 * Container with border that subtly pulses opacity.
 * Monochrome breathing effect.
 */
interface BreathingBorderProps {
  baseOpacity?: number;
  amplitude?: number;
  speed?: number;
  phase?: number;
  background?: string;
  padding?: string | number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const BreathingBorder: React.FC<BreathingBorderProps> = ({
  baseOpacity = 0.08,
  amplitude = 0.06,
  speed = 0.06,
  phase = 0,
  background = "rgba(255,255,255,0.01)",
  padding = 0,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const borderOpacity = baseOpacity + Math.sin(frame * speed + phase) * amplitude;

  return (
    <div style={{
      border: `1px solid rgba(255,255,255,${borderOpacity.toFixed(4)})`,
      background,
      padding,
      ...style,
    }}>
      {children}
    </div>
  );
};
