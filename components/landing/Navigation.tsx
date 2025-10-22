"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  return (
    <nav className="relative z-50 border-b border-white/5">
      <div className="px-6 py-4 lg:px-10">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center transition-opacity duration-300 hover:opacity-70"
          >
            <Image
              src="/images/Logo/logo-white.png"
              alt="Payperwork Logo"
              width={160}
              height={45}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Center Menu */}
          <div className="hidden items-center gap-12 md:flex">
            <Link
              href="#workflows"
              className="text-sm text-white transition-colors duration-300 hover:text-white/80"
            >
              Workflows
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-white transition-colors duration-300 hover:text-white/80"
            >
              Pricing
            </Link>
            <Link
              href="#beispiele"
              className="text-sm text-white transition-colors duration-300 hover:text-white/80"
            >
              Beispiele
            </Link>
            <Link
              href="/chat"
              className="text-sm text-white transition-colors duration-300 hover:text-white/80"
            >
              Chat
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Desktop Auth Buttons */}
            <div className="hidden items-center gap-3 md:flex">
              {isLoading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : user ? (
                <>
                  <button
                    onClick={() => router.push("/chat")}
                    className="rounded-full bg-pw-accent px-8 py-2.5 text-sm font-medium text-pw-black transition-all duration-300 hover:bg-white"
                  >
                    Zur App
                  </button>
                  <button
                    onClick={() => router.push("/chat")}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-all duration-300 hover:bg-white/20"
                    aria-label="Profil"
                  >
                    <User className="h-5 w-5 text-white" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push("/auth/login")}
                    className="rounded-full px-6 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white/10"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => router.push("/auth/signup")}
                    className="rounded-full bg-pw-accent px-8 py-2.5 text-sm font-medium text-pw-black transition-all duration-300 hover:bg-white"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              aria-label={isMobileMenuOpen ? "Menü schließen" : "Menü öffnen"}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mt-4 space-y-4 border-t border-white/10 pt-6 md:hidden">
            <Link
              href="#workflows"
              className="block py-2 text-sm text-white transition-colors hover:text-pw-accent"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Workflows
            </Link>
            <Link
              href="#pricing"
              className="block py-2 text-sm text-white transition-colors hover:text-pw-accent"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="#beispiele"
              className="block py-2 text-sm text-white transition-colors hover:text-pw-accent"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Beispiele
            </Link>
            <Link
              href="/chat"
              className="block py-2 text-sm text-white transition-colors hover:text-pw-accent"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Chat
            </Link>

            {/* Mobile Auth Buttons */}
            <div className="space-y-3 pt-4">
              {isLoading ? (
                <div className="flex justify-center py-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                </div>
              ) : user ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/chat");
                  }}
                  className="w-full rounded-full bg-pw-accent px-8 py-2.5 text-sm font-medium text-pw-black transition-all duration-300 hover:bg-white"
                >
                  Zur App
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push("/auth/login");
                    }}
                    className="w-full rounded-full border border-white/20 px-6 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white/10"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push("/auth/signup");
                    }}
                    className="w-full rounded-full bg-pw-accent px-8 py-2.5 text-sm font-medium text-pw-black transition-all duration-300 hover:bg-white"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
