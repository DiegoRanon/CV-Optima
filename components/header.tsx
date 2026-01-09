"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signout } from "@/app/(auth)/actions";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: "/vault", label: "Vault" },
    { href: "/analyze", label: "Analyze" },
  ];

  const handleSignOut = async () => {
    await signout();
  };

  return (
    <header className="border-b bg-white dark:bg-zinc-900">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
          CV Optima
        </Link>
        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "transition-colors",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  {item.label}
                </Button>
              </Link>
            );
          })}
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </nav>
      </div>
    </header>
  );
}
