import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, G } from 'react-native-svg';

const CHART_COLORS = {
  barDefault: '#4A90D9',
  grid: '#E0E0E0',
  label: '#757575',
  value: '#212121',
};

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  width?: number;
  height?: number;
  maxValue?: number;
  barColor?: string;
  showValues?: boolean;
}

export default function BarChart({
  data,
  width = 600,
  height = 250,
  maxValue = 100,
  barColor = CHART_COLORS.barDefault,
  showValues = true,
}: BarChartProps) {
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 50;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Bar geometry
  const barGap = 8;
  const totalGaps = (data.length + 1) * barGap;
  const barWidth = Math.min(
    (chartWidth - totalGaps) / Math.max(data.length, 1),
    60 // max bar width
  );

  // Center bars if they don't fill the full width
  const totalBarsWidth = data.length * barWidth + (data.length + 1) * barGap;
  const offsetX = paddingLeft + (chartWidth - totalBarsWidth) / 2;

  const bars = useMemo(() => {
    return data.map((d, i) => {
      const barHeight = (Math.min(d.value, maxValue) / maxValue) * chartHeight;
      const x = offsetX + barGap + i * (barWidth + barGap);
      const y = paddingTop + chartHeight - barHeight;
      return {
        x,
        y,
        width: barWidth,
        height: barHeight,
        color: d.color || barColor,
        label: d.label,
        value: d.value,
      };
    });
  }, [data, maxValue, chartWidth, chartHeight, barWidth, barColor, offsetX, paddingTop]);

  // Y axis ticks
  const yTicks = useMemo(() => {
    const step = maxValue <= 100 ? 20 : Math.ceil(maxValue / 5);
    const ticks: { value: number; y: number }[] = [];
    for (let v = 0; v <= maxValue; v += step) {
      ticks.push({
        value: v,
        y: paddingTop + chartHeight - (v / maxValue) * chartHeight,
      });
    }
    return ticks;
  }, [maxValue, chartHeight, paddingTop]);

  // Truncate long labels
  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max - 1) + '..' : text;

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
        {/* Y axis grid */}
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

        {/* Baseline */}
        <Line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={paddingLeft + chartWidth}
          y2={paddingTop + chartHeight}
          stroke={CHART_COLORS.grid}
          strokeWidth={1}
        />

        {/* Bars */}
        {bars.map((bar, i) => (
          <G key={`bar-${i}`}>
            {/* Bar rectangle with rounded top corners */}
            <Rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              rx={4}
              ry={4}
              fill={bar.color}
            />

            {/* Value above bar */}
            {showValues && (
              <SvgText
                x={bar.x + bar.width / 2}
                y={bar.y - 6}
                fontSize={11}
                fontWeight="600"
                fill={CHART_COLORS.value}
                textAnchor="middle"
              >
                {bar.value}%
              </SvgText>
            )}

            {/* Label below bar */}
            <SvgText
              x={bar.x + bar.width / 2}
              y={paddingTop + chartHeight + 16}
              fontSize={10}
              fill={CHART_COLORS.label}
              textAnchor="middle"
            >
              {truncate(bar.label, 6)}
            </SvgText>
          </G>
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
