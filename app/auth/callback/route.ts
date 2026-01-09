import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/vault'

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent('Could not verify email. Please try again.')}`, request.url)
        )
      }

      // Successful verification - redirect to the specified page or vault
      return NextResponse.redirect(new URL(next, request.url))
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('An unexpected error occurred.')}`, request.url)
      )
    }
  }

  // No code present - redirect to login
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent('Invalid verification link.')}`, request.url)
  )
}
