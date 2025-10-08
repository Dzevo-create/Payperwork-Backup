"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Hero() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <section className="relative pb-16 bg-pw-light">
      {/* Unified Hero Card with embedded Navigation */}
      <div className="relative w-full shadow-2xl rounded-b-3xl overflow-hidden bg-pw-light">
        {/* Architecture Background Video */}
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/Video/kling_20251008_Image_to_Video_a_small_pu_4570_0.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Gradient Blobs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-pw-accent/30 to-transparent rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-3xl opacity-15" />

        {/* Navigation - Embedded at top of card */}
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
                    className="block w-full px-8 py-2.5 text-center bg-pw-accent text-pw-black text-sm font-medium rounded-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Jetzt starten
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 w-full py-32 pb-20 px-8 lg:px-16">
              <div className="max-w-none">
                <div className="grid lg:grid-cols-[1fr_auto] gap-16 items-start">
                  {/* Left - Big Slogan, Description & CTA */}
                  <div className="flex flex-col h-full">
                    <h2 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-light text-white leading-[1.1] tracking-tight">
                      Denken Sie in<br /><span className="font-normal text-pw-accent">Bildern</span>
                    </h2>

                    <div className="mt-auto pt-4 space-y-4">
                      <p className="text-xl lg:text-2xl text-white/50 leading-relaxed max-w-3xl">
                        KI-gestützte Visualisierung für kreative Profis. Transformieren Sie Ihre Ideen in atemberaubende Realität – automatisch, präzise, revolutionär.
                      </p>

                      {/* CTA Buttons */}
                      <div className="flex flex-wrap items-center gap-3">
                        <Link href="/get-started">
                          <button className="group px-8 py-3 bg-white text-pw-black text-base font-semibold rounded-full hover:bg-white/90 transition-all duration-300">
                            Jetzt kostenlos testen
                          </button>
                        </Link>
                        <Link href="#workflows">
                          <button className="px-8 py-3 bg-white/5 text-white text-base font-medium rounded-full border border-white/20 hover:border-white/30 hover:bg-white/10 backdrop-blur-sm transition-all duration-300">
                            Workflows ansehen
                          </button>
                        </Link>
                      </div>

                      {/* Social Proof - subtle trust indicator */}
                      <div className="flex flex-wrap items-center gap-6 text-white/30 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-pw-accent/50 rounded-full" />
                          <span>500+ Projekte</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-pw-accent/50" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span>4.9/5 Rating</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right - Video Showcase */}
                  <div className="relative w-full lg:w-[600px] xl:w-[700px] max-w-full">
                    {/* Glow Effect */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-pw-accent/20 via-purple-500/10 to-pw-accent/20 rounded-3xl blur-2xl opacity-50" />

                    {/* Main Card */}
                    <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-3 sm:p-4 lg:p-6 overflow-hidden">
                      {/* Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                      {/* Video Container */}
                      <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10">
                        <video
                          autoPlay
                          loop
                          playsInline
                          muted
                          preload="metadata"
                          controls
                          className="w-full h-full object-cover"
                        >
                          <source src="/Video/Payperwork schnitt_1-2.mp4" type="video/mp4" />
                          Ihr Browser unterstützt das Video-Tag nicht.
                        </video>

                        {/* Subtle Gradient Overlay for Luxus-Look */}
                        <div className="absolute inset-0 bg-gradient-to-t from-pw-black/20 via-transparent to-transparent pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Cards Below - Full Width */}
                <div className="mt-20 lg:mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  {/* Card 1 - Geschwindigkeit */}
                  <div className="relative group">
                    <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-xl border border-white/10 p-5 overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]">
                      <div className="relative">
                        <div className="w-10 h-10 bg-pw-accent/10 rounded-lg flex items-center justify-center mb-3">
                          <svg className="w-5 h-5 text-pw-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h3 className="text-base font-medium text-white mb-1">Blitzschnell</h3>
                        <p className="text-sm text-white/50">Ergebnisse in Sekunden statt Stunden</p>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 - KI-Power */}
                  <div className="relative group">
                    <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-xl border border-white/10 p-5 overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]">
                      <div className="relative">
                        <div className="w-10 h-10 bg-pw-accent/10 rounded-lg flex items-center justify-center mb-3">
                          <svg className="w-5 h-5 text-pw-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <h3 className="text-base font-medium text-white mb-1">KI-gestützt</h3>
                        <p className="text-sm text-white/50">Modernste AI-Technologie</p>
                      </div>
                    </div>
                  </div>

                  {/* Card 3 - Einfachheit */}
                  <div className="relative group">
                    <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-xl border border-white/10 p-5 overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]">
                      <div className="relative">
                        <div className="w-10 h-10 bg-pw-accent/10 rounded-lg flex items-center justify-center mb-3">
                          <svg className="w-5 h-5 text-pw-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                          </svg>
                        </div>
                        <h3 className="text-base font-medium text-white mb-1">Intuitiv</h3>
                        <p className="text-sm text-white/50">Keine Einarbeitung nötig</p>
                      </div>
                    </div>
                  </div>

                  {/* Card 4 - Qualität */}
                  <div className="relative group">
                    <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-xl border border-white/10 p-5 overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]">
                      <div className="relative">
                        <div className="w-10 h-10 bg-pw-accent/10 rounded-lg flex items-center justify-center mb-3">
                          <svg className="w-5 h-5 text-pw-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                        <h3 className="text-base font-medium text-white mb-1">Präzise</h3>
                        <p className="text-sm text-white/50">Fotorealistische Ergebnisse</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
        </div>

      </div>
    </section>
  );
}
