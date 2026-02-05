-- Module Experience Migration (Supabase)
-- Run this in Supabase SQL Editor
-- Note: AI interactions remain in MongoDB

CREATE TABLE IF NOT EXISTS module_experience (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    time_spent INTEGER DEFAULT 0,           -- seconds
    scroll_depth INTEGER DEFAULT 0,         -- 0-100 percentage
    interactions INTEGER DEFAULT 0,         -- click count
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id, module_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_module_exp_student ON module_experience(student_id);
CREATE INDEX IF NOT EXISTS idx_module_exp_course ON module_experience(course_id);
CREATE INDEX IF NOT EXISTS idx_module_exp_updated ON module_experience(updated_at DESC);

-- RLS
ALTER TABLE module_experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own experience"
    ON module_experience FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Users can insert own experience"
    ON module_experience FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update own experience"
    ON module_experience FOR UPDATE
    USING (auth.uid() = student_id);
