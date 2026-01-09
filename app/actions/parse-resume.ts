'use server'

/**
 * Server Action: Parse Resume
 * Handles resume file upload, text extraction, and database storage
 */

import { createClient } from '@/lib/supabase/server'
import { extractTextFromPDF } from '@/lib/utils/pdf-parser'
import { extractTextFromDOCX } from '@/lib/utils/docx-parser'
import { validateResumeFile } from '@/lib/utils/file-validation'
import type { ResumeInsert } from '@/lib/types/database'

export type ParseResumeResult = {
  success: boolean
  error?: string
  data?: {
    resumeId: string
    title: string
    fileUrl: string
    textPreview: string
  }
}

/**
 * Main server action to parse and store a resume
 * @param formData - FormData containing the resume file and optional title
 */
export async function parseResume(formData: FormData): Promise<ParseResumeResult> {
  try {
    // 1. Extract file and metadata from form data
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string) || undefined

    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      }
    }

    // 2. Validate file
    const validation = validateResumeFile(file)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      }
    }

    // 3. Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to upload a resume',
      }
    }

    // 4. Upload file to Supabase Storage
    const uploadResult = await uploadResumeFile(file, user.id, supabase)
    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error,
      }
    }

    // 5. Extract text from file
    const extractionResult = await extractTextFromFile(file)
    if (!extractionResult.success) {
      // Clean up uploaded file if extraction fails
      await supabase.storage.from('resumes').remove([uploadResult.filePath!])

      return {
        success: false,
        error: extractionResult.error,
      }
    }

    // 6. Determine file type
    const fileType = file.type === 'application/pdf' ? 'pdf' : 'docx'

    // 7. Generate title if not provided
    const resumeTitle = title || generateResumeTitle(file.name)

    // 8. Store resume record in database
    const resumeData: ResumeInsert = {
      user_id: user.id,
      title: resumeTitle,
      file_url: uploadResult.fileUrl!,
      raw_text: extractionResult.text!,
      file_size: file.size,
      file_type: fileType,
    }

    const { data: resume, error: dbError } = await supabase
      .from('resumes')
      .insert(resumeData)
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('resumes').remove([uploadResult.filePath!])

      console.error('Database insert error:', dbError)
      return {
        success: false,
        error: 'Failed to save resume to database',
      }
    }

    // 9. Return success with resume data
    return {
      success: true,
      data: {
        resumeId: resume.id,
        title: resume.title,
        fileUrl: resume.file_url,
        textPreview: extractionResult.text!.substring(0, 500) + '...',
      },
    }
  } catch (error) {
    console.error('Unexpected error in parseResume:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Upload resume file to Supabase Storage
 */
async function uploadResumeFile(
  file: File,
  userId: string,
  supabase: any
): Promise<{
  success: boolean
  error?: string
  filePath?: string
  fileUrl?: string
}> {
  try {
    // Generate unique file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${userId}/${timestamp}_${safeFilename}`

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Storage upload error:', error)
      return {
        success: false,
        error: `Failed to upload file: ${error.message}`,
      }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('resumes').getPublicUrl(filePath)

    return {
      success: true,
      filePath: data.path,
      fileUrl: publicUrl,
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Extract text from file based on file type
 */
async function extractTextFromFile(file: File): Promise<{
  success: boolean
  error?: string
  text?: string
}> {
  try {
    const arrayBuffer = await file.arrayBuffer()

    // Determine file type and use appropriate parser
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const result = await extractTextFromPDF(arrayBuffer)
      return {
        success: result.success,
        error: result.error,
        text: result.text,
      }
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.docx')
    ) {
      const result = await extractTextFromDOCX(arrayBuffer)
      return {
        success: result.success,
        error: result.error,
        text: result.text,
      }
    } else {
      return {
        success: false,
        error: 'Unsupported file type',
      }
    }
  } catch (error) {
    console.error('Text extraction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Text extraction failed',
    }
  }
}

/**
 * Generate a resume title from filename
 */
function generateResumeTitle(filename: string): string {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.(pdf|docx)$/i, '')

  // Replace underscores and hyphens with spaces
  const cleaned = nameWithoutExt.replace(/[_-]/g, ' ')

  // Capitalize first letter of each word
  const title = cleaned
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

  return title || 'Untitled Resume'
}

/**
 * Delete a resume and its associated file from storage
 */
export async function deleteResume(resumeId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get the resume to find the file path
    const { data: resume, error: fetchError } = await supabase
      .from('resumes')
      .select('file_url, user_id')
      .eq('id', resumeId)
      .single()

    if (fetchError || !resume) {
      return {
        success: false,
        error: 'Resume not found',
      }
    }

    // Verify user owns this resume
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== resume.user_id) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Extract file path from URL
    const filePath = extractFilePathFromUrl(resume.file_url, user.id)

    // Delete from database (will cascade delete analyses due to foreign key)
    const { error: deleteError } = await supabase.from('resumes').delete().eq('id', resumeId)

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      return {
        success: false,
        error: 'Failed to delete resume',
      }
    }

    // Delete file from storage
    if (filePath) {
      await supabase.storage.from('resumes').remove([filePath])
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Delete resume error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    }
  }
}

/**
 * Extract file path from storage URL
 */
function extractFilePathFromUrl(url: string, userId: string): string | null {
  try {
    // URL format: https://{project}.supabase.co/storage/v1/object/public/resumes/{userId}/{filename}
    const parts = url.split('/resumes/')
    if (parts.length === 2) {
      return parts[1]
    }
    return null
  } catch {
    return null
  }
}
