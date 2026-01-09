# Resume Parser Testing Guide

This document outlines the testing procedures for the PDF and DOCX parsing functionality implemented in Task #4.

## Overview

The resume parsing system consists of several components:
- File validation utilities (`lib/utils/file-validation.ts`)
- PDF text extraction (`lib/utils/pdf-parser.ts`)
- DOCX text extraction (`lib/utils/docx-parser.ts`)
- Main server action (`app/actions/parse-resume.ts`)
- Upload form UI (`app/(dashboard)/vault/_components/resume-upload-form.tsx`)

## Prerequisites

1. **Database Setup**: Ensure the Supabase database schema is deployed (Task #2 completed)
2. **Storage Bucket**: Verify the 'resumes' storage bucket exists in Supabase
3. **Authentication**: You must be logged in to test resume uploads
4. **Dependencies**: Verify npm packages are installed:
   ```bash
   npm list pdf-parse mammoth
   ```

## Test Cases

### 1. Valid File Upload Tests

#### Test 1.1: Upload Valid PDF Resume
**Steps:**
1. Navigate to `/vault` page
2. Click "Choose file" and select a valid PDF resume
3. Optionally enter a custom title
4. Click "Upload and Parse Resume"

**Expected Results:**
- ✅ File uploads successfully
- ✅ Text is extracted from PDF
- ✅ Resume record created in database
- ✅ Success message displays with resume ID
- ✅ Text preview shows first 500 characters
- ✅ Form resets after successful upload

**Test Files Needed:**
- Single-page PDF resume
- Multi-page PDF resume (2+ pages)
- PDF with complex formatting (tables, columns)

#### Test 1.2: Upload Valid DOCX Resume
**Steps:**
1. Navigate to `/vault` page
2. Select a valid DOCX resume file
3. Enter custom title or use auto-generated title
4. Submit form

**Expected Results:**
- ✅ File uploads successfully
- ✅ Text is extracted from DOCX
- ✅ Resume record created in database
- ✅ Success message with preview
- ✅ Proper text formatting preserved

**Test Files Needed:**
- Simple DOCX resume
- DOCX with tables and formatting
- DOCX with images (text should still extract)

### 2. File Validation Tests

#### Test 2.1: File Too Large
**Steps:**
1. Attempt to upload a file larger than 10MB

**Expected Results:**
- ❌ Validation error: "File size exceeds maximum allowed size of 10MB"
- File not uploaded to storage
- No database record created

#### Test 2.2: Invalid File Type
**Steps:**
1. Attempt to upload files with wrong extensions:
   - .txt file
   - .jpg image
   - .doc (old Word format)
   - .zip file

**Expected Results:**
- ❌ File input should not accept non-PDF/DOCX files (browser-level)
- ❌ If bypassed, server validation returns error

#### Test 2.3: Empty File
**Steps:**
1. Create an empty file (0 bytes)
2. Rename to .pdf or .docx
3. Attempt upload

**Expected Results:**
- ❌ Validation error: "File is empty"

### 3. Text Extraction Tests

#### Test 3.1: PDF with No Extractable Text
**Steps:**
1. Upload a PDF that is image-based (scanned document)

**Expected Results:**
- ❌ Extraction error: "No text content found in PDF"
- File removed from storage
- No database record created

#### Test 3.2: Corrupted PDF File
**Steps:**
1. Take a valid PDF and corrupt it (open in text editor, delete some content)
2. Attempt upload

**Expected Results:**
- ❌ Parsing error: "Invalid PDF file" or "PDF is corrupted"
- File removed from storage on failure

#### Test 3.3: Password-Protected PDF
**Steps:**
1. Upload a password-protected PDF

**Expected Results:**
- ❌ Error: "PDF is password-protected"

#### Test 3.4: Corrupted DOCX File
**Steps:**
1. Corrupt a DOCX file (rename .zip, modify, rename back)
2. Attempt upload

**Expected Results:**
- ❌ Error: "DOCX file structure is invalid"

### 4. Database Integration Tests

#### Test 4.1: Resume Record Creation
**Steps:**
1. Upload a valid resume
2. Check Supabase database

**Expected Results:**
- ✅ Record exists in `resumes` table with:
  - Correct `user_id` (current user)
  - `title` (custom or auto-generated)
  - `file_url` (storage URL)
  - `raw_text` (extracted text)
  - `file_size` (correct size in bytes)
  - `file_type` ('pdf' or 'docx')
  - `created_at` timestamp

#### Test 4.2: Row Level Security
**Steps:**
1. User A uploads a resume
2. Log in as User B
3. Attempt to query User A's resume

**Expected Results:**
- ❌ User B cannot see User A's resume
- RLS policies enforce user isolation

### 5. Storage Integration Tests

#### Test 5.1: File Storage Path
**Steps:**
1. Upload a resume
2. Check Supabase Storage bucket 'resumes'

**Expected Results:**
- ✅ File exists at path: `{user_id}/{timestamp}_{filename}`
- ✅ File is accessible only to owner
- ✅ File URL in database matches storage location

#### Test 5.2: Rollback on Database Failure
**Steps:**
1. Simulate database error (temporarily modify table schema)
2. Attempt upload

**Expected Results:**
- ❌ Upload fails with error
- ✅ File is NOT left in storage (cleaned up)
- No orphaned files

### 6. UI/UX Tests

#### Test 6.1: Auto-Generated Title
**Steps:**
1. Select file: "john_doe_resume_2024.pdf"
2. Observe title field

**Expected Results:**
- ✅ Title auto-fills: "John Doe Resume 2024"

#### Test 6.2: Loading States
**Steps:**
1. Upload a large file (close to 10MB)
2. Observe UI during upload

**Expected Results:**
- ✅ Button shows "Processing..." with spinner
- ✅ Form inputs are disabled
- ✅ No way to submit twice

#### Test 6.3: Error Display
**Steps:**
1. Trigger any error condition

**Expected Results:**
- ✅ Error message displays in red alert
- ✅ Error icon shown
- ✅ Clear, actionable error message

### 7. Edge Cases

#### Test 7.1: Special Characters in Filename
**Steps:**
1. Upload file with name: "resume (final) [2024] #1.pdf"

**Expected Results:**
- ✅ File uploads successfully
- ✅ Filename sanitized in storage
- ✅ Original title preserved in database

#### Test 7.2: Very Long Filename
**Steps:**
1. Upload file with extremely long name (200+ chars)

**Expected Results:**
- ✅ File uploads successfully
- ✅ Filename truncated/sanitized if needed

#### Test 7.3: Concurrent Uploads
**Steps:**
1. Open two browser tabs
2. Upload different files simultaneously

**Expected Results:**
- ✅ Both uploads succeed
- ✅ No race conditions
- ✅ Unique filenames (timestamp ensures uniqueness)

#### Test 7.4: Resume with Minimal Text
**Steps:**
1. Upload a resume with very little text (<50 characters)

**Expected Results:**
- ✅ File uploads successfully
- ✅ All text extracted
- ⚠️ May want to add minimum text length validation

## Manual Testing Checklist

Use this checklist when testing:

- [ ] Valid PDF upload (single page)
- [ ] Valid PDF upload (multi-page)
- [ ] Valid DOCX upload
- [ ] File too large rejection
- [ ] Invalid file type rejection
- [ ] Empty file rejection
- [ ] Image-based PDF rejection
- [ ] Corrupted file handling
- [ ] Password-protected PDF handling
- [ ] Auto-generated title works
- [ ] Custom title works
- [ ] Loading states display correctly
- [ ] Success message with preview
- [ ] Error messages display clearly
- [ ] Form resets after success
- [ ] Database record created correctly
- [ ] Storage file exists at correct path
- [ ] RLS prevents cross-user access
- [ ] File cleanup on errors
- [ ] Special characters in filename
- [ ] Concurrent uploads

## Automated Testing

### Unit Tests (Future Enhancement)

Create tests for:
```typescript
// lib/utils/file-validation.test.ts
- validateFileType()
- validateFileSize()
- validateFileNotEmpty()
- validateResumeFile()

// lib/utils/pdf-parser.test.ts
- extractTextFromPDF()
- isValidPDFBuffer()
- cleanText()

// lib/utils/docx-parser.test.ts
- extractTextFromDOCX()
- isValidDOCXBuffer()
```

### Integration Tests (Future Enhancement)

Test the complete flow:
```typescript
// app/actions/parse-resume.test.ts
- Full upload → parse → store flow
- Error handling and rollback
- Authentication checks
```

## Known Issues & Limitations

1. **Image-Based PDFs**: Cannot extract text from scanned/image PDFs
   - **Workaround**: Consider adding OCR support in future
   
2. **Complex Formatting**: Some formatting may be lost during extraction
   - **Impact**: Minor, as we primarily need the text content

3. **Password-Protected Files**: Not supported
   - **Workaround**: User must remove password before upload

4. **Large Files**: 10MB limit may exclude some resumes with embedded images
   - **Current**: Adequate for most text-based resumes

## Performance Benchmarks

Expected processing times:
- PDF (1-2 pages): < 3 seconds
- PDF (3-5 pages): 3-5 seconds
- DOCX (any size): 2-4 seconds

If processing takes longer than 10 seconds, investigate:
- File size
- Network latency
- Supabase connection issues

## Troubleshooting

### Issue: "Failed to upload file"
- Check Supabase Storage bucket exists
- Verify storage policies are correct
- Check network connection

### Issue: "No text content found"
- Verify PDF is not image-based
- Check if PDF is corrupted
- Try opening PDF in a reader first

### Issue: "Authentication required"
- Ensure user is logged in
- Check session validity
- Verify Supabase auth is working

### Issue: Database insert fails
- Check database schema is deployed
- Verify RLS policies allow insert
- Check user authentication

## Success Criteria

Task #4 is complete when:
- ✅ All valid PDFs extract text correctly
- ✅ All valid DOCX files extract text correctly
- ✅ File validation prevents invalid uploads
- ✅ Errors are handled gracefully with clear messages
- ✅ Files and data are stored correctly in Supabase
- ✅ RLS enforces user isolation
- ✅ No orphaned files on errors
- ✅ UI provides good user feedback
- ✅ No linter errors in code
- ✅ Documentation is complete

## Next Steps

After Task #4 is validated:
1. Task #5: Build complete Resume Management Dashboard
   - List all resumes
   - View resume details
   - Delete resumes
   - Version management

2. Task #6: Implement OpenAI integration for analysis

---

**Last Updated**: 2026-01-09
**Task**: #4 - PDF Parsing and Text Extraction Service
