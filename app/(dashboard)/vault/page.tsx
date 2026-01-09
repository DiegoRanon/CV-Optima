import { ResumeUploadForm } from './_components/resume-upload-form'

export default function VaultPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Resume Vault</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Manage your resume versions
        </p>
      </div>
      
      <div className="grid gap-6">
        <ResumeUploadForm />
        
        {/* Resume list will be added in task 5 */}
        <div className="rounded-lg border border-dashed p-8 text-center text-zinc-500">
          Resume list coming soon...
        </div>
      </div>
    </div>
  );
}
