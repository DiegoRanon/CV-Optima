/**
 * File Validation Utilities for Resume Uploads
 * Validates file types, sizes, and MIME types for PDF and DOCX files
 */

// Maximum file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
} as const;

// Allowed extensions
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx'] as const;

export type ValidationResult = {
  valid: boolean;
  error?: string;
};

/**
 * Validates if the file type is allowed (PDF or DOCX)
 */
export function validateFileType(file: File): ValidationResult {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  // Check MIME type
  if (!Object.keys(ALLOWED_FILE_TYPES).includes(fileType)) {
    return {
      valid: false,
      error: 'Invalid file type. Only PDF and DOCX files are allowed.',
    };
  }
  
  // Check file extension as additional validation
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'Invalid file extension. Only .pdf and .docx files are allowed.',
    };
  }
  
  return { valid: true };
}

/**
 * Validates if the file size is within the allowed limit (10MB)
 */
export function validateFileSize(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size (${sizeMB}MB) exceeds the maximum allowed size of ${maxSizeMB}MB.`,
    };
  }
  
  return { valid: true };
}

/**
 * Validates if the file is empty
 */
export function validateFileNotEmpty(file: File): ValidationResult {
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty. Please upload a valid resume file.',
    };
  }
  
  return { valid: true };
}

/**
 * Comprehensive file validation
 * Checks file type, size, and ensures file is not empty
 */
export function validateResumeFile(file: File): ValidationResult {
  // Check if file is empty
  const emptyCheck = validateFileNotEmpty(file);
  if (!emptyCheck.valid) {
    return emptyCheck;
  }
  
  // Check file type
  const typeCheck = validateFileType(file);
  if (!typeCheck.valid) {
    return typeCheck;
  }
  
  // Check file size
  const sizeCheck = validateFileSize(file);
  if (!sizeCheck.valid) {
    return sizeCheck;
  }
  
  return { valid: true };
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}

/**
 * Check if file is PDF
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf' || getFileExtension(file.name) === '.pdf';
}

/**
 * Check if file is DOCX
 */
export function isDOCX(file: File): boolean {
  return (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    getFileExtension(file.name) === '.docx'
  );
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
