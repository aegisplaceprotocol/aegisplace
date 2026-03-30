import { useCurrentFrame, spring, useVideoConfig } from "remotion";

/**
 * Spring-based entrance animation wrapper.
 * Applies scale + opacity with configurable spring physics.
 */
interface SpringEntranceProps {
  delay?: number;
  damping?: number;
  mass?: number;
  stiffness?: number;
  from?: "bottom" | "left" | "right" | "scale";
  distance?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const SpringEntrance: React.FC<SpringEntranceProps> = ({
  delay = 0,
  damping = 14,
  mass = 0.8,
  stiffness = 120,
  from = "bottom",
  distance = 16,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping, mass, stiffness },
  });

  let transform: string;
  switch (from) {
    case "bottom":
      transform = `translateY(${(1 - progress) * distance}px)`;
      break;
    case "left":
      transform = `translateX(${(progress - 1) * distance}px)`;
      break;
    case "right":
      transform = `translateX(${(1 - progress) * distance}px)`;
      break;
    case "scale":
      transform = `scale(${0.9 + progress * 0.1})`;
      break;
  }

  return (
    <div style={{
      opacity: progress,
      transform,
      ...style,
    }}>
      {children}
    </div>
  );
};
