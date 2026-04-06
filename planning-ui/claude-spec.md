# Mathpia UI 고도화 종합 스펙

## 1. 프로젝트 개요

Mathpia는 한국 수학 학원용 태블릿 앱(Expo SDK 54, React Native 0.81.5, TypeScript)으로, 선생님/학생/학부모 3개 역할 기반 서비스이다. 기능 구현은 완료되었으나 UI/UX가 프로토타입 수준이므로 **상용 수준의 세련된 앱**으로 전면 고도화한다.

### 기술 스택
- Expo SDK 54 / React Native 0.81.5 / TypeScript
- react-native-paper (Material Design 3)
- react-native-svg (차트)
- expo-router (파일 기반 라우팅)
- zustand v5 (상태 관리)
- react-native-reanimated v4.2.1 (설치됨, 미사용)

### 타겟 디바이스
- **태블릿 우선** (10인치+), 모바일/웹 호환 유지

## 2. 핵심 결정 사항 (인터뷰 결과)

| 항목 | 결정 |
|------|------|
| 타겟 디바이스 | 태블릿 퍼스트 |
| 커스텀 폰트 | **Noto Sans KR** |
| 역할별 색상 | **액센트 차별화** (선생님=인디고, 학생=블루, 학부모=그린) |
| 다크모드 | **제외** (라이트만) |
| 애니메이션 | **최소한** (스켈레톤 + 기본 전환) |
| 게이미피케이션 | **기본** (스트릭 + 진행률) |
| 로그인 스타일 | **미니말 클린** |
| 우선 컴포넌트 | **SkeletonLoader + EmptyState** |
| 우선순위 | **디자인 시스템 기반 → 화면 적용** |

## 3. 현재 상태 진단

### 잘 된 부분
- theme.ts에 색상/스페이싱/borderRadius 토큰 정의됨
- 공통 컴포넌트(Button, Input, Card, MathText) 존재
- 역할별 탭 내비게이션 구조 안정적
- react-native-paper MD3 일관 적용
- 반응형 브레이크포인트(768px) 기본 적용

### 문제점 (코드베이스 분석 결과)
1. **하드코딩 심각**: 폰트 크기 11-48px 산재, typography 스케일 미사용
2. **opacity/shadow 비표준**: rgba 인라인, shadow 속성 하드코딩
3. **컴포넌트 크기 비일관**: 아이콘 컨테이너 40-52px 혼재
4. **역할별 시각 차이 없음**: 모든 역할이 동일한 파란색 사용
5. **로딩 경험 부재**: 스켈레톤/shimmer UI 없음
6. **빈 상태 없음**: 데이터 없을 때 안내 UI 부재
7. **시스템 폰트 사용**: 한글 타이포그래피 최적화 안됨
8. **reanimated 미사용**: v4.2.1 설치만 됨, 실제 활용 0
9. **차트 색상 테마 미연동**: 로컬 상수 사용
10. **화면 길이**: student/index.tsx 등 600줄+ 단일 파일

## 4. 고도화 범위

### 4.1 디자인 토큰 시스템 완성

#### 4.1.1 Noto Sans KR 폰트 적용
- expo-font로 Noto Sans KR (Regular 400, Medium 500, Bold 700) 로드
- react-native-paper configureFonts()에 Noto Sans KR 적용
- 모든 텍스트에 자동 적용되도록 테마 설정

#### 4.1.2 타이포그래피 시맨틱 토큰
기존 MD3 스케일을 활용하되, 앱 전용 시맨틱 타이포그래피 정의:
```
heading1: headlineLarge (32px, Bold) - 페이지 제목
heading2: headlineMedium (28px, Bold) - 섹션 제목
heading3: titleLarge (22px, Medium) - 카드 제목
subtitle: titleMedium (16px, Medium) - 부제목
body: bodyLarge (16px, Regular) - 본문
bodySmall: bodyMedium (14px, Regular) - 작은 본문
caption: bodySmall (12px, Regular) - 캡션
label: labelLarge (14px, Medium) - 라벨
labelSmall: labelSmall (11px, Medium) - 작은 라벨
```

#### 4.1.3 역할별 액센트 색상
```
teacher: { accent: '#5C6BC0', accentLight: '#8E99D6', accentDark: '#3949AB' } // 인디고
student: { accent: '#4A90D9', accentLight: '#7AB3E8', accentDark: '#2E6DB3' } // 블루 (현재 primary)
parent:  { accent: '#66BB6A', accentLight: '#A5D6A7', accentDark: '#388E3C' } // 그린
```
- 탭바 active 색상, 대시보드 히어로 카드 배경, 헤더 아이콘 등에 역할 액센트 적용
- useRoleTheme() 커스텀 훅으로 현재 사용자 역할에 맞는 액센트 반환

#### 4.1.4 그림자 토큰
```
shadow.none: {}
shadow.sm: { shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 }
shadow.md: { shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 }
shadow.lg: { shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.16, shadowRadius: 8, elevation: 6 }
```

#### 4.1.5 Opacity 토큰
```
opacity.subtle: 0.08 (배경 강조)
opacity.muted: 0.16 (비활성 요소)
opacity.medium: 0.38 (disabled 텍스트)
opacity.high: 0.60 (보조 텍스트)
opacity.full: 1.0
```

#### 4.1.6 컴포넌트 크기 토큰
```
sizes.iconSm: 20, sizes.iconMd: 24, sizes.iconLg: 32, sizes.iconXl: 40
sizes.avatarSm: 32, sizes.avatarMd: 48, sizes.avatarLg: 64
sizes.badgeSm: 20, sizes.badgeMd: 28, sizes.badgeLg: 36
sizes.progressRingSm: 44, sizes.progressRingMd: 64, sizes.progressRingLg: 88
```

### 4.2 공통 컴포넌트

#### 4.2.1 SkeletonLoader (최우선)
- shimmer 효과 (react-native-reanimated 활용)
- 변형: card, list, text, circle, custom
- 사용: 모든 데이터 로딩 화면에 적용

#### 4.2.2 EmptyState (최우선)
- props: icon, title, description, actionLabel, onAction
- MaterialCommunityIcons 활용
- 각 화면별 맞춤 메시지 (숙제 없음, 오답 없음, 학생 없음 등)

#### 4.2.3 기존 컴포넌트 리팩토링
- **Button**: size variant (sm/md/lg) 추가
- **Card**: 터치 시 미세 스케일(0.98) 피드백 추가
- **Input**: 유효성 검사 아이콘(체크/X) 추가

### 4.3 로그인/온보딩 화면 개선

- 미니말 클린 스타일 유지하되 디테일 개선
- Noto Sans KR 적용으로 타이포그래피 품질 향상
- 폼 필드 유효성 실시간 검사 (이메일 형식, 비밀번호 길이)
- 테스트 계정 정보를 접이식(Collapsible)으로
- 로그인 버튼 로딩 상태 개선

### 4.4 학생 화면 고도화

#### 4.4.1 학생 대시보드
- 인사 헤더 (이름 + 아바타) + 역할 액센트(블루)
- 오늘의 학습 요약 카드 (스트릭 표시)
- 마감 임박 숙제 카드 (카운트다운)
- 통계 카드 표준화 (StatCard 패턴)
- 하드코딩 제거, 디자인 토큰 적용

#### 4.4.2 숙제 화면
- 탭 필터 칩 (전체/진행중/완료/지연)
- 숙제 카드 진행률 바 + 남은시간
- EmptyState 적용 ("숙제가 없습니다")
- SkeletonLoader 적용

#### 4.4.3 문제 풀기 화면
- 문제 번호 네비게이션 바 (풀음/안풀음)
- 타이머 표시
- AI 힌트 버튼 위치 개선
- 제출 확인 모달

#### 4.4.4 오답노트 화면
- 마스터리 진행률 표시
- 필터 칩 개선
- EmptyState ("오답이 없습니다! 잘하고 있어요")
- SkeletonLoader 적용

#### 4.4.5 분석 화면
- 차트 색상 테마 토큰 연동
- 약점 분석 카드 강조
- SkeletonLoader 적용

### 4.5 선생님 화면 고도화

#### 4.5.1 선생님 대시보드
- 역할 액센트(인디고) 적용
- 현황 요약 카드 표준화
- 빠른 액션 그리드 개선
- 주의 필요 학생 알림 카드

#### 4.5.2 학생 관리
- 학생 카드: 아바타 + 이름 + 정답률 + 상태배지
- 검색 + 필터
- EmptyState 적용

#### 4.5.3 숙제 관리
- 숙제 카드 진행현황 표시 개선
- SkeletonLoader 적용

#### 4.5.4 채점 화면
- 원터치 정답/오답 마킹 UI
- 코멘트 입력 개선

#### 4.5.5 문제은행
- 필터 개선
- SkeletonLoader 적용
- EmptyState 적용

#### 4.5.6 학생 분석
- 차트 테마 토큰 연동
- SkeletonLoader 적용

### 4.6 학부모 화면 고도화

#### 4.6.1 학부모 대시보드
- 역할 액센트(그린) 적용
- 자녀 선택기 아바타 추가
- 주요 지표 카드 표준화
- AI 조언 카드 개선

#### 4.6.2 스케줄
- 캘린더 주간/월간 토글
- 마감 임박 강조 표시

#### 4.6.3 리포트
- 기간 선택 (주간/월간)
- 차트 테마 토큰 연동

### 4.7 기본 애니메이션

- **SkeletonLoader**: shimmer 효과 (reanimated withRepeat + withTiming)
- **화면 전환**: expo-router 기본 slide 유지
- **카드 터치**: scale(0.98) 피드백 (reanimated)
- **진행률 바/원**: 초기 로딩 시 0→값 애니메이션 (reanimated)

### 4.8 반응형 개선

- useResponsive() 훅: small(<375), medium(375-768), large(>768) 반환
- 태블릿 가로모드: 2열 레이아웃 개선
- 최소 터치 영역 44px 보장
- 모든 아이콘 버튼에 accessibilityLabel 추가

### 4.9 에러 & 빈 상태

- ErrorBoundary 래퍼 컴포넌트
- 각 화면별 EmptyState 적용 (맞춤 아이콘/메시지)
- 네트워크 에러 시 재시도 UI (Toast 또는 인라인)

## 5. 제외 사항 (이번 고도화에서)

- 다크모드 (라이트만)
- 풀 게이미피케이션 (배지, XP, 리더보드)
- 소셜 로그인 UI
- 드래그&드롭 정렬
- 음성메모 UI
- PDF 리포트 내보내기 UI
- 화려한 애니메이션 (shared element, 리스트 entering/exiting, 차트 그리기)

## 6. 제약 조건

- 기존 기능 로직 수정 없음 (UI/스타일만 변경)
- 새 패키지 최소화 (expo-font for Noto Sans KR 정도)
- react-native-paper MD3 기반 유지
- Expo Web 호환성 유지
- TypeScript strict 모드 유지
- 기존 서비스/스토어 레이어 변경 없음

## 7. 우선순위

1. **디자인 토큰 시스템** (Noto Sans KR + 타이포그래피 + 역할 색상 + 그림자/opacity/크기 토큰)
2. **공통 컴포넌트** (SkeletonLoader + EmptyState + 기존 컴포넌트 리팩토링)
3. **로그인 화면** (미니말 클린 개선 + 폼 UX)
4. **학생 화면** (대시보드→숙제→풀기→오답→분석)
5. **선생님 화면** (대시보드→학생관리→숙제관리→채점→문제은행→분석)
6. **학부모 화면** (대시보드→스케줄→리포트)
7. **반응형 & 접근성** (useResponsive + a11y labels)
8. **에러 & 빈 상태** (ErrorBoundary + EmptyState 전체 적용)
