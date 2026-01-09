/**
 * PDF Text Extraction Utility
 * Uses pdf-parse library to extract text content from PDF files
 */

export type PDFParseResult = {
  success: boolean;
  text?: string;
  error?: string;
  metadata?: {
    pages: number;
    info?: unknown;
  };
};

/**
 * Extract text content from a PDF file buffer
 * @param buffer - PDF file as Buffer or ArrayBuffer
 * @returns Parsed text content and metadata
 */
export async function extractTextFromPDF(
  buffer: Buffer | ArrayBuffer
): Promise<PDFParseResult> {
  try {
    // Convert ArrayBuffer to Buffer if needed
    const pdfBuffer = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;
    
    // Validate buffer is not empty
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return {
        success: false,
        error: 'PDF buffer is empty',
      };
    }
    
    // Dynamic import of pdf-parse
    const { PDFParse } = await import('pdf-parse');
    
    // Create parser instance with the PDF data
    const parser = new PDFParse({ data: pdfBuffer });
    
    // Extract text from all pages
    const result = await parser.getText();
    
    // Get document info for metadata
    const info = await parser.getInfo();
    
    // Clean up parser resources
    await parser.destroy();
    
    // Validate extracted text
    if (!result.text || result.text.trim().length === 0) {
      return {
        success: false,
        error: 'No text content found in PDF. The file might be image-based or corrupted.',
      };
    }
    
    // Clean up extracted text
    const cleanedText = cleanText(result.text);
    
    return {
      success: true,
      text: cleanedText,
      metadata: {
        pages: result.pages.length,
        info: info.info,
      },
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    
    // Provide specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        return {
          success: false,
          error: 'Invalid PDF file. The file may be corrupted or not a valid PDF.',
        };
      }
      if (error.message.includes('password')) {
        return {
          success: false,
          error: 'PDF is password-protected. Please upload an unprotected file.',
        };
      }
      return {
        success: false,
        error: `PDF parsing failed: ${error.message}`,
      };
    }
    
    return {
      success: false,
      error: 'An unknown error occurred while parsing the PDF.',
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
    // Trim leading/trailing whitespace from each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Remove any remaining excessive whitespace
    .trim();
}

/**
 * Check if a buffer appears to be a valid PDF by checking magic number
 */
export function isValidPDFBuffer(buffer: Buffer | ArrayBuffer): boolean {
  try {
    const pdfBuffer = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;
    
    // PDF files start with %PDF-
    const header = pdfBuffer.slice(0, 5).toString('utf-8');
    return header === '%PDF-';
  } catch {
    return false;
  }
}

/**
 * Extract text from PDF file (convenience function for File objects)
 */
export async function extractTextFromPDFFile(file: File): Promise<PDFParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    return await extractTextFromPDF(arrayBuffer);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read PDF file',
    };
  }
}
