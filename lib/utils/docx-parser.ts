/**
 * DOCX Text Extraction Utility
 * Uses mammoth library to extract text content from DOCX files
 */

import mammoth from 'mammoth';

export type DOCXParseResult = {
  success: boolean;
  text?: string;
  error?: string;
  metadata?: {
    messages?: string[];
  };
};

/**
 * Extract text content from a DOCX file buffer
 * @param buffer - DOCX file as Buffer or ArrayBuffer
 * @returns Parsed text content and metadata
 */
export async function extractTextFromDOCX(
  buffer: Buffer | ArrayBuffer
): Promise<DOCXParseResult> {
  try {
    // Convert ArrayBuffer to Buffer if needed
    const docxBuffer = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;
    
    // Validate buffer is not empty
    if (!docxBuffer || docxBuffer.length === 0) {
      return {
        success: false,
        error: 'DOCX buffer is empty',
      };
    }
    
    // Parse DOCX with mammoth
    const result = await mammoth.extractRawText({
      buffer: docxBuffer,
    });
    
    // Check for conversion warnings/errors
    const hasErrors = result.messages.some(msg => msg.type === 'error');
    if (hasErrors) {
      const errorMessages = result.messages
        .filter(msg => msg.type === 'error')
        .map(msg => msg.message)
        .join('; ');
      
      return {
        success: false,
        error: `DOCX parsing errors: ${errorMessages}`,
      };
    }
    
    // Validate extracted text
    if (!result.value || result.value.trim().length === 0) {
      return {
        success: false,
        error: 'No text content found in DOCX. The file might be empty or corrupted.',
      };
    }
    
    // Clean up extracted text
    const cleanedText = cleanText(result.value);
    
    // Collect warnings if any
    const warnings = result.messages
      .filter(msg => msg.type === 'warning')
      .map(msg => msg.message);
    
    return {
      success: true,
      text: cleanedText,
      metadata: {
        messages: warnings.length > 0 ? warnings : undefined,
      },
    };
  } catch (error) {
    console.error('DOCX parsing error:', error);
    
    // Provide specific error messages
    if (error instanceof Error) {
      if (error.message.includes('not a valid')) {
        return {
          success: false,
          error: 'Invalid DOCX file. The file may be corrupted or not a valid DOCX format.',
        };
      }
      if (error.message.includes('zip')) {
        return {
          success: false,
          error: 'DOCX file structure is invalid. The file may be corrupted.',
        };
      }
      return {
        success: false,
        error: `DOCX parsing failed: ${error.message}`,
      };
    }
    
    return {
      success: false,
      error: 'An unknown error occurred while parsing the DOCX file.',
    };
  }
}

/**
 * Extract text with HTML formatting (alternative method)
 * Useful if we need to preserve more formatting details
 */
export async function extractHTMLFromDOCX(
  buffer: Buffer | ArrayBuffer
): Promise<DOCXParseResult> {
  try {
    const docxBuffer = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;
    
    const result = await mammoth.convertToHtml({
      buffer: docxBuffer,
    });
    
    if (!result.value || result.value.trim().length === 0) {
      return {
        success: false,
        error: 'No content found in DOCX file.',
      };
    }
    
    return {
      success: true,
      text: result.value,
      metadata: {
        messages: result.messages.map(msg => msg.message),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert DOCX to HTML',
    };
  }
}

/**
 * Clean and normalize extracted text
 * Removes excessive whitespace while preserving paragraph structure
 */
function cleanText(text: string): string {
  return text
    // Replace multiple spaces with single space
    .replace(/ {2,}/g, ' ')
    // Replace more than 2 consecutive newlines with 2 newlines
    .replace(/\n{3,}/g, '\n\n')
    // Replace tab characters with spaces
    .replace(/\t/g, ' ')
    // Trim leading/trailing whitespace from each line
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0) // Remove empty lines
    .join('\n')
    // Final trim
    .trim();
}

/**
 * Check if a buffer appears to be a valid DOCX by checking magic number
 * DOCX files are ZIP archives, so they start with PK
 */
export function isValidDOCXBuffer(buffer: Buffer | ArrayBuffer): boolean {
  try {
    const docxBuffer = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;
    
    // DOCX files (ZIP archives) start with PK (0x50 0x4B)
    const header = docxBuffer.slice(0, 2);
    return header[0] === 0x50 && header[1] === 0x4B;
  } catch {
    return false;
  }
}

/**
 * Extract text from DOCX file (convenience function for File objects)
 */
export async function extractTextFromDOCXFile(file: File): Promise<DOCXParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    return await extractTextFromDOCX(arrayBuffer);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read DOCX file',
    };
  }
}
