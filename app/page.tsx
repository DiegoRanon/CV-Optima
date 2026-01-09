import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Simple Header for Landing */}
      <header className="border-b bg-white dark:bg-zinc-900">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">CV Optima</h1>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Optimize Your Resume for ATS
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
            Get past Applicant Tracking Systems and land more interviews with AI-powered resume analysis and optimization.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">Sign In</Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>ATS Analysis</CardTitle>
                <CardDescription>
                  See how your resume performs against ATS systems
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Resume Vault</CardTitle>
                <CardDescription>
                  Manage multiple resume versions in one place
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>AI Optimization</CardTitle>
                <CardDescription>
                  Get AI-powered suggestions to improve your resume
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
