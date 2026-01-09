# Row Level Security (RLS) Policies

This document explains the Row Level Security policies implemented for CV-Optima to ensure data privacy and security.

## Overview

Row Level Security (RLS) is enabled on all tables to ensure users can only access their own data. This provides database-level security that works regardless of how the database is accessed.

## Security Model

```
┌─────────────────┐
│   auth.users    │  (Supabase Auth)
│   auth.uid()    │
└────────┬────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌─────────────────┐              ┌──────────────────┐
│    profiles     │              │     resumes      │
│  (id = uid)     │              │  (user_id = uid) │
└─────────────────┘              └────────┬─────────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │    analyses      │
                                 │  (via resume_id) │
                                 └──────────────────┘
```

## Tables with RLS Enabled

### 1. **profiles**
- **Access Rule**: Users can only access rows where `id = auth.uid()`
- **Reasoning**: Each user has exactly one profile with their user ID

### 2. **resumes**
- **Access Rule**: Users can only access rows where `user_id = auth.uid()`
- **Reasoning**: Users should only see and manage their own uploaded resumes

### 3. **analyses**
- **Access Rule**: Users can only access analyses for resumes they own
- **Implementation**: Uses a subquery to check if `resumes.user_id = auth.uid()`
- **Reasoning**: Analyses belong to resumes, so ownership is transitive

---

## Policies by Table

### Profiles Table Policies

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| `Users can view own profile` | SELECT | `auth.uid() = id` |
| `Users can insert own profile` | INSERT | `auth.uid() = id` |
| `Users can update own profile` | UPDATE | `auth.uid() = id` |
| `Users can delete own profile` | DELETE | `auth.uid() = id` |

**Usage Example:**
```typescript
// This will only return the current user's profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .single()
```

---

### Resumes Table Policies

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| `Users can view own resumes` | SELECT | `auth.uid() = user_id` |
| `Users can insert own resumes` | INSERT | `auth.uid() = user_id` |
| `Users can update own resumes` | UPDATE | `auth.uid() = user_id` |
| `Users can delete own resumes` | DELETE | `auth.uid() = user_id` |

**Usage Example:**
```typescript
// This will only return resumes owned by the current user
const { data: resumes } = await supabase
  .from('resumes')
  .select('*')
  .order('created_at', { ascending: false })
```

---

### Analyses Table Policies

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| `Users can view own analyses` | SELECT | `EXISTS (SELECT 1 FROM resumes WHERE ...)` |
| `Users can insert own analyses` | INSERT | `EXISTS (SELECT 1 FROM resumes WHERE ...)` |
| `Users can update own analyses` | UPDATE | `EXISTS (SELECT 1 FROM resumes WHERE ...)` |
| `Users can delete own analyses` | DELETE | `EXISTS (SELECT 1 FROM resumes WHERE ...)` |

**Policy Logic:**
```sql
EXISTS (
    SELECT 1 FROM resumes
    WHERE resumes.id = analyses.resume_id
    AND resumes.user_id = auth.uid()
)
```

**Usage Example:**
```typescript
// This will only return analyses for resumes owned by the current user
const { data: analyses } = await supabase
  .from('analyses')
  .select(`
    *,
    resume:resumes(*)
  `)
  .eq('resume_id', resumeId)
```

---

## Automatic Profile Creation

When a user signs up, a profile is automatically created via a database trigger.

**Trigger Function:** `handle_new_user()`
- **Triggered On**: INSERT into `auth.users`
- **Action**: Creates a new profile with:
  - `id`: User's auth ID
  - `full_name`: From metadata or email
  - `credits`: 5 (default free tier)

**Code:**
```sql
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

---

## Helper Functions

### 1. `user_owns_resume(resume_id UUID)`
Checks if the current user owns a specific resume.

**Usage:**
```sql
SELECT public.user_owns_resume('uuid-here');
-- Returns: TRUE or FALSE
```

**TypeScript Usage:**
```typescript
const { data } = await supabase.rpc('user_owns_resume', {
  resume_id: 'uuid-here'
})
```

---

### 2. `get_user_credits()`
Returns the number of remaining credits for the current user.

**Usage:**
```sql
SELECT public.get_user_credits();
-- Returns: INTEGER (e.g., 5)
```

**TypeScript Usage:**
```typescript
const { data: credits } = await supabase.rpc('get_user_credits')
```

---

### 3. `deduct_credits(amount INTEGER)`
Deducts credits from the current user's account.

**Usage:**
```sql
SELECT public.deduct_credits(1);
-- Returns: TRUE if successful, FALSE if insufficient credits
```

**TypeScript Usage:**
```typescript
const { data: success } = await supabase.rpc('deduct_credits', {
  amount: 1
})

if (!success) {
  console.log('Insufficient credits')
}
```

---

## Testing RLS Policies

### Test 1: Verify RLS is Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

Expected: `rowsecurity = TRUE` for all tables.

### Test 2: View All Policies

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

### Test 3: Test User Isolation

1. Create two test users in Supabase Auth
2. Log in as User A, create a resume
3. Log in as User B, try to access User A's resume
4. Expected: User B should see zero results

**Test Query (as User B):**
```typescript
const { data, error } = await supabase
  .from('resumes')
  .select('*')
  // This should return only User B's resumes, not User A's
```

### Test 4: Test Unauthenticated Access

```typescript
// Create a client without authentication
const anonClient = createClient(url, anonKey)

const { data, error } = await anonClient
  .from('profiles')
  .select('*')

// Expected: error or empty results (no access without auth)
```

---

## Security Best Practices

### ✅ DO:
- Always use authenticated Supabase clients
- Let RLS policies handle access control
- Use the helper functions for common checks
- Test policies with multiple user accounts

### ❌ DON'T:
- Don't use the service role key in client-side code
- Don't bypass RLS with custom SQL unless absolutely necessary
- Don't assume application-level checks are sufficient
- Don't disable RLS in production

---

## Troubleshooting

### Issue: "new row violates row-level security policy"

**Cause:** Trying to insert/update data that doesn't match the policy.

**Solution:** Ensure the `user_id` or `id` field matches `auth.uid()`:
```typescript
const { data: user } = await supabase.auth.getUser()

await supabase.from('resumes').insert({
  user_id: user.user.id, // ✅ Must match authenticated user
  title: 'My Resume',
  // ...
})
```

### Issue: Can't see any data after login

**Cause:** Policies might be too restrictive or auth token not set.

**Solution:**
1. Verify user is authenticated: `await supabase.auth.getUser()`
2. Check policies allow SELECT
3. Verify data exists for that user

### Issue: Profile not created on signup

**Cause:** Trigger might not be working.

**Solution:**
1. Verify trigger exists: `\df public.handle_new_user`
2. Check for errors in Supabase logs
3. Manually create profile if needed:
```typescript
const { data: user } = await supabase.auth.getUser()
await supabase.from('profiles').insert({
  id: user.user.id,
  full_name: user.user.email,
  credits: 5
})
```

---

## Applying the Policies

### Step 1: Run the Migration

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/002_rls_policies.sql`
3. Paste and run

### Step 2: Verify Policies

Run the verification queries at the end of the migration file.

### Step 3: Test with Real Users

Create test accounts and verify data isolation works correctly.

---

## Next Steps

After RLS policies are in place:
1. Configure Supabase Storage with similar security rules (Subtask 2.5)
2. Implement authentication UI (Task 3)
3. Test with multiple user accounts

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Project: `lib/types/database.ts` for TypeScript types
