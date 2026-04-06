# Mathpia 앱 고도화 종합 스펙

## 1. 프로젝트 개요

### 1.1 현재 상태
Mathpia는 수학 학원의 선생님과 학생(중1~고3)을 연결하는 태블릿 전용 수학 학습 플랫폼이다. Expo React Native(SDK 54) + TypeScript 기반으로, Gemini AI를 활용한 문제 추출, Zustand 상태관리, React Native Paper UI, KaTeX 수학 렌더링을 사용한다.

**현재 구현 완료:**
- 로그인/회원가입 UI (Mock 인증)
- 선생님: 대시보드, 학생관리, 숙제관리, 강의자료, 채점, AI 문제추출
- 학생: 대시보드, 숙제목록, 문제풀이(SVG 캔버스), 강의자료, 프로필
- Gemini 2.5 Flash 문제 추출 (이미지/PDF → LaTeX 변환)
- 교육과정 데이터 (중1~고3 전체 단원/챕터)
- DB 스키마 설계 (Supabase 17개 테이블, 미연동)

**주요 갭:**
- 모든 데이터가 Mock/하드코딩 (백엔드 미연동)
- 문제은행 시스템 없음
- 학습 분석/취약점 진단 없음
- 학부모 역할/화면 없음
- 데이터 영속성 없음

### 1.2 고도화 목표
프론트엔드 중심으로 앱을 고도화하되, 나중에 Supabase 백엔드로 쉽게 전환할 수 있도록 서비스 레이어를 추상화한다.

### 1.3 고도화 범위 (In Scope)
1. **문제은행(Question Bank) 시스템** - 전체 기능
2. **학생 취약 단원 분석** - Gemini AI 기반
3. **오답노트** - 자동 수집 + 복습 + AI 해설
4. **AI 풀이 도우미** - 힌트/단계별 풀이
5. **학부모 전용 대시보드** - parent 역할 추가
6. **상세 학습 리포트** - 레이더/시계열/히트맵 시각화
7. **서비스 레이어 추상화** - Mock → Supabase 전환 용이
8. **데이터 영속화** - Mock + AsyncStorage

### 1.4 범위 외 (Out of Scope)
- Supabase 백엔드 실제 연동
- 게이미피케이션 (스트릭, 뱃지, 레벨)
- 실시간 알림 (Supabase Realtime)
- 오프라인 지원
- 단위 테스트

---

## 2. 기술 스택 (변경사항)

| 구분 | 현재 | 추가 |
|------|------|------|
| **상태관리** | Zustand (authStore만) | + problemBankStore, analyticsStore, parentStore 등 |
| **데이터 영속화** | 없음 | AsyncStorage + Zustand persist |
| **차트** | 없음 | react-native-svg 기반 커스텀 차트 또는 victory-native |
| **AI** | Gemini (문제추출만) | + 취약점 분석, 문제 추천, 힌트/풀이 |
| **서비스 레이어** | 직접 호출 | 추상화된 서비스 인터페이스 |

---

## 3. 사용자 역할 확장

### 3.1 기존 역할
- **admin**: 학원 관리자
- **teacher**: 선생님
- **student**: 학생

### 3.2 추가 역할
- **parent**: 학부모
  - 자녀(student) 1명 이상과 연결
  - 읽기 전용 대시보드 (자녀 성취도, 스케줄, 숙제 현황)
  - 선생님과의 메시지/알림 수신

---

## 4. 문제은행(Question Bank) 시스템

### 4.1 문제 등록
- **AI 추출**: 기존 Gemini 서비스 확장. PDF/이미지 → 문제 추출 → 문제은행 저장
- **수동 입력**: 문제 내용(텍스트 + LaTeX), 유형, 난이도, 단원, 태그, 정답, 풀이 입력 폼
- **문제 메타데이터**: 학년, 단원, 챕터, 난이도(상/중/하), 유형(객관식/서술형/단답형), 태그, 출처, 사용 횟수, 정답률

### 4.2 문제 검색/필터
- **다중 조건 필터**: 학년, 단원, 난이도, 유형 조합
- **태그 검색**: 자유 태그 기반 검색
- **텍스트 검색**: 문제 내용 키워드 검색
- **정렬**: 최신순, 사용횟수순, 정답률순

### 4.3 숙제 출제 연동
- 문제은행에서 문제 선택 → 숙제에 추가
- 숙제별 문제 순서 조정, 배점 설정
- 기존 problem-extract.tsx 화면과 통합

### 4.4 문제 통계
- 사용 횟수 추적
- 정답률 계산 (학생 제출 데이터 기반)
- 난이도 자동 조정 제안

---

## 5. Gemini AI 기반 학습 분석

### 5.1 취약 단원 진단
- 학생의 문제 풀이 이력(정답/오답, 단원, 난이도)을 Gemini AI에 전달
- AI가 취약 단원/패턴 분석 및 진단 레포트 생성
- 단원별 숙련도 점수 산출 (0~100)

### 5.2 맞춤형 문제 추천
- 취약 단원의 적절한 난이도 문제를 문제은행에서 추천
- Gemini AI가 학생 수준에 맞는 문제 선별 기준 제시
- 추천 이유 설명 (예: "이차방정식 풀이에서 인수분해 활용이 부족합니다")

### 5.3 학습 리포트

#### 학생용 리포트
- **레이더 차트**: 단원별 성취도 시각화 (중심 = 0%, 외곽 = 100%)
- **시계열 그래프**: 주간/월간 성적 변화 추이
- **취약점 히트맵**: 단원 × 난이도 매트릭스에서 취약 영역 표시
- **AI 진단 요약**: 강점/약점/추천 학습 방향

#### 선생님용 리포트
- **반별 성취도 현황**: 전체 학생의 단원별 평균 성취도
- **학생별 취약 단원 한눈에**: 학생 목록 + 취약 단원 배지
- **숙제 완료율/정답률 통계**: 숙제별 반 전체 성과

#### 학부모용 리포트
- **자녀 성취도 요약**: 핵심 숫자 (전체 정답률, 완료 숙제, 학습 시간)
- **단원별 역량**: 간소화된 레이더 차트
- **AI 학습 조언**: "이번 주 이차함수 복습을 추천합니다" 등
- **스케줄 확인**: 수업 시간표, 다가오는 숙제 마감일

---

## 6. 오답노트

### 6.1 자동 수집
- 학생이 문제를 틀리면 자동으로 오답노트에 추가
- 원본 문제, 학생 답안, 정답, 단원, 난이도 정보 저장
- 날짜별/단원별 정리

### 6.2 복습 모드
- 오답 문제를 다시 풀기
- 복습 시 정답 여부 추적 (복습 횟수, 연속 정답 여부)
- 3회 연속 정답 시 "숙련" 마크

### 6.3 AI 해설
- 각 오답 문제에 대해 Gemini AI가 단계별 풀이 해설 제공
- 학생이 어디서 틀렸는지 분석
- 유사 개념 복습 안내

---

## 7. AI 풀이 도우미

### 7.1 힌트 시스템
- 학생이 문제 풀이 중 "힌트" 버튼 클릭
- 3단계 힌트: 접근법 → 핵심 공식 → 풀이 첫 단계
- 힌트 사용 횟수 기록

### 7.2 단계별 풀이
- "풀이 보기" 버튼으로 전체 풀이 과정 표시
- 단계별로 펼쳐보기 (하나씩 확인)
- LaTeX 수식으로 깔끔하게 표시

### 7.3 유사 문제 추천
- 현재 문제와 유사한 문제를 문제은행에서 추천
- 난이도를 한 단계 낮춘 연습 문제 제안

---

## 8. 학부모 전용 화면

### 8.1 라우팅 구조
```
app/(parent)/
├── _layout.tsx      # Bottom Tab (3개)
├── index.tsx        # 자녀 성취도 대시보드
├── schedule.tsx     # 수업 스케줄 + 숙제 마감일
└── report.tsx       # 상세 학습 리포트
```

### 8.2 자녀 대시보드 (index.tsx)
- 자녀 선택 (다자녀 지원)
- 핵심 숫자: 이번 주 학습 현황 (풀이 문제 수, 정답률, 학습 시간)
- 최근 숙제 현황 (진행 중/완료/채점 완료)
- AI 학습 조언 카드
- 취약 단원 요약

### 8.3 스케줄 (schedule.tsx)
- 주간 수업 시간표 (캘린더 뷰)
- 다가오는 숙제 마감일 목록
- 채점 완료 알림 목록

### 8.4 학습 리포트 (report.tsx)
- 단원별 역량 레이더 차트
- 성적 변화 추이 그래프
- 오답 분석 요약
- AI 종합 진단 (강점/약점/추천 학습)

---

## 9. 서비스 레이어 추상화

### 9.1 설계 원칙
Mock 데이터와 AsyncStorage를 사용하되, 나중에 Supabase로 교체할 수 있도록 서비스 인터페이스를 정의한다.

### 9.2 서비스 인터페이스

```typescript
// src/services/interfaces.ts

interface IProblemBankService {
  getProblems(filters: ProblemFilters): Promise<Problem[]>;
  getProblemById(id: string): Promise<Problem>;
  createProblem(data: CreateProblemData): Promise<Problem>;
  updateProblem(id: string, data: UpdateProblemData): Promise<Problem>;
  deleteProblem(id: string): Promise<void>;
  searchProblems(query: string): Promise<Problem[]>;
}

interface IAssignmentService {
  getAssignments(filters: AssignmentFilters): Promise<Assignment[]>;
  createAssignment(data: CreateAssignmentData): Promise<Assignment>;
  addProblemsToAssignment(assignmentId: string, problemIds: string[]): Promise<void>;
  getSubmissions(assignmentId: string): Promise<Submission[]>;
  gradeSubmission(submissionId: string, data: GradeData): Promise<void>;
}

interface IAnalyticsService {
  getStudentAnalytics(studentId: string): Promise<StudentAnalytics>;
  getWeaknessAnalysis(studentId: string): Promise<WeaknessAnalysis>;
  getRecommendedProblems(studentId: string): Promise<Problem[]>;
  getClassAnalytics(classId: string): Promise<ClassAnalytics>;
}

interface IWrongNoteService {
  getWrongNotes(studentId: string, filters?: WrongNoteFilters): Promise<WrongNote[]>;
  markAsReviewed(noteId: string, isCorrect: boolean): Promise<void>;
  getAIExplanation(problemId: string): Promise<string>;
}

interface IParentService {
  getChildrenDashboard(parentId: string): Promise<ChildDashboard[]>;
  getChildSchedule(childId: string): Promise<Schedule>;
  getChildReport(childId: string): Promise<LearningReport>;
}
```

### 9.3 Mock 구현
- `src/services/mock/` 디렉토리에 각 서비스의 Mock 구현
- AsyncStorage로 데이터 영속화
- 충분한 Mock 데이터 생성 (문제 50개+, 학생 10명+, 숙제 5개+)

---

## 10. 데이터 영속화

### 10.1 Zustand Persist
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useProblemBankStore = create(
  persist(
    (set, get) => ({ ... }),
    {
      name: 'problem-bank-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### 10.2 스토어 구조
- **authStore** (기존): 사용자 인증 + parent 역할 추가
- **problemBankStore** (신규): 문제은행 데이터 + CRUD
- **assignmentStore** (신규): 숙제/과제 데이터
- **submissionStore** (신규): 제출/채점 데이터
- **analyticsStore** (신규): 학습 분석 데이터 + AI 진단 결과
- **wrongNoteStore** (신규): 오답노트 데이터
- **parentStore** (신규): 학부모 대시보드 데이터

---

## 11. 타입 확장

### 11.1 기존 타입 수정
```typescript
// UserRole에 parent 추가
export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

// User에 자녀 연결 필드 추가
export interface User {
  // ... 기존 필드
  childrenIds?: string[]; // parent 역할일 때 자녀 ID 목록
}
```

### 11.2 신규 타입
- `ProblemBankItem`: 문제은행 문제 (content, difficulty, type, tags, stats 등)
- `StudentAnalytics`: 학생 분석 데이터 (단원별 점수, 취약점, 추천)
- `WeaknessAnalysis`: AI 취약점 분석 결과
- `WrongNote`: 오답노트 항목
- `LearningReport`: 학습 리포트 (차트 데이터 포함)
- `ChildDashboard`: 학부모용 자녀 대시보드 데이터
- `Schedule`: 스케줄 데이터

---

## 12. UI/UX 요구사항

### 12.1 차트 컴포넌트
- **레이더 차트**: 단원별 성취도 (react-native-svg 커스텀 구현)
- **라인 차트**: 시계열 성적 변화
- **바 차트**: 단원별 정답률 비교
- **히트맵**: 단원 × 난이도 취약점 매트릭스

### 12.2 학부모 화면 디자인
- 깔끔하고 직관적인 디자인 (학부모 친화적)
- 핵심 정보 우선 표시 (숫자 카드 → 차트 → 상세)
- 자녀 전환 탭 (다자녀 지원)
- 알림 배지

### 12.3 문제은행 UI
- 그리드/리스트 전환 뷰
- 다중 필터 칩 (학년, 단원, 난이도, 유형)
- 문제 미리보기 카드 (LaTeX 렌더링)
- 일괄 선택 + 숙제에 추가 플로우

### 12.4 오답노트 UI
- 날짜별/단원별 그룹화
- 복습 상태 표시 (미복습/복습중/숙련)
- 복습 모드: 문제 표시 → 풀이 → 정답 확인 → AI 해설
