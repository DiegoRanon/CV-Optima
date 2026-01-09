'use client'

import { useState } from 'react'
import { parseResume } from '@/app/actions/parse-resume'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, CheckCircle, XCircle } from 'lucide-react'

export function ResumeUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    data?: any
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      
      // Auto-generate title from filename if not set
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.(pdf|docx)$/i, '')
        const autoTitle = nameWithoutExt
          .replace(/[_-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        setTitle(autoTitle)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setResult({
        success: false,
        message: 'Please select a file',
      })
      return
    }

    setIsUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (title) {
        formData.append('title', title)
      }

      const response = await parseResume(formData)

      if (response.success) {
        setResult({
          success: true,
          message: 'Resume uploaded and parsed successfully!',
          data: response.data,
        })
        
        // Reset form
        setFile(null)
        setTitle('')
        // Reset file input
        const fileInput = document.getElementById('resume-file') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        setResult({
          success: false,
          message: response.error || 'Failed to upload resume',
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Resume</CardTitle>
        <CardDescription>
          Upload a PDF or DOCX file to extract and store the resume text
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="resume-file">Resume File</Label>
            <Input
              id="resume-file"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {file && (
              <p className="text-sm text-zinc-500">
                Selected: {file.name} ({formatFileSize(file.size)})
              </p>
            )}
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="resume-title">Resume Title (Optional)</Label>
            <Input
              id="resume-title"
              type="text"
              placeholder="e.g., Senior Software Engineer Resume"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={!file || isUploading} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload and Parse Resume
              </>
            )}
          </Button>

          {/* Result Message */}
          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.message}
                {result.success && result.data && (
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>Resume ID:</strong> {result.data.resumeId}</p>
                    <p><strong>Title:</strong> {result.data.title}</p>
                    <p className="mt-2"><strong>Text Preview:</strong></p>
                    <pre className="mt-1 max-h-40 overflow-y-auto rounded bg-zinc-100 p-2 text-xs dark:bg-zinc-800">
                      {result.data.textPreview}
                    </pre>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </form>

        {/* File Requirements */}
        <div className="mt-6 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
          <h4 className="text-sm font-medium mb-2">File Requirements:</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
            <li>• Supported formats: PDF, DOCX</li>
            <li>• Maximum file size: 10MB</li>
            <li>• Text must be extractable (not image-based PDFs)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
