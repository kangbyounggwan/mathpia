# Mathpia 고도화 구현 계획서

## 1. 프로젝트 개요

### 1.1 무엇을 만드는가
Mathpia는 수학 학원의 선생님, 학생, 학부모를 연결하는 태블릿 전용 수학 학습 플랫폼이다. 이 계획서는 기존 프로토타입을 **프론트엔드 중심으로 고도화**하여, 문제은행 시스템, Gemini AI 기반 학습 분석, 오답노트, AI 풀이 도우미, 학부모 전용 대시보드를 추가하는 작업을 다룬다.

### 1.2 왜 이 작업을 하는가
현재 앱은 UI 프로토타입 수준으로, 모든 데이터가 Mock/하드코딩되어 있다. 핵심 학습 기능(문제은행, 취약점 분석, 오답노트)과 학부모 참여 기능이 없어 실제 학원 환경에서 사용할 수 없다. 이번 고도화로 앱의 핵심 가치를 구현하여, 이후 Supabase 백엔드 연동 시 즉시 실사용 가능한 상태로 만든다.

### 1.3 기술 결정사항
- **백엔드**: Supabase 연동 없이 Mock + AsyncStorage (서비스 레이어 추상화로 향후 교체 용이)
- **학습 분석**: ML 알고리즘(BKT/FSRS/IRT) 대신 Gemini AI 활용
- **게이미피케이션**: 이번 범위 외 (향후 추가)
- **차트**: react-native-svg 기반 커스텀 구현 또는 victory-native
- **데이터 영속화**: Zustand persist + AsyncStorage

### 1.4 현재 프로젝트 구조
```
mathpia/
├── app/                     # Expo Router 페이지
│   ├── _layout.tsx          # Root layout (PaperProvider, GestureHandler)
│   ├── index.tsx            # Splash → role 기반 라우팅
│   ├── (auth)/              # 로그인, 회원가입
│   ├── (teacher)/           # 선생님 화면 (5탭)
│   └── (student)/           # 학생 화면 (4탭)
├── src/
│   ├── components/          # 공통/선생님/학생/캔버스 컴포넌트
│   ├── services/            # geminiService.ts (AI 문제 추출)
│   ├── stores/              # authStore.ts (Zustand)
│   ├── types/               # 타입 정의
│   └── constants/           # theme.ts, curriculum.ts
├── package.json             # Expo SDK 54, React 19.1
└── tsconfig.json            # 경로 별칭 설정됨
```

---

## 2. 아키텍처 설계

### 2.1 서비스 레이어 패턴

Mock 데이터를 사용하되, 서비스 인터페이스를 정의하여 향후 Supabase로 교체할 수 있게 한다. **서비스 팩토리 패턴**으로 인스턴스를 중앙 관리한다.

```
┌────────────────────────────────────────────────────┐
│                    UI Layer                        │
│  (screens, components)                             │
├────────────────────────────────────────────────────┤
│                  Zustand Stores                    │
│  (authStore, problemBankStore, analyticsStore...) │
├────────────────────────────────────────────────────┤
│           Service Factory (index.ts)               │
│  ┌──────────────────────────────────────────────┐  │
│  │         Service Interfaces                    │  │
│  │  (IProblemBankService, IAnalyticsService...)  │  │
│  ├──────────────┬───────────────────────────────┤  │
│  │  Mock Impl   │   (향후) Supabase Impl       │  │
│  │  + AsyncStorage │                            │  │
│  └──────────────┴───────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**서비스 팩토리 (src/services/index.ts)**:
```typescript
import { MockProblemBankService } from './mock/mockProblemBank';
import { MockAnalyticsService } from './mock/mockAnalytics';
// ... 나머지 서비스

const services = {
  problemBank: new MockProblemBankService(),
  assignment: new MockAssignmentService(),
  analytics: new MockAnalyticsService(),
  wrongNote: new MockWrongNoteService(),
  parent: new MockParentService(),
  // 향후 Supabase 전환 시:
  // problemBank: new SupabaseProblemBankService(supabase),
};

export default services;
```

### 2.2 디렉토리 구조 (신규 추가 부분)

```
src/
├── services/
│   ├── interfaces/           # 서비스 인터페이스 정의
│   │   ├── index.ts
│   │   ├── problemBank.ts
│   │   ├── assignment.ts
│   │   ├── analytics.ts
│   │   ├── wrongNote.ts
│   │   └── parent.ts
│   ├── mock/                 # Mock 서비스 구현
│   │   ├── index.ts
│   │   ├── mockProblemBank.ts
│   │   ├── mockAssignment.ts
│   │   ├── mockAnalytics.ts
│   │   ├── mockWrongNote.ts
│   │   ├── mockParent.ts
│   │   └── mockData.ts       # 초기 Mock 데이터
│   ├── geminiService.ts      # 기존 (확장)
│   ├── geminiAnalytics.ts    # 신규: AI 취약점 분석
│   └── geminiHelper.ts       # 신규: AI 풀이 도우미
├── stores/
│   ├── authStore.ts          # 수정: parent 역할 추가
│   ├── problemBankStore.ts   # 신규
│   ├── assignmentStore.ts    # 신규
│   ├── submissionStore.ts    # 신규
│   ├── analyticsStore.ts     # 신규
│   ├── wrongNoteStore.ts     # 신규
│   └── parentStore.ts        # 신규
├── types/
│   ├── index.ts              # 수정: 기존 타입 확장
│   ├── problemBank.ts        # 신규
│   ├── analytics.ts          # 신규
│   ├── wrongNote.ts          # 신규
│   └── parent.ts             # 신규
├── components/
│   ├── charts/               # 신규: 차트 컴포넌트
│   │   ├── RadarChart.tsx
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   └── HeatMap.tsx
│   ├── problemBank/          # 신규: 문제은행 컴포넌트
│   │   ├── ProblemCard.tsx
│   │   ├── ProblemFilters.tsx
│   │   ├── ProblemForm.tsx
│   │   └── ProblemSelector.tsx
│   ├── analytics/            # 신규: 학습분석 컴포넌트
│   │   ├── WeaknessCard.tsx
│   │   ├── AchievementRadar.tsx
│   │   └── ProgressTimeline.tsx
│   ├── wrongNote/            # 신규: 오답노트 컴포넌트
│   │   ├── WrongNoteCard.tsx
│   │   └── ReviewMode.tsx
│   ├── aiHelper/             # 신규: AI 풀이 도우미
│   │   ├── HintButton.tsx
│   │   ├── StepByStepSolution.tsx
│   │   └── SimilarProblems.tsx
│   └── parent/               # 신규: 학부모 컴포넌트
│       ├── ChildSelector.tsx
│       ├── ScheduleCalendar.tsx
│       └── ParentReportCard.tsx
└── constants/
    └── curriculum.ts         # 기존 (변경 없음)

app/
├── (parent)/                 # 신규: 학부모 화면
│   ├── _layout.tsx
│   ├── index.tsx             # 자녀 대시보드
│   ├── schedule.tsx          # 스케줄
│   └── report.tsx            # 학습 리포트
├── (teacher)/
│   ├── problem-bank.tsx      # 신규: 문제은행 관리
│   └── student-analytics.tsx # 신규: 학생 분석 상세
├── (student)/
│   ├── wrong-notes.tsx       # 신규: 오답노트
│   └── analytics.tsx         # 신규: 내 학습 분석
└── ...
```

### 2.3 Gemini AI 서비스 확장

기존 `geminiService.ts`를 확장하여 3가지 AI 기능을 추가한다:

```
geminiService.ts (기존)
  └── extractProblemsFromFile()  # 문제 추출

geminiAnalytics.ts (신규)
  ├── analyzeStudentWeakness()   # 취약점 분석
  ├── recommendProblems()        # 문제 추천
  └── generateLearningReport()   # 학습 리포트 생성

geminiHelper.ts (신규)
  ├── generateHint()             # 힌트 생성 (3단계)
  ├── generateStepByStep()       # 단계별 풀이
  └── findSimilarProblems()      # 유사 문제 매칭
```

---

## 3. 구현 단계

### Phase 1: 기반 인프라 (서비스 레이어 + 타입 + 스토어)

#### 3.1 타입 시스템 확장
**파일**: `src/types/index.ts`, `src/types/problemBank.ts`, `src/types/analytics.ts`, `src/types/wrongNote.ts`, `src/types/parent.ts`

- UserRole에 'parent' 추가
- User 인터페이스에 `childrenIds?: string[]` 추가
- ProblemBankItem 타입 정의 (content, contentHtml, imageUrls, answer, solution, difficulty, type, choices, grade, subject, topic, tags, source, sourceType, points, usageCount, correctRate)
- StudentAnalytics 타입 (subjectScores, weakTopics, strongTopics, overallScore, totalSolved, totalCorrect, streakDays)
- WeaknessAnalysis 타입 (weakTopics: {topic, score, reason, recommendedCount}[])
- WrongNote 타입 (problemId, studentAnswer, correctAnswer, problem, reviewCount, isLearned, lastReviewDate)
- ChildDashboard 타입 (child: User, stats, recentAssignments, weakTopics, aiAdvice)
- Schedule 타입 (weeklyClasses, upcomingDeadlines)
- LearningReport 타입 (radarData, timelineData, heatmapData, aiSummary)

#### 3.2 서비스 인터페이스 정의
**파일**: `src/services/interfaces/*.ts`

5개 서비스 인터페이스 정의:
- IProblemBankService: CRUD + 검색 + 필터
- IAssignmentService: 숙제 CRUD + 문제 연결 + 제출/채점
- IAnalyticsService: 학생 분석 + 취약점 + 추천 + 반 분석
- IWrongNoteService: 오답 CRUD + 복습 상태 + AI 해설
- IParentService: 자녀 대시보드 + 스케줄 + 리포트

#### 3.3 Mock 데이터 생성
**파일**: `src/services/mock/mockData.ts`

- **문제 100개+** (학년별 최소 16문제, 주요 단원별 5문제 이상)
- 학생 10명 (다양한 성취도, 특정 단원 취약하도록 설계)
- 선생님 2명
- 학부모 3명 (자녀 연결)
- 숙제 8개+ (다양한 상태: draft/published/closed)
- 제출 데이터 (학생별 30~50건, 날짜 분산 최근 4주)
- 오답노트 초기 데이터

#### 3.4 Mock 서비스 구현
**파일**: `src/services/mock/*.ts`

5개 서비스의 Mock 구현:
- AsyncStorage를 사용한 데이터 영속화
- 검색/필터 로직 (클라이언트 사이드)
- 통계 계산 (정답률, 완료율 등)

#### 3.5 Zustand 스토어 생성
**파일**: `src/stores/*.ts`

6개 신규 스토어 + authStore 수정:
- 모든 스토어에 persist 미들웨어 적용
- authStore에 parent 역할 + Mock 학부모 계정 추가
- 각 스토어가 해당 Mock 서비스를 호출

---

### Phase 2: 문제은행 시스템

#### 3.6 문제은행 컴포넌트
**파일**: `src/components/problemBank/*.tsx`

- **ProblemCard.tsx**: 문제 미리보기 카드 (LaTeX 렌더링, 난이도 칩, 유형 배지)
- **ProblemFilters.tsx**: 다중 필터 UI (학년, 단원, 난이도, 유형 칩)
- **ProblemForm.tsx**: 문제 등록/수정 폼 (텍스트 입력, LaTeX 미리보기, 보기 입력)
- **ProblemSelector.tsx**: 숙제 출제 시 문제 선택 UI (체크박스 + 선택된 문제 목록)

#### 3.7 문제은행 화면 (선생님)
**파일**: `app/(teacher)/problem-bank.tsx`

- 문제 목록 (FlatList, 가상화 렌더링)
- 다중 필터 바 (학년/단원/난이도/유형)
- 텍스트 검색
- 문제 상세 모달 (풀이, 통계, 사용 이력)
- FAB: 문제 등록 (수동) / AI 추출 (기존 PDF 업로드)
- 일괄 선택 → "숙제에 추가" 플로우

#### 3.8 기존 화면 연동
- `problem-extract.tsx` 수정: 추출된 문제를 문제은행에 저장하는 옵션 추가
- `assignments.tsx` 수정: 문제은행에서 문제 선택하여 숙제 구성
- `materials.tsx`: AI 추출 후 문제은행 저장 플로우 개선
- 선생님 Tab에 문제은행 탭 추가 (또는 기존 탭 내 네비게이션)

---

### Phase 3: Gemini AI 학습 분석

#### 3.9 AI 분석 서비스
**파일**: `src/services/geminiAnalytics.ts`

**캐싱 전략**: 모든 AI 분석 결과는 analyticsStore에 캐싱. 새 풀이 데이터가 5건 이상 추가되었을 때만 재분석 트리거. 캐시에 `lastAnalyzedAt` 타임스탬프와 `submissionCountSinceLastAnalysis` 카운터를 저장.

**AI 분석 트리거 시점**:
- 학생: "내 학습 분석" 화면 진입 시 캐시 확인 → 없거나 만료 시 자동 생성
- 선생님: "AI 진단 실행" 수동 버튼 클릭 시
- 학부모: 자녀 리포트 화면 진입 시 캐시 확인 → 없거나 만료 시 자동 생성

**JSON 응답 안정성**: 모든 Gemini 서비스에 JSON Schema 검증 + 최대 2회 재시도 + 폴백 기본값 설정.

- **analyzeStudentWeakness(studentData)**: 학생 풀이 이력을 Gemini에 전달하여 취약 단원/패턴 분석
  - 입력: 최근 N개 풀이 기록 (문제 내용, 단원, 정답여부, 난이도)
  - 출력: 취약 단원 목록 + 이유 + 추천 학습 방향

- **recommendProblems(weaknessData, problemBank)**: 취약 단원에 맞는 문제 추천
  - 입력: 취약점 분석 결과 + 문제은행 데이터 (요약)
  - 출력: 추천 문제 ID 목록 + 추천 이유

- **generateLearningReport(studentData)**: 종합 학습 리포트 생성
  - 입력: 전체 풀이 이력 + 단원별 정답률
  - 출력: 강점/약점 요약 + 학습 조언 + 주간/월간 트렌드 분석

**단계적 로딩**: 분석 화면에서 취약점 분석을 먼저 표시하고, 문제 추천과 리포트는 백그라운드에서 로드.

#### 3.10 차트 컴포넌트
**파일**: `src/components/charts/*.tsx`

- **RadarChart.tsx**: react-native-svg로 구현. 단원별 성취도 레이더. 데이터: {label, value}[]
- **LineChart.tsx**: 시계열 성적 변화. 데이터: {date, score}[]
- **BarChart.tsx**: 단원별 정답률 비교. 데이터: {label, value, color}[]
- **HeatMap.tsx**: 단원 × 난이도 취약점 매트릭스. 데이터: {x, y, value}[]

#### 3.11 학습 분석 컴포넌트
**파일**: `src/components/analytics/*.tsx`

- **WeaknessCard.tsx**: 취약 단원 카드 (단원명, 점수, AI 이유, 추천 문제 수)
- **AchievementRadar.tsx**: RadarChart 래핑 + 범례 + 설명
- **ProgressTimeline.tsx**: 주간/월간 성적 추이 + 이벤트 마커

#### 3.12 학생 분석 화면
**파일**: `app/(student)/analytics.tsx`

- 전체 성취도 요약 카드 (정답률, 풀이 수, 연속 학습일)
- 레이더 차트: 단원별 역량
- 취약 단원 목록 (카드형, AI 분석 결과)
- "추천 문제 풀기" 버튼 → 추천 문제 목록
- 성적 변화 그래프 (최근 4주)
- 취약점 히트맵

#### 3.13 선생님 학생 분석 화면
**파일**: `app/(teacher)/student-analytics.tsx`

- 학생 선택 (드롭다운 또는 학생 목록에서 진입)
- 선택된 학생의 분석 대시보드 (학생용과 유사)
- 반 전체 성취도 요약 (평균 점수, 취약 단원 분포)
- AI 분석 실행 버튼 ("AI 진단 실행")

---

### Phase 4: 오답노트 + AI 풀이 도우미

#### 3.14 오답노트 서비스/스토어
- wrongNoteStore: 오답 자동 수집, 복습 상태 관리, 숙련 마크
- 제출 시 오답이면 자동으로 wrongNoteStore에 추가
- **숙련 기준**: 최소 24시간 간격의 3회 연속 정답 시 "숙련" 마크
- submissionStore → wrongNoteStore 연동: 이벤트 기반 패턴으로 순환 의존 방지 (submissionStore의 subscribe 콜백에서 wrongNoteStore 업데이트)

#### 3.15 오답노트 컴포넌트
**파일**: `src/components/wrongNote/*.tsx`

- **WrongNoteCard.tsx**: 오답 문제 카드 (문제, 내 답, 정답, 단원, 복습 상태)
- **ReviewMode.tsx**: 복습 모드 UI (문제 표시 → 풀기 → 정답 확인 → AI 해설)

#### 3.16 오답노트 화면
**파일**: `app/(student)/wrong-notes.tsx`

- 날짜별/단원별 탭 전환
- 오답 목록 (FlatList)
- 복습 상태 필터 (미복습/복습중/숙련)
- "복습 시작" 버튼 → ReviewMode 진입
- 통계: 총 오답 수, 복습 완료율, 숙련 문제 수

#### 3.17 AI 풀이 도우미
**파일**: `src/services/geminiHelper.ts`, `src/components/aiHelper/*.tsx`

- **geminiHelper.ts**:
  - `generateHint(problem, level)`: 3단계 힌트 (접근법 → 핵심 공식 → 풀이 첫 단계)
  - `generateStepByStep(problem)`: 전체 단계별 풀이 (LaTeX)
  - `findSimilarProblems(problem, bank)`: 유사 문제 매칭

- **HintButton.tsx**: 힌트 요청 버튼 (레벨 1→2→3 순차 표시)
- **StepByStepSolution.tsx**: 단계별 풀이 아코디언 (하나씩 펼쳐보기)
- **SimilarProblems.tsx**: 유사 문제 추천 목록

- `app/(student)/solve.tsx` 수정: 풀이 화면에 힌트 버튼 + 풀이 보기 버튼 추가

---

### Phase 5: 학부모 전용 화면

#### 3.18 학부모 인증
- authStore 수정: parent Mock 계정 추가 (parent@test.com)
- index.tsx 수정: parent 역할 시 (parent) 그룹으로 라우팅

#### 3.19 학부모 레이아웃 & 화면
**파일**: `app/(parent)/*.tsx`

- **_layout.tsx**: Bottom Tab 3개 (홈/스케줄/리포트)
- **index.tsx** (자녀 대시보드):
  - 자녀 선택 탭 (다자녀 지원)
  - 이번 주 학습 현황 카드 (풀이 수, 정답률, 학습 시간)
  - 최근 숙제 현황 (진행률 바)
  - AI 학습 조언 카드
  - 취약 단원 요약 (상위 3개)

- **schedule.tsx**:
  - 주간 캘린더 뷰 (수업 시간표)
  - 다가오는 숙제 마감일 목록
  - 최근 채점 완료 알림

- **report.tsx** (상세 학습 리포트):
  - 단원별 역량 레이더 차트
  - 성적 변화 추이 그래프
  - 오답 분석 요약 (많이 틀린 단원 Top 3)
  - AI 종합 진단 (강점/약점/추천)

#### 3.20 학부모 컴포넌트
**파일**: `src/components/parent/*.tsx`

- **ChildSelector.tsx**: 자녀 선택 탭/드롭다운
- **ScheduleCalendar.tsx**: 주간 수업 캘린더
- **ParentReportCard.tsx**: 학습 요약 카드 (학부모 친화적 디자인)

---

### Phase 6: 기존 화면 개선 & 통합

#### 3.21 선생님 탭 구조 수정
- **기존 5탭 유지** (7탭은 과도함). 문제은행과 학생분석은 대시보드에서 Stack 네비게이션으로 진입
- 대시보드에 "문제은행" 퀵 액션 버튼 → problem-bank.tsx (Stack)
- students.tsx에서 학생 카드 클릭 → student-analytics.tsx (Stack)
- assignments.tsx에서 문제은행 연동 (문제 선택 플로우)

#### 3.22 학생 탭 구조 수정
- 기존 4탭에 "오답노트" 탭 추가 또는 "내 학습" 탭으로 통합
- homework.tsx에서 AI 분석 진입점 추가
- solve.tsx에 AI 도우미 통합

#### 3.23 데이터 플로우 연결
- 문제 풀이 완료 → submissionStore 저장 → 오답이면 wrongNoteStore에 추가
- 제출 데이터 축적 → analyticsStore에서 통계 계산
- 학부모 대시보드가 자녀의 analyticsStore 데이터 참조

---

## 4. 의존성 관계

```
Phase 1 (기반)
  ├── 타입 시스템 확장 ← 가장 먼저
  ├── 서비스 인터페이스 ← 타입 의존
  ├── Mock 데이터 ← 타입 의존
  ├── Mock 서비스 ← 인터페이스 + 데이터 의존
  └── Zustand 스토어 ← Mock 서비스 의존

Phase 2 (문제은행) ← Phase 1 완료 필요
  ├── 문제은행 컴포넌트
  ├── 문제은행 화면
  └── 기존 화면 연동

Phase 3 (학습분석) ← Phase 1 + 2 완료 필요 (문제은행 데이터 필요)
  ├── AI 분석 서비스
  ├── 차트 컴포넌트
  ├── 분석 컴포넌트
  └── 분석 화면 (학생 + 선생님)

Phase 4 (오답노트 + AI도우미) ← Phase 1 + 2 완료 필요
  ├── 오답노트 (Phase 1 의존)
  └── AI 풀이 도우미 (Phase 2 문제은행 의존)

Phase 5 (학부모) ← Phase 1 + 3 완료 필요 (분석 데이터 필요)
  ├── 학부모 인증
  ├── 학부모 화면
  └── 학부모 컴포넌트

Phase 6 (통합) ← Phase 2~5 완료 필요
  ├── 탭 구조 수정
  └── 데이터 플로우 연결
```

---

## 5. 추가 패키지

```bash
# 차트 라이브러리 (react-native-svg는 이미 설치됨)
# victory-native가 필요하면 추가, 아니면 커스텀 SVG 차트

# AsyncStorage (Zustand persist용)
npx expo install @react-native-async-storage/async-storage
```

react-native-svg는 이미 설치되어 있으므로 커스텀 차트 구현 가능. 복잡한 차트가 필요하면 victory-native 추가 검토.

---

## 6. Mock 데이터 설계

### 6.1 Mock 학부모 계정
```typescript
'parent@test.com': {
  id: '3',
  academyId: 'academy1',
  role: 'parent',
  name: '이부모',
  email: 'parent@test.com',
  phone: '010-5555-1234',
  childrenIds: ['2'], // 이학생의 ID
  password: '123456',
  createdAt: new Date(),
}
```

### 6.2 Mock 문제은행 (100개+)
각 학년(중1~고3)별 최소 16문제, 주요 단원별 최소 5문제, 다양한:
- 난이도: 상/중/하 균등 분포
- 유형: 객관식 60%, 단답형 30%, 서술형 10%
- 단원: curriculum.ts 기반 실제 단원명
- LaTeX 수식 포함

### 6.3 Mock 풀이 이력
- 학생별 30~50건의 풀이 기록
- 다양한 정답/오답 패턴 (특정 단원 취약하도록 설계)
- 날짜 분산 (최근 4주)

---

## 7. Gemini AI 프롬프트 설계

### 7.1 취약점 분석 프롬프트
```
당신은 수학 교육 전문가입니다.
학생의 문제 풀이 이력을 분석하여 취약한 단원과 학습 방향을 제시해주세요.

[학생 정보]
- 학년: {grade}
- 최근 풀이 기록: {솔빙 이력 JSON}

[분석 요청]
1. 단원별 숙련도 (0~100점)
2. 가장 취약한 단원 3개 + 이유
3. 오류 패턴 분석
4. 추천 학습 순서

JSON 형식으로 출력:
{
  "subjectScores": [{"subject": "...", "score": 85}],
  "weakTopics": [{"topic": "...", "score": 30, "reason": "..."}],
  "errorPatterns": ["..."],
  "recommendations": ["..."]
}
```

### 7.2 힌트 프롬프트
```
수학 문제에 대한 힌트를 {level}단계로 제공해주세요.

[문제]
{problem.content}

[힌트 레벨]
- 1: 접근법 제시 (어떤 개념을 사용해야 하는지)
- 2: 핵심 공식/정리 제시
- 3: 풀이 첫 단계 (첫 번째 식 세우기)

레벨 {level}의 힌트만 제공. LaTeX 수식 사용.
```

### 7.3 단계별 풀이 프롬프트
```
수학 문제의 상세한 단계별 풀이를 작성해주세요.

[문제]
{problem.content}

각 단계를 명확히 구분하고, 모든 수식은 LaTeX로 표기.
JSON 배열로 출력: [{"step": 1, "title": "...", "content": "...", "formula": "..."}]
```

---

## 8. 리스크 및 완화 방안

| 리스크 | 영향 | 완화 방안 |
|--------|------|-----------|
| Gemini API 응답 지연 | 사용자 경험 저하 | 로딩 스켈레톤, 캐싱, 타임아웃 처리 |
| Gemini API 비용 | 비용 증가 | 분석 결과 캐싱, 요청 빈도 제한 |
| Mock 데이터 한계 | 현실감 부족 | 충분한 양/다양성의 Mock 데이터 생성 |
| 차트 성능 (SVG) | 렌더링 느림 | 데이터 포인트 제한, 메모이제이션 |
| AsyncStorage 용량 | 데이터 증가 | 오래된 데이터 정리 정책 |
| LaTeX 렌더링 불안정 | 수식 깨짐 | 정규화 강화, 폴백 텍스트 |
| Gemini JSON 파싱 실패 | AI 기능 동작 안함 | JSON Schema 검증 + 최대 2회 재시도 + 폴백 기본값 |
| 스토어 간 순환 의존 | 무한 루프/크래시 | 이벤트 기반 패턴, subscribe 콜백으로 분리 |

---

## 9. UX 가이드라인

### 9.1 AI 관련 로딩 UX
- 모든 Gemini API 호출에 **스켈레톤 UI** + 진행 메시지 표시
- 예: "AI가 학습 패턴을 분석 중입니다..." / "힌트를 생성 중입니다..."
- 타임아웃 15초 후 "다시 시도" 버튼 표시
- React Error Boundary로 AI 서비스 실패 시 앱 크래시 방지

### 9.2 문제은행 리스트 최적화
- 문제 목록에서 LaTeX는 텍스트 요약으로 표시 (첫 50자)
- 상세 보기 모달에서만 LaTeX 렌더링
- FlatList getItemLayout으로 고정 높이 최적화

---

## 10. 성공 기준

### 기능 완성도
- [ ] 문제은행: 등록/검색/필터/숙제연동 동작
- [ ] 학습분석: AI 취약점 진단 + 차트 시각화 동작
- [ ] 오답노트: 자동 수집 + 복습 모드 동작
- [ ] AI 도우미: 힌트 + 단계별 풀이 동작
- [ ] 학부모: 전용 대시보드 + 스케줄 + 리포트 동작
- [ ] 데이터: AsyncStorage 영속화 동작

### 비기능 요구사항
- 모든 화면이 태블릿 가로/세로 모드에서 정상 동작
- LaTeX 수식이 모든 차트/카드에서 정상 렌더링
- 앱 재시작 시 데이터 유지 (AsyncStorage)
- 서비스 레이어를 통해 향후 Supabase 교체 가능
