import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, G } from 'react-native-svg';

const CHART_COLORS = {
  radarFill: 'rgba(74, 144, 217, 0.25)',
  radarStroke: '#4A90D9',
  radarGrid: '#E0E0E0',
  radarLabel: '#212121',
  radarValue: '#757575',
};

interface RadarChartProps {
  data: { label: string; value: number }[];
  size?: number;
  maxValue?: number;
  levels?: number;
  fillColor?: string;
  strokeColor?: string;
}

export default function RadarChart({
  data,
  size = 300,
  maxValue = 100,
  levels = 5,
  fillColor = CHART_COLORS.radarFill,
  strokeColor = CHART_COLORS.radarStroke,
}: RadarChartProps) {
  const center = size / 2;
  const radius = size / 2 - 40; // leave 40px margin for labels

  const angleStep = (2 * Math.PI) / data.length;
  // Start from top (12 o'clock): offset by -PI/2
  const startAngle = -Math.PI / 2;

  // Compute (x,y) for a given axis index at a given fraction (0..1) of radius
  const getPoint = (index: number, fraction: number) => {
    const angle = startAngle + index * angleStep;
    return {
      x: center + radius * fraction * Math.cos(angle),
      y: center + radius * fraction * Math.sin(angle),
    };
  };

  // Grid polygons (concentric rings)
  const gridPolygons = useMemo(() => {
    return Array.from({ length: levels }, (_, levelIndex) => {
      const fraction = (levelIndex + 1) / levels;
      const points = data
        .map((_, i) => {
          const p = getPoint(i, fraction);
          return `${p.x},${p.y}`;
        })
        .join(' ');
      return points;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length, levels, center, radius]);

  // Data polygon
  const dataPoints = useMemo(() => {
    return data
      .map((d, i) => {
        const fraction = Math.min(d.value, maxValue) / maxValue;
        const p = getPoint(i, fraction);
        return `${p.x},${p.y}`;
      })
      .join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, maxValue, center, radius]);

  // Data dot positions (for small circles on vertices)
  const dataDots = useMemo(() => {
    return data.map((d, i) => {
      const fraction = Math.min(d.value, maxValue) / maxValue;
      return getPoint(i, fraction);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, maxValue, center, radius]);

  // Label positions (outside the outermost ring)
  const labelPositions = useMemo(() => {
    return data.map((d, i) => {
      const angle = startAngle + i * angleStep;
      const labelRadius = radius + 28;
      return {
        x: center + labelRadius * Math.cos(angle),
        y: center + labelRadius * Math.sin(angle),
        label: d.label,
        value: d.value,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, center, radius]);

  if (data.length < 3) {
    return (
      <View style={styles.container}>
        <Svg width={size} height={size}>
          <SvgText
            x={size / 2}
            y={size / 2}
            fontSize={14}
            fill={CHART_COLORS.radarValue}
            textAnchor="middle"
          >
            {'데이터가 부족합니다'}
          </SvgText>
        </Svg>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Grid rings */}
        {gridPolygons.map((points, i) => (
          <Polygon
            key={`grid-${i}`}
            points={points}
            fill="none"
            stroke={CHART_COLORS.radarGrid}
            strokeWidth={1}
          />
        ))}

        {/* Axis lines from center to each vertex */}
        {data.map((_, i) => {
          const p = getPoint(i, 1);
          return (
            <Line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke={CHART_COLORS.radarGrid}
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon (filled area) */}
        <Polygon
          points={dataPoints}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
        />

        {/* Data dots */}
        {dataDots.map((p, i) => (
          <Circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={strokeColor}
          />
        ))}

        {/* Labels and values */}
        {labelPositions.map((lp, i) => (
          <G key={`label-${i}`}>
            <SvgText
              x={lp.x}
              y={lp.y - 6}
              fontSize={11}
              fontWeight="500"
              fill={CHART_COLORS.radarLabel}
              textAnchor="middle"
            >
              {lp.label}
            </SvgText>
            <SvgText
              x={lp.x}
              y={lp.y + 8}
              fontSize={10}
              fill={CHART_COLORS.radarValue}
              textAnchor="middle"
            >
              {lp.value}점
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
    justifyContent: 'center',
  },
});
