import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="mb-8 text-center">
        <Link href="/" className="text-3xl font-bold hover:opacity-80 transition-opacity">
          CV Optima
        </Link>
      </div>
      <div className="w-full max-w-md p-4">
        {children}
      </div>
    </div>
  );
}
