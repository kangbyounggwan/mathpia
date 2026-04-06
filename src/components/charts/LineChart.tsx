import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path, Circle, Line, Text as SvgText, G,
} from 'react-native-svg';

const CHART_COLORS = {
  lineStroke: '#4A90D9',
  lineDot: '#2E6DB3',
  lineFill: 'rgba(74, 144, 217, 0.10)',
  grid: '#E0E0E0',
  label: '#757575',
  axis: '#212121',
};

interface LineChartProps {
  data: { date: string; score: number }[];
  width?: number;
  height?: number;
  maxScore?: number;
  lineColor?: string;
  dotColor?: string;
  showArea?: boolean;
}

export default function LineChart({
  data,
  width = 600,
  height = 250,
  maxScore = 100,
  lineColor = CHART_COLORS.lineStroke,
  dotColor = CHART_COLORS.lineDot,
  showArea = true,
}: LineChartProps) {
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Sort data by date ascending
  const sorted = useMemo(
    () => [...data].sort((a, b) => a.date.localeCompare(b.date)),
    [data]
  );

  // Map data points to pixel coordinates
  const points = useMemo(() => {
    if (sorted.length === 0) return [];
    if (sorted.length === 1) {
      return [{
        x: paddingLeft + chartWidth / 2,
        y: paddingTop + chartHeight - (sorted[0].score / maxScore) * chartHeight,
        date: sorted[0].date,
        score: sorted[0].score,
      }];
    }
    return sorted.map((d, i) => ({
      x: paddingLeft + (i / (sorted.length - 1)) * chartWidth,
      y: paddingTop + chartHeight - (d.score / maxScore) * chartHeight,
      date: d.date,
      score: d.score,
    }));
  }, [sorted, maxScore, chartWidth, chartHeight, paddingLeft, paddingTop]);

  // SVG path for the line
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  }, [points]);

  // SVG path for the filled area below the line
  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const bottom = paddingTop + chartHeight;
    return (
      `M${points[0].x},${bottom} ` +
      points.map((p) => `L${p.x},${p.y}`).join(' ') +
      ` L${points[points.length - 1].x},${bottom} Z`
    );
  }, [points, chartHeight, paddingTop]);

  // Y axis grid lines (every 20 points: 0, 20, 40, 60, 80, 100)
  const yTicks = useMemo(() => {
    const step = 20;
    const ticks: { value: number; y: number }[] = [];
    for (let v = 0; v <= maxScore; v += step) {
      ticks.push({
        value: v,
        y: paddingTop + chartHeight - (v / maxScore) * chartHeight,
      });
    }
    return ticks;
  }, [maxScore, chartHeight, paddingTop]);

  // Format date for X axis labels: 'MM/DD'
  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
  };

  // Pick X axis label indices (show max 7 labels to avoid overlap)
  const xLabelIndices = useMemo(() => {
    if (points.length <= 7) return points.map((_, i) => i);
    const step = Math.ceil(points.length / 7);
    const indices: number[] = [];
    for (let i = 0; i < points.length; i += step) {
      indices.push(i);
    }
    // Always include last
    if (indices[indices.length - 1] !== points.length - 1) {
      indices.push(points.length - 1);
    }
    return indices;
  }, [points.length]);

  if (data.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Svg width={width} height={height}>
          <SvgText
            x={width / 2}
            y={height / 2}
            fontSize={14}
            fill={CHART_COLORS.label}
            textAnchor="middle"
          >
            {'데이터가 없습니다'}
          </SvgText>
        </Svg>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Y axis grid lines and labels */}
        {yTicks.map((tick) => (
          <G key={`ytick-${tick.value}`}>
            <Line
              x1={paddingLeft}
              y1={tick.y}
              x2={paddingLeft + chartWidth}
              y2={tick.y}
              stroke={CHART_COLORS.grid}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <SvgText
              x={paddingLeft - 8}
              y={tick.y + 4}
              fontSize={10}
              fill={CHART_COLORS.label}
              textAnchor="end"
            >
              {tick.value}
            </SvgText>
          </G>
        ))}

        {/* Filled area under line */}
        {showArea && (
          <Path d={areaPath} fill={CHART_COLORS.lineFill} />
        )}

        {/* Line */}
        <Path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data dots */}
        {points.map((p, i) => (
          <G key={`dot-${i}`}>
            <Circle cx={p.x} cy={p.y} r={5} fill="#FFFFFF" stroke={dotColor} strokeWidth={2.5} />
          </G>
        ))}

        {/* X axis labels */}
        {xLabelIndices.map((idx) => {
          const p = points[idx];
          if (!p) return null;
          return (
            <SvgText
              key={`xlabel-${idx}`}
              x={p.x}
              y={paddingTop + chartHeight + 20}
              fontSize={10}
              fill={CHART_COLORS.label}
              textAnchor="middle"
            >
              {formatDate(p.date)}
            </SvgText>
          );
        })}

        {/* Score labels above dots (show for first and last) */}
        {points
          .filter((_, i) => i === 0 || i === points.length - 1)
          .map((p, i) => (
            <SvgText
              key={`score-${i}`}
              x={p.x}
              y={p.y - 10}
              fontSize={11}
              fontWeight="600"
              fill={CHART_COLORS.axis}
              textAnchor="middle"
            >
              {p.score}
            </SvgText>
          ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
