// src/components/wrongNote/ReviewMode.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MathText from '../common/MathText';
import { colors, spacing, borderRadius } from '../../constants/theme';
import type { WrongNote, ReviewAttempt } from '../../types/wrongNote';

// ================================================================
// Minimal inline Gemini step-by-step generator
// Replace with: import { generateStepByStep } from '../../services/geminiHelper';
// when Section 08 is implemented.
// ================================================================
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

interface SolutionStep {
  step: number;
  title: string;
  content: string;
  formula?: string;
}

async function generateStepByStep(problemContent: string): Promise<SolutionStep[]> {
  try {
    const prompt = `수학 문제의 상세한 단계별 풀이를 작성해주세요.

[문제]
${problemContent}

각 단계를 명확히 구분하고, 모든 수식은 LaTeX로 표기.
JSON 배열로 출력 (다른 텍스트 없이 유효한 JSON만):
[{"step": 1, "title": "...", "content": "...", "formula": "..."}]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [{ step: 1, title: '풀이', content: '풀이를 생성할 수 없습니다.', formula: '' }];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed as SolutionStep[];
  } catch (error) {
    console.error('AI 풀이 생성 오류:', error);
    return [{ step: 1, title: '오류', content: 'AI 풀이 생성 중 오류가 발생했습니다. 다시 시도해주세요.' }];
  }
}
// ================================================================

// Review flow phases
type ReviewPhase = 'problem' | 'answer_input' | 'result' | 'explanation';

interface ReviewModeProps {
  wrongNotes: WrongNote[];
  onSubmitReview: (attempt: ReviewAttempt) => Promise<void>;
  onClose: () => void;
}

export default function ReviewMode({ wrongNotes, onSubmitReview, onClose }: ReviewModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<ReviewPhase>('problem');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [explanation, setExplanation] = useState<SolutionStep[]>([]);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const currentNote = wrongNotes[currentIndex];
  const isLastProblem = currentIndex === wrongNotes.length - 1;

  // ---- Phase: Show Problem -> Move to answer input ----
  const handleStartSolving = useCallback(() => {
    setPhase('answer_input');
  }, []);

  // ---- Phase: Submit Answer -> Check correctness ----
  const handleCheckAnswer = useCallback(async () => {
    if (!studentAnswer.trim()) return;

    setIsSubmitting(true);

    // Normalize answers for comparison
    const normalizedStudent = studentAnswer.trim().replace(/\s+/g, '');
    const normalizedCorrect = currentNote.correctAnswer.trim().replace(/\s+/g, '');

    // Simple string comparison (case-insensitive, whitespace-insensitive)
    const correct =
      normalizedStudent.toLowerCase() === normalizedCorrect.toLowerCase() ||
      normalizedStudent === normalizedCorrect;

    setIsCorrect(correct);

    try {
      const attempt: ReviewAttempt = {
        wrongNoteId: currentNote.id,
        answer: studentAnswer.trim(),
        isCorrect: correct,
        reviewedAt: new Date(),
      };
      await onSubmitReview(attempt);
    } catch (err) {
      console.error('Review submit error:', err);
    }

    setIsSubmitting(false);
    setPhase('result');
  }, [studentAnswer, currentNote, onSubmitReview]);

  // ---- Phase: Show AI Explanation ----
  const handleShowExplanation = useCallback(async () => {
    setPhase('explanation');
    setIsLoadingExplanation(true);
    setExpandedSteps(new Set());

    try {
      const steps = await generateStepByStep(currentNote.problem.content);
      setExplanation(steps);
    } catch (err) {
      setExplanation([{
        step: 1,
        title: '오류',
        content: 'AI 해설을 불러오지 못했습니다. 다시 시도해주세요.',
      }]);
    }

    setIsLoadingExplanation(false);
  }, [currentNote]);

  // ---- Move to next problem ----
  const handleNext = useCallback(() => {
    if (isLastProblem) {
      onClose();
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setPhase('problem');
    setStudentAnswer('');
    setIsCorrect(false);
    setExplanation([]);
    setExpandedSteps(new Set());
  }, [isLastProblem, onClose]);

  // ---- Toggle explanation step accordion ----
  const toggleStep = useCallback((stepNum: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNum)) {
        next.delete(stepNum);
      } else {
        next.add(stepNum);
      }
      return next;
    });
  }, []);

  if (!currentNote) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="check-all" size={64} color={colors.success} />
        <Text style={styles.emptyText}>복습할 문제가 없습니다!</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={onClose}
          accessibilityLabel="복습 모드 닫기"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>복습 모드</Text>
          <Text style={styles.headerSubtitle}>
            {currentIndex + 1} / {wrongNotes.length}
          </Text>
        </View>

        {/* Progress dots */}
        <View style={styles.progressDots}>
          {wrongNotes.slice(0, Math.min(wrongNotes.length, 10)).map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressDot,
                idx === currentIndex && styles.progressDotActive,
                idx < currentIndex && styles.progressDotCompleted,
              ]}
            />
          ))}
          {wrongNotes.length > 10 && (
            <Text style={styles.moreDotsText}>+{wrongNotes.length - 10}</Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Problem Display (always visible, with LaTeX in review mode) */}
        <View style={styles.problemCard}>
          <View style={styles.problemCardHeader}>
            <View style={styles.problemBadge}>
              <Text style={styles.problemBadgeText}>
                문제 {currentIndex + 1}
              </Text>
            </View>
            <View style={styles.topicBadge}>
              <MaterialCommunityIcons name="tag" size={14} color={colors.primary} />
              <Text style={styles.topicBadgeText}>{currentNote.problem.topic}</Text>
            </View>
          </View>

          <View style={styles.problemContent}>
            <MathText
              content={currentNote.problem.content}
              fontSize={17}
              color={colors.textPrimary}
            />
          </View>

          {/* Show choices for multiple choice problems */}
          {currentNote.problem.type === '객관식' && currentNote.problem.choices && (
            <View style={styles.choicesList}>
              {currentNote.problem.choices.map((choice, idx) => (
                <View key={idx} style={styles.choiceItem}>
                  <MathText
                    content={choice}
                    fontSize={15}
                    color={colors.textPrimary}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Phase: Problem - "Start Solving" button */}
        {phase === 'problem' && (
          <View style={styles.actionSection}>
            <View style={styles.previousAnswerHint}>
              <MaterialCommunityIcons name="information-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.previousAnswerText}>
                이전에 &quot;{currentNote.studentAnswer}&quot;(으)로 답했습니다
              </Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleStartSolving}>
              <MaterialCommunityIcons name="pencil" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>다시 풀어보기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase: Answer Input */}
        {phase === 'answer_input' && (
          <View style={styles.actionSection}>
            <Text style={styles.inputLabel}>답을 입력하세요</Text>

            <TextInput
              style={styles.answerInput}
              value={studentAnswer}
              onChangeText={setStudentAnswer}
              placeholder={
                currentNote.problem.type === '객관식'
                  ? '보기 번호를 입력하세요 (예: 3)'
                  : '답을 입력하세요'
              }
              placeholderTextColor={colors.textDisabled}
              multiline={currentNote.problem.type === '서술형'}
              numberOfLines={currentNote.problem.type === '서술형' ? 4 : 1}
              autoFocus
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                !studentAnswer.trim() && styles.primaryButtonDisabled,
              ]}
              onPress={handleCheckAnswer}
              disabled={!studentAnswer.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>정답 확인</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Phase: Result */}
        {phase === 'result' && (
          <View style={styles.actionSection}>
            {/* Correct/Incorrect banner */}
            <View
              style={[
                styles.resultBanner,
                isCorrect ? styles.resultBannerCorrect : styles.resultBannerWrong,
              ]}
            >
              <MaterialCommunityIcons
                name={isCorrect ? 'check-circle' : 'close-circle'}
                size={32}
                color={isCorrect ? colors.success : colors.error}
              />
              <View style={styles.resultBannerText}>
                <Text
                  style={[
                    styles.resultTitle,
                    { color: isCorrect ? colors.success : colors.error },
                  ]}
                >
                  {isCorrect ? '정답입니다!' : '틀렸습니다'}
                </Text>
                <Text style={styles.resultSubtitle}>
                  {isCorrect
                    ? `연속 정답: ${currentNote.consecutiveCorrect + 1}회`
                    : '다음에 다시 도전해보세요'}
                </Text>
              </View>
            </View>

            {/* Answer comparison */}
            <View style={styles.answerComparison}>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>내 답:</Text>
                <Text
                  style={[
                    styles.comparisonValue,
                    { color: isCorrect ? colors.success : colors.error },
                  ]}
                >
                  {studentAnswer}
                </Text>
              </View>
              {!isCorrect && (
                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>정답:</Text>
                  <Text style={[styles.comparisonValue, { color: colors.success }]}>
                    {currentNote.correctAnswer}
                  </Text>
                </View>
              )}
            </View>

            {/* Action buttons */}
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleShowExplanation}
              >
                <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>AI 해설 보기</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>
                  {isLastProblem ? '복습 완료' : '다음 문제'}
                </Text>
                <MaterialCommunityIcons
                  name={isLastProblem ? 'check-all' : 'arrow-right'}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Phase: AI Explanation */}
        {phase === 'explanation' && (
          <View style={styles.actionSection}>
            <View style={styles.explanationHeader}>
              <MaterialCommunityIcons name="robot" size={20} color={colors.primary} />
              <Text style={styles.explanationTitle}>AI 단계별 풀이</Text>
            </View>

            {isLoadingExplanation ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>AI가 풀이를 생성 중입니다...</Text>
                {/* Skeleton placeholders */}
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.skeletonStep}>
                    <View style={styles.skeletonCircle} />
                    <View style={styles.skeletonLines}>
                      <View style={styles.skeletonLine} />
                      <View style={[styles.skeletonLine, { width: '60%' }]} />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.stepsContainer}>
                {explanation.map((step) => (
                  <TouchableOpacity
                    key={step.step}
                    style={styles.stepCard}
                    onPress={() => toggleStep(step.step)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.stepHeader}>
                      <View style={styles.stepNumberCircle}>
                        <Text style={styles.stepNumberText}>{step.step}</Text>
                      </View>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <MaterialCommunityIcons
                        name={expandedSteps.has(step.step) ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>

                    {expandedSteps.has(step.step) && (
                      <View style={styles.stepContent}>
                        <MathText
                          content={step.content}
                          fontSize={15}
                          color={colors.textPrimary}
                        />
                        {step.formula && (
                          <View style={styles.formulaBlock}>
                            <MathText
                              content={`$$${step.formula}$$`}
                              fontSize={16}
                              color={colors.textPrimary}
                            />
                          </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Bottom action: Next problem */}
            {!isLoadingExplanation && (
              <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>
                  {isLastProblem ? '복습 완료' : '다음 문제'}
                </Text>
                <MaterialCommunityIcons
                  name={isLastProblem ? 'check-all' : 'arrow-right'}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBackButton: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceVariant,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotCompleted: {
    backgroundColor: colors.success,
  },
  moreDotsText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 2,
  },

  // Scroll
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // Problem card
  problemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  problemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  problemBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  problemBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicBadgeText: {
    fontSize: 13,
    color: colors.primary,
  },
  problemContent: {
    minHeight: 60,
  },
  choicesList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  choiceItem: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
  },

  // Action section
  actionSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },

  // Previous answer hint
  previousAnswerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warning + '10',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  previousAnswerText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },

  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary + '12',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },

  // Answer input
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  answerInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    minHeight: 48,
  },

  // Result
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  resultBannerCorrect: {
    backgroundColor: colors.success + '12',
  },
  resultBannerWrong: {
    backgroundColor: colors.error + '12',
  },
  resultBannerText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  resultSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  answerComparison: {
    gap: spacing.sm,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 50,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  resultActions: {
    gap: spacing.sm,
  },

  // Explanation
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Skeleton loading placeholders
  skeletonStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    padding: spacing.sm,
  },
  skeletonCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant,
  },
  skeletonLines: {
    flex: 1,
    gap: spacing.xs,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
    width: '80%',
  },
  stepsContainer: {
    gap: spacing.sm,
  },
  stepCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  stepContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: 0,
  },
  formulaBlock: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
});
