/**
 * Database type definitions for CV-Optima
 * These types match the Supabase database schema
 */

export interface Profile {
  id: string // UUID, references auth.users.id
  full_name: string | null
  credits: number
  created_at: string
  updated_at: string
}

export interface Resume {
  id: string // UUID
  user_id: string // UUID, references auth.users.id
  title: string
  file_url: string
  raw_text: string | null
  file_size: number | null
  file_type: 'pdf' | 'docx' | null
  created_at: string
  updated_at: string
}

export interface Analysis {
  id: string // UUID
  resume_id: string // UUID, references resumes.id
  job_description_text: string
  job_title: string | null
  company_name: string | null
  match_score: number | null // 0-100
  missing_keywords: string[] // JSONB array
  suggestions: Suggestion[] // JSONB array
  formatting_issues: FormattingIssue[] // JSONB array
  created_at: string
  updated_at: string
}

export interface Suggestion {
  type: 'keyword' | 'bullet_point' | 'summary' | 'general'
  priority: 'high' | 'medium' | 'low'
  original?: string
  suggested: string
  reason: string
}

export interface FormattingIssue {
  type: 'table' | 'column' | 'image' | 'special_char' | 'other'
  severity: 'high' | 'medium' | 'low'
  description: string
  location?: string
}

// Database response types (with relations)
export interface ResumeWithAnalyses extends Resume {
  analyses: Analysis[]
}

export interface AnalysisWithResume extends Analysis {
  resume: Resume
}

// Insert types (for creating new records)
export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>
export type ResumeInsert = Omit<Resume, 'id' | 'created_at' | 'updated_at'>
export type AnalysisInsert = Omit<Analysis, 'id' | 'created_at' | 'updated_at'>

// Update types (for updating existing records)
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
export type ResumeUpdate = Partial<Omit<Resume, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
export type AnalysisUpdate = Partial<Omit<Analysis, 'id' | 'resume_id' | 'created_at' | 'updated_at'>>
