# Mathpia UI 고도화 리서치 결과

## Part 1: 코드베이스 분석

### 1. 테마 시스템 (src/constants/theme.ts)

**색상 팔레트:**
- Primary: #4A90D9 / Light: #7AB3E8 / Dark: #2E6DB3
- Secondary: #5C6BC0 / Light: #8E99D6 / Dark: #3949AB
- Success: #4CAF50, Warning: #FF9800, Error: #F44336
- Background: #F5F5F5, Surface: #FFFFFF, SurfaceVariant: #E8E8E8
- Text: Primary #212121, Secondary #757575, Disabled #BDBDBD
- Border: #E0E0E0, Divider: #EEEEEE

**타이포그래피:** Material Design 3 스케일 (시스템 폰트). Display 57-36px, Headline 32-24px, Title 22-14px, Body 16-12px, Label 14-11px. 하지만 실제 화면에서는 하드코딩된 폰트 크기가 산재.

**스페이싱:** xs:4, sm:8, md:16, lg:24, xl:32, xxl:48
**Border Radius:** sm:4, md:8, lg:12, xl:16, full:9999
**Tablet Sizes:** minTouchTarget:44, iconSize:24, iconSizeLarge:32, avatarSize:48, buttonHeight:48, inputHeight:56, tabBarHeight:72

### 2. 공통 컴포넌트

**Button:** react-native-paper 래퍼. mode(text/outlined/contained/etc), loading, disabled, icon, fullWidth 지원. 높이 48px, borderRadius 12px.
**Input:** outlined 모드 고정. error/errorText 지원. 높이 56px, borderRadius 12px.
**Card:** PaperCard mode='elevated'. elevation 0-5. CardHeader 서브컴포넌트(title/subtitle/left/right).
**MathText:** KaTeX + WebView(native) / iframe(web). LaTeX 정규화, 동적 높이 계산.

### 3. 화면 스타일링 패턴

**로그인 화면:** SafeAreaView + KeyboardAvoidingView + ScrollView. maxWidth 500 중앙정렬. 로고 100x100 원형, 그라데이션 없음. 테스트 계정 정보 하단 고정 표시.

**학생 대시보드:** 반응형 (>768 2열). 진행률 카드(primary 배경), 통계 3개(아이콘+값+라벨), 빠른 내비 카드 4개, 학원정보 카드, 숙제 카드(좌측 4px 보더). 하드코딩 심각: 폰트 11-48px, 컨테이너 24-100px, opacity rgba 다수.

**선생님 대시보드:** 아바타+인사+로그아웃 헤더. 통계 그리드(4개, flexWrap), 빠른 액션(6개), 최근 제출 리스트. minWidth 150 하드코딩.

**학부모 대시보드:** 반응형 (>768 2열). RefreshControl. 자녀선택기, 주간현황(primary 배경), AI 조언 카드, 약점 카드(순위별 색상), 숙제 섹션. 비교적 깔끔하나 폰트 크기 하드코딩.

### 4. 내비게이션

**루트:** GestureHandlerRootView > SafeAreaProvider > PaperProvider > Stack(slide_from_right)
**학생:** 5탭(홈/숙제/오답노트/강의자료/내정보) + 2히든(solve/analytics). tabBarHeight 72px.
**선생님:** 5탭(대시보드/학생관리/숙제관리/강의자료/채점) + 3히든(problem-bank/problem-extract/student-analytics).
**학부모:** 3탭(홈/스케줄/리포트).

### 5. 차트 컴포넌트

react-native-svg 기반. RadarChart(다각형+그리드), LineChart(경로+영역채우기), BarChart(수직막대), HeatMap(색상 보간 그리드). 모두 로컬 색상 상수 사용(테마 미연동). useMemo 최적화 적용.

### 6. 하드코딩 심각도

| 항목 | 상태 | 예시 |
|------|------|------|
| 폰트 크기 | 심각 | 11-48px 산재, theme typography 미사용 |
| 컴포넌트 크기 | 중간 | 40-52px 범위 비일관적 |
| Opacity | 심각 | rgba(255,255,255,0.8) 등 인라인 |
| 그림자 | 중간 | shadowColor/Offset/Opacity 하드코딩 |
| 색상 | 양호 | 대부분 colors.* 사용, 일부 '#FFFFFF' |
| 스페이싱 | 양호 | spacing.* 대부분 사용, 일부 원시값 |

### 7. react-native-reanimated

**설치됨 (v4.2.1) 하지만 완전 미사용.** useSharedValue, useAnimatedStyle, withTiming, withSpring 등 어디에서도 import 없음. 기본 expo-router slide_from_right 애니메이션만 존재.

---

## Part 2: 경쟁사 UI 분석

### 주요 경쟁사

**매쓰플랫 (MathFlat):** 수학 문제은행 + 학원관리. 다양한 디자인 템플릿, 실시간 학부모 대시보드, 교재/자동채점 학습지.
**아이엠스쿨:** 학원관리 SMS 앱. 빠른 메시지 발송, 실시간 출결, 원터치 출석+학부모 알림.
**클래스팅:** AI 기반 LMS. SNS 스타일 인터페이스(좌측메뉴), 초대코드 학급, 과제 제출 추적.
**콴다 (QANDA):** AI 수학 풀이 앱. 카메라 스캔 입력, ChatGPT 스타일 대화 튜터링, 단계별 풀이.
**엘리하이:** 태블릿 기반 학습 서비스. 전용 태블릿+잠금 브라우저, 게임형 콘텐츠, 학년별 UI.
**투두수학:** 게임 기반 유아 수학 앱. 캐릭터 수집, 접근성(왼손모드/난독증폰트), 사운드 피드백.

### 한국 에듀테크 공통 UI 패턴

**색상:** 대담하고 선명한 색상 선호, 높은 명암비 (서양의 파스텔/중립 트렌드와 다름). 교육 앱: 파랑(안정)+흰(순수)+빨강(열정) 조합.
**타이포그래피:** 굵고 읽기 쉬운 폰트 우선. 아이콘마다 텍스트 라벨 필수. 장식 폰트 최소화.
**내비게이션:** 하단 탭(3-5개) 표준. 드로어 메뉴(부가 옵션). 태블릿은 좌측 사이드바 고려.
**차트:** 필수 데이터만 표시, 차트 유형↔질문 매칭, 직접 라벨링, 색맹 대응.
**게이미피케이션:** 스트릭(연속학습일), 배지(달성), XP/포인트, 리더보드. Duolingo: 스트릭 이탈률 21% 감소, 배지 획득자 코스완료 30% 향상.

### 글로벌 벤치마크

**Khan Academy:** 역할별 대시보드(부모/교사/학생). 단원별 마스터리 추적, 드릴다운 상세. 커스텀 리포트.
**Photomath:** 미니멀 회색 + 빨간 액센트. 카메라 입력 메인, 점진적 공개(탭하여 상세), 다중 풀이법.
**Duolingo:** 스트릭+배지+XP 3종 세트 게이미피케이션. 일일 목표, 마일스톤 축하 애니메이션.

### 태블릿 특화 고려사항

- 가로모드: 문제 좌측 + 캔버스 우측 분할
- 세로모드: 문제 위 + 캔버스 아래 적층
- 터치: 1손가락=그리기, 2손가락핀치=확대, 2손가락드래그=이동, 3손가락탭=실행취소
- 성능: 60fps 드로잉 필수, 오프스크린 캔버스 렌더링

### Mathpia 차별화 포인트

1. 태블릿 퍼스트 디자인 (대부분 경쟁사는 모바일 퍼스트)
2. 스타일러스 최적화 (압력 감지)
3. 다역할 생태계 (교사/학생/학부모)
4. 실시간 협업 (교사가 학생 풀이에 주석)
5. AI 통합 (문제 생성/튜터링)
6. 접근성 (왼손모드, 색맹 대응)
