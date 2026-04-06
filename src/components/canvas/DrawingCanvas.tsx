import React, { useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, PanResponder, Dimensions } from 'react-native';
import Svg, { Path, G, Line, Rect } from 'react-native-svg';
import { colors } from '../../constants/theme';
import { StrokeData, CanvasTool, CanvasBackground, Point } from '../../types';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  tool?: CanvasTool;
  background?: CanvasBackground;
  onStrokeEnd?: (stroke: StrokeData) => void;
  strokes?: StrokeData[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  width = Dimensions.get('window').width,
  height = 400,
  strokeColor = colors.canvasBlack,
  strokeWidth = 2,
  tool = 'pen',
  background = 'blank',
  onStrokeEnd,
  strokes: externalStrokes,
}) => {
  const [strokes, setStrokes] = useState<StrokeData[]>(externalStrokes || []);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Refs to keep current values in PanResponder callbacks
  const toolRef = useRef(tool);
  const strokeColorRef = useRef(strokeColor);
  const strokeWidthRef = useRef(strokeWidth);
  const currentStrokeRef = useRef<Point[]>([]);
  const isDrawingRef = useRef(false);

  // Update refs when props change
  toolRef.current = tool;
  strokeColorRef.current = strokeColor;
  strokeWidthRef.current = strokeWidth;

  const getStrokeOpacity = (strokeTool: CanvasTool) => {
    switch (strokeTool) {
      case 'highlighter':
        return 0.3;
      case 'pencil':
        return 0.8;
      default:
        return 1;
    }
  };

  const getStrokeWidth = (strokeTool: CanvasTool, baseWidth: number) => {
    switch (strokeTool) {
      case 'highlighter':
        return baseWidth * 4;
      case 'pencil':
        return baseWidth * 0.8;
      default:
        return baseWidth;
    }
  };

  const pointsToPath = (points: Point[]): string => {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];

      // 부드러운 곡선을 위한 quadratic bezier curve
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;

      path += ` Q ${p0.x} ${p0.y} ${midX} ${midY}`;
    }

    // 마지막 점까지 연결
    const lastPoint = points[points.length - 1];
    path += ` L ${lastPoint.x} ${lastPoint.y}`;

    return path;
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;

          if (toolRef.current === 'eraser') {
            // 지우개 모드: 터치한 위치의 획 삭제
            const touchX = locationX;
            const touchY = locationY;
            const eraserRadius = 20;

            setStrokes((prevStrokes) =>
              prevStrokes.filter((stroke) => {
                return !stroke.points.some(
                  (point) =>
                    Math.abs(point.x - touchX) < eraserRadius &&
                    Math.abs(point.y - touchY) < eraserRadius
                );
              })
            );
          } else {
            isDrawingRef.current = true;
            setIsDrawing(true);
            const newPoint = { x: locationX, y: locationY, pressure: 1 };
            currentStrokeRef.current = [newPoint];
            setCurrentStroke([newPoint]);
          }
        },
        onPanResponderMove: (evt) => {
          if (toolRef.current === 'eraser') {
            const { locationX, locationY } = evt.nativeEvent;
            const touchX = locationX;
            const touchY = locationY;
            const eraserRadius = 20;

            setStrokes((prevStrokes) =>
              prevStrokes.filter((stroke) => {
                return !stroke.points.some(
                  (point) =>
                    Math.abs(point.x - touchX) < eraserRadius &&
                    Math.abs(point.y - touchY) < eraserRadius
                );
              })
            );
          } else if (isDrawingRef.current) {
            const { locationX, locationY } = evt.nativeEvent;
            const newPoint = { x: locationX, y: locationY, pressure: 1 };
            currentStrokeRef.current = [...currentStrokeRef.current, newPoint];
            setCurrentStroke((prev) => [...prev, newPoint]);
          }
        },
        onPanResponderRelease: () => {
          if (toolRef.current !== 'eraser' && currentStrokeRef.current.length > 0) {
            const newStroke: StrokeData = {
              id: generateId(),
              points: currentStrokeRef.current,
              color: strokeColorRef.current,
              width: strokeWidthRef.current,
              tool: toolRef.current,
              timestamp: Date.now(),
            };

            setStrokes((prev) => [...prev, newStroke]);
            onStrokeEnd?.(newStroke);
          }

          currentStrokeRef.current = [];
          isDrawingRef.current = false;
          setCurrentStroke([]);
          setIsDrawing(false);
        },
      }),
    [onStrokeEnd]
  );

  const renderBackground = () => {
    if (background === 'blank') return null;

    const gridSize = 20;
    const lines = [];

    if (background === 'grid') {
      // 세로선
      for (let x = gridSize; x < width; x += gridSize) {
        lines.push(
          <Line
            key={`v-${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke={colors.border}
            strokeWidth={0.5}
          />
        );
      }
      // 가로선
      for (let y = gridSize; y < height; y += gridSize) {
        lines.push(
          <Line
            key={`h-${y}`}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke={colors.border}
            strokeWidth={0.5}
          />
        );
      }
    } else if (background === 'coordinate') {
      const centerX = width / 2;
      const centerY = height / 2;

      // 그리드
      for (let x = gridSize; x < width; x += gridSize) {
        lines.push(
          <Line
            key={`v-${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke={colors.border}
            strokeWidth={0.3}
          />
        );
      }
      for (let y = gridSize; y < height; y += gridSize) {
        lines.push(
          <Line
            key={`h-${y}`}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke={colors.border}
            strokeWidth={0.3}
          />
        );
      }

      // X축 (굵게)
      lines.push(
        <Line
          key="x-axis"
          x1={0}
          y1={centerY}
          x2={width}
          y2={centerY}
          stroke={colors.textSecondary}
          strokeWidth={1.5}
        />
      );
      // Y축 (굵게)
      lines.push(
        <Line
          key="y-axis"
          x1={centerX}
          y1={0}
          x2={centerX}
          y2={height}
          stroke={colors.textSecondary}
          strokeWidth={1.5}
        />
      );
    }

    return <G>{lines}</G>;
  };

  return (
    <View style={[styles.container, { width, height }]} {...panResponder.panHandlers}>
      <Svg width={width} height={height} style={styles.svg}>
        <Rect x={0} y={0} width={width} height={height} fill={colors.surface} />

        {renderBackground()}

        {/* 저장된 획들 */}
        {strokes.map((stroke) => (
          <Path
            key={stroke.id}
            d={pointsToPath(stroke.points)}
            stroke={stroke.color}
            strokeWidth={getStrokeWidth(stroke.tool, stroke.width)}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={getStrokeOpacity(stroke.tool)}
          />
        ))}

        {/* 현재 그리는 중인 획 */}
        {currentStroke.length > 0 && (
          <Path
            d={pointsToPath(currentStroke)}
            stroke={strokeColor}
            strokeWidth={getStrokeWidth(tool, strokeWidth)}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={getStrokeOpacity(tool)}
          />
        )}
      </Svg>
    </View>
  );
};

// 외부에서 캔버스 컨트롤용 훅
export const useCanvasControls = () => {
  const [strokes, setStrokes] = useState<StrokeData[]>([]);
  const [history, setHistory] = useState<StrokeData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addStroke = useCallback((stroke: StrokeData) => {
    const newStrokes = [...strokes, stroke];
    setStrokes(newStrokes);

    // 히스토리에 추가 (undo를 위해)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newStrokes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [strokes, history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setStrokes(history[historyIndex - 1]);
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setStrokes([]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setStrokes(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const clear = useCallback(() => {
    setStrokes([]);
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    strokes,
    addStroke,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
  };
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  svg: {
    backgroundColor: colors.surface,
  },
});
