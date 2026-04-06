# Mathpia 고도화 리서치 결과

## Part 1: 코드베이스 분석

### 프로젝트 구조 요약

| 영역 | 상태 | 설명 |
|------|------|------|
| **라우팅** | 완료 | Expo Router 파일 기반, auth/teacher/student 그룹 |
| **UI 컴포넌트** | ~80% | 공통 컴포넌트(Button, Card, Input, MathText) 완성, 화면 UI 대부분 구현 |
| **인증** | Mock | teacher@test.com / student@test.com 하드코딩 |
| **상태관리** | ~50% | AuthStore만 구현, 데이터 스토어 없음 |
| **Gemini AI** | ~90% | 문제 추출 잘 동작, 좋은 프롬프트 엔지니어링 |
| **Drawing Canvas** | ~70% | SVG 기반 필기 동작, 이미지 출력 미구현 |
| **DB 스키마** | 설계 완료 | 17개 테이블, RLS, 트리거, 뷰 설계됨, 연동 미완 |
| **백엔드 API** | 미시작 | Gemini 외 실제 API 호출 없음 |
| **프로덕션 준비도** | ~10% | 백엔드, 에러 처리, 유효성 검증 필요 |

### 앱 라우팅 구조

```
app/
├── _layout.tsx          # PaperProvider + GestureHandler 래핑
├── index.tsx            # 스플래시 → 역할별 라우팅
├── (auth)/
│   ├── _layout.tsx      # Stack 네비게이터
│   ├── login.tsx        # Mock 로그인
│   └── register.tsx     # 역할별 회원가입 (미연동)
├── (teacher)/
│   ├── _layout.tsx      # Bottom Tab (5개)
│   ├── index.tsx        # 대시보드 (통계, 최근 제출)
│   ├── students.tsx     # 학생 목록 (검색, 학년 필터)
│   ├── assignments.tsx  # 숙제 관리 (상태 필터)
│   ├── materials.tsx    # 강의자료 + AI 문제추출
│   ├── grading.tsx      # 채점 목록
│   └── problem-extract.tsx  # 추출된 문제 관리/선택
└── (student)/
    ├── _layout.tsx      # Bottom Tab (4개)
    ├── index.tsx        # 대시보드 (반응형 와이드 레이아웃)
    ├── homework.tsx     # 숙제 목록
    ├── solve.tsx        # 문제 풀이 (캔버스 + 문제 표시)
    ├── materials.tsx    # 강의자료 열람
    └── profile.tsx      # 프로필 + 학습 통계
```

### Gemini AI 서비스 상세

- **모델**: Gemini 2.5 Flash (Vision)
- **기능**: 이미지/PDF → 수학 문제 추출 + LaTeX 변환
- **분류**: 객관식/서술형/단답형, 난이도(상/중/하), 단원, 태그
- **LaTeX 처리**: 정규화 함수로 이중 백슬래시, 유니코드 깨짐 복구
- **헬퍼**: 난이도별/주제별 그룹화 함수

### Zustand 스토어

- **authStore**: user, isAuthenticated, isLoading, error + login/logout 액션
- Mock 데이터 기반, Supabase Auth 마이그레이션 필요
- 추가 스토어 필요: 문제은행, 숙제, 학습분석 등

### 주요 갭 분석

1. **백엔드 미연동**: 모든 데이터가 Mock/하드코딩
2. **실제 인증 없음**: 세션 지속, 토큰 관리 부재
3. **데이터 영속성 없음**: 캔버스 데이터, 풀이 결과 저장 안됨
4. **미구현 기능**: 학생 추가, 숙제 생성, 채점 모달, 파일 다운로드
5. **에러 처리**: 네트워크 에러, 재시도, 오프라인 미지원
6. **성능**: 페이지네이션, 지연 로딩, 캐싱 전략 없음
7. **테스트/분석**: 단위 테스트, 에러 추적, 분석 도구 없음

---

## Part 2: 웹 리서치 결과

### Topic 1: Supabase + Expo React Native 통합

#### 인증 설정
- AsyncStorage로 세션 영속화, `processLock`으로 동시성 처리
- `detectSessionInUrl: false` 필수 (React Native)
- AppState 변경 시 `startAutoRefresh()`/`stopAutoRefresh()` 호출

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, processLock } from '@supabase/supabase-js'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
})
```

#### Realtime 알림
- Supabase Realtime 채널로 실시간 구독
- 프로덕션: FCM 또는 Expo Push 서비스와 결합 필요

#### Storage 파일 업로드
- React Native에서 File/Blob/FormData 네이티브 미작동
- **base64 → ArrayBuffer 변환** 후 업로드 필요
- RLS 정책으로 사용자별 폴더 접근 제어

#### TypeScript 타입 생성
- Supabase CLI로 DB 스키마에서 자동 타입 생성
- `npx supabase gen types typescript`

#### 오프라인 지원 옵션
1. **WatermelonDB + Supabase**: 로컬 DB 동기화 (가장 강력)
2. **TanStack Query**: 클라이언트 캐싱 + 낙관적 업데이트 (온라인 우선)
3. **PowerSync**: 오프라인 퍼스트 프레임워크 (Supabase 전용)

---

### Topic 2: 학습 분석 알고리즘

#### 취약 단원 진단 방법
- **정답률 기반**: 단원/유형별 정답률 < 임계값 → 취약 단원
- **오류 패턴 분석**: 잘못된 연산 사용이 가장 흔한 수학 오류
- **변동성 측정**: 수학 어려움이 있는 학생은 오답 패턴의 변동성이 높음
- **ML 앙상블**: LightGBM, CatBoost 등이 전통적 분류 능가

#### 간격 반복 스케줄링 (Spaced Repetition)
- **SM-2**: Anki 사용, 간단하지만 비효율적
- **FSRS (권장)**: 20-30% 적은 복습으로 동일 기억률 달성
  - "Three Component Model of Memory" 기반
  - 개인 복습 이력으로 맞춤 스케줄링
  - Anki v23.10+, RemNote에서 사용

#### 베이지안 지식 추적 (BKT)
- Hidden Markov Model 기반으로 숙련도 추적
- 정답/오답에 따라 숙련도 확률 업데이트
- 핵심 파라미터: 추측률, 실수율, 학습률
- **pyBKT**: 빠른 구현 가능 라이브러리

#### 난이도 보정 (IRT)
- SAT, GRE 등 표준화 시험에서 사용하는 산업 표준
- 학생 응답 데이터로 문제 난이도 자동 보정

#### 문제 추천 엔진 설계
1. BKT로 미숙련 선행 개념 식별
2. 해당 개념의 적절한 난이도 문제 추천
3. FSRS 스케줄링으로 복습 시점 결정
4. 성공/실패에 따라 추천 조정

---

### Topic 3: 게이미피케이션 패턴

#### 효과적인 요소
1. **스트릭 (가장 효과적)**: 일일 학습 연속일, 7/30/100일 마일스톤
2. **뱃지/업적**: 스킬 마일스톤, 진행도 마커
3. **XP/포인트**: 문제 풀이, 스트릭, 정확도 기반 부여
4. **레벨 시스템**: 장기 목표 제공, 콘텐츠 잠금 해제
5. **리더보드**: 친구 기반 > 전체 (하위 학생에게 부정적)

#### 연구 결과
- 게이미피케이션은 동기부여, 유지율, 수학 성적 일관적 향상
- 수학 불안감 감소 효과
- 참여도 최대 60% 향상
- 89% 학생이 높은 동기부여 보고

#### 피해야 할 안티패턴
- **과도한 외적 보상**: 과잉정당화 효과 - 보상에 집중, 학습 무시
- **피상적 구현**: 의미 없는 뱃지, 규칙 불명확한 포인트
- **공격적 리더보드**: 하위 학생 좌절감 유발
- **신규성 소멸**: 2-4주 후 초기 흥미 감소

#### 균형 모델 (권장)
**내적 동기(Primary)**: 자율성(문제 선택), 역량감(적절한 난이도), 관계성(공동체)
**외적 동기(Supporting)**: 스트릭/뱃지(인정), XP(진행도 시각화), 보상(콘텐츠 잠금해제)

#### React Native 구현
- **Lottie**: 축하 애니메이션 (스트릭 달성, 레벨업)
- **React Native Reanimated**: 부드러운 XP 획득 애니메이션
- **React Native Elements Badge**: 진행도 표시
