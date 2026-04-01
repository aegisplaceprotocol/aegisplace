import { useCurrentFrame } from "remotion";

/**
 * Animated arrow with flowing dashes. Horizontal or vertical.
 * Pure monochrome, subtle.
 */
interface FlowArrowProps {
  label?: string;
  direction?: "right" | "down";
  length?: number;
  opacity?: number;
  speed?: number;
  labelStyle?: React.CSSProperties;
}

export const FlowArrow: React.FC<FlowArrowProps> = ({
  label,
  direction = "right",
  length = 60,
  opacity = 1,
  speed = 0.8,
  labelStyle,
}) => {
  const frame = useCurrentFrame();
  const dashOffset = -(frame * speed);
  const isHorizontal = direction === "right";

  const defaultLabelStyle: React.CSSProperties = {
    fontFamily: "Aeonik, system-ui, sans-serif",
    fontWeight: 400,
    fontSize: 9,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.15)",
    ...labelStyle,
  };

  if (isHorizontal) {
    const arrowLen = length - 8;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity }}>
        {label && <span style={defaultLabelStyle}>{label}</span>}
        <svg width={length} height={12} viewBox={`0 0 ${length} 12`} fill="none">
          <line x1={0} y1={6} x2={arrowLen} y2={6} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
          <line x1={0} y1={6} x2={arrowLen} y2={6} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="4 8" strokeDashoffset={dashOffset} />
          <polygon points={`${arrowLen},3 ${arrowLen},9 ${arrowLen + 6},6`} fill="rgba(255,255,255,0.20)" />
        </svg>
      </div>
    );
  }

  const arrowLen = length - 8;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity }}>
      <svg width={12} height={length} viewBox={`0 0 12 ${length}`} fill="none">
        <line x1={6} y1={0} x2={6} y2={arrowLen} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        <line x1={6} y1={0} x2={6} y2={arrowLen} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="4 8" strokeDashoffset={dashOffset} />
        <polygon points={`3,${arrowLen} 9,${arrowLen} 6,${arrowLen + 6}`} fill="rgba(255,255,255,0.20)" />
      </svg>
      {label && <span style={{ ...defaultLabelStyle, marginTop: 4 }}>{label}</span>}
    </div>
  );
};
