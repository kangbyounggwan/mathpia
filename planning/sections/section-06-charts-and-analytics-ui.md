# Section 06: Charts & Analytics UI

**Phase**: 3 (Gemini AI 학습 분석)
**Steps**: 3.10, 3.11, 3.12, 3.13
**Dependencies**: Section 01 (Types & Interfaces), Section 02 (Mock Data & Services), Section 03 (Zustand Stores), Section 05 (Gemini AI Services)

---

## 1. Background

Mathpia is a tablet-first math tutoring platform (Expo SDK 54, React 19.1, Expo Router, react-native-paper, Zustand). This section implements the visual analytics layer: four custom SVG chart components built with `react-native-svg` (already installed at v15.15.1), three analytics wrapper components, and two full screen pages -- one for students to view their own learning analytics and one for teachers to inspect any student's analytics.

All AI analysis data comes from the `analyticsStore` (Section 03) which caches results from `geminiAnalytics.ts` (Section 05). Charts render data from that store. No direct Gemini API calls happen in this section's code -- the store and service handle that.

---

## 2. Prerequisites (must be completed before starting)

Before implementing this section, verify these artifacts exist and are functional:

| Artifact | Section | What to check |
|----------|---------|---------------|
| `src/types/analytics.ts` | 01 | `StudentAnalytics`, `WeaknessAnalysis`, `SubjectScore`, `LearningReport`, `RadarDataPoint`, `TimelineDataPoint`, `HeatmapDataPoint` types exist |
| `src/services/mock/mockAnalytics.ts` | 02 | `MockAnalyticsService` with `getStudentAnalytics()`, `getStudentList()` returns mock data |
| `src/stores/analyticsStore.ts` | 03 | `useAnalyticsStore` with `studentAnalytics`, `weaknessAnalysis`, `learningReport`, `isAnalyzing`, `fetchAnalytics(studentId)`, `runAIDiagnosis(studentId)` |
| `src/services/geminiAnalytics.ts` | 05 | `analyzeStudentWeakness()`, `generateLearningReport()` functions |
| `src/constants/theme.ts` | existing | colors, spacing, borderRadius, tabletSizes exports |
| `src/components/common/Card.tsx` | existing | `Card` component |
| `react-native-svg` | package.json | v15.15.1 installed |

### Required type shapes (from Section 01)

These types must exist in `src/types/analytics.ts`. If they do not yet exist, create them exactly as shown here before proceeding:

```typescript
// src/types/analytics.ts

export interface SubjectScore {
  subject: string;   // e.g. "이차방정식", "삼각함수"
  score: number;      // 0-100
}

export interface WeakTopic {
  topic: string;
  score: number;       // 0-100
  reason: string;      // AI-generated Korean explanation
  recommendedCount: number;
}

export interface WeaknessAnalysis {
  weakTopics: WeakTopic[];
  errorPatterns: string[];
  recommendations: string[];
  analyzedAt: string;  // ISO date string
}

export interface RadarDataPoint {
  label: string;
  value: number;  // 0-100
}

export interface TimelineDataPoint {
  date: string;   // 'YYYY-MM-DD'
  score: number;  // 0-100
}

export interface HeatmapDataPoint {
  x: string;  // topic name
  y: string;  // difficulty label ('하' | '중' | '상')
  value: number; // 0-100 (correct rate)
}

export interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface StudentAnalytics {
  studentId: string;
  studentName: string;
  grade: string;
  overallScore: number;       // 0-100
  totalSolved: number;
  totalCorrect: number;
  streakDays: number;
  subjectScores: SubjectScore[];
  weakTopics: WeakTopic[];
  strongTopics: string[];
}

export interface LearningReport {
  radarData: RadarDataPoint[];
  timelineData: TimelineDataPoint[];
  heatmapData: HeatmapDataPoint[];
  barData: BarDataPoint[];
  aiSummary: string;
  strengths: string[];
  weaknesses: string[];
  advice: string[];
}
```

### Required store shape (from Section 03)

The `analyticsStore` must expose at minimum:

```typescript
interface AnalyticsState {
  // Data
  studentAnalytics: StudentAnalytics | null;
  weaknessAnalysis: WeaknessAnalysis | null;
  learningReport: LearningReport | null;
  studentList: { id: string; name: string; grade: string }[];

  // Loading states
  isAnalyzing: boolean;
  isLoadingReport: boolean;
  analysisStep: 'idle' | 'weakness' | 'recommendations' | 'report' | 'done';
  error: string | null;

  // Actions
  fetchAnalytics: (studentId: string) => Promise<void>;
  fetchStudentList: () => Promise<void>;
  runAIDiagnosis: (studentId: string) => Promise<void>;
  clearAnalytics: () => void;
}
```

---

## 3. Design System Reference

All components in this section use the project's existing design tokens. Here is the full reference so you never need to open another file:

```typescript
// src/constants/theme.ts (complete relevant exports)

export const colors = {
  primary: '#4A90D9',
  primaryLight: '#7AB3E8',
  primaryDark: '#2E6DB3',
  secondary: '#5C6BC0',
  secondaryLight: '#8E99D6',
  secondaryDark: '#3949AB',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceVariant: '#E8E8E8',
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  border: '#E0E0E0',
  divider: '#EEEEEE',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const tabletSizes = {
  minTouchTarget: 44,
  iconSize: 24,
  iconSizeLarge: 32,
  avatarSize: 48,
  avatarSizeLarge: 64,
  buttonHeight: 48,
  inputHeight: 56,
  toolbarHeight: 64,
  tabBarHeight: 72,
};
```

### Chart color palette

Define these chart-specific colors as constants inside each chart file or in a shared block at the top:

```typescript
const CHART_COLORS = {
  radarFill: 'rgba(74, 144, 217, 0.25)',    // primary @ 25%
  radarStroke: '#4A90D9',                     // primary
  radarGrid: '#E0E0E0',                      // border
  radarLabel: '#212121',                      // textPrimary
  radarValue: '#757575',                      // textSecondary
  lineStroke: '#4A90D9',
  lineDot: '#2E6DB3',                         // primaryDark
  lineFill: 'rgba(74, 144, 217, 0.10)',
  barDefault: '#4A90D9',
  heatmapLow: '#E3F2FD',                     // very light blue
  heatmapMid: '#64B5F6',
  heatmapHigh: '#1565C0',
  heatmapZero: '#F5F5F5',                    // background
};
```

---

## 4. Files to Create

```
src/
  components/
    charts/
      RadarChart.tsx        ← Step 3.10
      LineChart.tsx          ← Step 3.10
      BarChart.tsx           ← Step 3.10
      HeatMap.tsx            ← Step 3.10
      index.ts              ← re-exports
    analytics/
      WeaknessCard.tsx      ← Step 3.11
      AchievementRadar.tsx  ← Step 3.11
      ProgressTimeline.tsx  ← Step 3.11
      AnalysisSkeleton.tsx  ← Step 3.11
      index.ts              ← re-exports

app/
  (student)/
    analytics.tsx           ← Step 3.12
  (teacher)/
    student-analytics.tsx   ← Step 3.13
```

Total: **12 files**

---

## 5. Step 3.10 -- Chart Components

All four charts are pure, stateless components. They accept data via props and render SVG. They do NOT call stores, services, or APIs.

### 5.1 `src/components/charts/RadarChart.tsx`

**Purpose**: Render a radar (spider) chart showing subject-level achievement scores. Supports 5-8 axes (pentagon to octagon). Each axis has a label and a score value.

**Props**:

```typescript
import { RadarDataPoint } from '../../types/analytics';

interface RadarChartProps {
  data: RadarDataPoint[];      // [{label: '이차방정식', value: 85}, ...]
  size?: number;                // total SVG width/height, default 300
  maxValue?: number;            // scale ceiling, default 100
  levels?: number;              // number of concentric grid rings, default 5
  fillColor?: string;           // default CHART_COLORS.radarFill
  strokeColor?: string;         // default CHART_COLORS.radarStroke
}
```

**Implementation details**:

```typescript
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, G } from 'react-native-svg';
import { colors } from '../../constants/theme';

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
  }, [data, maxValue, center, radius]);

  // Data dot positions (for small circles on vertices)
  const dataDots = useMemo(() => {
    return data.map((d, i) => {
      const fraction = Math.min(d.value, maxValue) / maxValue;
      return getPoint(i, fraction);
    });
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
  }, [data, center, radius]);

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
```

**Key behaviors**:
- Axes radiate from center, starting from 12 o'clock (top)
- Grid rings are concentric polygons matching the axis count (pentagon for 5, hexagon for 6, etc.)
- Data polygon is filled with semi-transparent primary color
- Each data vertex has a small solid dot
- Labels appear outside the outermost ring with the topic name above and score below
- `useMemo` on all geometry computations for performance

---

### 5.2 `src/components/charts/LineChart.tsx`

**Purpose**: Time-series line chart for score trends. X axis is dates, Y axis is scores (0-100). Shows connecting lines and dots.

**Props**:

```typescript
interface LineChartProps {
  data: { date: string; score: number }[];  // date = 'YYYY-MM-DD'
  width?: number;     // SVG width, default 600
  height?: number;    // SVG height, default 250
  maxScore?: number;  // Y axis max, default 100
  lineColor?: string;
  dotColor?: string;
  showArea?: boolean; // fill below the line, default true
}
```

**Implementation details**:

```typescript
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path, Circle, Line, Text as SvgText, G, Defs, LinearGradient, Stop, Rect,
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
  }, [sorted, maxScore, chartWidth, chartHeight]);

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
  }, [points, chartHeight]);

  // Y axis grid lines (every 20 points: 0, 20, 40, 60, 80, 100)
  const yTicks = useMemo(() => {
    const step = 20;
    const ticks = [];
    for (let v = 0; v <= maxScore; v += step) {
      ticks.push({
        value: v,
        y: paddingTop + chartHeight - (v / maxScore) * chartHeight,
      });
    }
    return ticks;
  }, [maxScore, chartHeight]);

  // Format date for X axis labels: 'MM/DD'
  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
  };

  // Pick X axis label indices (show max 7 labels to avoid overlap)
  const xLabelIndices = useMemo(() => {
    if (points.length <= 7) return points.map((_, i) => i);
    const step = Math.ceil(points.length / 7);
    const indices = [];
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
            데이터가 없습니다
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

        {/* Score labels above dots (show on hover -- for now, always show for first/last/min/max) */}
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
```

**Key behaviors**:
- Data is auto-sorted by date ascending
- Y axis shows ticks at 0, 20, 40, 60, 80, 100 with dashed grid lines
- X axis shows date labels in MM/DD format (max 7 labels to prevent overlap)
- Optional filled area below the line for visual emphasis
- Dots are hollow circles with thick stroke
- Score labels appear above the first and last data points
- Empty state shows centered "데이터가 없습니다" text

---

### 5.3 `src/components/charts/BarChart.tsx`

**Purpose**: Vertical bar chart for comparing values (e.g., correct rate by topic).

**Props**:

```typescript
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  width?: number;        // default 600
  height?: number;       // default 250
  maxValue?: number;     // default 100
  barColor?: string;     // default color if no per-bar color
  showValues?: boolean;  // show value above each bar, default true
}
```

**Implementation details**:

```typescript
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
    (chartWidth - totalGaps) / data.length,
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
  }, [data, maxValue, chartWidth, chartHeight, barWidth, barColor]);

  // Y axis ticks
  const yTicks = useMemo(() => {
    const step = maxValue <= 100 ? 20 : Math.ceil(maxValue / 5);
    const ticks = [];
    for (let v = 0; v <= maxValue; v += step) {
      ticks.push({
        value: v,
        y: paddingTop + chartHeight - (v / maxValue) * chartHeight,
      });
    }
    return ticks;
  }, [maxValue, chartHeight]);

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
            데이터가 없습니다
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
```

**Key behaviors**:
- Bars are centered within the chart area
- Each bar can have an individual color (or falls back to barColor)
- Value labels appear above each bar
- X-axis labels are truncated to 6 characters to prevent overlap
- Bars have 4px rounded top corners
- Maximum bar width is capped at 60px
- Empty state message when data is empty

---

### 5.4 `src/components/charts/HeatMap.tsx`

**Purpose**: Grid heatmap showing topic (X) x difficulty (Y) matrix. Cell color intensity represents correct rate.

**Props**:

```typescript
interface HeatMapProps {
  data: { x: string; y: string; value: number }[];  // value = 0-100
  width?: number;       // default 600
  height?: number;      // default 200
  xLabels?: string[];   // override auto-detected X labels
  yLabels?: string[];   // override; default ['하', '중', '상']
}
```

**Implementation details**:

```typescript
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
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

  const cellWidth = gridWidth / xLabels.length;
  const cellHeight = gridHeight / yLabels.length;
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
        <SvgText style={styles.legendText}>취약 (0-33%)</SvgText>
        <View style={[styles.legendItem, { backgroundColor: CHART_COLORS.heatmapMid }]} />
        <SvgText style={styles.legendText}>보통 (34-66%)</SvgText>
        <View style={[styles.legendItem, { backgroundColor: CHART_COLORS.heatmapLow }]} />
        <SvgText style={styles.legendText}>우수 (67-100%)</SvgText>
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
```

**IMPORTANT -- Heatmap color logic**: Lower correct rate = darker/more intense color (indicating concern areas). This is the "danger" convention:
- 0-33%: dark blue (`#1565C0`) -- needs attention
- 34-66%: medium blue (`#64B5F6`) -- in progress
- 67-100%: light blue (`#E3F2FD`) -- good
- No data: gray (`#F5F5F5`)

---

### 5.5 `src/components/charts/index.ts`

```typescript
export { default as RadarChart } from './RadarChart';
export { default as LineChart } from './LineChart';
export { default as BarChart } from './BarChart';
export { default as HeatMap } from './HeatMap';
```

---

## 6. Step 3.11 -- Analytics Components

### 6.1 `src/components/analytics/WeaknessCard.tsx`

**Purpose**: Displays a single weakness topic as a card with topic name, score bar, AI-generated reason, and recommended problem count.

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface WeaknessCardProps {
  topic: string;
  score: number;           // 0-100
  reason: string;          // AI explanation in Korean
  recommendedCount: number;
  onPressRecommend?: () => void;
}

export default function WeaknessCard({
  topic,
  score,
  reason,
  recommendedCount,
  onPressRecommend,
}: WeaknessCardProps) {
  // Color based on score severity
  const getScoreColor = () => {
    if (score <= 30) return colors.error;
    if (score <= 60) return colors.warning;
    return colors.success;
  };

  const scoreColor = getScoreColor();

  return (
    <View style={styles.card}>
      {/* Header: topic name + score */}
      <View style={styles.header}>
        <View style={styles.topicRow}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={20}
            color={scoreColor}
          />
          <Text style={styles.topicName}>{topic}</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>{score}점</Text>
        </View>
      </View>

      {/* Score bar */}
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              { width: `${score}%`, backgroundColor: scoreColor },
            ]}
          />
        </View>
      </View>

      {/* AI reason */}
      <View style={styles.reasonContainer}>
        <MaterialCommunityIcons name="robot" size={14} color={colors.textSecondary} />
        <Text style={styles.reasonText}>{reason}</Text>
      </View>

      {/* Recommend button */}
      {recommendedCount > 0 && (
        <View
          style={styles.recommendRow}
          onTouchEnd={onPressRecommend}
        >
          <MaterialCommunityIcons name="lightbulb-on" size={16} color={colors.primary} />
          <Text style={styles.recommendText}>
            추천 문제 {recommendedCount}개 풀어보기
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  barContainer: {
    marginBottom: spacing.sm,
  },
  barBackground: {
    height: 6,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  reasonText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  recommendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  recommendText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
    flex: 1,
  },
});
```

---

### 6.2 `src/components/analytics/AchievementRadar.tsx`

**Purpose**: Wraps RadarChart with a title, legend, and summary text.

```typescript
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import RadarChart from '../charts/RadarChart';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface AchievementRadarProps {
  data: { label: string; value: number }[];
  title?: string;
  overallScore?: number;
}

export default function AchievementRadar({
  data,
  title = '단원별 역량 분석',
  overallScore,
}: AchievementRadarProps) {
  const { width } = useWindowDimensions();
  // Responsive: on wide screens use 320, on narrow screens use width - 80
  const chartSize = Math.min(320, width - 80);

  // Find strongest and weakest
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return (
    <View style={styles.card}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {overallScore !== undefined && (
          <View style={styles.overallBadge}>
            <Text style={styles.overallText}>평균 {overallScore}점</Text>
          </View>
        )}
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <RadarChart data={data} size={chartSize} />
      </View>

      {/* Summary legend */}
      {data.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={styles.summaryLabel}>강점</Text>
            <Text style={styles.summaryValue}>
              {strongest?.label} ({strongest?.value}점)
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: colors.error }]} />
            <Text style={styles.summaryLabel}>약점</Text>
            <Text style={styles.summaryValue}>
              {weakest?.label} ({weakest?.value}점)
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  overallBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  overallText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
```

---

### 6.3 `src/components/analytics/ProgressTimeline.tsx`

**Purpose**: Wraps LineChart with week/month toggle and event markers.

```typescript
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import LineChart from '../charts/LineChart';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface ProgressTimelineProps {
  data: { date: string; score: number }[];
  title?: string;
}

export default function ProgressTimeline({
  data,
  title = '성적 변화 추이',
}: ProgressTimelineProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 48, 700);

  const [period, setPeriod] = useState<string>('4weeks');

  // Filter data by period
  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (period) {
      case '1week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '4weeks':
        cutoffDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
        break;
      case '3months':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    }

    return data.filter((d) => new Date(d.date) >= cutoffDate);
  }, [data, period]);

  // Compute trend
  const trend = useMemo(() => {
    if (filteredData.length < 2) return { direction: 'stable' as const, diff: 0 };
    const first = filteredData[0].score;
    const last = filteredData[filteredData.length - 1].score;
    const diff = last - first;
    return {
      direction: diff > 2 ? ('up' as const) : diff < -2 ? ('down' as const) : ('stable' as const),
      diff,
    };
  }, [filteredData]);

  const trendColor =
    trend.direction === 'up' ? colors.success :
    trend.direction === 'down' ? colors.error :
    colors.textSecondary;

  const trendIcon =
    trend.direction === 'up' ? '+' :
    trend.direction === 'down' ? '' :
    '';

  return (
    <View style={styles.card}>
      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {filteredData.length >= 2 && (
          <View style={[styles.trendBadge, { backgroundColor: trendColor + '15' }]}>
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trendIcon}{trend.diff}점
            </Text>
          </View>
        )}
      </View>

      {/* Period toggle */}
      <SegmentedButtons
        value={period}
        onValueChange={setPeriod}
        buttons={[
          { value: '1week', label: '1주' },
          { value: '4weeks', label: '4주' },
          { value: '3months', label: '3개월' },
        ]}
        style={styles.segmentButtons}
      />

      {/* Chart */}
      <View style={styles.chartContainer}>
        <LineChart data={filteredData} width={chartWidth} height={220} />
      </View>

      {/* Summary stats */}
      {filteredData.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round(filteredData.reduce((s, d) => s + d.score, 0) / filteredData.length)}점
            </Text>
            <Text style={styles.statLabel}>평균</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.max(...filteredData.map((d) => d.score))}점
            </Text>
            <Text style={styles.statLabel}>최고</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.min(...filteredData.map((d) => d.score))}점
            </Text>
            <Text style={styles.statLabel}>최저</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{filteredData.length}회</Text>
            <Text style={styles.statLabel}>테스트</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  trendBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '700',
  },
  segmentButtons: {
    marginBottom: spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
```

---

### 6.4 `src/components/analytics/AnalysisSkeleton.tsx`

**Purpose**: Skeleton/shimmer loading UI shown while AI analysis is running. Also shows step-by-step progress messages.

```typescript
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface AnalysisSkeletonProps {
  /** Current analysis step */
  step: 'idle' | 'weakness' | 'recommendations' | 'report' | 'done';
}

const STEP_MESSAGES: Record<string, { message: string; icon: string }> = {
  idle: { message: '분석을 준비하고 있습니다...', icon: 'clock-outline' },
  weakness: { message: 'AI가 취약점을 분석하고 있습니다...', icon: 'brain' },
  recommendations: { message: '맞춤 추천 문제를 선별하고 있습니다...', icon: 'lightbulb-on-outline' },
  report: { message: '학습 리포트를 생성하고 있습니다...', icon: 'file-chart-outline' },
  done: { message: '분석이 완료되었습니다!', icon: 'check-circle' },
};

// Individual skeleton bar
function SkeletonBar({ width, height = 14, style }: { width: number | string; height?: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeletonBar,
        { width: width as any, height, opacity },
        style,
      ]}
    />
  );
}

export default function AnalysisSkeleton({ step }: AnalysisSkeletonProps) {
  const stepInfo = STEP_MESSAGES[step] || STEP_MESSAGES.idle;

  // Progress indicator: which steps are complete
  const steps = ['weakness', 'recommendations', 'report'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <View style={styles.container}>
      {/* Progress header */}
      <View style={styles.progressHeader}>
        <MaterialCommunityIcons
          name={stepInfo.icon as any}
          size={24}
          color={colors.primary}
        />
        <Text style={styles.progressMessage}>{stepInfo.message}</Text>
      </View>

      {/* Step indicators */}
      <View style={styles.stepsRow}>
        {steps.map((s, i) => {
          const isComplete = step === 'done' || i < currentStepIndex;
          const isCurrent = s === step;
          return (
            <View key={s} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  isComplete && styles.stepDotComplete,
                  isCurrent && styles.stepDotCurrent,
                ]}
              >
                {isComplete && (
                  <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  (isComplete || isCurrent) && styles.stepLabelActive,
                ]}
              >
                {s === 'weakness' ? '취약점 분석' : s === 'recommendations' ? '문제 추천' : '리포트 생성'}
              </Text>
              {i < steps.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    isComplete && styles.stepLineComplete,
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Skeleton content blocks */}
      <View style={styles.skeletonSection}>
        {/* Fake radar chart skeleton */}
        <View style={styles.skeletonCard}>
          <SkeletonBar width="40%" height={16} />
          <View style={styles.skeletonCircle} />
        </View>

        {/* Fake weakness cards */}
        <View style={styles.skeletonCard}>
          <SkeletonBar width="30%" height={16} />
          <View style={{ marginTop: 12 }}>
            <SkeletonBar width="100%" height={60} />
          </View>
          <View style={{ marginTop: 8 }}>
            <SkeletonBar width="100%" height={60} />
          </View>
          <View style={{ marginTop: 8 }}>
            <SkeletonBar width="80%" height={60} />
          </View>
        </View>

        {/* Fake timeline skeleton */}
        <View style={styles.skeletonCard}>
          <SkeletonBar width="35%" height={16} />
          <View style={{ marginTop: 12 }}>
            <SkeletonBar width="100%" height={120} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  progressMessage: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotComplete: {
    backgroundColor: colors.success,
  },
  stepDotCurrent: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    fontSize: 11,
    color: colors.textDisabled,
    marginLeft: 4,
  },
  stepLabelActive: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: colors.surfaceVariant,
    marginHorizontal: 4,
  },
  stepLineComplete: {
    backgroundColor: colors.success,
  },
  skeletonSection: {
    gap: spacing.md,
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  skeletonBar: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
  },
  skeletonCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.surfaceVariant,
    alignSelf: 'center',
    marginTop: 16,
  },
});
```

---

### 6.5 `src/components/analytics/index.ts`

```typescript
export { default as WeaknessCard } from './WeaknessCard';
export { default as AchievementRadar } from './AchievementRadar';
export { default as ProgressTimeline } from './ProgressTimeline';
export { default as AnalysisSkeleton } from './AnalysisSkeleton';
```

---

## 7. Step 3.12 -- Student Analytics Screen

### `app/(student)/analytics.tsx`

This screen is the student's personal learning analytics dashboard. It fetches data from `analyticsStore` on mount, shows skeleton loading during AI analysis, and renders the results in a scrollable layout.

**Screen layout (top to bottom)**:
1. Header: "내 학습 분석"
2. Summary stat cards row: overall score, total solved, streak days
3. AchievementRadar (단원별 역량)
4. WeaknessCard list (취약 단원, shown first during step-by-step loading)
5. ProgressTimeline (성적 변화 그래프)
6. HeatMap (단원 x 난이도 매트릭스)
7. "추천 문제 풀기" button at bottom

```typescript
import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius } from '../../src/constants/theme';
import { Button } from '../../src/components/common';
import { AchievementRadar, WeaknessCard, ProgressTimeline, AnalysisSkeleton } from '../../src/components/analytics';
import { HeatMap } from '../../src/components/charts';
import { useAnalyticsStore } from '../../src/stores/analyticsStore';
import { useAuthStore } from '../../src/stores/authStore';

// Summary stat card
interface StatCardProps {
  icon: string;
  iconColor: string;
  value: string;
  label: string;
}

function StatCard({ icon, iconColor, value, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: iconColor + '15' }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function StudentAnalyticsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  const user = useAuthStore((s) => s.user);
  const {
    studentAnalytics,
    weaknessAnalysis,
    learningReport,
    isAnalyzing,
    analysisStep,
    error,
    fetchAnalytics,
  } = useAnalyticsStore();

  // Fetch analytics on mount
  useEffect(() => {
    if (user?.id) {
      fetchAnalytics(user.id);
    }
  }, [user?.id]);

  // Loading state
  if (isAnalyzing && !studentAnalytics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>내 학습 분석</Text>
        </View>
        <AnalysisSkeleton step={analysisStep} />
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !studentAnalytics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>내 학습 분석</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={() => user?.id && fetchAnalytics(user.id)}>
            다시 시도
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!studentAnalytics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>내 학습 분석</Text>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="chart-line" size={48} color={colors.textDisabled} />
          <Text style={styles.emptyText}>아직 분석할 풀이 데이터가 없습니다</Text>
          <Text style={styles.emptySubtext}>숙제를 풀면 AI가 학습 패턴을 분석해드립니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  const correctRate = studentAnalytics.totalSolved > 0
    ? Math.round((studentAnalytics.totalCorrect / studentAnalytics.totalSolved) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>내 학습 분석</Text>
        {isAnalyzing && (
          <View style={styles.analyzingBadge}>
            <ActivityIndicator size={14} color={colors.primary} />
            <Text style={styles.analyzingText}>분석 중...</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary stat cards */}
        <View style={[styles.statsRow, isWide && styles.statsRowWide]}>
          <StatCard
            icon="chart-arc"
            iconColor={colors.primary}
            value={`${studentAnalytics.overallScore}점`}
            label="전체 점수"
          />
          <StatCard
            icon="check-circle"
            iconColor={colors.success}
            value={`${correctRate}%`}
            label="정답률"
          />
          <StatCard
            icon="pencil"
            iconColor={colors.secondary}
            value={`${studentAnalytics.totalSolved}`}
            label="풀이 수"
          />
          <StatCard
            icon="fire"
            iconColor={colors.warning}
            value={`${studentAnalytics.streakDays}일`}
            label="연속 학습"
          />
        </View>

        {/* Two-column layout on wide screens */}
        <View style={[styles.contentSection, isWide && styles.contentSectionWide]}>
          {/* Left column: Radar + Weakness */}
          <View style={[styles.column, isWide && styles.columnLeft]}>
            {/* Achievement Radar */}
            {learningReport?.radarData && learningReport.radarData.length > 0 && (
              <AchievementRadar
                data={learningReport.radarData}
                overallScore={studentAnalytics.overallScore}
              />
            )}

            {/* Weakness section -- shown first during step-by-step loading */}
            {weaknessAnalysis && weaknessAnalysis.weakTopics.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>취약 단원</Text>
                {weaknessAnalysis.weakTopics.map((wt, i) => (
                  <WeaknessCard
                    key={i}
                    topic={wt.topic}
                    score={wt.score}
                    reason={wt.reason}
                    recommendedCount={wt.recommendedCount}
                    onPressRecommend={() => {
                      // Navigate to recommended problems (future integration)
                    }}
                  />
                ))}
              </View>
            )}

            {/* Still loading weakness? Show partial skeleton */}
            {isAnalyzing && !weaknessAnalysis && (
              <AnalysisSkeleton step={analysisStep} />
            )}
          </View>

          {/* Right column: Timeline + Heatmap */}
          <View style={[styles.column, isWide && styles.columnRight]}>
            {/* Progress Timeline */}
            {learningReport?.timelineData && learningReport.timelineData.length > 0 && (
              <ProgressTimeline data={learningReport.timelineData} />
            )}

            {/* Still loading report? Show partial skeleton */}
            {isAnalyzing && !learningReport && weaknessAnalysis && (
              <View style={styles.partialLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.partialLoadingText}>리포트를 생성하고 있습니다...</Text>
              </View>
            )}

            {/* Heatmap */}
            {learningReport?.heatmapData && learningReport.heatmapData.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>단원 x 난이도 분석</Text>
                <View style={styles.heatmapContainer}>
                  <HeatMap
                    data={learningReport.heatmapData}
                    width={Math.min(width - 48, 600)}
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* AI Summary (from learningReport) */}
        {learningReport?.aiSummary && (
          <View style={styles.aiSummaryCard}>
            <View style={styles.aiSummaryHeader}>
              <MaterialCommunityIcons name="robot" size={20} color={colors.primary} />
              <Text style={styles.aiSummaryTitle}>AI 학습 진단</Text>
            </View>
            <Text style={styles.aiSummaryText}>{learningReport.aiSummary}</Text>
            {learningReport.advice && learningReport.advice.length > 0 && (
              <View style={styles.adviceList}>
                {learningReport.advice.map((adv, i) => (
                  <View key={i} style={styles.adviceItem}>
                    <MaterialCommunityIcons name="lightbulb-on" size={14} color={colors.warning} />
                    <Text style={styles.adviceText}>{adv}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Recommend button */}
        <Button
          mode="contained"
          icon="lightning-bolt"
          onPress={() => {
            // Navigate to recommended problem list (future integration)
          }}
          style={styles.recommendButton}
          fullWidth
        >
          추천 문제 풀기
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  analyzingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  analyzingText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statsRowWide: {
    justifyContent: 'center',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    maxWidth: 180,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Content layout
  contentSection: {
    gap: spacing.lg,
  },
  contentSectionWide: {
    flexDirection: 'row',
  },
  column: {
    gap: spacing.md,
  },
  columnLeft: {
    flex: 1,
  },
  columnRight: {
    flex: 1,
  },

  // Sections
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  heatmapContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  // Partial loading
  partialLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary + '08',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  partialLoadingText: {
    fontSize: 13,
    color: colors.primary,
  },

  // AI Summary
  aiSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  aiSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  aiSummaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  adviceList: {
    gap: spacing.xs,
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  adviceText: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },

  // Button
  recommendButton: {
    marginTop: spacing.lg,
  },

  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
```

**Step-by-step loading behavior** (critical UX pattern):

1. Screen mounts -> `fetchAnalytics(userId)` is called
2. Store sets `analysisStep = 'weakness'` -> screen shows `AnalysisSkeleton` with "AI가 취약점을 분석하고 있습니다..."
3. Weakness analysis completes -> `weaknessAnalysis` becomes non-null -> WeaknessCard list renders immediately, skeleton disappears for left column
4. Store sets `analysisStep = 'recommendations'` -> right column shows partial loading message
5. Report generation completes -> `learningReport` becomes non-null -> ProgressTimeline and HeatMap render
6. Store sets `analysisStep = 'done'`

This ensures the student sees useful information (weakness cards) as soon as possible, without waiting for the full report.

---

## 8. Step 3.13 -- Teacher Student Analytics Screen

### `app/(teacher)/student-analytics.tsx`

This screen lets a teacher select any student and view their analytics dashboard. It also has an "AI ??????" button to manually trigger a fresh analysis.

**Screen layout**:
1. Header with back button and title "학생 학습 분석"
2. Student selector dropdown
3. (Once a student is selected) Same analytics content as the student screen
4. "AI 진단 실행" button for manual re-analysis

```typescript
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text, Searchbar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, tabletSizes } from '../../src/constants/theme';
import { Button } from '../../src/components/common';
import { AchievementRadar, WeaknessCard, ProgressTimeline, AnalysisSkeleton } from '../../src/components/analytics';
import { BarChart, HeatMap } from '../../src/components/charts';
import { useAnalyticsStore } from '../../src/stores/analyticsStore';

export default function TeacherStudentAnalyticsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  const {
    studentList,
    studentAnalytics,
    weaknessAnalysis,
    learningReport,
    isAnalyzing,
    analysisStep,
    error,
    fetchStudentList,
    fetchAnalytics,
    runAIDiagnosis,
    clearAnalytics,
  } = useAnalyticsStore();

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStudentList, setShowStudentList] = useState(true);

  // Fetch student list on mount
  useEffect(() => {
    fetchStudentList();
  }, []);

  // When a student is selected, fetch their analytics
  useEffect(() => {
    if (selectedStudentId) {
      fetchAnalytics(selectedStudentId);
    }
  }, [selectedStudentId]);

  const filteredStudents = studentList.filter((s) =>
    s.name.includes(searchQuery) || s.grade.includes(searchQuery)
  );

  const selectedStudent = studentList.find((s) => s.id === selectedStudentId);

  const handleSelectStudent = useCallback((studentId: string) => {
    clearAnalytics();
    setSelectedStudentId(studentId);
    setShowStudentList(false);
  }, []);

  const handleRunDiagnosis = useCallback(() => {
    if (selectedStudentId) {
      runAIDiagnosis(selectedStudentId);
    }
  }, [selectedStudentId]);

  const correctRate = studentAnalytics?.totalSolved
    ? Math.round((studentAnalytics.totalCorrect / studentAnalytics.totalSolved) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>학생 학습 분석</Text>
        {selectedStudent && (
          <TouchableOpacity
            onPress={() => {
              setShowStudentList(true);
              clearAnalytics();
              setSelectedStudentId(null);
            }}
            style={styles.changeStudentButton}
          >
            <Text style={styles.changeStudentText}>학생 변경</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Student selector */}
      {showStudentList && (
        <View style={styles.selectorContainer}>
          <Searchbar
            placeholder="학생 이름 또는 학년 검색"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.id}
            style={styles.studentList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.studentItem,
                  selectedStudentId === item.id && styles.studentItemSelected,
                ]}
                onPress={() => handleSelectStudent(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentAvatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentGrade}>{item.grade}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}

      {/* Analytics content (after student is selected) */}
      {selectedStudentId && !showStudentList && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Selected student info bar */}
          <View style={styles.studentInfoBar}>
            <View style={styles.studentInfoBarLeft}>
              <View style={styles.studentAvatarLarge}>
                <Text style={styles.studentAvatarLargeText}>
                  {selectedStudent?.name.charAt(0)}
                </Text>
              </View>
              <View>
                <Text style={styles.studentInfoName}>{selectedStudent?.name}</Text>
                <Text style={styles.studentInfoGrade}>{selectedStudent?.grade}</Text>
              </View>
            </View>
            <Button
              mode="contained"
              icon="brain"
              onPress={handleRunDiagnosis}
              loading={isAnalyzing}
              disabled={isAnalyzing}
            >
              AI 진단 실행
            </Button>
          </View>

          {/* Loading state */}
          {isAnalyzing && !studentAnalytics && (
            <AnalysisSkeleton step={analysisStep} />
          )}

          {/* Error */}
          {error && !studentAnalytics && (
            <View style={styles.errorCard}>
              <MaterialCommunityIcons name="alert-circle" size={24} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Analytics data */}
          {studentAnalytics && (
            <>
              {/* Summary stats */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{studentAnalytics.overallScore}점</Text>
                  <Text style={styles.statLabel}>전체 점수</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{correctRate}%</Text>
                  <Text style={styles.statLabel}>정답률</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{studentAnalytics.totalSolved}</Text>
                  <Text style={styles.statLabel}>풀이 수</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{studentAnalytics.streakDays}일</Text>
                  <Text style={styles.statLabel}>연속 학습</Text>
                </View>
              </View>

              {/* Two-column layout */}
              <View style={[styles.contentSection, isWide && styles.contentSectionWide]}>
                <View style={[styles.column, isWide && styles.columnLeft]}>
                  {/* Radar */}
                  {learningReport?.radarData && learningReport.radarData.length > 0 && (
                    <AchievementRadar
                      data={learningReport.radarData}
                      overallScore={studentAnalytics.overallScore}
                    />
                  )}

                  {/* Weakness */}
                  {weaknessAnalysis && weaknessAnalysis.weakTopics.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>취약 단원</Text>
                      {weaknessAnalysis.weakTopics.map((wt, i) => (
                        <WeaknessCard
                          key={i}
                          topic={wt.topic}
                          score={wt.score}
                          reason={wt.reason}
                          recommendedCount={wt.recommendedCount}
                        />
                      ))}
                    </View>
                  )}
                </View>

                <View style={[styles.column, isWide && styles.columnRight]}>
                  {/* Bar chart: subject correct rates */}
                  {learningReport?.barData && learningReport.barData.length > 0 && (
                    <View style={styles.chartCard}>
                      <Text style={styles.sectionTitle}>단원별 정답률</Text>
                      <BarChart
                        data={learningReport.barData}
                        width={Math.min(width - 48, 600)}
                        height={220}
                      />
                    </View>
                  )}

                  {/* Timeline */}
                  {learningReport?.timelineData && learningReport.timelineData.length > 0 && (
                    <ProgressTimeline data={learningReport.timelineData} />
                  )}

                  {/* Heatmap */}
                  {learningReport?.heatmapData && learningReport.heatmapData.length > 0 && (
                    <View style={styles.chartCard}>
                      <Text style={styles.sectionTitle}>단원 x 난이도 분석</Text>
                      <HeatMap
                        data={learningReport.heatmapData}
                        width={Math.min(width - 48, 600)}
                      />
                    </View>
                  )}
                </View>
              </View>

              {/* AI Summary */}
              {learningReport?.aiSummary && (
                <View style={styles.aiSummaryCard}>
                  <View style={styles.aiSummaryHeader}>
                    <MaterialCommunityIcons name="robot" size={20} color={colors.primary} />
                    <Text style={styles.aiSummaryTitle}>AI 종합 진단</Text>
                  </View>
                  <Text style={styles.aiSummaryText}>{learningReport.aiSummary}</Text>
                </View>
              )}

              {/* Partial loading indicator */}
              {isAnalyzing && weaknessAnalysis && !learningReport && (
                <View style={styles.partialLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.partialLoadingText}>
                    추가 분석을 진행하고 있습니다...
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.md,
    width: tabletSizes.minTouchTarget,
    height: tabletSizes.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  changeStudentButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
  },
  changeStudentText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },

  // Student selector
  selectorContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  searchbar: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  studentList: {
    flex: 1,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  studentItemSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  studentGrade: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  separator: {
    height: spacing.sm,
  },

  // Student info bar (when selected)
  studentInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  studentInfoBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  studentAvatarLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarLargeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  studentInfoName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  studentInfoGrade: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Content layout
  contentSection: {
    gap: spacing.lg,
  },
  contentSectionWide: {
    flexDirection: 'row',
  },
  column: {
    gap: spacing.md,
  },
  columnLeft: {
    flex: 1,
  },
  columnRight: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  // AI Summary
  aiSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  aiSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  aiSummaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Error
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error + '10',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    flex: 1,
  },

  // Partial loading
  partialLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary + '08',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  partialLoadingText: {
    fontSize: 13,
    color: colors.primary,
  },
});
```

---

## 9. Teacher Layout Registration

The `student-analytics.tsx` screen must be registered in the teacher layout but hidden from the tab bar (it is navigated to via stack push from the students screen).

**Modify** `app/(teacher)/_layout.tsx` -- add a new `Tabs.Screen` entry with `href: null`:

```typescript
// Add this inside the <Tabs> component, after the existing problem-extract entry:
<Tabs.Screen
  name="student-analytics"
  options={{
    href: null,  // hidden from tab bar
  }}
/>
```

The existing layout already uses this pattern for `problem-extract`. Follow the same pattern exactly.

---

## 10. Student Layout Registration (analytics tab)

**Modify** `app/(student)/_layout.tsx` -- add the analytics tab. Insert a new `Tabs.Screen` after the `homework` entry:

```typescript
<Tabs.Screen
  name="analytics"
  options={{
    title: '내 분석',
    tabBarLabel: '내 분석',
    tabBarIcon: ({ color, size }) => (
      <MaterialCommunityIcons name="chart-line" size={size} color={color} />
    ),
  }}
/>
```

**Note**: The `solve` screen in the student layout is navigated to via deep link (`solve?assignmentId=...`), so it should remain visible or hidden per the existing pattern. If adding the analytics tab pushes the tab count to 5, that is acceptable for a tablet layout.

---

## 11. Navigation Integration

### From teacher students screen to student-analytics

In `app/(teacher)/students.tsx`, the student cards should navigate to the analytics screen. Modify the `renderStudent` function's `Card` component to add an `onPress`:

```typescript
<Card
  style={styles.studentCard}
  onPress={() => router.push(`/(teacher)/student-analytics?studentId=${item.id}`)}
>
```

### Reading route params in student-analytics

At the top of `TeacherStudentAnalyticsScreen`, read the optional `studentId` param:

```typescript
import { useLocalSearchParams } from 'expo-router';

// Inside the component:
const { studentId: initialStudentId } = useLocalSearchParams<{ studentId?: string }>();

// In the useEffect that handles initial selection:
useEffect(() => {
  if (initialStudentId && !selectedStudentId) {
    handleSelectStudent(initialStudentId);
  }
}, [initialStudentId]);
```

---

## 12. Skeleton Loading and Step-by-Step Loading Pattern

This is the core UX pattern for AI analysis. The store must implement these transitions:

```
fetchAnalytics(studentId) called
  │
  ├─ Check cache (analyticsStore.lastAnalyzedAt)
  │   ├─ Cache valid → set data immediately, analysisStep = 'done'
  │   └─ Cache miss or stale → continue to AI analysis
  │
  ├─ Set isAnalyzing = true, analysisStep = 'weakness'
  │   └─ Call geminiAnalytics.analyzeStudentWeakness()
  │       └─ On success: set weaknessAnalysis, analysisStep = 'recommendations'
  │           (UI immediately renders WeaknessCards)
  │
  ├─ analysisStep = 'recommendations'
  │   └─ Call geminiAnalytics.recommendProblems()
  │       └─ On success: merge recommendations, analysisStep = 'report'
  │
  ├─ analysisStep = 'report'
  │   └─ Call geminiAnalytics.generateLearningReport()
  │       └─ On success: set learningReport, analysisStep = 'done'
  │
  └─ Set isAnalyzing = false, analysisStep = 'done'
```

The UI responds to each state change:
- `isAnalyzing && !studentAnalytics` → full-screen `AnalysisSkeleton`
- `isAnalyzing && weaknessAnalysis && !learningReport` → WeaknessCards visible + partial loading indicator
- `!isAnalyzing && studentAnalytics` → full dashboard

**Timeout handling**: If any step takes >15 seconds, the store should set `error` and `isAnalyzing = false`. The UI shows the error state with a "다시 시도" button.

---

## 13. Import Path Reference

All imports use path aliases or relative paths as established in the project. Here are the key import patterns used throughout this section:

```typescript
// From screen files (app/(student)/analytics.tsx, app/(teacher)/student-analytics.tsx):
import { colors, spacing, borderRadius, tabletSizes } from '../../src/constants/theme';
import { Button } from '../../src/components/common';
import { AchievementRadar, WeaknessCard, ProgressTimeline, AnalysisSkeleton } from '../../src/components/analytics';
import { RadarChart, LineChart, BarChart, HeatMap } from '../../src/components/charts';
import { useAnalyticsStore } from '../../src/stores/analyticsStore';
import { useAuthStore } from '../../src/stores/authStore';

// From analytics components (src/components/analytics/):
import RadarChart from '../charts/RadarChart';
import LineChart from '../charts/LineChart';
import { colors, spacing, borderRadius } from '../../constants/theme';

// From chart components (src/components/charts/):
import { colors } from '../../constants/theme';
// react-native-svg imports:
import Svg, { Polygon, Line, Circle, Text as SvgText, G, Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
```

---

## 14. Acceptance Criteria

Every item must pass before this section is considered complete.

### Chart Components
- [ ] `RadarChart` renders a correct polygon shape for 5, 6, 7, or 8 data points
- [ ] `RadarChart` shows concentric grid rings matching the polygon shape
- [ ] `RadarChart` labels appear outside the chart with topic name and score value
- [ ] `RadarChart` data polygon is filled with semi-transparent color
- [ ] `LineChart` renders connected dots for time-series data sorted by date
- [ ] `LineChart` shows Y-axis ticks (0-100) and X-axis date labels (MM/DD format)
- [ ] `LineChart` shows optional filled area below the line
- [ ] `LineChart` handles empty data with "데이터가 없습니다" message
- [ ] `BarChart` renders vertical bars with values above and labels below
- [ ] `BarChart` supports per-bar custom colors
- [ ] `BarChart` bars have rounded top corners
- [ ] `HeatMap` renders a grid with color intensity based on correct rate
- [ ] `HeatMap` shows legend explaining color scale (취약/보통/우수)
- [ ] `HeatMap` auto-detects X labels from data if not provided
- [ ] All charts are responsive (accept width/height props, tested at 320px and 700px)
- [ ] No external chart library used -- only `react-native-svg`

### Analytics Components
- [ ] `WeaknessCard` shows topic name, score bar, AI reason text, and recommended count
- [ ] `WeaknessCard` score bar color changes by severity (red <= 30, yellow <= 60, green > 60)
- [ ] `AchievementRadar` wraps RadarChart with title, overall score badge, and strongest/weakest summary
- [ ] `AchievementRadar` is responsive to screen width
- [ ] `ProgressTimeline` wraps LineChart with 1-week/4-week/3-month period toggle
- [ ] `ProgressTimeline` shows trend badge (+N / -N points) and summary stats (average, max, min, count)
- [ ] `AnalysisSkeleton` shows pulsing skeleton bars and a progress message
- [ ] `AnalysisSkeleton` shows step progress dots (취약점 분석 / 문제 추천 / 리포트 생성)

### Student Analytics Screen
- [ ] Screen fetches analytics on mount using current user's ID
- [ ] Shows `AnalysisSkeleton` during initial load
- [ ] Shows error state with retry button on failure
- [ ] Shows empty state when no data exists
- [ ] Shows 4 summary stat cards (overall score, correct rate, solved count, streak)
- [ ] Shows AchievementRadar with radar chart data
- [ ] Shows WeaknessCard list from weakness analysis
- [ ] Shows ProgressTimeline with timeline data
- [ ] Shows HeatMap with heatmap data
- [ ] Shows AI summary card with advice items
- [ ] "추천 문제 풀기" button is present at the bottom
- [ ] Two-column layout on wide screens (>768px), single column on narrow
- [ ] Step-by-step loading: weakness cards appear before full report loads

### Teacher Student Analytics Screen
- [ ] Screen shows student selector list on initial load
- [ ] Search bar filters students by name or grade
- [ ] Selecting a student loads their analytics and hides the selector
- [ ] "학생 변경" button re-shows the selector
- [ ] "AI 진단 실행" button triggers manual re-analysis
- [ ] AI diagnosis button shows loading state while analyzing
- [ ] Displays same analytics content as student screen (radar, weakness, timeline, heatmap, bar chart)
- [ ] Back button navigates to previous screen
- [ ] Supports `studentId` URL parameter for direct navigation from students list
- [ ] Step-by-step loading works the same as student screen

### Layout Integration
- [ ] `analytics` tab appears in student bottom tab bar with "내 분석" label and chart-line icon
- [ ] `student-analytics` is registered in teacher layout with `href: null` (hidden from tab bar)
- [ ] Teacher students screen card press navigates to student-analytics with studentId param

### General
- [ ] All components use project design tokens (colors, spacing, borderRadius from theme.ts)
- [ ] All components render correctly on both portrait and landscape tablet orientations
- [ ] No TypeScript errors in any file
- [ ] No unused imports
- [ ] All text is in Korean
