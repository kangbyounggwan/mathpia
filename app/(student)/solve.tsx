import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Text, ProgressBar, Portal, Dialog, Button as PaperButton, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, Text as SvgText, G, Rect, Defs, Marker, Polygon } from 'react-native-svg';
import { DrawingCanvas, useCanvasControls, CanvasToolbar } from '../../src/components/canvas';
import MathText from '../../src/components/common/MathText';
import { colors, spacing, typography, opacity, opacityToHex, borderRadius } from '../../src/constants/theme';
import { useRoleTheme, useResponsive } from '../../src/hooks';
import { CanvasTool, CanvasBackground } from '../../src/types';

// ─── SVG Graph Component ───────────────────────────────────────────
interface GraphPoint { x: number; y: number }
interface GraphConfig {
  width?: number;
  height?: number;
  xRange: [number, number];
  yRange: [number, number];
  curves: { points: GraphPoint[]; color: string; dashed?: boolean; label?: string }[];
  dots?: { x: number; y: number; color: string; label?: string }[];
  asymptotes?: { type: 'vertical' | 'horizontal'; value: number; color?: string }[];
  gridStep?: number;
}

function SolutionGraph({ config }: { config: GraphConfig }) {
  const W = config.width || 280;
  const H = config.height || 220;
  const pad = { top: 20, right: 25, bottom: 30, left: 35 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;
  const [xMin, xMax] = config.xRange;
  const [yMin, yMax] = config.yRange;
  const step = config.gridStep || 1;

  const toSvgX = (x: number) => pad.left + ((x - xMin) / (xMax - xMin)) * cw;
  const toSvgY = (y: number) => pad.top + ((yMax - y) / (yMax - yMin)) * ch;

  // Grid lines
  const gridLines: React.ReactNode[] = [];
  for (let x = Math.ceil(xMin / step) * step; x <= xMax; x += step) {
    if (x === 0) continue;
    gridLines.push(
      <Line key={`gx${x}`} x1={toSvgX(x)} y1={pad.top} x2={toSvgX(x)} y2={H - pad.bottom}
        stroke="#E8E8E8" strokeWidth={1} />
    );
    gridLines.push(
      <SvgText key={`lx${x}`} x={toSvgX(x)} y={H - pad.bottom + 14}
        fontSize={10} fill="#999" textAnchor="middle">{x}</SvgText>
    );
  }
  for (let y = Math.ceil(yMin / step) * step; y <= yMax; y += step) {
    if (y === 0) continue;
    gridLines.push(
      <Line key={`gy${y}`} x1={pad.left} y1={toSvgY(y)} x2={W - pad.right} y2={toSvgY(y)}
        stroke="#E8E8E8" strokeWidth={1} />
    );
    gridLines.push(
      <SvgText key={`ly${y}`} x={pad.left - 6} y={toSvgY(y) + 4}
        fontSize={10} fill="#999" textAnchor="end">{y}</SvgText>
    );
  }

  // Origin label
  const originX = toSvgX(0);
  const originY = toSvgY(0);

  // Asymptotes
  const asymptoteLines = (config.asymptotes || []).map((a, i) => {
    const c = a.color || '#EF4444';
    if (a.type === 'vertical') {
      return <Line key={`as${i}`} x1={toSvgX(a.value)} y1={pad.top} x2={toSvgX(a.value)} y2={H - pad.bottom}
        stroke={c} strokeWidth={1.5} strokeDasharray="6,4" />;
    }
    return <Line key={`as${i}`} x1={pad.left} y1={toSvgY(a.value)} x2={W - pad.right} y2={toSvgY(a.value)}
      stroke={c} strokeWidth={1.5} strokeDasharray="6,4" />;
  });

  // Curves
  const curvePaths = config.curves.map((curve, ci) => {
    const clipped = curve.points.filter(p =>
      p.x >= xMin && p.x <= xMax && p.y >= yMin - 2 && p.y <= yMax + 2
    );
    if (clipped.length < 2) return null;
    const d = clipped.map((p, i) => {
      const sx = toSvgX(p.x);
      const sy = Math.max(pad.top - 5, Math.min(H - pad.bottom + 5, toSvgY(p.y)));
      return `${i === 0 ? 'M' : 'L'}${sx},${sy}`;
    }).join(' ');
    return <Path key={`c${ci}`} d={d} stroke={curve.color} strokeWidth={2.5} fill="none"
      strokeDasharray={curve.dashed ? '6,4' : undefined} />;
  });

  // Dots
  const dotElements = (config.dots || []).map((dot, di) => (
    <G key={`d${di}`}>
      <Circle cx={toSvgX(dot.x)} cy={toSvgY(dot.y)} r={5} fill={dot.color} stroke="#FFF" strokeWidth={2} />
      {dot.label && (
        <SvgText x={toSvgX(dot.x) + 8} y={toSvgY(dot.y) - 8}
          fontSize={10} fontWeight="600" fill={dot.color}>{dot.label}</SvgText>
      )}
    </G>
  ));

  // Curve labels
  const curveLabels = config.curves.filter(c => c.label).map((curve, i) => {
    const mid = curve.points[Math.floor(curve.points.length * 0.75)];
    if (!mid) return null;
    return (
      <SvgText key={`cl${i}`} x={toSvgX(mid.x) + 6} y={toSvgY(mid.y) - 6}
        fontSize={11} fontWeight="600" fill={curve.color}>{curve.label}</SvgText>
    );
  });

  return (
    <View style={graphStyles.container}>
      <Svg width={W} height={H}>
        <Rect x={0} y={0} width={W} height={H} fill="#FAFBFC" rx={8} />
        {gridLines}
        {/* X axis */}
        {yMin <= 0 && yMax >= 0 && (
          <Line x1={pad.left} y1={originY} x2={W - pad.right} y2={originY}
            stroke="#333" strokeWidth={1.5} />
        )}
        {/* Y axis */}
        {xMin <= 0 && xMax >= 0 && (
          <Line x1={originX} y1={pad.top} x2={originX} y2={H - pad.bottom}
            stroke="#333" strokeWidth={1.5} />
        )}
        {/* Axis arrows */}
        {xMin <= 0 && xMax >= 0 && (
          <SvgText x={originX + 4} y={pad.top - 4} fontSize={11} fill="#333">y</SvgText>
        )}
        {yMin <= 0 && yMax >= 0 && (
          <SvgText x={W - pad.right + 6} y={originY + 4} fontSize={11} fill="#333">x</SvgText>
        )}
        {/* O label */}
        {xMin <= 0 && xMax >= 0 && yMin <= 0 && yMax >= 0 && (
          <SvgText x={originX - 10} y={originY + 14} fontSize={10} fill="#666">O</SvgText>
        )}
        {asymptoteLines}
        {curvePaths}
        {dotElements}
        {curveLabels}
      </Svg>
    </View>
  );
}

const graphStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
});

// ─── Step type with optional graph ────────────────────────────────
interface SolutionStep {
  title: string;
  content: string;
  graph?: GraphConfig;
  highlight?: 'info' | 'warning' | 'success';
}

interface ProblemSolution {
  steps: SolutionStep[];
  hint: string;
  keyFormula: string;
  concept: string;
}

interface MockProblem {
  id: string;
  content: string;
  imageUrl: string | null;
  points: number;
  subject: string;
  difficulty: string;
  answer: string;
  solution: ProblemSolution;
}

// ─── Helper: generate curve points ───────────────────────────────
function generateCurve(fn: (x: number) => number | null, xMin: number, xMax: number, step = 0.1): GraphPoint[] {
  const pts: GraphPoint[] = [];
  for (let x = xMin; x <= xMax; x += step) {
    const y = fn(x);
    if (y !== null && isFinite(y) && Math.abs(y) < 50) {
      pts.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
    }
  }
  return pts;
}

// ─── Mock Problems: Graph & Function ──────────────────────────────
const mockProblems: MockProblem[] = [
  {
    id: '1',
    content: '이차함수 $y = x^2 - 4x + 3$의 꼭짓점의 좌표, 축의 방정식, $x$절편을 구하고 그래프의 개형을 그리시오.',
    imageUrl: null,
    points: 15,
    subject: '이차함수의 그래프',
    difficulty: '상',
    answer: '꼭짓점 $(2, -1)$, 축 $x = 2$, $x$절편 $x = 1, 3$',
    solution: {
      concept: '이차함수의 표준형 변환과 그래프 해석',
      keyFormula: '$y = a(x - p)^2 + q$에서 꼭짓점 $(p, q)$, 축의 방정식 $x = p$',
      steps: [
        {
          title: '완전제곱식으로 변환',
          content: '$y = x^2 - 4x + 3$\n$= (x^2 - 4x + 4) - 4 + 3$\n$= (x - 2)^2 - 1$',
          highlight: 'info',
        },
        {
          title: '꼭짓점과 축 구하기',
          content: '$y = (x - 2)^2 - 1$에서\n꼭짓점: $(2, -1)$\n축의 방정식: $x = 2$',
        },
        {
          title: 'x절편 구하기 (y = 0)',
          content: '$(x - 2)^2 - 1 = 0$\n$(x - 2)^2 = 1$\n$x - 2 = \\pm 1$\n$x = 1$ 또는 $x = 3$',
        },
        {
          title: 'y절편 구하기 (x = 0)',
          content: '$y = 0^2 - 4(0) + 3 = 3$\ny절편: $(0, 3)$',
        },
        {
          title: '그래프 그리기',
          content: '아래로 볼록한 포물선이며, 꼭짓점 $(2, -1)$을 지나고 $x = 1, 3$에서 $x$축과 만납니다.',
          graph: {
            xRange: [-1, 5],
            yRange: [-2, 6],
            curves: [
              {
                points: generateCurve(x => x * x - 4 * x + 3, -1, 5),
                color: '#4A90D9',
                label: 'y = x²-4x+3',
              },
            ],
            dots: [
              { x: 2, y: -1, color: '#EF4444', label: '꼭짓점(2,-1)' },
              { x: 1, y: 0, color: '#10B981', label: '(1,0)' },
              { x: 3, y: 0, color: '#10B981', label: '(3,0)' },
              { x: 0, y: 3, color: '#F59E0B', label: '(0,3)' },
            ],
            asymptotes: [
              { type: 'vertical', value: 2, color: '#94A3B8' },
            ],
          },
          highlight: 'success',
        },
      ],
      hint: '이차함수 $y = ax^2 + bx + c$를 $y = a(x-p)^2 + q$ 형태로 변환하면 꼭짓점 $(p, q)$를 바로 알 수 있습니다. 완전제곱식 변환이 핵심!',
    },
  },
  {
    id: '2',
    content: '방정식 $|2x - 3| = x + 1$의 모든 실수 해를 구하시오.',
    imageUrl: null,
    points: 15,
    subject: '절대값 함수',
    difficulty: '상',
    answer: '$x = \\frac{2}{3}$ 또는 $x = 4$',
    solution: {
      concept: '절대값 방정식의 그래프적 해석 — 두 함수의 교점',
      keyFormula: '$|f(x)| = g(x)$ → $y = |f(x)|$와 $y = g(x)$의 교점의 $x$좌표',
      steps: [
        {
          title: '절대값 정의로 분리',
          content: '$|2x - 3| = \\begin{cases} 2x - 3 & (x \\geq \\frac{3}{2}) \\\\ -(2x - 3) & (x < \\frac{3}{2}) \\end{cases}$',
          highlight: 'info',
        },
        {
          title: 'Case 1: x ≥ 3/2',
          content: '$2x - 3 = x + 1$\n$x = 4$\n$x = 4 \\geq \\frac{3}{2}$ ✓ (조건 만족)',
          highlight: 'success',
        },
        {
          title: 'Case 2: x < 3/2',
          content: '$-(2x - 3) = x + 1$\n$-2x + 3 = x + 1$\n$-3x = -2$\n$x = \\frac{2}{3}$\n$x = \\frac{2}{3} < \\frac{3}{2}$ ✓ (조건 만족)',
          highlight: 'success',
        },
        {
          title: '그래프로 검증',
          content: '$y = |2x - 3|$ (V자 그래프)와 $y = x + 1$ (직선)의 교점 확인:',
          graph: {
            xRange: [-1, 6],
            yRange: [-1, 8],
            curves: [
              {
                points: generateCurve(x => Math.abs(2 * x - 3), -1, 6),
                color: '#4A90D9',
                label: 'y=|2x-3|',
              },
              {
                points: generateCurve(x => x + 1, -1, 6),
                color: '#EF4444',
                label: 'y=x+1',
              },
            ],
            dots: [
              { x: 4, y: 5, color: '#10B981', label: '(4,5)' },
              { x: 2 / 3, y: 5 / 3, color: '#10B981', label: '(⅔,⁵⁄₃)' },
              { x: 1.5, y: 0, color: '#94A3B8', label: 'x=³⁄₂' },
            ],
          },
        },
      ],
      hint: '절대값 방정식은 경우를 나눠 풀되, 반드시 각 경우의 조건을 만족하는지 검증해야 합니다. 그래프로 교점을 확인하면 해의 개수를 파악할 수 있습니다.',
    },
  },
  {
    id: '3',
    content: '유리함수 $y = \\frac{2x + 1}{x - 1}$의 점근선의 방정식을 구하고, 그래프의 개형을 그리시오.',
    imageUrl: null,
    points: 20,
    subject: '유리함수와 점근선',
    difficulty: '상',
    answer: '수직점근선: $x = 1$, 수평점근선: $y = 2$',
    solution: {
      concept: '유리함수의 점근선과 그래프 변환',
      keyFormula: '$y = \\frac{a}{x - p} + q$ → 수직점근선 $x = p$, 수평점근선 $y = q$',
      steps: [
        {
          title: '함수 변환 (나눗셈)',
          content: '$y = \\frac{2x + 1}{x - 1}$을 변형합니다.\n$= \\frac{2(x - 1) + 3}{x - 1}$\n$= 2 + \\frac{3}{x - 1}$',
          highlight: 'info',
        },
        {
          title: '수직점근선',
          content: '분모 $= 0$이 되는 $x$ 값:\n$x - 1 = 0$ → $x = 1$\n\n수직점근선: $x = 1$',
        },
        {
          title: '수평점근선',
          content: '$x → \\pm \\infty$일 때 $\\frac{3}{x-1} → 0$이므로\n$y → 2$\n\n수평점근선: $y = 2$',
        },
        {
          title: '주요 점 계산',
          content: '$x = 0$: $y = \\frac{1}{-1} = -1$ → $(0, -1)$\n$y = 0$: $2x + 1 = 0$, $x = -\\frac{1}{2}$ → $(-\\frac{1}{2}, 0)$\n$x = 2$: $y = \\frac{5}{1} = 5$ → $(2, 5)$\n$x = 4$: $y = \\frac{9}{3} = 3$ → $(4, 3)$',
        },
        {
          title: '그래프 그리기',
          content: '쌍곡선이 점근선 $x = 1$, $y = 2$를 기준으로 두 영역에 나뉩니다.',
          graph: {
            width: 300,
            height: 240,
            xRange: [-4, 7],
            yRange: [-6, 10],
            gridStep: 2,
            curves: [
              {
                points: generateCurve(x => (2 * x + 1) / (x - 1), -4, 0.85),
                color: '#4A90D9',
              },
              {
                points: generateCurve(x => (2 * x + 1) / (x - 1), 1.15, 7),
                color: '#4A90D9',
                label: 'y=(2x+1)/(x-1)',
              },
            ],
            dots: [
              { x: 0, y: -1, color: '#10B981', label: '(0,-1)' },
              { x: -0.5, y: 0, color: '#10B981', label: '(-½,0)' },
              { x: 2, y: 5, color: '#F59E0B', label: '(2,5)' },
              { x: 4, y: 3, color: '#F59E0B', label: '(4,3)' },
            ],
            asymptotes: [
              { type: 'vertical', value: 1, color: '#EF4444' },
              { type: 'horizontal', value: 2, color: '#EF4444' },
            ],
          },
          highlight: 'success',
        },
      ],
      hint: '유리함수는 대분수 형태 $y = q + \\frac{r}{x - p}$로 변환하면 점근선을 바로 알 수 있습니다. $y = \\frac{k}{x}$ 그래프를 평행이동한 것으로 이해하세요.',
    },
  },
];

// ─── Problem Number Button ────────────────────────────────────────
interface ProblemNumberButtonProps {
  number: number;
  isActive: boolean;
  isCompleted: boolean;
  onPress: () => void;
  accentColor: string;
}

const ProblemNumberButton: React.FC<ProblemNumberButtonProps> = ({
  number, isActive, isCompleted, onPress, accentColor,
}) => (
  <TouchableOpacity
    style={[
      styles.problemNumberButton,
      isActive && [styles.problemNumberButtonActive, { backgroundColor: accentColor }],
      isCompleted && !isActive && styles.problemNumberButtonCompleted,
    ]}
    onPress={onPress}
    accessibilityLabel={`문제 ${number}${isCompleted ? ' (완료)' : ''}${isActive ? ' (현재)' : ''}`}
    accessibilityRole="button"
  >
    {isCompleted && !isActive ? (
      <MaterialCommunityIcons name="check" size={16} color={colors.success} />
    ) : (
      <Text style={[styles.problemNumberText, isActive && styles.problemNumberTextActive]}>
        {number}
      </Text>
    )}
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────
export default function SolveScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [completedProblems, setCompletedProblems] = useState<Set<number>>(new Set());
  const { isTablet, isLandscape: rawIsLandscape, width: screenWidth, height: screenHeight } = useResponsive();
  const { accent } = useRoleTheme();

  const isLandscape = rawIsLandscape && isTablet;

  // Canvas
  const [tool, setTool] = useState<CanvasTool>('pen');
  const [strokeColor, setStrokeColor] = useState(colors.canvasBlack);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [background, setBackground] = useState<CanvasBackground>('blank');

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Dialogs
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // AI Solution
  const [showSolution, setShowSolution] = useState<Record<number, boolean>>({});
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [revealedSteps, setRevealedSteps] = useState<Record<number, number>>({});

  const toggleSolution = (index: number) => {
    if (showSolution[index]) {
      setShowSolution(prev => ({ ...prev, [index]: false }));
      setRevealedSteps(prev => ({ ...prev, [index]: 0 }));
    } else {
      setSolutionLoading(true);
      setTimeout(() => {
        setSolutionLoading(false);
        setShowSolution(prev => ({ ...prev, [index]: true }));
        setRevealedSteps(prev => ({ ...prev, [index]: 1 }));
      }, 1000);
    }
  };

  const revealNextStep = (index: number) => {
    const totalSteps = mockProblems[index].solution.steps.length;
    setRevealedSteps(prev => ({
      ...prev,
      [index]: Math.min((prev[index] || 1) + 1, totalSteps),
    }));
  };

  const canvasControls = useCanvasControls();

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const canvasWidth = isLandscape
    ? (screenWidth - spacing.lg * 3) * 0.55
    : screenWidth - spacing.lg * 2;
  const canvasHeight = isLandscape ? screenHeight - 180 : 400;

  const currentProblem = mockProblems[currentProblemIndex];

  const handlePrevious = () => {
    if (currentProblemIndex > 0) { setCurrentProblemIndex(currentProblemIndex - 1); canvasControls.clear(); }
  };
  const handleNext = () => {
    if (currentProblemIndex < mockProblems.length - 1) { setCurrentProblemIndex(currentProblemIndex + 1); canvasControls.clear(); }
  };
  const handleSave = () => setCompletedProblems(prev => new Set(prev).add(currentProblemIndex));
  const handleSubmitAll = () => {
    if (mockProblems.length - completedProblems.size > 0) setShowSubmitDialog(true);
    else confirmSubmit();
  };
  const confirmSubmit = () => {
    setShowSubmitDialog(false);
    alert('모든 풀이가 제출되었습니다!');
    router.back();
  };
  const goToProblem = (i: number) => { setCurrentProblemIndex(i); canvasControls.clear(); };

  const revealed = revealedSteps[currentProblemIndex] || 0;
  const totalSteps = currentProblem.solution.steps.length;
  const allRevealed = revealed >= totalSteps;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.assignmentTitle}>함수와 그래프 연습</Text>
          <View style={styles.assignmentMeta}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.assignmentMetaText}>오늘 마감</Text>
          </View>
        </View>
        <View style={styles.timerContainer}>
          <MaterialCommunityIcons name="timer-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>{completedProblems.size}/{mockProblems.length} 완료</Text>
            <ProgressBar progress={completedProblems.size / mockProblems.length} color={colors.success} style={styles.headerProgress} />
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitAll}>
            <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>제출</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Problem nav */}
      <View style={styles.problemNavigation}>
        <View style={styles.problemNumbers}>
          {mockProblems.map((_, i) => (
            <ProblemNumberButton key={i} number={i + 1}
              isActive={currentProblemIndex === i} isCompleted={completedProblems.has(i)}
              onPress={() => goToProblem(i)} accentColor={accent} />
          ))}
        </View>
        <View style={styles.navArrows}>
          <TouchableOpacity style={[styles.navArrowButton, currentProblemIndex === 0 && styles.navArrowButtonDisabled]}
            onPress={handlePrevious} disabled={currentProblemIndex === 0}>
            <MaterialCommunityIcons name="chevron-left" size={24}
              color={currentProblemIndex === 0 ? colors.textDisabled : colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navArrowButton, currentProblemIndex === mockProblems.length - 1 && styles.navArrowButtonDisabled]}
            onPress={handleNext} disabled={currentProblemIndex === mockProblems.length - 1}>
            <MaterialCommunityIcons name="chevron-right" size={24}
              color={currentProblemIndex === mockProblems.length - 1 ? colors.textDisabled : colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content */}
      <View style={[styles.mainContent, isLandscape && styles.mainContentLandscape]}>
        {/* Problem area */}
        <View style={[styles.problemSection, isLandscape && styles.problemSectionLandscape]}>
          <ScrollView style={styles.problemCard} showsVerticalScrollIndicator={false}>
            <View style={styles.problemHeader}>
              <View style={styles.problemBadge}>
                <Text style={styles.problemBadgeText}>문제 {currentProblemIndex + 1}</Text>
              </View>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>{currentProblem.difficulty}</Text>
              </View>
              <View style={styles.pointsBadge}>
                <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
                <Text style={styles.pointsText}>{currentProblem.points}점</Text>
              </View>
            </View>

            <View style={styles.problemBody}>
              <MathText content={currentProblem.content} fontSize={17} />
            </View>

            <View style={styles.problemFooter}>
              <View style={styles.subjectTag}>
                <MaterialCommunityIcons name="tag" size={14} color={colors.primary} />
                <Text style={styles.subjectTagText}>{currentProblem.subject}</Text>
              </View>
              <TouchableOpacity
                style={[styles.aiSolveButton, showSolution[currentProblemIndex] && styles.aiSolveButtonActive]}
                onPress={() => toggleSolution(currentProblemIndex)}>
                {solutionLoading && !showSolution[currentProblemIndex] ? (
                  <ActivityIndicator size={14} color="#FFFFFF" />
                ) : (
                  <MaterialCommunityIcons
                    name={showSolution[currentProblemIndex] ? 'eye-off' : 'robot'}
                    size={16} color="#FFFFFF" />
                )}
                <Text style={styles.aiSolveButtonText}>
                  {showSolution[currentProblemIndex] ? '풀이 닫기' : 'AI 해결'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── AI Solution Panel ─────────────────────────── */}
            {showSolution[currentProblemIndex] && (
              <View style={styles.solutionPanel}>
                {/* Answer */}
                <View style={styles.solutionAnswerBox}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.solutionAnswerLabel}>정답</Text>
                    <MathText content={currentProblem.answer} fontSize={15} />
                  </View>
                </View>

                {/* Concept */}
                <View style={styles.conceptBox}>
                  <View style={styles.conceptHeader}>
                    <MaterialCommunityIcons name="book-open-variant" size={16} color="#7C3AED" />
                    <Text style={styles.conceptTitle}>핵심 개념</Text>
                  </View>
                  <Text style={styles.conceptText}>{currentProblem.solution.concept}</Text>
                </View>

                {/* Key Formula */}
                <View style={styles.solutionFormulaBox}>
                  <View style={styles.solutionFormulaHeader}>
                    <MaterialCommunityIcons name="function-variant" size={16} color="#0369A1" />
                    <Text style={styles.solutionFormulaTitle}>핵심 공식</Text>
                  </View>
                  <MathText content={currentProblem.solution.keyFormula} fontSize={14} />
                </View>

                {/* Steps (progressive reveal) */}
                <View style={styles.solutionStepsContainer}>
                  <View style={styles.solutionStepsHeader}>
                    <MaterialCommunityIcons name="stairs" size={16} color={colors.primary} />
                    <Text style={styles.solutionStepsTitle}>풀이 과정</Text>
                    <View style={styles.stepProgress}>
                      <Text style={styles.stepProgressText}>{revealed}/{totalSteps}</Text>
                    </View>
                  </View>

                  {currentProblem.solution.steps.slice(0, revealed).map((step, si) => (
                    <View key={si} style={[
                      styles.solutionStep,
                      step.highlight === 'info' && styles.stepHighlightInfo,
                      step.highlight === 'success' && styles.stepHighlightSuccess,
                      step.highlight === 'warning' && styles.stepHighlightWarning,
                    ]}>
                      <View style={styles.stepLeft}>
                        <View style={[
                          styles.stepNumberWrap,
                          si === revealed - 1 && styles.stepNumberWrapActive,
                        ]}>
                          <Text style={[
                            styles.stepNumber,
                            si === revealed - 1 && styles.stepNumberActive,
                          ]}>{si + 1}</Text>
                        </View>
                        {si < revealed - 1 && <View style={styles.stepConnector} />}
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <MathText content={step.content} fontSize={14} />
                        {step.graph && <SolutionGraph config={step.graph} />}
                      </View>
                    </View>
                  ))}

                  {!allRevealed && (
                    <TouchableOpacity style={styles.nextStepButton} onPress={() => revealNextStep(currentProblemIndex)}>
                      <MaterialCommunityIcons name="chevron-down-circle" size={20} color="#7C3AED" />
                      <Text style={styles.nextStepButtonText}>다음 단계 보기 ({revealed}/{totalSteps})</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Hint (show after all steps) */}
                {allRevealed && (
                  <View style={styles.solutionHintBox}>
                    <MaterialCommunityIcons name="lightbulb-on" size={16} color={colors.warning} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.solutionHintLabel}>학습 팁</Text>
                      <Text style={styles.solutionHintText}>{currentProblem.solution.hint}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>

        {/* Canvas area */}
        <View style={[styles.canvasSection, isLandscape && styles.canvasSectionLandscape]}>
          <View style={styles.canvasCard}>
            <View style={styles.canvasHeader}>
              <View style={styles.canvasTitleRow}>
                <MaterialCommunityIcons name="draw" size={18} color={colors.primary} />
                <Text style={styles.canvasLabel}>풀이 작성</Text>
              </View>
              <TouchableOpacity
                style={[styles.saveButton, completedProblems.has(currentProblemIndex) && styles.saveButtonCompleted]}
                onPress={handleSave}>
                <MaterialCommunityIcons
                  name={completedProblems.has(currentProblemIndex) ? 'check' : 'content-save'}
                  size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {completedProblems.has(currentProblemIndex) ? '저장됨' : '저장'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.canvasWrapper}>
              <DrawingCanvas width={canvasWidth} height={canvasHeight}
                strokeColor={strokeColor} strokeWidth={strokeWidth} tool={tool} background={background}
                strokes={canvasControls.strokes} onStrokeEnd={canvasControls.addStroke} />
            </View>
          </View>
        </View>
      </View>

      {/* Toolbar */}
      <CanvasToolbar selectedTool={tool} onToolChange={setTool}
        selectedColor={strokeColor} onColorChange={setStrokeColor}
        strokeWidth={strokeWidth} onStrokeWidthChange={setStrokeWidth}
        background={background} onBackgroundChange={setBackground}
        onUndo={canvasControls.undo} onRedo={canvasControls.redo} onClear={canvasControls.clear}
        canUndo={canvasControls.canUndo} canRedo={canvasControls.canRedo} />

      {/* Submit Dialog */}
      <Portal>
        <Dialog visible={showSubmitDialog} onDismiss={() => setShowSubmitDialog(false)}>
          <Dialog.Title style={{ fontFamily: 'NotoSansKR-Bold' }}>제출 확인</Dialog.Title>
          <Dialog.Content>
            <Text style={{ ...typography.body }}>
              풀지 않은 문제가 {mockProblems.length - completedProblems.size}개 있습니다. 제출하시겠습니까?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton mode="text" onPress={() => setShowSubmitDialog(false)}>취소</PaperButton>
            <PaperButton mode="contained" onPress={confirmSubmit}>제출</PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surfaceVariant, justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, marginLeft: spacing.md },
  assignmentTitle: { ...typography.subtitle, fontWeight: '700', color: colors.textPrimary },
  assignmentMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  assignmentMetaText: { ...typography.bodySmall, fontSize: 13, color: colors.textSecondary },
  timerContainer: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surfaceVariant, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  timerText: { ...typography.label, color: colors.textSecondary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  progressInfo: { alignItems: 'flex-end' },
  progressText: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  headerProgress: { width: 80, height: 4, borderRadius: 2 },
  submitButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8,
  },
  submitButtonText: { ...typography.label, color: '#FFFFFF' },

  // Problem nav
  problemNavigation: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  problemNumbers: { flexDirection: 'row', gap: spacing.sm },
  problemNumberButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surfaceVariant, justifyContent: 'center', alignItems: 'center',
  },
  problemNumberButtonActive: { backgroundColor: colors.primary },
  problemNumberButtonCompleted: {
    backgroundColor: colors.success + opacityToHex(opacity.muted),
    borderWidth: 1, borderColor: colors.success,
  },
  problemNumberText: { ...typography.label, color: colors.textSecondary },
  problemNumberTextActive: { color: '#FFFFFF' },
  navArrows: { flexDirection: 'row', gap: spacing.xs },
  navArrowButton: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: colors.surfaceVariant, justifyContent: 'center', alignItems: 'center',
  },
  navArrowButtonDisabled: { opacity: 0.5 },

  // Main content
  mainContent: { flex: 1, padding: spacing.md },
  mainContentLandscape: { flexDirection: 'row', gap: spacing.md },

  // Problem section
  problemSection: { marginBottom: spacing.md },
  problemSectionLandscape: { flex: 0.45, marginBottom: 0 },
  problemCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, height: '100%',
  },
  problemHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md,
  },
  problemBadge: {
    backgroundColor: colors.primary + opacityToHex(opacity.subtle),
    paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 6,
  },
  problemBadgeText: { ...typography.bodySmall, fontWeight: '500', fontSize: 13, color: colors.primary },
  difficultyBadge: {
    backgroundColor: '#EF4444' + opacityToHex(opacity.subtle),
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  difficultyText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
  pointsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto',
    backgroundColor: colors.warning + opacityToHex(opacity.subtle),
    paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 6,
  },
  pointsText: { ...typography.bodySmall, fontWeight: '500', fontSize: 13, color: colors.warning },
  problemBody: { paddingVertical: spacing.md, minHeight: 60 },
  problemFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },
  subjectTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subjectTagText: { ...typography.bodySmall, fontSize: 13, color: colors.primary },

  // AI button
  aiSolveButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#7C3AED', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, minHeight: 36,
  },
  aiSolveButtonActive: { backgroundColor: '#64748B' },
  aiSolveButtonText: { fontWeight: '700', fontSize: 13, color: '#FFFFFF' },

  // ── Solution Panel ──
  solutionPanel: {
    marginTop: spacing.md, borderTopWidth: 2, borderTopColor: '#7C3AED' + '30',
    paddingTop: spacing.md, gap: spacing.sm,
  },
  solutionAnswerBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: '#ECFDF5', padding: spacing.md, borderRadius: 12,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  solutionAnswerLabel: { fontWeight: '700', fontSize: 12, color: '#059669', marginBottom: 2 },

  conceptBox: {
    backgroundColor: '#F5F3FF', padding: spacing.md, borderRadius: 12,
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  conceptHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  conceptTitle: { fontWeight: '700', fontSize: 13, color: '#7C3AED' },
  conceptText: { fontSize: 13, color: '#4C1D95', lineHeight: 20 },

  solutionFormulaBox: {
    backgroundColor: '#F0F9FF', padding: spacing.md, borderRadius: 12,
    borderWidth: 1, borderColor: '#BAE6FD',
  },
  solutionFormulaHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  solutionFormulaTitle: { fontWeight: '700', fontSize: 13, color: '#0369A1' },

  solutionStepsContainer: { gap: 0 },
  solutionStepsHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md,
  },
  solutionStepsTitle: { fontWeight: '700', fontSize: 14, color: colors.primary },
  stepProgress: {
    marginLeft: 'auto', backgroundColor: colors.primary + opacityToHex(opacity.subtle),
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
  stepProgressText: { fontSize: 11, fontWeight: '600', color: colors.primary },

  solutionStep: {
    flexDirection: 'row', gap: spacing.sm, marginBottom: 4, paddingBottom: spacing.sm,
  },
  stepHighlightInfo: {
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: spacing.sm,
    borderLeftWidth: 3, borderLeftColor: '#3B82F6',
  },
  stepHighlightSuccess: {
    backgroundColor: '#F0FDF4', borderRadius: 10, padding: spacing.sm,
    borderLeftWidth: 3, borderLeftColor: '#22C55E',
  },
  stepHighlightWarning: {
    backgroundColor: '#FFFBEB', borderRadius: 10, padding: spacing.sm,
    borderLeftWidth: 3, borderLeftColor: '#F59E0B',
  },
  stepLeft: { alignItems: 'center', width: 28 },
  stepNumberWrap: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center',
  },
  stepNumberWrapActive: { backgroundColor: colors.primary },
  stepNumber: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  stepNumberActive: { color: '#FFFFFF' },
  stepConnector: {
    width: 2, flex: 1, backgroundColor: '#CBD5E1', marginTop: 4,
  },
  stepContent: { flex: 1 },
  stepTitle: {
    fontWeight: '700', color: colors.textPrimary, marginBottom: 4, fontSize: 14,
  },

  nextStepButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.sm,
    backgroundColor: '#F5F3FF', borderRadius: 10, borderWidth: 1, borderColor: '#DDD6FE',
    borderStyle: 'dashed',
  },
  nextStepButtonText: { fontWeight: '600', fontSize: 13, color: '#7C3AED' },

  solutionHintBox: {
    flexDirection: 'row', gap: spacing.sm,
    backgroundColor: '#FFFBEB', padding: spacing.md, borderRadius: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  solutionHintLabel: { fontWeight: '700', fontSize: 12, color: '#D97706', marginBottom: 2 },
  solutionHintText: { fontSize: 13, color: '#92400E', lineHeight: 20 },

  // Canvas
  canvasSection: { flex: 1 },
  canvasSectionLandscape: { flex: 0.55 },
  canvasCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, height: '100%' },
  canvasHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm,
  },
  canvasTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  canvasLabel: { ...typography.label, color: colors.primary },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: 6, minHeight: 44,
  },
  saveButtonCompleted: { backgroundColor: colors.success },
  saveButtonText: { ...typography.bodySmall, fontWeight: '500', fontSize: 13, color: '#FFFFFF' },
  canvasWrapper: {
    flex: 1, borderRadius: 12, overflow: 'hidden',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border,
  },
});
