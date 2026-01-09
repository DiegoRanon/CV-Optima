# Supabase Integration

This directory contains the Supabase client setup for CV-Optima, configured for Next.js 14 App Router.

## Files Overview

### `client.ts`
Browser-side Supabase client for use in Client Components. Automatically handles cookies for authentication.

**Usage:**
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

export default function MyComponent() {
  const supabase = createClient()
  // Use supabase client...
}
```

### `server.ts`
Server-side Supabase client for use in Server Components, Server Actions, and Route Handlers. Handles cookies on the server side.

**Usage:**
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function MyServerComponent() {
  const supabase = await createClient()
  // Use supabase client...
}
```

### `middleware.ts`
Supabase client for Next.js Middleware. Used to refresh user sessions automatically.

**Usage:**
This is imported in the root `middleware.ts` file and runs on every request.

### `test-connection.ts`
Utility function to test Supabase connectivity. Used in the test page.

## Setup Instructions

1. **Create a Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in project details and wait for creation

2. **Get API Credentials:**
   - Navigate to Project Settings → API
   - Copy your Project URL
   - Copy your anon/public key

3. **Configure Environment Variables:**
   Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Test Connection:**
   - Restart your development server
   - Navigate to `/test-supabase`
   - Verify the connection is successful

## Architecture

This setup follows Supabase's recommended pattern for Next.js App Router:

- **Client Components**: Use `@/lib/supabase/client`
- **Server Components**: Use `@/lib/supabase/server`
- **Middleware**: Automatically refreshes sessions via `middleware.ts`
- **Cookie-based Auth**: Sessions are stored in HTTP-only cookies for security

## Security Notes

- The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose in the browser
- Row Level Security (RLS) policies protect your data
- Never expose your `service_role` key in client-side code
- Always use RLS policies to secure your database tables

## Next Steps

After successful connection:
1. Create database tables (see `subtask 2.3`)
2. Implement RLS policies (see `subtask 2.4`)
3. Configure Storage bucket (see `subtask 2.5`)
