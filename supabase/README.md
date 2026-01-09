# CV-Optima Database Schema

This directory contains the database schema and migrations for CV-Optima.

## Overview

The database consists of three main tables:
- **profiles**: Extended user information
- **resumes**: Uploaded resume files and extracted text
- **analyses**: ATS analysis results

## Schema Diagram

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ↓
resumes (1:many)
    ↓
analyses (1:many)
```

## Tables

### `profiles`
Extends the built-in `auth.users` table with application-specific user data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, references `auth.users.id` |
| `full_name` | TEXT | User's full name |
| `credits` | INTEGER | Analysis credits remaining (default: 5) |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Relationships:**
- One-to-one with `auth.users`
- One-to-many with `resumes` (via `auth.users.id`)

**Indexes:**
- Primary key on `id`
- Index on `created_at` (descending)

---

### `resumes`
Stores uploaded resume files and their extracted text content.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | UUID | Owner of the resume (references `auth.users.id`) |
| `title` | TEXT | User-provided name for this resume version |
| `file_url` | TEXT | Supabase Storage URL |
| `raw_text` | TEXT | Extracted text from PDF/DOCX |
| `file_size` | INTEGER | File size in bytes |
| `file_type` | TEXT | File format: 'pdf' or 'docx' |
| `created_at` | TIMESTAMPTZ | Upload timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Relationships:**
- Many-to-one with `auth.users`
- One-to-many with `analyses`

**Indexes:**
- Primary key on `id`
- Index on `user_id`
- Index on `created_at` (descending)
- Composite index on `(user_id, created_at)`

**Constraints:**
- `file_type` must be 'pdf' or 'docx'
- Cascade delete when user is deleted

---

### `analyses`
Stores ATS analysis results comparing resumes against job descriptions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `resume_id` | UUID | The resume that was analyzed |
| `job_description_text` | TEXT | Full text of the job description |
| `job_title` | TEXT | Optional job title |
| `company_name` | TEXT | Optional company name |
| `match_score` | INTEGER | ATS match score (0-100) |
| `missing_keywords` | JSONB | Array of missing keywords |
| `suggestions` | JSONB | Array of improvement suggestions |
| `formatting_issues` | JSONB | Array of formatting problems |
| `created_at` | TIMESTAMPTZ | Analysis timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Relationships:**
- Many-to-one with `resumes`

**Indexes:**
- Primary key on `id`
- Index on `resume_id`
- Index on `created_at` (descending)
- Composite index on `(resume_id, created_at)`
- Index on `match_score` (descending)
- GIN indexes on JSONB columns for efficient querying

**Constraints:**
- `match_score` must be between 0 and 100
- Cascade delete when resume is deleted

---

## JSONB Structures

### `missing_keywords` (Array of strings)
```json
["React", "TypeScript", "AWS", "CI/CD"]
```

### `suggestions` (Array of objects)
```json
[
  {
    "type": "keyword",
    "priority": "high",
    "original": "Built web applications",
    "suggested": "Built web applications using React and TypeScript",
    "reason": "Missing key technologies mentioned in job description"
  }
]
```

**Suggestion Types:**
- `keyword`: Missing keyword insertion
- `bullet_point`: Bullet point rewrite
- `summary`: Professional summary generation
- `general`: General improvement

**Priority Levels:** `high`, `medium`, `low`

### `formatting_issues` (Array of objects)
```json
[
  {
    "type": "table",
    "severity": "high",
    "description": "Tables may not parse correctly in older ATS systems",
    "location": "Skills section"
  }
]
```

**Issue Types:**
- `table`: Tables in resume
- `column`: Multi-column layouts
- `image`: Embedded images
- `special_char`: Special characters
- `other`: Other formatting issues

**Severity Levels:** `high`, `medium`, `low`

---

## Migrations

### Running Migrations

**Option 1: Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `migrations/001_initial_schema.sql`
4. Paste and run the SQL

**Option 2: Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Migration Files

- `001_initial_schema.sql`: Initial database schema with all tables, indexes, and triggers

---

## Automatic Triggers

### `updated_at` Auto-Update
All tables have triggers that automatically update the `updated_at` column whenever a row is modified.

```sql
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## TypeScript Types

TypeScript type definitions matching the database schema are available in:
```
lib/types/database.ts
```

**Usage:**
```typescript
import { Profile, Resume, Analysis } from '@/lib/types/database'

// Insert types (omit auto-generated fields)
import { ProfileInsert, ResumeInsert, AnalysisInsert } from '@/lib/types/database'

// Update types (all fields optional except id)
import { ProfileUpdate, ResumeUpdate, AnalysisUpdate } from '@/lib/types/database'
```

---

## Next Steps

After running the migrations:
1. Set up Row Level Security (RLS) policies (see `subtask 2.4`)
2. Configure Supabase Storage bucket (see `subtask 2.5`)
3. Test database operations from the Next.js app

---

## Verification

To verify the schema was created correctly, run these queries in the Supabase SQL Editor:

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- List all columns
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- List all indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```
