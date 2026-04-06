# Mathpia 기능 고도화 스펙

## 프로젝트 개요
Mathpia는 한국 수학 학원용 태블릿 앱 (Expo SDK 54 / React Native / TypeScript)으로,
선생님/학생/학부모 3가지 역할을 지원합니다.

현재 UI는 대부분 완성되어 있으나, **실제 기능 구현은 10~40% 수준**입니다.
대부분의 화면이 하드코딩된 mock 데이터를 사용하고 있으며, 스토어/서비스 레이어는
구조만 갖춰져 있습니다.

## 현재 상태 요약

### 완성된 것
- UI/UX: 80% (디자인 토큰, 공통 컴포넌트, 모든 스크린 레이아웃)
- Zustand 스토어: 7개 스토어 구조 + AsyncStorage persist
- 서비스 인터페이스: 5개 서비스 인터페이스 정의
- Mock 서비스: 모든 인터페이스의 mock 구현체
- Mock 데이터: 108문제, 15유저, 8과제, ~400제출물
- 네비게이션: expo-router 파일 기반 라우팅
- 캔버스: react-native-skia 드로잉 캔버스 (풀기 화면)

### 미완성/Mock인 것
1. **인증**: 100% Mock (하드코딩 자격증명 검증)
2. **데이터 연결**: 대부분 화면이 스토어 대신 컴포넌트 내 하드코딩 데이터 사용
3. **과제 CRUD**: UI만 있고 실제 생성/수정/삭제 미구현
4. **채점**: UI만 있고 실제 채점 로직 미구현
5. **제출**: 풀이 제출 후 저장/전송 미구현
6. **Gemini AI**: 프레임워크만 존재, 실제 API 호출 미구현
7. **PDF 문제 추출**: UI만 있고 실제 업로드/추출 미구현
8. **자료 관리**: 업로드/다운로드 미구현
9. **학부모**: 실시간 데이터 미연결

## 기능 고도화 목표

### 1단계: 화면-스토어 연결 (Mock 데이터 활용)
모든 화면의 하드코딩 데이터를 스토어에서 가져오도록 연결.
실제 백엔드 없이 mock 서비스를 통해 완전한 데이터 흐름 구현.

- 선생님 대시보드: 스토어에서 통계 데이터 fetch
- 선생님 과제관리: assignmentStore CRUD 연결
- 선생님 채점: submissionStore 연결, 채점 기능 구현
- 선생님 학생관리: 실제 학생 목록 스토어 연결
- 학생 대시보드: assignmentStore에서 숙제 목록
- 학생 숙제목록: assignmentStore 연결
- 학생 풀기: submissionStore.submitAnswer() 연결
- 학부모 대시보드: parentStore에서 실제 데이터
- 학부모 스케줄/리포트: parentStore 연결

### 2단계: 핵심 기능 구현
- 과제 생성 플로우 (문제은행에서 선택 → 과제 생성 → 학생 배정)
- 채점 플로우 (제출 확인 → 정답/오답 판정 → 피드백)
- 풀이 제출 플로우 (답안 입력/선택 → 제출 → 결과 확인)
- 오답노트 자동 수집 + AI 해설

### 3단계: Gemini AI 연동
- 문제 PDF 추출 (Gemini 2.5 Flash)
- 학습 분석 (취약점 분석, 추천 문제)
- AI 학습 조언 (학부모용)
- AI 힌트 (학생 풀이 중)

### 4단계: 백엔드 연동 (Supabase)
- Supabase Auth (이메일/비밀번호)
- Supabase Database (PostgreSQL)
- Supabase Storage (PDF, 이미지)
- 실제 서비스 구현체로 mock 교체

## 기술 스택
- **프론트엔드**: Expo SDK 54, React Native, TypeScript
- **상태관리**: Zustand v5 + AsyncStorage persist
- **UI**: react-native-paper (MD3), NotoSansKR 폰트
- **캔버스**: @shopify/react-native-skia
- **AI**: @google/genai (Gemini 2.5 Flash)
- **백엔드 (예정)**: Supabase (Auth, DB, Storage)
- **라우팅**: expo-router v6

## 제약조건
- 태블릿 최적화 (10인치 기준)
- 한국어 전용
- 오프라인 우선 (AsyncStorage 캐시)
- Gemini API 호출 최소화 (캐싱 전략)
