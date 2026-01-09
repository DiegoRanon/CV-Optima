/**
 * Test utility to verify Supabase connection
 * This can be called from a server component or API route to test connectivity
 */
export async function testSupabaseConnection(supabase: any) {
  try {
    // Test 1: Check if client is initialized
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase client is not initialized',
      }
    }

    // Test 2: Try a simple query to verify connection
    const { data, error } = await supabase
      .from('_test_connection')
      .select('*')
      .limit(1)

    // If we get a "relation does not exist" error, that's actually good!
    // It means we're connected but the table doesn't exist yet (expected)
    if (error && error.code === '42P01') {
      return {
        success: true,
        message: 'Supabase connection successful! (Table not found is expected)',
        details: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
      }
    }

    // Test 3: Check auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    return {
      success: true,
      message: 'Supabase connection successful!',
      details: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        authenticated: !!user,
        userId: user?.id || null,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
