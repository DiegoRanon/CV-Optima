import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SignupPage() {
  return (
    <AuthCard
      title="Create an account"
      description="Get started with CV Optima"
    >
      <div className="space-y-4">
        {/* Signup form will be added in authentication task */}
        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
