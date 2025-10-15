"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="relative z-50 border-b border-white/5">
      <div className="px-6 lg:px-10 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center transition-opacity duration-300 hover:opacity-70">
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
          <div className="hidden md:flex items-center gap-12">
            <Link href="#workflows" className="text-sm text-white hover:text-white/80 transition-colors duration-300">
              Workflows
            </Link>
            <Link href="#pricing" className="text-sm text-white hover:text-white/80 transition-colors duration-300">
              Pricing
            </Link>
            <Link href="#beispiele" className="text-sm text-white hover:text-white/80 transition-colors duration-300">
              Beispiele
            </Link>
            <Link href="/chat" className="text-sm text-white hover:text-white/80 transition-colors duration-300">
              Chat
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link href="/chat" className="hidden md:block">
              <button className="px-8 py-2.5 bg-pw-accent text-pw-black text-sm font-medium rounded-full hover:bg-white transition-all duration-300">
                Zum Chat
              </button>
            </Link>

            {/* Mobile Menu Button */}
            <button
              aria-label={isMobileMenuOpen ? "Menü schließen" : "Menü öffnen"}
              className="md:hidden w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 mt-4 pt-6 space-y-4">
            <Link
              href="#workflows"
              className="block text-sm text-white hover:text-pw-accent transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Workflows
            </Link>
            <Link
              href="#pricing"
              className="block text-sm text-white hover:text-pw-accent transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="#beispiele"
              className="block text-sm text-white hover:text-pw-accent transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Beispiele
            </Link>
            <Link
              href="/chat"
              className="block text-sm text-white hover:text-pw-accent transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Chat
            </Link>
            <Link href="/chat" className="block pt-4" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="w-full px-8 py-2.5 bg-pw-accent text-pw-black text-sm font-medium rounded-full hover:bg-white transition-all duration-300">
                Zum Chat
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
