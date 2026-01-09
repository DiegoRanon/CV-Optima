- # Supabase Storage Configuration

This document explains the Storage setup for CV-Optima resume file uploads.

## Overview

The `resumes` bucket stores uploaded resume files (PDF and DOCX) with user-scoped access control.

## Storage Architecture

```
storage.buckets.resumes (Private)
    ├── {user_id_1}/
    │   ├── 2026-01-09_143022_resume-v1.pdf
    │   └── 2026-01-09_150332_resume-v2.pdf
    ├── {user_id_2}/
    │   └── 2026-01-09_151545_my-cv.docx
    └── {user_id_3}/
        └── 2026-01-09_152210_resume.pdf
```

**Key Features:**
- Private bucket (files not publicly accessible without authentication)
- User-scoped folders (`{user_id}/filename`)
- 10MB file size limit
- PDF and DOCX only
- Automatic timestamp prefixing to prevent collisions

---

## Bucket Configuration

| Setting | Value |
|---------|-------|
| **Bucket Name** | `resumes` |
| **Public Access** | `false` (Private) |
| **File Size Limit** | 10MB (10,485,760 bytes) |
| **Allowed MIME Types** | `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |

---

## Storage Policies

### Upload Policy
```sql
"Users can upload resumes to own folder"
```
- **Operation**: INSERT
- **Rule**: `bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text`
- **Effect**: Users can only upload files to folders matching their user ID

### View/Download Policy
```sql
"Users can view own resumes"
```
- **Operation**: SELECT
- **Rule**: `bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text`
- **Effect**: Users can only view/download files from their own folder

### Update Policy
```sql
"Users can update own resumes"
```
- **Operation**: UPDATE
- **Rule**: Same as upload
- **Effect**: Users can update metadata of their own files

### Delete Policy
```sql
"Users can delete own resumes"
```
- **Operation**: DELETE
- **Rule**: Same as upload
- **Effect**: Users can delete only their own files

---

## Helper Functions

### 1. `generate_resume_path(filename TEXT)`
Generates a safe storage path with user ID and timestamp.

**Format**: `{user_id}/{timestamp}_{sanitized_filename}`

**SQL Usage:**
```sql
SELECT public.generate_resume_path('my resume.pdf');
-- Returns: 'a1b2c3d4.../20260109_143022_my_resume.pdf'
```

**TypeScript Usage:**
```typescript
import { generateFilePath } from '@/lib/supabase/storage'

const path = generateFilePath(userId, 'my resume.pdf')
// Returns: 'a1b2c3d4.../2026-01-09T14-30-22-123Z_my_resume.pdf'
```

---

### 2. `get_user_storage_usage()`
Returns total storage used by the current user in bytes.

**SQL Usage:**
```sql
SELECT public.get_user_storage_usage();
-- Returns: 5242880 (5MB in bytes)
```

**TypeScript Usage:**
```typescript
import { getUserStorageUsage } from '@/lib/supabase/storage'

const { data } = await getUserStorageUsage(userId)
console.log(data.mbUsed) // '5.00'
```

---

### 3. `cleanup_orphaned_resume_files()`
Deletes storage files without corresponding database records.

**SQL Usage:**
```sql
SELECT public.cleanup_orphaned_resume_files();
-- Returns: 3 (number of files deleted)
```

**TypeScript Usage:**
```typescript
import { cleanupOrphanedFiles } from '@/lib/supabase/storage'

const { data } = await cleanupOrphanedFiles()
console.log(`Deleted ${data.deletedCount} orphaned files`)
```

---

## TypeScript Utilities

The `lib/supabase/storage.ts` module provides helper functions for file operations.

### Upload Resume

```typescript
import { uploadResume } from '@/lib/supabase/storage'

// In your component or server action
const handleUpload = async (file: File, userId: string) => {
  const result = await uploadResume(file, userId)
  
  if (result.success) {
    console.log('File uploaded:', result.data.url)
    console.log('File size:', result.data.fileSize)
    
    // Save to database
    await supabase.from('resumes').insert({
      user_id: userId,
      title: file.name,
      file_url: result.data.url,
      file_size: result.data.fileSize,
      file_type: result.data.fileType === 'application/pdf' ? 'pdf' : 'docx'
    })
  } else {
    console.error('Upload failed:', result.error)
  }
}
```

### Download Resume

```typescript
import { downloadResume } from '@/lib/supabase/storage'

const handleDownload = async (filePath: string) => {
  const result = await downloadResume(filePath)
  
  if (result.success && result.data) {
    // Create download link
    const url = URL.createObjectURL(result.data)
    const a = document.createElement('a')
    a.href = url
    a.download = filePath.split('/').pop() || 'resume.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }
}
```

### Delete Resume

```typescript
import { deleteResume } from '@/lib/supabase/storage'

const handleDelete = async (filePath: string, resumeId: string) => {
  // Delete from storage
  const result = await deleteResume(filePath)
  
  if (result.success) {
    // Delete from database
    await supabase.from('resumes').delete().eq('id', resumeId)
    console.log('Resume deleted')
  }
}
```

### List User's Resumes

```typescript
import { listUserResumes } from '@/lib/supabase/storage'

const loadResumes = async (userId: string) => {
  const result = await listUserResumes(userId)
  
  if (result.success && result.data) {
    console.log('Files:', result.data)
    result.data.forEach(file => {
      console.log(`- ${file.name} (${file.metadata.size} bytes)`)
    })
  }
}
```

---

## File Validation

### Client-Side Validation

```typescript
import { validateResumeFile, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/supabase/storage'

const onFileSelect = (file: File) => {
  const validation = validateResumeFile(file)
  
  if (!validation.valid) {
    alert(validation.error)
    return
  }
  
  // Proceed with upload
  handleUpload(file)
}
```

### Validation Rules

- **Max Size**: 10MB
- **Allowed Types**:
  - PDF: `application/pdf`
  - DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

---

## Setup Instructions

### Option 1: Run SQL Migration (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/003_storage_policies.sql`
3. Paste and run

This creates the bucket and all policies automatically.

### Option 2: Manual Setup via Dashboard

1. **Create Bucket:**
   - Go to Storage in Supabase Dashboard
   - Click "New Bucket"
   - Name: `resumes`
   - Public: OFF (Private)
   - File size limit: `10485760` (10MB)
   - Allowed MIME types: Add `application/pdf` and `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

2. **Apply Policies:**
   - Click on the `resumes` bucket
   - Go to "Policies" tab
   - Run the SQL from `003_storage_policies.sql` to create policies

---

## Testing

### Test 1: Upload File

```typescript
// Create a test file
const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

// Upload
const result = await uploadResume(file, userId)
console.assert(result.success === true, 'Upload should succeed')
```

### Test 2: User Isolation

1. Log in as User A
2. Upload a resume
3. Log in as User B
4. Try to access User A's file

**Expected**: User B cannot see or access User A's files.

### Test 3: File Type Validation

```typescript
const invalidFile = new File(['content'], 'doc.txt', { type: 'text/plain' })
const validation = validateResumeFile(invalidFile)
console.assert(validation.valid === false, 'Should reject non-PDF/DOCX files')
```

### Test 4: Size Limit

```typescript
// Create 11MB file (exceeds limit)
const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.pdf', { 
  type: 'application/pdf' 
})
const validation = validateResumeFile(largeFile)
console.assert(validation.valid === false, 'Should reject files > 10MB')
```

---

## Security Considerations

### ✅ Best Practices

1. **Always validate files client-side** before upload
2. **Never expose service role key** in client code
3. **Use authenticated clients** for all storage operations
4. **Store file paths in database** for tracking
5. **Implement file size limits** to prevent abuse

### ⚠️ Important Notes

- Private buckets still generate URLs, but they require authentication to access
- Storage policies work in conjunction with RLS on the `resumes` table
- Users can only upload to folders matching their `auth.uid()`
- File paths should always be scoped by user ID

---

## Troubleshooting

### Issue: "new row violates storage policy"

**Cause**: Trying to upload to a path that doesn't match user ID.

**Solution**: Ensure file path starts with user's ID:
```typescript
const path = `${userId}/filename.pdf` // ✅ Correct
const path = `other-user-id/filename.pdf` // ❌ Wrong
```

### Issue: "File size exceeds limit"

**Cause**: File larger than 10MB.

**Solution**: Validate before upload or compress the file.

### Issue: "Invalid MIME type"

**Cause**: Trying to upload non-PDF/DOCX file.

**Solution**: Validate file type before upload:
```typescript
if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
  throw new Error('Only PDF and DOCX files allowed')
}
```

### Issue: Can't download file

**Cause**: Using wrong file path or user doesn't own the file.

**Solution**: Verify file path matches the `file_url` in database.

---

## Maintenance

### Regular Cleanup

Run periodically to remove orphaned files:

```typescript
import { cleanupOrphanedFiles } from '@/lib/supabase/storage'

// In a cron job or admin function
const result = await cleanupOrphanedFiles()
console.log(`Cleaned up ${result.data.deletedCount} orphaned files`)
```

### Monitor Storage Usage

```typescript
import { getUserStorageUsage } from '@/lib/supabase/storage'

const { data } = await getUserStorageUsage(userId)
console.log(`User storage: ${data.mbUsed}MB`)

// Warn user if approaching limit (if you implement one)
if (Number(data.mbUsed) > 50) {
  console.warn('Storage usage high')
}
```

---

## Next Steps

After Storage is configured:
1. Implement file upload UI in the Vault page (Task 5)
2. Add PDF text extraction service (Task 4)
3. Integrate with resume management dashboard

---

## References

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Security](https://supabase.com/docs/guides/storage/security/access-control)
- Project: `lib/supabase/storage.ts` for TypeScript utilities
- Project: `lib/types/database.ts` for database types
