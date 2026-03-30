import { useCallback, useMemo } from "react";
import { ParentSize } from "@visx/responsive";
import { Group } from "@visx/group";
import { AreaClosed, LinePath, Bar } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { scaleTime, scaleLinear } from "@visx/scale";
import { AxisBottom } from "@visx/axis";
import { LinearGradient } from "@visx/gradient";
import { GridRows } from "@visx/grid";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { bisector } from "d3-array";

interface DataPoint {
  date: Date;
  value: number;
}

interface Props {
  data: DataPoint[];
  height?: number;
  lineColor?: string;
  fillColorFrom?: string;
  fillColorTo?: string;
  gridColor?: string;
  axisColor?: string;
  tooltipBg?: string;
  tooltipBorder?: string;
  formatValue?: (v: number) => string;
  formatDate?: (d: Date) => string;
}

const margin = { top: 12, right: 12, bottom: 32, left: 12 };
const bisectDate = bisector<DataPoint, Date>((d) => d.date).left;

function ChartInner({
  data,
  width,
  height = 240,
  lineColor = "rgba(52,211,153,0.5)",
  fillColorFrom = "rgba(52,211,153,0.12)",
  fillColorTo = "rgba(52,211,153,0)",
  gridColor = "rgba(255,255,255,0.06)",
  axisColor = "rgba(255,255,255,0.25)",
  tooltipBg = "#0A0A0A",
  tooltipBorder = "rgba(255,255,255,0.06)",
  formatValue = (v) => `$${v.toLocaleString()}`,
  formatDate = (d) => d.toLocaleDateString("en", { month: "short", day: "numeric" }),
}: Props & { width: number }) {
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<DataPoint>();

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const xScale = useMemo(
    () =>
      scaleTime({
        range: [0, innerW],
        domain: [
          Math.min(...data.map((d) => d.date.getTime())),
          Math.max(...data.map((d) => d.date.getTime())),
        ],
      }),
    [data, innerW]
  );

  const yScale = useMemo(() => {
    const vals = data.map((d) => d.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min) * 0.12 || 1;
    return scaleLinear({ range: [innerH, 0], domain: [min - pad, max + pad] });
  }, [data, innerH]);

  const handleMouse = useCallback(
    (event: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>) => {
      const point = localPoint(event);
      if (!point) return;
      const x0 = xScale.invert(point.x - margin.left);
      const idx = bisectDate(data, x0, 1);
      const d0 = data[idx - 1];
      const d1 = data[idx];
      if (!d0) return;
      let d = d0;
      if (d1?.date) d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;
      showTooltip({
        tooltipData: d,
        tooltipLeft: xScale(d.date) + margin.left,
        tooltipTop: yScale(d.value) + margin.top,
      });
    },
    [data, xScale, yScale, showTooltip]
  );

  if (data.length < 2) return <div style={{ width, height }} />;

  return (
    <div style={{ position: "relative" }}>
      <svg width={width} height={height}>
        <LinearGradient id="premium-area-fill" from={fillColorFrom} to={fillColorTo} fromOpacity={1} toOpacity={0} />
        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={yScale}
            width={innerW}
            stroke={gridColor}
            strokeOpacity={1}
            numTicks={4}
          />
          <AreaClosed
            data={data}
            x={(d) => xScale(d.date)}
            y={(d) => yScale(d.value)}
            yScale={yScale}
            curve={curveMonotoneX}
            fill="url(#premium-area-fill)"
          />
          <LinePath
            data={data}
            x={(d) => xScale(d.date)}
            y={(d) => yScale(d.value)}
            curve={curveMonotoneX}
            stroke={lineColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <AxisBottom
            top={innerH}
            scale={xScale}
            numTicks={Math.min(5, data.length)}
            tickFormat={(d) => formatDate(d as Date)}
            stroke={gridColor}
            tickStroke={gridColor}
            tickLabelProps={{ fill: axisColor, fontSize: 10, textAnchor: "middle" as const, fontFamily: "inherit" }}
          />
          <Bar
            x={0}
            y={0}
            width={innerW}
            height={innerH}
            fill="transparent"
            onMouseMove={handleMouse}
            onTouchMove={handleMouse}
            onMouseLeave={hideTooltip}
          />
          {tooltipOpen && tooltipData && (
            <>
              <line
                x1={xScale(tooltipData.date)}
                y1={0}
                x2={xScale(tooltipData.date)}
                y2={innerH}
                stroke={lineColor}
                strokeOpacity={0.3}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <circle
                cx={xScale(tooltipData.date)}
                cy={yScale(tooltipData.value)}
                r={4.5}
                fill={lineColor}
                stroke={tooltipBg}
                strokeWidth={2.5}
              />
            </>
          )}
        </Group>
      </svg>
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={(tooltipTop ?? 0) - 48}
          style={{
            background: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            pointerEvents: "none" as const,
            fontFamily: "inherit",
          }}
        >
          <div style={{ fontWeight: 400, color: lineColor, fontVariantNumeric: "tabular-nums" }}>
            {formatValue(tooltipData.value)}
          </div>
          <div style={{ color: axisColor, marginTop: 2, fontSize: 10 }}>{formatDate(tooltipData.date)}</div>
        </TooltipWithBounds>
      )}
    </div>
  );
}

export function PremiumAreaChart(props: Props) {
  return (
    <ParentSize debounceTime={100}>
      {({ width }) => (width > 0 ? <ChartInner {...props} width={width} /> : null)}
    </ParentSize>
  );
}
