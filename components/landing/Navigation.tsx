"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50
        transition-all duration-300
        ${isScrolled ? 'pt-2 sm:pt-3 lg:pt-4' : 'pt-8'}
      `}
    >
      <div className="mx-auto px-2 sm:px-3 lg:px-4">
        {/* Minimal Dark Header matching page sections */}
        <div
          className={`
            relative
            ${isScrolled
              ? 'bg-[#242424]/98'
              : 'bg-[#242424]/60'
            }
            backdrop-blur-sm
            rounded-2xl
            border border-white/10
            transition-all duration-300
          `}
        >
          <div className="px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo with white version */}
              <Link
                href="/"
                className="flex items-center transition-opacity duration-300 hover:opacity-70"
              >
                <Image
                  src="/images/Logo/logo-white.png"
                  alt="Payperwork Logo"
                  width={140}
                  height={40}
                  className="h-7 w-auto"
                  priority
                />
              </Link>

              {/* Center Menu - Simple & Clean */}
              <div className="hidden md:flex items-center gap-8">
                <Link
                  href="#workflows"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Workflows
                </Link>
                <Link
                  href="#pricing"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="#beispiele"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Beispiele
                </Link>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-3">
                <Link href="/get-started" className="hidden md:block">
                  <button className="px-6 py-2 bg-pw-accent text-pw-black text-sm font-medium rounded-full hover:bg-pw-accent/90 transition-all">
                    Jetzt starten
                  </button>
                </Link>

                {/* Mobile Menu Button */}
                <button
                  aria-label={isMobileMenuOpen ? "Menü schließen" : "Menü öffnen"}
                  className="md:hidden w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden border-t border-white/10 py-6 space-y-4">
                <Link
                  href="#workflows"
                  className="block text-sm text-white/70 hover:text-white transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Workflows
                </Link>
                <Link
                  href="#pricing"
                  className="block text-sm text-white/70 hover:text-white transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="#beispiele"
                  className="block text-sm text-white/70 hover:text-white transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Beispiele
                </Link>
                <div className="pt-4 border-t border-white/10">
                  <Link
                    href="/get-started"
                    className="block w-full px-6 py-2 text-center bg-pw-accent text-pw-black text-sm font-medium rounded-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Jetzt starten
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
