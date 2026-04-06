# Mathpia - 수학 학원 플랫폼 개발 계획

## 프로젝트 개요

수학 학원의 선생님과 학생을 연결하는 태블릿 전용 수학 플랫폼

### 핵심 기능
- **학원 관리**: 학원 등록 및 학생 관리
- **선생님**: 숙제 출제, 강의자료 업로드
- **학생**: 문제 풀이, 숙제 제출

### 대상 사용자
- 중학생 (1~3학년)
- 고등학생 (1~3학년)

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| **프레임워크** | React Native (Expo) |
| **언어** | TypeScript |
| **상태관리** | Zustand |
| **UI 라이브러리** | React Native Paper |
| **백엔드** | Firebase (Auth, Firestore, Storage) |
| **수학 렌더링** | react-native-mathjax 또는 KaTeX |
| **필기 캔버스** | react-native-canvas / react-native-sketch-canvas |
| **스타일러스 지원** | Apple Pencil, S Pen 등 압력 감지 |

---

## 사용자 역할

### 1. 학원 관리자 (Admin)
- 학원 정보 등록/수정
- 선생님 계정 생성
- 학생 등록 및 관리

### 2. 선생님 (Teacher)
- 학생 목록 조회
- 숙제 출제 (문제 등록)
- 강의자료 업로드
- 학생 풀이 확인 및 채점

### 3. 학생 (Student)
- 숙제 확인
- 문제 풀이 (필기 입력)
- 강의자료 열람
- 풀이 제출

---

## 교육과정 구조

```
중등 수학
├── 중1
│   ├── 수와 연산
│   ├── 문자와 식
│   ├── 좌표평면과 그래프
│   ├── 기본 도형
│   └── 통계
├── 중2
│   ├── 유리수와 순환소수
│   ├── 식의 계산
│   ├── 부등식과 연립방정식
│   ├── 일차함수
│   └── 도형의 성질
└── 중3
    ├── 제곱근과 실수
    ├── 다항식의 곱셈과 인수분해
    ├── 이차방정식
    ├── 이차함수
    └── 통계와 피타고라스 정리

고등 수학
├── 고1 (수학)
│   ├── 다항식
│   ├── 방정식과 부등식
│   ├── 도형의 방정식
│   └── 집합과 명제
├── 고2
│   ├── 수학I (지수, 로그, 삼각함수)
│   └── 수학II (함수의 극한, 미분, 적분)
└── 고3
    ├── 확률과 통계
    ├── 미적분
    └── 기하
```

---

## 화면 구성

### 공통
- 스플래시 화면
- 로그인 / 회원가입
- 역할 선택 (선생님/학생)

### 선생님 화면
```
[메인 대시보드]
├── 학생 관리
│   ├── 학생 목록
│   └── 학생 추가/수정
├── 숙제 관리
│   ├── 숙제 목록
│   ├── 새 숙제 만들기
│   └── 문제 등록 (이미지/텍스트/수식)
├── 강의자료
│   ├── 자료 목록
│   └── 자료 업로드 (PDF/이미지)
├── 채점
│   ├── 제출된 풀이 목록
│   └── 채점 및 피드백
└── 설정
```

### 학생 화면
```
[메인 대시보드]
├── 오늘의 숙제
│   └── 숙제 목록 (진행률 표시)
├── 문제 풀이
│   ├── 문제 보기
│   ├── 필기 캔버스 (풀이 작성)
│   └── 제출하기
├── 강의자료
│   └── 자료 열람
├── 내 학습
│   ├── 완료한 숙제
│   └── 틀린 문제 모음
└── 설정
```

---

## 데이터 모델

### Academy (학원)
```typescript
{
  id: string;
  name: string;
  address: string;
  phone: string;
  createdAt: timestamp;
}
```

### User (사용자)
```typescript
{
  id: string;
  academyId: string;
  role: 'admin' | 'teacher' | 'student';
  name: string;
  email: string;
  phone: string;
  grade?: string; // 학생만 (예: "중1", "고2")
  createdAt: timestamp;
}
```

### Assignment (숙제)
```typescript
{
  id: string;
  academyId: string;
  teacherId: string;
  title: string;
  description: string;
  grade: string;
  subject: string; // 단원
  dueDate: timestamp;
  problems: Problem[];
  assignedStudents: string[];
  createdAt: timestamp;
}
```

### Problem (문제)
```typescript
{
  id: string;
  content: string; // 문제 내용 (텍스트/수식)
  imageUrl?: string;
  answer?: string;
  points: number;
}
```

### Submission (제출)
```typescript
{
  id: string;
  assignmentId: string;
  studentId: string;
  problemId: string;
  answerImageUrl: string; // 필기 풀이 이미지
  textAnswer?: string;
  score?: number;
  feedback?: string;
  submittedAt: timestamp;
  gradedAt?: timestamp;
}
```

### Material (강의자료)
```typescript
{
  id: string;
  academyId: string;
  teacherId: string;
  title: string;
  description: string;
  grade: string;
  subject: string;
  fileUrl: string;
  fileType: 'pdf' | 'image';
  createdAt: timestamp;
}
```

---

## 개발 단계

### Phase 1: 프로젝트 설정 및 기반 구축
- [ ] Expo 프로젝트 초기화
- [ ] TypeScript 설정
- [ ] 폴더 구조 설정
- [ ] 네비게이션 설정 (React Navigation)
- [ ] 테마 및 공통 스타일 설정
- [ ] Firebase 연동

### Phase 2: 인증 시스템
- [ ] 로그인 화면
- [ ] 회원가입 화면
- [ ] 역할별 라우팅
- [ ] 인증 상태 관리

### Phase 3: 선생님 기능
- [ ] 대시보드
- [ ] 학생 관리 (CRUD)
- [ ] 숙제 출제 (문제 등록)
- [ ] 강의자료 업로드
- [ ] 채점 기능

### Phase 4: 학생 기능
- [ ] 대시보드
- [ ] 숙제 목록 조회
- [ ] 문제 풀이 (필기 캔버스)
- [ ] 풀이 제출
- [ ] 강의자료 열람

### Phase 5: 고급 기능
- [ ] 수식 입력/렌더링
- [ ] 오답노트
- [ ] 학습 통계
- [ ] 푸시 알림

---

## 폴더 구조

```
mathpia/
├── app/                    # Expo Router 페이지
│   ├── (auth)/            # 인증 관련 화면
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (teacher)/         # 선생님 화면
│   │   ├── _layout.tsx
│   │   ├── index.tsx      # 대시보드
│   │   ├── students/
│   │   ├── assignments/
│   │   ├── materials/
│   │   └── grading/
│   ├── (student)/         # 학생 화면
│   │   ├── _layout.tsx
│   │   ├── index.tsx      # 대시보드
│   │   ├── homework/
│   │   ├── solve/
│   │   └── materials/
│   └── _layout.tsx
├── src/
│   ├── components/        # 공통 컴포넌트
│   │   ├── common/
│   │   ├── teacher/
│   │   └── student/
│   ├── hooks/             # 커스텀 훅
│   ├── services/          # API/Firebase 서비스
│   ├── stores/            # Zustand 스토어
│   ├── types/             # TypeScript 타입
│   ├── utils/             # 유틸리티 함수
│   └── constants/         # 상수 (교육과정 등)
├── assets/                # 이미지, 폰트
├── app.json
├── package.json
└── tsconfig.json
```

---

## UI/UX 가이드라인

### 태블릿 최적화
- 최소 화면 크기: 768 x 1024 (iPad Mini 기준)
- 가로/세로 모드 모두 지원
- 큰 터치 타겟 (최소 44x44pt)
- Split View 고려한 레이아웃

### 디자인 원칙
- 깔끔하고 집중하기 좋은 인터페이스
- 수학 기호/수식의 명확한 표시
- 필기 영역은 충분히 넓게
- 학생 친화적인 색상 (눈의 피로 최소화)

### 색상 팔레트
```
Primary: #4A90D9 (파란색 계열)
Secondary: #5C6BC0 (보라색 계열)
Success: #4CAF50
Warning: #FF9800
Error: #F44336
Background: #F5F5F5
Surface: #FFFFFF
Text Primary: #212121
Text Secondary: #757575
```

---

## 필기 풀이 패드 (Drawing Canvas)

학생이 태블릿에서 직접 수학 문제를 풀 수 있는 핵심 기능

### 기능 요구사항

#### 기본 필기 도구
| 도구 | 설명 |
|------|------|
| **펜** | 기본 필기 (검정, 파랑, 빨강) |
| **형광펜** | 반투명 하이라이트 |
| **지우개** | 획 단위 / 영역 지우기 |
| **실행취소/다시실행** | Undo / Redo |
| **전체 지우기** | 캔버스 초기화 |

#### 펜 설정
- **굵기**: 가늘게 / 보통 / 굵게 (1px ~ 5px)
- **색상**: 검정, 파랑, 빨강, 초록 + 커스텀 색상
- **압력 감지**: Apple Pencil / S Pen 압력에 따른 굵기 변화

#### 수학 특화 도구
| 도구 | 설명 |
|------|------|
| **직선 도구** | 직선 그리기 (그래프, 도형) |
| **눈금자** | 화면에 눈금자 표시 |
| **그리드** | 모눈종이 배경 (ON/OFF) |
| **좌표평면** | x-y 좌표축 배경 |
| **도형 도구** | 원, 삼각형, 사각형 자동 완성 |
| **수식 입력** | 키보드로 수식 입력 (LaTeX) |

### 화면 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│  ← 뒤로   │        문제 1/5        │   제출   │   다음 →   │
├───────────┴────────────────────────┴──────────┴─────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                    문제 영역                         │   │
│  │     (문제 이미지 또는 텍스트/수식 표시)               │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                                                     │   │
│  │                                                     │   │
│  │                 필기 풀이 영역                       │   │
│  │              (Drawing Canvas)                       │   │
│  │                                                     │   │
│  │                                                     │   │
│  │                                                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🖊️ 펜 │ ✏️ 연필 │ 🖍️ 형광펜 │ ⬭ 지우개 │ ↩️ │ ↪️ │ 📐 도구 │
│  ───────────────────────────────────────────────────────── │
│  ● ● ● ●  │  ━ ─ ┄  │  🔲 그리드 │ 📏 눈금자 │ 📊 좌표   │
│  (색상)     (굵기)                                          │
└─────────────────────────────────────────────────────────────┘
```

### 제스처 지원

| 제스처 | 동작 |
|--------|------|
| **한 손가락** | 필기 (펜 모드) |
| **두 손가락 핀치** | 확대/축소 |
| **두 손가락 드래그** | 캔버스 이동 (팬) |
| **세 손가락 탭** | 실행취소 |
| **손바닥 인식** | 손바닥 터치 무시 (Palm Rejection) |

### 데이터 저장

```typescript
// 필기 데이터 구조
interface StrokeData {
  id: string;
  points: { x: number; y: number; pressure: number }[];
  color: string;
  width: number;
  tool: 'pen' | 'pencil' | 'highlighter';
  timestamp: number;
}

interface CanvasState {
  strokes: StrokeData[];
  background: 'blank' | 'grid' | 'coordinate';
  zoom: number;
  offset: { x: number; y: number };
}
```

### 저장 및 제출

- **자동 저장**: 5초마다 또는 획이 끝날 때마다 로컬 저장
- **이미지 변환**: 제출 시 PNG/JPEG로 변환하여 업로드
- **벡터 저장**: 원본 획 데이터도 함께 저장 (수정 가능)
- **임시 저장**: 앱 종료 후에도 풀이 내용 유지

### 구현 우선순위

1. **MVP (최소 기능)**
   - 기본 펜 필기
   - 색상 3가지 (검정, 파랑, 빨강)
   - 지우개
   - 실행취소/다시실행
   - 이미지로 저장 및 제출

2. **Phase 2**
   - 굵기 조절
   - 형광펜
   - 그리드 배경
   - 확대/축소

3. **Phase 3**
   - 압력 감지
   - 도형 도구
   - 좌표평면
   - 수식 입력

---

## 다음 단계

1. 이 계획서 검토 및 수정
2. Expo 프로젝트 생성
3. 기본 UI 컴포넌트 구현
4. 네비게이션 구조 설정
5. 첫 번째 화면 (로그인) 구현
