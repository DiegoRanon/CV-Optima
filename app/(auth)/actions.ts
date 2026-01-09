'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Type for form state
export type FormState = {
  error?: string
  errors?: Record<string, string[]>
  success?: boolean
  message?: string
}

export async function signup(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    // Parse and validate form data
    const rawFormData = {
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      fullName: formData.get('fullName'),
    }

    const validatedFields = signupSchema.safeParse(rawFormData)

    // Return validation errors
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        error: 'Please check the form for errors',
      }
    }

    const { email, password, fullName } = validatedFields.data

    // Create Supabase client
    const supabase = await createClient()

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes('User already registered')) {
        return {
          error: 'An account with this email already exists. Please sign in instead.',
        }
      }
      
      if (error.message.includes('Invalid email')) {
        return {
          error: 'Please provide a valid email address.',
        }
      }

      if (error.message.includes('Password')) {
        return {
          error: 'Password does not meet requirements. Please use a stronger password.',
        }
      }

      // Generic error
      return {
        error: error.message || 'An error occurred during signup. Please try again.',
      }
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      return {
        success: true,
        message: 'Please check your email to confirm your account before signing in.',
      }
    }

    // If we have a session, user is automatically signed in
    if (data.session) {
      redirect('/vault')
    }

    return {
      success: true,
      message: 'Account created successfully!',
    }
  } catch (error) {
    // Re-throw redirect errors (this is how Next.js redirect() works internally)
    if (error && typeof error === 'object' && 'digest' in error && 
        typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
      throw error
    }
    
    console.error('Signup error:', error)
    
    // Handle unexpected errors
    if (error instanceof Error) {
      return {
        error: error.message,
      }
    }

    return {
      error: 'An unexpected error occurred. Please try again later.',
    }
  }
}

export async function login(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    // Parse and validate form data
    const rawFormData = {
      email: formData.get('email'),
      password: formData.get('password'),
    }

    const validatedFields = loginSchema.safeParse(rawFormData)

    // Return validation errors
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        error: 'Please check the form for errors',
      }
    }

    const { email, password } = validatedFields.data

    // Create Supabase client
    const supabase = await createClient()

    // Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes('Invalid login credentials')) {
        return {
          error: 'Invalid email or password. Please try again.',
        }
      }

      if (error.message.includes('Email not confirmed')) {
        return {
          error: 'Please confirm your email address before signing in.',
        }
      }

      // Generic error
      return {
        error: error.message || 'An error occurred during login. Please try again.',
      }
    }

    if (!data.session) {
      return {
        error: 'Could not create session. Please try again.',
      }
    }

    // Successful login - redirect to dashboard
    redirect('/vault')
  } catch (error) {
    // Re-throw redirect errors (this is how Next.js redirect() works internally)
    if (error && typeof error === 'object' && 'digest' in error && 
        typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
      throw error
    }
    
    console.error('Login error:', error)
    
    // Handle unexpected errors
    if (error instanceof Error) {
      return {
        error: error.message,
      }
    }

    return {
      error: 'An unexpected error occurred. Please try again later.',
    }
  }
}

export async function signout() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Signout error:', error)
    // Still redirect even if signout fails
  }

  redirect('/login')
}
