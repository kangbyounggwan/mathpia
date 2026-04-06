# Mathpia 기능 고도화 - 통합 스펙

## 1. 프로젝트 개요

Mathpia는 한국 수학 학원(학원)용 태블릿 앱으로, 선생님/학생/학부모 3가지 역할을 지원한다.
현재 UI는 80% 완성이나, 실제 기능은 대부분 mock 데이터 기반이다.

**목표**: 1-2주 내에 데모 가능한 수준으로 핵심 기능을 구현한다.

**기술 스택**:
- Expo SDK 54 / React Native / TypeScript
- Zustand v5 + AsyncStorage
- react-native-paper (MD3)
- @shopify/react-native-skia (캔버스)
- @google/genai (Gemini 2.5 Flash)
- Supabase (Auth + PostgreSQL + Storage) - 신규

## 2. 현재 상태 분석

### 2.1 완성된 것
| 영역 | 상태 | 설명 |
|------|------|------|
| UI/UX | 80% | 모든 스크린 레이아웃, 디자인 토큰, 공통 컴포넌트 |
| Zustand 스토어 | 100% 구조 | 7개 스토어 (auth, problemBank, assignment, submission, analytics, wrongNote, parent) |
| 서비스 인터페이스 | 100% | 5개 인터페이스 (IProblemBankService 등) |
| Mock 서비스 | 100% | 모든 인터페이스의 mock 구현체 |
| Mock 데이터 | 100% | 108문제, 15유저, 8과제, ~400제출물 |
| 네비게이션 | 90% | expo-router 파일 기반 라우팅 |
| 캔버스 | 70% | Skia 드로잉 (풀기 화면) |

### 2.2 미완성인 것
| 영역 | 상태 | 핵심 이슈 |
|------|------|----------|
| 인증 | 0% | 하드코딩 mock 검증만 |
| 화면-스토어 연결 | 30% | 대부분 화면이 컴포넌트 내 하드코딩 데이터 |
| 과제 CRUD | 0% | UI만, 생성/수정/삭제 미구현 |
| 채점 | 0% | UI만, 채점 로직 없음 |
| 제출 | 20% | 캔버스 있으나 제출 저장 미구현 |
| Gemini AI | 0% | 프레임워크만, API 호출 없음 |
| PDF 추출 | 0% | UI만, 업로드/추출 없음 |
| 백엔드 | 0% | 없음 (AsyncStorage만) |

## 3. 데모 필수 기능 (1-2주 목표)

### 3.1 Supabase 백엔드 셋업
- Supabase 프로젝트 생성
- DB 스키마 설계 및 마이그레이션
- Row Level Security (RLS) 정책
- Supabase Auth 설정 (이메일/비밀번호)
- Storage 버킷 (PDF, 이미지, 풀이 캡처)

### 3.2 실제 인증
- Supabase Auth로 회원가입/로그인
- 역할 기반 라우팅 유지
- 토큰 자동 갱신
- 로그아웃 시 데이터 클리어

### 3.3 PDF/사진 → AI 문제 추출
- **입력**: PDF 파일 업로드 또는 태블릿 카메라 촬영
- **처리**: Gemini 2.5 Flash Vision API로 문제 인식
- **출력**: 구조화된 문제 데이터 (제목, 유형, 난이도, LaTeX 수식, 보기, 정답)
- **저장**: 문제은행(Supabase DB)에 자동 저장
- 기존 geminiService.ts 프레임워크 활용

### 3.4 과제 생성 → 풀이 → 채점 전체 플로우

**선생님 플로우:**
1. 문제은행에서 문제 선택 (기존 UI 활용)
2. 과제 생성 (제목, 마감일, 대상 학생/학년)
3. 과제 발행 → 학생에게 표시

**학생 플로우:**
1. 숙제 목록에서 과제 확인
2. 풀기 화면에서 문제 풀이 (캔버스 드로잉 + 답안 입력)
3. 제출 → 서버 저장

**선생님 채점 플로우:**
1. 제출 목록 확인
2. 정답/오답 판정
3. 피드백 작성 (선택)
4. 채점 완료 → 학생/학부모에게 반영

### 3.5 화면-스토어 연결
- 선생님 대시보드: 스토어에서 실시간 통계
- 선생님 과제/채점/학생 관리: 스토어 CRUD
- 학생 대시보드/숙제: 배정된 과제 표시
- 학부모 대시보드: 자녀 학습 데이터

## 4. 서비스 레이어 전환 전략

현재 서비스 팩토리 (`src/services/index.ts`)가 mock 구현체를 반환한다.
이를 Supabase 구현체로 교체하면 스토어 코드 변경 없이 백엔드 전환이 가능하다.

```
src/services/
  interfaces/          # 기존 (변경 없음)
  mock/               # 기존 (폴백용 유지)
  supabase/           # 신규
    supabaseClient.ts
    supabaseProblemBankService.ts
    supabaseAssignmentService.ts
    supabaseSubmissionService.ts  # (grading 포함)
    supabaseAnalyticsService.ts
    supabaseWrongNoteService.ts
    supabaseParentService.ts
  index.ts             # mock → supabase로 교체
```

## 5. DB 스키마 (Supabase PostgreSQL)

### 핵심 테이블
- `users` - 사용자 (auth.users 확장)
- `academies` - 학원
- `problems` - 문제은행
- `assignments` - 과제
- `assignment_problems` - 과제-문제 매핑
- `assignment_students` - 과제-학생 배정
- `submissions` - 제출물
- `wrong_notes` - 오답노트
- `schedules` - 수업 스케줄

### RLS 정책
- 선생님: 자기 학원 데이터 전체 접근
- 학생: 자기 과제/제출물만 접근
- 학부모: 자녀 데이터만 읽기

## 6. Gemini AI 연동 상세

### 6.1 PDF/사진 문제 추출
- **모델**: Gemini 2.5 Flash (Vision)
- **입력**: PDF 또는 이미지 (base64)
- **프롬프트**: 기존 geminiService.ts의 프롬프트 활용
- **출력 스키마**:
  ```json
  {
    "problems": [{
      "title": "string",
      "content": "string (LaTeX)",
      "type": "객관식|단답형|서술형",
      "difficulty": "상|중|하",
      "grade": "고1",
      "subject": "수학I",
      "topic": "이차방정식",
      "options": ["①...", "②..."],
      "answer": "string",
      "solution": "string (LaTeX)"
    }]
  }
  ```
- **사진 촬영**: expo-camera 또는 expo-image-picker로 촬영
- **PDF 업로드**: expo-document-picker

### 6.2 향후 AI 기능 (데모 이후)
- 학습 분석 (취약점, 추천 문제)
- AI 힌트 (풀이 중 도움)
- AI 학습 조언 (학부모용)

## 7. 제약조건
- 태블릿 최적화 (10인치 기준)
- 한국어 전용
- 오프라인 캐시 (AsyncStorage, Supabase 오프라인 시 폴백)
- Gemini API 호출 최소화 (캐싱)
- 1-2주 내 데모 가능한 수준
