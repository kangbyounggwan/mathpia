<!--
SECTION_MANIFEST:
- section-01-types-and-interfaces
- section-02-mock-data-and-services
- section-03-zustand-stores
- section-04-problem-bank-ui
- section-05-gemini-ai-services
- section-06-charts-and-analytics-ui
- section-07-wrong-notes
- section-08-ai-helper
- section-09-parent-dashboard
- section-10-integration
-->

# Mathpia 고도화 구현 섹션 인덱스

## 의존성 다이어그램

```
Section 01: Types & Interfaces
  ↓
Section 02: Mock Data & Services ← depends on 01
  ↓
Section 03: Zustand Stores ← depends on 01, 02
  ↓
┌─────────────────────┬────────────────────────────┐
│                     │                            │
Section 04:           Section 05:                  │
Problem Bank UI       Gemini AI Services           │
← depends on 01-03   ← depends on 01-03           │
│                     │                            │
│                     ↓                            │
│                Section 06:                       │
│                Charts & Analytics UI             │
│                ← depends on 01-03, 05            │
│                     │                            │
├─────────────────────┤                            │
│                     │                            │
Section 07:           Section 08:                  │
Wrong Notes           AI Helper                    │
← depends on 01-03   ← depends on 01-03, 04, 05   │
│                     │                            │
└──────────┬──────────┴────────────────────────────┘
           │
           ↓
     Section 09: Parent Dashboard
     ← depends on 01-03, 06
           │
           ↓
     Section 10: Integration & Navigation
     ← depends on ALL previous sections
```

## 섹션 목록

### Section 01: Types & Interfaces
**파일**: `section-01-types-and-interfaces.md`
**의존성**: 없음 (첫 번째)
**요약**: UserRole에 parent 추가, 문제은행/분석/오답노트/학부모 관련 타입 정의, 서비스 인터페이스 정의, 서비스 팩토리 설정

### Section 02: Mock Data & Services
**파일**: `section-02-mock-data-and-services.md`
**의존성**: Section 01
**요약**: 100개+ Mock 문제, 학생/선생님/학부모 Mock 데이터, 5개 Mock 서비스 구현(AsyncStorage 영속화)

### Section 03: Zustand Stores
**파일**: `section-03-zustand-stores.md`
**의존성**: Section 01, 02
**요약**: 6개 신규 스토어 생성(problemBank, assignment, submission, analytics, wrongNote, parent), authStore 수정, persist 미들웨어 적용

### Section 04: Problem Bank UI
**파일**: `section-04-problem-bank-ui.md`
**의존성**: Section 01-03
**요약**: 문제은행 컴포넌트(ProblemCard, ProblemFilters, ProblemForm, ProblemSelector), 문제은행 화면(problem-bank.tsx), 기존 problem-extract/assignments 연동

### Section 05: Gemini AI Services
**파일**: `section-05-gemini-ai-services.md`
**의존성**: Section 01-03
**요약**: geminiAnalytics.ts(취약점분석, 문제추천, 리포트생성), geminiHelper.ts(힌트, 단계별풀이, 유사문제), JSON 검증 + 캐싱 + 재시도 로직

### Section 06: Charts & Analytics UI
**파일**: `section-06-charts-and-analytics-ui.md`
**의존성**: Section 01-03, 05
**요약**: 차트 컴포넌트(RadarChart, LineChart, BarChart, HeatMap), 학습분석 컴포넌트, 학생 analytics.tsx, 선생님 student-analytics.tsx

### Section 07: Wrong Notes
**파일**: `section-07-wrong-notes.md`
**의존성**: Section 01-03
**요약**: 오답노트 컴포넌트(WrongNoteCard, ReviewMode), wrong-notes.tsx 화면, 자동 수집 + 복습 모드 + AI 해설

### Section 08: AI Helper
**파일**: `section-08-ai-helper.md`
**의존성**: Section 01-03, 04, 05
**요약**: AI 풀이 도우미 컴포넌트(HintButton, StepByStepSolution, SimilarProblems), solve.tsx에 통합

### Section 09: Parent Dashboard
**파일**: `section-09-parent-dashboard.md`
**의존성**: Section 01-03, 06
**요약**: 학부모 라우팅 그룹(parent), 3개 화면(index, schedule, report), 학부모 컴포넌트(ChildSelector, ScheduleCalendar, ParentReportCard)

### Section 10: Integration & Navigation
**파일**: `section-10-integration.md`
**의존성**: ALL previous sections
**요약**: 선생님/학생 탭 구조 수정, 데이터 플로우 연결, index.tsx 라우팅 수정, 전체 통합 테스트
