import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Text, ProgressBar, Portal, Dialog, Button as PaperButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DrawingCanvas, useCanvasControls, CanvasToolbar } from '../../src/components/canvas';
import { colors, spacing, typography, opacity, opacityToHex, borderRadius } from '../../src/constants/theme';
import { useRoleTheme, useResponsive } from '../../src/hooks';
import { CanvasTool, CanvasBackground } from '../../src/types';

// Mock 문제 데이터
const mockProblems = [
  {
    id: '1',
    content: '다음 이차방정식을 풀어라.\n\nx² - 5x + 6 = 0',
    imageUrl: null,
    points: 10,
    subject: '이차방정식',
  },
  {
    id: '2',
    content: '다음 이차방정식의 근을 구하시오.\n\n2x² + 3x - 2 = 0',
    imageUrl: null,
    points: 10,
    subject: '이차방정식',
  },
  {
    id: '3',
    content: '이차방정식 x² - 4x + k = 0이 중근을 가질 때, 상수 k의 값을 구하시오.',
    imageUrl: null,
    points: 15,
    subject: '이차방정식',
  },
];

// 문제 번호 버튼 컴포넌트
interface ProblemNumberButtonProps {
  number: number;
  isActive: boolean;
  isCompleted: boolean;
  onPress: () => void;
  accentColor: string;
}

const ProblemNumberButton: React.FC<ProblemNumberButtonProps> = ({
  number,
  isActive,
  isCompleted,
  onPress,
  accentColor,
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
      <Text
        style={[
          styles.problemNumberText,
          isActive && styles.problemNumberTextActive,
        ]}
      >
        {number}
      </Text>
    )}
  </TouchableOpacity>
);

export default function SolveScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [completedProblems, setCompletedProblems] = useState<Set<number>>(new Set());
  const { isTablet, isLandscape: rawIsLandscape, width: screenWidth, height: screenHeight } = useResponsive();
  const { accent } = useRoleTheme();

  // 가로 모드 판단 (태블릿 가로 모드)
  const isLandscape = rawIsLandscape && isTablet;

  // 캔버스 상태
  const [tool, setTool] = useState<CanvasTool>('pen');
  const [strokeColor, setStrokeColor] = useState(colors.canvasBlack);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [background, setBackground] = useState<CanvasBackground>('blank');

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Submit dialog state
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const canvasControls = useCanvasControls();

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 캔버스 크기 계산
  const canvasWidth = isLandscape
    ? (screenWidth - spacing.lg * 3) * 0.55  // 풀이 영역 55%
    : screenWidth - spacing.lg * 2;
  const canvasHeight = isLandscape
    ? screenHeight - 180
    : 400;

  const currentProblem = mockProblems[currentProblemIndex];
  const progress = (currentProblemIndex + 1) / mockProblems.length;

  const handlePrevious = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(currentProblemIndex - 1);
      canvasControls.clear();
    }
  };

  const handleNext = () => {
    if (currentProblemIndex < mockProblems.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
      canvasControls.clear();
    }
  };

  const handleSave = () => {
    setCompletedProblems(prev => new Set(prev).add(currentProblemIndex));
    // TODO: 풀이 이미지 저장
  };

  const handleSubmitAll = () => {
    const unsolvedCount = mockProblems.length - completedProblems.size;
    if (unsolvedCount > 0) {
      setShowSubmitDialog(true);
    } else {
      confirmSubmit();
    }
  };

  const confirmSubmit = () => {
    setShowSubmitDialog(false);
    // TODO: actual submission logic
    alert('모든 풀이가 제출되었습니다!');
    router.back();
  };

  const goToProblem = (index: number) => {
    setCurrentProblemIndex(index);
    canvasControls.clear();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="뒤로 가기" accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.assignmentInfo}>
            <Text style={styles.assignmentTitle}>이차방정식 연습</Text>
            <View style={styles.assignmentMeta}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.assignmentMetaText}>오늘 마감</Text>
            </View>
          </View>
        </View>

        <View style={styles.timerContainer}>
          <MaterialCommunityIcons name="timer-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {completedProblems.size}/{mockProblems.length} 완료
            </Text>
            <ProgressBar
              progress={completedProblems.size / mockProblems.length}
              color={colors.success}
              style={styles.headerProgress}
              accessibilityLabel={`문제 진행률 ${Math.round((completedProblems.size / mockProblems.length) * 100)}퍼센트`}
            />
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitAll} accessibilityLabel="숙제 제출" accessibilityRole="button">
            <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>제출</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 문제 번호 네비게이션 */}
      <View style={styles.problemNavigation}>
        <View style={styles.problemNumbers}>
          {mockProblems.map((_, index) => (
            <ProblemNumberButton
              key={index}
              number={index + 1}
              isActive={currentProblemIndex === index}
              isCompleted={completedProblems.has(index)}
              onPress={() => goToProblem(index)}
              accentColor={accent}
            />
          ))}
        </View>
        <View style={styles.navArrows}>
          <TouchableOpacity
            style={[styles.navArrowButton, currentProblemIndex === 0 && styles.navArrowButtonDisabled]}
            onPress={handlePrevious}
            disabled={currentProblemIndex === 0}
            accessibilityLabel="이전 문제"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={currentProblemIndex === 0 ? colors.textDisabled : colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navArrowButton, currentProblemIndex === mockProblems.length - 1 && styles.navArrowButtonDisabled]}
            onPress={handleNext}
            disabled={currentProblemIndex === mockProblems.length - 1}
            accessibilityLabel="다음 문제"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={currentProblemIndex === mockProblems.length - 1 ? colors.textDisabled : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 메인 컨텐츠 */}
      <View style={[styles.mainContent, isLandscape && styles.mainContentLandscape]}>
        {/* 문제 영역 */}
        <View style={[styles.problemSection, isLandscape && styles.problemSectionLandscape]}>
          <View style={styles.problemCard}>
            <View style={styles.problemHeader}>
              <View style={styles.problemBadge}>
                <Text style={styles.problemBadgeText}>문제 {currentProblemIndex + 1}</Text>
              </View>
              <View style={styles.pointsBadge}>
                <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
                <Text style={styles.pointsText}>{currentProblem.points}점</Text>
              </View>
            </View>

            <ScrollView
              style={styles.problemScrollView}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.problemText}>{currentProblem.content}</Text>
              {currentProblem.imageUrl && (
                <Image
                  source={{ uri: currentProblem.imageUrl }}
                  style={styles.problemImage}
                  resizeMode="contain"
                />
              )}
            </ScrollView>

            <View style={styles.problemFooter}>
              <View style={styles.subjectTag}>
                <MaterialCommunityIcons name="tag" size={14} color={colors.primary} />
                <Text style={styles.subjectTagText}>{currentProblem.subject}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 풀이 영역 */}
        <View style={[styles.canvasSection, isLandscape && styles.canvasSectionLandscape]}>
          <View style={styles.canvasCard}>
            <View style={styles.canvasHeader}>
              <View style={styles.canvasTitleRow}>
                <MaterialCommunityIcons name="draw" size={18} color={colors.primary} />
                <Text style={styles.canvasLabel}>풀이 작성</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  completedProblems.has(currentProblemIndex) && styles.saveButtonCompleted
                ]}
                onPress={handleSave}
                accessibilityLabel={completedProblems.has(currentProblemIndex) ? "저장 완료" : "풀이 저장"}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name={completedProblems.has(currentProblemIndex) ? "check" : "content-save"}
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.saveButtonText}>
                  {completedProblems.has(currentProblemIndex) ? '저장됨' : '저장'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.canvasWrapper}>
              <DrawingCanvas
                width={canvasWidth}
                height={canvasHeight}
                strokeColor={strokeColor}
                strokeWidth={strokeWidth}
                tool={tool}
                background={background}
                strokes={canvasControls.strokes}
                onStrokeEnd={canvasControls.addStroke}
              />
            </View>
          </View>
        </View>
      </View>

      {/* 툴바 */}
      <CanvasToolbar
        selectedTool={tool}
        onToolChange={setTool}
        selectedColor={strokeColor}
        onColorChange={setStrokeColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        background={background}
        onBackgroundChange={setBackground}
        onUndo={canvasControls.undo}
        onRedo={canvasControls.redo}
        onClear={canvasControls.clear}
        canUndo={canvasControls.canUndo}
        canRedo={canvasControls.canRedo}
      />

      {/* Submit Confirmation Dialog */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: spacing.md,
  },
  assignmentInfo: {
    gap: 2,
  },
  assignmentTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  assignmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assignmentMetaText: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textSecondary,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  timerText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressInfo: {
    alignItems: 'flex-end',
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  headerProgress: {
    width: 80,
    height: 4,
    borderRadius: 2,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  submitButtonText: {
    ...typography.label,
    color: '#FFFFFF',
  },

  // 문제 번호 네비게이션
  problemNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  problemNumbers: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  problemNumberButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  problemNumberButtonActive: {
    backgroundColor: colors.primary,
  },
  problemNumberButtonCompleted: {
    backgroundColor: colors.success + opacityToHex(opacity.muted),
    borderWidth: 1,
    borderColor: colors.success,
  },
  problemNumberText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  problemNumberTextActive: {
    color: '#FFFFFF',
  },
  navArrows: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  navArrowButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowButtonDisabled: {
    opacity: 0.5,
  },

  // 메인 컨텐츠
  mainContent: {
    flex: 1,
    padding: spacing.md,
  },
  mainContentLandscape: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  // 문제 영역
  problemSection: {
    marginBottom: spacing.md,
  },
  problemSectionLandscape: {
    flex: 0.45,
    marginBottom: 0,
  },
  problemCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    height: '100%',
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  problemBadge: {
    backgroundColor: colors.primary + opacityToHex(opacity.subtle),
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  problemBadgeText: {
    ...typography.bodySmall,
    fontWeight: '500',
    fontSize: 13,
    color: colors.primary,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warning + opacityToHex(opacity.subtle),
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointsText: {
    ...typography.bodySmall,
    fontWeight: '500',
    fontSize: 13,
    color: colors.warning,
  },
  problemScrollView: {
    flex: 1,
  },
  problemText: {
    ...typography.subtitle,
    fontSize: 18,
    lineHeight: 30,
    color: colors.textPrimary,
  },
  problemImage: {
    width: '100%',
    height: 200,
    marginTop: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
  },
  problemFooter: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subjectTagText: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.primary,
  },

  // 풀이 영역
  canvasSection: {
    flex: 1,
  },
  canvasSectionLandscape: {
    flex: 0.55,
  },
  canvasCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    height: '100%',
  },
  canvasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  canvasTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  canvasLabel: {
    ...typography.label,
    color: colors.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
    minHeight: 44,
  },
  saveButtonCompleted: {
    backgroundColor: colors.success,
  },
  saveButtonText: {
    ...typography.bodySmall,
    fontWeight: '500',
    fontSize: 13,
    color: '#FFFFFF',
  },
  canvasWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
