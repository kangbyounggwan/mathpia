# Mathpia 데이터베이스 스키마 설계 (Supabase)

## 개요

Mathpia는 학원 학생 및 선생님을 위한 AI 기반 수학 학습 플랫폼입니다.
이 문서는 **Supabase**를 활용한 데이터베이스 구조를 정의합니다.

---

## Supabase 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase Project                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Auth      │  │  Database   │  │       Storage           │ │
│  │  (인증)     │  │ (PostgreSQL)│  │   (파일 저장소)          │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                     │               │
│         │    ┌───────────┴───────────┐         │               │
│         │    │                       │         │               │
│         ▼    ▼                       ▼         ▼               │
│  ┌─────────────────┐         ┌─────────────────────┐           │
│  │   Row Level     │         │     Realtime        │           │
│  │   Security      │         │   (실시간 구독)      │           │
│  └─────────────────┘         └─────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 핵심 Supabase 기능 활용

| 기능 | 용도 |
|------|------|
| **Supabase Auth** | 이메일/비밀번호 인증, 소셜 로그인 (Google, Kakao) |
| **PostgreSQL** | 메인 데이터베이스 |
| **Row Level Security (RLS)** | 역할 기반 데이터 접근 제어 |
| **Supabase Storage** | 이미지, PDF, 필기 답안 파일 저장 |
| **Realtime** | 실시간 알림, 숙제 업데이트 구독 |
| **Edge Functions** | AI 문제 추출, 알림 발송 등 서버리스 함수 |

---

## ERD (Entity Relationship Diagram)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Academy   │───┬───│  profiles   │───────│   Class     │
└─────────────┘   │   │(auth.users) │       └─────────────┘
                  │   └─────────────┘              │
                  │          │                     │
                  │   ┌──────┴──────┐              │
                  │   │             │              │
                  │   ▼             ▼              │
              ┌─────────┐    ┌──────────┐         │
              │ Student │    │ Teacher  │         │
              │ Profile │    │ Profile  │         │
              └─────────┘    └──────────┘         │
                  │               │               │
                  │      ┌────────┴────────┐      │
                  │      │                 │      │
                  │      ▼                 ▼      │
                  │  ┌────────┐     ┌──────────┐  │
                  │  │Material│     │ Problem  │  │
                  │  └────────┘     │   Bank   │  │
                  │                 └──────────┘  │
                  │                      │        │
                  │                      ▼        │
                  │              ┌────────────┐   │
                  └──────────────│ Assignment │───┘
                                 └────────────┘
                                       │
                                       ▼
                               ┌──────────────┐
                               │  Submission  │
                               └──────────────┘
                                       │
                                       ▼
                               ┌──────────────┐
                               │   Grading    │
                               └──────────────┘
```

---

## Storage Buckets 설계

```sql
-- Supabase Storage Buckets
-- Dashboard에서 생성하거나 SQL로 생성

-- 1. 프로필 이미지 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- 2. 문제 이미지 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('problems', 'problems', false);

-- 3. 강의자료 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', false);

-- 4. 학생 답안 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', false);

-- 5. 채점 피드백 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('gradings', 'gradings', false);
```

### Storage 정책 (RLS)

```sql
-- avatars: 누구나 읽기, 본인만 업로드
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- materials: 같은 학원 사용자만 접근
CREATE POLICY "Academy members can access materials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'materials' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.academy_id::text = (storage.foldername(name))[1]
  )
);

-- submissions: 본인 또는 담당 선생님만 접근
CREATE POLICY "Students can access own submissions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'submissions' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

---

## 테이블 정의

### 1. Academy (학원)

```sql
CREATE TABLE academies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(100),
    logo_url TEXT,
    subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium')),
    max_students INTEGER DEFAULT 50,
    max_teachers INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 업데이트 시 자동 타임스탬프
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON academies
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS 활성화
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;

-- 같은 학원 멤버만 조회 가능
CREATE POLICY "Academy members can view their academy"
ON academies FOR SELECT
USING (
    id IN (
        SELECT academy_id FROM profiles WHERE id = auth.uid()
    )
);
```

---

### 2. Profiles (사용자 프로필) - Supabase Auth 연동

Supabase Auth의 `auth.users` 테이블과 연동되는 확장 프로필 테이블입니다.

```sql
-- 사용자 역할 ENUM 타입
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

-- 학년 ENUM 타입
CREATE TYPE grade_level AS ENUM ('중1', '중2', '중3', '고1', '고2', '고3');

CREATE TABLE profiles (
    -- auth.users.id와 연결
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    academy_id UUID REFERENCES academies(id) ON DELETE SET NULL,
    role user_role NOT NULL DEFAULT 'student',
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 자동 타임스탬프 트리거
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 본인 프로필은 항상 조회 가능
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- 같은 학원 멤버 프로필 조회 가능
CREATE POLICY "Academy members can view each other"
ON profiles FOR SELECT
USING (
    academy_id IN (
        SELECT academy_id FROM profiles WHERE id = auth.uid()
    )
);

-- 본인 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());

-- 회원가입 시 프로필 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

### 3. Student_Profiles (학생 상세정보)

```sql
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    grade grade_level NOT NULL,
    school_name VARCHAR(100),
    parent_phone VARCHAR(20),
    parent_name VARCHAR(50),
    study_streak INTEGER DEFAULT 0,
    total_problems_solved INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_student_profiles_updated_at
BEFORE UPDATE ON student_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- 본인 정보 조회
CREATE POLICY "Students can view own profile"
ON student_profiles FOR SELECT
USING (id = auth.uid());

-- 선생님은 같은 학원 학생 정보 조회 가능
CREATE POLICY "Teachers can view students in their academy"
ON student_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('teacher', 'admin')
        AND p.academy_id = (
            SELECT academy_id FROM profiles WHERE id = student_profiles.id
        )
    )
);

-- 본인만 수정 가능
CREATE POLICY "Students can update own profile"
ON student_profiles FOR UPDATE
USING (id = auth.uid());

-- 선생님은 메모만 수정 가능
CREATE POLICY "Teachers can update student memo"
ON student_profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('teacher', 'admin')
    )
);

CREATE INDEX idx_student_profiles_grade ON student_profiles(grade);
```

---

### 4. Teacher_Profiles (선생님 상세정보)

```sql
CREATE TABLE teacher_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    subjects TEXT[] DEFAULT '{}',
    grades TEXT[] DEFAULT '{}',
    introduction TEXT,
    is_head_teacher BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_teacher_profiles_updated_at
BEFORE UPDATE ON teacher_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

-- 같은 학원 멤버는 선생님 정보 조회 가능
CREATE POLICY "Academy members can view teachers"
ON teacher_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles p1, profiles p2
        WHERE p1.id = auth.uid()
        AND p2.id = teacher_profiles.id
        AND p1.academy_id = p2.academy_id
    )
);

-- 본인만 수정 가능
CREATE POLICY "Teachers can update own profile"
ON teacher_profiles FOR UPDATE
USING (id = auth.uid());
```

---

### 5. Classes (수업/반)

```sql
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    grade grade_level,
    subject VARCHAR(50),
    schedule JSONB DEFAULT '{}',
    max_students INTEGER DEFAULT 20,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 스케줄 JSONB 예시:
-- {
--   "monday": {"start": "14:00", "end": "16:00"},
--   "wednesday": {"start": "14:00", "end": "16:00"}
-- }

CREATE TRIGGER set_classes_updated_at
BEFORE UPDATE ON classes
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- 같은 학원 멤버만 조회
CREATE POLICY "Academy members can view classes"
ON classes FOR SELECT
USING (
    academy_id IN (
        SELECT academy_id FROM profiles WHERE id = auth.uid()
    )
);

-- 선생님/관리자만 생성 가능
CREATE POLICY "Teachers can create classes"
ON classes FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
        AND academy_id = classes.academy_id
    )
);

-- 담당 선생님 또는 관리자만 수정 가능
CREATE POLICY "Class teacher can update"
ON classes FOR UPDATE
USING (
    teacher_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
        AND academy_id = classes.academy_id
    )
);

CREATE INDEX idx_classes_academy ON classes(academy_id);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
```

---

### 6. Class_Students (수업-학생 연결)

```sql
CREATE TABLE class_students (
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'dropped')),
    PRIMARY KEY (class_id, student_id)
);

-- RLS
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

-- 학생은 본인 수업 조회
CREATE POLICY "Students can view own enrollments"
ON class_students FOR SELECT
USING (student_id = auth.uid());

-- 선생님은 담당 수업의 학생 조회
CREATE POLICY "Teachers can view class students"
ON class_students FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM classes c
        WHERE c.id = class_students.class_id
        AND c.teacher_id = auth.uid()
    )
);

-- 선생님만 학생 등록/수정 가능
CREATE POLICY "Teachers can manage enrollments"
ON class_students FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM classes c
        JOIN profiles p ON p.id = auth.uid()
        WHERE c.id = class_students.class_id
        AND (c.teacher_id = auth.uid() OR p.role = 'admin')
    )
);

CREATE INDEX idx_class_students_student ON class_students(student_id);
```

---

### 7. Teacher_Students (선생님-학생 담당 관계)

```sql
CREATE TABLE teacher_students (
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_primary BOOLEAN DEFAULT false,
    PRIMARY KEY (teacher_id, student_id)
);

-- RLS
ALTER TABLE teacher_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their students"
ON teacher_students FOR SELECT
USING (teacher_id = auth.uid());

CREATE POLICY "Students can view their teachers"
ON teacher_students FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage assignments"
ON teacher_students FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
    )
);

CREATE INDEX idx_teacher_students_student ON teacher_students(student_id);
```

---

### 8. Problem_Bank (문제 은행)

```sql
-- 문제 유형 ENUM
CREATE TYPE problem_type AS ENUM ('객관식', '서술형', '단답형');

-- 난이도 ENUM
CREATE TYPE difficulty_level AS ENUM ('상', '중', '하');

-- 문제 출처 ENUM
CREATE TYPE source_type AS ENUM ('manual', 'ai_extracted');

CREATE TABLE problem_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- 문제 내용
    content TEXT NOT NULL,
    content_html TEXT,
    image_urls TEXT[] DEFAULT '{}',

    -- 정답 및 풀이
    answer TEXT,
    solution TEXT,

    -- 분류
    difficulty difficulty_level,
    type problem_type,
    choices JSONB,  -- ["① 1", "② 2", "③ 3", "④ 4", "⑤ 5"]

    -- 교육과정 정보
    grade grade_level,
    subject VARCHAR(50),
    topic VARCHAR(100),
    tags TEXT[] DEFAULT '{}',

    -- 메타데이터
    source VARCHAR(100),
    source_type source_type DEFAULT 'manual',
    points INTEGER DEFAULT 10,
    usage_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_problem_bank_updated_at
BEFORE UPDATE ON problem_bank
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE problem_bank ENABLE ROW LEVEL SECURITY;

-- 같은 학원 선생님만 조회
CREATE POLICY "Teachers can view problems"
ON problem_bank FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
        AND academy_id = problem_bank.academy_id
    )
);

-- 선생님만 문제 생성 가능
CREATE POLICY "Teachers can create problems"
ON problem_bank FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
        AND academy_id = problem_bank.academy_id
    )
);

-- 생성자 또는 관리자만 수정 가능
CREATE POLICY "Problem creator can update"
ON problem_bank FOR UPDATE
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
        AND academy_id = problem_bank.academy_id
    )
);

CREATE INDEX idx_problems_academy ON problem_bank(academy_id);
CREATE INDEX idx_problems_grade ON problem_bank(grade);
CREATE INDEX idx_problems_topic ON problem_bank(topic);
CREATE INDEX idx_problems_difficulty ON problem_bank(difficulty);
CREATE INDEX idx_problems_tags ON problem_bank USING GIN(tags);
CREATE INDEX idx_problems_search ON problem_bank(grade, subject, difficulty);
```

---

### 9. Assignments (숙제/과제)

```sql
-- 숙제 상태 ENUM
CREATE TYPE assignment_status AS ENUM ('draft', 'published', 'closed');

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,

    title VARCHAR(200) NOT NULL,
    description TEXT,
    grade grade_level,
    subject VARCHAR(50),

    due_date TIMESTAMPTZ,
    total_points INTEGER DEFAULT 100,
    status assignment_status DEFAULT 'draft',

    allow_late_submission BOOLEAN DEFAULT false,
    show_answer_after_due BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_assignments_updated_at
BEFORE UPDATE ON assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- 배정된 학생은 published 숙제만 조회
CREATE POLICY "Students can view assigned assignments"
ON assignments FOR SELECT
USING (
    status = 'published' AND
    EXISTS (
        SELECT 1 FROM assignment_students
        WHERE assignment_students.assignment_id = assignments.id
        AND assignment_students.student_id = auth.uid()
    )
);

-- 선생님은 본인이 만든 숙제 전체 조회
CREATE POLICY "Teachers can view own assignments"
ON assignments FOR SELECT
USING (teacher_id = auth.uid());

-- 같은 학원 선생님도 조회 가능
CREATE POLICY "Academy teachers can view assignments"
ON assignments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
        AND academy_id = assignments.academy_id
    )
);

-- 선생님만 생성 가능
CREATE POLICY "Teachers can create assignments"
ON assignments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
    )
    AND teacher_id = auth.uid()
);

-- 본인이 만든 숙제만 수정 가능
CREATE POLICY "Teachers can update own assignments"
ON assignments FOR UPDATE
USING (teacher_id = auth.uid());

CREATE INDEX idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_status ON assignments(status);
```

---

### 10. Assignment_Problems (숙제-문제 연결)

```sql
CREATE TABLE assignment_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    points INTEGER,
    UNIQUE(assignment_id, problem_id)
);

-- RLS
ALTER TABLE assignment_problems ENABLE ROW LEVEL SECURITY;

-- 숙제 조회 권한이 있으면 문제도 조회 가능
CREATE POLICY "Can view if can view assignment"
ON assignment_problems FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = assignment_problems.assignment_id
        AND (
            a.teacher_id = auth.uid() OR
            (a.status = 'published' AND EXISTS (
                SELECT 1 FROM assignment_students asn
                WHERE asn.assignment_id = a.id
                AND asn.student_id = auth.uid()
            ))
        )
    )
);

-- 숙제 생성자만 문제 추가/수정 가능
CREATE POLICY "Assignment creator can manage problems"
ON assignment_problems FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = assignment_problems.assignment_id
        AND a.teacher_id = auth.uid()
    )
);

CREATE INDEX idx_assignment_problems_assignment ON assignment_problems(assignment_id);
```

---

### 11. Assignment_Students (숙제-학생 배정)

```sql
-- 학생 숙제 상태 ENUM
CREATE TYPE student_assignment_status AS ENUM ('assigned', 'in_progress', 'submitted', 'graded');

CREATE TABLE assignment_students (
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status student_assignment_status DEFAULT 'assigned',
    total_score INTEGER,
    progress_percent INTEGER DEFAULT 0,
    PRIMARY KEY (assignment_id, student_id)
);

-- RLS
ALTER TABLE assignment_students ENABLE ROW LEVEL SECURITY;

-- 학생은 본인 배정 내역 조회
CREATE POLICY "Students can view own assignments"
ON assignment_students FOR SELECT
USING (student_id = auth.uid());

-- 선생님은 본인 숙제의 배정 내역 조회
CREATE POLICY "Teachers can view assignment students"
ON assignment_students FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = assignment_students.assignment_id
        AND a.teacher_id = auth.uid()
    )
);

-- 선생님만 학생 배정 가능
CREATE POLICY "Teachers can assign students"
ON assignment_students FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = assignment_students.assignment_id
        AND a.teacher_id = auth.uid()
    )
);

-- 학생은 본인 상태만 업데이트 (시작, 진행 등)
CREATE POLICY "Students can update own status"
ON assignment_students FOR UPDATE
USING (student_id = auth.uid());

CREATE INDEX idx_assignment_students_student ON assignment_students(student_id);
CREATE INDEX idx_assignment_students_status ON assignment_students(status);
CREATE INDEX idx_assignment_students_lookup ON assignment_students(student_id, status, assignment_id);
```

---

### 12. Submissions (문제별 제출)

```sql
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,

    answer_text TEXT,
    answer_image_url TEXT,
    canvas_data JSONB,  -- 캔버스 스트로크 데이터

    is_correct BOOLEAN,
    score INTEGER,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    time_spent_seconds INTEGER,

    UNIQUE(assignment_id, student_id, problem_id)
);

-- RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 학생은 본인 제출 조회
CREATE POLICY "Students can view own submissions"
ON submissions FOR SELECT
USING (student_id = auth.uid());

-- 선생님은 본인 숙제의 제출 조회
CREATE POLICY "Teachers can view submissions"
ON submissions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = submissions.assignment_id
        AND a.teacher_id = auth.uid()
    )
);

-- 학생은 본인 답안만 제출 가능
CREATE POLICY "Students can submit answers"
ON submissions FOR INSERT
WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM assignment_students asn
        WHERE asn.assignment_id = submissions.assignment_id
        AND asn.student_id = auth.uid()
    )
);

-- 학생은 제출 전까지만 수정 가능
CREATE POLICY "Students can update own submissions"
ON submissions FOR UPDATE
USING (student_id = auth.uid());

CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_grading_pending ON submissions(assignment_id, student_id) WHERE score IS NULL;
```

---

### 13. Gradings (채점/피드백)

```sql
CREATE TABLE gradings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    feedback TEXT,
    feedback_image_url TEXT,
    graded_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE gradings ENABLE ROW LEVEL SECURITY;

-- 학생은 본인 제출에 대한 채점 조회
CREATE POLICY "Students can view own gradings"
ON gradings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM submissions s
        WHERE s.id = gradings.submission_id
        AND s.student_id = auth.uid()
    )
);

-- 선생님은 본인이 채점한 내역 조회
CREATE POLICY "Teachers can view own gradings"
ON gradings FOR SELECT
USING (teacher_id = auth.uid());

-- 선생님만 채점 가능
CREATE POLICY "Teachers can grade submissions"
ON gradings FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
    )
    AND teacher_id = auth.uid()
);

-- 본인 채점만 수정 가능
CREATE POLICY "Teachers can update own gradings"
ON gradings FOR UPDATE
USING (teacher_id = auth.uid());

CREATE INDEX idx_gradings_submission ON gradings(submission_id);
CREATE INDEX idx_gradings_teacher ON gradings(teacher_id);
```

---

### 14. Materials (강의자료)

```sql
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    title VARCHAR(200) NOT NULL,
    description TEXT,
    grade grade_level,
    subject VARCHAR(50),
    topic VARCHAR(100),

    file_url TEXT NOT NULL,
    file_type VARCHAR(20),
    file_size_bytes BIGINT,
    thumbnail_url TEXT,

    view_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_materials_updated_at
BEFORE UPDATE ON materials
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- 같은 학원 멤버는 공개 자료 조회 가능
CREATE POLICY "Academy members can view public materials"
ON materials FOR SELECT
USING (
    is_public = true AND
    academy_id IN (
        SELECT academy_id FROM profiles WHERE id = auth.uid()
    )
);

-- 선생님은 모든 자료 조회 가능
CREATE POLICY "Teachers can view all materials"
ON materials FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
        AND academy_id = materials.academy_id
    )
);

-- 선생님만 자료 생성 가능
CREATE POLICY "Teachers can create materials"
ON materials FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
    )
    AND teacher_id = auth.uid()
);

-- 본인 자료만 수정 가능
CREATE POLICY "Teachers can update own materials"
ON materials FOR UPDATE
USING (teacher_id = auth.uid());

CREATE INDEX idx_materials_academy ON materials(academy_id);
CREATE INDEX idx_materials_teacher ON materials(teacher_id);
CREATE INDEX idx_materials_grade ON materials(grade);
```

---

### 15. Material_Access (강의자료 접근 기록)

```sql
CREATE TABLE material_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    view_duration_seconds INTEGER
);

-- RLS
ALTER TABLE material_access ENABLE ROW LEVEL SECURITY;

-- 학생은 본인 접근 기록 조회
CREATE POLICY "Students can view own access"
ON material_access FOR SELECT
USING (student_id = auth.uid());

-- 선생님은 본인 자료의 접근 기록 조회
CREATE POLICY "Teachers can view material access"
ON material_access FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM materials m
        WHERE m.id = material_access.material_id
        AND m.teacher_id = auth.uid()
    )
);

-- 누구나 접근 기록 생성 가능
CREATE POLICY "Anyone can record access"
ON material_access FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE INDEX idx_material_access_material ON material_access(material_id);
CREATE INDEX idx_material_access_student ON material_access(student_id);
```

---

### 16. Notifications (알림)

```sql
-- 알림 유형 ENUM
CREATE TYPE notification_type AS ENUM (
    'new_assignment',
    'assignment_due_soon',
    'grading_complete',
    'new_material',
    'submission_received',
    'system'
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 본인 알림만 조회
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- 본인 알림만 업데이트 (읽음 처리)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- 시스템 또는 선생님이 알림 생성 (Edge Function에서 처리)
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);  -- Edge Function에서 service_role로 처리

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Realtime 활성화 (실시간 알림용)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

### 17. Study_Logs (학습 기록)

```sql
-- 활동 유형 ENUM
CREATE TYPE activity_type AS ENUM (
    'problem_solved',
    'material_viewed',
    'assignment_started',
    'assignment_completed',
    'login'
);

CREATE TABLE study_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    duration_seconds INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;

-- 학생은 본인 로그 조회
CREATE POLICY "Students can view own logs"
ON study_logs FOR SELECT
USING (student_id = auth.uid());

-- 선생님은 담당 학생 로그 조회
CREATE POLICY "Teachers can view student logs"
ON study_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM teacher_students ts
        WHERE ts.teacher_id = auth.uid()
        AND ts.student_id = study_logs.student_id
    )
);

-- 학생은 본인 로그만 생성
CREATE POLICY "Students can create own logs"
ON study_logs FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE INDEX idx_study_logs_student ON study_logs(student_id);
CREATE INDEX idx_study_logs_created ON study_logs(created_at DESC);
CREATE INDEX idx_study_logs_type ON study_logs(activity_type);
CREATE INDEX idx_study_logs_recent ON study_logs(student_id, created_at DESC);
```

---

## Database Functions

### 1. 숙제 진행률 자동 업데이트

```sql
CREATE OR REPLACE FUNCTION update_assignment_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_count INTEGER;
    submitted_count INTEGER;
    new_status student_assignment_status;
BEGIN
    -- 총 문제 수
    SELECT COUNT(*) INTO total_count
    FROM assignment_problems
    WHERE assignment_id = NEW.assignment_id;

    -- 제출된 문제 수
    SELECT COUNT(*) INTO submitted_count
    FROM submissions
    WHERE assignment_id = NEW.assignment_id
    AND student_id = NEW.student_id;

    -- 상태 결정
    IF submitted_count = total_count THEN
        new_status := 'submitted';
    ELSIF submitted_count > 0 THEN
        new_status := 'in_progress';
    ELSE
        new_status := 'assigned';
    END IF;

    -- 업데이트
    UPDATE assignment_students
    SET
        progress_percent = CASE WHEN total_count > 0 THEN (submitted_count * 100 / total_count) ELSE 0 END,
        status = new_status,
        started_at = COALESCE(started_at, CASE WHEN submitted_count > 0 THEN NOW() ELSE NULL END),
        completed_at = CASE WHEN submitted_count = total_count THEN NOW() ELSE NULL END
    WHERE assignment_id = NEW.assignment_id
    AND student_id = NEW.student_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_progress
AFTER INSERT OR UPDATE ON submissions
FOR EACH ROW EXECUTE FUNCTION update_assignment_progress();
```

### 2. 채점 시 점수 동기화

```sql
CREATE OR REPLACE FUNCTION sync_grading_score()
RETURNS TRIGGER AS $$
BEGIN
    -- submission에 점수 반영
    UPDATE submissions
    SET score = NEW.score, is_correct = (NEW.score > 0)
    WHERE id = NEW.submission_id;

    -- assignment_students 총점 업데이트
    UPDATE assignment_students asn
    SET total_score = (
        SELECT COALESCE(SUM(s.score), 0)
        FROM submissions s
        WHERE s.assignment_id = asn.assignment_id
        AND s.student_id = asn.student_id
    ),
    status = 'graded'
    WHERE (asn.assignment_id, asn.student_id) = (
        SELECT s.assignment_id, s.student_id
        FROM submissions s
        WHERE s.id = NEW.submission_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_grading
AFTER INSERT OR UPDATE ON gradings
FOR EACH ROW EXECUTE FUNCTION sync_grading_score();
```

### 3. 학생 통계 업데이트

```sql
CREATE OR REPLACE FUNCTION update_student_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE student_profiles
    SET
        total_problems_solved = (
            SELECT COUNT(*) FROM submissions
            WHERE student_id = NEW.student_id AND score IS NOT NULL
        ),
        average_score = (
            SELECT COALESCE(AVG(total_score), 0)
            FROM assignment_students
            WHERE student_id = NEW.student_id AND status = 'graded'
        )
    WHERE id = NEW.student_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_student_stats
AFTER UPDATE ON assignment_students
FOR EACH ROW
WHEN (NEW.status = 'graded')
EXECUTE FUNCTION update_student_stats();
```

### 4. 알림 생성 함수

```sql
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type notification_type,
    p_title VARCHAR(200),
    p_message TEXT DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id)
    VALUES (p_user_id, p_type, p_title, p_message, p_reference_type, p_reference_id)
    RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5. 숙제 배정 시 알림 자동 발송

```sql
CREATE OR REPLACE FUNCTION notify_assignment()
RETURNS TRIGGER AS $$
DECLARE
    assignment_title VARCHAR(200);
BEGIN
    SELECT title INTO assignment_title
    FROM assignments WHERE id = NEW.assignment_id;

    PERFORM create_notification(
        NEW.student_id,
        'new_assignment',
        '새로운 숙제가 배정되었습니다',
        assignment_title,
        'assignment',
        NEW.assignment_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_assignment
AFTER INSERT ON assignment_students
FOR EACH ROW EXECUTE FUNCTION notify_assignment();
```

---

## Views

### 학생 대시보드 뷰

```sql
CREATE OR REPLACE VIEW student_dashboard AS
SELECT
    sp.id AS student_id,
    sp.grade,
    sp.study_streak,
    sp.total_problems_solved,
    sp.average_score,
    p.name,
    p.avatar_url,
    (SELECT COUNT(*) FROM assignment_students asn
     WHERE asn.student_id = sp.id AND asn.status = 'assigned') AS pending_assignments,
    (SELECT COUNT(*) FROM assignment_students asn
     WHERE asn.student_id = sp.id AND asn.status = 'in_progress') AS in_progress_assignments,
    (SELECT COUNT(*) FROM notifications n
     WHERE n.user_id = sp.id AND n.is_read = false) AS unread_notifications,
    (SELECT MAX(created_at) FROM study_logs sl
     WHERE sl.student_id = sp.id) AS last_activity
FROM student_profiles sp
JOIN profiles p ON sp.id = p.id;
```

### 선생님 대시보드 뷰

```sql
CREATE OR REPLACE VIEW teacher_dashboard AS
SELECT
    tp.id AS teacher_id,
    p.name,
    p.avatar_url,
    (SELECT COUNT(DISTINCT ts.student_id) FROM teacher_students ts
     WHERE ts.teacher_id = tp.id) AS total_students,
    (SELECT COUNT(*) FROM assignments a
     WHERE a.teacher_id = tp.id AND a.status = 'published') AS active_assignments,
    (SELECT COUNT(*) FROM submissions sub
     JOIN assignments a ON sub.assignment_id = a.id
     WHERE a.teacher_id = tp.id
     AND sub.score IS NULL) AS pending_gradings,
    (SELECT COUNT(*) FROM notifications n
     WHERE n.user_id = tp.id AND n.is_read = false) AS unread_notifications
FROM teacher_profiles tp
JOIN profiles p ON tp.id = p.id;
```

### 숙제 진행 현황 뷰

```sql
CREATE OR REPLACE VIEW assignment_progress_view AS
SELECT
    a.id AS assignment_id,
    a.title,
    a.due_date,
    a.status AS assignment_status,
    a.teacher_id,
    asn.student_id,
    p.name AS student_name,
    asn.status AS student_status,
    asn.progress_percent,
    asn.total_score,
    (SELECT COUNT(*) FROM assignment_problems ap WHERE ap.assignment_id = a.id) AS total_problems,
    (SELECT COUNT(*) FROM submissions s
     WHERE s.assignment_id = a.id AND s.student_id = asn.student_id) AS submitted_problems
FROM assignments a
JOIN assignment_students asn ON a.id = asn.assignment_id
JOIN profiles p ON asn.student_id = p.id;
```

---

## 핵심 상호작용 흐름

### 1. 숙제 출제 → 풀이 → 채점 흐름

```
선생님                     Supabase                         학생
   │                          │                               │
   ├─ 문제 AI추출 ──────────▶│                               │
   │  (Edge Function)         ├─ problem_bank INSERT         │
   │                          │                               │
   ├─ 숙제 생성 ─────────────▶│                               │
   │                          ├─ assignments INSERT           │
   │                          ├─ assignment_problems INSERT   │
   │                          │                               │
   ├─ 학생 배정 ─────────────▶│                               │
   │                          ├─ assignment_students INSERT   │
   │                          ├─ [Trigger] notifications INSERT│
   │                          ├─ [Realtime] ──────────────────▶│ 실시간 알림
   │                          │                               │
   │                          │◀────────── submissions INSERT ─┤
   │                          ├─ [Trigger] progress 업데이트   │
   │                          ├─ [Realtime] ──────────────────▶│
   │◀─ [Realtime] 제출 알림 ──┤                               │
   │                          │                               │
   ├─ gradings INSERT ───────▶│                               │
   │                          ├─ [Trigger] score 동기화        │
   │                          ├─ [Trigger] stats 업데이트      │
   │                          ├─ [Trigger] notifications INSERT│
   │                          ├─ [Realtime] ──────────────────▶│ 채점 완료 알림
   │                          │                               │
```

---

## React Native + Supabase 연동

### 클라이언트 설정

```typescript
// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from './database.types'; // Supabase CLI로 자동 생성

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### 실시간 알림 구독

```typescript
// src/hooks/useNotifications.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export function useNotifications() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // 새 알림 처리
          console.log('New notification:', payload.new);
          // 푸시 알림 표시 등
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
}
```

---

## 설치 순서

### 1. Supabase 프로젝트 생성
1. https://supabase.com 에서 새 프로젝트 생성
2. Project URL과 anon key 복사

### 2. 환경변수 설정

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. SQL 실행 순서

Supabase Dashboard > SQL Editor에서 순서대로 실행:

1. **ENUM 타입 생성** (user_role, grade_level, etc.)
2. **기본 함수 생성** (update_updated_at)
3. **테이블 생성** (academies → profiles → 나머지)
4. **RLS 정책 설정**
5. **트리거 및 함수 생성**
6. **뷰 생성**
7. **Storage 버킷 생성**

### 4. 패키지 설치

```bash
npm install @supabase/supabase-js react-native-url-polyfill @react-native-async-storage/async-storage
```

### 5. 타입 자동 생성

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

---

## 다음 단계

- [ ] Supabase 프로젝트 생성
- [ ] 환경변수 설정 (.env)
- [ ] SQL 스크립트 실행
- [ ] Storage 버킷 및 정책 설정
- [ ] supabase 클라이언트 설정
- [ ] 기존 authStore를 Supabase Auth로 마이그레이션
- [ ] 타입 정의 자동 생성 및 연동
- [ ] 실시간 알림 구현
- [ ] Edge Function 설정 (AI 문제 추출)
