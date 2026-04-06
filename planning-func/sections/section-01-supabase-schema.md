# Section 1: Supabase Project Setup + DB Schema + RLS

> **Status**: Pending
> **Priority**: CRITICAL
> **Estimated Effort**: 1 day (4-6 hours)
> **Last Updated**: 2026-04-04

---

## 1. Background

Mathpia is a Korean math academy (학원) tablet app built with Expo SDK 54, React Native, and TypeScript. It supports four user roles: Teacher (선생님), Student (학생), Parent (학부모), and Admin. The app currently has a fully functional UI layer (~80% complete) and 7 Zustand stores wired to service interfaces, but **zero real backend**. All data is returned from mock services with hardcoded data.

This section establishes the entire backend foundation. It creates the Supabase project, applies the complete PostgreSQL database schema (18 tables, 8 ENUM types, RLS policies, triggers, views, and 5 storage buckets), and loads demo seed data. Every subsequent section (auth, services, screens, AI extraction, grading) depends on this foundation being in place and working correctly.

Without this section, no real data can be stored, no authentication can work, and no row-level security can enforce access control. This is Day 1 work.

---

## 2. Requirements

When this section is complete, the following must be true:

1. A Supabase project exists and is accessible via its dashboard
2. All 8 ENUM types are created (including `'parent'` in `user_role`)
3. All 18 tables are created with correct columns, constraints, indexes, and foreign keys
4. The `parent_children` junction table exists for parent-child relationships
5. The `get_my_academy_id()` SECURITY DEFINER helper function exists and returns the calling user's academy_id
6. Row-Level Security (RLS) is enabled on every table with correct policies
7. All triggers fire correctly (new user, progress update, grading sync, student stats, notifications)
8. The `handle_new_user()` trigger reads `academy_id` from `raw_user_meta_data`
9. The `sync_grading_score()` trigger only sets `assignment_students.status = 'graded'` when ALL submissions for that student-assignment pair have been graded
10. The `create_assignment_with_details()` RPC function creates assignments transactionally
11. All 3 dashboard views exist (student, teacher, assignment progress)
12. All 5 storage buckets exist with correct RLS policies
13. Demo seed data is loaded (1 academy, 3 demo users, sample problems, sample assignments)
14. Environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) are set in `.env`

---

## 3. Dependencies

| Direction | Sections | Notes |
|-----------|----------|-------|
| **Requires** | Nothing | This is the foundation; no prior sections needed |
| **Blocks** | Sections 2, 3, 4, 5, 6, 7, 8, 9, 10 | Every other section depends on the database existing |

---

## 4. Implementation Details

### Step 1.1: Create Supabase Project

1. Go to https://supabase.com and create a new project
2. **Project name**: `mathpia` (or similar)
3. **Region**: Select the closest region to Korea (Northeast Asia, e.g., `ap-northeast-1` Tokyo or `ap-northeast-2` Seoul if available)
4. **Database password**: Set a strong password and save it securely
5. Wait for project provisioning (~2 minutes)
6. Once provisioned, copy these two values from **Settings > API**:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key** (e.g., `eyJhbGciOiJIUzI1NiIs...`)
7. Also note the **service_role key** from Settings > API (needed for `scripts/seed.ts` -- never expose this in client code)

### Step 1.2: SQL Migration Execution

Execute these 6 migrations in exact order via **Supabase Dashboard > SQL Editor**. Each migration must succeed before proceeding to the next.

---

#### Migration 001: ENUMs and Base Functions

**File**: `supabase/migrations/001_enums_and_functions.sql`

```sql
-- ============================================================
-- Migration 001: ENUM Types and Base Functions
-- ============================================================

-- User roles (NOTE: includes 'parent' for the parent/guardian role)
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin', 'parent');

-- Grade levels (Korean middle school/high school)
CREATE TYPE grade_level AS ENUM ('중1', '중2', '중3', '고1', '고2', '고3');

-- Problem types
CREATE TYPE problem_type AS ENUM ('객관식', '서술형', '단답형');

-- Difficulty levels
CREATE TYPE difficulty_level AS ENUM ('상', '중', '하');

-- Problem source types
CREATE TYPE source_type AS ENUM ('manual', 'ai_extracted');

-- Assignment lifecycle status
CREATE TYPE assignment_status AS ENUM ('draft', 'published', 'closed');

-- Per-student assignment status
CREATE TYPE student_assignment_status AS ENUM ('assigned', 'in_progress', 'submitted', 'graded');

-- Notification categories
CREATE TYPE notification_type AS ENUM (
    'new_assignment',
    'assignment_due_soon',
    'grading_complete',
    'new_material',
    'submission_received',
    'system'
);

-- Study activity types
CREATE TYPE activity_type AS ENUM (
    'problem_solved',
    'material_viewed',
    'assignment_started',
    'assignment_completed',
    'login'
);

-- Base function: auto-update updated_at timestamp on any table
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS helper: get the current authenticated user's academy_id
-- This is a SECURITY DEFINER function that avoids circular RLS dependency.
-- Without this, profiles RLS policies that check academy membership would
-- need to query profiles itself, causing infinite recursion.
CREATE OR REPLACE FUNCTION get_my_academy_id()
RETURNS UUID AS $$
  SELECT academy_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

---

#### Migration 002: Tables

**File**: `supabase/migrations/002_tables.sql`

Tables must be created in dependency order (foreign key targets before foreign key sources).

```sql
-- ============================================================
-- Migration 002: All Tables (in dependency order)
-- ============================================================

-- -------------------------------------------------------
-- 1. academies (no foreign keys -- root table)
-- -------------------------------------------------------
CREATE TABLE academies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(100),
    logo_url TEXT,
    subscription_plan VARCHAR(20) DEFAULT 'free'
        CHECK (subscription_plan IN ('free', 'basic', 'premium')),
    max_students INTEGER DEFAULT 50,
    max_teachers INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_academies_updated_at
    BEFORE UPDATE ON academies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------
-- 2. profiles (references auth.users, academies)
-- -------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    academy_id UUID REFERENCES academies(id) ON DELETE SET NULL,
    role user_role NOT NULL DEFAULT 'student',
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------
-- 3. student_profiles (references profiles)
-- -------------------------------------------------------
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

CREATE INDEX idx_student_profiles_grade ON student_profiles(grade);

-- -------------------------------------------------------
-- 4. teacher_profiles (references profiles)
-- -------------------------------------------------------
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

-- -------------------------------------------------------
-- 5. parent_children (parent-child relationship junction table)
--    Used by the parent role to query their children's data.
-- -------------------------------------------------------
CREATE TABLE parent_children (
    parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    child_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (parent_id, child_id)
);

CREATE INDEX idx_parent_children_child ON parent_children(child_id);

-- -------------------------------------------------------
-- 6. classes (references academies, profiles)
-- -------------------------------------------------------
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

CREATE TRIGGER set_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_classes_academy ON classes(academy_id);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);

-- -------------------------------------------------------
-- 7. class_students (references classes, profiles)
-- -------------------------------------------------------
CREATE TABLE class_students (
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active', 'paused', 'dropped')),
    PRIMARY KEY (class_id, student_id)
);

CREATE INDEX idx_class_students_student ON class_students(student_id);

-- -------------------------------------------------------
-- 8. teacher_students (references profiles)
-- -------------------------------------------------------
CREATE TABLE teacher_students (
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_primary BOOLEAN DEFAULT false,
    PRIMARY KEY (teacher_id, student_id)
);

CREATE INDEX idx_teacher_students_student ON teacher_students(student_id);

-- -------------------------------------------------------
-- 9. problem_bank (references academies, profiles)
-- -------------------------------------------------------
CREATE TABLE problem_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Problem content
    content TEXT NOT NULL,
    content_html TEXT,
    image_urls TEXT[] DEFAULT '{}',

    -- Answer and solution
    answer TEXT,
    solution TEXT,

    -- Classification
    difficulty difficulty_level,
    type problem_type,
    choices JSONB,  -- e.g. ["(1) 1", "(2) 2", "(3) 3", "(4) 4", "(5) 5"]

    -- Curriculum info
    grade grade_level,
    subject VARCHAR(50),
    topic VARCHAR(100),
    tags TEXT[] DEFAULT '{}',

    -- Metadata
    source VARCHAR(100),
    source_type source_type DEFAULT 'manual',
    points INTEGER DEFAULT 10,
    usage_count INTEGER DEFAULT 0,
    correct_rate DECIMAL(5,2) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_problem_bank_updated_at
    BEFORE UPDATE ON problem_bank
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_problems_academy ON problem_bank(academy_id);
CREATE INDEX idx_problems_grade ON problem_bank(grade);
CREATE INDEX idx_problems_topic ON problem_bank(topic);
CREATE INDEX idx_problems_difficulty ON problem_bank(difficulty);
CREATE INDEX idx_problems_tags ON problem_bank USING GIN(tags);
CREATE INDEX idx_problems_search ON problem_bank(grade, subject, difficulty);

-- -------------------------------------------------------
-- 10. assignments (references academies, profiles, classes)
-- -------------------------------------------------------
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

CREATE INDEX idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_status ON assignments(status);

-- -------------------------------------------------------
-- 11. assignment_problems (references assignments, problem_bank)
-- -------------------------------------------------------
CREATE TABLE assignment_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    points INTEGER,
    UNIQUE(assignment_id, problem_id)
);

CREATE INDEX idx_assignment_problems_assignment ON assignment_problems(assignment_id);

-- -------------------------------------------------------
-- 12. assignment_students (references assignments, profiles)
-- -------------------------------------------------------
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

CREATE INDEX idx_assignment_students_student ON assignment_students(student_id);
CREATE INDEX idx_assignment_students_status ON assignment_students(status);
CREATE INDEX idx_assignment_students_lookup ON assignment_students(student_id, status, assignment_id);

-- -------------------------------------------------------
-- 13. submissions (references assignments, profiles, problem_bank)
-- -------------------------------------------------------
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,

    answer_text TEXT,
    answer_image_url TEXT,
    canvas_data JSONB,  -- Canvas stroke data (optional, can be large)

    is_correct BOOLEAN,
    score INTEGER,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    time_spent_seconds INTEGER,

    UNIQUE(assignment_id, student_id, problem_id)
);

CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_grading_pending ON submissions(assignment_id, student_id)
    WHERE score IS NULL;

-- -------------------------------------------------------
-- 14. gradings (references submissions, profiles)
-- -------------------------------------------------------
CREATE TABLE gradings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    is_correct BOOLEAN,
    feedback TEXT,
    feedback_image_url TEXT,
    graded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gradings_submission ON gradings(submission_id);
CREATE INDEX idx_gradings_teacher ON gradings(teacher_id);

-- -------------------------------------------------------
-- 15. materials (references academies, profiles)
-- -------------------------------------------------------
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

CREATE INDEX idx_materials_academy ON materials(academy_id);
CREATE INDEX idx_materials_teacher ON materials(teacher_id);
CREATE INDEX idx_materials_grade ON materials(grade);

-- -------------------------------------------------------
-- 16. material_access (references materials, profiles)
-- -------------------------------------------------------
CREATE TABLE material_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    view_duration_seconds INTEGER
);

CREATE INDEX idx_material_access_material ON material_access(material_id);
CREATE INDEX idx_material_access_student ON material_access(student_id);

-- -------------------------------------------------------
-- 17. notifications (references profiles)
-- -------------------------------------------------------
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

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Enable Realtime for notifications (live push to clients)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- -------------------------------------------------------
-- 18. study_logs (references profiles)
-- -------------------------------------------------------
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

CREATE INDEX idx_study_logs_student ON study_logs(student_id);
CREATE INDEX idx_study_logs_created ON study_logs(created_at DESC);
CREATE INDEX idx_study_logs_type ON study_logs(activity_type);
CREATE INDEX idx_study_logs_recent ON study_logs(student_id, created_at DESC);
```

---

#### Migration 003: RLS Policies

**File**: `supabase/migrations/003_rls_policies.sql`

Enable RLS on every table and create all access control policies.

```sql
-- ============================================================
-- Migration 003: Row-Level Security Policies
-- ============================================================

-- -------------------------------------------------------
-- academies
-- -------------------------------------------------------
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Academy members can view their academy"
ON academies FOR SELECT
USING (
    id IN (SELECT academy_id FROM profiles WHERE id = auth.uid())
);

-- -------------------------------------------------------
-- profiles
-- Uses get_my_academy_id() to avoid circular RLS dependency.
-- If we used a subquery on profiles itself inside profiles RLS,
-- PostgreSQL would hit infinite recursion.
-- -------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "profiles_select_same_academy"
ON profiles FOR SELECT
USING (academy_id = get_my_academy_id());

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());

-- -------------------------------------------------------
-- student_profiles
-- -------------------------------------------------------
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own student profile"
ON student_profiles FOR SELECT
USING (id = auth.uid());

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

CREATE POLICY "Parents can view their children student profiles"
ON student_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM parent_children pc
        WHERE pc.parent_id = auth.uid()
        AND pc.child_id = student_profiles.id
    )
);

CREATE POLICY "Students can update own student profile"
ON student_profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Teachers can update student memo"
ON student_profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('teacher', 'admin')
    )
);

-- -------------------------------------------------------
-- teacher_profiles
-- -------------------------------------------------------
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Teachers can update own teacher profile"
ON teacher_profiles FOR UPDATE
USING (id = auth.uid());

-- -------------------------------------------------------
-- parent_children
-- -------------------------------------------------------
ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own children links"
ON parent_children FOR SELECT
USING (parent_id = auth.uid());

CREATE POLICY "Children can view their parent links"
ON parent_children FOR SELECT
USING (child_id = auth.uid());

CREATE POLICY "Admins can manage parent-child links"
ON parent_children FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- -------------------------------------------------------
-- classes
-- -------------------------------------------------------
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Academy members can view classes"
ON classes FOR SELECT
USING (
    academy_id IN (SELECT academy_id FROM profiles WHERE id = auth.uid())
);

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

-- -------------------------------------------------------
-- class_students
-- -------------------------------------------------------
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own enrollments"
ON class_students FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view class students"
ON class_students FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM classes c
        WHERE c.id = class_students.class_id
        AND c.teacher_id = auth.uid()
    )
);

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

-- -------------------------------------------------------
-- teacher_students
-- -------------------------------------------------------
ALTER TABLE teacher_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their students"
ON teacher_students FOR SELECT
USING (teacher_id = auth.uid());

CREATE POLICY "Students can view their teachers"
ON teacher_students FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage teacher-student links"
ON teacher_students FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
    )
);

-- -------------------------------------------------------
-- problem_bank
-- -------------------------------------------------------
ALTER TABLE problem_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view problems in their academy"
ON problem_bank FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
        AND academy_id = problem_bank.academy_id
    )
);

CREATE POLICY "Students can view problems in assigned assignments"
ON problem_bank FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM assignment_problems ap
        JOIN assignment_students asn ON asn.assignment_id = ap.assignment_id
        WHERE ap.problem_id = problem_bank.id
        AND asn.student_id = auth.uid()
    )
);

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

-- -------------------------------------------------------
-- assignments
-- -------------------------------------------------------
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view assigned published assignments"
ON assignments FOR SELECT
USING (
    status = 'published' AND
    EXISTS (
        SELECT 1 FROM assignment_students
        WHERE assignment_students.assignment_id = assignments.id
        AND assignment_students.student_id = auth.uid()
    )
);

CREATE POLICY "Teachers can view own assignments"
ON assignments FOR SELECT
USING (teacher_id = auth.uid());

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

CREATE POLICY "Parents can view children assigned assignments"
ON assignments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM assignment_students asn
        JOIN parent_children pc ON pc.child_id = asn.student_id
        WHERE asn.assignment_id = assignments.id
        AND pc.parent_id = auth.uid()
        AND assignments.status = 'published'
    )
);

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

CREATE POLICY "Teachers can update own assignments"
ON assignments FOR UPDATE
USING (teacher_id = auth.uid());

-- -------------------------------------------------------
-- assignment_problems
-- -------------------------------------------------------
ALTER TABLE assignment_problems ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Assignment creator can manage problems"
ON assignment_problems FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = assignment_problems.assignment_id
        AND a.teacher_id = auth.uid()
    )
);

-- -------------------------------------------------------
-- assignment_students
-- -------------------------------------------------------
ALTER TABLE assignment_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own assignment records"
ON assignment_students FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view assignment students"
ON assignment_students FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = assignment_students.assignment_id
        AND a.teacher_id = auth.uid()
    )
);

CREATE POLICY "Parents can view children assignment records"
ON assignment_students FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM parent_children pc
        WHERE pc.parent_id = auth.uid()
        AND pc.child_id = assignment_students.student_id
    )
);

CREATE POLICY "Teachers can assign students"
ON assignment_students FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = assignment_students.assignment_id
        AND a.teacher_id = auth.uid()
    )
);

CREATE POLICY "Students can update own assignment status"
ON assignment_students FOR UPDATE
USING (student_id = auth.uid());

-- -------------------------------------------------------
-- submissions
-- -------------------------------------------------------
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own submissions"
ON submissions FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their assignments"
ON submissions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = submissions.assignment_id
        AND a.teacher_id = auth.uid()
    )
);

CREATE POLICY "Parents can view children submissions"
ON submissions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM parent_children pc
        WHERE pc.parent_id = auth.uid()
        AND pc.child_id = submissions.student_id
    )
);

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

CREATE POLICY "Students can update own submissions"
ON submissions FOR UPDATE
USING (student_id = auth.uid());

-- -------------------------------------------------------
-- gradings
-- -------------------------------------------------------
ALTER TABLE gradings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own gradings"
ON gradings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM submissions s
        WHERE s.id = gradings.submission_id
        AND s.student_id = auth.uid()
    )
);

CREATE POLICY "Teachers can view own gradings"
ON gradings FOR SELECT
USING (teacher_id = auth.uid());

CREATE POLICY "Parents can view children gradings"
ON gradings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM submissions s
        JOIN parent_children pc ON pc.child_id = s.student_id
        WHERE s.id = gradings.submission_id
        AND pc.parent_id = auth.uid()
    )
);

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

CREATE POLICY "Teachers can update own gradings"
ON gradings FOR UPDATE
USING (teacher_id = auth.uid());

-- -------------------------------------------------------
-- materials
-- -------------------------------------------------------
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Academy members can view public materials"
ON materials FOR SELECT
USING (
    is_public = true AND
    academy_id IN (SELECT academy_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Teachers can view all academy materials"
ON materials FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
        AND academy_id = materials.academy_id
    )
);

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

CREATE POLICY "Teachers can update own materials"
ON materials FOR UPDATE
USING (teacher_id = auth.uid());

-- -------------------------------------------------------
-- material_access
-- -------------------------------------------------------
ALTER TABLE material_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own material access"
ON material_access FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view material access for their materials"
ON material_access FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM materials m
        WHERE m.id = material_access.material_id
        AND m.teacher_id = auth.uid()
    )
);

CREATE POLICY "Anyone can record material access"
ON material_access FOR INSERT
WITH CHECK (student_id = auth.uid());

-- -------------------------------------------------------
-- notifications
-- -------------------------------------------------------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- System/triggers create notifications via SECURITY DEFINER functions
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- -------------------------------------------------------
-- study_logs
-- -------------------------------------------------------
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own study logs"
ON study_logs FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view student logs"
ON study_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM teacher_students ts
        WHERE ts.teacher_id = auth.uid()
        AND ts.student_id = study_logs.student_id
    )
);

CREATE POLICY "Parents can view children study logs"
ON study_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM parent_children pc
        WHERE pc.parent_id = auth.uid()
        AND pc.child_id = study_logs.student_id
    )
);

CREATE POLICY "Students can create own study logs"
ON study_logs FOR INSERT
WITH CHECK (student_id = auth.uid());
```

---

#### Migration 004: Triggers and Functions

**File**: `supabase/migrations/004_triggers_and_functions.sql`

This migration contains all business logic triggers and the `create_assignment_with_details()` RPC function.

```sql
-- ============================================================
-- Migration 004: Triggers and Business Logic Functions
-- ============================================================

-- -------------------------------------------------------
-- 1. handle_new_user()
--    Auto-creates a profiles row when a new auth.users row is inserted.
--    IMPORTANT: Reads academy_id from raw_user_meta_data so that
--    the profile is immediately associated with the correct academy.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role, academy_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role,
        (NEW.raw_user_meta_data->>'academy_id')::UUID
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- -------------------------------------------------------
-- 2. update_assignment_progress()
--    Auto-updates assignment_students.progress_percent and status
--    when a submission is inserted or updated.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_assignment_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_count INTEGER;
    submitted_count INTEGER;
    new_status student_assignment_status;
BEGIN
    -- Total problems in this assignment
    SELECT COUNT(*) INTO total_count
    FROM assignment_problems
    WHERE assignment_id = NEW.assignment_id;

    -- Submissions by this student for this assignment
    SELECT COUNT(*) INTO submitted_count
    FROM submissions
    WHERE assignment_id = NEW.assignment_id
    AND student_id = NEW.student_id;

    -- Determine status
    IF submitted_count = total_count THEN
        new_status := 'submitted';
    ELSIF submitted_count > 0 THEN
        new_status := 'in_progress';
    ELSE
        new_status := 'assigned';
    END IF;

    -- Update assignment_students record
    UPDATE assignment_students
    SET
        progress_percent = CASE
            WHEN total_count > 0 THEN (submitted_count * 100 / total_count)
            ELSE 0
        END,
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

-- -------------------------------------------------------
-- 3. sync_grading_score()
--    Syncs grading data to submissions and assignment_students.
--
--    CRITICAL FIX vs DATABASE_SCHEMA.md original:
--    The original version set status='graded' after EVERY grading insert.
--    This fixed version only sets status='graded' when ALL problems for
--    that student-assignment pair have been graded. This prevents
--    prematurely marking an assignment as graded when only 1 of 5
--    problems has been graded.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_grading_score()
RETURNS TRIGGER AS $$
DECLARE
    v_assignment_id UUID;
    v_student_id UUID;
    v_total_problems INT;
    v_graded_count INT;
BEGIN
    -- Step 1: Update the submission's score and is_correct
    UPDATE submissions
    SET score = NEW.score,
        is_correct = NEW.is_correct
    WHERE id = NEW.submission_id
    RETURNING assignment_id, student_id INTO v_assignment_id, v_student_id;

    -- Step 2: Update total_score in assignment_students
    UPDATE assignment_students
    SET total_score = (
        SELECT COALESCE(SUM(s.score), 0)
        FROM submissions s
        WHERE s.assignment_id = v_assignment_id
          AND s.student_id = v_student_id
          AND s.score IS NOT NULL
    )
    WHERE assignment_id = v_assignment_id
      AND student_id = v_student_id;

    -- Step 3: Only set status to 'graded' when ALL problems are graded
    SELECT COUNT(*) INTO v_total_problems
    FROM assignment_problems
    WHERE assignment_id = v_assignment_id;

    SELECT COUNT(*) INTO v_graded_count
    FROM submissions
    WHERE assignment_id = v_assignment_id
      AND student_id = v_student_id
      AND score IS NOT NULL;

    IF v_graded_count >= v_total_problems THEN
        UPDATE assignment_students
        SET status = 'graded'
        WHERE assignment_id = v_assignment_id
          AND student_id = v_student_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_grading
    AFTER INSERT OR UPDATE ON gradings
    FOR EACH ROW EXECUTE FUNCTION sync_grading_score();

-- -------------------------------------------------------
-- 4. update_student_stats()
--    Updates student_profiles.total_problems_solved and average_score
--    whenever an assignment_students row transitions to 'graded'.
-- -------------------------------------------------------
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

-- -------------------------------------------------------
-- 5. create_notification() helper function
-- -------------------------------------------------------
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

-- -------------------------------------------------------
-- 6. notify_assignment()
--    Auto-creates a notification when a student is assigned to an assignment.
-- -------------------------------------------------------
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

-- -------------------------------------------------------
-- 7. create_assignment_with_details()
--    RPC function that creates an assignment, its problems, and its
--    student assignments in a single PostgreSQL transaction.
--    This prevents orphaned data from partial failures (e.g., assignment
--    created but assignment_problems insert fails).
--
--    Called from the app via: supabase.rpc('create_assignment_with_details', {...})
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION create_assignment_with_details(
    p_assignment JSONB,
    p_problems JSONB,
    p_student_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
    v_assignment_id UUID;
    v_problem JSONB;
    v_student_id UUID;
    v_idx INT := 0;
BEGIN
    -- Insert the assignment
    INSERT INTO assignments (
        academy_id, teacher_id, title, description,
        grade, subject, due_date, status
    )
    VALUES (
        (p_assignment->>'academy_id')::UUID,
        (p_assignment->>'teacher_id')::UUID,
        p_assignment->>'title',
        p_assignment->>'description',
        (p_assignment->>'grade')::grade_level,
        p_assignment->>'subject',
        (p_assignment->>'due_date')::TIMESTAMPTZ,
        COALESCE((p_assignment->>'status')::assignment_status, 'draft')
    )
    RETURNING id INTO v_assignment_id;

    -- Insert assignment_problems (order determined by array position)
    FOR v_problem IN SELECT * FROM jsonb_array_elements(p_problems)
    LOOP
        INSERT INTO assignment_problems (assignment_id, problem_id, order_index, points)
        VALUES (
            v_assignment_id,
            (v_problem->>'problem_id')::UUID,
            v_idx,
            COALESCE((v_problem->>'points')::INT, 10)
        );
        v_idx := v_idx + 1;
    END LOOP;

    -- Insert assignment_students (triggers notify_assignment for each)
    FOREACH v_student_id IN ARRAY p_student_ids
    LOOP
        INSERT INTO assignment_students (assignment_id, student_id)
        VALUES (v_assignment_id, v_student_id);
    END LOOP;

    RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql;
```

---

#### Migration 005: Views

**File**: `supabase/migrations/005_views.sql`

```sql
-- ============================================================
-- Migration 005: Dashboard Views
-- ============================================================

-- -------------------------------------------------------
-- Student dashboard aggregated view
-- -------------------------------------------------------
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

-- -------------------------------------------------------
-- Teacher dashboard aggregated view
-- -------------------------------------------------------
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

-- -------------------------------------------------------
-- Assignment progress view (per-student progress on each assignment)
-- -------------------------------------------------------
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
    (SELECT COUNT(*) FROM assignment_problems ap
     WHERE ap.assignment_id = a.id) AS total_problems,
    (SELECT COUNT(*) FROM submissions s
     WHERE s.assignment_id = a.id AND s.student_id = asn.student_id) AS submitted_problems
FROM assignments a
JOIN assignment_students asn ON a.id = asn.assignment_id
JOIN profiles p ON asn.student_id = p.id;
```

---

#### Migration 006: Storage Buckets

**File**: `supabase/migrations/006_storage.sql`

```sql
-- ============================================================
-- Migration 006: Storage Buckets and Policies
-- ============================================================

-- -------------------------------------------------------
-- Create 5 storage buckets
-- -------------------------------------------------------

-- 1. avatars (public -- profile images viewable by anyone)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- 2. problems (private -- problem images, teacher access only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('problems', 'problems', false);

-- 3. materials (private -- lecture materials, same-academy access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', false);

-- 4. submissions (private -- student answer images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', false);

-- 5. gradings (private -- teacher feedback images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('gradings', 'gradings', false);

-- -------------------------------------------------------
-- Storage RLS policies
-- -------------------------------------------------------

-- avatars: publicly readable, users upload to their own folder
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- materials: same-academy users can read
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

CREATE POLICY "Teachers can upload materials"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'materials' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('teacher', 'admin')
    )
);

-- submissions: student can access own, teacher can access for their assignments
CREATE POLICY "Students can access own submissions"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'submissions' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Teachers can access submissions for their assignments"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'submissions' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('teacher', 'admin')
    )
);

CREATE POLICY "Students can upload submissions"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'submissions' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- problems: teachers only
CREATE POLICY "Teachers can access problem images"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'problems' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('teacher', 'admin')
    )
);

CREATE POLICY "Teachers can upload problem images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'problems' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('teacher', 'admin')
    )
);

-- gradings: teachers can read/write, students can read for own submissions
CREATE POLICY "Teachers can access grading files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'gradings' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('teacher', 'admin')
    )
);

CREATE POLICY "Teachers can upload grading files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'gradings' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('teacher', 'admin')
    )
);

CREATE POLICY "Students can view grading files for own submissions"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'gradings' AND
    auth.uid()::text = (storage.foldername(name))[2]
);
```

---

### Step 1.3: Seed Data

Seed data is loaded in two parts because SQL cannot call the Supabase Auth API (which is needed to create users with proper JWT-based authentication).

#### Part A: `supabase/seed.sql` -- Non-auth data

This file creates the academy and is run **after** Part B (since problems and assignments reference user IDs that are created via the auth API).

```sql
-- ============================================================
-- Seed Data: Academy + Sample Problems + Sample Assignments
-- ============================================================
-- NOTE: Run scripts/seed.ts FIRST to create auth users.
--       Then run this file with the user IDs from seed.ts output.

-- 1. Create the demo academy
INSERT INTO academies (id, name, address, phone, email)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '수학왕 학원',
    '서울시 강남구 테헤란로 123',
    '02-1234-5678',
    'info@mathpia-demo.kr'
);

-- NOTE: After running seed.ts, replace the UUIDs below with actual user IDs.
-- The seed.ts script will output the created user IDs.

-- Sample problems will be inserted by seed.ts after users are created.
-- This keeps all seed logic in one orchestrated script.
```

#### Part B: `scripts/seed.ts` -- TypeScript seed script for auth users

This is the primary seed script. It must use the **service_role key** (not the anon key) to call `auth.admin.createUser()`. The service_role key bypasses RLS and can create users directly.

```typescript
// scripts/seed.ts
//
// Creates demo users via Supabase Auth API and seeds related data.
// The handle_new_user trigger auto-creates profiles rows.
//
// Usage:
//   SUPABASE_URL=https://xxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//   npx tsx scripts/seed.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ACADEMY_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('=== Mathpia Demo Seed ===\n');

  // Ensure academy exists
  const { error: academyError } = await supabase
    .from('academies')
    .upsert({
      id: ACADEMY_ID,
      name: '수학왕 학원',
      address: '서울시 강남구 테헤란로 123',
      phone: '02-1234-5678',
      email: 'info@mathpia-demo.kr',
    });
  if (academyError) throw academyError;
  console.log('Academy created: 수학왕 학원');

  // Create demo users via Auth API
  // The handle_new_user trigger auto-creates profiles with academy_id

  // Teacher
  const { data: teacher, error: teacherErr } = await supabase.auth.admin.createUser({
    email: 'teacher@mathpia.kr',
    password: 'demo1234',
    email_confirm: true,
    user_metadata: {
      name: '김선생',
      role: 'teacher',
      academy_id: ACADEMY_ID,
    },
  });
  if (teacherErr) throw teacherErr;
  console.log(`Teacher created: ${teacher.user.id} (teacher@mathpia.kr)`);

  // Student
  const { data: student, error: studentErr } = await supabase.auth.admin.createUser({
    email: 'student@mathpia.kr',
    password: 'demo1234',
    email_confirm: true,
    user_metadata: {
      name: '이학생',
      role: 'student',
      academy_id: ACADEMY_ID,
    },
  });
  if (studentErr) throw studentErr;
  console.log(`Student created: ${student.user.id} (student@mathpia.kr)`);

  // Parent
  const { data: parent, error: parentErr } = await supabase.auth.admin.createUser({
    email: 'parent@mathpia.kr',
    password: 'demo1234',
    email_confirm: true,
    user_metadata: {
      name: '이학부모',
      role: 'parent',
      academy_id: ACADEMY_ID,
    },
  });
  if (parentErr) throw parentErr;
  console.log(`Parent created: ${parent.user.id} (parent@mathpia.kr)`);

  const teacherId = teacher.user.id;
  const studentId = student.user.id;
  const parentId = parent.user.id;

  // Create student_profiles for the student
  const { error: spError } = await supabase.from('student_profiles').insert({
    id: studentId,
    grade: '고1',
    school_name: '강남고등학교',
  });
  if (spError) throw spError;
  console.log('Student profile created');

  // Create teacher_profiles for the teacher
  const { error: tpError } = await supabase.from('teacher_profiles').insert({
    id: teacherId,
    subjects: ['수학I', '수학II', '미적분'],
    grades: ['고1', '고2', '고3'],
    introduction: '10년 경력의 수학 전문 강사입니다.',
    is_head_teacher: true,
  });
  if (tpError) throw tpError;
  console.log('Teacher profile created');

  // Link teacher to student
  const { error: tsError } = await supabase.from('teacher_students').insert({
    teacher_id: teacherId,
    student_id: studentId,
    is_primary: true,
  });
  if (tsError) throw tsError;
  console.log('Teacher-student link created');

  // Link parent to child
  const { error: pcError } = await supabase.from('parent_children').insert({
    parent_id: parentId,
    child_id: studentId,
  });
  if (pcError) throw pcError;
  console.log('Parent-child link created');

  // Create sample problems in problem_bank
  const sampleProblems = [
    {
      academy_id: ACADEMY_ID,
      created_by: teacherId,
      content: '다음 이차방정식 x² - 5x + 6 = 0 의 두 근의 합을 구하시오.',
      answer: '5',
      difficulty: '중',
      type: '단답형',
      grade: '고1',
      subject: '수학I',
      topic: '이차방정식',
      tags: ['이차방정식', '근과 계수의 관계'],
      source_type: 'manual',
      points: 10,
    },
    {
      academy_id: ACADEMY_ID,
      created_by: teacherId,
      content: '함수 f(x) = 2x + 3에서 f(2)의 값은?',
      answer: '7',
      choices: ['5', '6', '7', '8', '9'],
      difficulty: '하',
      type: '객관식',
      grade: '고1',
      subject: '수학I',
      topic: '함수',
      tags: ['일차함수', '함수값'],
      source_type: 'manual',
      points: 10,
    },
    {
      academy_id: ACADEMY_ID,
      created_by: teacherId,
      content: '집합 A = {1, 2, 3, 4, 5}에서 원소의 개수가 2인 부분집합의 개수를 구하시오.',
      answer: '10',
      difficulty: '중',
      type: '단답형',
      grade: '고1',
      subject: '수학I',
      topic: '집합',
      tags: ['집합', '부분집합', '조합'],
      source_type: 'manual',
      points: 10,
    },
    {
      academy_id: ACADEMY_ID,
      created_by: teacherId,
      content: 'sin(30°)의 값을 구하시오.',
      answer: '1/2',
      difficulty: '하',
      type: '단답형',
      grade: '고1',
      subject: '수학I',
      topic: '삼각함수',
      tags: ['삼각함수', '삼각비'],
      source_type: 'manual',
      points: 10,
    },
    {
      academy_id: ACADEMY_ID,
      created_by: teacherId,
      content: '다항식 (x+1)(x+2)(x+3)을 전개하였을 때, x²의 계수를 구하시오.',
      answer: '11',
      difficulty: '상',
      type: '단답형',
      grade: '고1',
      subject: '수학I',
      topic: '다항식',
      tags: ['다항식', '전개', '계수'],
      source_type: 'manual',
      points: 15,
    },
    {
      academy_id: ACADEMY_ID,
      created_by: teacherId,
      content: '등차수열 2, 5, 8, 11, ... 의 제20항을 구하시오.',
      answer: '59',
      difficulty: '중',
      type: '단답형',
      grade: '고1',
      subject: '수학I',
      topic: '수열',
      tags: ['등차수열', '일반항'],
      source_type: 'manual',
      points: 10,
    },
    {
      academy_id: ACADEMY_ID,
      created_by: teacherId,
      content: 'log₂(8)의 값은?',
      answer: '3',
      choices: ['1', '2', '3', '4', '8'],
      difficulty: '하',
      type: '객관식',
      grade: '고1',
      subject: '수학I',
      topic: '로그',
      tags: ['로그', '로그의 성질'],
      source_type: 'manual',
      points: 10,
    },
    {
      academy_id: ACADEMY_ID,
      created_by: teacherId,
      content: '이차함수 y = x² - 4x + 3의 꼭짓점의 좌표를 구하시오.',
      answer: '(2, -1)',
      difficulty: '중',
      type: '서술형',
      grade: '고1',
      subject: '수학I',
      topic: '이차함수',
      tags: ['이차함수', '꼭짓점', '완전제곱식'],
      source_type: 'manual',
      points: 15,
    },
    {
      academy_id: ACADEMY_ID,
      created_by: teacherId,
      content: '두 벡터 a = (1, 2), b = (3, -1)의 내적 a·b의 값을 구하시오.',
      answer: '1',
      difficulty: '중',
      type: '단답형',
      grade: '고2',
      subject: '수학II',
      topic: '벡터',
      tags: ['벡터', '내적'],
      source_type: 'manual',
      points: 10,
    },
    {
      academy_id: ACADEMY_ID,
      created_by: teacherId,
      content: '함수 f(x) = x³ - 3x의 극값을 모두 구하시오.',
      answer: '극대 2, 극소 -2',
      difficulty: '상',
      type: '서술형',
      grade: '고2',
      subject: '수학II',
      topic: '미분',
      tags: ['미분', '극값', '도함수'],
      source_type: 'manual',
      points: 20,
    },
  ];

  const { data: insertedProblems, error: probError } = await supabase
    .from('problem_bank')
    .insert(sampleProblems)
    .select('id');
  if (probError) throw probError;
  console.log(`${insertedProblems.length} sample problems created`);

  // Create a sample assignment with first 5 problems
  const problemIds = insertedProblems.map((p: { id: string }) => p.id);

  const { data: assignmentId, error: rpcError } = await supabase.rpc(
    'create_assignment_with_details',
    {
      p_assignment: {
        academy_id: ACADEMY_ID,
        teacher_id: teacherId,
        title: '고1 수학I 기초 테스트',
        description: '이차방정식, 함수, 집합 기초 문제입니다.',
        grade: '고1',
        subject: '수학I',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'published',
      },
      p_problems: problemIds.slice(0, 5).map((id: string, i: number) => ({
        problem_id: id,
        points: i === 4 ? 15 : 10,
      })),
      p_student_ids: [studentId],
    }
  );
  if (rpcError) throw rpcError;
  console.log(`Assignment created: ${assignmentId}`);

  // Create a second assignment (draft)
  const { data: assignmentId2, error: rpcError2 } = await supabase.rpc(
    'create_assignment_with_details',
    {
      p_assignment: {
        academy_id: ACADEMY_ID,
        teacher_id: teacherId,
        title: '고1 수학I 심화 문제',
        description: '수열, 로그, 이차함수 심화 문제입니다.',
        grade: '고1',
        subject: '수학I',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'draft',
      },
      p_problems: problemIds.slice(5, 8).map((id: string) => ({
        problem_id: id,
        points: 10,
      })),
      p_student_ids: [studentId],
    }
  );
  if (rpcError2) throw rpcError2;
  console.log(`Draft assignment created: ${assignmentId2}`);

  console.log('\n=== Seed Complete ===');
  console.log('\nDemo login credentials:');
  console.log('  Teacher: teacher@mathpia.kr / demo1234');
  console.log('  Student: student@mathpia.kr / demo1234');
  console.log('  Parent:  parent@mathpia.kr / demo1234');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

**Running the seed script:**

```bash
# Set environment variables (use your actual values)
# The service_role key is found in Supabase Dashboard > Settings > API > service_role (secret)
SUPABASE_URL=https://xxxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
npx tsx scripts/seed.ts
```

> **IMPORTANT**: The service_role key has full database access and bypasses RLS. Never commit it to version control or expose it in client-side code. It is only used in server-side scripts like this seed file.

---

### Step 1.4: Environment Variables

Update the project `.env` file with the Supabase credentials obtained in Step 1.1.

```bash
# .env (at project root)
EXPO_PUBLIC_GEMINI_API_KEY=<existing Gemini API key>
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The `EXPO_PUBLIC_` prefix is required by Expo to expose environment variables to the client bundle. The anon key is safe to include in client code -- it only provides access that RLS policies permit.

The service_role key should NOT be added to `.env` -- it is only used for server-side scripts and should be passed as a shell environment variable when running `scripts/seed.ts`.

---

## 5. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.env` | **Modify** | Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| `supabase/migrations/001_enums_and_functions.sql` | **Create** | 8 ENUM types (including `'parent'` in `user_role`) + `update_updated_at()` function + `get_my_academy_id()` SECURITY DEFINER helper |
| `supabase/migrations/002_tables.sql` | **Create** | All 18 tables in dependency order, with indexes and `updated_at` triggers. Includes `parent_children` junction table |
| `supabase/migrations/003_rls_policies.sql` | **Create** | All RLS policies for every table. Uses `get_my_academy_id()` for profiles to avoid circular RLS. Includes parent role policies via `parent_children` |
| `supabase/migrations/004_triggers_and_functions.sql` | **Create** | `handle_new_user()` (with `academy_id` from metadata), `update_assignment_progress()`, `sync_grading_score()` (fixed: only marks graded when ALL problems graded), `update_student_stats()`, `create_notification()`, `notify_assignment()`, `create_assignment_with_details()` RPC |
| `supabase/migrations/005_views.sql` | **Create** | 3 dashboard views: `student_dashboard`, `teacher_dashboard`, `assignment_progress_view` |
| `supabase/migrations/006_storage.sql` | **Create** | 5 storage buckets (`avatars` public, `problems`/`materials`/`submissions`/`gradings` private) + storage RLS policies |
| `supabase/seed.sql` | **Create** | Academy seed data (minimal -- most seeding done by `scripts/seed.ts`) |
| `scripts/seed.ts` | **Create** | TypeScript seed script that creates 3 demo auth users via `supabase.auth.admin.createUser()`, creates student/teacher profiles, teacher-student/parent-child links, 10 sample problems, and 2 sample assignments |

---

## 6. Acceptance Criteria

- [ ] Supabase project is created and accessible via the dashboard
- [ ] All 8 ENUM types exist in the database, including `'parent'` in `user_role`
- [ ] All 18 tables are created with correct columns, constraints, and foreign keys (verify via Supabase Table Editor)
- [ ] The `parent_children` table exists with `(parent_id, child_id)` primary key
- [ ] The `correct_rate` column exists on `problem_bank`
- [ ] The `is_correct` column exists on `gradings`
- [ ] The `email` column exists on `profiles`
- [ ] `get_my_academy_id()` SECURITY DEFINER function exists and correctly returns the authenticated user's `academy_id`
- [ ] RLS is enabled on ALL 18 tables (verify: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`)
- [ ] Querying any table as an unauthenticated (anon) user returns zero rows
- [ ] `handle_new_user` trigger fires on `auth.users` insert and creates a `profiles` row with `academy_id` from `raw_user_meta_data`
- [ ] `update_assignment_progress` trigger fires on `submissions` insert and updates `assignment_students.progress_percent`
- [ ] `sync_grading_score` trigger fires on `gradings` insert and:
  - Updates `submissions.score` and `submissions.is_correct`
  - Updates `assignment_students.total_score`
  - Only sets `assignment_students.status = 'graded'` when ALL submissions for that student-assignment pair have been graded (not after each individual grading)
- [ ] `update_student_stats` trigger fires when `assignment_students.status` becomes `'graded'` and updates `student_profiles.total_problems_solved` and `average_score`
- [ ] `notify_assignment` trigger fires on `assignment_students` insert and creates a notification for the assigned student
- [ ] `create_assignment_with_details()` RPC function works correctly: creates assignment, assignment_problems, and assignment_students in a single transaction. Verify that if any step fails, the entire operation rolls back
- [ ] All 3 views exist and return data: `student_dashboard`, `teacher_dashboard`, `assignment_progress_view`
- [ ] All 5 storage buckets exist: `avatars` (public), `problems`, `materials`, `submissions`, `gradings` (all private)
- [ ] Storage policies enforce: avatars publicly readable, submissions only accessible by owner or teachers
- [ ] Demo seed data loaded successfully via `scripts/seed.ts`:
  - 1 academy ("수학왕 학원")
  - 3 users (teacher@mathpia.kr, student@mathpia.kr, parent@mathpia.kr) all with password `demo1234`
  - Student profile (고1, 강남고등학교)
  - Teacher profile (수학I/수학II/미적분)
  - Teacher-student link
  - Parent-child link
  - 10 sample math problems in problem_bank
  - 2 sample assignments (1 published, 1 draft)
- [ ] `.env` has `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` set with valid values
- [ ] `.env` has `EXPO_PUBLIC_GEMINI_API_KEY` (pre-existing, verify still present)

### Verification Commands

Run these in **Supabase Dashboard > SQL Editor** to verify the setup:

```sql
-- Check all ENUM types exist
SELECT typname FROM pg_type WHERE typname IN (
    'user_role', 'grade_level', 'problem_type', 'difficulty_level',
    'source_type', 'assignment_status', 'student_assignment_status',
    'notification_type', 'activity_type'
);
-- Expected: 9 rows

-- Check 'parent' is in user_role
SELECT enumlabel FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE typname = 'user_role';
-- Expected: student, teacher, admin, parent

-- Check all 18 tables exist with RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Expected: 18 tables, all with rowsecurity = true

-- Check get_my_academy_id function exists
SELECT proname FROM pg_proc WHERE proname = 'get_my_academy_id';

-- Check create_assignment_with_details function exists
SELECT proname FROM pg_proc WHERE proname = 'create_assignment_with_details';

-- Check all triggers exist
SELECT trigger_name, event_object_table FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- Check views exist
SELECT viewname FROM pg_views WHERE schemaname = 'public';
-- Expected: student_dashboard, teacher_dashboard, assignment_progress_view

-- Check storage buckets
SELECT id, name, public FROM storage.buckets;
-- Expected: 5 buckets

-- Check seed data
SELECT COUNT(*) FROM academies;      -- Expected: 1
SELECT COUNT(*) FROM profiles;       -- Expected: 3
SELECT COUNT(*) FROM problem_bank;   -- Expected: 10
SELECT COUNT(*) FROM assignments;    -- Expected: 2
SELECT COUNT(*) FROM teacher_students; -- Expected: 1
SELECT COUNT(*) FROM parent_children;  -- Expected: 1
```

---

## 7. Estimated Effort

**1 day (4-6 hours)** broken down as follows:

| Task | Time |
|------|------|
| Create Supabase project + copy credentials | 15 min |
| Execute Migration 001 (ENUMs + functions) | 15 min |
| Execute Migration 002 (18 tables) | 30 min |
| Execute Migration 003 (RLS policies) | 45 min |
| Execute Migration 004 (triggers + RPC) | 30 min |
| Execute Migration 005 (views) | 15 min |
| Execute Migration 006 (storage buckets) | 15 min |
| Create and run `scripts/seed.ts` | 45 min |
| Verification and testing of triggers/RLS | 60 min |
| Update `.env` and verify | 15 min |
| **Total** | **~4.5 hours** |

---

## Appendix: Key Design Decisions

### Why `get_my_academy_id()` is SECURITY DEFINER

When profiles RLS policies need to check "is this user in the same academy?", a naive implementation would do:

```sql
-- NAIVE (causes infinite recursion):
CREATE POLICY "profiles_select_same_academy" ON profiles
  FOR SELECT USING (
    academy_id IN (SELECT academy_id FROM profiles WHERE id = auth.uid())
  );
```

This creates a circular dependency: reading `profiles` requires checking RLS on `profiles`, which requires reading `profiles`. The `get_my_academy_id()` function is marked `SECURITY DEFINER`, which means it executes as the function owner (the database superuser), bypassing RLS on the `profiles` table for that single lookup.

### Why `sync_grading_score()` checks ALL submissions

The original schema in DATABASE_SCHEMA.md set `status = 'graded'` after every grading insert. This is incorrect because if a student has 5 problems and the teacher grades only the first one, the student's assignment would prematurely show as "graded". The fixed version counts total problems and graded submissions, only transitioning to 'graded' when every problem has been scored.

### Why `handle_new_user()` reads `academy_id` from metadata

Users are created via `supabase.auth.signUp()` with metadata like `{ name, role, academy_id }`. The trigger reads `academy_id` from `raw_user_meta_data` and sets it on the profiles row immediately, so the user is associated with their academy from the moment of registration. Without this, a newly registered user would have `academy_id = NULL` and all RLS policies would deny access.

### Why `create_assignment_with_details()` is an RPC function

Creating an assignment requires inserting into 3 tables: `assignments`, `assignment_problems`, and `assignment_students`. If the client makes 3 separate API calls and one fails midway, you end up with orphaned data (e.g., an assignment with no problems). The RPC function wraps all 3 inserts in a single PostgreSQL transaction, so either everything succeeds or everything rolls back.
