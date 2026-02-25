-- ============================================================
-- LGS Takip Sistemi - Supabase PostgreSQL Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Students table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.students (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exams table
CREATE TABLE IF NOT EXISTS public.exams (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id          UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_name           TEXT NOT NULL CHECK (char_length(exam_name) > 0 AND char_length(exam_name) <= 200),
  exam_date           DATE NOT NULL,
  lgs_score           NUMERIC(6, 2) NOT NULL CHECK (lgs_score >= 0 AND lgs_score <= 500),
  national_rank       INTEGER CHECK (national_rank > 0),
  total_participants  INTEGER CHECK (total_participants > 0),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure national_rank <= total_participants when both are provided
  CONSTRAINT valid_rank CHECK (
    national_rank IS NULL OR total_participants IS NULL OR national_rank <= total_participants
  )
);

-- Exam subject results table
CREATE TABLE IF NOT EXISTS public.exam_subject_results (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id     UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL CHECK (subject IN (
    'turkish',
    'math',
    'science',
    'social_studies',
    'english',
    'religion'
  )),
  net         NUMERIC(5, 2) NOT NULL CHECK (net >= -10 AND net <= 20),
  correct     INTEGER NOT NULL CHECK (correct >= 0 AND correct <= 20),
  wrong       INTEGER NOT NULL CHECK (wrong >= 0 AND wrong <= 20),
  blank       INTEGER NOT NULL CHECK (blank >= 0 AND blank <= 20),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Each subject can only appear once per exam
  UNIQUE (exam_id, subject),
  -- correct + wrong + blank must equal total questions (20)
  CONSTRAINT valid_question_count CHECK (correct + wrong + blank = 20)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_students_parent_id ON public.students(parent_id);
CREATE INDEX IF NOT EXISTS idx_exams_student_id ON public.exams(student_id);
CREATE INDEX IF NOT EXISTS idx_exams_exam_date ON public.exams(exam_date DESC);
CREATE INDEX IF NOT EXISTS idx_exams_student_date ON public.exams(student_id, exam_date DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_exam_subject_results_exam_id ON public.exam_subject_results(exam_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subject_results ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: students
-- ============================================================

-- Parents can only see their own students
CREATE POLICY "parents_select_own_students"
  ON public.students
  FOR SELECT
  USING (auth.uid() = parent_id);

-- Parents can only insert students for themselves
CREATE POLICY "parents_insert_own_students"
  ON public.students
  FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

-- Parents can only update their own students
CREATE POLICY "parents_update_own_students"
  ON public.students
  FOR UPDATE
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

-- Parents can only delete their own students
CREATE POLICY "parents_delete_own_students"
  ON public.students
  FOR DELETE
  USING (auth.uid() = parent_id);

-- ============================================================
-- RLS POLICIES: exams
-- ============================================================

-- Parents can only see exams of their own students
CREATE POLICY "parents_select_own_exams"
  ON public.exams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = exams.student_id
        AND students.parent_id = auth.uid()
    )
  );

-- Parents can only insert exams for their own students
CREATE POLICY "parents_insert_own_exams"
  ON public.exams
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = exams.student_id
        AND students.parent_id = auth.uid()
    )
  );

-- Parents can only update exams of their own students
CREATE POLICY "parents_update_own_exams"
  ON public.exams
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = exams.student_id
        AND students.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = exams.student_id
        AND students.parent_id = auth.uid()
    )
  );

-- Parents can only delete exams of their own students
CREATE POLICY "parents_delete_own_exams"
  ON public.exams
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = exams.student_id
        AND students.parent_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES: exam_subject_results
-- ============================================================

-- Parents can only see subject results of their own students' exams
CREATE POLICY "parents_select_own_subject_results"
  ON public.exam_subject_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      JOIN public.students ON students.id = exams.student_id
      WHERE exams.id = exam_subject_results.exam_id
        AND students.parent_id = auth.uid()
    )
  );

-- Parents can only insert subject results for their own students' exams
CREATE POLICY "parents_insert_own_subject_results"
  ON public.exam_subject_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams
      JOIN public.students ON students.id = exams.student_id
      WHERE exams.id = exam_subject_results.exam_id
        AND students.parent_id = auth.uid()
    )
  );

-- Parents can only update subject results of their own students' exams
CREATE POLICY "parents_update_own_subject_results"
  ON public.exam_subject_results
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      JOIN public.students ON students.id = exams.student_id
      WHERE exams.id = exam_subject_results.exam_id
        AND students.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams
      JOIN public.students ON students.id = exams.student_id
      WHERE exams.id = exam_subject_results.exam_id
        AND students.parent_id = auth.uid()
    )
  );

-- Parents can only delete subject results of their own students' exams
CREATE POLICY "parents_delete_own_subject_results"
  ON public.exam_subject_results
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      JOIN public.students ON students.id = exams.student_id
      WHERE exams.id = exam_subject_results.exam_id
        AND students.parent_id = auth.uid()
    )
  );
