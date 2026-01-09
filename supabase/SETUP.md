# Supabase Database Setup Guide

Quick guide to set up the CV-Optima database schema in your Supabase project.

## Prerequisites

- Supabase project created at [supabase.com](https://supabase.com)
- Project URL and anon key configured in `.env.local`

## Step-by-Step Setup

### 1. Access SQL Editor

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### 2. Run the Migration

1. Open `supabase/migrations/001_initial_schema.sql` in your code editor
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### 3. Verify Tables Created

Run this query to confirm all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- `analyses`
- `profiles`
- `resumes`

### 4. Check Table Structure

To see all columns for a specific table:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

Replace `'profiles'` with `'resumes'` or `'analyses'` to check other tables.

### 5. Verify Indexes

Check that indexes were created:

```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Expected Schema

### Tables Created
- ✅ `profiles` - User profile information
- ✅ `resumes` - Uploaded resume files
- ✅ `analyses` - ATS analysis results

### Indexes Created
- ✅ Primary keys on all tables
- ✅ Foreign key indexes
- ✅ Timestamp indexes for sorting
- ✅ GIN indexes on JSONB columns

### Triggers Created
- ✅ Auto-update `updated_at` on all tables

## Next Steps

After successful migration:

1. **Set up Row Level Security (RLS)**
   - Navigate to **Authentication** → **Policies**
   - Apply RLS policies (see subtask 2.4)

2. **Configure Storage Bucket**
   - Navigate to **Storage**
   - Create `resumes` bucket (see subtask 2.5)

3. **Test from Next.js App**
   - Visit `http://localhost:3000/test-supabase`
   - Verify connection is successful

## Troubleshooting

### Error: "relation already exists"
The table already exists. You can either:
- Drop the existing tables first (⚠️ destroys data)
- Skip this migration

### Error: "permission denied"
Ensure you're using the SQL Editor in your Supabase dashboard, which has full permissions.

### Tables not showing up
- Refresh the **Table Editor** page
- Check the **Database** → **Tables** section
- Verify the SQL ran without errors

## Manual Table Creation (Alternative)

If you prefer using the Supabase Table Editor UI:

1. Go to **Table Editor**
2. Click **New Table**
3. Create each table manually using the schema in `supabase/README.md`

Note: This method is more time-consuming and error-prone. Using SQL is recommended.

## Rollback (if needed)

To remove all tables:

```sql
DROP TABLE IF EXISTS analyses CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

⚠️ **Warning**: This will permanently delete all data!

## Support

For more details on the schema:
- See `supabase/README.md` for full documentation
- See `lib/types/database.ts` for TypeScript types
- Check Supabase docs: https://supabase.com/docs
