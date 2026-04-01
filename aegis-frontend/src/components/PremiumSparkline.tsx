import { AreaClosed, LinePath } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { scaleLinear } from "@visx/scale";
import { LinearGradient } from "@visx/gradient";

interface Props {
  data: number[];
  width?: number;
  height?: number;
  lineColor?: string;
  fillFrom?: string;
  fillTo?: string;
  id: string;
  showEndDot?: boolean;
}

export function PremiumSparkline({
  data,
  width = 80,
  height = 28,
  lineColor,
  fillFrom,
  fillTo,
  id,
  showEndDot = true,
}: Props) {
  if (!data || data.length < 2) {
    return <div style={{ width, height, borderRadius: 4, background: "rgba(255,255,255,0.03)" }} />;
  }

  // Auto-detect trend direction
  const trend = data[data.length - 1] - data[0];
  const color = lineColor || (trend >= 0 ? "rgba(52,211,153,0.6)" : "rgba(239,68,68,0.6)");
  const from = fillFrom || (trend >= 0 ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)");
  const to = fillTo || "transparent";

  const xScale = scaleLinear({ domain: [0, data.length - 1], range: [0, width] });
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = (max - min) * 0.15 || 1;
  const yScale = scaleLinear({ domain: [min - pad, max + pad], range: [height - 2, 2] });
  const points = data.map((v, i) => ({ x: i, y: v }));

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <LinearGradient id={id} from={from} to={to} fromOpacity={1} toOpacity={0} />
      <AreaClosed
        data={points}
        x={(d) => xScale(d.x)}
        y={(d) => yScale(d.y)}
        yScale={yScale}
        curve={curveMonotoneX}
        fill={`url(#${id})`}
      />
      <LinePath
        data={points}
        x={(d) => xScale(d.x)}
        y={(d) => yScale(d.y)}
        curve={curveMonotoneX}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {showEndDot && (
        <circle
          cx={xScale(data.length - 1)}
          cy={yScale(data[data.length - 1])}
          r={2}
          fill={color}
        />
      )}
    </svg>
  );
}
