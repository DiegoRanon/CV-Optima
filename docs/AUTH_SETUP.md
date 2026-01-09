# Authentication Setup Guide

This document explains the authentication implementation for CV Optima.

## Overview

The authentication system uses **Supabase Auth** with server actions, providing:
- Secure server-side authentication
- Email/password signup with validation
- Email verification
- Login with proper error handling
- Session management

## Files Created/Modified

### 1. Server Actions (`app/(auth)/actions.ts`)
Contains three main server actions:

#### `signup()`
- Validates user input with Zod schema
- Enforces password requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- Creates user account in Supabase
- Stores user's full name in metadata
- Handles email confirmation flow
- Comprehensive error handling for common issues

#### `login()`
- Validates credentials
- Signs in user with Supabase
- Creates session
- Redirects to dashboard on success
- Provides specific error messages for common issues

#### `signout()`
- Clears user session
- Redirects to login page

### 2. Signup Page (`app/(auth)/signup/page.tsx`)
A complete signup form with:
- Full name, email, password, and confirm password fields
- Real-time validation errors
- Show/hide password toggle
- Loading states during submission
- Success and error message display
- Link to login page

### 3. Login Page (`app/(auth)/login/page.tsx`)
A complete login form with:
- Email and password fields
- Show/hide password toggle
- Loading states during submission
- Error message display
- Forgot password link (placeholder)
- Link to signup page
- URL error handling (for callback errors)

### 4. Auth Callback (`app/auth/callback/route.ts`)
Handles email verification:
- Exchanges verification code for session
- Redirects to dashboard on success
- Provides error messages on failure
- Handles edge cases

## Environment Variables Required

Create a `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key

# Site URL (for email redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Change in production
```

Get these values from your Supabase project settings:
https://app.supabase.com/project/_/settings/api

## Features

### ✅ Input Validation
- Client-side validation with HTML5
- Server-side validation with Zod
- Password strength requirements
- Email format validation
- Password confirmation matching

### ✅ Security
- Server actions for secure authentication
- Password hashing by Supabase
- Session management with cookies
- CSRF protection built into Next.js
- Environment variables for sensitive data

### ✅ User Experience
- Clear error messages
- Loading states
- Success confirmations
- Show/hide password toggles
- Responsive design
- Accessible forms

### ✅ Error Handling
- Network errors
- Invalid credentials
- Duplicate email
- Email not confirmed
- Validation errors
- Unexpected errors

## User Flow

### Signup Flow
1. User fills out signup form
2. Form validates input client-side
3. Server action validates input with Zod
4. Supabase creates user account
5. Verification email sent (if enabled in Supabase)
6. User redirects or sees success message
7. User confirms email via link
8. Callback handler verifies code
9. User redirected to dashboard

### Login Flow
1. User enters credentials
2. Form validates input
3. Server action authenticates with Supabase
4. Session created
5. User redirected to dashboard

### Email Verification
1. User clicks link in email
2. Callback route receives code
3. Code exchanged for session
4. User redirected to dashboard
5. Errors handled gracefully

## Supabase Configuration

Ensure your Supabase project has:

1. **Email Auth Enabled**
   - Go to Authentication > Providers
   - Ensure Email is enabled

2. **Email Confirmation** (Optional)
   - Go to Authentication > Settings
   - Configure "Enable email confirmations" based on your needs

3. **Email Templates** (Recommended)
   - Go to Authentication > Email Templates
   - Customize confirmation email
   - Set redirect URL to: `{{ .SiteURL }}/auth/callback`

4. **Site URL**
   - Go to Authentication > URL Configuration
   - Set Site URL to your domain (e.g., `http://localhost:3000`)
   - Add redirect URLs for auth callback

## Testing

### Test Signup
1. Navigate to `/signup`
2. Fill out form with valid data
3. Submit form
4. Check for success message or email
5. Verify email (if confirmation enabled)
6. Check redirect to dashboard

### Test Login
1. Navigate to `/login`
2. Enter valid credentials
3. Submit form
4. Verify redirect to dashboard
5. Check session persistence

### Test Validation
- Try invalid email formats
- Try weak passwords
- Try mismatched passwords
- Try duplicate email
- Try invalid credentials

### Test Error Cases
- Try signing up with existing email
- Try logging in with wrong password
- Try unconfirmed email (if enabled)
- Test network errors (offline)

## Common Issues

### "Invalid email or password"
- Check credentials are correct
- Verify email is confirmed (if required)
- Check Supabase Auth is enabled

### Email not received
- Check spam folder
- Verify email provider settings in Supabase
- Check email templates are configured

### Redirect not working
- Verify `NEXT_PUBLIC_SITE_URL` is set
- Check redirect URLs in Supabase settings
- Verify callback route is working

### Session not persisting
- Check cookie settings
- Verify middleware configuration
- Check Supabase client setup

## Next Steps

Consider implementing:
- [ ] Forgot password flow
- [ ] Social authentication (Google, GitHub, etc.)
- [ ] Two-factor authentication
- [ ] Password reset
- [ ] Email change
- [ ] Profile management
- [ ] Session timeout handling
- [ ] Remember me functionality

## Security Considerations

✅ **Implemented:**
- Server-side validation
- Password strength requirements
- Secure session handling
- HTTPS in production (recommended)
- Environment variable protection

⚠️ **Recommended:**
- Enable rate limiting in Supabase
- Add CAPTCHA for signup/login
- Implement account lockout after failed attempts
- Add email verification requirement
- Monitor authentication logs
- Set up alerts for suspicious activity

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs/guides/auth
2. Review Next.js App Router docs: https://nextjs.org/docs
3. Check server action documentation: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
