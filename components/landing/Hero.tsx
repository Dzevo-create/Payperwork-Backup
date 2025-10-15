"use client";

import Link from "next/link";
import { VideoBackground } from "./VideoBackground";
import { HeroShowcase } from "./HeroShowcase";
import { FeatureCards } from "./FeatureCards";
import { Navigation } from "./Navigation";

/**
 * Hero Component
 * Main landing page hero section with embedded navigation, video background, and CTA
 */

export function Hero() {
  return (
    <section className="relative pb-16 bg-pw-light">
      {/* Unified Hero Card with embedded Navigation */}
      <div className="relative w-full shadow-2xl rounded-b-3xl overflow-hidden bg-pw-light">
        {/* Navigation */}
        <Navigation />

        {/* Architecture Background Video */}
        <VideoBackground />

        {/* Gradient Blobs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-pw-accent/30 to-transparent rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-3xl opacity-15" />

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
                    <Link href="/chat">
                      <button className="group px-8 py-3 bg-white text-pw-black text-base font-semibold rounded-full hover:bg-white/90 transition-all duration-300">
                        Zum Chat
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
              <HeroShowcase />
            </div>

            {/* Feature Cards Below - Full Width */}
            <FeatureCards />
          </div>
        </div>
      </div>
    </section>
  );
}
