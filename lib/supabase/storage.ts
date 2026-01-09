import { createClient } from './client'

/**
 * Storage utilities for resume file uploads
 * Handles file uploads to Supabase Storage with proper security and validation
 */

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
} as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

export type AllowedMimeType = keyof typeof ALLOWED_FILE_TYPES

/**
 * Validates a file before upload
 */
export function validateResumeFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    }
  }

  // Check file type
  if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Please upload PDF or DOCX files only.`,
    }
  }

  return { valid: true }
}

/**
 * Generates a safe file path with user ID and timestamp
 * Format: {user_id}/{timestamp}_{filename}
 */
export function generateFilePath(userId: string, filename: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/${timestamp}_${safeFilename}`
}

/**
 * Uploads a resume file to Supabase Storage
 */
export async function uploadResume(file: File, userId: string) {
  const supabase = createClient()

  // Validate file
  const validation = validateResumeFile(file)
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      data: null,
    }
  }

  try {
    // Generate file path
    const filePath = generateFilePath(userId, file.name)

    // Upload file
    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      })

    if (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Get public URL (even for private buckets, this generates the storage URL)
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath)

    return {
      success: true,
      error: null,
      data: {
        path: data.path,
        fullPath: data.fullPath,
        url: urlData.publicUrl,
        fileSize: file.size,
        fileType: file.type,
      },
    }
  } catch (error) {
    console.error('Unexpected upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: null,
    }
  }
}

/**
 * Deletes a resume file from Storage
 */
export async function deleteResume(filePath: string) {
  const supabase = createClient()

  try {
    const { error } = await supabase.storage.from('resumes').remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    console.error('Unexpected delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Downloads a resume file from Storage
 */
export async function downloadResume(filePath: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.storage.from('resumes').download(filePath)

    if (error) {
      console.error('Download error:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    return {
      success: true,
      error: null,
      data: data, // Blob
    }
  } catch (error) {
    console.error('Unexpected download error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: null,
    }
  }
}

/**
 * Lists all resume files for the current user
 */
export async function listUserResumes(userId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.storage.from('resumes').list(userId, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    })

    if (error) {
      console.error('List error:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    return {
      success: true,
      error: null,
      data: data,
    }
  } catch (error) {
    console.error('Unexpected list error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: null,
    }
  }
}

/**
 * Gets the storage usage for the current user
 */
export async function getUserStorageUsage(userId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('get_user_storage_usage')

    if (error) {
      console.error('Storage usage error:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    return {
      success: true,
      error: null,
      data: {
        bytesUsed: data as number,
        mbUsed: ((data as number) / 1024 / 1024).toFixed(2),
      },
    }
  } catch (error) {
    console.error('Unexpected storage usage error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: null,
    }
  }
}

/**
 * Cleans up orphaned files (files without database records)
 */
export async function cleanupOrphanedFiles() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('cleanup_orphaned_resume_files')

    if (error) {
      console.error('Cleanup error:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    return {
      success: true,
      error: null,
      data: {
        deletedCount: data as number,
      },
    }
  } catch (error) {
    console.error('Unexpected cleanup error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: null,
    }
  }
}
