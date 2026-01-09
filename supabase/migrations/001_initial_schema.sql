-- =====================================================
-- CV-Optima Database Schema
-- Migration: 001_initial_schema
-- Description: Create core tables for profiles, resumes, and analyses
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
-- Stores additional user profile information beyond auth.users
-- Each user in auth.users should have exactly one profile

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    credits INTEGER DEFAULT 5 NOT NULL CHECK (credits >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comment to table
COMMENT ON TABLE profiles IS 'Extended user profile information including credit balance for usage tracking';
COMMENT ON COLUMN profiles.id IS 'References auth.users.id - one profile per user';
COMMENT ON COLUMN profiles.credits IS 'Number of analysis credits remaining (default 5 for free tier)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- =====================================================
-- RESUMES TABLE
-- =====================================================
-- Stores uploaded resume files and their extracted text content
-- Supports multiple resume versions per user

CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    raw_text TEXT,
    file_size INTEGER,
    file_type TEXT CHECK (file_type IN ('pdf', 'docx')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comments
COMMENT ON TABLE resumes IS 'User-uploaded resumes with extracted text content';
COMMENT ON COLUMN resumes.user_id IS 'Owner of the resume';
COMMENT ON COLUMN resumes.title IS 'User-provided name for this resume version';
COMMENT ON COLUMN resumes.file_url IS 'Supabase Storage URL for the uploaded file';
COMMENT ON COLUMN resumes.raw_text IS 'Extracted text content from the PDF/DOCX file';
COMMENT ON COLUMN resumes.file_size IS 'File size in bytes';
COMMENT ON COLUMN resumes.file_type IS 'File format: pdf or docx';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resumes_user_created ON resumes(user_id, created_at DESC);

-- =====================================================
-- ANALYSES TABLE
-- =====================================================
-- Stores ATS analysis results comparing resumes against job descriptions
-- Each analysis is tied to a specific resume

CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_description_text TEXT NOT NULL,
    job_title TEXT,
    company_name TEXT,
    match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
    missing_keywords JSONB DEFAULT '[]'::jsonb,
    suggestions JSONB DEFAULT '[]'::jsonb,
    formatting_issues JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comments
COMMENT ON TABLE analyses IS 'ATS analysis results comparing resumes against job descriptions';
COMMENT ON COLUMN analyses.resume_id IS 'The resume that was analyzed';
COMMENT ON COLUMN analyses.job_description_text IS 'Full text of the job description';
COMMENT ON COLUMN analyses.job_title IS 'Optional job title extracted or provided';
COMMENT ON COLUMN analyses.company_name IS 'Optional company name';
COMMENT ON COLUMN analyses.match_score IS 'ATS match score from 0-100';
COMMENT ON COLUMN analyses.missing_keywords IS 'Array of keywords found in JD but missing in resume';
COMMENT ON COLUMN analyses.suggestions IS 'Array of AI-generated improvement suggestions';
COMMENT ON COLUMN analyses.formatting_issues IS 'Array of formatting problems detected';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analyses_resume_id ON analyses(resume_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_resume_created ON analyses(resume_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_match_score ON analyses(match_score DESC);

-- Create GIN indexes for JSONB columns to enable efficient querying
CREATE INDEX IF NOT EXISTS idx_analyses_missing_keywords ON analyses USING GIN (missing_keywords);
CREATE INDEX IF NOT EXISTS idx_analyses_suggestions ON analyses USING GIN (suggestions);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at
    BEFORE UPDATE ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at
    BEFORE UPDATE ON analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA / SEED (Optional)
-- =====================================================
-- This section can be used to insert any initial data
-- Currently empty - profiles are created via trigger on auth.users

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Uncomment these to verify the schema was created correctly:

-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;
