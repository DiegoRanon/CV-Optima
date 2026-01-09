# Storage Setup Guide (Dashboard Method)

Since storage policies require elevated permissions, you need to configure the storage bucket through the Supabase Dashboard UI instead of SQL.

## Step-by-Step Setup

### Step 1: Run Helper Functions SQL

First, run the helper functions that CAN be created via SQL:

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy contents of `supabase/migrations/003_storage_helpers.sql`
3. Paste and run

This creates the helper functions for path generation and storage management.

---

### Step 2: Create Storage Bucket

1. In Supabase Dashboard, navigate to **Storage** in the left sidebar
2. Click **"New bucket"**
3. Configure the bucket:

   **Bucket Settings:**
   - **Name**: `resumes`
   - **Public bucket**: ❌ **OFF** (Private)
   - **File size limit**: `10485760` (10MB)
   - **Allowed MIME types**: Click "Restrict file upload by MIME type" and add:
     - `application/pdf`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

4. Click **"Create bucket"**

---

### Step 3: Configure Storage Policies

Now you need to add policies to the `resumes` bucket:

1. In **Storage**, click on the **`resumes`** bucket you just created
2. Click the **"Policies"** tab
3. You'll see the policies interface

#### Policy 1: Upload (INSERT)

Click **"New Policy"** → **"For full customization"**

- **Policy name**: `Users can upload resumes to own folder`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **USING expression** (leave empty for INSERT)
- **WITH CHECK expression**:
  ```sql
  (bucket_id = 'resumes'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
  ```
- Click **"Review"** then **"Save policy"**

#### Policy 2: View/Download (SELECT)

Click **"New Policy"** → **"For full customization"**

- **Policy name**: `Users can view own resumes`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  (bucket_id = 'resumes'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
  ```
- Click **"Review"** then **"Save policy"**

#### Policy 3: Update (UPDATE)

Click **"New Policy"** → **"For full customization"**

- **Policy name**: `Users can update own resumes`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  (bucket_id = 'resumes'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
  ```
- **WITH CHECK expression**:
  ```sql
  (bucket_id = 'resumes'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
  ```
- Click **"Review"** then **"Save policy"**

#### Policy 4: Delete (DELETE)

Click **"New Policy"** → **"For full customization"**

- **Policy name**: `Users can delete own resumes`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  (bucket_id = 'resumes'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
  ```
- Click **"Review"** then **"Save policy"**

---

### Step 4: Verify Setup

After creating all policies, verify:

1. **Check bucket exists**:
   - Go to Storage → You should see `resumes` bucket
   - It should show as "Private"

2. **Check policies**:
   - Click on `resumes` bucket → Policies tab
   - You should see 4 policies listed

3. **Test with SQL** (optional):
   ```sql
   -- Check bucket configuration
   SELECT * FROM storage.buckets WHERE id = 'resumes';
   
   -- Check helper functions exist
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name LIKE '%resume%';
   ```

---

## Alternative: Policy Templates

If the manual policy creation is too tedious, you can use Supabase's policy templates:

1. Click **"New Policy"** → **"Get started quickly with a template"**
2. Choose **"Enable insert for authenticated users only"**
3. Modify the policy to add the folder check:
   ```sql
   ((storage.foldername(name))[1] = (auth.uid())::text)
   ```
4. Repeat for SELECT, UPDATE, DELETE operations

---

## Quick Copy-Paste Policies

For faster setup, here are all four policies in a format you can copy:

### INSERT Policy
```sql
(bucket_id = 'resumes'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

### SELECT Policy
```sql
(bucket_id = 'resumes'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

### UPDATE Policy (USING)
```sql
(bucket_id = 'resumes'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

### UPDATE Policy (WITH CHECK)
```sql
(bucket_id = 'resumes'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

### DELETE Policy
```sql
(bucket_id = 'resumes'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

---

## What These Policies Do

All policies enforce that:
- Files must be in the `resumes` bucket
- File path must start with the user's ID: `{user_id}/filename.pdf`
- Users can ONLY access files in their own folder

This ensures complete data isolation between users at the storage level.

---

## Troubleshooting

### Issue: Can't see "New Policy" button
**Solution**: Make sure you're in the correct bucket's Policies tab.

### Issue: Policy creation fails
**Solution**: Double-check the SQL expressions for typos. Make sure parentheses match.

### Issue: Users can't upload files
**Solution**: 
1. Verify INSERT policy exists and is enabled
2. Check that file paths include the user ID: `{userId}/filename.pdf`
3. Verify user is authenticated

### Issue: "Row level security policy violated"
**Solution**: 
1. Make sure the file path starts with the user's UUID
2. Check that all 4 policies are created
3. Verify policies target `authenticated` role

---

## Next Steps

After setup is complete:
✅ Storage bucket configured  
✅ Policies applied  
✅ Helper functions created  
✅ Ready to integrate with Resume Vault UI (Task 5)

The TypeScript utilities in `lib/supabase/storage.ts` are already configured to work with this setup!
