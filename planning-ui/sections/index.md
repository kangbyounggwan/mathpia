<!-- SECTION_MANIFEST
section-01-design-tokens
section-02-common-components
section-03-auth-screens
section-04-student-screens
section-05-teacher-screens
section-06-parent-screens
section-07-responsive-accessibility
section-08-error-empty-states
END_MANIFEST -->

# Mathpia UI Enhancement - Implementation Sections Index

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable |
|---------|------------|--------|----------------|
| section-01-design-tokens | - | 02, 03, 04, 05, 06, 07, 08 | Yes (start first) |
| section-02-common-components | 01 | 03, 04, 05, 06, 08 | No |
| section-03-auth-screens | 01, 02 | - | Yes |
| section-04-student-screens | 01, 02 | - | Yes |
| section-05-teacher-screens | 01, 02 | - | Yes |
| section-06-parent-screens | 01, 02 | - | Yes |
| section-07-responsive-accessibility | 01 | - | Yes |
| section-08-error-empty-states | 01, 02 | - | Yes |

## Execution Order

1. **section-01-design-tokens** (no dependencies - MUST be first)
2. **section-02-common-components** (after 01)
3. **section-03 through section-08** (all parallel after 02)
   - section-03-auth-screens
   - section-04-student-screens
   - section-05-teacher-screens
   - section-06-parent-screens
   - section-07-responsive-accessibility
   - section-08-error-empty-states

## Section Summaries

### section-01-design-tokens
Noto Sans KR 폰트 설치 + 로딩, theme.ts 확장 (typography 시맨틱 토큰, roleColors, shadows, opacity, opacityToHex, sizes, chartColors), useRoleTheme() 훅, useResponsive() 훅, hooks/index.ts 배럴 익스포트.

**Files**: `src/constants/theme.ts`, `app/_layout.tsx`, `src/hooks/useRoleTheme.ts`, `src/hooks/useResponsive.ts`, `src/hooks/index.ts`, `assets/fonts/*.ttf`, `package.json`

### section-02-common-components
SkeletonLoader (reanimated shimmer + 프리셋), EmptyState 컴포넌트, Button 크기 variant (sm/md/lg), Card 터치 스케일 피드백 (reanimated), Input 유효성 아이콘 + helperText, common/index.ts 업데이트.

**Files**: `src/components/common/SkeletonLoader.tsx`, `src/components/common/EmptyState.tsx`, `src/components/common/Button.tsx`, `src/components/common/Card.tsx`, `src/components/common/Input.tsx`, `src/components/common/index.ts`

### section-03-auth-screens
로그인/회원가입 화면에 typography 토큰 적용, shadow 토큰, 폼 유효성 실시간 검사 (이메일 형식/비밀번호 길이), 테스트 계정 접이식, Noto Sans KR 적용.

**Files**: `app/(auth)/login.tsx`, `app/(auth)/register.tsx`

### section-04-student-screens
학생 5개 화면(대시보드/숙제/풀기/오답노트/분석) + materials + profile에 디자인 토큰 전면 적용. 역할 액센트(블루), SkeletonLoader/EmptyState 적용, 하드코딩 제거.

**Files**: `app/(student)/_layout.tsx`, `app/(student)/index.tsx`, `app/(student)/homework.tsx`, `app/(student)/solve.tsx`, `app/(student)/wrong-notes.tsx`, `app/(student)/analytics.tsx`, `app/(student)/materials.tsx`, `app/(student)/profile.tsx`

### section-05-teacher-screens
선생님 6개 화면(대시보드/학생관리/숙제관리/채점/문제은행/학생분석)에 디자인 토큰 전면 적용. 역할 액센트(인디고), SkeletonLoader/EmptyState 적용.

**Files**: `app/(teacher)/_layout.tsx`, `app/(teacher)/index.tsx`, `app/(teacher)/students.tsx`, `app/(teacher)/assignments.tsx`, `app/(teacher)/grading.tsx`, `app/(teacher)/problem-bank.tsx`, `app/(teacher)/student-analytics.tsx`

### section-06-parent-screens
학부모 3개 화면(대시보드/스케줄/리포트)에 디자인 토큰 전면 적용. 역할 액센트(그린), SkeletonLoader/EmptyState 적용, 차트 테마 연동.

**Files**: `app/(parent)/_layout.tsx`, `app/(parent)/index.tsx`, `app/(parent)/schedule.tsx`, `app/(parent)/report.tsx`

### section-07-responsive-accessibility
useResponsive() 훅 전체 화면 적용 (기존 useWindowDimensions 교체), 최소 터치 영역 44px 보장, 모든 아이콘 버튼에 accessibilityLabel, 탭바 폰트 패밀리 통일.

**Files**: All screen files using `useWindowDimensions`, all three `_layout.tsx` tab files

### section-08-error-empty-states
ErrorBoundary 컴포넌트 생성, 루트 레이아웃에 적용, 전체 화면 EmptyState/SkeletonLoader 적용 여부 최종 검증.

**Files**: `src/components/common/ErrorBoundary.tsx`, `app/_layout.tsx`, `src/components/common/index.ts`
