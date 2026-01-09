import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your CV Optima account"
    >
      <div className="space-y-4">
        {/* Login form will be added in authentication task */}
        <p className="text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
