"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function LandingNav() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  return (
    <nav className="border-pw-black/10 fixed left-0 right-0 top-0 z-50 border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-pw-black">Payperwork</div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="#workflows"
              className="text-pw-black/70 text-sm font-medium transition-colors hover:text-pw-black"
            >
              Workflows
            </Link>
            <Link
              href="#pricing"
              className="text-pw-black/70 text-sm font-medium transition-colors hover:text-pw-black"
            >
              Preise
            </Link>
            <Link
              href="#platform"
              className="text-pw-black/70 text-sm font-medium transition-colors hover:text-pw-black"
            >
              Plattform
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="bg-pw-black/10 h-10 w-10 animate-pulse rounded-full" />
            ) : user ? (
              // User is logged in - show "Zur App" button
              <Button
                onClick={() => router.push("/chat")}
                className="hover:bg-pw-accent/90 bg-pw-accent"
              >
                Zur App
              </Button>
            ) : (
              // User is not logged in - show Sign up & Log in
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/auth/login")}
                  className="text-sm font-medium"
                >
                  Log in
                </Button>
                <Button
                  onClick={() => router.push("/auth/signup")}
                  className="hover:bg-pw-accent/90 bg-pw-accent"
                >
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
