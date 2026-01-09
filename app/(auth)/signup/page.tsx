'use client'

import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { signup, type FormState } from "../actions";
import { useEffect, useState } from "react";

const initialState: FormState = {
  error: undefined,
  errors: undefined,
  success: false,
  message: undefined,
}

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      className="w-full" 
      disabled={pending}
    >
      {pending ? "Creating account..." : "Create account"}
    </Button>
  )
}

export default function SignupPage() {
  const [state, formAction] = useActionState(signup, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (state?.success && state?.message) {
      // Show success message
      console.log('Success:', state.message)
    }
  }, [state])

  return (
    <AuthCard
      title="Create an account"
      description="Get started with CV Optima"
    >
      <form action={formAction} className="space-y-4">
        {/* Success Message */}
        {state?.success && state?.message && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-800">{state.message}</p>
          </div>
        )}

        {/* General Error */}
        {state?.error && !state?.success && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{state.error}</p>
          </div>
        )}

        {/* Full Name Field */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="John Doe"
            required
            className={state?.errors?.fullName ? "border-red-500" : ""}
          />
          {state?.errors?.fullName && (
            <p className="text-sm text-red-600">{state.errors.fullName[0]}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            className={state?.errors?.email ? "border-red-500" : ""}
          />
          {state?.errors?.email && (
            <p className="text-sm text-red-600">{state.errors.email[0]}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              className={state?.errors?.password ? "border-red-500" : ""}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 hover:text-zinc-700"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {state?.errors?.password && (
            <p className="text-sm text-red-600">{state.errors.password[0]}</p>
          )}
          <p className="text-xs text-zinc-500">
            Must be at least 8 characters with uppercase, lowercase, and numbers
          </p>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              className={state?.errors?.confirmPassword ? "border-red-500" : ""}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 hover:text-zinc-700"
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
          {state?.errors?.confirmPassword && (
            <p className="text-sm text-red-600">{state.errors.confirmPassword[0]}</p>
          )}
        </div>

        {/* Submit Button */}
        <SubmitButton />

        {/* Sign In Link */}
        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
