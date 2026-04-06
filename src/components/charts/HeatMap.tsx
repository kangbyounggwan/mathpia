import React, { useMemo } from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';

const CHART_COLORS = {
  heatmapLow: '#E3F2FD',
  heatmapMid: '#64B5F6',
  heatmapHigh: '#1565C0',
  heatmapZero: '#F5F5F5',
  border: '#E0E0E0',
  label: '#757575',
  cellText: '#FFFFFF',
  cellTextDark: '#212121',
};

interface HeatMapProps {
  data: { x: string; y: string; value: number }[];
  width?: number;
  height?: number;
  xLabels?: string[];
  yLabels?: string[];
}

// Interpolate color between low-mid-high based on value (0-100)
function getHeatColor(value: number): string {
  if (value <= 0) return CHART_COLORS.heatmapZero;
  if (value <= 33) {
    // low range: heatmapHigh (worst performance = darkest = most concern)
    return CHART_COLORS.heatmapHigh;
  }
  if (value <= 66) {
    return CHART_COLORS.heatmapMid;
  }
  return CHART_COLORS.heatmapLow;
}

// Determine if text should be white or dark based on background
function getTextColor(value: number): string {
  if (value <= 0) return CHART_COLORS.cellTextDark;
  if (value <= 50) return CHART_COLORS.cellText;       // white on dark bg
  return CHART_COLORS.cellTextDark;                     // dark on light bg
}

export default function HeatMap({
  data,
  width = 600,
  height = 200,
  xLabels: xLabelsProp,
  yLabels: yLabelsProp,
}: HeatMapProps) {
  // Auto-detect labels from data if not provided
  const xLabels = useMemo(
    () => xLabelsProp || [...new Set(data.map((d) => d.x))],
    [data, xLabelsProp]
  );
  const yLabels = useMemo(
    () => yLabelsProp || ['하', '중', '상'],
    [yLabelsProp]
  );

  const paddingLeft = 80;
  const paddingTop = 10;
  const paddingBottom = 40;
  const paddingRight = 10;

  const gridWidth = width - paddingLeft - paddingRight;
  const gridHeight = height - paddingTop - paddingBottom;

  const cellWidth = xLabels.length > 0 ? gridWidth / xLabels.length : 0;
  const cellHeight = yLabels.length > 0 ? gridHeight / yLabels.length : 0;
  const cellPadding = 2;

  // Build lookup map
  const valueMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => map.set(`${d.x}|${d.y}`, d.value));
    return map;
  }, [data]);

  // Truncate label
  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max - 1) + '..' : text;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Y axis labels (difficulty levels) */}
        {yLabels.map((yLabel, yi) => (
          <SvgText
            key={`ylabel-${yi}`}
            x={paddingLeft - 10}
            y={paddingTop + yi * cellHeight + cellHeight / 2 + 4}
            fontSize={12}
            fontWeight="500"
            fill={CHART_COLORS.label}
            textAnchor="end"
          >
            {yLabel}
          </SvgText>
        ))}

        {/* Grid cells */}
        {yLabels.map((yLabel, yi) =>
          xLabels.map((xLabel, xi) => {
            const value = valueMap.get(`${xLabel}|${yLabel}`) ?? -1;
            const cellX = paddingLeft + xi * cellWidth + cellPadding;
            const cellY = paddingTop + yi * cellHeight + cellPadding;
            const w = cellWidth - cellPadding * 2;
            const h = cellHeight - cellPadding * 2;

            return (
              <G key={`cell-${xi}-${yi}`}>
                <Rect
                  x={cellX}
                  y={cellY}
                  width={w}
                  height={h}
                  rx={4}
                  ry={4}
                  fill={value < 0 ? CHART_COLORS.heatmapZero : getHeatColor(value)}
                  stroke={CHART_COLORS.border}
                  strokeWidth={0.5}
                />
                {value >= 0 && (
                  <SvgText
                    x={cellX + w / 2}
                    y={cellY + h / 2 + 4}
                    fontSize={11}
                    fontWeight="500"
                    fill={getTextColor(value)}
                    textAnchor="middle"
                  >
                    {value}%
                  </SvgText>
                )}
              </G>
            );
          })
        )}

        {/* X axis labels (topic names) */}
        {xLabels.map((xLabel, xi) => (
          <SvgText
            key={`xlabel-${xi}`}
            x={paddingLeft + xi * cellWidth + cellWidth / 2}
            y={paddingTop + gridHeight + 20}
            fontSize={10}
            fill={CHART_COLORS.label}
            textAnchor="middle"
          >
            {truncate(xLabel, 5)}
          </SvgText>
        ))}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={[styles.legendItem, { backgroundColor: CHART_COLORS.heatmapHigh }]} />
        <RNText style={styles.legendText}>취약 (0-33%)</RNText>
        <View style={[styles.legendItem, { backgroundColor: CHART_COLORS.heatmapMid }]} />
        <RNText style={styles.legendText}>보통 (34-66%)</RNText>
        <View style={[styles.legendItem, { backgroundColor: CHART_COLORS.heatmapLow }]} />
        <RNText style={styles.legendText}>우수 (67-100%)</RNText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  legendItem: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: '#757575',
    marginRight: 8,
  },
});
