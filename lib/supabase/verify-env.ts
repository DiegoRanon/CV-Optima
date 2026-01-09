/**
 * Utility to verify Supabase environment variables are properly configured
 * This can be used during development to ensure setup is correct
 */
export function verifySupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const results = {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    urlValid: false,
    urlFormat: '',
    keyFormat: '',
    allValid: false,
  }

  // Validate URL format
  if (supabaseUrl) {
    results.urlValid = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co')
    results.urlFormat = supabaseUrl.substring(0, 30) + '...'
  }

  // Validate key format (should start with 'eyJ')
  if (supabaseAnonKey) {
    results.keyFormat = supabaseAnonKey.startsWith('eyJ') 
      ? `${supabaseAnonKey.substring(0, 20)}...` 
      : 'Invalid format'
  }

  results.allValid = results.hasUrl && results.hasAnonKey && results.urlValid

  return results
}

/**
 * Get a formatted status message for environment variables
 */
export function getEnvStatusMessage() {
  const results = verifySupabaseEnv()

  if (results.allValid) {
    return {
      status: 'success',
      message: '✅ All Supabase environment variables are properly configured',
      details: results,
    }
  }

  const issues: string[] = []
  if (!results.hasUrl) issues.push('Missing NEXT_PUBLIC_SUPABASE_URL')
  if (!results.hasAnonKey) issues.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (results.hasUrl && !results.urlValid) issues.push('NEXT_PUBLIC_SUPABASE_URL has invalid format')

  return {
    status: 'error',
    message: '❌ Supabase environment configuration issues detected',
    issues,
    details: results,
  }
}
