import { createClient } from '@/lib/supabase/server'
import { testSupabaseConnection } from '@/lib/supabase/test-connection'
import { getEnvStatusMessage } from '@/lib/supabase/verify-env'

/**
 * Test page to verify Supabase connection
 * Navigate to /test-supabase to check if Supabase is properly configured
 */
export default async function TestSupabasePage() {
  const envStatus = getEnvStatusMessage()
  const supabase = await createClient()
  const result = await testSupabaseConnection(supabase)

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
      
      {/* Environment Variables Status */}
      <div className={`p-6 rounded-lg border-2 mb-6 ${
        envStatus.status === 'success' 
          ? 'bg-green-50 border-green-500' 
          : 'bg-yellow-50 border-yellow-500'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-4 h-4 rounded-full ${
            envStatus.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
          <h2 className="text-xl font-semibold">Environment Variables</h2>
        </div>
        <p className="mb-4 text-gray-700">{envStatus.message}</p>
        {envStatus.issues && envStatus.issues.length > 0 && (
          <ul className="list-disc list-inside text-red-600 mb-4">
            {envStatus.issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        )}
        {envStatus.details && (
          <div className="mt-4 p-4 bg-white rounded border">
            <p className="font-semibold mb-2">Configuration Status:</p>
            <pre className="text-sm font-mono overflow-auto">
              {JSON.stringify(envStatus.details, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Connection Test */}
      <div className={`p-6 rounded-lg border-2 ${
        result.success 
          ? 'bg-green-50 border-green-500' 
          : 'bg-red-50 border-red-500'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-4 h-4 rounded-full ${
            result.success ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <h2 className="text-xl font-semibold">
            {result.success ? '✅ Connection Successful' : '❌ Connection Failed'}
          </h2>
        </div>

        {result.message && (
          <p className="mb-4 text-gray-700">{result.message}</p>
        )}

        {result.error && (
          <div className="mb-4">
            <p className="font-semibold text-red-700">Error:</p>
            <p className="text-red-600 font-mono text-sm">{result.error}</p>
          </div>
        )}

        {result.details && (
          <div className="mt-4 p-4 bg-white rounded border">
            <p className="font-semibold mb-2">Connection Details:</p>
            <pre className="text-sm font-mono overflow-auto">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold mb-2">📝 Setup Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Create a Supabase project at <a href="https://supabase.com" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">supabase.com</a></li>
          <li>Go to Project Settings → API</li>
          <li>Copy your Project URL and anon/public key</li>
          <li>Create a <code className="bg-gray-200 px-1 rounded">.env.local</code> file in the project root</li>
          <li>Add the following variables:
            <pre className="mt-2 p-2 bg-white rounded text-xs font-mono">
{`NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
            </pre>
          </li>
          <li>Restart the development server</li>
        </ol>
      </div>

      <div className="mt-4 text-center">
        <a 
          href="/" 
          className="text-blue-600 hover:underline"
        >
          ← Back to Home
        </a>
      </div>
    </div>
  )
}
