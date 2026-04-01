/**
 * PremiumAreaChart. Swiss minimal area chart
 *
 * Clean gridlines, thin stroke, subtle fill, proper Y-axis labels.
 * Looks like a Bloomberg terminal, not a DeFi dashboard.
 */
import { useCallback, useMemo } from "react";
import { ParentSize } from "@visx/responsive";
import { Group } from "@visx/group";
import { AreaClosed, LinePath, Bar } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { scaleTime, scaleLinear } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
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
  showYAxis?: boolean;
}

const bisectDate = bisector<DataPoint, Date>((d) => d.date).left;

function ChartInner({
  data,
  width,
  height = 220,
  lineColor = "rgba(52,211,153,0.40)",
  fillColorFrom = "rgba(52,211,153,0.10)",
  fillColorTo = "rgba(16,185,129,0)",
  gridColor = "rgba(255,255,255,0.04)",
  axisColor = "rgba(255,255,255,0.18)",
  tooltipBg = "#111113",
  tooltipBorder = "rgba(255,255,255,0.06)",
  formatValue = (v) => `$${v.toLocaleString()}`,
  formatDate = (d) => d.toLocaleDateString("en", { month: "short", day: "numeric" }),
  showYAxis = true,
}: Props & { width: number }) {
  const margin = useMemo(() => ({
    top: 8, right: 12, bottom: 28, left: showYAxis ? 52 : 12,
  }), [showYAxis]);

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
    const pad = (max - min) * 0.1 || 1;
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
    [data, xScale, yScale, margin.left, showTooltip]
  );

  if (data.length < 2) return <div style={{ width, height }} />;

  const tickLabelStyle = {
    fill: axisColor,
    fontSize: 9,
    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
    fontWeight: 300 as const,
  };

  return (
    <div style={{ position: "relative" }}>
      <svg width={width} height={height}>
        <LinearGradient id="chart-area-fill" from={fillColorFrom} to={fillColorTo} fromOpacity={1} toOpacity={0} />
        <Group left={margin.left} top={margin.top}>
          {/* Grid. subtle horizontal lines */}
          <GridRows
            scale={yScale}
            width={innerW}
            stroke={gridColor}
            strokeOpacity={1}
            numTicks={5}
            strokeDasharray="2,3"
          />

          {/* Area fill. barely visible */}
          <AreaClosed
            data={data}
            x={(d) => xScale(d.date)}
            y={(d) => yScale(d.value)}
            yScale={yScale}
            curve={curveMonotoneX}
            fill="url(#chart-area-fill)"
          />

          {/* Line. thin and precise */}
          <LinePath
            data={data}
            x={(d) => xScale(d.date)}
            y={(d) => yScale(d.value)}
            curve={curveMonotoneX}
            stroke={lineColor}
            strokeWidth={1.2}
          />

          {/* Y-axis with value labels */}
          {showYAxis && (
            <AxisLeft
              scale={yScale}
              numTicks={5}
              stroke="transparent"
              tickStroke="transparent"
              tickLabelProps={() => ({
                ...tickLabelStyle,
                textAnchor: "end" as const,
                dx: -8,
                dy: 3,
              })}
              tickFormat={(v) => {
                const n = v as number;
                if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
                if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
                return `$${n.toFixed(0)}`;
              }}
            />
          )}

          {/* X-axis. dates */}
          <AxisBottom
            top={innerH}
            scale={xScale}
            numTicks={Math.min(6, data.length)}
            tickFormat={(d) => formatDate(d as Date)}
            stroke="transparent"
            tickStroke="transparent"
            tickLabelProps={() => ({
              ...tickLabelStyle,
              textAnchor: "middle" as const,
              dy: 4,
            })}
          />

          {/* Baseline */}
          <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke={gridColor} />

          {/* Hover target */}
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

          {/* Tooltip crosshair */}
          {tooltipOpen && tooltipData && (
            <>
              <line
                x1={xScale(tooltipData.date)}
                y1={0}
                x2={xScale(tooltipData.date)}
                y2={innerH}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={1}
                strokeDasharray="2,2"
              />
              <circle
                cx={xScale(tooltipData.date)}
                cy={yScale(tooltipData.value)}
                r={3}
                fill="rgba(52,211,153,0.70)"
                stroke={tooltipBg}
                strokeWidth={2}
              />
            </>
          )}
        </Group>
      </svg>
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={(tooltipTop ?? 0) - 44}
          style={{
            background: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: 3,
            padding: "6px 10px",
            fontSize: 11,
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            pointerEvents: "none" as const,
            fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
          }}
        >
          <div style={{ fontWeight: 400, color: "rgba(255,255,255,0.72)", fontVariantNumeric: "tabular-nums", fontSize: 12 }}>
            {formatValue(tooltipData.value)}
          </div>
          <div style={{ color: "rgba(255,255,255,0.25)", marginTop: 2, fontSize: 9, fontWeight: 300 }}>{formatDate(tooltipData.date)}</div>
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
